#!/usr/bin/env npx tsx

import {
  readPlayers,
  writePlayers,
  readMatches,
  readMediaRatings,
} from "./lib/file-utils";

async function main() {
  console.log("\n📊 選手統計更新スクリプト\n");

  const args = process.argv.slice(2);
  let targetPlayerId: string | undefined;

  for (const arg of args) {
    if (arg.startsWith("--player=")) {
      targetPlayerId = arg.replace("--player=", "");
    }
  }

  const players = readPlayers();
  const matches = readMatches();
  const mediaRatings = readMediaRatings();

  const playersToUpdate = targetPlayerId
    ? players.filter((p) => p.id === targetPlayerId)
    : players;

  if (targetPlayerId && playersToUpdate.length === 0) {
    console.log(`❌ 選手が見つかりません: ${targetPlayerId}`);
    process.exit(1);
  }

  console.log(`更新対象: ${playersToUpdate.length}名\n`);

  for (const player of playersToUpdate) {
    const playerMatches = matches.filter((m) => m.playerId === player.id);
    const playerMediaRatings = mediaRatings.filter((m) => m.playerId === player.id);

    // 統計を計算
    const stats = {
      goals: 0,
      assists: 0,
      appearances: playerMatches.length,
      minutesPlayed: 0,
      totalRating: 0,
      ratingCount: 0,
    };

    for (const match of playerMatches) {
      stats.goals += match.playerStats.goals;
      stats.assists += match.playerStats.assists;
      stats.minutesPlayed += match.playerStats.minutesPlayed;
    }

    // 平均レーティングを計算
    for (const mediaData of playerMediaRatings) {
      if (mediaData.averageRating > 0) {
        stats.totalRating += mediaData.averageRating;
        stats.ratingCount++;
      }
    }

    const averageRating =
      stats.ratingCount > 0
        ? Math.round((stats.totalRating / stats.ratingCount) * 10) / 10
        : 0;

    // 更新前の値を表示
    const oldStats = player.seasonStats;
    console.log(`📌 ${player.name.ja} (${player.id})`);
    console.log(`   試合数: ${oldStats.appearances} → ${stats.appearances}`);
    console.log(`   ゴール: ${oldStats.goals} → ${stats.goals}`);
    console.log(`   アシスト: ${oldStats.assists} → ${stats.assists}`);
    console.log(`   出場時間: ${oldStats.minutesPlayed} → ${stats.minutesPlayed}`);
    console.log(`   平均評価: ${oldStats.averageRating} → ${averageRating}`);
    console.log("");

    // 更新
    player.seasonStats = {
      ...player.seasonStats,
      goals: stats.goals,
      assists: stats.assists,
      appearances: stats.appearances,
      minutesPlayed: stats.minutesPlayed,
      averageRating,
    };
  }

  // 保存
  writePlayers(players);

  console.log("✅ players.jsonを更新しました!");
}

main().catch(console.error);
