/**
 * 試合入力ファイル処理スクリプト
 *
 * match-inputs/<matchId>.json を読み込み、
 * ハイライト動画と記事URLを一括処理する。
 *
 * 使用方法:
 *   npm run process-match -- <matchId>
 *   npm run process-match -- mitoma-20260304
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  readMatches,
  readPlayers,
  readMediaRatings,
  writeMediaRatings,
  readHighlightVideos,
  writeHighlightVideos,
} from "./lib/file-utils";
import { extractPlayerInfo } from "./lib/article-extractor";
import type { MediaRating } from "../src/lib/types";

const INPUTS_DIR = join(process.cwd(), "match-inputs");

interface MatchInput {
  highlight?: string;
  articles?: string[];
}

/**
 * YouTube URLからvideo IDを抽出
 */
function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

async function main() {
  const matchId = process.argv[2];

  if (!matchId) {
    console.log("使用方法: npm run process-match -- <matchId>");
    console.log("例: npm run process-match -- mitoma-20260304");

    // 利用可能な入力ファイルを表示
    const { readdirSync } = await import("fs");
    if (existsSync(INPUTS_DIR)) {
      const files = readdirSync(INPUTS_DIR).filter((f) => f.endsWith(".json"));
      if (files.length > 0) {
        console.log("\n利用可能な入力ファイル:");
        files.forEach((f) => console.log(`  ${f.replace(".json", "")}`));
      }
    }
    process.exit(1);
  }

  // 入力ファイル読み込み
  const inputFile = join(INPUTS_DIR, `${matchId}.json`);
  if (!existsSync(inputFile)) {
    console.log(`❌ 入力ファイルが見つかりません: ${inputFile}`);
    console.log(`   match-inputs/${matchId}.json を作成してください。`);
    process.exit(1);
  }

  const input: MatchInput = JSON.parse(readFileSync(inputFile, "utf-8"));

  // 試合・選手データを確認
  const matches = readMatches();
  const players = readPlayers();
  const match = matches.find((m) => m.matchId === matchId);

  if (!match) {
    console.log(`❌ 試合が見つかりません: ${matchId}`);
    process.exit(1);
  }

  const player = players.find((p) => p.id === match.playerId);
  if (!player) {
    console.log(`❌ 選手が見つかりません: ${match.playerId}`);
    process.exit(1);
  }

  console.log(`\n⚽ ${player.name.ja} - ${match.date}`);
  console.log(
    `   ${match.homeTeam.name} ${match.homeTeam.score}-${match.awayTeam.score} ${match.awayTeam.name}\n`
  );

  let updated = false;

  // ── ハイライト動画の処理 ──
  if (input.highlight) {
    const youtubeId = extractYoutubeId(input.highlight);
    if (youtubeId) {
      const videos = readHighlightVideos();
      const current = videos[matchId];

      if (current?.youtubeId === youtubeId) {
        console.log(`📹 ハイライト: 変更なし (${youtubeId})`);
      } else {
        videos[matchId] = {
          enabled: true,
          youtubeId,
          title: current?.title || "",
        };
        writeHighlightVideos(videos);
        console.log(`📹 ハイライト: ${current?.youtubeId ? "更新" : "追加"} → ${youtubeId}`);
        updated = true;
      }
    } else {
      console.log(`⚠️  YouTube URLを解析できません: ${input.highlight}`);
    }
  } else {
    console.log("📹 ハイライト: 入力なし（スキップ）");
  }

  // ── 記事URLの処理 ──
  const articles = input.articles || [];
  if (articles.length === 0) {
    console.log("📰 記事: 入力なし（スキップ）");
  } else {
    console.log(`\n📰 記事: ${articles.length}件を処理\n`);

    const mediaRatings = readMediaRatings();
    let mediaData = mediaRatings.find((m) => m.matchId === matchId);

    // mediaData がない場合は新規作成
    if (!mediaData) {
      mediaData = {
        matchId,
        playerId: match.playerId,
        ratings: [],
        averageRating: match.playerStats.rating,
        localVoices: [],
        xThreads: [],
        lastUpdated: new Date().toISOString(),
      };
      mediaRatings.push(mediaData);
    }

    // 既存の記事URLを取得（二重処理防止）
    const existingUrls = new Set(
      mediaData.ratings
        .filter((r) => r.articleUrl)
        .map((r) => r.articleUrl!)
    );

    let newCount = 0;
    let skipCount = 0;

    for (const articleUrl of articles) {
      if (existingUrls.has(articleUrl)) {
        const existing = mediaData.ratings.find(
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

        const newRating: MediaRating = {
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

        mediaData.ratings.push(newRating);
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

    // 平均レーティングを再計算
    const ratedEntries = mediaData.ratings.filter(
      (r) => r.hasArticleRating !== false
    );
    if (ratedEntries.length > 0) {
      const standardRatings = ratedEntries.filter(
        (r) => r.ratingSystem === "standard"
      );
      if (standardRatings.length > 0) {
        mediaData.averageRating =
          Math.round(
            (standardRatings.reduce((sum, r) => sum + r.rating, 0) /
              standardRatings.length) *
              10
          ) / 10;
      }
    }

    mediaData.lastUpdated = new Date().toISOString();
    writeMediaRatings(mediaRatings);

    console.log(
      `📰 記事処理完了: 新規${newCount}件, スキップ${skipCount}件`
    );
    if (newCount > 0) updated = true;
  }

  // ── 結果サマリー ──
  console.log("\n" + "─".repeat(50));
  if (updated) {
    console.log("✅ データを更新しました");
    console.log("\n次のステップ:");
    console.log(
      `  git add src/data/highlight-videos.json src/data/media-ratings.json && git commit -m "Update ${matchId}" && git push origin main`
    );
  } else {
    console.log("ℹ️  変更はありません");
  }
}

main().catch(console.error);
