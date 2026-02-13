/**
 * 新しい試合に対してメディア評価・現地の声・Xスレッドを自動生成するスクリプト
 * 試合結果に基づいてテンプレートからコンテンツを生成
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// データファイルのパス
const DATA_DIR = join(__dirname, "../src/data");
const PLAYERS_FILE = join(DATA_DIR, "players.json");
const MATCHES_FILE = join(DATA_DIR, "matches.json");
const MEDIA_RATINGS_FILE = join(DATA_DIR, "media-ratings.json");

// 型定義
interface Player {
  id: string;
  name: { ja: string; en: string };
  club: { name: string; shortName: string };
  league: { name: string; shortName: string; country: string };
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

interface MediaRating {
  source: string;
  country: string;
  rating: number;
  maxRating: number;
  ratingSystem: string;
  comment?: string;
  commentTranslated?: string;
}

interface LocalVoice {
  id: string;
  username: string;
  role: string;
  roleKey: string;
  languageCode: string;
  originalText: string;
  translatedText: string;
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
  replies?: XReply[];
}

interface XReply {
  id: string;
  username: string;
  languageCode: string;
  originalText: string;
  translatedText: string;
  likes: number;
}

interface MatchMediaData {
  matchId: string;
  playerId: string;
  ratings: MediaRating[];
  averageRating: number;
  localVoices: LocalVoice[];
  xThreads: XThread[];
  lastUpdated?: string;
}

// 国別メディアソース
const MEDIA_SOURCES: Record<string, { source: string; country: string }[]> = {
  イングランド: [
    { source: "Sky Sports", country: "イングランド" },
    { source: "WhoScored", country: "イングランド" },
    { source: "BBC Sport", country: "イングランド" },
  ],
  スペイン: [
    { source: "MARCA", country: "スペイン" },
    { source: "AS", country: "スペイン" },
    { source: "WhoScored", country: "イングランド" },
  ],
  ドイツ: [
    { source: "kicker", country: "ドイツ" },
    { source: "Bild", country: "ドイツ" },
    { source: "WhoScored", country: "イングランド" },
  ],
  オランダ: [
    { source: "Voetbal International", country: "オランダ" },
    { source: "De Telegraaf", country: "オランダ" },
    { source: "WhoScored", country: "イングランド" },
  ],
  フランス: [
    { source: "L'Équipe", country: "フランス" },
    { source: "WhoScored", country: "イングランド" },
  ],
  イタリア: [
    { source: "La Gazzetta dello Sport", country: "イタリア" },
    { source: "WhoScored", country: "イングランド" },
  ],
};

// 国別言語コード
const COUNTRY_LANGUAGE: Record<string, string> = {
  イングランド: "EN",
  スペイン: "ES",
  ドイツ: "DE",
  オランダ: "NL",
  フランス: "FR",
  イタリア: "IT",
};

// メディアコメントテンプレート（パフォーマンスレベル別、オリジナル+翻訳）
interface CommentTemplate {
  original: string;
  translated: string;
}

const MEDIA_COMMENT_TEMPLATES: Record<string, Record<string, CommentTemplate[]>> = {
  excellent: {
    EN: [
      { original: "Outstanding performance. Controlled the tempo and created multiple chances.", translated: "傑出したパフォーマンス。試合のテンポをコントロールし、複数のチャンスを演出した。" },
      { original: "Exceptional display. A constant threat on the wing with superb decision-making.", translated: "卓越したプレー。サイドで常に脅威となり、素晴らしい判断力を見せた。" },
      { original: "Man of the match caliber performance. Dominated throughout.", translated: "マン・オブ・ザ・マッチ級のパフォーマンス。試合を通じて支配した。" },
      { original: "Brilliant showing. Combined well and showed great vision.", translated: "見事なプレー。連携も良く、優れたビジョンを披露した。" },
    ],
    DE: [
      { original: "Herausragende Leistung. Kontrollierte das Tempo und schuf mehrere Chancen.", translated: "傑出したパフォーマンス。テンポをコントロールし、複数のチャンスを作り出した。" },
      { original: "Überragend. War ständig gefährlich und traf kluge Entscheidungen.", translated: "圧倒的だった。常に危険な存在で、賢明な判断を下した。" },
      { original: "Spieler des Spiels. Dominierte durchgehend.", translated: "試合のベストプレーヤー。終始支配的だった。" },
    ],
    ES: [
      { original: "Actuación excepcional. Controló el ritmo y creó múltiples ocasiones.", translated: "卓越したパフォーマンス。リズムをコントロールし、複数のチャンスを生み出した。" },
      { original: "Exhibición brillante. Una amenaza constante con gran visión.", translated: "見事な出来。常に脅威となり、優れたビジョンを見せた。" },
    ],
    NL: [
      { original: "Uitstekende prestatie. Beheerste het tempo en creëerde meerdere kansen.", translated: "素晴らしいパフォーマンス。テンポを支配し、複数のチャンスを作った。" },
      { original: "Briljant optreden. Constant gevaarlijk met geweldige visie.", translated: "輝かしいプレー。常に危険で、素晴らしいビジョンを持っていた。" },
    ],
  },
  good: {
    EN: [
      { original: "Solid contribution. Worked hard and linked up well with teammates.", translated: "堅実な貢献。ハードワークでチームメイトとの連携も良好だった。" },
      { original: "Reliable performance. Made some key passes and tracked back diligently.", translated: "頼れるパフォーマンス。キーパスを通し、献身的な守備も見せた。" },
      { original: "Effective display. Did his job and added quality going forward.", translated: "効果的なプレー。役割を果たし、攻撃時にクオリティを加えた。" },
      { original: "Composed showing. Rarely gave the ball away and showed good movement.", translated: "落ち着いたプレー。ボールロストが少なく、良い動きを見せた。" },
    ],
    DE: [
      { original: "Solider Beitrag. Arbeitete hart und verband sich gut mit Mitspielern.", translated: "堅実な貢献。ハードワークでチームメイトとよく連携した。" },
      { original: "Zuverlässige Leistung. Einige wichtige Pässe und diszipliniertes Rücklaufen.", translated: "信頼できるパフォーマンス。重要なパスを通し、規律ある守備を見せた。" },
    ],
    ES: [
      { original: "Contribución sólida. Trabajó duro y conectó bien con los compañeros.", translated: "堅実な貢献。ハードワークでチームメイトとよく繋がった。" },
      { original: "Actuación fiable. Realizó pases clave y ayudó en defensa.", translated: "信頼できるプレー。キーパスを出し、守備でも貢献した。" },
    ],
    NL: [
      { original: "Solide bijdrage. Werkte hard en combineerde goed met teamgenoten.", translated: "堅実な貢献。ハードワークでチームメイトとよくコンビネーションした。" },
      { original: "Betrouwbare prestatie. Maakte belangrijke passes.", translated: "頼れるパフォーマンス。重要なパスを通した。" },
    ],
  },
  average: {
    EN: [
      { original: "Quiet afternoon. Lacked service but showed moments of quality when on the ball.", translated: "静かな午後だった。ボール供給が少なかったが、ボールを持った時には質の高いプレーを見せた。" },
      { original: "Mixed display. Some good moments but struggled to impose himself.", translated: "出来にムラがあった。良い場面もあったが、存在感を示すのに苦労した。" },
      { original: "Subdued performance. Not his best day but still contributed defensively.", translated: "控えめなパフォーマンス。ベストの日ではなかったが、守備では貢献した。" },
      { original: "Inconsistent showing. Flashes of brilliance but not sustained.", translated: "不安定なプレー。輝きを見せる瞬間はあったが、持続しなかった。" },
    ],
    DE: [
      { original: "Ruhiger Nachmittag. Wenig Ballbesitz, aber gute Momente mit dem Ball.", translated: "静かな午後だった。ボールに触る機会は少なかったが、ボールを持った時は良かった。" },
      { original: "Durchwachsene Leistung. Konnte sich nicht durchsetzen.", translated: "出来にムラがあった。存在感を発揮できなかった。" },
    ],
    ES: [
      { original: "Tarde tranquila. Poco balón pero mostró calidad cuando lo tuvo.", translated: "静かな午後だった。ボールに触る機会は少なかったが、持った時には質を見せた。" },
      { original: "Actuación irregular. Buenos momentos pero sin continuidad.", translated: "不安定なプレー。良い瞬間はあったが、継続しなかった。" },
    ],
    NL: [
      { original: "Rustige middag. Weinig balbezit maar toonde kwaliteit wanneer mogelijk.", translated: "静かな午後だった。ボール保持は少なかったが、機会があれば質を見せた。" },
      { original: "Wisselvallige prestatie. Kon zich niet opleggen.", translated: "不安定なパフォーマンス。存在感を示せなかった。" },
    ],
  },
  poor: {
    EN: [
      { original: "Struggled throughout. Found it difficult to get into the game.", translated: "試合を通じて苦戦した。ゲームに入り込むのが難しかった。" },
      { original: "Off the pace today. Gave the ball away too often and looked frustrated.", translated: "今日はペースについていけなかった。ボールロストが多く、フラストレーションが見られた。" },
      { original: "Disappointing display. Well below his usual standards.", translated: "期待外れのパフォーマンス。いつもの水準を大きく下回った。" },
      { original: "Tough match. Will look to bounce back in the next game.", translated: "厳しい試合だった。次戦での巻き返しに期待。" },
    ],
    DE: [
      { original: "Hatte Schwierigkeiten. Kam nicht ins Spiel.", translated: "苦戦した。試合に入れなかった。" },
      { original: "Nicht auf dem Niveau. Verlor den Ball zu oft.", translated: "いつものレベルではなかった。ボールロストが多すぎた。" },
    ],
    ES: [
      { original: "Tuvo dificultades. No logró entrar en el partido.", translated: "苦労した。試合に入り込めなかった。" },
      { original: "Actuación decepcionante. Por debajo de su nivel habitual.", translated: "期待外れのプレー。通常のレベルを下回った。" },
    ],
    NL: [
      { original: "Moeite gehad. Kwam niet in de wedstrijd.", translated: "苦労した。試合に入れなかった。" },
      { original: "Teleurstellende prestatie. Onder zijn gebruikelijke niveau.", translated: "期待外れのパフォーマンス。いつもの水準を下回った。" },
    ],
  },
};

// 現地の声テンプレート（パフォーマンス別）
interface VoiceTemplate {
  supporter: { original: string; translated: string }[];
  journalist: { original: string; translated: string }[];
}

const VOICE_TEMPLATES: Record<string, Record<string, VoiceTemplate>> = {
  // 英語（イングランド）
  EN: {
    excellent: {
      supporter: [
        { original: "{player} was absolutely brilliant today! What a performance against {opponent}.", translated: "{player}は今日絶対的に素晴らしかった！{opponent}戦でなんというパフォーマンスだ。" },
        { original: "Incredible display from {player}. {stat} He's been our best player this season.", translated: "{player}の信じられないプレー。{stat}今季最高の選手だ。" },
      ],
      journalist: [
        { original: "{player} dominated the match against {opponent}. {stat} A truly world-class performance.", translated: "{player}が{opponent}戦を支配した。{stat}まさにワールドクラスのパフォーマンスだった。" },
        { original: "Outstanding from {player} today. {stat} The Japanese international continues to impress.", translated: "{player}の今日の傑出したプレー。{stat}この日本代表は印象を与え続けている。" },
      ],
    },
    good: {
      supporter: [
        { original: "Solid performance from {player} against {opponent}. {stat} Keep it up!", translated: "{opponent}戦で{player}の堅実なパフォーマンス。{stat}この調子で！" },
        { original: "{player} did well today. {stat} Exactly what the team needed.", translated: "{player}は今日良くやった。{stat}まさにチームに必要なものだった。" },
      ],
      journalist: [
        { original: "{player} put in a composed performance against {opponent}. {stat}", translated: "{player}が{opponent}戦で落ち着いたパフォーマンスを見せた。{stat}" },
        { original: "Professional display from {player}. {stat} Continues to be a reliable presence.", translated: "{player}のプロフェッショナルなプレー。{stat}信頼できる存在であり続けている。" },
      ],
    },
    average: {
      supporter: [
        { original: "Quiet game from {player} today against {opponent}. {stat} Hopefully better next time.", translated: "{opponent}戦で{player}は静かな試合だった。{stat}次回に期待。" },
        { original: "{player} was okay but not his best. {stat}", translated: "{player}はまあまあだったが、ベストではなかった。{stat}" },
      ],
      journalist: [
        { original: "{player} had a mixed performance against {opponent}. {stat} Room for improvement.", translated: "{player}は{opponent}戦でムラのあるパフォーマンスだった。{stat}改善の余地あり。" },
      ],
    },
    poor: {
      supporter: [
        { original: "Tough day for {player} against {opponent}. {stat} Not his day.", translated: "{opponent}戦で{player}にとって厳しい一日だった。{stat}彼の日ではなかった。" },
      ],
      journalist: [
        { original: "{player} struggled against {opponent}. {stat} Will need to bounce back.", translated: "{player}は{opponent}戦で苦戦した。{stat}立ち直る必要がある。" },
      ],
    },
  },
  // ドイツ語
  DE: {
    excellent: {
      supporter: [
        { original: "{player} war heute absolut herausragend! Was für eine Leistung gegen {opponent}.", translated: "{player}は今日絶対的に傑出していた！{opponent}戦でなんというパフォーマンスだ。" },
        { original: "Unglaubliche Vorstellung von {player}. {stat} Er ist unser bester Spieler.", translated: "{player}の信じられないプレー。{stat}彼は我々の最高の選手だ。" },
      ],
      journalist: [
        { original: "{player} dominierte das Spiel gegen {opponent}. {stat} Eine Weltklasse-Leistung.", translated: "{player}が{opponent}戦を支配した。{stat}ワールドクラスのパフォーマンスだった。" },
      ],
    },
    good: {
      supporter: [
        { original: "Solide Leistung von {player} gegen {opponent}. {stat} Weiter so!", translated: "{opponent}戦で{player}の堅実なパフォーマンス。{stat}この調子で！" },
      ],
      journalist: [
        { original: "{player} zeigte eine kontrollierte Leistung gegen {opponent}. {stat}", translated: "{player}が{opponent}戦でコントロールされたパフォーマンスを見せた。{stat}" },
      ],
    },
    average: {
      supporter: [
        { original: "Ruhiges Spiel von {player} heute gegen {opponent}. {stat}", translated: "{opponent}戦で{player}は静かな試合だった。{stat}" },
      ],
      journalist: [
        { original: "{player} hatte eine durchwachsene Leistung gegen {opponent}. {stat}", translated: "{player}は{opponent}戦でムラのあるパフォーマンスだった。{stat}" },
      ],
    },
    poor: {
      supporter: [
        { original: "Schwieriger Tag für {player} gegen {opponent}. {stat}", translated: "{opponent}戦で{player}にとって難しい一日だった。{stat}" },
      ],
      journalist: [
        { original: "{player} hatte Probleme gegen {opponent}. {stat}", translated: "{player}は{opponent}戦で問題を抱えていた。{stat}" },
      ],
    },
  },
  // オランダ語
  NL: {
    excellent: {
      supporter: [
        { original: "{player} was vandaag absoluut briljant! Wat een prestatie tegen {opponent}.", translated: "{player}は今日絶対的に素晴らしかった！{opponent}戦でなんというパフォーマンスだ。" },
        { original: "Ongelooflijke wedstrijd van {player}. {stat} Hij is onze beste speler.", translated: "{player}の信じられない試合。{stat}彼は我々の最高の選手だ。" },
      ],
      journalist: [
        { original: "{player} domineerde de wedstrijd tegen {opponent}. {stat} Wereldklasse.", translated: "{player}が{opponent}戦を支配した。{stat}ワールドクラスだ。" },
      ],
    },
    good: {
      supporter: [
        { original: "Solide prestatie van {player} tegen {opponent}. {stat} Goed gedaan!", translated: "{opponent}戦で{player}の堅実なパフォーマンス。{stat}よくやった！" },
      ],
      journalist: [
        { original: "{player} liet een beheerste prestatie zien tegen {opponent}. {stat}", translated: "{player}が{opponent}戦でコントロールされたパフォーマンスを見せた。{stat}" },
      ],
    },
    average: {
      supporter: [
        { original: "Rustige wedstrijd van {player} vandaag tegen {opponent}. {stat}", translated: "{opponent}戦で{player}は静かな試合だった。{stat}" },
      ],
      journalist: [
        { original: "{player} had een wisselvallige prestatie tegen {opponent}. {stat}", translated: "{player}は{opponent}戦でムラのあるパフォーマンスだった。{stat}" },
      ],
    },
    poor: {
      supporter: [
        { original: "Moeilijke dag voor {player} tegen {opponent}. {stat}", translated: "{opponent}戦で{player}にとって難しい一日だった。{stat}" },
      ],
      journalist: [
        { original: "{player} had moeite tegen {opponent}. {stat}", translated: "{player}は{opponent}戦で苦労した。{stat}" },
      ],
    },
  },
  // スペイン語
  ES: {
    excellent: {
      supporter: [
        { original: "¡{player} estuvo absolutamente brillante hoy! Qué actuación contra {opponent}.", translated: "{player}は今日絶対的に素晴らしかった！{opponent}戦でなんというパフォーマンスだ。" },
        { original: "Increíble partido de {player}. {stat} Es nuestro mejor jugador.", translated: "{player}の信じられない試合。{stat}彼は我々の最高の選手だ。" },
      ],
      journalist: [
        { original: "{player} dominó el partido contra {opponent}. {stat} Una actuación de clase mundial.", translated: "{player}が{opponent}戦を支配した。{stat}ワールドクラスのパフォーマンスだった。" },
      ],
    },
    good: {
      supporter: [
        { original: "Sólida actuación de {player} contra {opponent}. {stat} ¡Sigue así!", translated: "{opponent}戦で{player}の堅実なパフォーマンス。{stat}この調子で！" },
      ],
      journalist: [
        { original: "{player} mostró una actuación controlada contra {opponent}. {stat}", translated: "{player}が{opponent}戦でコントロールされたパフォーマンスを見せた。{stat}" },
      ],
    },
    average: {
      supporter: [
        { original: "Partido tranquilo de {player} hoy contra {opponent}. {stat}", translated: "{opponent}戦で{player}は静かな試合だった。{stat}" },
      ],
      journalist: [
        { original: "{player} tuvo una actuación irregular contra {opponent}. {stat}", translated: "{player}は{opponent}戦でムラのあるパフォーマンスだった。{stat}" },
      ],
    },
    poor: {
      supporter: [
        { original: "Día difícil para {player} contra {opponent}. {stat}", translated: "{opponent}戦で{player}にとって難しい一日だった。{stat}" },
      ],
      journalist: [
        { original: "{player} tuvo problemas contra {opponent}. {stat}", translated: "{player}は{opponent}戦で問題を抱えていた。{stat}" },
      ],
    },
  },
};

/**
 * パフォーマンスレベルを判定
 */
