/**
 * FotMob APIから試合データを取得するスクリプト
 * GitHub Actionsで定期実行される
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// データファイルのパス
const DATA_DIR = join(__dirname, "../src/data");
const PLAYERS_FILE = join(DATA_DIR, "players.json");
const MATCHES_FILE = join(DATA_DIR, "matches.json");

// 型定義
interface FotMobInfo {
  playerId: string;
}

interface Player {
  id: string;
  name: { ja: string; en: string };
  club: { name: string; shortName: string };
  league: { name: string; shortName: string; country: string };
  fotmob?: FotMobInfo;
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

// FotMob APIのレスポンス型
interface FotMobMatch {
  matchDate: {
    utcTime: string;
  };
  opponentTeamId: number;
  opponentTeamName: string;
  homeScore: number;
  awayScore: number;
  isHomeTeam: boolean;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  ratingProps?: {
    rating?: string;
    isTopRating?: boolean;
  };
  playerOfTheMatch?: boolean;
  onBench?: boolean;
  leagueId?: number;
  leagueName?: string;
}

interface FotMobPlayerData {
  name: string;
  recentMatches?: FotMobMatch[];
}

// リーグ名のマッピング（英語→日本語）
const LEAGUE_NAME_MAP: Record<string, string> = {
  "Premier League": "プレミアリーグ",
  "LaLiga": "ラ・リーガ",
  "La Liga": "ラ・リーガ",
  "Bundesliga": "ブンデスリーガ",
  "Eredivisie": "エールディヴィジ",
  "Serie A": "セリエA",
  "Ligue 1": "リーグ・アン",
  "UEFA Champions League": "チャンピオンズリーグ",
  "Champions League": "チャンピオンズリーグ",
  "UEFA Europa League": "ヨーロッパリーグ",
  "Europa League": "ヨーロッパリーグ",
  "UEFA Conference League": "カンファレンスリーグ",
  "Conference League": "カンファレンスリーグ",
  "FA Cup": "FAカップ",
  "EFL Cup": "カラバオカップ",
  "Carabao Cup": "カラバオカップ",
  "DFB-Pokal": "DFBポカール",
  "Copa del Rey": "コパ・デル・レイ",
  "KNVB Beker": "KNVBカップ",
  "KNVB Cup": "KNVBカップ",
};

// チーム名のマッピング（英語→日本語表記）
const TEAM_NAME_MAP: Record<string, string> = {
  "Brighton": "ブライトン",
  "Brighton & Hove Albion": "ブライトン",
  "Liverpool": "リヴァプール",
  "Manchester City": "マンチェスター・C",
  "Man City": "マンチェスター・C",
  "Manchester United": "マンチェスター・U",
  "Man Utd": "マンチェスター・U",
  "Arsenal": "アーセナル",
  "Chelsea": "チェルシー",
  "Tottenham": "トッテナム",
  "Tottenham Hotspur": "トッテナム",
  "Everton": "エヴァートン",
  "Crystal Palace": "クリスタルパレス",
  "Real Sociedad": "レアル・ソシエダ",
  "Barcelona": "バルセロナ",
  "Real Madrid": "レアル・マドリード",
  "Mainz": "マインツ",
  "Mainz 05": "マインツ",
  "1.FSV Mainz 05": "マインツ",
  "NEC Nijmegen": "NEC",
  "NEC": "NEC",
  "Ajax": "アヤックス",
  "AFC Ajax": "アヤックス",
  "Wolfsburg": "ヴォルフスブルク",
  "VfL Wolfsburg": "ヴォルフスブルク",
  "Bayern Munich": "バイエルン",
  "Bayern": "バイエルン",
  "Borussia Dortmund": "ドルトムント",
  "Dortmund": "ドルトムント",
  "RB Leipzig": "ライプツィヒ",
  "Leipzig": "ライプツィヒ",
  "Augsburg": "アウクスブルク",
  "Freiburg": "フライブルク",
  "Stuttgart": "シュトゥットガルト",
  "Leverkusen": "レバークーゼン",
  "Bayer Leverkusen": "レバークーゼン",
  "Werder Bremen": "ブレーメン",
  "Frankfurt": "フランクフルト",
  "Eintracht Frankfurt": "フランクフルト",
  "Hoffenheim": "ホッフェンハイム",
  "Mönchengladbach": "グラードバッハ",
  "Borussia Mönchengladbach": "グラードバッハ",
  "Union Berlin": "ウニオン・ベルリン",
  "Heidenheim": "ハイデンハイム",
  "St. Pauli": "ザンクト・パウリ",
  "Köln": "ケルン",
  "1. FC Köln": "ケルン",
  "AZ Alkmaar": "AZアルクマール",
  "AZ": "AZアルクマール",
  "PSV": "PSV",
  "PSV Eindhoven": "PSV",
  "Feyenoord": "フェイエノールト",
  "Fulham": "フラム",
  "Bournemouth": "ボーンマス",
  "Brentford": "ブレントフォード",
  "Newcastle": "ニューカッスル",
  "Newcastle United": "ニューカッスル",
  "Leeds": "リーズ",
  "Leeds United": "リーズ",
  "West Ham": "ウェストハム",
  "West Ham United": "ウェストハム",
  "Aston Villa": "アストン・ヴィラ",
  "Nottingham Forest": "ノッティンガム・F",
  "Nott'm Forest": "ノッティンガム・F",
  "Wolves": "ウルヴス",
  "Wolverhampton": "ウルヴス",
  "Sunderland": "サンダーランド",
  "Burnley": "バーンリー",
  "Oxford United": "オックスフォード",
  "Barnsley": "バーンズリー",
};

/**
 * チーム名を日本語表記に変換
 */
