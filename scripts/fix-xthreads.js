const fs = require("fs");
const ratings = JSON.parse(fs.readFileSync("src/data/media-ratings.json", "utf-8"));

// sano_kodai-20260217のxThreadsを修正
const idx = ratings.findIndex(r => r.matchId === "sano_kodai-20260217");
if (idx !== -1) {
  ratings[idx].xThreads = ratings[idx].xThreads.map(t => ({
    id: t.id,
    username: t.username,
    verified: t.verified,
    languageCode: t.languageCode,
    originalText: t.content || t.originalText,
    translatedText: t.contentTranslated || t.translatedText || "",
    likes: t.engagement ? t.engagement.likes : (t.likes || 0),
    retweets: t.engagement ? t.engagement.retweets : (t.retweets || 0),
    replies: []
  }));

  fs.writeFileSync("src/data/media-ratings.json", JSON.stringify(ratings, null, 2));
  console.log("xThreadsを修正しました");
  console.log(JSON.stringify(ratings[idx].xThreads, null, 2));
}
