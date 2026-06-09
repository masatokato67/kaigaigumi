import playersData from "@/data/players.json";
import matchInputsIndex from "@/data/match-inputs-index.json";
import { SEASONS } from "./seasons";
import type { Player, Match, MatchMediaData, PlayerFilters, HighlightVideo, PlayerMediaData } from "./types";

// ── シーズン別データの読み込み ──
/* eslint-disable @typescript-eslint/no-require-imports */

// matches
const matchesBySeason: Record<string, Match[]> = {};
try { matchesBySeason["2025-26"] = require("@/data/seasons/2025-26/matches.json"); } catch { /* */ }
try { matchesBySeason["wc2026"] = require("@/data/seasons/wc2026/matches.json"); } catch { /* */ }
try { matchesBySeason["2026-27"] = require("@/data/seasons/2026-27/matches.json"); } catch { /* */ }

// media-ratings
const mediaRatingsBySeason: Record<string, MatchMediaData[]> = {};
try { mediaRatingsBySeason["2025-26"] = require("@/data/seasons/2025-26/media-ratings.json"); } catch { /* */ }
try { mediaRatingsBySeason["wc2026"] = require("@/data/seasons/wc2026/media-ratings.json"); } catch { /* */ }
try { mediaRatingsBySeason["2026-27"] = require("@/data/seasons/2026-27/media-ratings.json"); } catch { /* */ }

// highlight-videos
const highlightVideosBySeason: Record<string, Record<string, HighlightVideo>> = {};
try { highlightVideosBySeason["2025-26"] = require("@/data/seasons/2025-26/highlight-videos.json"); } catch { /* */ }
try { highlightVideosBySeason["wc2026"] = require("@/data/seasons/wc2026/highlight-videos.json"); } catch { /* */ }
try { highlightVideosBySeason["2026-27"] = require("@/data/seasons/2026-27/highlight-videos.json"); } catch { /* */ }

// player-media (シーズン共通)
const playerMediaFiles: Record<string, PlayerMediaData> = {};
try { playerMediaFiles["mitoma"] = require("@/data/player-media/mitoma.json"); } catch { /* */ }
try { playerMediaFiles["kubo"] = require("@/data/player-media/kubo.json"); } catch { /* */ }
try { playerMediaFiles["tomiyasu"] = require("@/data/player-media/tomiyasu.json"); } catch { /* */ }
try { playerMediaFiles["kamada"] = require("@/data/player-media/kamada.json"); } catch { /* */ }
try { playerMediaFiles["endo"] = require("@/data/player-media/endo.json"); } catch { /* */ }
try { playerMediaFiles["shiogai"] = require("@/data/player-media/shiogai.json"); } catch { /* */ }
try { playerMediaFiles["sano_kodai"] = require("@/data/player-media/sano_kodai.json"); } catch { /* */ }
try { playerMediaFiles["sano_kaishu"] = require("@/data/player-media/sano_kaishu.json"); } catch { /* */ }
try { playerMediaFiles["suzuki_yuito"] = require("@/data/player-media/suzuki_yuito.json"); } catch { /* */ }
/* eslint-enable @typescript-eslint/no-require-imports */

// ── 統合データ（全シーズン横断） ──
const allMatches: Match[] = SEASONS.flatMap((s) => matchesBySeason[s.id] || []);
const allMediaRatings: MatchMediaData[] = SEASONS.flatMap((s) => mediaRatingsBySeason[s.id] || []);
const allHighlightVideos: Record<string, HighlightVideo> = Object.assign(
  {},
  ...SEASONS.map((s) => highlightVideosBySeason[s.id] || {})
);

const players = playersData as Player[];
const matchInputIds = new Set<string>(matchInputsIndex as string[]);

// ── Players ──

export function getAllPlayers(): Player[] {
  return players;
}

export function getPlayerById(id: string): Player | undefined {
  return players.find((p) => p.id === id);
}

