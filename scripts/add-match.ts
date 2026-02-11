#!/usr/bin/env npx tsx

import { select, input, confirm } from "@inquirer/prompts";
import {
  readPlayers,
  readMatches,
  writeMatches,
  readMediaRatings,
  writeMediaRatings,
  generateMatchId,
} from "./lib/file-utils";
import { isValidDate, isValidNumber } from "./lib/validators";
import type { Match, MatchMediaData } from "../src/lib/types";

const COMPETITIONS = [
  "プレミアリーグ",
  "ラ・リーガ",
  "ブンデスリーガ",
  "セリエA",
  "リーグ・アン",
  "エールディヴィジ",
  "FAカップ",
  "EFLカップ",
  "UEFAチャンピオンズリーグ",
  "UEFAヨーロッパリーグ",
  "DFBポカール",
  "コパ・デル・レイ",
];

const POSITIONS = [
  "GK", "CB", "LB", "RB", "LWB", "RWB",
  "CDM", "CM", "CAM", "LM", "RM",
  "LW", "RW", "CF", "ST"
];

async function main() {
  console.log("\n🏟️  試合データ追加スクリプト\n");

  const players = readPlayers();
  const matches = readMatches();
  const mediaRatings = readMediaRatings();

  // 1. 選手を選択
  const playerId = await select({
    message: "選手を選択してください:",
    choices: players.map((p) => ({
      name: `${p.name.ja} (${p.club.shortName})`,
      value: p.id,
    })),
  });

  const selectedPlayer = players.find((p) => p.id === playerId)!;

  // 2. 試合日を入力
  let date: string;
  while (true) {
    date = await input({
      message: "試合日を入力 (YYYY-MM-DD):",
      default: new Date().toISOString().split("T")[0],
    });
    if (isValidDate(date)) break;
    console.log("❌ 無効な日付形式です。YYYY-MM-DD形式で入力してください。");
  }

  // 重複チェック
  const matchId = generateMatchId(playerId, date);
  if (matches.find((m) => m.matchId === matchId)) {
    console.log(`❌ この試合は既に登録されています: ${matchId}`);
    process.exit(1);
  }

  // 3. 大会を選択
  const competition = await select({
    message: "大会を選択:",
    choices: COMPETITIONS.map((c) => ({ name: c, value: c })),
  });

  // 4. ホームチーム
  const homeTeamName = await input({
    message: "ホームチーム名:",
    default: selectedPlayer.club.name,
  });

  let homeScore: number;
  while (true) {
    const scoreStr = await input({ message: "ホームスコア:" });
    if (isValidNumber(scoreStr, 0, 20)) {
      homeScore = parseInt(scoreStr, 10);
      break;
    }
    console.log("❌ 0-20の数値を入力してください。");
  }

  // 5. アウェイチーム
  const awayTeamName = await input({ message: "アウェイチーム名:" });

  let awayScore: number;
  while (true) {
    const scoreStr = await input({ message: "アウェイスコア:" });
    if (isValidNumber(scoreStr, 0, 20)) {
      awayScore = parseInt(scoreStr, 10);
      break;
    }
    console.log("❌ 0-20の数値を入力してください。");
  }

  // 6. 選手スタッツ
  let minutesPlayed: number;
  while (true) {
    const minStr = await input({ message: "出場時間 (分):", default: "90" });
    if (isValidNumber(minStr, 0, 120)) {
      minutesPlayed = parseInt(minStr, 10);
      break;
    }
    console.log("❌ 0-120の数値を入力してください。");
  }

  let goals: number;
  while (true) {
    const goalStr = await input({ message: "ゴール数:", default: "0" });
    if (isValidNumber(goalStr, 0, 10)) {
      goals = parseInt(goalStr, 10);
      break;
    }
    console.log("❌ 0-10の数値を入力してください。");
  }

  let assists: number;
  while (true) {
    const assistStr = await input({ message: "アシスト数:", default: "0" });
    if (isValidNumber(assistStr, 0, 10)) {
      assists = parseInt(assistStr, 10);
      break;
    }
    console.log("❌ 0-10の数値を入力してください。");
  }

  const starting = await confirm({
    message: "先発出場ですか?",
    default: true,
  });

  const position = await select({
    message: "ポジション:",
    choices: POSITIONS.map((p) => ({ name: p, value: p })),
    default: selectedPlayer.position,
  });

  let rating: number;
  while (true) {
    const ratingStr = await input({ message: "基本レーティング (0.0-10.0):", default: "6.5" });
    const num = parseFloat(ratingStr);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      rating = Math.round(num * 10) / 10;
      break;
    }
    console.log("❌ 0.0-10.0の数値を入力してください。");
  }

  const notable = await confirm({
    message: "注目試合としてマークしますか?",
    default: goals > 0 || assists > 0,
  });

  // 新しい試合データを作成
  const newMatch: Match = {
    matchId,
    playerId,
    date,
    competition,
    homeTeam: { name: homeTeamName, score: homeScore },
    awayTeam: { name: awayTeamName, score: awayScore },
    playerStats: {
      minutesPlayed,
      goals,
      assists,
      starting,
      position,
      rating,
    },
    notable,
  };

  // 新しいメディアデータエントリを作成
  const newMediaData: MatchMediaData = {
    matchId,
    playerId,
    ratings: [],
    averageRating: rating,
    localVoices: [],
    xThreads: [],
  };

  // 確認表示
  console.log("\n📋 追加する試合データ:");
  console.log("─".repeat(50));
  console.log(`選手: ${selectedPlayer.name.ja}`);
  console.log(`試合ID: ${matchId}`);
  console.log(`日付: ${date}`);
  console.log(`大会: ${competition}`);
  console.log(`スコア: ${homeTeamName} ${homeScore} - ${awayScore} ${awayTeamName}`);
  console.log(`出場: ${minutesPlayed}分 (${starting ? "先発" : "途中出場"})`);
  console.log(`スタッツ: ${goals}G ${assists}A`);
  console.log(`レーティング: ${rating}`);
  console.log(`注目試合: ${notable ? "はい" : "いいえ"}`);
  console.log("─".repeat(50));

  const confirmSave = await confirm({
    message: "この内容で保存しますか?",
    default: true,
  });

  if (!confirmSave) {
    console.log("❌ キャンセルしました。");
    process.exit(0);
  }

  // 保存
  matches.push(newMatch);
  mediaRatings.push(newMediaData);

  writeMatches(matches);
  writeMediaRatings(mediaRatings);

  console.log("\n✅ 試合データを保存しました!");
  console.log(`   matches.json: ${matches.length}件`);
  console.log(`   media-ratings.json: ${mediaRatings.length}件`);
  console.log("\n📝 次のステップ:");
  console.log(`   npx tsx scripts/add-local-voice.ts --match=${matchId}`);
  console.log(`   npx tsx scripts/add-x-thread.ts --match=${matchId}`);
}

main().catch(console.error);
