export const LEAGUE_OPTIONS = [
  { value: "all", label: "全リーグ" },
  { value: "プレミアリーグ", label: "プレミアリーグ" },
  { value: "ラ・リーガ", label: "ラ・リーガ" },
  { value: "ブンデスリーガ", label: "ブンデスリーガ" },
  { value: "エールディヴィジ", label: "エールディヴィジ" },
] as const;

export const POSITION_OPTIONS = [
  { value: "all", label: "全ポジション" },
  { value: "FW", label: "FW" },
  { value: "MF", label: "MF" },
  { value: "DF", label: "DF" },
  { value: "GK", label: "GK" },
] as const;

export const SORT_OPTIONS = [
  { value: "rating", label: "評価点" },
  { value: "goals", label: "ゴール数" },
  { value: "name", label: "名前" },
  { value: "marketValue", label: "市場価値" },
] as const;

export const ORDER_OPTIONS = [
  { value: "desc", label: "降順" },
  { value: "asc", label: "昇順" },
] as const;

export const POSITION_CATEGORY_MAP: Record<string, string> = {
  ST: "FW",
  CF: "FW",
  LW: "FW",
  RW: "FW",
  LF: "FW",
  RF: "FW",
  CAM: "MF",
  CM: "MF",
  CDM: "MF",
  LM: "MF",
  RM: "MF",
  CB: "DF",
  LB: "DF",
  RB: "DF",
  LWB: "DF",
  RWB: "DF",
  GK: "GK",
};
