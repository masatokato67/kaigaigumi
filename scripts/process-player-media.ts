/**
 * 選手メディア入力ファイル処理スクリプト
 *
 * player-media-inputs/<playerId>.json を読み込み、
 * 記事URL・Xスレッドを一括処理して選手別メディアデータを更新する。
 *
 * 使用方法:
 *   npm run process-player-media -- <playerId>
 *   npm run process-player-media -- sano_kaishu
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  readPlayers,
  readPlayerMedia,
  writePlayerMedia,
  generateId,
} from "./lib/file-utils";
import { extractPlayerInfo } from "./lib/article-extractor";
import { extractThread } from "./lib/thread-extractor";
import type { PlayerMediaRating, PlayerXThread, ThreadReply } from "../src/lib/types";

const INPUTS_DIR = join(process.cwd(), "player-media-inputs");

interface PlayerMediaInput {
  articles?: string[];
  thread_urls?: string[];
}

async function main() {
  const playerId = process.argv[2];

  if (!playerId) {
    console.log("使用方法: npm run process-player-media -- <playerId>");
    console.log("例: npm run process-player-media -- sano_kaishu");

    // 利用可能な入力ファイルを表示
    const { readdirSync } = await import("fs");
    if (existsSync(INPUTS_DIR)) {
      const files = readdirSync(INPUTS_DIR).filter((f) => f.endsWith(".json"));
      if (files.length > 0) {
        console.log("\n利用可能な入力ファイル:");
        files.forEach((f) => console.log(`  ${f.replace(".json", "")}`));
      }
    }

    // 利用可能な選手を表示
    const players = readPlayers();
    console.log("\n登録済みの選手:");
    players.forEach((p) => console.log(`  ${p.id} (${p.name.ja})`));

    process.exit(1);
  }

  // 選手データを確認
  const players = readPlayers();
  const player = players.find((p) => p.id === playerId);

  if (!player) {
    console.log(`❌ 選手が見つかりません: ${playerId}`);
    console.log("\n登録済みの選手:");
    players.forEach((p) => console.log(`  ${p.id} (${p.name.ja})`));
    process.exit(1);
  }

  // 入力ファイル読み込み
  const inputFile = join(INPUTS_DIR, `${playerId}.json`);
  if (!existsSync(inputFile)) {
    console.log(`❌ 入力ファイルが見つかりません: ${inputFile}`);
    console.log(`   player-media-inputs/${playerId}.json を作成してください。`);
    console.log(`\n入力ファイルの形式:`);
    console.log(`{`);
    console.log(`  "articles": ["https://..."],`);
    console.log(`  "thread_urls": ["https://x.com/..."]`);
    console.log(`}`);
    process.exit(1);
  }

  const input: PlayerMediaInput = JSON.parse(readFileSync(inputFile, "utf-8"));

  console.log(`\n👤 ${player.name.ja}（${player.club.shortName} / ${player.league.shortName}）\n`);

  // 既存のメディアデータを読み込み
  const mediaData = readPlayerMedia(playerId);
  let updated = false;
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // ── 記事URLの処理 ──
  const articles = input.articles || [];
  if (articles.length === 0) {
    console.log("📰 記事: 入力なし（スキップ）");
  } else {
    console.log(`📰 記事: ${articles.length}件を処理\n`);

    const existingUrls = new Set(
      mediaData.mediaRatings
        .filter((r) => r.articleUrl)
        .map((r) => r.articleUrl!)
    );

    let newCount = 0;
    let skipCount = 0;

    for (const articleUrl of articles) {
      if (existingUrls.has(articleUrl)) {
        const existing = mediaData.mediaRatings.find(
          (r) => r.articleUrl === articleUrl
        );
        console.log(
          `  [スキップ] ${existing?.source || "不明"}: 処理済み`
        );
        skipCount++;
        continue;
      }

      try {
        const extracted = await extractPlayerInfo(
          articleUrl,
          player.name.ja,
          player.name.en
        );

        const newRating: PlayerMediaRating = {
          date: today,
          source: extracted.source,
          country: extracted.country,
          rating: extracted.rating ?? 0,
          maxRating: extracted.maxRating ?? 10,
          ratingSystem: extracted.ratingSystem ?? "standard",
          comment: extracted.comment,
          commentTranslated: extracted.commentTranslated,
          isManual: true,
          articleUrl,
          hasArticleRating: extracted.rating !== undefined,
        };

        mediaData.mediaRatings.push(newRating);
        newCount++;

        const scoreStr = extracted.rating
          ? ` (${extracted.rating}/${extracted.maxRating})`
          : "";
        console.log(`  [追加] ${extracted.source}${scoreStr}`);
        console.log(`         ${extracted.commentTranslated.slice(0, 60)}...`);
        console.log();
      } catch (error) {
        console.log(
          `  [エラー] ${articleUrl}\n         ${error instanceof Error ? error.message : error}\n`
        );
      }
    }

    console.log(
      `📰 記事処理完了: 新規${newCount}件, スキップ${skipCount}件`
    );
    if (newCount > 0) updated = true;
  }

  // ── Xスレッド（thread_urls）の処理 ──
  const threadUrls = input.thread_urls || [];
  if (threadUrls.length === 0) {
    console.log("🐦 Xスレッド: 入力なし（スキップ）");
  } else {
    console.log(`\n🐦 Xスレッド: ${threadUrls.length}件を処理\n`);

    const existingPostUrls = new Set(
      mediaData.xThreads
        .filter((t) => t.postUrl)
        .map((t) => t.postUrl!)
    );

    let newCount = 0;
    let skipCount = 0;

    for (const threadUrl of threadUrls) {
      if (existingPostUrls.has(threadUrl)) {
        const existing = mediaData.xThreads.find((t) => t.postUrl === threadUrl);
        console.log(`  [スキップ] ${existing?.username || "不明"}: 処理済み`);
        skipCount++;
        continue;
      }

      try {
        const extracted = await extractThread(
          threadUrl,
          player.name.ja,
          player.name.en
        );

        const newThread: PlayerXThread = {
          date: today,
          id: generateId(),
          username: extracted.username,
          verified: extracted.verified,
          languageCode: extracted.languageCode,
          originalText: extracted.originalText,
          translatedText: extracted.translatedText,
          likes: extracted.likes,
          retweets: extracted.retweets,
          replies: extracted.replies.map((r): ThreadReply => ({
            id: generateId(),
            username: r.username,
            languageCode: r.languageCode,
            originalText: r.originalText,
            translatedText: r.translatedText,
            likes: r.likes,
          })),
          isManual: true,
          postUrl: threadUrl,
        };

        mediaData.xThreads.push(newThread);
        existingPostUrls.add(threadUrl);
        newCount++;

        console.log(`  [追加] ${extracted.username} (${extracted.languageCode})`);
        console.log(`         ${extracted.translatedText.slice(0, 60)}...`);
        console.log();
      } catch (error) {
        console.log(
          `  [エラー] ${threadUrl}\n         ${error instanceof Error ? error.message : error}\n`
        );
      }
    }

    console.log(
      `🐦 Xスレッド処理完了: 新規${newCount}件, スキップ${skipCount}件`
    );
    if (newCount > 0) updated = true;
  }

  // ── 保存 ──
  if (updated) {
    // 日付降順でソート
    mediaData.mediaRatings.sort((a, b) => b.date.localeCompare(a.date));
    mediaData.xThreads.sort((a, b) => b.date.localeCompare(a.date));

    writePlayerMedia(mediaData);
  }

  // ── 結果サマリー ──
  console.log("\n" + "─".repeat(50));
  if (updated) {
    console.log("✅ データを更新しました");
    console.log(`   メディア評価: ${mediaData.mediaRatings.length}件`);
    console.log(`   Xスレッド: ${mediaData.xThreads.length}件`);
    console.log("\n次のステップ:");
    console.log(
      `  git add src/data/player-media/ player-media-inputs/ && git commit -m "Update player media: ${playerId}" && git push origin main`
    );
  } else {
    console.log("ℹ️  変更はありません");
  }
}

main().catch(console.error);
