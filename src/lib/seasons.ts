/**
 * シーズン定義
 * 新しいシーズンを追加する場合はここに追記する
 */

export interface SeasonConfig {
  id: string;     // ファイル名・URLで使うキー: "2025-26", "wc2026", "2026-27"
  label: string;  // UIに表示するラベル
  from: string;   // 開始日 (YYYY-MM-DD)
  to: string;     // 終了日 (YYYY-MM-DD)
}

// 新しい順に定義（UI表示順）
export const SEASONS: SeasonConfig[] = [
  { id: "2026-27",  label: "2026-2027",         from: "2026-08-01", to: "2027-06-30" },
  { id: "wc2026",   label: "2026 ワールドカップ", from: "2026-06-01", to: "2026-07-31" },
  { id: "2025-26",  label: "2025-2026",         from: "2025-07-01", to: "2026-05-31" },
];

/**
 * 日付文字列からシーズンIDを判定
 */
export function getSeasonId(date: string): string {
  for (const s of SEASONS) {
    if (date >= s.from && date <= s.to) return s.id;
  }
  // フォールバック: 7月-6月ルール
  const year = parseInt(date.substring(0, 4));
  const month = parseInt(date.substring(5, 7));
  const startYear = month >= 7 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(2)}`;
}

/**
 * matchId (例: "kamada-20260305") から日付を抽出してシーズンIDを返す
 */
export function getSeasonFromMatchId(matchId: string): string {
  const dateMatch = matchId.match(/(\d{8})$/);
  if (!dateMatch) return SEASONS[SEASONS.length - 1].id;
  const d = dateMatch[1];
  const date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  return getSeasonId(date);
}

/**
 * シーズンIDからSeasonConfigを取得
 */
export function getSeasonConfig(seasonId: string): SeasonConfig | undefined {
  return SEASONS.find((s) => s.id === seasonId);
}
