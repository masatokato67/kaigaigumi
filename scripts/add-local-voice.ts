#!/usr/bin/env npx tsx

import { select, input, confirm } from "@inquirer/prompts";
import {
  readMatches,
  readMediaRatings,
  writeMediaRatings,
  readPlayers,
  generateId,
} from "./lib/file-utils";
import { isValidLanguageCode } from "./lib/validators";
import type { LocalVoice } from "../src/lib/types";

const ROLES = [
  { name: "サポーター", value: "supporter" as const, roleText: "サポーター" },
  { name: "ジャーナリスト", value: "journalist" as const, roleText: "ジャーナリスト" },
  { name: "アナリスト", value: "analyst" as const, roleText: "アナリスト" },
];

const LANGUAGES = [
  { name: "English", value: "EN" },
  { name: "Español", value: "ES" },
  { name: "Deutsch", value: "DE" },
  { name: "Nederlands", value: "NL" },
  { name: "Français", value: "FR" },
  { name: "Italiano", value: "IT" },
  { name: "Português", value: "PT" },
];

async function main() {
  console.log("\n💬 現地の声追加スクリプト\n");

  const args = process.argv.slice(2);
  let matchIdArg: string | undefined;

  for (const arg of args) {
    if (arg.startsWith("--match=")) {
      matchIdArg = arg.replace("--match=", "");
    }
  }

  const matches = readMatches();
  const mediaRatings = readMediaRatings();
  const players = readPlayers();

  // 試合を選択
  let matchId: string;
  if (matchIdArg) {
    const found = mediaRatings.find((m) => m.matchId === matchIdArg);
    if (!found) {
      console.log(`❌ 試合が見つかりません: ${matchIdArg}`);
      process.exit(1);
    }
    matchId = matchIdArg;
  } else {
    // 最近の試合を表示
    const recentMatches = [...matches]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    matchId = await select({
      message: "試合を選択:",
      choices: recentMatches.map((m) => {
        const player = players.find((p) => p.id === m.playerId);
        return {
          name: `${m.date} ${player?.name.ja || m.playerId} - ${m.homeTeam.name} vs ${m.awayTeam.name}`,
          value: m.matchId,
        };
      }),
    });
  }

  const mediaData = mediaRatings.find((m) => m.matchId === matchId);
  if (!mediaData) {
    console.log(`❌ メディアデータが見つかりません: ${matchId}`);
    process.exit(1);
  }

  const match = matches.find((m) => m.matchId === matchId);
  const player = players.find((p) => p.id === mediaData.playerId);

  console.log(`\n📍 試合: ${match?.date} ${player?.name.ja}`);
  console.log(`   ${match?.homeTeam.name} ${match?.homeTeam.score} - ${match?.awayTeam.score} ${match?.awayTeam.name}`);
  console.log(`   現在の現地の声: ${mediaData.localVoices.length}件\n`);

  let addMore = true;
  while (addMore) {
    // ユーザー名
    const username = await input({
      message: "ユーザー名 (例: @BrightonFan123):",
    });

    // 役割
    const roleChoice = await select({
      message: "役割:",
      choices: ROLES.map((r) => ({ name: r.name, value: r })),
    });

    // 言語
    const languageCode = await select({
      message: "言語:",
      choices: LANGUAGES,
    });

    // 原文
    const originalText = await input({
      message: "原文 (英語など):",
    });

    // 翻訳文
    const translatedText = await input({
      message: "翻訳文 (日本語):",
    });

    const newVoice: LocalVoice = {
      id: generateId(),
      username,
      role: roleChoice.roleText,
      roleKey: roleChoice.value,
      languageCode,
      originalText,
      translatedText,
    };

    // プレビュー
    console.log("\n📝 追加する声:");
    console.log("─".repeat(50));
    console.log(`ユーザー: ${username} [${roleChoice.roleText}]`);
    console.log(`言語: ${languageCode}`);
    console.log(`原文: ${originalText}`);
    console.log(`翻訳: ${translatedText}`);
    console.log("─".repeat(50));

    const confirmAdd = await confirm({
      message: "この内容で追加しますか?",
      default: true,
    });

    if (confirmAdd) {
      mediaData.localVoices.push(newVoice);
      console.log("✅ 追加しました!");
    }

    addMore = await confirm({
      message: "続けて追加しますか?",
      default: true,
    });
  }

  // 保存
  writeMediaRatings(mediaRatings);

  console.log(`\n✅ 保存しました! 現地の声: ${mediaData.localVoices.length}件`);
}

main().catch(console.error);
