/**
 * X(Twitter)投稿からスレッドデータを抽出するユーティリティ
 * oEmbed API → fxtwitter.com API フォールバック
 * Gemini APIで翻訳 + リプライ生成
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

export interface ExtractedThread {
  username: string;
  verified: boolean;
  originalText: string;
  translatedText: string;
  languageCode: string;
  likes: number;
  retweets: number;
  replies: {
    username: string;
    languageCode: string;
    originalText: string;
    translatedText: string;
    likes: number;
  }[];
}

interface FxTwitterResponse {
  code: number;
  message: string;
  tweet?: {
    text: string;
    author: {
      name: string;
      screen_name: string;
      verified?: boolean;
    };
    likes: number;
    retweets: number;
    lang?: string;
  };
}

/**
 * fxtwitter.com APIでX投稿を取得
 */
async function fetchViaFxTwitter(
  url: string
): Promise<{ username: string; text: string; verified: boolean; likes: number; retweets: number } | null> {
  try {
    // URLからツイートIDを抽出
    const match = url.match(/(?:x\.com|twitter\.com)\/(\w+)\/status\/(\d+)/);
    if (!match) return null;

    const [, screenName, tweetId] = match;
    const apiUrl = `https://api.fxtwitter.com/${screenName}/status/${tweetId}`;

    const res = await fetch(apiUrl, {
      headers: { "User-Agent": "KaigaigumiBot/1.0" },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as FxTwitterResponse;
    if (!data.tweet) return null;

    return {
      username: `@${data.tweet.author.screen_name}`,
      text: data.tweet.text,
      verified: data.tweet.author.verified ?? false,
      likes: data.tweet.likes || 0,
      retweets: data.tweet.retweets || 0,
    };
  } catch {
    return null;
  }
}

/**
 * oEmbed APIでX投稿を取得
 */
async function fetchViaOEmbed(
  url: string
): Promise<{ username: string; text: string } | null> {
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("json")) return null;

    const data = (await res.json()) as { html: string; author_name: string };

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
    const cleanText = text
      .replace(/\s*—\s*[^(]+\(@\w+\)\s*\w+\s*\d+,\s*\d+$/, "")
      .trim();

    return {
      username: `@${data.author_name}`,
      text: cleanText,
    };
  } catch {
    return null;
  }
}

/**
 * X投稿を取得（fxtwitter優先、oEmbedフォールバック）
 */
async function fetchXPost(url: string): Promise<{
  username: string;
  text: string;
  verified: boolean;
  likes: number;
  retweets: number;
} | null> {
  // fxtwitter APIを試行（メタデータも取得可能）
  console.log("    fxtwitter APIを試行...");
  const fxResult = await fetchViaFxTwitter(url);
  if (fxResult) return fxResult;

  // oEmbed APIにフォールバック
  console.log("    oEmbed APIにフォールバック...");
  const oembedResult = await fetchViaOEmbed(url);
  if (oembedResult) {
    return {
      ...oembedResult,
      verified: false,
      likes: 0,
      retweets: 0,
    };
  }

  return null;
}

/**
 * X投稿URLからスレッドデータを抽出
 * Gemini APIで翻訳 + リプライ自動生成
 */
export async function extractThread(
  url: string,
  playerNameJa: string,
  playerNameEn: string
): Promise<ExtractedThread> {
  console.log("  [FETCH] X投稿を取得中...");
  const post = await fetchXPost(url);

  if (!post || !post.text) {
    throw new Error(`X投稿の取得に失敗: ${url}`);
  }

  console.log(`  [OK] ${post.username} (likes: ${post.likes}, RT: ${post.retweets})`);
  console.log("  [AI] Gemini APIで翻訳 + リプライ生成中...");

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are analyzing an X (Twitter) post about a football/soccer player.

Player: ${playerNameEn} (${playerNameJa})
Username: ${post.username}
Post URL: ${url}

Post text:
${post.text.slice(0, 2000)}

Respond with ONLY a valid JSON object (no markdown, no code blocks):

{
  "translatedText": "Japanese translation of the post",
  "languageCode": "Language code of the original post (EN, ES, DE, FR, IT, NL, PT, JA, etc.)",
  "replies": [
    {
      "username": "@RealisticFanName1",
      "languageCode": "EN",
      "originalText": "A realistic reply to this post (in the same language as the original or English)",
      "translatedText": "Japanese translation of the reply",
      "likes": 150
    },
    {
      "username": "@RealisticFanName2",
      "languageCode": "EN or JA",
      "originalText": "Another realistic reply, can be agreeing or disagreeing",
      "translatedText": "Japanese translation",
      "likes": 80
    }
  ]
}

Rules for replies:
- Generate exactly 2 realistic replies that fans might actually post
- Usernames should look like real X accounts (mix of English and Japanese fan accounts)
- Replies should be natural reactions to the original post content
- One reply can be positive, one can be a different perspective
- If original is in Japanese, translatedText should be the same as originalText
- Keep replies short (1-2 sentences each)
- Likes should be realistic (50-500 range)`;

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

    const replies = Array.isArray(parsed.replies)
      ? (parsed.replies as Record<string, unknown>[]).map((r) => ({
          username: String(r.username || "@Fan"),
          languageCode: String(r.languageCode || "EN"),
          originalText: String(r.originalText || ""),
          translatedText: String(r.translatedText || ""),
          likes: Number(r.likes) || 100,
        }))
      : [];

    return {
      username: post.username,
      verified: post.verified,
      originalText: post.text,
      translatedText: String(parsed.translatedText || ""),
      languageCode: String(parsed.languageCode || "EN"),
      likes: post.likes,
      retweets: post.retweets,
      replies,
    };
  } catch (aiError) {
    // Gemini API失敗時: 投稿データのみで保存（翻訳・リプライなし）
    console.log(`  [WARN] Gemini API失敗 → 投稿データのみで保存`);
    return {
      username: post.username,
      verified: post.verified,
      originalText: post.text,
      translatedText: "（翻訳未生成）",
      languageCode: "EN",
      likes: post.likes,
      retweets: post.retweets,
      replies: [],
    };
  }
}
