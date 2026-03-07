/**
 * xThreadsをGemini AIで再生成するスクリプト
 * 手動スレッド（isManual === true）は保護される
 *
 * 使用方法:
 *   npx tsx scripts/regenerate-x-threads.ts                    # 2026年2月以降のみ
 *   npx tsx scripts/regenerate-x-threads.ts --all              # 全試合
 *   npx tsx scripts/regenerate-x-threads.ts --match mitoma-20260304  # 指定試合のみ
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { generateAIThreads } from "./lib/thread-generator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, "../src/data");
const MEDIA_RATINGS_FILE = join(DATA_DIR, "media-ratings.json");
const MATCHES_FILE = join(DATA_DIR, "matches.json");
const PLAYERS_FILE = join(DATA_DIR, "players.json");

interface Match {
  matchId: string;
  playerId: string;
  date: string;
  competition: string;
  homeTeam: { name: string; score: number };
  awayTeam: { name: string; score: number };
  playerStats: {
    minutesPlayed: number;
    goals: number;
    assists: number;
    starting: boolean;
    position: string;
    rating: number;
  };
  notable: boolean;
}

interface Player {
  id: string;
  name: { ja: string; en: string };
  league: { name: string; shortName: string; country: string };
  club: { name: string; shortName: string };
}

interface XThread {
  id: string;
  username: string;
  verified: boolean;
  languageCode: string;
  originalText: string;
  translatedText: string;
  likes: number;
  retweets: number;
  replies: {
    id: string;
    username: string;
    languageCode: string;
    originalText: string;
    translatedText: string;
    likes: number;
  }[];
  isManual?: boolean;
  postUrl?: string;
}

interface MediaRating {
  matchId: string;
  playerId: string;
  ratings: unknown[];
  averageRating: number;
  localVoices: unknown[];
  xThreads: XThread[];
  lastUpdated?: string;
}

// コマンドライン引数を解析
const args = process.argv.slice(2);
const isAll = args.includes("--all");
const matchIndex = args.indexOf("--match");
const specificMatchId = matchIndex >= 0 ? args[matchIndex + 1] : undefined;

// デフォルト: 2026年3月以降
const CUTOFF_DATE = "2026-03-01";

async function main() {
  console.log("🔄 Gemini AIでXスレッドを再生成中...\n");

  const matches: Match[] = JSON.parse(readFileSync(MATCHES_FILE, "utf-8"));
  const players: Player[] = JSON.parse(readFileSync(PLAYERS_FILE, "utf-8"));
  const mediaRatings: MediaRating[] = JSON.parse(
    readFileSync(MEDIA_RATINGS_FILE, "utf-8")
  );

  const playerMap = new Map(players.map((p) => [p.id, p]));

  // 対象を絞り込み
  let targetMedia: MediaRating[];
  if (specificMatchId) {
    targetMedia = mediaRatings.filter((m) => m.matchId === specificMatchId);
    console.log(`対象: ${specificMatchId} のみ\n`);
  } else if (isAll) {
    targetMedia = mediaRatings;
    console.log(`対象: 全${mediaRatings.length}試合\n`);
  } else {
    targetMedia = mediaRatings.filter((m) => {
      const match = matches.find((mt) => mt.matchId === m.matchId);
      return match && match.date >= CUTOFF_DATE;
    });
    console.log(
      `対象: ${CUTOFF_DATE}以降の${targetMedia.length}試合（--allで全試合対象）\n`
    );
  }

  let updatedCount = 0;
  let errorCount = 0;

  for (const media of targetMedia) {
    const match = matches.find((m) => m.matchId === media.matchId);
    const player = playerMap.get(media.playerId);

    if (!match || !player) {
      console.log(`⚠️ ${media.matchId}: 試合/選手データなし（スキップ）`);
      continue;
    }

    // 手動スレッドを保護
    const manualThreads = media.xThreads.filter((t) => t.isManual === true);

    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      try {
        const aiThreads = await generateAIThreads(match, player);

        const newAutoThreads: XThread[] = aiThreads.map((t, i) => ({
          id: `t${Date.now()}_${i}`,
          username: t.username,
          verified: t.verified,
          languageCode: t.languageCode,
          originalText: t.originalText,
          translatedText: t.translatedText,
          likes: t.likes,
          retweets: t.retweets,
          replies: t.replies.map((r, j) => ({
            id: `r${Date.now()}_${i}_${j}`,
            ...r,
          })),
        }));

        media.xThreads = [...manualThreads, ...newAutoThreads];
        media.lastUpdated = new Date().toISOString();
        updatedCount++;

        const manualStr =
          manualThreads.length > 0 ? ` + 手動${manualThreads.length}件保護` : "";
        console.log(
          `✅ ${match.matchId}: AI ${newAutoThreads.length}件生成${manualStr}`
        );

        // API レート制限を考慮して待つ
        await new Promise((r) => setTimeout(r, 4000));
        break;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes("429") && retries < maxRetries) {
          retries++;
          const wait = retries * 10;
          console.log(`⏳ ${match.matchId}: レート制限 → ${wait}秒後にリトライ (${retries}/${maxRetries})`);
          await new Promise((r) => setTimeout(r, wait * 1000));
        } else {
          errorCount++;
          console.log(`❌ ${match.matchId}: ${msg}`);
          break;
        }
      }
    }
  }

  writeFileSync(MEDIA_RATINGS_FILE, JSON.stringify(mediaRatings, null, 2));

  console.log(`\n✨ 完了: ${updatedCount}件更新, ${errorCount}件エラー`);
  if (manualCount(mediaRatings) > 0) {
    console.log(
      `📌 手動スレッド ${manualCount(mediaRatings)}件を保護しました`
    );
  }
}

function manualCount(ratings: MediaRating[]): number {
  return ratings.reduce(
    (sum, m) => sum + m.xThreads.filter((t) => t.isManual === true).length,
    0
  );
}

main().catch(console.error);