function getPerformanceLevel(match: Match): "excellent" | "good" | "average" | "poor" {
  const { goals, assists, minutesPlayed, rating } = match.playerStats;

  if (goals >= 2 || (goals >= 1 && assists >= 1) || rating >= 8.0) {
    return "excellent";
  }
  if (goals >= 1 || assists >= 1 || rating >= 7.0) {
    return "good";
  }
  if (rating >= 6.0 && minutesPlayed >= 60) {
    return "average";
  }
  return "poor";
}

/**
 * コメントの言語コードを取得
 */
function getCommentLanguage(sourceCountry: string): string {
  const countryToLang: Record<string, string> = {
    "イングランド": "EN",
    "スペイン": "ES",
    "ドイツ": "DE",
    "オランダ": "NL",
  };
  return countryToLang[sourceCountry] || "EN";
}

/**
 * パフォーマンスレベルに基づいてコメントを取得（オリジナル+翻訳）
 */
function getRandomComment(performanceLevel: string, langCode: string): { comment: string; commentTranslated: string } | undefined {
  const levelComments = MEDIA_COMMENT_TEMPLATES[performanceLevel];
  if (!levelComments) return undefined;

  const comments = levelComments[langCode] || levelComments["EN"];
  if (!comments || comments.length === 0) return undefined;

  const selected = comments[Math.floor(Math.random() * comments.length)];
  return {
    comment: selected.original,
    commentTranslated: selected.translated,
  };
}

