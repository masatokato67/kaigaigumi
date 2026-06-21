/**
 * team-reactions.json 内の翻訳未生成スレッドを翻訳する
 *
 * 使用方法:
 *   npx tsx scripts/translate-team-reactions.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env.local") });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY が .env.local に設定されていません");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateText(text: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `Translate the following X (Twitter) post about the Japan national football team into Japanese. Keep emojis and formatting. Respond with ONLY the translated text, no explanation.

Text:
${text.slice(0, 3000)}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function translateReply(text: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `Translate the following short X (Twitter) reply about the Japan national football team into Japanese. Respond with ONLY the translated text, no explanation.

Text:
${text}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function main() {
  const seasonId = process.argv[2] || "wc2026";
  const filePath = join(process.cwd(), "src/data/seasons", seasonId, "team-reactions.json");
  const data = JSON.parse(readFileSync(filePath, "utf8"));

  let count = 0;

  for (let i = 0; i < data.xThreads.length; i++) {
    const thread = data.xThreads[i];

    if (thread.translatedText === "（翻訳未生成）" || !thread.translatedText) {
      console.log(`\n[Thread ${i}] ${thread.username} - 翻訳中...`);
      try {
        thread.translatedText = await translateText(thread.originalText);
        console.log(`  ✅ 翻訳完了 (${thread.translatedText.length}文字)`);
        count++;
        await delay(12000);
      } catch (err) {
        console.error(`  ❌ 失敗: ${err instanceof Error ? err.message : err}`);
      }
    }

    // リプライの翻訳もチェック
    for (let j = 0; j < (thread.replies || []).length; j++) {
      const reply = thread.replies[j];
      if ((reply.translatedText === "（翻訳未生成）" || !reply.translatedText) && reply.languageCode !== "JA") {
        console.log(`  [Reply ${j}] ${reply.username} - 翻訳中...`);
        try {
          reply.translatedText = await translateReply(reply.originalText);
          console.log(`    ✅ 翻訳完了`);
          count++;
          await delay(12000);
        } catch (err) {
          console.error(`    ❌ 失敗: ${err instanceof Error ? err.message : err}`);
        }
      }
    }
  }

  if (count > 0) {
    writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`\n✅ ${count}件の翻訳を保存しました`);
  } else {
    console.log("\n翻訳対象がありませんでした");
  }
}

main().catch((err) => {
  console.error("エラー:", err);
  process.exit(1);
});
