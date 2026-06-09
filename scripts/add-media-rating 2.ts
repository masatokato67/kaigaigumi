/**
 * メディア評価 追加スクリプト（URL自動抽出版）
 * 記事URLからGemini APIで選手関連情報を抽出してコメントを生成
 *
 * 使用方法:
 *   npm run add-rating -- --match=<matchId>
 *   npm run add-rating -- --match=<matchId> --replace-auto
 */

import { select, input, confirm } from "@inquirer/prompts";
import {
  readMatches,
  readMediaRatings,
  writeMediaRatings,
  readPlayers,
} from "./lib/file-utils";
import { extractPlayerInfo } from "./lib/article-extractor";
import type { MediaRating } from "../src/lib/types";

async function main() {
  console.log("\n📰 メディア評価 追加スクリプト (AI記事抽出)\n");

  // コマンドライン引数の解析
  const args = process.argv.slice(2);
  let matchIdArg: string | undefined;
  let replaceAuto = false;

  for (const arg of args) {
    if (arg.startsWith("--match=")) {
      matchIdArg = arg.replace("--match=", "");
    }
    if (arg === "--replace-auto") {
      replaceAuto = true;
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
      console.log(`❌ メディアデータが見つかりません: ${matchIdArg}`);
      console.log("   先に試合を追加してください: npm run add-match");
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
          name: `${m.date} ${player?.name.ja || m.playerId} - ${m.homeTeam.name} ${m.homeTeam.score}-${m.awayTeam.score} ${m.awayTeam.name}`,
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

  if (!player) {
    console.log(`❌ 選手データが見つかりません`);
    process.exit(1);
  }

  console.log(`📍 試合: ${match?.date} ${player.name.ja}`);
  console.log(
    `   ${match?.homeTeam.name} ${match?.homeTeam.score} - ${match?.awayTeam.score} ${match?.awayTeam.name}`
  );

  const manualCount = mediaData.ratings.filter((r) => r.isManual).length;
  const autoCount = mediaData.ratings.filter((r) => !r.isManual).length;
  console.log(
    `   現在の評価: ${mediaData.ratings.length}件 (手動: ${manualCount}, 自動: ${autoCount})\n`
  );

  // --replace-auto: 自動生成レーティングを削除
  if (replaceAuto && autoCount > 0) {
    const confirmReplace = await confirm({
      message: `自動生成の評価 ${autoCount}件を削除しますか?`,
      default: false,
    });
    if (confirmReplace) {
      mediaData.ratings = mediaData.ratings.filter(
        (r) => r.isManual === true
      );
      console.log(`✅ 自動生成の評価を削除しました。\n`);
    }
  }

  // ループで複数のURL記事を追加
  let addMore = true;
  while (addMore) {
    // 記事URLを入力
    const articleUrl = await input({
      message: "記事URL:",
    });

    if (!articleUrl.startsWith("http")) {
      console.log("❌ 有効なURLを入力してください。");
      continue;
    }

    try {
      // Gemini APIで記事から選手情報を抽出
      const extracted = await extractPlayerInfo(
        articleUrl,
        player.name.ja,
        player.name.en
      );

      // プレビュー表示
      console.log("\n📝 抽出結果:");
      console.log("─".repeat(60));
      console.log(`メディア: ${extracted.source} (${extracted.country})`);
      if (extracted.rating !== undefined) {
        console.log(
          `スコア: ${extracted.rating}/${extracted.maxRating} [${extracted.ratingSystem}]`
        );
      } else {
        console.log("スコア: なし（記事内にスコアの記載なし）");
      }
      console.log(`\n原文:\n${extracted.comment}`);
      console.log(`\n日本語:\n${extracted.commentTranslated}`);
      console.log(`\nURL: ${articleUrl}`);
      console.log("─".repeat(60));

      // メディア名の修正を許可
      const editSource = await confirm({
        message: `メディア名「${extracted.source}」でOKですか?`,
        default: true,
      });

      let finalSource = extracted.source;
      if (!editSource) {
        finalSource = await input({
          message: "メディア名を入力:",
          default: extracted.source,
        });
      }

      const confirmAdd = await confirm({
        message: "この内容で追加しますか?",
        default: true,
      });

      if (confirmAdd) {
        const newRating: MediaRating = {
          source: finalSource,
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

        // 同一ソースの既存レーティングがあれば置き換え確認
        const existingIdx = mediaData.ratings.findIndex(
          (r) => r.source === finalSource
        );
        if (existingIdx !== -1) {
          const replaceExisting = await confirm({
            message: `${finalSource}の評価が既に存在します。置き換えますか?`,
            default: true,
          });
          if (replaceExisting) {
            mediaData.ratings[existingIdx] = newRating;
            console.log("✅ 既存の評価を置き換えました!");
          }
        } else {
          mediaData.ratings.push(newRating);
          console.log("✅ 追加しました!");
        }
      }
    } catch (error) {
      console.log(
        `\n❌ エラー: ${error instanceof Error ? error.message : error}`
      );
      console.log("   URLが正しいか、記事にアクセスできるか確認してください。\n");
    }

    addMore = await confirm({
      message: "続けて記事URLを追加しますか?",
      default: true,
    });
  }

  // 平均レーティングを再計算（記事スコアがあるもののみ）
  const ratedEntries = mediaData.ratings.filter(
    (r) => r.hasArticleRating || !r.isManual
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

  // lastUpdated を更新
  mediaData.lastUpdated = new Date().toISOString();

  // 保存
  writeMediaRatings(mediaRatings);

  const finalManual = mediaData.ratings.filter((r) => r.isManual).length;
  const finalAuto = mediaData.ratings.filter((r) => !r.isManual).length;
  console.log(
    `\n✅ 保存しました! 評価: ${mediaData.ratings.length}件 (手動: ${finalManual}, 自動: ${finalAuto})`
  );
}

main().catch(console.error);
