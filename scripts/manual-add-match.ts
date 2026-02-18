/**
 * 手動で試合データを追加するスクリプト
 *
 * 使用方法:
 * npx tsx scripts/manual-add-match.ts
 *
 * または直接データを指定:
 * npx tsx scripts/manual-add-match.ts --data '{"playerId":"mitoma",...}'
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, "../src/data");
const MATCHES_FILE = join(DATA_DIR, "matches.json");
const MEDIA_RATINGS_FILE = join(DATA_DIR, "media-ratings.json");
const HIGHLIGHT_VIDEOS_FILE = join(DATA_DIR, "highlight-videos.json");
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
  club: { shortName: string };
}

interface MediaRating {
  matchId: string;
  playerId: string;
  ratings: Array<{
    source: string;
    country: string;
    rating: number;
    maxRating: number;
    ratingSystem: string;
    comment: string;
    commentTranslated: string;
  }>;
  averageRating: number;
  localVoices: Array<unknown>;
  xThreads: Array<unknown>;
  lastUpdated: string;
}

interface HighlightVideo {
  enabled: boolean;
  youtubeId: string;
  title: string;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log("\n=== 試合データ手動追加ツール ===\n");

  // 選手一覧を表示
  const players: Player[] = JSON.parse(readFileSync(PLAYERS_FILE, "utf-8"));
  console.log("選手一覧:");
  players.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name.ja} (${p.id}) - ${p.club.shortName}`);
  });

  // 選手を選択
  const playerIndex = parseInt(await question("\n選手番号を入力: ")) - 1;
  if (playerIndex < 0 || playerIndex >= players.length) {
    console.log("無効な選手番号です");
    rl.close();
    return;
  }
  const player = players[playerIndex];
  console.log(`\n選択: ${player.name.ja}\n`);

  // 試合情報を入力
  const date = await question("試合日 (YYYY-MM-DD): ");
  const competition = await question("大会名 (例: プレミアリーグ): ");
  const homeTeamName = await question("ホームチーム名: ");
  const homeTeamScore = parseInt(await question("ホームスコア: "));
  const awayTeamName = await question("アウェイチーム名: ");
  const awayTeamScore = parseInt(await question("アウェイスコア: "));

  // 選手スタッツ
  console.log("\n--- 選手スタッツ ---");
  const minutesPlayed = parseInt(await question("出場時間 (分): "));
  const goals = parseInt(await question("ゴール数: "));
  const assists = parseInt(await question("アシスト数: "));
  const startingInput = await question("先発? (y/n): ");
  const starting = startingInput.toLowerCase() === "y";
  const position = await question("ポジション (例: LW, CM, ST): ");
  const rating = parseFloat(await question("FotMob評価点: "));

  // メディア評価
  console.log("\n--- メディア評価 (空欄でスキップ) ---");
  const ratings: MediaRating["ratings"] = [];

  const sources = [
    { name: "Sky Sports", country: "イングランド" },
    { name: "WhoScored", country: "イングランド" },
    { name: "Kicker", country: "ドイツ" },
    { name: "L'Équipe", country: "フランス" },
    { name: "Marca", country: "スペイン" },
  ];

  for (const source of sources) {
    const ratingInput = await question(`${source.name} 評価点 (空欄でスキップ): `);
    if (ratingInput) {
      const comment = await question(`${source.name} コメント (英語): `);
      const commentTranslated = await question(`${source.name} コメント (日本語): `);
      ratings.push({
        source: source.name,
        country: source.country,
        rating: parseFloat(ratingInput),
        maxRating: 10,
        ratingSystem: source.name === "Kicker" ? "german" : "standard",
        comment,
        commentTranslated,
      });
    }
  }

  // matchIdを生成
  const matchId = `${player.id}-${date.replace(/-/g, "")}`;

  // 確認
  console.log("\n=== 入力内容確認 ===");
  console.log(`試合ID: ${matchId}`);
  console.log(`選手: ${player.name.ja}`);
  console.log(`日付: ${date}`);
  console.log(`大会: ${competition}`);
  console.log(`対戦: ${homeTeamName} ${homeTeamScore} - ${awayTeamScore} ${awayTeamName}`);
  console.log(`出場: ${minutesPlayed}分, G:${goals}, A:${assists}, ${starting ? "先発" : "途中出場"}`);
  console.log(`評価: ${rating}`);
  if (ratings.length > 0) {
    console.log(`メディア評価: ${ratings.length}件`);
  }

  const confirm = await question("\nこの内容で保存しますか? (y/n): ");
  if (confirm.toLowerCase() !== "y") {
    console.log("キャンセルしました");
    rl.close();
    return;
  }

  // データを保存
  const matches: Match[] = JSON.parse(readFileSync(MATCHES_FILE, "utf-8"));

  // 重複チェック
  if (matches.some((m) => m.matchId === matchId)) {
    console.log(`\n⚠️ 試合ID ${matchId} は既に存在します`);
    rl.close();
    return;
  }

  const newMatch: Match = {
    matchId,
    playerId: player.id,
    date,
    competition,
    homeTeam: { name: homeTeamName, score: homeTeamScore },
    awayTeam: { name: awayTeamName, score: awayTeamScore },
    playerStats: {
      minutesPlayed,
      goals,
      assists,
      starting,
      position,
      rating,
    },
    notable: goals >= 1 || assists >= 1 || rating >= 7.5,
  };

  // matches.jsonに追加（日付順でソート）
  matches.push(newMatch);
  matches.sort((a, b) => b.date.localeCompare(a.date));
  writeFileSync(MATCHES_FILE, JSON.stringify(matches, null, 2));
  console.log("✅ matches.json を更新しました");

  // media-ratings.jsonに追加
  const mediaRatings: MediaRating[] = JSON.parse(readFileSync(MEDIA_RATINGS_FILE, "utf-8"));
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : rating;

  const newMediaRating: MediaRating = {
    matchId,
    playerId: player.id,
    ratings,
    averageRating: Math.round(averageRating * 10) / 10,
    localVoices: [],
    xThreads: [],
    lastUpdated: new Date().toISOString(),
  };

  mediaRatings.unshift(newMediaRating);
  writeFileSync(MEDIA_RATINGS_FILE, JSON.stringify(mediaRatings, null, 2));
  console.log("✅ media-ratings.json を更新しました");

  // highlight-videos.jsonに追加
  const highlightVideos: Record<string, HighlightVideo> = JSON.parse(
    readFileSync(HIGHLIGHT_VIDEOS_FILE, "utf-8")
  );
  if (!highlightVideos[matchId]) {
    highlightVideos[matchId] = {
      enabled: false,
      youtubeId: "",
      title: "",
    };

    // 日付順にソート
    const sorted = Object.entries(highlightVideos).sort((a, b) => {
      const dateA = a[0].split("-").slice(-1)[0];
      const dateB = b[0].split("-").slice(-1)[0];
      return dateB.localeCompare(dateA);
    });

    writeFileSync(HIGHLIGHT_VIDEOS_FILE, JSON.stringify(Object.fromEntries(sorted), null, 2));
    console.log("✅ highlight-videos.json を更新しました");
  }

  console.log(`\n🎉 試合データを追加しました: ${matchId}`);
  console.log("\n次のステップ:");
  console.log("1. npm run build でビルド確認");
  console.log("2. git add . && git commit -m 'Add match data' && git push");

  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
});
