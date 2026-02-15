import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, "../src/data");
const MEDIA_RATINGS_FILE = join(DATA_DIR, "media-ratings.json");
const MATCHES_FILE = join(DATA_DIR, "matches.json");
const PLAYERS_FILE = join(DATA_DIR, "players.json");

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

interface Player {
  id: string;
  name: { ja: string; en: string };
  league: { name: string; shortName: string; country: string };
  club: { name: string; shortName: string };
}

interface ThreadReply {
  id: string;
  username: string;
  languageCode: string;
  originalText: string;
  translatedText: string;
  likes: number;
}

interface XThread {
  id: string;
  username: string;
  verified: boolean;
  languageCode: string;
  originalText: string;
  translatedText: string;
  likes: number;
  retweets: number;
  replies: ThreadReply[];
}

interface MediaRating {
  matchId: string;
  playerId: string;
  ratings: any[];
  averageRating: number;
  localVoices: any[];
  xThreads: XThread[];
  lastUpdated?: string;
}

// リーグごとの言語設定
const leagueLanguages: Record<string, { code: string; name: string }[]> = {
  "プレミアリーグ": [
    { code: "EN", name: "English" },
  ],
  "ラ・リーガ": [
    { code: "ES", name: "Spanish" },
    { code: "CA", name: "Catalan" },
  ],
  "ブンデスリーガ": [
    { code: "DE", name: "German" },
  ],
  "セリエA": [
    { code: "IT", name: "Italian" },
  ],
  "リーグ・アン": [
    { code: "FR", name: "French" },
  ],
  "エールディヴィジ": [
    { code: "NL", name: "Dutch" },
  ],
  "DFB Pokal": [
    { code: "DE", name: "German" },
  ],
  "FAカップ": [
    { code: "EN", name: "English" },
  ],
  "EFLカップ": [
    { code: "EN", name: "English" },
  ],
  "チャンピオンズリーグ": [
    { code: "EN", name: "English" },
    { code: "DE", name: "German" },
    { code: "ES", name: "Spanish" },
  ],
  "ヨーロッパリーグ": [
    { code: "EN", name: "English" },
    { code: "DE", name: "German" },
  ],
};

// 現地語のポジティブコメント
const positiveComments: Record<string, { original: string; translated: string }[]> = {
  "EN": [
    { original: "Brilliant performance! One of the best players on the pitch today.", translated: "素晴らしいパフォーマンス！今日のピッチで最高の選手の一人だ。" },
    { original: "Class is permanent. What a display!", translated: "クラスは永遠だ。なんというプレーだ！" },
    { original: "This guy is on fire! Unstoppable today.", translated: "この選手は絶好調だ！今日は止められない。" },
    { original: "World class. Simple as that.", translated: "ワールドクラス。それだけのことだ。" },
    { original: "The way he controlled the game was masterful.", translated: "彼の試合コントロールは見事だった。" },
  ],
  "DE": [
    { original: "Was für ein Spieler! Überragend heute.", translated: "なんて選手だ！今日は傑出していた。" },
    { original: "Einfach Weltklasse. Jedes Spiel besser.", translated: "まさにワールドクラス。試合ごとに良くなっている。" },
    { original: "Der beste Mann auf dem Platz heute.", translated: "今日のピッチで最高の選手だった。" },
    { original: "Absolut stark! So muss das aussehen.", translated: "本当に強い！こうあるべきだ。" },
    { original: "Wahnsinn, was der für eine Entwicklung macht!", translated: "彼の成長は本当にすごい！" },
  ],
  "ES": [
    { original: "¡Qué crack! Jugador de nivel mundial.", translated: "なんてすごい選手だ！ワールドクラスの選手だ。" },
    { original: "Impresionante su rendimiento hoy. Fenomenal.", translated: "今日のパフォーマンスは印象的だった。素晴らしい。" },
    { original: "Cada partido demuestra por qué es tan especial.", translated: "毎試合、なぜ彼が特別なのかを証明している。" },
    { original: "¡Mágico! No hay otra palabra.", translated: "マジカル！他に言葉はない。" },
  ],
  "FR": [
    { original: "Quel joueur! Performance exceptionnelle aujourd'hui.", translated: "なんて選手だ！今日は例外的なパフォーマンスだった。" },
    { original: "Il a dominé le match du début à la fin.", translated: "彼は最初から最後まで試合を支配した。" },
    { original: "Classe mondiale. On ne voit pas ça souvent.", translated: "ワールドクラス。こんなのは滅多に見られない。" },
  ],
  "NL": [
    { original: "Geweldige speler! Laat elke wedstrijd zijn klasse zien.", translated: "素晴らしい選手！毎試合クラスを見せている。" },
    { original: "Wat een niveau vandaag. Echt indrukwekkend.", translated: "今日のレベルはすごかった。本当に印象的だ。" },
    { original: "Deze jongen gaat ver komen. Mark my words.", translated: "この選手は遠くまで行くだろう。覚えておけ。" },
  ],
  "IT": [
    { original: "Che giocatore! Prestazione da applausi.", translated: "なんて選手だ！拍手に値するパフォーマンス。" },
    { original: "Ha dominato la partita. Fantastico.", translated: "試合を支配した。素晴らしい。" },
  ],
};

