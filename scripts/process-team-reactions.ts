/**
 * チーム評価の運用ファイルを処理
 *
 * team-inputs/<seasonId>.json から記事URL・X投稿URLを読み込み、
 * Gemini APIで内容を抽出・翻訳して src/data/seasons/<seasonId>/team-reactions.json へ書き出す。
 *
 * 使用方法:
 *   npm run process-team-reactions          # wc2026を処理（デフォルト）
 *   npm run process-team-reactions wc2026   # シーズン指定
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
import { extractThread } from "./lib/thread-extractor";
import { generateId } from "./lib/file-utils";

config({ path: resolve(__dirname, "../.env.local") });

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

interface TeamInput {
  articles?: string[];
  thread_urls?: string[];
}

interface TeamArticle {
  date: string;
  source: string;
  country: string;
  title: string;
  comment: string;
  commentTranslated: string;
  articleUrl: string;
}

interface TeamReactionsData {
  articles: TeamArticle[];
  xThreads: Array<{
    id: string;
    username: string;
    verified: boolean;
    languageCode: string;
    originalText: string;
    translatedText: string;
    likes: number;
    retweets: number;
    replies: Array<{
      id: string;
      username: string;
      languageCode: string;
      originalText: string;
      translatedText: string;
      likes: number;
    }>;
    isManual: boolean;
    postUrl: string;
  }>;
}

async function fetchArticleText(url: string): Promise<string> {
  const response = await fetch(url, { headers: FETCH_HEADERS });
  if (!response.ok) {
    throw new Error(`記事の取得に失敗: ${response.status}`);
  }
  const html = await response.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15000);
}

async function extractTeamArticle(articleUrl: string): Promise<TeamArticle> {
  console.log("  [FETCH] 記事を取得中...");
  const articleText = await fetchArticleText(articleUrl);

  if (articleText.length < 100) {
    throw new Error("記事のテキストが短すぎます");
  }

  console.log(`  [OK] ${articleText.length}文字取得`);
  console.log("  [AI] Gemini APIで情報を抽出中...");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are analyzing a football/soccer article about the Japan national football team (日本代表 / Samurai Blue / Japan).

Article URL: ${articleUrl}

Article text:
${articleText}

Extract the following information about how this article evaluates or discusses the Japan national team. Respond in valid JSON only, no markdown formatting.

{
  "source": "Name of the media outlet/publication (e.g. 'The Guardian', 'ESPN', 'kicker')",
  "country": "Country of the media outlet in Japanese (e.g. 'イギリス', 'アメリカ', 'ドイツ')",
  "title": "Article title or a descriptive title summarizing the article's main point about Japan, in Japanese (max 60 chars)",
  "comment": "A 2-4 sentence summary in the ORIGINAL language of the article, focusing on what the article says about the Japan national team. Include tactical observations, performance evaluations, and notable quotes.",
  "commentTranslated": "Japanese translation of the comment above",
  "date": "Publication date if found in the article (YYYY-MM-DD format), or null if not found"
}

Respond with ONLY the JSON object, no additional text.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  return {
    date: parsed.date || new Date().toISOString().split("T")[0],
    source: String(parsed.source || "Unknown"),
    country: String(parsed.country || "不明"),
    title: String(parsed.title || ""),
    comment: String(parsed.comment || ""),
    commentTranslated: String(parsed.commentTranslated || ""),
    articleUrl,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const seasonId = process.argv[2] || "wc2026";
  const inputPath = join(process.cwd(), "team-inputs", `${seasonId}.json`);
  const outputPath = join(process.cwd(), "src/data/seasons", seasonId, "team-reactions.json");

  if (!existsSync(inputPath)) {
    console.error(`入力ファイルが見つかりません: ${inputPath}`);
    process.exit(1);
  }

  const input: TeamInput = JSON.parse(readFileSync(inputPath, "utf8"));

  // 既存データを読み込み
  let existing: TeamReactionsData = { articles: [], xThreads: [] };
  if (existsSync(outputPath)) {
    existing = JSON.parse(readFileSync(outputPath, "utf8"));
  }

  const existingArticleUrls = new Set(existing.articles.map((a) => a.articleUrl));
  const existingThreadUrls = new Set(existing.xThreads.map((t) => t.postUrl));

  const newArticleUrls = (input.articles || []).filter((u) => !existingArticleUrls.has(u));
  const newThreadUrls = (input.thread_urls || []).filter((u) => !existingThreadUrls.has(u));

  if (newArticleUrls.length === 0 && newThreadUrls.length === 0) {
    console.log("処理対象の新規URLがありません。");
    return;
  }

  console.log(`\n=== チーム評価を処理: ${seasonId} ===`);
  console.log(`  記事: ${newArticleUrls.length}件（新規）`);
  console.log(`  X投稿: ${newThreadUrls.length}件（新規）\n`);

  // 記事を処理
  for (let i = 0; i < newArticleUrls.length; i++) {
    const url = newArticleUrls[i];
    console.log(`\n[記事 ${i + 1}/${newArticleUrls.length}] ${url}`);
    try {
      const article = await extractTeamArticle(url);
      existing.articles.push(article);
      console.log(`  ✅ ${article.source} (${article.country}): ${article.title}`);
    } catch (err) {
      console.error(`  ❌ 失敗: ${err instanceof Error ? err.message : err}`);
    }
    if (i < newArticleUrls.length - 1 || newThreadUrls.length > 0) {
      console.log("  ⏳ APIレート制限回避のため12秒待機...");
      await delay(12000);
    }
  }

  // Xスレッドを処理
  for (let i = 0; i < newThreadUrls.length; i++) {
    const url = newThreadUrls[i];
    console.log(`\n[X投稿 ${i + 1}/${newThreadUrls.length}] ${url}`);
    try {
      const extracted = await extractThread(url, "日本代表", "Japan National Team");
      const username = extracted.username.startsWith("@") ? extracted.username : `@${extracted.username}`;
      existing.xThreads.push({
        id: generateId(),
        username,
        verified: extracted.verified,
        languageCode: extracted.languageCode,
        originalText: extracted.originalText,
        translatedText: extracted.translatedText,
        likes: extracted.likes,
        retweets: extracted.retweets,
        replies: extracted.replies.map((r) => ({
          id: generateId(),
          username: r.username.startsWith("@") ? r.username : `@${r.username}`,
          languageCode: r.languageCode,
          originalText: r.originalText,
          translatedText: r.translatedText,
          likes: r.likes,
        })),
        isManual: true,
        postUrl: url,
      });
      console.log(`  ✅ @${extracted.username}: ${extracted.originalText.slice(0, 50)}...`);
    } catch (err) {
      console.error(`  ❌ 失敗: ${err instanceof Error ? err.message : err}`);
    }
    if (i < newThreadUrls.length - 1) {
      console.log("  ⏳ APIレート制限回避のため12秒待機...");
      await delay(12000);
    }
  }

  // 記事を日付の新しい順にソート
  existing.articles.sort((a, b) => b.date.localeCompare(a.date));

  // 保存
  writeFileSync(outputPath, JSON.stringify(existing, null, 2) + "\n", "utf8");
  console.log(`\n✅ 保存完了: ${outputPath}`);
  console.log(`  記事: ${existing.articles.length}件, X投稿: ${existing.xThreads.length}件`);
}

main().catch((err) => {
  console.error("エラー:", err);
  process.exit(1);
});