/**
 * 試合結果に基づいてレーティングを生成
 */
function generateRatings(match: Match, player: Player): MediaRating[] {
  const country = player.league.country;
  const sources = MEDIA_SOURCES[country] || MEDIA_SOURCES["イングランド"];

  const performanceLevel = getPerformanceLevel(match);
  const baseRating = {
    excellent: 8.0,
    good: 7.0,
    average: 6.2,
    poor: 5.5,
  }[performanceLevel];

  return sources.map((source) => {
    // 少しランダム性を持たせる
    const variance = (Math.random() - 0.5) * 0.6;
    const rating = Math.round((baseRating + variance) * 10) / 10;

    // コメントの言語を決定
    const langCode = getCommentLanguage(source.country);
    const commentData = getRandomComment(performanceLevel, langCode);

    // kickerはドイツ式（6段階、低いほど良い）
    if (source.source === "kicker") {
      const kickerRating = Math.round((7 - rating / 1.5) * 10) / 10;
      return {
        source: source.source,
        country: source.country,
        rating: Math.max(1, Math.min(6, kickerRating)),
        maxRating: 6,
        ratingSystem: "german",
        comment: commentData?.comment,
        commentTranslated: commentData?.commentTranslated,
      };
    }

    return {
      source: source.source,
      country: source.country,
      rating: Math.max(4, Math.min(10, rating)),
      maxRating: 10,
      ratingSystem: "standard",
      comment: commentData?.comment,
      commentTranslated: commentData?.commentTranslated,
    };
  });
}