// 現地語のネガティブコメント
const negativeComments: Record<string, { original: string; translated: string }[]> = {
  "EN": [
    { original: "Disappointing today. Expected much more from him.", translated: "今日は期待外れだった。もっと期待していた。" },
    { original: "Not his day. Looked lost out there at times.", translated: "彼の日ではなかった。時々、迷っているように見えた。" },
    { original: "Poor performance. Needs to step up in big games.", translated: "悪いパフォーマンス。大きな試合ではもっと頑張らないと。" },
    { original: "Invisible for most of the match. What happened?", translated: "試合のほとんどで存在感がなかった。何があったのか？" },
    { original: "Overhyped. He's not ready for this level yet.", translated: "過大評価だ。まだこのレベルには準備ができていない。" },
    { original: "Struggled today. The pressure got to him.", translated: "今日は苦戦した。プレッシャーが彼に影響した。" },
  ],
  "DE": [
    { original: "Heute war er leider nicht gut. Viel Luft nach oben.", translated: "残念ながら今日は良くなかった。改善の余地がたくさんある。" },
    { original: "Enttäuschend. Von ihm erwartet man mehr.", translated: "期待外れ。彼にはもっと期待している。" },
    { original: "Nicht sein Tag heute. Passiert jedem mal.", translated: "今日は彼の日ではなかった。誰にでもあることだ。" },
    { original: "Schwache Leistung. Muss sich steigern.", translated: "弱いパフォーマンス。向上しなければならない。" },
    { original: "Unsichtbar heute. Wo war er?", translated: "今日は見えなかった。どこにいたのか？" },
  ],
  "ES": [
    { original: "Partido para olvidar. No estuvo fino hoy.", translated: "忘れたい試合だ。今日は調子が良くなかった。" },
    { original: "Decepcionante. Esperaba mucho más de él.", translated: "期待外れ。もっと期待していた。" },
    { original: "Flojo partido. Tiene que mejorar.", translated: "弱い試合だった。改善しなければならない。" },
    { original: "No apareció cuando más lo necesitábamos.", translated: "最も必要な時に現れなかった。" },
  ],
  "FR": [
    { original: "Pas son meilleur match. Il peut faire mieux.", translated: "彼のベストの試合ではなかった。もっとできるはず。" },
    { original: "Décevant aujourd'hui. On attend plus de lui.", translated: "今日は期待外れ。彼にはもっと期待している。" },
    { original: "Match à oublier. Ça arrive à tout le monde.", translated: "忘れたい試合。誰にでもあることだ。" },
  ],
  "NL": [
    { original: "Vandaag niet zijn dag. Kan veel beter.", translated: "今日は彼の日ではなかった。もっとできるはず。" },
    { original: "Teleurstellend. Hij moet opstaan.", translated: "期待外れ。立ち上がらなければならない。" },
    { original: "Onzichtbaar vandaag. Volgende keer beter.", translated: "今日は見えなかった。次回はもっと良く。" },
  ],
  "IT": [
    { original: "Partita deludente. Mi aspettavo di più.", translated: "期待外れの試合。もっと期待していた。" },
    { original: "Non il suo giorno. Capita a tutti.", translated: "彼の日ではなかった。誰にでもあることだ。" },
  ],
};

