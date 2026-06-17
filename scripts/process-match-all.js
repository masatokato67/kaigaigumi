/**
 * 手動更新済みの match-inputs ファイルを一括処理
 * Gemini APIレート制限（5回/分）を考慮して待機時間を挟む
 *
 * 使用方法:
 *   npm run process-match-all          # 全シーズンの手動更新済みファイルを処理
 *   npm run process-match-all 2025-26  # 特定シーズンのみ
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const INPUTS_DIR = path.join(__dirname, "..", "match-inputs");
const targetSeason = process.argv[2]; // オプション: シーズン指定

// シーズンサブフォルダを走査
const seasonDirs = fs.readdirSync(INPUTS_DIR).filter((d) => {
  if (targetSeason && d !== targetSeason) return false;
  return fs.statSync(path.join(INPUTS_DIR, d)).isDirectory();
});

// 手動更新済みファイルを収集
const targets = [];
for (const season of seasonDirs) {
  const dir = path.join(INPUTS_DIR, season);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const hasContent =
      (data.articles || []).length > 0 ||
      (data.thread_urls || []).length > 0 ||
      !!data.highlight;
    if (hasContent) {
      targets.push({ season, matchId: f.replace(".json", "") });
    }
  }
}

if (targets.length === 0) {
  console.log("処理対象の手動更新済みファイルがありません。");
  process.exit(0);
}

console.log(`\n=== ${targets.length}件の手動更新済みファイルを一括処理 ===\n`);

let processed = 0;
let failed = 0;

for (let i = 0; i < targets.length; i++) {
  const { season, matchId } = targets[i];
  console.log(`\n[${i + 1}/${targets.length}] ${matchId} (${season})`);
  console.log("─".repeat(50));

  try {
    execSync(`npx tsx scripts/process-match-input.ts ${matchId}`, {
      stdio: "inherit",
      timeout: 120000,
    });
    processed++;
  } catch (err) {
    console.log(`❌ 失敗: ${matchId}`);
    failed++;
  }

  // Gemini APIレート制限対策: 12秒待機（5回/分 = 12秒間隔）
  if (i < targets.length - 1) {
    console.log("\n⏳ APIレート制限回避のため12秒待機...");
    execSync("sleep 12");
  }
}

console.log(`\n${"═".repeat(50)}`);
console.log(`✅ 完了: ${processed}件処理, ${failed}件失敗`);
if (failed > 0) {
  console.log("⚠️  失敗したファイルは個別に再実行してください");
}