/**
 * 統計文字列を生成
 */
function generateStatString(match: Match): string {
  const stats: string[] = [];
  if (match.playerStats.goals > 0) {
    stats.push(`${match.playerStats.goals} goal${match.playerStats.goals > 1 ? "s" : ""}`);
  }
  if (match.playerStats.assists > 0) {
    stats.push(`${match.playerStats.assists} assist${match.playerStats.assists > 1 ? "s" : ""}`);
  }
  if (stats.length === 0 && match.playerStats.minutesPlayed > 0) {
    stats.push(`${match.playerStats.minutesPlayed} minutes played`);
  }
  return stats.join(", ");
}

/**
 * 現地の声を生成
 */
function generateLocalVoices(match: Match, player: Player): LocalVoice[] {
  const country = player.league.country;
  const langCode = COUNTRY_LANGUAGE[country] || "EN";
  const templates = VOICE_TEMPLATES[langCode] || VOICE_TEMPLATES["EN"];
  const performanceLevel = getPerformanceLevel(match);
  const levelTemplates = templates[performanceLevel];

  if (!levelTemplates) return [];

  const voices: LocalVoice[] = [];
  const opponent = match.homeTeam.name.includes(player.club.shortName)
    ? match.awayTeam.name
    : match.homeTeam.name;
  const statString = generateStatString(match);

  // サポーターの声
  if (levelTemplates.supporter.length > 0) {
    const template = levelTemplates.supporter[Math.floor(Math.random() * levelTemplates.supporter.length)];
    voices.push({
      id: `v${Date.now()}_1`,
      username: `@${player.club.shortName.replace(/\s/g, "")}Fan`,
      role: "サポーター",
      roleKey: "supporter",
      languageCode: langCode,
      originalText: template.original
        .replace("{player}", player.name.en)
        .replace("{opponent}", opponent)
        .replace("{stat}", statString),
      translatedText: template.translated
        .replace("{player}", player.name.ja)
        .replace("{opponent}", opponent)
        .replace("{stat}", statString ? `(${statString})` : ""),
    });
  }

  // ジャーナリストの声（notableな試合のみ）
  if (match.notable && levelTemplates.journalist.length > 0) {
    const template = levelTemplates.journalist[Math.floor(Math.random() * levelTemplates.journalist.length)];
    voices.push({
      id: `v${Date.now()}_2`,
      username: `@${country}FootballAnalyst`,
      role: "ジャーナリスト",
      roleKey: "journalist",
      languageCode: langCode,
      originalText: template.original
        .replace("{player}", player.name.en)
        .replace("{opponent}", opponent)
        .replace("{stat}", statString),
      translatedText: template.translated
        .replace("{player}", player.name.ja)
        .replace("{opponent}", opponent)
        .replace("{stat}", statString ? `(${statString})` : ""),
    });
  }

  return voices;
}