// ニュートラルなコメント
const neutralComments: Record<string, { original: string; translated: string }[]> = {
  "EN": [
    { original: "Decent shift. Nothing spectacular but did his job.", translated: "まずまずのプレー。特別なことはなかったが、仕事はした。" },
    { original: "Solid performance. Kept things ticking over.", translated: "堅実なパフォーマンス。チームを機能させ続けた。" },
    { original: "Average game. Some good moments, some poor.", translated: "平均的な試合。良い瞬間もあれば、悪い瞬間もあった。" },
  ],
  "DE": [
    { original: "Solide Leistung. Nicht mehr, nicht weniger.", translated: "堅実なパフォーマンス。それ以上でも以下でもない。" },
    { original: "Okay gespielt heute. Nichts Besonderes.", translated: "今日はまあまあのプレー。特別なことはなかった。" },
  ],
  "ES": [
    { original: "Partido correcto. Sin más.", translated: "普通の試合。それ以上でもなく。" },
    { original: "Cumplió su función. Ni más ni menos.", translated: "役割を果たした。それ以上でも以下でもない。" },
  ],
  "FR": [
    { original: "Match correct. Rien d'extraordinaire.", translated: "普通の試合。特別なことはなかった。" },
  ],
  "NL": [
    { original: "Prima wedstrijd. Niets bijzonders maar goed genoeg.", translated: "良い試合。特別なことはなかったが十分だった。" },
  ],
  "IT": [
    { original: "Partita sufficiente. Ha fatto il suo.", translated: "十分な試合。彼の仕事をした。" },
  ],
};

// 返信のテンプレート
const replyTemplates: Record<string, Record<"positive" | "negative" | "neutral", { original: string; translated: string }[]>> = {
  "EN": {
    positive: [
      { original: "Absolutely agree! He was incredible today.", translated: "完全に同意！今日は信じられないほど良かった。" },
      { original: "Best player on the pitch by far.", translated: "ダントツでピッチ上で最高の選手だった。" },
      { original: "Can't wait to see more of this! 🔥", translated: "もっと見たい！🔥" },
    ],
    negative: [
      { original: "Harsh but fair. He needs to do better.", translated: "厳しいが公平だ。もっと頑張らないと。" },
      { original: "Agreed. Very disappointing today.", translated: "同意。今日は非常に残念だった。" },
      { original: "Give him a break, one bad game doesn't define him.", translated: "少し大目に見てくれ、1回の悪い試合で彼を定義するな。" },
    ],
    neutral: [
      { original: "Yeah, just an average day at the office.", translated: "うん、普通の1日だった。" },
      { original: "He'll be back stronger next game.", translated: "次の試合ではもっと強くなって戻ってくるだろう。" },
    ],
  },
  "DE": {
    positive: [
      { original: "Ganz genau! Überragend heute.", translated: "その通り！今日は傑出していた。" },
      { original: "Der Junge wird noch groß! 💪", translated: "この選手は大きくなるぞ！💪" },
    ],
    negative: [
      { original: "Leider wahr. Muss sich steigern.", translated: "残念ながら本当だ。向上しなければならない。" },
      { original: "Nicht so hart sein. Nächstes Mal besser.", translated: "そんなに厳しくするな。次はもっと良くなる。" },
    ],
    neutral: [
      { original: "Solide halt. Mehr nicht.", translated: "堅実だった。それだけ。" },
    ],
  },
  "ES": {
    positive: [
      { original: "¡Totalmente! Qué jugador.", translated: "完全に！なんて選手だ。" },
      { original: "Se nota que es de otro nivel. 👏", translated: "別のレベルだとわかる。👏" },
    ],
    negative: [
      { original: "Duro pero justo. Tiene que mejorar.", translated: "厳しいが公平だ。改善しなければならない。" },
      { original: "No seáis tan duros. Un mal partido lo tiene cualquiera.", translated: "そんなに厳しくするな。誰でも悪い試合はある。" },
    ],
    neutral: [
      { original: "Normal. Ni bien ni mal.", translated: "普通。良くも悪くもない。" },
    ],
  },
  "FR": {
    positive: [
      { original: "Exactement! Quel talent.", translated: "その通り！なんて才能だ。" },
    ],
    negative: [
      { original: "C'est vrai mais il peut faire mieux.", translated: "本当だが、もっとできるはず。" },
    ],
    neutral: [
      { original: "Match ordinaire. Ça arrive.", translated: "普通の試合。こういうこともある。" },
    ],
  },
  "NL": {
    positive: [
      { original: "Helemaal eens! Geweldige speler.", translated: "完全に同意！素晴らしい選手だ。" },
    ],
    negative: [
      { original: "Klopt. Moet beter.", translated: "その通り。もっと良くないと。" },
    ],
    neutral: [
      { original: "Gewoon prima. Meer niet.", translated: "普通に良かった。それだけ。" },
    ],
  },
  "IT": {
    positive: [
      { original: "Esatto! Che giocatore.", translated: "その通り！なんて選手だ。" },
    ],
    negative: [
      { original: "Purtroppo vero. Deve migliorare.", translated: "残念ながら本当だ。改善しなければならない。" },
    ],
    neutral: [
      { original: "Partita normale. Capita.", translated: "普通の試合。こういうこともある。" },
    ],
  },
};

