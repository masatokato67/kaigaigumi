/**
 * 記事URLから選手関連情報を抽出するユーティリティ
 * Google Gemini APIを使用
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
import { resolve } from "path";

// .env.local を読み込み
config({ path: resolve(__dirname, "../../.env.local") });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY が .env.local に設定されていません");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,ja;q=0.8",
};

export interface ExtractedArticle {
  source: string; // メディア名
  country: string; // メディアの国
  comment: string; // 原文コメント（抽出・要約）
  commentTranslated: string; // 日本語訳
  rating?: number; // 記事内にスコアがあれば
  maxRating?: number; // スコアの最大値
  ratingSystem?: "standard" | "german"; // 採点方式
}

/**
 * URLからHTMLを取得しテキストを抽出
 */
async function fetchArticleText(url: string): Promise<string> {
  const response = await fetch(url, { headers: FETCH_HEADERS });

  if (!response.ok) {
    throw new Error(`記事の取得に失敗: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // HTMLからテキストを抽出（簡易版）
  const text = html
    // scriptとstyleタグを除去
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    // HTMLタグを除去
    .replace(/<[^>]+>/g, " ")
    // HTMLエンティティをデコード
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    // 連続する空白を整理
    .replace(/\s+/g, " ")
    .trim();

  // 最大15000文字に制限（API制限とコスト考慮）
  return text.slice(0, 15000);
}

/**
 * Gemini APIで記事テキストから選手情報を抽出
 */
export async function extractPlayerInfo(
  articleUrl: string,
  playerNameJa: string,
  playerNameEn: string
): Promise<ExtractedArticle> {
  console.log("  [FETCH] 記事を取得中...");
  const articleText = await fetchArticleText(articleUrl);

  if (articleText.length < 100) {
    throw new Error("記事のテキストが短すぎます。ページが正しく取得できていない可能性があります。");
  }

  console.log(`  [OK] ${articleText.length}文字取得`);
  console.log("  [AI] Gemini APIで情報を抽出中...");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are analyzing a football/soccer article to extract information about a specific player.

Player: ${playerNameEn} (${playerNameJa})
Article URL: ${articleUrl}

Article text:
${articleText}

Please extract the following information about this player from the article. Respond in valid JSON only, no markdown formatting.

{
  "source": "Name of the media outlet/publication (e.g. 'The Guardian', 'Sky Sports', 'kicker')",
  "country": "Country of the media outlet in Japanese (e.g. 'イングランド', 'ドイツ', 'スペイン')",
  "comment": "A 2-4 sentence summary in the ORIGINAL language of the article, focusing on what the article says about this specific player. Include tactical observations, performance notes, and any notable quotes. If the player is only briefly mentioned, summarize what is said.",
  "commentTranslated": "Japanese translation of the comment above",
  "rating": null,
  "maxRating": null,
  "ratingSystem": null
}

Rules for rating fields:
- If the article contains a specific numerical rating/score for this player (e.g. "7/10", "rated 6.5"), set rating to the number, maxRating to the scale max, and ratingSystem to "standard" (for higher=better) or "german" (for 1=best, 6=worst like kicker).
- If NO numerical rating is mentioned in the article, set all three rating fields to null.
- Do NOT invent or estimate ratings. Only include them if explicitly stated in the article.

Respond with ONLY the JSON object, no additional text.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  // JSON部分を抽出（```json ... ``` でラップされている場合に対応）
  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Gemini APIのレスポンスをパースできませんでした:\n${responseText}`);
  }

  const extracted: ExtractedArticle = {
    source: String(parsed.source || "Unknown"),
    country: String(parsed.country || "不明"),
    comment: String(parsed.comment || ""),
    commentTranslated: String(parsed.commentTranslated || ""),
  };

  if (parsed.rating !== null && parsed.rating !== undefined) {
    extracted.rating = Number(parsed.rating);
    extracted.maxRating = Number(parsed.maxRating || 10);
    extracted.ratingSystem = parsed.ratingSystem === "german" ? "german" : "standard";
  }

  return extracted;
}
