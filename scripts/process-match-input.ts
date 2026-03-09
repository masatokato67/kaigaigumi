/**
 * 試合入力ファイル処理スクリプト
 *
 * match-inputs/<matchId>.json を読み込み、
 * ハイライト動画・記事URL・SNS投稿を一括処理する。
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
  generateId,
} from "./lib/file-utils";
import { extractPlayerInfo } from "./lib/article-extractor";
import { extractVoice } from "./lib/voice-extractor";
import { extractThread } from "./lib/thread-extractor";
import type { MediaRating, LocalVoice, XThread, ThreadReply } from "../src/lib/types";

const INPUTS_DIR = join(process.cwd(), "match-inputs");

interface MatchInput {
  highlight?: string;
  articles?: string[];
  voice_urls?: string[];
  thread_urls?: string[];
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

  // mediaRatings は記事とvoice_urlsの両方で使う
  const mediaRatings = readMediaRatings();
  let mediaData = mediaRatings.find((m) => m.matchId === matchId);

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

    // テンプレート評価（isManualでないもの）を除外
    const templateCount = mediaData.ratings.filter((r) => !r.isManual).length;
    if (templateCount > 0) {
      mediaData.ratings = mediaData.ratings.filter((r) => r.isManual);
      console.log(`  [整理] テンプレート評価${templateCount}件を除外\n`);
    }

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

    // averageRatingはSofaScoreのデータを使用（記事評価では上書きしない）

    console.log(
      `📰 記事処理完了: 新規${newCount}件, スキップ${skipCount}件`
    );
    if (newCount > 0) updated = true;
  }

  // ── SNS投稿（現地の声）の処理 ──
  const voiceUrls = input.voice_urls || [];
  if (voiceUrls.length === 0) {
    console.log("💬 現地の声: 入力なし（スキップ）");
  } else {
    console.log(`\n💬 現地の声: ${voiceUrls.length}件を処理\n`);

    // 既存のvoiceからURL重複チェック用のSetを作成
    // LocalVoice型にはURLフィールドがないため、usernameとoriginalTextで重複判定
    const existingVoiceTexts = new Set(
      mediaData.localVoices.map((v) => v.originalText.slice(0, 50))
    );

    let newCount = 0;
    let skipCount = 0;

    for (const voiceUrl of voiceUrls) {
      try {
        const extracted = await extractVoice(
          voiceUrl,
          player.name.ja,
          player.name.en
        );

        // テキストの先頭50文字で重複チェック
        if (existingVoiceTexts.has(extracted.originalText.slice(0, 50))) {
          console.log(`  [スキップ] ${extracted.username}: 処理済み`);
          skipCount++;
          continue;
        }

        const newVoice: LocalVoice = {
          id: generateId(),
          username: extracted.username,
          role: extracted.role,
          roleKey: extracted.roleKey,
          languageCode: extracted.languageCode,
          originalText: extracted.originalText,
          translatedText: extracted.translatedText,
        };

        mediaData.localVoices.push(newVoice);
        existingVoiceTexts.add(extracted.originalText.slice(0, 50));
        newCount++;

        console.log(`  [追加] ${extracted.username} (${extracted.platform} / ${extracted.role})`);
        console.log(`         ${extracted.translatedText.slice(0, 60)}...`);
        console.log();
      } catch (error) {
        console.log(
          `  [エラー] ${voiceUrl}\n         ${error instanceof Error ? error.message : error}\n`
        );
      }
    }

    console.log(
      `💬 現地の声処理完了: 新規${newCount}件, スキップ${skipCount}件`
    );
    if (newCount > 0) updated = true;
  }

  // ── Xスレッド（thread_urls）の処理 ──
  const threadUrls = input.thread_urls || [];
  if (threadUrls.length === 0) {
    console.log("🐦 Xスレッド: 入力なし（スキップ）");
  } else {
    console.log(`\n🐦 Xスレッド: ${threadUrls.length}件を処理\n`);

    // 既存の手動スレッドのURL重複チェック用
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

        const newThread: XThread = {
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

        // 手動スレッドをリストの先頭に挿入
        const manualCount = mediaData.xThreads.filter((t) => t.isManual).length;
        mediaData.xThreads.splice(manualCount, 0, newThread);
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
  mediaData.lastUpdated = new Date().toISOString();
  writeMediaRatings(mediaRatings);

  // ── 結果サマリー ──
  console.log("\n" + "─".repeat(50));
  if (updated) {
    console.log("✅ データを更新しました");
    console.log("\n次のステップ:");
    console.log(
      `  git add src/data/ match-inputs/ && git commit -m "Update ${matchId}" && git push origin main`
    );
  } else {
    console.log("ℹ️  変更はありません");
  }
}

main().catch(console.error);