function translateTeamName(name: string): string {
  if (TEAM_NAME_MAP[name]) {
    return TEAM_NAME_MAP[name];
  }

  // 部分一致を試す
  for (const [key, value] of Object.entries(TEAM_NAME_MAP)) {
    if (name.includes(key) || key.includes(name)) {
      return value;
    }
  }

  return name;
}

/**
 * リーグ名を日本語表記に変換
 */
function translateLeagueName(name: string): string {
  if (LEAGUE_NAME_MAP[name]) {
    return LEAGUE_NAME_MAP[name];
  }

  for (const [key, value] of Object.entries(LEAGUE_NAME_MAP)) {
    if (name.includes(key) || key.includes(name)) {
      return value;
    }
  }

  return name;
}

/**
 * FotMob APIから選手の試合データを取得
 */
async function fetchPlayerMatches(player: Player): Promise<Match[]> {
  if (!player.fotmob) {
    console.log(`  [SKIP] ${player.name.ja}: FotMob情報がありません`);
    return [];
  }

  const { playerId } = player.fotmob;
  const url = `https://www.fotmob.com/api/playerData?id=${playerId}`;

  console.log(`  [FETCH] ${player.name.ja}: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.log(`  [ERROR] HTTPエラー: ${response.status}`);
      return [];
    }

    const data: FotMobPlayerData = await response.json();

    if (!data.recentMatches || data.recentMatches.length === 0) {
      console.log(`  [INFO] 試合データがありません`);
      return [];
    }

    const matches: Match[] = [];

    for (const fm of data.recentMatches) {
      // 出場していない試合はスキップ
      if (fm.minutesPlayed === 0 || fm.minutesPlayed === undefined) {
        continue;
      }

      // 日付をパース
      const matchDate = new Date(fm.matchDate.utcTime);
      const dateStr = matchDate.toISOString().split("T")[0];

      // matchIdを生成
      const matchId = `${player.id}-${dateStr.replace(/-/g, "")}`;

      // チーム名を取得
      const opponentName = translateTeamName(fm.opponentTeamName || "Unknown");
      const playerTeamName = player.club.shortName;

      // ホーム/アウェイを判定
      const homeTeam = fm.isHomeTeam ? playerTeamName : opponentName;
      const awayTeam = fm.isHomeTeam ? opponentName : playerTeamName;
      const homeScore = fm.homeScore;
      const awayScore = fm.awayScore;

      // レーティングを取得
      let rating = 6.5;
      if (fm.ratingProps?.rating) {
        rating = parseFloat(fm.ratingProps.rating);
      }

      // 大会名
      const competition = translateLeagueName(fm.leagueName || player.league.shortName);

      // notableかどうか判定
      const isNotable = fm.goals > 0 || fm.assists >= 2 || fm.playerOfTheMatch === true;

      const match: Match = {
        matchId,
        playerId: player.id,
        date: dateStr,
        competition,
        homeTeam: {
          name: homeTeam,
          score: homeScore,
        },
        awayTeam: {
          name: awayTeam,
          score: awayScore,
        },
        playerStats: {
          minutesPlayed: fm.minutesPlayed,
          goals: fm.goals || 0,
          assists: fm.assists || 0,
          starting: !fm.onBench,
          position: player.position,
          rating: isNaN(rating) ? 6.5 : rating,
        },
        notable: isNotable,
      };

      matches.push(match);
    }

    console.log(`  [SUCCESS] ${matches.length}件の試合を取得`);
    return matches;
  } catch (error) {
    console.log(`  [ERROR] 取得失敗: ${error}`);
    return [];
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log("=== 試合データ自動取得スクリプト (FotMob API) ===\n");

  // データファイルを読み込み
  const players: Player[] = JSON.parse(readFileSync(PLAYERS_FILE, "utf-8"));
  const existingMatches: Match[] = JSON.parse(readFileSync(MATCHES_FILE, "utf-8"));

  // 既存の試合IDをセットで管理
  const existingMatchIds = new Set(existingMatches.map((m) => m.matchId));

  let newMatchCount = 0;
  const newMatches: Match[] = [];

  for (const player of players) {
    console.log(`\n処理中: ${player.name.ja} (${player.club.shortName})`);

    const fetchedMatches = await fetchPlayerMatches(player);

    for (const match of fetchedMatches) {
      if (existingMatchIds.has(match.matchId)) {
        continue; // 既存の試合はスキップ
      }

      newMatches.push(match);
      existingMatchIds.add(match.matchId);
      newMatchCount++;
      console.log(`  [NEW] ${match.date}: ${match.homeTeam.name} ${match.homeTeam.score}-${match.awayTeam.score} ${match.awayTeam.name}`);
    }

    // レート制限を避けるため少し待つ
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (newMatchCount > 0) {
    // 新しい試合を追加して保存
    const allMatches = [...existingMatches, ...newMatches];

    // 日付でソート（新しい順）
    allMatches.sort((a, b) => b.date.localeCompare(a.date));

    writeFileSync(MATCHES_FILE, JSON.stringify(allMatches, null, 2));
    console.log(`\n=== 完了: ${newMatchCount}件の新しい試合を追加しました ===`);
  } else {
    console.log("\n=== 完了: 新しい試合はありませんでした ===");
  }

  // 新しい試合のIDを返す（コンテンツ生成スクリプトで使用）
  return newMatches.map((m) => m.matchId);
}

// 実行
main().catch(console.error);

export { main as fetchMatches };
