#!/usr/bin/env npx tsx

import { select, input, confirm } from "@inquirer/prompts";
import {
  readMatches,
  readMediaRatings,
  writeMediaRatings,
  readPlayers,
  generateId,
} from "./lib/file-utils";
import type { XThread, ThreadReply } from "../src/lib/types";

const LANGUAGES = [
  { name: "English", value: "EN" },
  { name: "Español", value: "ES" },
  { name: "Deutsch", value: "DE" },
  { name: "Nederlands", value: "NL" },
  { name: "Français", value: "FR" },
  { name: "Italiano", value: "IT" },
  { name: "Português", value: "PT" },
  { name: "日本語", value: "JA" },
];

async function addReply(): Promise<ThreadReply | null> {
  const addReplyConfirm = await confirm({
    message: "返信を追加しますか?",
    default: false,
  });

  if (!addReplyConfirm) return null;

  const username = await input({ message: "返信ユーザー名:" });

  const languageCode = await select({
    message: "返信の言語:",
    choices: LANGUAGES,
  });

  const originalText = await input({ message: "返信原文:" });
  const translatedText = await input({ message: "返信翻訳:" });

  let likes: number;
  while (true) {
    const likesStr = await input({ message: "いいね数:", default: "0" });
    const num = parseInt(likesStr, 10);
    if (!isNaN(num) && num >= 0) {
      likes = num;
      break;
    }
    console.log("❌ 0以上の数値を入力してください。");
  }

  return {
    id: generateId(),
    username,
    languageCode,
    originalText,
    translatedText,
    likes,
  };
}

async function main() {
  console.log("\n🐦 Xスレッド追加スクリプト\n");

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

  // xThreadsが未定義の場合は初期化
  if (!mediaData.xThreads) {
    mediaData.xThreads = [];
  }

  const match = matches.find((m) => m.matchId === matchId);
  const player = players.find((p) => p.id === mediaData.playerId);

  console.log(`\n📍 試合: ${match?.date} ${player?.name.ja}`);
  console.log(`   ${match?.homeTeam.name} ${match?.homeTeam.score} - ${match?.awayTeam.score} ${match?.awayTeam.name}`);
  console.log(`   現在のXスレッド: ${mediaData.xThreads.length}件\n`);

  let addMore = true;
  while (addMore) {
    // メインスレッド情報
    const username = await input({
      message: "ユーザー名 (例: @SkySports):",
    });

    const verified = await confirm({
      message: "認証済みアカウントですか?",
      default: false,
    });

    const languageCode = await select({
      message: "言語:",
      choices: LANGUAGES,
    });

    const originalText = await input({
      message: "原文:",
    });

    const translatedText = await input({
      message: "翻訳文 (日本語):",
    });

    let likes: number;
    while (true) {
      const likesStr = await input({ message: "いいね数:", default: "0" });
      const num = parseInt(likesStr, 10);
      if (!isNaN(num) && num >= 0) {
        likes = num;
        break;
      }
      console.log("❌ 0以上の数値を入力してください。");
    }

    let retweets: number;
    while (true) {
      const rtStr = await input({ message: "リツイート数:", default: "0" });
      const num = parseInt(rtStr, 10);
      if (!isNaN(num) && num >= 0) {
        retweets = num;
        break;
      }
      console.log("❌ 0以上の数値を入力してください。");
    }

    // 返信を追加
    const replies: ThreadReply[] = [];
    let addingReplies = true;
    while (addingReplies) {
      const reply = await addReply();
      if (reply) {
        replies.push(reply);
        console.log(`✅ 返信を追加しました (計${replies.length}件)`);
      } else {
        addingReplies = false;
      }
    }

    const newThread: XThread = {
      id: generateId(),
      username,
      verified,
      languageCode,
      originalText,
      translatedText,
      likes,
      retweets,
      replies,
    };

    // プレビュー
    console.log("\n📝 追加するスレッド:");
    console.log("─".repeat(50));
    console.log(`ユーザー: ${username} ${verified ? "✓" : ""}`);
    console.log(`言語: ${languageCode}`);
    console.log(`原文: ${originalText.substring(0, 100)}${originalText.length > 100 ? "..." : ""}`);
    console.log(`翻訳: ${translatedText.substring(0, 100)}${translatedText.length > 100 ? "..." : ""}`);
    console.log(`エンゲージメント: ❤️ ${likes} 🔁 ${retweets} 💬 ${replies.length}`);
    console.log("─".repeat(50));

    const confirmAdd = await confirm({
      message: "この内容で追加しますか?",
      default: true,
    });

    if (confirmAdd) {
      mediaData.xThreads!.push(newThread);
      console.log("✅ 追加しました!");
    }

    addMore = await confirm({
      message: "続けてスレッドを追加しますか?",
      default: false,
    });
  }

  // 保存
  writeMediaRatings(mediaRatings);

  console.log(`\n✅ 保存しました! Xスレッド: ${mediaData.xThreads!.length}件`);
}

main().catch(console.error);
