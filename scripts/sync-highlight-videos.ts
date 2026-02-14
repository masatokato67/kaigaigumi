/**
 * highlight-videos.jsonとmatches.jsonを同期するスクリプト
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(__dirname, "../src/data");
const MATCHES_FILE = join(DATA_DIR, "matches.json");
const HIGHLIGHT_VIDEOS_FILE = join(DATA_DIR, "highlight-videos.json");

interface HighlightVideo {
  enabled: boolean;
  youtubeId: string;
  title: string;
}

interface Match {
  matchId: string;
}

const matches: Match[] = JSON.parse(readFileSync(MATCHES_FILE, "utf-8"));
const highlightVideos: Record<string, HighlightVideo> = JSON.parse(
  readFileSync(HIGHLIGHT_VIDEOS_FILE, "utf-8")
);

// 欠けているエントリを追加
let addedCount = 0;
for (const match of matches) {
  if (!highlightVideos[match.matchId]) {
    highlightVideos[match.matchId] = {
      enabled: false,
      youtubeId: "",
      title: "",
    };
    addedCount++;
    console.log(`[ADD] ${match.matchId}`);
  }
}

// 日付でソート（新しい順）
const sortedKeys = Object.keys(highlightVideos).sort((a, b) => {
  const dateA = a.split("-").pop() || "";
  const dateB = b.split("-").pop() || "";
  return dateB.localeCompare(dateA);
});

const sortedHighlightVideos: Record<string, HighlightVideo> = {};
for (const key of sortedKeys) {
  sortedHighlightVideos[key] = highlightVideos[key];
}

writeFileSync(
  HIGHLIGHT_VIDEOS_FILE,
  JSON.stringify(sortedHighlightVideos, null, 2)
);

console.log(`\n=== 完了: ${addedCount}件のエントリを追加しました ===`);
