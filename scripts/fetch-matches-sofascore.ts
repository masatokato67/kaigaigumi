/**
 * SofaScore APIから試合データを取得するスクリプト
 * 既存データを保持しつつ、新規試合のみ追加
 *
 * 使用方法: npx tsx scripts/fetch-matches-sofascore.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// データファイルのパス
const DATA_DIR = join(__dirname, "../src/data");
const PLAYERS_FILE = join(DATA_DIR, "players.json");
const MATCHES_FILE = join(DATA_DIR, "matches.json");
const HIGHLIGHT_VIDEOS_FILE = join(DATA_DIR, "highlight-videos.json");
const MEDIA_RATINGS_FILE = join(DATA_DIR, "media-ratings.json");

// ハイライト動画の型
interface HighlightVideo {
  enabled: boolean;
  youtubeId: string;
  title: string;
}

// メディア評価の型
interface MediaRating {
  matchId: string;
  playerId: string;
  ratings: {
    source: string;
    country: string;
    rating: number;
    maxRating: number;
    ratingSystem: string;
    comment: string;
    commentTranslated: string;
  }[];
  averageRating: number;
  localVoices: {
    id: string;
    username: string;
    role: string;
    roleKey: string;
    languageCode: string;
    originalText: string;
    translatedText: string;
  }[];
  xThreads: {
    id: string;
    username: string;
    verified: boolean;
    languageCode: string;
    originalText: string;
    translatedText: string;
    likes: number;
    retweets: number;
    replies: { id: string; username: string; languageCode: string; originalText: string; translatedText: string; likes: number; }[];
  }[];
}

// 型定義
interface SofaScoreInfo {
  playerId: string;
}

interface Player {
  id: string;
  name: { ja: string; en: string };
  club: { name: string; shortName: string };
  league: { name: string; shortName: string; country: string };
  sofascore?: SofaScoreInfo;
  position: string;
}

interface Match {
  matchId: string;
  playerId: string;
  date: string;
  competition: string;
  homeTeam: { name: string; score: number };
  awayTeam: { name: string; score: number };
  playerStats: {
    minutesPlayed: number;
    goals: number;
    assists: number;
    starting: boolean;
    position: string;
    rating: number;
  };
  notable: boolean;
}

// SofaScore APIのレスポンス型
interface SofaScoreEvent {
  id: number;
  startTimestamp: number;
  tournament: {
    name: string;
    uniqueTournament?: {
      name: string;
    };
  };
  homeTeam: {
    name: string;
    shortName: string;
  };
  awayTeam: {
    name: string;
    shortName: string;
  };
  homeScore?: {
    current: number;
  };
  awayScore?: {
    current: number;
  };
  status: {
    type: string;
  };
}

interface SofaScorePlayerStats {
  statistics?: {
    minutesPlayed?: number;
    goals?: number;
    assists?: number;
    rating?: number;
    expectedGoals?: number;
    expectedAssists?: number;
  };
}

// リーグ名のマッピング（英語→日本語）
const LEAGUE_NAME_MAP: Record<string, string> = {
  "Premier League": "プレミアリーグ",
  "LaLiga": "ラ・リーガ",
  "La Liga": "ラ・リーガ",
  "Bundesliga": "ブンデスリーガ",
  "Eredivisie": "エールディヴィジ",
  "Serie A": "セリエA",
  "Ligue 1": "リーグ・アン",
  "UEFA Champions League": "チャンピオンズリーグ",
  "Champions League": "チャンピオンズリーグ",
  "UEFA Europa League": "ヨーロッパリーグ",
  "Europa League": "ヨーロッパリーグ",
  "UEFA Conference League": "カンファレンスリーグ",
  "Conference League": "カンファレンスリーグ",
  "FA Cup": "FAカップ",
  "EFL Cup": "カラバオカップ",
  "Carabao Cup": "カラバオカップ",
  "DFB-Pokal": "DFBポカール",
  "Copa del Rey": "コパ・デル・レイ",
  "KNVB Beker": "KNVBカップ",
  "KNVB Cup": "KNVBカップ",
};

// チーム名のマッピング（英語→日本語表記）
const TEAM_NAME_MAP: Record<string, string> = {
  "Brighton": "ブライトン",
  "Brighton & Hove Albion": "ブライトン",
  "Liverpool": "リヴァプール",
  "Manchester City": "マンチェスター・C",
  "Man City": "マンチェスター・C",
  "Manchester United": "マンチェスター・U",
  "Man Utd": "マンチェスター・U",
  "Arsenal": "アーセナル",
  "Chelsea": "チェルシー",
  "Tottenham": "トッテナム",
  "Tottenham Hotspur": "トッテナム",
  "Everton": "エヴァートン",
  "Crystal Palace": "クリスタルパレス",
  "Real Sociedad": "レアル・ソシエダ",
  "Barcelona": "バルセロナ",
  "Real Madrid": "レアル・マドリード",
  "Mainz": "マインツ",
  "Mainz 05": "マインツ",
  "1. FSV Mainz 05": "マインツ",
  "1.FSV Mainz 05": "マインツ",
  "NEC Nijmegen": "NEC",
  "NEC": "NEC",
  "Ajax": "アヤックス",
  "AFC Ajax": "アヤックス",
  "Wolfsburg": "ヴォルフスブルク",
  "VfL Wolfsburg": "ヴォルフスブルク",
  "Bayern Munich": "バイエルン",
  "Bayern München": "バイエルン",
  "Bayern": "バイエルン",
  "Borussia Dortmund": "ドルトムント",
  "Dortmund": "ドルトムント",
  "RB Leipzig": "ライプツィヒ",
  "Leipzig": "ライプツィヒ",
  "Augsburg": "アウクスブルク",
  "FC Augsburg": "アウクスブルク",
  "Freiburg": "フライブルク",
  "SC Freiburg": "フライブルク",
  "Stuttgart": "シュトゥットガルト",
  "VfB Stuttgart": "シュトゥットガルト",
  "Leverkusen": "レバークーゼン",
  "Bayer Leverkusen": "レバークーゼン",
  "Bayer 04 Leverkusen": "レバークーゼン",
  "Werder Bremen": "ブレーメン",
  "Frankfurt": "フランクフルト",
  "Eintracht Frankfurt": "フランクフルト",
  "Hoffenheim": "ホッフェンハイム",
  "TSG Hoffenheim": "ホッフェンハイム",
  "Mönchengladbach": "グラードバッハ",
  "Borussia Mönchengladbach": "グラードバッハ",
  "Union Berlin": "ウニオン・ベルリン",
  "1. FC Union Berlin": "ウニオン・ベルリン",
  "Heidenheim": "ハイデンハイム",
  "1. FC Heidenheim 1846": "ハイデンハイム",
  "St. Pauli": "ザンクト・パウリ",
  "FC St. Pauli": "ザンクト・パウリ",
  "Köln": "ケルン",
  "1. FC Köln": "ケルン",
  "AZ Alkmaar": "AZアルクマール",
  "AZ": "AZアルクマール",
  "PSV": "PSV",
  "PSV Eindhoven": "PSV",
  "Feyenoord": "フェイエノールト",
  "Fulham": "フラム",
  "Bournemouth": "ボーンマス",
  "AFC Bournemouth": "ボーンマス",
  "Brentford": "ブレントフォード",
  "Newcastle": "ニューカッスル",
  "Newcastle United": "ニューカッスル",
  "Leeds": "リーズ",
  "Leeds United": "リーズ",
  "West Ham": "ウェストハム",
  "West Ham United": "ウェストハム",
  "Aston Villa": "アストン・ヴィラ",
  "Nottingham Forest": "ノッティンガム・F",
  "Nott'm Forest": "ノッティンガム・F",
  "Wolves": "ウルヴス",
  "Wolverhampton": "ウルヴス",
  "Wolverhampton Wanderers": "ウルヴス",
  "Sunderland": "サンダーランド",
  "Burnley": "バーンリー",
  "Ipswich": "イプスウィッチ",
  "Ipswich Town": "イプスウィッチ",
  "Southampton": "サウサンプトン",
  "Leicester": "レスター",
  "Leicester City": "レスター",
};

// HTTPヘッダー
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
};

// 2025-26シーズンの開始日（2025年7月1日以降の試合のみ取得）
const SEASON_START_DATE = new Date("2025-07-01");

// リーグ別メディアソース
const LEAGUE_MEDIA_SOURCES: Record<string, { source: string; country: string }[]> = {
  "プレミアリーグ": [
    { source: "Sky Sports", country: "イングランド" },
    { source: "BBC Sport", country: "イングランド" },
    { source: "The Guardian", country: "イングランド" },
  ],
  "ラ・リーガ": [
    { source: "Marca", country: "スペイン" },
    { source: "AS", country: "スペイン" },
    { source: "Mundo Deportivo", country: "スペイン" },
  ],
  "ブンデスリーガ": [
    { source: "Kicker", country: "ドイツ" },
    { source: "Bild", country: "ドイツ" },
    { source: "Sport1", country: "ドイツ" },
  ],
  "エールディヴィジ": [
    { source: "Voetbal International", country: "オランダ" },
    { source: "De Telegraaf", country: "オランダ" },
    { source: "ESPN NL", country: "オランダ" },
  ],
  "セリエA": [
    { source: "Gazzetta dello Sport", country: "イタリア" },
    { source: "Corriere dello Sport", country: "イタリア" },
    { source: "Tuttosport", country: "イタリア" },
  ],
  "default": [
    { source: "WhoScored", country: "国際" },
    { source: "SofaScore", country: "国際" },
    { source: "FotMob", country: "国際" },
  ],
};

// 評価に基づくコメントテンプレート
const RATING_COMMENTS: Record<string, { en: string; ja: string }[]> = {
  excellent: [
    { en: "Outstanding performance. Dominated the game and was a constant threat.", ja: "傑出したパフォーマンス。試合を支配し、常に脅威となった。" },
    { en: "Man of the match caliber display. Exceptional in every aspect.", ja: "マン・オブ・ザ・マッチ級の活躍。あらゆる面で卓越していた。" },
    { en: "Brilliant showing. One of the best performances of the season.", ja: "素晴らしいプレー。今シーズン最高のパフォーマンスの一つ。" },
  ],
  good: [
    { en: "Solid performance. Contributed well to the team's play.", ja: "堅実なパフォーマンス。チームのプレーに貢献した。" },
    { en: "Impressive display. Showed quality throughout the match.", ja: "印象的な活躍。試合を通じてクオリティを見せた。" },
    { en: "Effective performance. Made an impact when it mattered.", ja: "効果的なプレー。重要な場面で存在感を示した。" },
  ],
  average: [
    { en: "Decent showing. Did the basics well but nothing spectacular.", ja: "まずまずのプレー。基本はこなしたが、目立った活躍はなかった。" },
    { en: "Standard performance. Met expectations without exceeding them.", ja: "標準的なパフォーマンス。期待通りだが、それ以上ではなかった。" },
    { en: "Workmanlike display. Fulfilled his duties adequately.", ja: "堅実な仕事ぶり。役割を十分に果たした。" },
  ],
  poor: [
    { en: "Struggled to make an impact. Not his best day.", ja: "インパクトを残せなかった。ベストの日ではなかった。" },
    { en: "Quiet performance. Needs to improve in the coming matches.", ja: "静かなパフォーマンス。今後の試合での改善が必要。" },
    { en: "Below par showing. Failed to influence the game.", ja: "期待以下のプレー。試合に影響を与えられなかった。" },
  ],
};

// ローカルボイスのロールテンプレート
const VOICE_ROLES = [
  { role: "サポーター", roleKey: "supporter" },
  { role: "アナリスト", roleKey: "analyst" },
  { role: "ジャーナリスト", roleKey: "journalist" },
];

/**
 * 評価レベルを取得
 */
