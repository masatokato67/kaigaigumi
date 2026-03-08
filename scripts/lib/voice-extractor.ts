/**
 * SNS投稿から現地の声を抽出するユーティリティ
 * X(Twitter) oEmbed API / Reddit JSON API / 汎用フェッチ対応
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../.env.local") });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY が .env.local に設定されていません");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface ExtractedVoice {
  username: string;
  platform: string; // "X", "Reddit", "Other"
  originalText: string;
  translatedText: string;
  languageCode: string;
  role: string; // "サポーター", "ジャーナリスト", "アナリスト"
  roleKey: "supporter" | "journalist" | "analyst";
}

/**
 * X(Twitter) oEmbed APIで投稿テキストを取得
 */
async function fetchXPost(url: string): Promise<{ username: string; text: string } | null> {
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;

    const data = (await res.json()) as { html: string; author_name: string; author_url: string };

    // HTMLからテキストを抽出
    const text = data.html
      .replace(/<br>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&mdash;/g, "—")
      .replace(/\s+/g, " ")
      .trim();

    // 末尾の "— Author (@handle) Date" を除去
    const cleanText = text.replace(/\s*—\s*[^(]+\(@\w+\)\s*\w+\s*\d+,\s*\d+$/, "").trim();

    return {
      username: `@${data.author_name}`,
      text: cleanText,
    };
  } catch {
    return null;
  }
}

/**
 * Reddit JSON APIで投稿/コメントテキストを取得
 */
async function fetchRedditPost(url: string): Promise<{ username: string; text: string } | null> {
  try {
    // URLの末尾のスラッシュを正規化して.jsonを追加
    const cleanUrl = url.replace(/\/+$/, "");
    const jsonUrl = `${cleanUrl}.json`;

    const res = await fetch(jsonUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KaigaigumiBot/1.0)",
      },
    });
    if (!res.ok) return null;

    const data = await res.json();

    // Redditのレスポンスは配列形式
    if (Array.isArray(data) && data.length > 0) {
      const post = data[0]?.data?.children?.[0]?.data;
      if (post) {
        return {
          username: `u/${post.author}`,
          text: post.selftext || post.title || "",
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * URLからSNS投稿を取得（プラットフォーム自動判定）
 */
async function fetchSnsPost(url: string): Promise<{
  username: string;
  text: string;
  platform: string;
} | null> {
  // X / Twitter
  if (url.includes("x.com") || url.includes("twitter.com")) {
    const result = await fetchXPost(url);
    if (result) return { ...result, platform: "X" };
    console.log("    ⚠️ X oEmbed取得失敗、汎用フェッチを試行...");
  }

  // Reddit
  if (url.includes("reddit.com")) {
    const result = await fetchRedditPost(url);
    if (result) return { ...result, platform: "Reddit" };
  }

  // 汎用フェッチ（その他のプラットフォーム）
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html",
      },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);

    return { username: "不明", text, platform: "Web" };
  } catch {
    return null;
  }
}

/**
 * Gemini APIで投稿テキストを翻訳・分類
 */
export async function extractVoice(
  url: string,
  playerNameJa: string,
  playerNameEn: string
): Promise<ExtractedVoice> {
  console.log("  [FETCH] SNS投稿を取得中...");
  const post = await fetchSnsPost(url);

  if (!post || !post.text) {
    throw new Error("投稿の取得に失敗しました");
  }

  console.log(`  [OK] ${post.platform} / ${post.username}`);
  console.log("  [AI] Gemini APIで翻訳・分類中...");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are analyzing a social media post about a football/soccer player.

Player: ${playerNameEn} (${playerNameJa})
Platform: ${post.platform}
Username: ${post.username}
Post URL: ${url}

Post text:
${post.text.slice(0, 3000)}

Extract and respond with ONLY a valid JSON object (no markdown):

{
  "originalText": "The relevant part of the post about the player. If the post is long, extract only the 1-3 most relevant sentences. Keep in the original language.",
  "translatedText": "Japanese translation of the extracted text",
  "languageCode": "Language code (EN, ES, DE, FR, IT, NL, PT, JA, etc.)",
  "roleKey": "supporter or journalist or analyst",
  "role": "Japanese role name: サポーター or ジャーナリスト or アナリスト"
}

Rules for roleKey:
- "supporter": Fan accounts, casual users, supporter groups
- "journalist": Verified journalists, news outlets, media accounts
- "analyst": Tactical/statistical analysis accounts, pundits`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1].trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Gemini応答のパースに失敗:\n${responseText}`);
  }

  return {
    username: post.username,
    platform: post.platform,
    originalText: String(parsed.originalText || post.text.slice(0, 200)),
    translatedText: String(parsed.translatedText || ""),
    languageCode: String(parsed.languageCode || "EN"),
    role: String(parsed.role || "サポーター"),
    roleKey: (parsed.roleKey as "supporter" | "journalist" | "analyst") || "supporter",
  };
}