// ユーザー名生成
function generateUsername(lang: string, isVerified: boolean): string {
  if (isVerified) {
    const verifiedAccounts: Record<string, string[]> = {
      "EN": ["@PremierLeague", "@SkySportsNews", "@BBCSport", "@TheAthleticFC", "@ESPN_FC"],
      "DE": ["@Bundesliga_DE", "@kaborFussball", "@SportBild", "@BILD_Sport", "@SkySportDE"],
      "ES": ["@LaLiga", "@MarcaFutbol", "@AS_Football", "@mundodeportivo", "@Sport_ES"],
      "FR": ["@Ligue1UberEats", "@laborFoot", "@RMCsport", "@LequipeFoot"],
      "NL": ["@Eredivisie", "@VoetbalZone", "@FOXSportsNL"],
      "IT": ["@SerieA", "@Gabortta_it", "@SkySport"],
    };
    const accounts = verifiedAccounts[lang] || verifiedAccounts["EN"];
    return accounts[Math.floor(Math.random() * accounts.length)];
  }

  const prefixes: Record<string, string[]> = {
    "EN": ["FootballFan", "PremFan", "SoccerLover", "TheBeautifulGame", "MatchdayVibes"],
    "DE": ["FussballFan", "BundesligaLover", "DFBSupporter", "KickTipps"],
    "ES": ["FutbolPuro", "LaLigaFan", "MadridFan", "BarcelonaLover"],
    "FR": ["FootFR", "Ligue1Fan", "SupporterParis"],
    "NL": ["EredivisieFan", "OrangeFan", "VoetbalLover"],
    "IT": ["CalcioFan", "SerieALover", "TifosoVero"],
  };

  const prefix = prefixes[lang] || prefixes["EN"];
  return `@${prefix[Math.floor(Math.random() * prefix.length)]}${Math.floor(Math.random() * 9999)}`;
}

// スレッド数を決定
function determineThreadCount(match: Match): number {
  const { playerStats } = match;
  const rating = playerStats.rating;
  const goals = playerStats.goals;
  const assists = playerStats.assists;

  // 活躍度に応じてスレッド数を増やす
  let baseCount = 3;

  if (goals >= 2) baseCount += 4;
  else if (goals >= 1) baseCount += 2;

  if (assists >= 2) baseCount += 3;
  else if (assists >= 1) baseCount += 1;

  if (rating >= 8.0) baseCount += 3;
  else if (rating >= 7.5) baseCount += 2;
  else if (rating >= 7.0) baseCount += 1;
  else if (rating < 6.0) baseCount += 1; // ネガティブコメント用

  return Math.min(baseCount, 10); // 最大10スレッド
}