function getRatingLevel(rating: number): string {
  if (rating >= 7.5) return "excellent";
  if (rating >= 6.5) return "good";
  if (rating >= 5.5) return "average";
  return "poor";
}

/**
 * ランダムな要素を取得
 */
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// リプライのユーザー名テンプレート
const REPLY_USERNAMES = [
  "@FootballFan_JP", "@SoccerLover99", "@JLeagueWatcher", "@EuroFootball_",
  "@TacticsNerd", "@MatchdayVibes", "@GoalDigger_", "@PitchSideView",
  "@FootyAnalysis", "@SamuraiBlue_Fan", "@BundesligaFan", "@LaLigaLover",
  "@PremFan2024", "@EredivisieFan", "@SerieAWatch", "@FootballTruth_"
];

// ポジティブなリプライテンプレート（英語）
const POSITIVE_REPLIES_EN: Record<string, string[]> = {
  excellent: [
    "Absolutely world class today! 🔥",
    "Best player on the pitch, no doubt!",
    "This is why top clubs are watching him 👀",
    "Incredible performance. Keep it up! 💪",
    "What a display! Europe's elite should take notice.",
  ],
  good: [
    "Solid game from him today 👍",
    "Always reliable. Great asset for the team.",
    "Good performance, building momentum.",
    "Impressed with his work rate today!",
    "Consistent as always. Well done! 💪",
  ],
  average: [
    "Not bad, room for improvement though",
    "Decent effort, will be better next time",
    "Okay performance, I believe in him",
    "Average day but still contributed",
    "He'll bounce back stronger 💪",
  ],
  poor: [
    "Rough day but everyone has off days",
    "Not his best but he'll come back stronger",
    "Bad game happens, still support him!",
    "Keep your head up! Next game will be better",
    "One bad game doesn't define a player",
  ],
};

