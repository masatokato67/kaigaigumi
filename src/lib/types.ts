export interface Player {
  id: string;
  name: {
    ja: string;
    en: string;
  };
  position: string;
  positionCategory: PositionCategory;
  nationality: string;
  club: {
    name: string;
    shortName: string;
  };
  league: {
    name: string;
    shortName: string;
    country: string;
  };
  photo: string;
  marketValue: string;
  caps: number;
  seasonStats: {
    season: string;
    goals: number;
    assists: number;
    appearances: number;
    minutesPlayed: number;
    averageRating: number;
  };
  featured: boolean;
}

export type PositionCategory = "FW" | "MF" | "DF" | "GK";

export interface Match {
  matchId: string;
  playerId: string;
  date: string;
  competition: string;
  homeTeam: {
    name: string;
    score: number;
  };
  awayTeam: {
    name: string;
    score: number;
  };
  playerStats: {
    minutesPlayed: number;
    goals: number;
    assists: number;
    starting: boolean;
    position: string;
    rating: number;
  };
  notable: boolean;
  detailedStats?: DetailedStats;
}

export interface DetailedStats {
  // シュート
  totalShots?: number;
  shotsOnTarget?: number;
  expectedGoals?: number;
  expectedAssists?: number;

  // パス
  totalPass?: number;
  accuratePass?: number;
  keyPass?: number;
  totalCross?: number;
  totalLongBalls?: number;
  accurateLongBalls?: number;

  // 守備
  totalTackle?: number;
  wonTackle?: number;
  interceptionWon?: number;
  totalClearance?: number;
  blockedScoringAttempt?: number;
  ballRecovery?: number;

  // デュエル
  duelWon?: number;
  duelLost?: number;
  aerialWon?: number;
  aerialLost?: number;

  // その他
  touches?: number;
  fouls?: number;
  wasFouled?: number;
  possessionLostCtrl?: number;
  dispossessed?: number;
}

export interface HighlightVideo {
  enabled: boolean;
  youtubeId: string;
  title: string;
}

export interface MatchMediaData {
  matchId: string;
  playerId: string;
  ratings: MediaRating[];
  averageRating: number;
  localVoices: LocalVoice[];
  xThreads: XThread[];
  lastUpdated?: string; // ISO 8601形式 (例: "2026-02-10T15:30:00Z")
}

export interface MediaRating {
  source: string;
  country: string;
  rating: number;
  maxRating: number;
  ratingSystem: "standard" | "german";
  comment?: string;
  commentTranslated?: string;
  isManual?: boolean;
  articleUrl?: string;
  hasArticleRating?: boolean; // 記事内にスコアが明記されていたか
}

export interface LocalVoice {
  id: string;
  username: string;
  role: string;
  roleKey: "supporter" | "journalist" | "analyst";
  languageCode: string;
  originalText: string;
  translatedText: string;
}

export interface ThreadReply {
  id: string;
  username: string;
  languageCode: string;
  originalText: string;
  translatedText: string;
  likes: number;
}

export interface XThread {
  id: string;
  username: string;
  verified: boolean;
  languageCode: string;
  originalText: string;
  translatedText: string;
  likes: number;
  retweets: number;
  replies: ThreadReply[];
  isManual?: boolean;
  postUrl?: string;
}

export interface PlayerMediaRating extends MediaRating {
  date: string;
}

export interface PlayerXThread extends XThread {
  date: string;
}

export interface PlayerMediaData {
  playerId: string;
  mediaRatings: PlayerMediaRating[];
  xThreads: PlayerXThread[];
}

export type LeagueFilter = "all" | "プレミアリーグ" | "ラ・リーガ" | "ブンデスリーガ" | "エールディヴィジ";
export type PositionFilter = "all" | "FW" | "MF" | "DF" | "GK";
export type SortField = "name" | "rating" | "goals" | "marketValue";
export type SortOrder = "asc" | "desc";

export interface PlayerFilters {
  league: LeagueFilter;
  position: PositionFilter;
  sortBy: SortField;
  sortOrder: SortOrder;
}
