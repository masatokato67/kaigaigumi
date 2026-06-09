import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import type { Player, Match, MatchMediaData, HighlightVideo, PlayerMediaData } from "../../src/lib/types";

const DATA_DIR = join(process.cwd(), "src", "data");
const SEASONS_DIR = join(DATA_DIR, "seasons");
const PLAYER_MEDIA_DIR = join(DATA_DIR, "player-media");

// ── ヘルパー ──

function getSeasonDirs(): string[] {
  try {
    return readdirSync(SEASONS_DIR).filter((d) =>
      statSync(join(SEASONS_DIR, d)).isDirectory()
    );
  } catch {
    return [];
  }
}

// ── Players（シーズン共通） ──

export function readPlayers(): Player[] {
  return JSON.parse(readFileSync(join(DATA_DIR, "players.json"), "utf-8"));
}

export function writePlayers(players: Player[]): void {
  writeFileSync(join(DATA_DIR, "players.json"), JSON.stringify(players, null, 2) + "\n");
}

// ── 全シーズン横断読み込み（lookup用） ──

export function readMatches(): Match[] {
  const all: Match[] = [];
  for (const s of getSeasonDirs()) {
    try {
      all.push(...JSON.parse(readFileSync(join(SEASONS_DIR, s, "matches.json"), "utf-8")));
    } catch { /* */ }
  }
  return all;
}

export function readMediaRatings(): MatchMediaData[] {
  const all: MatchMediaData[] = [];
  for (const s of getSeasonDirs()) {
    try {
      all.push(...JSON.parse(readFileSync(join(SEASONS_DIR, s, "media-ratings.json"), "utf-8")));
    } catch { /* */ }
  }
  return all;
}

export function readHighlightVideos(): Record<string, HighlightVideo> {
  const all: Record<string, HighlightVideo> = {};
  for (const s of getSeasonDirs()) {
    try {
      Object.assign(all, JSON.parse(readFileSync(join(SEASONS_DIR, s, "highlight-videos.json"), "utf-8")));
    } catch { /* */ }
  }
  return all;
}

// ── シーズン指定 読み書き ──

export function readSeasonMatches(seasonId: string): Match[] {
  try {
    return JSON.parse(readFileSync(join(SEASONS_DIR, seasonId, "matches.json"), "utf-8"));
  } catch {
    return [];
  }
}

export function writeSeasonMatches(seasonId: string, matches: Match[]): void {
  writeFileSync(
    join(SEASONS_DIR, seasonId, "matches.json"),
    JSON.stringify(matches, null, 2) + "\n"
  );
}

export function readSeasonMediaRatings(seasonId: string): MatchMediaData[] {
  try {
    return JSON.parse(readFileSync(join(SEASONS_DIR, seasonId, "media-ratings.json"), "utf-8"));
  } catch {
    return [];
  }
}

export function writeSeasonMediaRatings(seasonId: string, data: MatchMediaData[]): void {
  writeFileSync(
    join(SEASONS_DIR, seasonId, "media-ratings.json"),
    JSON.stringify(data, null, 2) + "\n"
  );
}

export function readSeasonHighlightVideos(seasonId: string): Record<string, HighlightVideo> {
  try {
    return JSON.parse(readFileSync(join(SEASONS_DIR, seasonId, "highlight-videos.json"), "utf-8"));
  } catch {
    return {};
  }
}

export function writeSeasonHighlightVideos(seasonId: string, data: Record<string, HighlightVideo>): void {
  writeFileSync(
    join(SEASONS_DIR, seasonId, "highlight-videos.json"),
    JSON.stringify(data, null, 2) + "\n"
  );
}

// ── Player Media（シーズン共通） ──

export function readPlayerMedia(playerId: string): PlayerMediaData {
  const filePath = join(PLAYER_MEDIA_DIR, `${playerId}.json`);
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return { playerId, mediaRatings: [], xThreads: [] };
  }
}

export function writePlayerMedia(data: PlayerMediaData): void {
  const { mkdirSync } = require("fs");
  mkdirSync(PLAYER_MEDIA_DIR, { recursive: true });
  writeFileSync(
    join(PLAYER_MEDIA_DIR, `${data.playerId}.json`),
    JSON.stringify(data, null, 2) + "\n"
  );
}

// ── ユーティリティ ──

export function generateMatchId(playerId: string, date: string): string {
  return `${playerId}-${date.replace(/-/g, "")}`;
}

export function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export { SEASONS_DIR, DATA_DIR };
