/**
 * prebuild: match-inputs/<season>/ から手動更新済みファイルのmatchIdリストを生成
 * 「手動更新済み」= articles, thread_urls, highlight のいずれかにコンテンツがあるファイル
 * 全シーズンのサブフォルダを横断スキャン
 */
const fs = require("fs");
const path = require("path");

const inputDir = path.join(__dirname, "..", "match-inputs");
const outputFile = path.join(__dirname, "..", "src", "data", "match-inputs-index.json");

const curatedIds = [];
let totalFiles = 0;

// サブフォルダ（シーズン）を走査
const seasonDirs = fs.readdirSync(inputDir).filter((d) => {
  return fs.statSync(path.join(inputDir, d)).isDirectory();
});

for (const season of seasonDirs) {
  const seasonDir = path.join(inputDir, season);
  const files = fs.readdirSync(seasonDir).filter((f) => f.endsWith(".json"));
  totalFiles += files.length;

  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(seasonDir, f), "utf8"));
    const articles = data.articles || [];
    const threads = data.thread_urls || [];
    const highlight = data.highlight || "";

    if (articles.length > 0 || threads.length > 0 || highlight) {
      curatedIds.push(f.replace(".json", ""));
    }
  }
}

curatedIds.sort();
fs.writeFileSync(outputFile, JSON.stringify(curatedIds, null, 2));
console.log(`match-inputs-index.json: ${curatedIds.length}件（手動更新済み） / ${totalFiles}件中`);