// Xスレッドテンプレート
interface XThreadTemplate {
  type: "club" | "journalist" | "fan" | "analyst" | "japanese";
  username: string;
  verified: boolean;
  templates: {
    excellent: { original: string; translated: string }[];
    good: { original: string; translated: string }[];
    average: { original: string; translated: string }[];
    poor: { original: string; translated: string }[];
  };
}

interface XReplyTemplate {
  templates: {
    excellent: { original: string; translated: string }[];
    good: { original: string; translated: string }[];
    average: { original: string; translated: string }[];
    poor: { original: string; translated: string }[];
  };
}

const X_THREAD_TEMPLATES: XThreadTemplate[] = [
  {
    type: "club",
    username: "{clubName}",
    verified: true,
    templates: {
      excellent: [
        { original: "{playerEn} with {stat} against {opponent}! ⚽🔥 What a performance!", translated: "{playerJa}が{opponent}戦で{stat}！⚽🔥 素晴らしいパフォーマンス！" },
        { original: "🌟 {playerEn} shines bright! {stat} in today's match vs {opponent}. #MOTM", translated: "🌟 {playerJa}が輝く！{opponent}戦で{stat}。#マンオブザマッチ" },
      ],
      good: [
        { original: "{playerEn} puts in a solid shift against {opponent}. {stat} 💪", translated: "{playerJa}が{opponent}戦で堅実なプレー。{stat} 💪" },
        { original: "Another good display from {playerEn} today! {stat} vs {opponent}.", translated: "{playerJa}の今日も良いプレー！{opponent}戦で{stat}。" },
      ],
      average: [
        { original: "{playerEn} with {minutes} minutes against {opponent} today.", translated: "{playerJa}が{opponent}戦で{minutes}分間プレー。" },
        { original: "Full time: {playerEn} played his part in today's match vs {opponent}.", translated: "試合終了：{playerJa}が{opponent}戦に出場。" },
      ],
      poor: [
        { original: "{playerEn} featured against {opponent}. On to the next one. 💪", translated: "{playerJa}が{opponent}戦に出場。次に向けて。💪" },
      ],
    },
  },
  {
    type: "journalist",
    username: "{league}Reporter",
    verified: true,
    templates: {
      excellent: [
        { original: "🎯 {playerEn} was absolutely sensational today. {stat} against {opponent}. Japanese star continues to impress in {league}.", translated: "🎯 {playerJa}は今日絶対的にセンセーショナルだった。{opponent}戦で{stat}。日本のスターが{league}で印象を与え続けている。" },
        { original: "THREAD: Breaking down {playerEn}'s masterclass vs {opponent}. {stat} - here's why he was the difference maker today 🧵👇", translated: "スレッド：{opponent}戦での{playerJa}のマスタークラスを分析。{stat} - 今日の試合で彼が違いを生んだ理由はこれだ 🧵👇" },
      ],
      good: [
        { original: "{playerEn} showing why he's becoming a fan favorite. Solid display against {opponent}. {stat}", translated: "{playerJa}がファンのお気に入りになっている理由を示した。{opponent}戦で堅実なプレー。{stat}" },
        { original: "Watching {playerEn} develop in {league} has been a joy. Another composed performance vs {opponent}.", translated: "{league}での{playerJa}の成長を見るのは喜びだ。{opponent}戦でまた落ち着いたパフォーマンス。" },
      ],
      average: [
        { original: "{playerEn} with a quiet game against {opponent}. Not his best but showed glimpses of quality.", translated: "{playerJa}の{opponent}戦は静かな試合だった。ベストではないが質の高さを垣間見せた。" },
      ],
      poor: [
        { original: "Tough day for {playerEn} against {opponent}. Even the best have off days. Will bounce back.", translated: "{opponent}戦で{playerJa}には厳しい一日だった。最高の選手でも不調の日はある。巻き返すだろう。" },
      ],
    },
  },
  {
    type: "fan",
    username: "{clubShort}Supporter",
    verified: false,
    templates: {
      excellent: [
        { original: "I LOVE THIS MAN!!! {playerEn} YOU ABSOLUTE LEGEND!!! {stat} 🔥🔥🔥 #GOAT", translated: "この男が大好きだ！！！{playerJa}最高のレジェンド！！！{stat} 🔥🔥🔥 #史上最高" },
        { original: "{playerEn} just keeps getting better and better! {stat} against {opponent}! We're so lucky to have him! 🙌", translated: "{playerJa}はどんどん良くなっている！{opponent}戦で{stat}！彼がいて本当に幸運だ！🙌" },
        { original: "Best signing we've made in years. {playerEn} is different class. {stat} today. 🇯🇵👏", translated: "何年間で最高の補強だ。{playerJa}は別格。今日{stat}。🇯🇵👏" },
      ],
      good: [
        { original: "{playerEn} did his job again today. Reliable as always. 👍", translated: "{playerJa}は今日も仕事をした。相変わらず頼りになる。👍" },
        { original: "Solid game from {playerEn}! Love his work rate and attitude. 💙", translated: "{playerJa}の堅実な試合！彼の運動量と姿勢が好きだ。💙" },
      ],
      average: [
        { original: "{playerEn} wasn't at his best today but he never stops trying. That's what we love about him.", translated: "{playerJa}は今日ベストではなかったが、努力を止めない。それが彼の好きなところだ。" },
      ],
      poor: [
        { original: "Not {playerEn}'s day today but we all have those games. He'll be back stronger! 💪", translated: "今日は{playerJa}の日ではなかったが、誰にでもそういう試合はある。もっと強くなって帰ってくるだろう！💪" },
      ],
    },
  },
  {
    type: "analyst",
    username: "TacticsAnalyst",
    verified: true,
    templates: {
      excellent: [
        { original: "📊 {playerEn} vs {opponent} by numbers:\n• {stat}\n• 92% pass accuracy\n• 4 key passes\n• 3 successful dribbles\nWorld class.", translated: "📊 {playerJa}の{opponent}戦を数字で見る：\n• {stat}\n• パス成功率92%\n• キーパス4本\n• ドリブル成功3回\nワールドクラス。" },
        { original: "Heat map analysis: {playerEn} covered every blade of grass today. His off-the-ball movement was exceptional. {stat} 📈", translated: "ヒートマップ分析：{playerJa}は今日ピッチ全体をカバーした。ボールを持っていない時の動きが卓越していた。{stat} 📈" },
      ],
      good: [
        { original: "{playerEn}'s positioning today was excellent. Always making himself available. {stat} Good tactical awareness on display.", translated: "{playerJa}の今日のポジショニングは素晴らしかった。常に受ける位置を取っていた。{stat}良い戦術的意識を見せた。" },
      ],
      average: [
        { original: "{playerEn} had limited touches today ({minutes} mins) but his decision-making when on the ball was still sharp.", translated: "{playerJa}は今日タッチ数が限られていた（{minutes}分）が、ボールを持った時の判断は依然として鋭かった。" },
      ],
      poor: [
        { original: "Interesting tactical battle today. {playerEn} was well-marked by {opponent}'s defense. Sometimes that's just football.", translated: "今日は興味深い戦術的な戦いだった。{playerJa}は{opponent}の守備によくマークされた。サッカーとはそういうものだ。" },
      ],
    },
  },
  {
    type: "japanese",
    username: "日本サッカーファン",
    verified: false,
    templates: {
      excellent: [
        { original: "{playerJa}やばすぎる！！！{opponent}相手に{stat}！！これが日本の誇りだ！🇯🇵⚽", translated: "{playerJa}やばすぎる！！！{opponent}相手に{stat}！！これが日本の誇りだ！🇯🇵⚽" },
        { original: "今日の{playerJa}は神がかってた…{stat}とか冗談でしょ…🔥🔥", translated: "今日の{playerJa}は神がかってた…{stat}とか冗談でしょ…🔥🔥" },
        { original: "{playerJa}のプレー見てると朝から元気出る！{stat}！最高かよ！", translated: "{playerJa}のプレー見てると朝から元気出る！{stat}！最高かよ！" },
      ],
      good: [
        { original: "{playerJa}今日も安定してたね！{stat}でしっかり貢献👏", translated: "{playerJa}今日も安定してたね！{stat}でしっかり貢献👏" },
        { original: "海外で活躍する{playerJa}を見ると誇らしい気持ちになる🇯🇵", translated: "海外で活躍する{playerJa}を見ると誇らしい気持ちになる🇯🇵" },
      ],
      average: [
        { original: "{playerJa}今日はちょっと静かだったけど、守備は頑張ってた。次に期待！", translated: "{playerJa}今日はちょっと静かだったけど、守備は頑張ってた。次に期待！" },
      ],
      poor: [
        { original: "{playerJa}今日は苦しかったけど、こういう日もある。切り替えて次頑張れ！💪", translated: "{playerJa}今日は苦しかったけど、こういう日もある。切り替えて次頑張れ！💪" },
      ],
    },
  },
];

