/**
 * FotMob HTMLから試合データを取得するスクリプト
 * SofaScore APIが利用不可になった場合の代替。
 * FotMobの選手ページ HTML に埋め込まれた __NEXT_DATA__ JSON を解析する。
 *
 * 使用方法: npx tsx scripts/fetch-matches-fotmob-html.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(__dirname, "../src/data");
const PLAYERS_FILE = join(DATA_DIR, "players.json");
const MATCHES_FILE = join(DATA_DIR, "matches.json");
const HIGHLIGHT_VIDEOS_FILE = join(DATA_DIR, "highlight-videos.json");

const SEASON_START_DATE = new Date("2025-07-01");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
};

// ── リーグ名マッピング ──
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
  "DFB Cup": "DFBポカール",
  "Copa del Rey": "コパ・デル・レイ",
  "KNVB Beker": "KNVBカップ",
  "KNVB Cup": "KNVBカップ",
  "International Friendly Games": "International Friendly Games",
};

// ── チーム名マッピング（sofascoreスクリプトから流用） ──
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
  "Atletico Madrid": "Atlético Madrid",
  "Atlético Madrid": "Atlético Madrid",
  "Mainz": "マインツ",
  "Mainz 05": "マインツ",
  "FSV Mainz 05": "マインツ",
  "NEC Nijmegen": "NEC",
  "NEC": "NEC",
  "Ajax": "アヤックス",
  "AFC Ajax": "アヤックス",
  "Wolfsburg": "ヴォルフスブルク",
  "VfL Wolfsburg": "ヴォルフスブルク",
  "Bayern Munich": "バイエルン",
  "Bayern München": "バイエルン",
  "Bayern": "バイエルン",
  "Borussia Dortmund": "ドルトムント",
  "Dortmund": "ドルトムント",
  "RB Leipzig": "ライプツィヒ",
  "Leipzig": "ライプツィヒ",
  "Augsburg": "アウクスブルク",
  "FC Augsburg": "アウクスブルク",
  "Freiburg": "フライブルク",
  "SC Freiburg": "フライブルク",
  "Stuttgart": "シュトゥットガルト",
  "VfB Stuttgart": "シュトゥットガルト",
  "Leverkusen": "レバークーゼン",
  "Bayer Leverkusen": "レバークーゼン",
  "Bayer 04 Leverkusen": "レバークーゼン",
  "Werder Bremen": "ブレーメン",
  "Frankfurt": "フランクフルト",
  "Eintracht Frankfurt": "フランクフルト",
  "Hoffenheim": "ホッフェンハイム",
  "TSG Hoffenheim": "ホッフェンハイム",
  "Mönchengladbach": "グラードバッハ",
  "Borussia Mönchengladbach": "グラードバッハ",
  "Union Berlin": "ウニオン・ベルリン",
  "1. FC Union Berlin": "ウニオン・ベルリン",
  "Heidenheim": "ハイデンハイム",
  "St. Pauli": "ザンクト・パウリ",
  "FC St. Pauli": "ザンクト・パウリ",
  "Köln": "ケルン",
  "1. FC Köln": "ケルン",
  "AZ Alkmaar": "AZアルクマール",
  "AZ": "AZアルクマール",
  "PSV": "PSV",
  "PSV Eindhoven": "PSV",
  "Feyenoord": "フェイエノールト",
  "Fulham": "フラム",
  "Bournemouth": "ボーンマス",
  "AFC Bournemouth": "ボーンマス",
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
  "Wolverhampton Wanderers": "ウルヴス",
  "Sunderland": "サンダーランド",
  "Burnley": "バーンリー",
  "Ipswich": "イプスウィッチ",
  "Southampton": "サウサンプトン",
  "Leicester": "レスター",
  "Leicester City": "レスター",
  "Getafe": "ヘタフェ",
  "Fiorentina": "Fiorentina",
};

function translateLeagueName(en: string): string {
  return LEAGUE_NAME_MAP[en] || en;
}

function translateTeamName(en: string): string {
  return TEAM_NAME_MAP[en] || en;
}

// ── 型定義 ──
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

interface DetailedStats {
  totalShots?: number;
  shotsOnTarget?: number;
  expectedGoals?: number;
  expectedAssists?: number;
  totalPass?: number;
  accuratePass?: number;
  keyPass?: number;
  totalCross?: number;
  totalLongBalls?: number;
  accurateLongBalls?: number;
  totalTackle?: number;
  wonTackle?: number;
  interceptionWon?: number;
  totalClearance?: number;
  blockedScoringAttempt?: number;
  ballRecovery?: number;
  duelWon?: number;
  duelLost?: number;
  aerialWon?: number;
  aerialLost?: number;
  touches?: number;
  fouls?: number;
  wasFouled?: number;
  possessionLostCtrl?: number;
  dispossessed?: number;
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
  detailedStats?: DetailedStats;
}

interface HighlightVideo {
  enabled: boolean;
  youtubeId: string;
  title: string;
}

interface FotMobRecentMatch {
  teamId: number;
  teamName: string;
  opponentTeamId: number;
  opponentTeamName: string;
  isHomeTeam: boolean;
  id: number;
  matchDate: { utcTime: string; timezone: string };
  matchPageUrl: string;
  leagueId: number;
  leagueName: string;
  stage: string | null;
  homeScore: number | null;
  awayScore: number | null;
  minutesPlayed: number | null;
  goals: number | null;
  assists: number | null;
  yellowCards: number;
  redCards: number;
  ratingProps: { rating: string; isTopRating: boolean } | null;
  playerOfTheMatch: boolean;
  onBench: boolean;
}

// ── HTMLからJSON抽出 ──
function extractNextData(html: string): unknown | null {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

// ── 選手ページから最近の試合リストを取得 ──
async function fetchPlayerRecentMatches(
  player: Player
): Promise<{ recentMatches: FotMobRecentMatch[]; playerName: string } | null> {
  if (!player.fotmob) {
    console.log(`  [SKIP] ${player.name.ja}: FotMob情報なし`);
    return null;
  }

  const url = `https://www.fotmob.com/players/${player.fotmob.playerId}/_`;
  console.log(`  [FETCH] ${player.name.ja}: ${url}`);

  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      console.log(`  [ERROR] HTTPエラー: ${res.status}`);
      return null;
    }
    const html = await res.text();
    const nextData = extractNextData(html) as {
      props?: { pageProps?: { data?: { name: string; recentMatches?: FotMobRecentMatch[] } } };
    } | null;
    if (!nextData) {
      console.log(`  [ERROR] __NEXT_DATA__を解析できませんでした`);
      return null;
    }
    const data = nextData.props?.pageProps?.data;
    if (!data) {
      console.log(`  [ERROR] data構造が見つかりません`);
      return null;
    }
    return {
      playerName: data.name,
      recentMatches: data.recentMatches || [],
    };
  } catch (err) {
    console.log(`  [ERROR] 取得失敗: ${err}`);
    return null;
  }
}

// ── 試合詳細ページから詳細スタッツを取得 ──
interface FotMobStatItem {
  key?: string | null;
  stat: {
    value: number | string;
    total?: number;
    type: string;
  };
}
interface FotMobStatSection {
  title: string;
  stats: Record<string, FotMobStatItem>;
}
interface FotMobPlayerStatBlock {
  name: string;
  id: number;
  stats: FotMobStatSection[];
  positionId?: number;
  usualPosition?: string | number;
  shirtNumber?: number;
}

// FotMobのpositionId → ポジション略称
const POSITION_MAP: Record<number, string> = {
  11: "GK",
  21: "RB", 22: "RWB",
  31: "CB", 32: "CB", 33: "CB",
  41: "LB", 42: "LWB",
  51: "CDM", 52: "CDM",
  61: "CM",
  71: "AM", 72: "CAM",
  81: "RW", 82: "RM", 83: "RW",
  91: "LW", 92: "LM", 93: "LW",
  101: "ST", 102: "CF",
};

async function fetchMatchDetailedStats(
  matchId: number,
  fotmobPlayerId: string
): Promise<{ stats: DetailedStats; rating: number | null; position: string | null; starting: boolean } | null> {
  const url = `https://www.fotmob.com/match/${matchId}`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const html = await res.text();
    const nextData = extractNextData(html) as {
      props?: { pageProps?: { content?: { playerStats?: Record<string, FotMobPlayerStatBlock>; lineup?: unknown } } };
    } | null;
    if (!nextData) return null;
    const playerStats = nextData.props?.pageProps?.content?.playerStats;
    if (!playerStats) return null;

    const playerBlock = playerStats[fotmobPlayerId];
    if (!playerBlock || !playerBlock.stats) return null;

    // 全セクションをフラット化
    const flatStats: Record<string, FotMobStatItem> = {};
    for (const section of playerBlock.stats) {
      for (const [label, item] of Object.entries(section.stats)) {
        flatStats[label] = item;
      }
    }

    // 値を取得するヘルパ
    const getNum = (label: string): number | undefined => {
      const item = flatStats[label];
      if (!item) return undefined;
      const v = item.stat.value;
      if (typeof v === "number") return v;
      return undefined;
    };
    const getFraction = (label: string): { value?: number; total?: number } => {
      const item = flatStats[label];
      if (!item) return {};
      return { value: item.stat.value as number, total: item.stat.total };
    };

    const stats: DetailedStats = {};

    // マッピング（FotMob表示ラベル → matches.jsonのフィールド）
    const rating = getNum("FotMob rating") ?? null;
    const minutes = getNum("Minutes played");

    // Top stats
    const xG = getNum("Expected goals (xG)") ?? getNum("xG");
    if (xG !== undefined) stats.expectedGoals = Math.round(xG * 10000) / 10000;

    const xA = getNum("Expected assists (xA)") ?? getNum("xA");
    if (xA !== undefined) stats.expectedAssists = Math.round(xA * 10000) / 10000;

    const passes = getFraction("Accurate passes");
    if (passes.total !== undefined) stats.totalPass = passes.total;
    if (passes.value !== undefined) stats.accuratePass = passes.value;

    const keyPass = getNum("Chances created");
    if (keyPass !== undefined) stats.keyPass = keyPass;

    // Attack
    const touches = getNum("Touches");
    if (touches !== undefined) stats.touches = touches;

    const dispossessed = getNum("Dispossessed");
    if (dispossessed !== undefined) stats.dispossessed = dispossessed;

    const longBalls = getFraction("Accurate long balls");
    if (longBalls.total !== undefined) stats.totalLongBalls = longBalls.total;
    if (longBalls.value !== undefined) stats.accurateLongBalls = longBalls.value;

    const crosses = getFraction("Accurate crosses");
    if (crosses.total !== undefined) stats.totalCross = crosses.total;

    // Defense
    const tackles = getNum("Tackles");
    if (tackles !== undefined) stats.totalTackle = tackles;

    const blocks = getNum("Blocks");
    if (blocks !== undefined) stats.blockedScoringAttempt = blocks;

    const clearances = getNum("Clearances");
    if (clearances !== undefined) stats.totalClearance = clearances;

    const interceptions = getNum("Interceptions");
    if (interceptions !== undefined) stats.interceptionWon = interceptions;

    const recoveries = getNum("Recoveries");
    if (recoveries !== undefined) stats.ballRecovery = recoveries;

    // Duels
    const duelsWon = getNum("Duels won");
    if (duelsWon !== undefined) stats.duelWon = duelsWon;
    const duelsLost = getNum("Duels lost");
    if (duelsLost !== undefined) stats.duelLost = duelsLost;

    const aerials = getFraction("Aerial duels won");
    if (aerials.value !== undefined) stats.aerialWon = aerials.value;
    if (aerials.total !== undefined && aerials.value !== undefined) {
      stats.aerialLost = aerials.total - aerials.value;
    }

    const wasFouled = getNum("Was fouled");
    if (wasFouled !== undefined) stats.wasFouled = wasFouled;
    const fouls = getNum("Fouls committed");
    if (fouls !== undefined) stats.fouls = fouls;

    // シュート（shotmapから推定できない場合は省略）
    const shotsOnTarget = getNum("Shots on target");
    if (shotsOnTarget !== undefined) stats.shotsOnTarget = shotsOnTarget;
    const totalShots = getNum("Total shots");
    if (totalShots !== undefined) stats.totalShots = totalShots;

    // positionIdから略称へマッピング（なければnull）
    let position: string | null = null;
    if (playerBlock.positionId && POSITION_MAP[playerBlock.positionId]) {
      position = POSITION_MAP[playerBlock.positionId];
    } else if (typeof playerBlock.usualPosition === "string") {
      position = playerBlock.usualPosition;
    }

    return {
      stats,
      rating,
      position,
      starting: (minutes ?? 0) >= 60,
    };
  } catch {
    return null;
  }
}

// ── メイン処理 ──
async function main() {
  const args = process.argv.slice(2);
  const updateStatsMode = args.includes("--update-stats");
  const skipDetails = args.includes("--no-details");

  console.log(
    updateStatsMode
      ? "=== 既存試合の詳細スタッツ更新モード (FotMob HTML) ===\n"
      : "=== 試合データ自動取得スクリプト (FotMob HTML) ===\n"
  );

  const players: Player[] = JSON.parse(readFileSync(PLAYERS_FILE, "utf-8"));
  const existingMatches: Match[] = JSON.parse(readFileSync(MATCHES_FILE, "utf-8"));
  const existingMatchIds = new Set(existingMatches.map((m) => m.matchId));

  let newMatchCount = 0;
  let updatedCount = 0;
  const newMatches: Match[] = [];

  for (const player of players) {
    console.log(`\n処理中: ${player.name.ja} (${player.club.shortName})`);

    const result = await fetchPlayerRecentMatches(player);
    if (!result) continue;

    for (const m of result.recentMatches) {
      // 日付フィルター（シーズン内、終了した試合のみ）
      const matchDate = new Date(m.matchDate.utcTime);
      if (matchDate < SEASON_START_DATE) continue;
      if (m.homeScore === null || m.awayScore === null) continue; // 未終了
      if (m.minutesPlayed === null || m.minutesPlayed === 0) continue; // 出場なし

      const dateStr = matchDate.toISOString().split("T")[0];
      const matchId = `${player.id}-${dateStr.replace(/-/g, "")}`;

      // すでに存在する場合: update-stats モード以外はスキップ
      if (existingMatchIds.has(matchId) && !updateStatsMode) continue;

      // チーム名を取得（FotMobは対戦相手しか返さないのでisHomeTeamで判定）
      const homeTeamName = m.isHomeTeam ? m.teamName : m.opponentTeamName;
      const awayTeamName = m.isHomeTeam ? m.opponentTeamName : m.teamName;

      const rating = parseFloat(m.ratingProps?.rating || "6.5");
      const goals = m.goals ?? 0;
      const assists = m.assists ?? 0;
      const isNotable = goals > 0 || assists >= 2 || rating >= 8.0;

      // 詳細スタッツ
      let detailedStats: DetailedStats | undefined;
      let position = player.position;
      let starting = m.minutesPlayed >= 60;
      let resolvedRating = rating;

      if (!skipDetails) {
        const detail = await fetchMatchDetailedStats(m.id, player.fotmob!.playerId);
        if (detail) {
          if (Object.keys(detail.stats).length > 0) detailedStats = detail.stats;
          if (detail.rating !== null) resolvedRating = detail.rating;
          if (detail.position) position = detail.position;
          starting = detail.starting;
        }
        // レート制限回避
        await new Promise((r) => setTimeout(r, 500));
      }

      const match: Match = {
        matchId,
        playerId: player.id,
        date: dateStr,
        competition: translateLeagueName(m.leagueName),
        homeTeam: {
          name: translateTeamName(homeTeamName),
          score: m.homeScore,
        },
        awayTeam: {
          name: translateTeamName(awayTeamName),
          score: m.awayScore,
        },
        playerStats: {
          minutesPlayed: m.minutesPlayed,
          goals,
          assists,
          starting,
          position,
          rating: Math.round(resolvedRating * 10) / 10,
        },
        notable: isNotable,
        ...(detailedStats ? { detailedStats } : {}),
      };

      if (existingMatchIds.has(matchId)) {
        // --update-stats モード: detailedStatsとゴール/アシストを更新
        if (updateStatsMode) {
          const idx = existingMatches.findIndex((em) => em.matchId === matchId);
          if (idx !== -1) {
            const existing = existingMatches[idx];
            let changed = false;
            if (match.detailedStats && !existing.detailedStats) {
              existing.detailedStats = match.detailedStats;
              changed = true;
            }
            if (existing.playerStats.goals !== match.playerStats.goals) {
              existing.playerStats.goals = match.playerStats.goals;
              changed = true;
            }
            if (existing.playerStats.assists !== match.playerStats.assists) {
              existing.playerStats.assists = match.playerStats.assists;
              changed = true;
            }
            if (changed) {
              updatedCount++;
              console.log(`  [UPDATE] ${dateStr}: スタッツ更新`);
            }
          }
        }
      } else {
        newMatches.push(match);
        existingMatchIds.add(matchId);
        newMatchCount++;
        console.log(
          `  [NEW] ${dateStr}: ${match.homeTeam.name} ${match.homeTeam.score}-${match.awayTeam.score} ${match.awayTeam.name} (rating ${match.playerStats.rating})`
        );
      }
    }

    // 選手間レート制限
    await new Promise((r) => setTimeout(r, 1500));
  }

  // ── 保存 ──
  if (updateStatsMode && updatedCount > 0) {
    existingMatches.sort((a, b) => b.date.localeCompare(a.date));
    writeFileSync(MATCHES_FILE, JSON.stringify(existingMatches, null, 2));
    console.log(`\n=== 完了: ${updatedCount}件の試合を更新しました ===`);
  } else if (updateStatsMode) {
    console.log("\n=== 完了: 更新対象の試合はありませんでした ===");
  }

  if (newMatchCount > 0) {
    const allMatches = [...existingMatches, ...newMatches];
    allMatches.sort((a, b) => b.date.localeCompare(a.date));
    writeFileSync(MATCHES_FILE, JSON.stringify(allMatches, null, 2));

    // highlight-videos.json にプレースホルダ追加
    const highlightVideos: Record<string, HighlightVideo> = JSON.parse(
      readFileSync(HIGHLIGHT_VIDEOS_FILE, "utf-8")
    );
    for (const m of newMatches) {
      if (!highlightVideos[m.matchId]) {
        highlightVideos[m.matchId] = { enabled: false, youtubeId: "", title: "" };
      }
    }
    const sortedKeys = Object.keys(highlightVideos).sort((a, b) => {
      const dateA = a.split("-").pop() || "";
      const dateB = b.split("-").pop() || "";
      return dateB.localeCompare(dateA);
    });
    const sortedHighlights: Record<string, HighlightVideo> = {};
    for (const k of sortedKeys) sortedHighlights[k] = highlightVideos[k];
    writeFileSync(HIGHLIGHT_VIDEOS_FILE, JSON.stringify(sortedHighlights, null, 2));

    console.log(`\n=== 完了: ${newMatchCount}件の新しい試合を追加しました ===`);
  } else if (!updateStatsMode) {
    console.log("\n=== 完了: 新しい試合はありませんでした ===");
  }
}

main().catch(console.error);
