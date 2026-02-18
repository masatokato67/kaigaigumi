const fs = require("fs");
const path = require("path");

const SITE_URL = "https://kaigaigumi-football.com";
const DATA_DIR = path.join(__dirname, "../src/data");

// データを読み込み
const players = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "players.json"), "utf-8"));
const matches = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "matches.json"), "utf-8"));

// 今日の日付
const today = new Date().toISOString().split("T")[0];

// URLリスト
const urls = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/players", priority: "0.9", changefreq: "daily" },
];

// 選手ページ
players.forEach((player) => {
  urls.push({
    loc: `/players/${player.id}`,
    priority: "0.8",
    changefreq: "daily",
  });
});

// 試合詳細ページ
matches.forEach((match) => {
  urls.push({
    loc: `/players/${match.playerId}/matches/${match.matchId}`,
    priority: "0.6",
    changefreq: "weekly",
  });
});

// サイトマップXMLを生成
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${SITE_URL}${url.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

// 保存
fs.writeFileSync(path.join(__dirname, "../public/sitemap.xml"), sitemap);
console.log(`サイトマップを生成しました: ${urls.length} URL`);
