/**
 * prebuild: match-inputs/ から手動更新済みファイルのmatchIdリストを生成
 * 「手動更新済み」= articles, thread_urls, highlight のいずれかにコンテンツがあるファイル
 */
const fs = require("fs");
const path = require("path");

const inputDir = path.join(__dirname, "..", "match-inputs");
const outputFile = path.join(__dirname, "..", "src", "data", "match-inputs-index.json");

const files = fs.readdirSync(inputDir).filter((f) => f.endsWith(".json"));

const curatedIds = [];

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(inputDir, f), "utf8"));
  const articles = data.articles || [];
  const threads = data.thread_urls || [];
  const highlight = data.highlight || "";

  if (articles.length > 0 || threads.length > 0 || highlight) {
    curatedIds.push(f.replace(".json", ""));
  }
}

curatedIds.sort();
fs.writeFileSync(outputFile, JSON.stringify(curatedIds, null, 2));
console.log(`match-inputs-index.json: ${curatedIds.length}件（手動更新済み） / ${files.length}件中`);
