const fs = require("fs");
const ratings = JSON.parse(fs.readFileSync("src/data/media-ratings.json", "utf-8"));

const idx = ratings.findIndex(r => r.matchId === "sano_kodai-20260217");
if (idx !== -1) {
  // 新しいスレッドを追加
  ratings[idx].xThreads = [
    {
      id: "t_sano_kodai-20260217_1",
      username: "@エールディヴィジNews",
      verified: true,
      languageCode: "EN",
      originalText: "Sparta Rotterdam 1-1 NEC. Kodai Sano played 90 minutes.",
      translatedText: "Sparta Rotterdam 1-1 NEC。佐野航大は90分間プレー。",
      likes: 1850,
      retweets: 144,
      replies: []
    },
    {
      id: "t_sano_kodai-20260217_2",
      username: "@JFootballNews",
      verified: true,
      languageCode: "JA",
      originalText: "【佐野航大】エールディヴィジ第24節、Sparta Rotterdam vs NECで90分出場。評価7.1を獲得。",
      translatedText: "",
      likes: 2342,
      retweets: 201,
      replies: []
    },
    {
      id: "t_sano_kodai-20260217_3",
      username: "@NECFans",
      verified: false,
      languageCode: "EN",
      originalText: "Kodai Sano did well today. Keep it up! 💪 Another solid performance. Important player for us.",
      translatedText: "佐野航大は今日良いプレーをした。この調子で！💪 またしても堅実なパフォーマンス。チームにとって重要な選手だ。",
      likes: 456,
      retweets: 34,
      replies: []
    },
    {
      id: "t_sano_kodai-20260217_4",
      username: "@FootballAnalyst",
      verified: true,
      languageCode: "EN",
      originalText: "Positive stats for Kodai Sano: 90min, efficient in his role. Maintaining consistency. Professional performance.",
      translatedText: "佐野航大のポジティブなスタッツ：90分、役割を効率的にこなした。安定感を維持。プロフェッショナルなパフォーマンス。",
      likes: 678,
      retweets: 89,
      replies: []
    }
  ];

  fs.writeFileSync("src/data/media-ratings.json", JSON.stringify(ratings, null, 2));
  console.log("佐野航大のスレッドを4件に更新しました");
}