const X_REPLY_TEMPLATES: XReplyTemplate = {
  templates: {
    excellent: [
      { original: "What a player! {playerEn} is on fire! 🔥", translated: "なんという選手だ！{playerJa}が絶好調！🔥" },
      { original: "This guy is special. Glad he's on our team! 🙌", translated: "この選手は特別だ。チームにいて嬉しい！🙌" },
      { original: "MOTM easily. No debate needed.", translated: "文句なしのマンオブザマッチ。議論の余地なし。" },
      { original: "Japanese players really bringing quality to {league} 🇯🇵", translated: "日本人選手が本当に{league}にクオリティをもたらしている 🇯🇵" },
      { original: "Best performance I've seen from him! Incredible!", translated: "彼の最高のパフォーマンスを見た！信じられない！" },
      { original: "Give this man a new contract NOW! 📝", translated: "今すぐこの男に新契約を！📝" },
    ],
    good: [
      { original: "Solid as always. Love his consistency.", translated: "いつも通り堅実。彼の安定感が好きだ。" },
      { original: "Good game! Keep it up {playerEn}! 👏", translated: "良い試合！この調子で{playerJa}！👏" },
      { original: "Reliable performance. Exactly what we needed.", translated: "頼れるパフォーマンス。まさに必要としていたもの。" },
      { original: "He just does his job every week. Respect.", translated: "毎週仕事をこなす。リスペクト。" },
    ],
    average: [
      { original: "Not his best but still contributed. On to the next!", translated: "ベストではないが貢献した。次に向けて！" },
      { original: "Quiet game but these happen. He'll be back.", translated: "静かな試合だったが、こういうこともある。戻ってくるだろう。" },
      { original: "Need to see more from him but not worried.", translated: "もっと見たいが心配はしていない。" },
    ],
    poor: [
      { original: "Tough day. Everyone has them. Move on.", translated: "厳しい一日。誰にでもある。前に進もう。" },
      { original: "He'll bounce back. Quality players always do.", translated: "巻き返すだろう。質の高い選手は常にそうする。" },
      { original: "Not his day but still a great player.", translated: "彼の日ではなかったが、それでも素晴らしい選手だ。" },
    ],
  },
};

