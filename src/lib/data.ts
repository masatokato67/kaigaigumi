import playersData from "@/data/players.json";
import matchesData from "@/data/matches.json";
import mediaRatingsData from "@/data/media-ratings.json";
import type { Player, Match, MatchMediaData, PlayerFilters } from "./types";

const players = playersData as Player[];
const matches = matchesData as Match[];
const mediaRatings = mediaRatingsData as MatchMediaData[];

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

export function getMatchesByPlayerId(playerId: string): Match[] {
  return matches
    .filter((m) => m.playerId === playerId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getMatchById(matchId: string): Match | undefined {
  return matches.find((m) => m.matchId === matchId);
}

export function getMediaRatingsByMatchId(
  matchId: string
): MatchMediaData | undefined {
  return mediaRatings.find((mr) => mr.matchId === matchId);
}

export function getNotableMatches(): Match[] {
  return matches
    .filter((m) => m.notable)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getFeaturedPlayers(): Player[] {
  return players.filter((p) => p.featured);
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
