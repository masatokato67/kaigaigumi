export function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export function isValidNumber(value: string, min = 0, max = Infinity): boolean {
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= min && num <= max;
}

export function isValidLanguageCode(code: string): boolean {
  const validCodes = ["EN", "ES", "DE", "NL", "FR", "IT", "PT", "JA"];
  return validCodes.includes(code.toUpperCase());
}

export function isValidRoleKey(role: string): role is "supporter" | "journalist" | "analyst" {
  return ["supporter", "journalist", "analyst"].includes(role);
}

export function isValidPosition(position: string): boolean {
  const validPositions = [
    "GK", "CB", "LB", "RB", "LWB", "RWB",
    "CDM", "CM", "CAM", "LM", "RM",
    "LW", "RW", "CF", "ST"
  ];
  return validPositions.includes(position.toUpperCase());
}

export function isValidCompetition(competition: string): boolean {
  const validCompetitions = [
    "プレミアリーグ",
    "ラ・リーガ",
    "ブンデスリーガ",
    "セリエA",
    "リーグ・アン",
    "エールディヴィジ",
    "FAカップ",
    "EFLカップ",
    "UEFAチャンピオンズリーグ",
    "UEFAヨーロッパリーグ",
    "UEFAカンファレンスリーグ",
    "DFBポカール",
    "コパ・デル・レイ",
    "国際親善試合",
    "ワールドカップ予選",
    "アジアカップ"
  ];
  return validCompetitions.includes(competition);
}