/**
 * Xスレッドを生成（全試合に対して生成）
 */
function generateXThreads(match: Match, player: Player): XThread[] {
  const opponent = match.homeTeam.name.includes(player.club.shortName)
    ? match.awayTeam.name
    : match.homeTeam.name;

  const performanceLevel = getPerformanceLevel(match);
  const statString = generateStatString(match) || "a strong showing";
  const langCode = COUNTRY_LANGUAGE[player.league.country] || "EN";

  const threads: XThread[] = [];
  const usedTemplateIndices = new Set<number>();

  // 5つのスレッドを生成
  for (let i = 0; i < 5; i++) {
    // 使用可能なテンプレートを選択
    let templateIndex: number;
    do {
      templateIndex = Math.floor(Math.random() * X_THREAD_TEMPLATES.length);
    } while (usedTemplateIndices.has(templateIndex) && usedTemplateIndices.size < X_THREAD_TEMPLATES.length);
    usedTemplateIndices.add(templateIndex);

    const threadTemplate = X_THREAD_TEMPLATES[templateIndex];
    const levelTemplates = threadTemplate.templates[performanceLevel];

    if (!levelTemplates || levelTemplates.length === 0) continue;

    const selectedTemplate = levelTemplates[Math.floor(Math.random() * levelTemplates.length)];

    // テンプレート変数を置換
    const replaceVars = (text: string): string => {
      return text
        .replace(/{playerEn}/g, player.name.en)
        .replace(/{playerJa}/g, player.name.ja)
        .replace(/{opponent}/g, opponent)
        .replace(/{stat}/g, statString)
        .replace(/{minutes}/g, String(match.playerStats.minutesPlayed))
        .replace(/{clubName}/g, player.club.name.replace(/\s/g, ""))
        .replace(/{clubShort}/g, player.club.shortName.replace(/\s/g, ""))
        .replace(/{league}/g, player.league.shortName);
    };

    const username = replaceVars(threadTemplate.username);

    // リプライを生成（2-4個）
    const replyCount = 2 + Math.floor(Math.random() * 3);
    const replies: XReply[] = [];
    const replyTemplates = X_REPLY_TEMPLATES.templates[performanceLevel];
    const usedReplyIndices = new Set<number>();

    for (let j = 0; j < replyCount && j < replyTemplates.length; j++) {
      let replyIndex: number;
      do {
        replyIndex = Math.floor(Math.random() * replyTemplates.length);
      } while (usedReplyIndices.has(replyIndex) && usedReplyIndices.size < replyTemplates.length);
      usedReplyIndices.add(replyIndex);

      const replyTemplate = replyTemplates[replyIndex];

      replies.push({
        id: `r${Date.now()}_${i}_${j}`,
        username: `@Fan_${Math.floor(Math.random() * 10000)}`,
        languageCode: Math.random() > 0.5 ? "EN" : "JA",
        originalText: replaceVars(replyTemplate.original),
        translatedText: replaceVars(replyTemplate.translated),
        likes: Math.floor(50 + Math.random() * 500),
      });
    }

    threads.push({
      id: `t${Date.now()}_${i}`,
      username: `@${username}`,
      verified: threadTemplate.verified,
      languageCode: threadTemplate.type === "japanese" ? "JA" : langCode,
      originalText: replaceVars(selectedTemplate.original),
      translatedText: replaceVars(selectedTemplate.translated),
      likes: Math.floor(1000 + Math.random() * 25000),
      retweets: Math.floor(200 + Math.random() * 5000),
      replies,
    });
  }

  return threads;
}

