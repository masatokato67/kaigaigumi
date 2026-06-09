import { join } from "path";

/**
 * シーズン定義（src/lib/seasons.ts と同期）
 * スクリプト用: Node.js環境で使用
 */
interface SeasonConfig {
  id: string;
  from: string;
  to: string;
}

const SEASONS: SeasonConfig[] = [
  { id: "2026-27", from: "2026-08-01", to: "2027-06-30" },
  { id: "wc2026",  from: "2026-06-01", to: "2026-07-31" },
  { id: "2025-26", from: "2025-07-01", to: "2026-05-31" },
];

/**
 * 日付文字列からシーズンIDを判定
 */
export function getSeasonId(date: string): string {
  for (const s of SEASONS) {
    if (date >= s.from && date <= s.to) return s.id;
  }
  // フォールバック
  const year = parseInt(date.substring(0, 4));
  const month = parseInt(date.substring(5, 7));
  const startYear = month >= 7 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(2)}`;
}

/**
 * matchId (例: "kamada-20260305") からシーズンIDを返す
 */
export function getSeasonFromMatchId(matchId: string): string {
  const m = matchId.match(/(\d{8})$/);
  if (!m) return SEASONS[SEASONS.length - 1].id;
  const d = m[1];
  const date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  return getSeasonId(date);
}

/**
 * matchId から match-inputs のファイルパスを返す
 */
export function getMatchInputPath(matchId: string): string {
  const season = getSeasonFromMatchId(matchId);
  return join(process.cwd(), "match-inputs", season, `${matchId}.json`);
}

/**
 * シーズンIDから src/data/seasons/<id>/ のパスを返す
 */
export function getSeasonDataDir(seasonId: string): string {
  return join(process.cwd(), "src", "data", "seasons", seasonId);
}

/**
 * matchId から対応するシーズンのデータディレクトリパスを返す
 */
export function getSeasonDataDirForMatch(matchId: string): string {
  return getSeasonDataDir(getSeasonFromMatchId(matchId));
}

export { SEASONS };
