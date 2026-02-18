const fs = require("fs");
const ratings = JSON.parse(fs.readFileSync("src/data/media-ratings.json", "utf-8"));

const idx = ratings.findIndex(r => r.matchId === "sano_kodai-20260217");
if (idx !== -1) {
  // 新しいスレッドを追加（リプライ付き）
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
      replies: [
        { id: "r_sano_kodai-20260217_1_1", username: "@FootballFan_JP", languageCode: "EN", originalText: "Solid game from him today 👍", translatedText: "今日も安定した試合だった 👍", likes: 234 },
        { id: "r_sano_kodai-20260217_1_2", username: "@SoccerLover99", languageCode: "JA", originalText: "まあまあの出来、次はもっとやれる", translatedText: "", likes: 156 },
        { id: "r_sano_kodai-20260217_1_3", username: "@EredivisieFan", languageCode: "EN", originalText: "Expected more from him tbh", translatedText: "正直もっと期待してた", likes: 89 }
      ]
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
      replies: [
        { id: "r_sano_kodai-20260217_2_1", username: "@SamuraiBlue_Fan", languageCode: "JA", originalText: "相変わらず安定してる。よくやった！💪", translatedText: "", likes: 445 },
        { id: "r_sano_kodai-20260217_2_2", username: "@TacticsNerd", languageCode: "EN", originalText: "Always reliable. Great asset for the team.", translatedText: "いつも信頼できる。チームの財産だね。", likes: 312 },
        { id: "r_sano_kodai-20260217_2_3", username: "@MatchdayVibes", languageCode: "EN", originalText: "Not as impactful as the stats suggest", translatedText: "スタッツほどインパクトなかった", likes: 78 },
        { id: "r_sano_kodai-20260217_2_4", username: "@GoalDigger_", languageCode: "JA", originalText: "大きな試合でもっと活躍しないと", translatedText: "", likes: 156 }
      ]
    },
    {
      id: "t_sano_kodai-20260217_3",
      username: "@NECFans",
      verified: false,
      languageCode: "EN",
      originalText: "Another solid performance from Kodai Sano. Keep it up! 💪 Important player for us.",
      translatedText: "佐野航大、またしても堅実なパフォーマンス。この調子で！💪 チームにとって重要な選手だ。",
      likes: 456,
      retweets: 34,
      replies: [
        { id: "r_sano_kodai-20260217_3_1", username: "@PitchSideView", languageCode: "JA", originalText: "今日も安定した試合だった 👍", translatedText: "", likes: 123 },
        { id: "r_sano_kodai-20260217_3_2", username: "@FootyAnalysis", languageCode: "EN", originalText: "Needs to step up in bigger games", translatedText: "大きな試合でもっと活躍しないと", likes: 67 },
        { id: "r_sano_kodai-20260217_3_3", username: "@JLeagueWatcher", languageCode: "EN", originalText: "Consistent as always. Well done! 💪", translatedText: "相変わらず安定してる。よくやった！💪", likes: 198 }
      ]
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
      replies: [
        { id: "r_sano_kodai-20260217_4_1", username: "@EuroFootball_", languageCode: "EN", originalText: "Good performance, building momentum.", translatedText: "良いパフォーマンス、勢いが出てきた。", likes: 87 },
        { id: "r_sano_kodai-20260217_4_2", username: "@FootballTruth_", languageCode: "JA", originalText: "正直平均的。なぜ騒がれてるのかわからない", translatedText: "", likes: 34 }
      ]
    }
  ];

  fs.writeFileSync("src/data/media-ratings.json", JSON.stringify(ratings, null, 2));
  console.log("佐野航大のスレッドをリプライ付きで更新しました");
  console.log("スレッド数:", ratings[idx].xThreads.length);
  console.log("リプライ総数:", ratings[idx].xThreads.reduce((sum, t) => sum + t.replies.length, 0));
}