// ネガティブなリプライテンプレート（英語）
const NEGATIVE_REPLIES_EN: Record<string, string[]> = {
  excellent: [
    "Good game but let's see consistency first",
    "One good game doesn't make him elite",
    "Still needs to improve decision making",
    "Decent but overhyped imo",
    "Good performance but the team carried him sometimes",
  ],
  good: [
    "Expected more from him tbh",
    "Could have done better in key moments",
    "Not as impactful as the stats suggest",
    "Average at best, don't get the hype",
    "Needs to step up in bigger games",
  ],
  average: [
    "Invisible for most of the game...",
    "Not good enough for this level",
    "Disappointing, expected more",
    "Where was he when it mattered?",
    "Needs to do more to justify his place",
  ],
  poor: [
    "Worst performance I've seen from him",
    "Maybe not ready for this level yet?",
    "Time to bench him for a while",
    "Terrible game. No excuses.",
    "Honestly, he let the team down today",
  ],
};

// ポジティブなリプライテンプレート（日本語）
const POSITIVE_REPLIES_JA: Record<string, string[]> = {
  excellent: [
    "今日は本当に素晴らしかった！🔥",
    "ピッチで一番の選手だった！",
    "トップクラブが注目するのも納得 👀",
    "信じられないパフォーマンス。この調子で！💪",
    "さすが！欧州のビッグクラブも見てるはず。",
  ],
  good: [
    "今日も安定した試合だった 👍",
    "いつも信頼できる。チームの財産だね。",
    "良いパフォーマンス、勢いが出てきた。",
    "今日の運動量には感心した！",
    "相変わらず安定してる。よくやった！💪",
  ],
  average: [
    "悪くはない、でも改善の余地はあるかな",
    "まあまあの出来、次はもっとやれる",
    "普通のパフォーマンスだったけど、信じてる",
    "平均的な日だったけど、貢献はした",
    "次はもっと強く戻ってくるよ 💪",
  ],
  poor: [
    "厳しい日だったけど、誰にでもある",
    "ベストじゃなかったけど、挽回するよ",
    "悪い試合もある、それでも応援！",
    "頭を上げて！次の試合は良くなる",
    "1試合の悪いゲームで選手は決まらない",
  ],
};

