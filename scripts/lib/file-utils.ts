import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Player, Match, MatchMediaData } from "../../src/lib/types";

const DATA_DIR = join(process.cwd(), "src", "data");

export function readPlayers(): Player[] {
  const filePath = join(DATA_DIR, "players.json");
  const content = readFileSync(filePath, "utf-8");
  return JSON.parse(content) as Player[];
}

export function writePlayers(players: Player[]): void {
  const filePath = join(DATA_DIR, "players.json");
  writeFileSync(filePath, JSON.stringify(players, null, 2) + "\n", "utf-8");
}

export function readMatches(): Match[] {
  const filePath = join(DATA_DIR, "matches.json");
  const content = readFileSync(filePath, "utf-8");
  return JSON.parse(content) as Match[];
}

export function writeMatches(matches: Match[]): void {
  const filePath = join(DATA_DIR, "matches.json");
  writeFileSync(filePath, JSON.stringify(matches, null, 2) + "\n", "utf-8");
}

export function readMediaRatings(): MatchMediaData[] {
  const filePath = join(DATA_DIR, "media-ratings.json");
  const content = readFileSync(filePath, "utf-8");
  return JSON.parse(content) as MatchMediaData[];
}

export function writeMediaRatings(mediaRatings: MatchMediaData[]): void {
  const filePath = join(DATA_DIR, "media-ratings.json");
  writeFileSync(filePath, JSON.stringify(mediaRatings, null, 2) + "\n", "utf-8");
}

export function generateMatchId(playerId: string, date: string): string {
  // date format: YYYY-MM-DD -> YYYYMMDD
  const dateStr = date.replace(/-/g, "");
  return `${playerId}-${dateStr}`;
}

export function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