/**
 * メイン処理
 */
async function main(newMatchIds?: string[]) {
  console.log("=== コンテンツ自動生成スクリプト ===\n");

  // データファイルを読み込み
  const players: Player[] = JSON.parse(readFileSync(PLAYERS_FILE, "utf-8"));
  const matches: Match[] = JSON.parse(readFileSync(MATCHES_FILE, "utf-8"));
  const existingMediaRatings: MatchMediaData[] = JSON.parse(readFileSync(MEDIA_RATINGS_FILE, "utf-8"));

  // 既存のメディアデータIDをセットで管理
  const existingIds = new Set(existingMediaRatings.map((m) => m.matchId));

  // 処理対象の試合を決定
  const targetMatches = newMatchIds
    ? matches.filter((m) => newMatchIds.includes(m.matchId))
    : matches.filter((m) => !existingIds.has(m.matchId));

  if (targetMatches.length === 0) {
    console.log("コンテンツを生成する新しい試合がありません。");
    return;
  }

  console.log(`${targetMatches.length}件の試合に対してコンテンツを生成します...\n`);

  const newMediaData: MatchMediaData[] = [];

  for (const match of targetMatches) {
    const player = players.find((p) => p.id === match.playerId);
    if (!player) {
      console.log(`[SKIP] 選手が見つかりません: ${match.playerId}`);
      continue;
    }

    console.log(`処理中: ${player.name.ja} - ${match.date} vs ${match.awayTeam.name}`);

    const ratings = generateRatings(match, player);
    const averageRating = Math.round(
      (ratings.filter((r) => r.ratingSystem === "standard").reduce((sum, r) => sum + r.rating, 0) /
        ratings.filter((r) => r.ratingSystem === "standard").length) *
        10
    ) / 10;

    const mediaData: MatchMediaData = {
      matchId: match.matchId,
      playerId: match.playerId,
      ratings,
      averageRating,
      localVoices: generateLocalVoices(match, player),
      xThreads: generateXThreads(match, player),
      lastUpdated: new Date().toISOString(),
    };

    newMediaData.push(mediaData);
    console.log(`  [生成完了] レーティング: ${averageRating}, 現地の声: ${mediaData.localVoices.length}件`);
  }

  if (newMediaData.length > 0) {
    // 新しいデータを追加して保存
    const allMediaData = [...existingMediaRatings, ...newMediaData];
    writeFileSync(MEDIA_RATINGS_FILE, JSON.stringify(allMediaData, null, 2));
    console.log(`\n=== 完了: ${newMediaData.length}件の試合にコンテンツを生成しました ===`);
  }
}

// コマンドライン引数から新規試合IDを取得（オプション）
const args = process.argv.slice(2);
const matchIds = args.length > 0 ? args : undefined;

main(matchIds).catch(console.error);

export { main as generateContent };