// スレッド生成
function generateThreads(match: Match, player: Player): XThread[] {
  const threads: XThread[] = [];
  const languages = leagueLanguages[match.competition] || [{ code: "EN", name: "English" }];
  const threadCount = determineThreadCount(match);
  const rating = match.playerStats.rating;
  const goals = match.playerStats.goals;
  const assists = match.playerStats.assists;

  // パフォーマンスに基づいてコメントタイプの比率を決定
  let positiveRatio: number;
  let negativeRatio: number;
  let neutralRatio: number;

  if (rating >= 7.5 || goals >= 1 || assists >= 1) {
    // 良いパフォーマンス：ポジティブ多め、ネガティブ少し
    positiveRatio = 0.6;
    negativeRatio = 0.15;
    neutralRatio = 0.25;
  } else if (rating < 6.0) {
    // 悪いパフォーマンス：ネガティブ多め
    positiveRatio = 0.15;
    negativeRatio = 0.55;
    neutralRatio = 0.3;
  } else {
    // 普通のパフォーマンス：バランス
    positiveRatio = 0.35;
    negativeRatio = 0.25;
    neutralRatio = 0.4;
  }

  for (let i = 0; i < threadCount; i++) {
    const lang = languages[i % languages.length].code;
    const isVerified = i < 2; // 最初の2つは認証済みアカウント

    // コメントタイプを選択
    const rand = Math.random();
    let commentType: "positive" | "negative" | "neutral";
    if (rand < positiveRatio) {
      commentType = "positive";
    } else if (rand < positiveRatio + negativeRatio) {
      commentType = "negative";
    } else {
      commentType = "neutral";
    }

    let comments: { original: string; translated: string }[];
    if (commentType === "positive") {
      comments = positiveComments[lang] || positiveComments["EN"];
    } else if (commentType === "negative") {
      comments = negativeComments[lang] || negativeComments["EN"];
    } else {
      comments = neutralComments[lang] || neutralComments["EN"];
    }

    const comment = comments[Math.floor(Math.random() * comments.length)];

    // 選手名を含めたカスタマイズ
    let originalText = comment.original;
    let translatedText = comment.translated;

    // 50%の確率で選手名を含める
    if (Math.random() > 0.5) {
      originalText = `${player.name.en}: ${originalText}`;
      translatedText = `${player.name.ja}: ${translatedText}`;
    }

    // 返信を生成
    const replyCount = Math.floor(Math.random() * 4) + 1;
    const replies: ThreadReply[] = [];

    for (let j = 0; j < replyCount; j++) {
      const replyLang = languages[Math.floor(Math.random() * languages.length)].code;
      const replyTemplateSet = replyTemplates[replyLang] || replyTemplates["EN"];

      // 返信はメインスレッドと同じ方向性か反対の意見
      let replyType: "positive" | "negative" | "neutral";
      if (Math.random() > 0.3) {
        replyType = commentType; // 同じ方向性
      } else {
        // 反対の意見
        if (commentType === "positive") replyType = "negative";
        else if (commentType === "negative") replyType = "positive";
        else replyType = Math.random() > 0.5 ? "positive" : "negative";
      }

      const replyOptions = replyTemplateSet[replyType];
      if (replyOptions && replyOptions.length > 0) {
        const reply = replyOptions[Math.floor(Math.random() * replyOptions.length)];
        replies.push({
          id: `r${Date.now()}_${i}_${j}`,
          username: generateUsername(replyLang, false),
          languageCode: replyLang,
          originalText: reply.original,
          translatedText: reply.translated,
          likes: Math.floor(Math.random() * 500) + 50,
        });
      }
    }

    threads.push({
      id: `t${Date.now()}_${i}`,
      username: generateUsername(lang, isVerified),
      verified: isVerified,
      languageCode: lang,
      originalText,
      translatedText,
      likes: Math.floor(Math.random() * 20000) + 1000,
      retweets: Math.floor(Math.random() * 5000) + 100,
      replies,
    });
  }

  return threads;
}

// メイン処理
async function main() {
  console.log("🔄 Regenerating X threads with improved content...\n");

  const matches: Match[] = JSON.parse(readFileSync(MATCHES_FILE, "utf-8"));
  const players: Player[] = JSON.parse(readFileSync(PLAYERS_FILE, "utf-8"));
  const mediaRatings: MediaRating[] = JSON.parse(readFileSync(MEDIA_RATINGS_FILE, "utf-8"));

  const playerMap = new Map(players.map(p => [p.id, p]));

  let updatedCount = 0;

  for (const media of mediaRatings) {
    const match = matches.find(m => m.matchId === media.matchId);
    const player = playerMap.get(media.playerId);

    if (match && player) {
      const newThreads = generateThreads(match, player);
      media.xThreads = newThreads;
      media.lastUpdated = new Date().toISOString();
      updatedCount++;

      const threadCount = newThreads.length;
      const hasNegative = newThreads.some(t =>
        negativeComments["EN"].some(c => t.originalText.includes(c.original)) ||
        negativeComments["DE"]?.some(c => t.originalText.includes(c.original)) ||
        negativeComments["ES"]?.some(c => t.originalText.includes(c.original))
      );

      console.log(`✅ ${match.matchId}: ${threadCount} threads (${match.playerStats.rating >= 7.0 ? "🌟" : match.playerStats.rating < 6.0 ? "⚠️" : "📊"})`);
    }
  }

  writeFileSync(MEDIA_RATINGS_FILE, JSON.stringify(mediaRatings, null, 2));

  console.log(`\n✨ Updated ${updatedCount} match entries with new X threads`);
  console.log("📝 Changes include:");
  console.log("   - Positive and negative opinions mixed");
  console.log("   - Local language threads (German, Spanish, French, Dutch, Italian)");
  console.log("   - More threads for standout performances");
}

main().catch(console.error);