// ネガティブなリプライテンプレート（日本語）
const NEGATIVE_REPLIES_JA: Record<string, string[]> = {
  excellent: [
    "良い試合だけど、継続性を見せてほしい",
    "1試合良くても、それでエリートとは言えない",
    "まだ判断力の改善が必要だと思う",
    "まあまあだけど、過大評価されすぎでは",
    "良いパフォーマンスだけど、チームに助けられた場面も",
  ],
  good: [
    "正直もっと期待してた",
    "重要な場面でもっとできたはず",
    "スタッツほどインパクトなかった",
    "正直平均的。なぜ騒がれてるのかわからない",
    "大きな試合でもっと活躍しないと",
  ],
  average: [
    "試合のほとんどで存在感なかった...",
    "このレベルには足りてないかも",
    "がっかり、もっとできると思ってた",
    "肝心な時にどこにいた？",
    "ポジション確保するにはもっとやらないと",
  ],
  poor: [
    "今まで見た中で最悪のパフォーマンス",
    "このレベルにはまだ早いのかも？",
    "しばらくベンチでいいと思う",
    "ひどい試合。言い訳できない。",
    "正直、今日はチームの足を引っ張った",
  ],
};

/**
 * スレッドへのリプライを生成
 */
function generateReplies(
  matchId: string,
  threadIndex: number,
  player: Player,
  ratingLevel: string,
  count: number = 3
): { id: string; username: string; languageCode: string; originalText: string; translatedText: string; likes: number }[] {
  const replies = [];
  const usedUsernames = new Set<string>();

  for (let i = 0; i < count; i++) {
    // ランダムなユーザー名を選択（重複なし）
    let username;
    do {
      username = randomChoice(REPLY_USERNAMES);
    } while (usedUsernames.has(username));
    usedUsernames.add(username);

    // ポジティブかネガティブかをランダムに決定（6:4の比率）
    const isPositive = Math.random() < 0.6;

    // 言語をランダムに決定（英語:日本語 = 5:5）
    const isEnglish = Math.random() < 0.5;

    let originalText: string;
    let translatedText: string;

    if (isEnglish) {
      if (isPositive) {
        originalText = randomChoice(POSITIVE_REPLIES_EN[ratingLevel]);
        // 日本語訳を生成
        const jaIdx = POSITIVE_REPLIES_EN[ratingLevel].indexOf(originalText);
        translatedText = POSITIVE_REPLIES_JA[ratingLevel][jaIdx] || POSITIVE_REPLIES_JA[ratingLevel][0];
      } else {
        originalText = randomChoice(NEGATIVE_REPLIES_EN[ratingLevel]);
        const jaIdx = NEGATIVE_REPLIES_EN[ratingLevel].indexOf(originalText);
        translatedText = NEGATIVE_REPLIES_JA[ratingLevel][jaIdx] || NEGATIVE_REPLIES_JA[ratingLevel][0];
      }
    } else {
      if (isPositive) {
        originalText = randomChoice(POSITIVE_REPLIES_JA[ratingLevel]);
        translatedText = ""; // 日本語なので翻訳不要
      } else {
        originalText = randomChoice(NEGATIVE_REPLIES_JA[ratingLevel]);
        translatedText = "";
      }
    }

    replies.push({
      id: `r_${matchId}_${threadIndex}_${i + 1}`,
      username,
      languageCode: isEnglish ? "EN" : "JA",
      originalText,
      translatedText,
      likes: Math.floor(10 + Math.random() * 500),
    });
  }

  return replies;
}

/**
 * メディア評価データを生成
 */
