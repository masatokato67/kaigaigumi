/**
 * 試合データにハイライト動画を追加するスクリプト
 * notable試合およびゴール/アシストのある試合に動画を追加
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const MATCHES_FILE = join(__dirname, "../src/data/matches.json");

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
  highlightVideo?: {
    youtubeId: string;
    title: string;
  };
}

// 選手名マッピング
const PLAYER_NAMES: Record<string, { ja: string; en: string }> = {
  mitoma: { ja: "三笘薫", en: "Kaoru Mitoma" },
  kubo: { ja: "久保建英", en: "Takefusa Kubo" },
  tomiyasu: { ja: "冨安健洋", en: "Takehiro Tomiyasu" },
  kamada: { ja: "鎌田大地", en: "Daichi Kamada" },
  endo: { ja: "遠藤航", en: "Wataru Endo" },
  shiogai: { ja: "塩貝健人", en: "Kento Shiogai" },
  sano_kodai: { ja: "佐野航大", en: "Kodai Sano" },
  sano_kaishu: { ja: "佐野海舟", en: "Kaishu Sano" },
};

// サンプルのYouTube動画ID（実際の選手ハイライト動画）
// 注意: これらは実際に存在する動画IDに置き換える必要があります
const SAMPLE_VIDEO_IDS = [
  "dQw4w9WgXcQ", // プレースホルダー
  "jNQXAC9IVRw", // プレースホルダー
  "9bZkp7q19f0", // プレースホルダー
];

function generateVideoTitle(match: Match, playerName: string): string {
  const opponent = match.homeTeam.name.includes(playerName)
    ? match.awayTeam.name
    : match.homeTeam.name;

  const stats: string[] = [];
  if (match.playerStats.goals > 0) {
    stats.push(`${match.playerStats.goals}ゴール`);
  }
  if (match.playerStats.assists > 0) {
    stats.push(`${match.playerStats.assists}アシスト`);
  }

  const statStr = stats.length > 0 ? ` ${stats.join("・")}` : "";
  return `${playerName} vs ${opponent}${statStr} | ${match.competition} ${match.date}`;
}

function main() {
  console.log("=== ハイライト動画追加スクリプト ===\n");

  const matches: Match[] = JSON.parse(readFileSync(MATCHES_FILE, "utf-8"));

  let addedCount = 0;

  for (const match of matches) {
    // notable試合またはゴール/アシストがある試合に動画を追加
    const hasContribution = match.playerStats.goals > 0 || match.playerStats.assists > 0;
    const shouldAddVideo = match.notable || hasContribution;

    if (shouldAddVideo && !match.highlightVideo) {
      const playerInfo = PLAYER_NAMES[match.playerId];
      if (!playerInfo) continue;

      // ランダムな動画IDを選択（実際の運用ではYouTube APIで検索）
      const videoId = SAMPLE_VIDEO_IDS[Math.floor(Math.random() * SAMPLE_VIDEO_IDS.length)];

      match.highlightVideo = {
        youtubeId: videoId,
        title: generateVideoTitle(match, playerInfo.ja),
      };

      addedCount++;
      console.log(`[追加] ${match.matchId}: ${match.highlightVideo.title}`);
    }
  }

  writeFileSync(MATCHES_FILE, JSON.stringify(matches, null, 2));
  console.log(`\n=== 完了: ${addedCount}件の試合にハイライト動画を追加しました ===`);
}

main();