export function getFilteredPlayers(filters: PlayerFilters): Player[] {
  let result = [...players];

  if (filters.league !== "all") {
    result = result.filter((p) => p.league.shortName === filters.league);
  }

  if (filters.position !== "all") {
    result = result.filter((p) => p.positionCategory === filters.position);
  }

  result.sort((a, b) => {
    let cmp = 0;
    switch (filters.sortBy) {
      case "rating":
        cmp = a.seasonStats.averageRating - b.seasonStats.averageRating;
        break;
      case "goals":
        cmp = a.seasonStats.goals - b.seasonStats.goals;
        break;
      case "name":
        cmp = a.name.ja.localeCompare(b.name.ja, "ja");
        break;
      case "marketValue":
        cmp = parseMarketValue(a.marketValue) - parseMarketValue(b.marketValue);
        break;
    }
    return filters.sortOrder === "desc" ? -cmp : cmp;
  });

  return result;
}

function parseMarketValue(value: string): number {
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : num;
}

export function getFeaturedPlayers(limit: number = 6): Player[] {
  return [...players]
    .sort((a, b) => b.seasonStats.averageRating - a.seasonStats.averageRating)
    .slice(0, limit);
}

export function getSeasonAggregateStats() {
  return {
    playerCount: players.length,
    totalGoals: players.reduce((sum, p) => sum + p.seasonStats.goals, 0),
    totalAssists: players.reduce((sum, p) => sum + p.seasonStats.assists, 0),
    totalAppearances: players.reduce(
      (sum, p) => sum + p.seasonStats.appearances,
      0
    ),
  };
}

// ── Matches（全シーズン横断） ──

export function getAllMatches(): Match[] {
  return allMatches;
}

export function getMatchesByPlayerId(playerId: string): Match[] {
  return allMatches
    .filter((m) => m.playerId === playerId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getMatchById(matchId: string): Match | undefined {
  return allMatches.find((m) => m.matchId === matchId);
}

export function getNotableMatches(): Match[] {
  return allMatches
    .filter((m) => m.notable)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ── Seasons ──

export function getAvailableSeasons(): { id: string; label: string }[] {
  return SEASONS.map((s) => ({ id: s.id, label: s.label }));
}

export function getMatchesBySeason(seasonId: string): Match[] {
  return [...(matchesBySeason[seasonId] || [])]
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ── Home widgets（手動運用済みのみ） ──

export function getRecentMatches(limit: number = 10): Match[] {
  const mediaMap = new Map(allMediaRatings.map((mr) => [mr.matchId, mr]));

  return allMatches
    .filter((m) => matchInputIds.has(m.matchId))
    .sort((a, b) => {
      const aUpdated = mediaMap.get(a.matchId)?.lastUpdated ?? a.date;
      const bUpdated = mediaMap.get(b.matchId)?.lastUpdated ?? b.date;
      return bUpdated.localeCompare(aUpdated);
    })
    .slice(0, limit);
}

export function getTopRatedMatches(limit: number = 10): Match[] {
  const mediaMap = new Map(allMediaRatings.map((mr) => [mr.matchId, mr]));

  return allMatches
    .filter((m) => matchInputIds.has(m.matchId))
    .map((match) => ({
      match,
      rating: mediaMap.get(match.matchId)?.averageRating ?? match.playerStats.rating,
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit)
    .map((item) => item.match);
}

// ── Media / Highlights ──

export function getMediaRatingsByMatchId(
  matchId: string
): MatchMediaData | undefined {
  return allMediaRatings.find((mr) => mr.matchId === matchId);
}

export function getMediaAverageRating(matchId: string): number | undefined {
  const media = allMediaRatings.find((mr) => mr.matchId === matchId);
  return media?.averageRating;
}

export function getHighlightVideoByMatchId(
  matchId: string
): HighlightVideo | undefined {
  const video = allHighlightVideos[matchId];
  if (video && video.enabled && video.youtubeId) {
    return video;
  }
  return undefined;
}

// ── Player media ──

export function getPlayerMediaData(playerId: string): PlayerMediaData | null {
  const data = playerMediaFiles[playerId];
  if (!data) return null;
  return {
    ...data,
    mediaRatings: [...data.mediaRatings].sort((a, b) => b.date.localeCompare(a.date)),
    xThreads: [...data.xThreads].sort((a, b) => b.date.localeCompare(a.date)),
  };
}