function generateMediaRating(match: Match, player: Player): MediaRating {
  const mediaSources = LEAGUE_MEDIA_SOURCES[match.competition] || LEAGUE_MEDIA_SOURCES["default"];
  const ratingLevel = getRatingLevel(match.playerStats.rating);
  const comments = RATING_COMMENTS[ratingLevel];

  // 基本レーティングに少し変動を加える
  const baseRating = match.playerStats.rating;
  const ratings = mediaSources.map((source, index) => {
    const variation = (Math.random() - 0.5) * 0.4; // ±0.2の変動
    const adjustedRating = Math.round((baseRating + variation) * 10) / 10;
    const comment = comments[index % comments.length];
    return {
      source: source.source,
      country: source.country,
      rating: Math.max(1, Math.min(10, adjustedRating)),
      maxRating: 10,
      ratingSystem: "standard",
      comment: comment.en,
      commentTranslated: comment.ja,
    };
  });

  // 平均レーティングを計算
  const averageRating = Math.round(
    (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10
  ) / 10;

  // ローカルボイスを生成
  const localVoices = VOICE_ROLES.map((roleInfo, index) => ({
    id: `v_${match.matchId}_${index + 1}`,
    username: `@${player.club.shortName.replace(/[・\s]/g, "")}_Fan${index + 1}`,
    role: roleInfo.role,
    roleKey: roleInfo.roleKey,
    languageCode: "EN",
    originalText: generateVoiceComment(player, match, ratingLevel),
    translatedText: generateVoiceCommentJa(player, match, ratingLevel),
  }));

  // Xスレッドを生成（各スレッドに2-4件のリプライを追加）
  const xThreads = [
    // 1. リーグ公式ニュース（英語）
    {
      id: `t_${match.matchId}_1`,
      username: `@${match.competition.replace(/[・\s]/g, "")}News`,
      verified: true,
      languageCode: "EN",
      originalText: `${match.homeTeam.name} ${match.homeTeam.score}-${match.awayTeam.score} ${match.awayTeam.name}. ${player.name.en} played ${match.playerStats.minutesPlayed} minutes.`,
      translatedText: `${match.homeTeam.name} ${match.homeTeam.score}-${match.awayTeam.score} ${match.awayTeam.name}。${player.name.ja}は${match.playerStats.minutesPlayed}分間プレー。`,
      likes: Math.floor(500 + Math.random() * 2000),
      retweets: Math.floor(50 + Math.random() * 300),
      replies: generateReplies(match.matchId, 1, player, ratingLevel, 3),
    },
    // 2. 日本サッカーニュース
    {
      id: `t_${match.matchId}_2`,
      username: "@JFootballNews",
      verified: true,
      languageCode: "JA",
      originalText: `【${player.name.ja}】${match.competition}第${Math.floor(Math.random() * 30) + 1}節、${match.homeTeam.name} vs ${match.awayTeam.name}で${match.playerStats.minutesPlayed}分出場。評価${averageRating}を獲得。`,
      translatedText: "",
      likes: Math.floor(1000 + Math.random() * 3000),
      retweets: Math.floor(100 + Math.random() * 500),
      replies: generateReplies(match.matchId, 2, player, ratingLevel, 4),
    },
    // 3. 現地サポーターの反応
    {
      id: `t_${match.matchId}_3`,
      username: `@${player.club.shortName.replace(/[・\s]/g, "")}Fans`,
      verified: false,
      languageCode: "EN",
      originalText: generateFanThreadComment(player, match, ratingLevel),
      translatedText: generateFanThreadCommentJa(player, match, ratingLevel),
      likes: Math.floor(200 + Math.random() * 1000),
      retweets: Math.floor(20 + Math.random() * 100),
      replies: generateReplies(match.matchId, 3, player, ratingLevel, 3),
    },
    // 4. サッカーアナリスト
    {
      id: `t_${match.matchId}_4`,
      username: "@FootballAnalyst",
      verified: true,
      languageCode: "EN",
      originalText: generateAnalystComment(player, match, ratingLevel),
      translatedText: generateAnalystCommentJa(player, match, ratingLevel),
      likes: Math.floor(300 + Math.random() * 1500),
      retweets: Math.floor(30 + Math.random() * 200),
      replies: generateReplies(match.matchId, 4, player, ratingLevel, 2),
    },
  ];

  // 5. ゴールやアシストがあれば追加スレッド
  if (match.playerStats.goals > 0 || match.playerStats.assists > 0) {
    const goalText = match.playerStats.goals > 0 ? `⚽ ${match.playerStats.goals}ゴール` : "";
    const assistText = match.playerStats.assists > 0 ? `🅰️ ${match.playerStats.assists}アシスト` : "";
    xThreads.push({
      id: `t_${match.matchId}_5`,
      username: "@SoccerKingJP",
      verified: true,
      languageCode: "JA",
      originalText: `${player.name.ja}が${goalText}${goalText && assistText ? "、" : ""}${assistText}の活躍！${match.homeTeam.name} ${match.homeTeam.score}-${match.awayTeam.score} ${match.awayTeam.name} 🇯🇵`,
      translatedText: "",
      likes: Math.floor(3000 + Math.random() * 5000),
      retweets: Math.floor(500 + Math.random() * 1000),
      replies: generateReplies(match.matchId, 5, player, ratingLevel, 4),
    });
  }

  // 6. 高評価の場合は追加スレッド
  if (ratingLevel === "excellent") {
    xThreads.push({
      id: `t_${match.matchId}_6`,
      username: "@WorldSoccerJP",
      verified: true,
      languageCode: "JA",
      originalText: `🌟 ${player.name.ja}が圧巻のパフォーマンス！評価${averageRating}でチームを牽引。${match.competition}で存在感を示す。`,
      translatedText: "",
      likes: Math.floor(2000 + Math.random() * 4000),
      retweets: Math.floor(400 + Math.random() * 800),
      replies: generateReplies(match.matchId, 6, player, ratingLevel, 3),
    });
  }

  return {
    matchId: match.matchId,
    playerId: player.id,
    ratings,
    averageRating,
    localVoices,
    xThreads,
  };
}

/**
 * ボイスコメントを生成（英語）
 */
function generateVoiceComment(player: Player, match: Match, level: string): string {
  const templates: Record<string, string[]> = {
    excellent: [
      `${player.name.en} was absolutely brilliant today! Best player on the pitch.`,
      `What a performance from ${player.name.en}! Class act from start to finish.`,
      `${player.name.en} dominated the game. World class display!`,
    ],
    good: [
      `${player.name.en} had a solid game. Good contribution overall.`,
      `Pleased with ${player.name.en}'s performance. Did his job well.`,
      `${player.name.en} showing why he's so valuable to the team.`,
    ],
    average: [
      `${player.name.en} was okay today. Nothing special but did the basics.`,
      `Average day for ${player.name.en}. We've seen better from him.`,
      `${player.name.en} did what was needed. Hoping for more next time.`,
    ],
    poor: [
      `Not ${player.name.en}'s best day. He'll bounce back.`,
      `${player.name.en} struggled today. Tough match for him.`,
      `Quiet game from ${player.name.en}. Needs to improve.`,
    ],
  };
  return randomChoice(templates[level]);
}

/**
 * ボイスコメントを生成（日本語）
 */
function generateVoiceCommentJa(player: Player, match: Match, level: string): string {
  const templates: Record<string, string[]> = {
    excellent: [
      `${player.name.ja}は今日本当に素晴らしかった！ピッチで最高の選手だった。`,
      `${player.name.ja}のパフォーマンスは最高だった！最初から最後までクラスの違いを見せた。`,
      `${player.name.ja}が試合を支配した。ワールドクラスのプレー！`,
    ],
    good: [
      `${player.name.ja}は堅実な試合だった。全体的に良い貢献。`,
      `${player.name.ja}のパフォーマンスに満足。しっかり仕事をした。`,
      `${player.name.ja}がチームにとって貴重な存在である理由を示した。`,
    ],
    average: [
      `${player.name.ja}は今日はまあまあだった。特別ではないが基本はこなした。`,
      `${player.name.ja}にとって平均的な日。もっと良いプレーを見たことがある。`,
      `${player.name.ja}は必要なことをした。次はもっと期待したい。`,
    ],
    poor: [
      `${player.name.ja}にとってベストの日ではなかった。次は挽回してくれるだろう。`,
      `${player.name.ja}は今日苦しんだ。厳しい試合だった。`,
      `${player.name.ja}は静かな試合だった。改善が必要。`,
    ],
  };
  return randomChoice(templates[level]);
}

/**
 * ファンスレッドコメントを生成（英語）
 */
function generateFanThreadComment(player: Player, match: Match, level: string): string {
  const templates: Record<string, string[]> = {
    excellent: [
      `${player.name.en} is on fire! 🔥 What a player we have!`,
      `Incredible display from ${player.name.en}! This is why we love him!`,
      `${player.name.en} proving his worth once again. Absolutely brilliant!`,
    ],
    good: [
      `Another solid performance from ${player.name.en}. Keep it up! 💪`,
      `${player.name.en} did well today. Good to see him contributing.`,
      `Happy with ${player.name.en}'s work rate. Important player for us.`,
    ],
    average: [
      `${player.name.en} had an okay game. Nothing spectacular but got the job done.`,
      `Decent effort from ${player.name.en}. Room for improvement though.`,
      `${player.name.en} was alright. We know he can do better.`,
    ],
    poor: [
      `Tough day for ${player.name.en}. Hope he bounces back soon.`,
      `Not ${player.name.en}'s day today. We still support him! 🙌`,
      `${player.name.en} struggled but these things happen. Next time!`,
    ],
  };
  return randomChoice(templates[level]);
}

/**
 * ファンスレッドコメントを生成（日本語）
 */
function generateFanThreadCommentJa(player: Player, match: Match, level: string): string {
  const templates: Record<string, string[]> = {
    excellent: [
      `${player.name.ja}が絶好調！🔥 素晴らしい選手だ！`,
      `${player.name.ja}の信じられないプレー！だから彼が大好きなんだ！`,
      `${player.name.ja}がまたしても価値を証明。本当に素晴らしい！`,
    ],
    good: [
      `${player.name.ja}、またしても堅実なパフォーマンス。この調子で！💪`,
      `${player.name.ja}は今日良いプレーをした。貢献してくれて嬉しい。`,
      `${player.name.ja}の運動量に満足。チームにとって重要な選手だ。`,
    ],
    average: [
      `${player.name.ja}はまあまあの試合だった。派手ではないが仕事はした。`,
      `${player.name.ja}、まずまずの出来。改善の余地はある。`,
      `${player.name.ja}は悪くなかった。もっとできることはわかってる。`,
    ],
    poor: [
      `${player.name.ja}にとって厳しい日だった。早く復調してほしい。`,
      `今日は${player.name.ja}の日ではなかった。それでも応援してる！🙌`,
      `${player.name.ja}は苦しんだが、こういうこともある。次がある！`,
    ],
  };
  return randomChoice(templates[level]);
}

/**
 * アナリストコメントを生成（英語）
 */
function generateAnalystComment(player: Player, match: Match, level: string): string {
  const templates: Record<string, string[]> = {
    excellent: [
      `${player.name.en} with an outstanding tactical display. Reading the game brilliantly.`,
      `Key stats for ${player.name.en}: ${match.playerStats.minutesPlayed}min played, excellent positioning throughout.`,
      `${player.name.en} dominated his zone. Top-class technical ability on show.`,
    ],
    good: [
      `${player.name.en} showed good decision-making today. Solid overall contribution.`,
      `Positive stats for ${player.name.en}: ${match.playerStats.minutesPlayed}min, efficient in his role.`,
      `${player.name.en} maintaining consistency. Professional performance.`,
    ],
    average: [
      `${player.name.en} had mixed moments. Some good, some areas to work on.`,
      `Stats show ${player.name.en} was average today. ${match.playerStats.minutesPlayed}min played.`,
      `${player.name.en} needs to find more consistency in his game.`,
    ],
    poor: [
      `${player.name.en} struggled with the tactical setup today. Needs adjustment.`,
      `Below-par performance from ${player.name.en}. Limited impact on the game.`,
      `${player.name.en} will want to forget this one. Room for improvement.`,
    ],
  };
  return randomChoice(templates[level]);
}

/**
 * アナリストコメントを生成（日本語）
 */
function generateAnalystCommentJa(player: Player, match: Match, level: string): string {
  const templates: Record<string, string[]> = {
    excellent: [
      `${player.name.ja}、傑出した戦術的なプレー。試合を見事に読んでいた。`,
      `${player.name.ja}の主要スタッツ：${match.playerStats.minutesPlayed}分出場、試合を通じて優れたポジショニング。`,
      `${player.name.ja}がゾーンを支配。トップクラスの技術力を披露。`,
    ],
    good: [
      `${player.name.ja}、今日は良い判断力を見せた。全体的に堅実な貢献。`,
      `${player.name.ja}のポジティブなスタッツ：${match.playerStats.minutesPlayed}分、役割を効率的にこなした。`,
      `${player.name.ja}、安定感を維持。プロフェッショナルなパフォーマンス。`,
    ],
    average: [
      `${player.name.ja}、良い場面と改善が必要な場面が混在。`,
      `スタッツは${player.name.ja}が今日は平均的だったことを示す。${match.playerStats.minutesPlayed}分出場。`,
      `${player.name.ja}、プレーの一貫性をもっと見つける必要がある。`,
    ],
    poor: [
      `${player.name.ja}、今日の戦術的セットアップに苦しんだ。調整が必要。`,
      `${player.name.ja}、期待以下のパフォーマンス。試合への影響は限定的。`,
      `${player.name.ja}、この試合は忘れたいだろう。改善の余地あり。`,
    ],
  };
  return randomChoice(templates[level]);
}

/**
 * チーム名を日本語表記に変換
 */
function translateTeamName(name: string): string {
  if (TEAM_NAME_MAP[name]) {
    return TEAM_NAME_MAP[name];
  }

  // 部分一致を試す
  for (const [key, value] of Object.entries(TEAM_NAME_MAP)) {
    if (name.includes(key) || key.includes(name)) {
      return value;
    }
  }

  return name;
}

/**
 * リーグ名を日本語表記に変換
 */
function translateLeagueName(name: string): string {
  if (LEAGUE_NAME_MAP[name]) {
    return LEAGUE_NAME_MAP[name];
  }

  for (const [key, value] of Object.entries(LEAGUE_NAME_MAP)) {
    if (name.includes(key) || key.includes(name)) {
      return value;
    }
  }

  return name;
}

/**
 * SofaScore APIから選手の試合データを取得
 */
async function fetchPlayerMatches(player: Player): Promise<Match[]> {
  if (!player.sofascore) {
    console.log(`  [SKIP] ${player.name.ja}: SofaScore情報がありません`);
    return [];
  }

  const { playerId } = player.sofascore;
  const eventsUrl = `https://api.sofascore.com/api/v1/player/${playerId}/events/last/0`;

  console.log(`  [FETCH] ${player.name.ja}: SofaScore ID ${playerId}`);

  try {
    // 試合一覧を取得
    const eventsResponse = await fetch(eventsUrl, { headers: HEADERS });

    if (!eventsResponse.ok) {
      console.log(`  [ERROR] HTTPエラー: ${eventsResponse.status}`);
      return [];
    }

    const eventsData = await eventsResponse.json();
    const events: SofaScoreEvent[] = eventsData.events || [];

    if (events.length === 0) {
      console.log(`  [INFO] 試合データがありません`);
      return [];
    }

    const matches: Match[] = [];

    // 終了した試合のみ処理（2025-26シーズン以降、最新30件まで）
    const finishedEvents = events
      .filter((e) => {
        if (e.status.type !== "finished") return false;
        const matchDate = new Date(e.startTimestamp * 1000);
        return matchDate >= SEASON_START_DATE;
      })
      .slice(0, 30);

    for (const event of finishedEvents) {
      // 日付をパース
      const matchDate = new Date(event.startTimestamp * 1000);
      const dateStr = matchDate.toISOString().split("T")[0];

      // matchIdを生成
      const matchId = `${player.id}-${dateStr.replace(/-/g, "")}`;

      // 選手の試合統計を取得
      const statsUrl = `https://api.sofascore.com/api/v1/event/${event.id}/player/${playerId}/statistics`;

      let playerStats: SofaScorePlayerStats = {};
      try {
        const statsResponse = await fetch(statsUrl, { headers: HEADERS });
        if (statsResponse.ok) {
          playerStats = await statsResponse.json();
        }
      } catch {
        // 統計取得に失敗した場合はスキップ
        continue;
      }

      const stats = playerStats.statistics;

      // 出場していない試合はスキップ
      if (!stats || stats.minutesPlayed === undefined || stats.minutesPlayed === 0) {
        continue;
      }

      // チーム名を取得
      const homeTeamName = translateTeamName(event.homeTeam.name);
      const awayTeamName = translateTeamName(event.awayTeam.name);

      // 大会名
      const tournamentName = event.tournament.uniqueTournament?.name || event.tournament.name;
      const competition = translateLeagueName(tournamentName);

      // レーティング
      const rating = stats.rating || 6.5;

      // notableかどうか判定
      const goals = stats.goals || 0;
      const assists = stats.assists || 0;
      const isNotable = goals > 0 || assists >= 2 || rating >= 8.0;

      const match: Match = {
        matchId,
        playerId: player.id,
        date: dateStr,
        competition,
        homeTeam: {
          name: homeTeamName,
          score: event.homeScore?.current || 0,
        },
        awayTeam: {
          name: awayTeamName,
          score: event.awayScore?.current || 0,
        },
        playerStats: {
          minutesPlayed: stats.minutesPlayed,
          goals,
          assists,
          starting: stats.minutesPlayed >= 60, // 60分以上なら先発と推定
          position: player.position,
          rating: Math.round(rating * 10) / 10,
        },
        notable: isNotable,
      };

      matches.push(match);

      // レート制限を避けるため少し待つ
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log(`  [SUCCESS] ${matches.length}件の試合を取得`);
    return matches;
  } catch (error) {
    console.log(`  [ERROR] 取得失敗: ${error}`);
    return [];
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log("=== 試合データ自動取得スクリプト (SofaScore API) ===\n");

  // データファイルを読み込み
  const players: Player[] = JSON.parse(readFileSync(PLAYERS_FILE, "utf-8"));
  const existingMatches: Match[] = JSON.parse(readFileSync(MATCHES_FILE, "utf-8"));

  // 既存の試合IDをセットで管理
  const existingMatchIds = new Set(existingMatches.map((m) => m.matchId));

  let newMatchCount = 0;
  const newMatches: Match[] = [];

  for (const player of players) {
    console.log(`\n処理中: ${player.name.ja} (${player.club.shortName})`);

    const fetchedMatches = await fetchPlayerMatches(player);

    for (const match of fetchedMatches) {
      if (existingMatchIds.has(match.matchId)) {
        continue; // 既存の試合はスキップ
      }

      newMatches.push(match);
      existingMatchIds.add(match.matchId);
      newMatchCount++;
      console.log(`  [NEW] ${match.date}: ${match.homeTeam.name} ${match.homeTeam.score}-${match.awayTeam.score} ${match.awayTeam.name}`);
    }

    // レート制限を避けるため少し待つ
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (newMatchCount > 0) {
    // 新しい試合を追加して保存
    const allMatches = [...existingMatches, ...newMatches];

    // 日付でソート（新しい順）
    allMatches.sort((a, b) => b.date.localeCompare(a.date));

    writeFileSync(MATCHES_FILE, JSON.stringify(allMatches, null, 2));

    // highlight-videos.json に新しい試合のエントリを追加
    const highlightVideos: Record<string, HighlightVideo> = JSON.parse(
      readFileSync(HIGHLIGHT_VIDEOS_FILE, "utf-8")
    );

    for (const match of newMatches) {
      if (!highlightVideos[match.matchId]) {
        highlightVideos[match.matchId] = {
          enabled: false,
          youtubeId: "",
          title: "",
        };
      }
    }

    // matchIdでソートして保存（新しい順）
    const sortedHighlightVideos: Record<string, HighlightVideo> = {};
    const sortedKeys = Object.keys(highlightVideos).sort((a, b) => {
      const dateA = a.split("-").pop() || "";
      const dateB = b.split("-").pop() || "";
      return dateB.localeCompare(dateA);
    });

    for (const key of sortedKeys) {
      sortedHighlightVideos[key] = highlightVideos[key];
    }

    writeFileSync(
      HIGHLIGHT_VIDEOS_FILE,
      JSON.stringify(sortedHighlightVideos, null, 2)
    );

    // media-ratings.json にメディア評価を追加
    const mediaRatings: MediaRating[] = JSON.parse(
      readFileSync(MEDIA_RATINGS_FILE, "utf-8")
    );

    // 既存のmatchIdをセットで管理
    const existingRatingIds = new Set(mediaRatings.map((r) => r.matchId));

    // 選手情報をマップで取得
    const playerMap = new Map(players.map((p) => [p.id, p]));

    for (const match of newMatches) {
      if (!existingRatingIds.has(match.matchId)) {
        const player = playerMap.get(match.playerId);
        if (player) {
          const newRating = generateMediaRating(match, player);
          mediaRatings.unshift(newRating);
          console.log(`  [RATING] ${match.matchId}: メディア評価を生成`);
        }
      }
    }

    // 日付順でソート（新しい順）
    mediaRatings.sort((a, b) => b.matchId.localeCompare(a.matchId));

    writeFileSync(MEDIA_RATINGS_FILE, JSON.stringify(mediaRatings, null, 2));

    console.log(`\n=== 完了: ${newMatchCount}件の新しい試合を追加しました ===`);
  } else {
    console.log("\n=== 完了: 新しい試合はありませんでした ===");
  }

  // 新しい試合のIDを返す
  return newMatches.map((m) => m.matchId);
}

// 実行
main().catch(console.error);

export { main as fetchMatches };
