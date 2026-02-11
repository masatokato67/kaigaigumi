/**
 * Transfermarktから試合データを取得するスクリプト
 * GitHub Actionsで定期実行される
 */

import * as cheerio from "cheerio";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// データファイルのパス
const DATA_DIR = join(__dirname, "../src/data");
const PLAYERS_FILE = join(DATA_DIR, "players.json");
const MATCHES_FILE = join(DATA_DIR, "matches.json");

// 型定義
interface TransfermarktInfo {
  playerId: string;
  slug: string;
}

interface Player {
  id: string;
  name: { ja: string; en: string };
  club: { name: string; shortName: string };
  league: { name: string; shortName: string; country: string };
  transfermarkt?: TransfermarktInfo;
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

interface ParsedMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  position: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  starting: boolean;
  competition: string;
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
  "UECL Qualifiers": "カンファレンスリーグ予選",
};

// チーム名のマッピング（一般的なチーム名→日本語表記）
const TEAM_NAME_MAP: Record<string, string> = {
  "Brighton": "ブライトン",
  "Brighton & Hove Albion": "ブライトン",
  "Liverpool": "リヴァプール",
  "Manchester City": "マンチェスター・C",
  "Man City": "マンチェスター・C",
  "Manchester United": "マンチェスター・U",
  "Man United": "マンチェスター・U",
  "Arsenal": "アーセナル",
  "Chelsea": "チェルシー",
  "Tottenham": "トッテナム",
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
  "Hoffenheim": "ホッフェンハイム",
  "Mönchengladbach": "グラードバッハ",
  "Union Berlin": "ウニオン・ベルリン",
  "Heidenheim": "ハイデンハイム",
  "St. Pauli": "ザンクト・パウリ",
  "1.FC Köln": "ケルン",
  "Köln": "ケルン",
  "Hamburg": "ハンブルク",
  "AZ Alkmaar": "AZアルクマール",
  "AZ": "AZアルクマール",
  "PSV": "PSV",
  "PSV Eindhoven": "PSV",
  "Feyenoord": "フェイエノールト",
  "PEC Zwolle": "PECズヴォレ",
  "NAC Breda": "NACブレダ",
  "FC Volendam": "フォレンダム",
  "Heracles Almelo": "ヘラクレス",
  "Twente FC": "トゥエンテ",
  "FC Groningen": "フローニンゲン",
  "Fortuna Sittard": "フォルトゥナ",
  "Go Ahead Eagles": "ゴー・アヘッド",
  "Utrecht": "ユトレヒト",
  "Heerenveen": "ヘーレンフェーン",
  "Sparta R.": "スパルタ",
  "Excelsior": "エクセルシオール",
};

/**
 * チーム名を日本語表記に変換（順位情報を除去）
 */
function translateTeamName(name: string): string {
  // 順位情報を除去 (例: "Mainz (18.)" -> "Mainz")
  const cleanName = name.replace(/\s*\(\d+\.?\)$/g, "").trim();

  // 完全一致を試す
  if (TEAM_NAME_MAP[cleanName]) {
    return TEAM_NAME_MAP[cleanName];
  }

  // 部分一致を試す
  for (const [key, value] of Object.entries(TEAM_NAME_MAP)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return value;
    }
  }

  return cleanName;
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
 * Transfermarktから選手の試合データを取得
 */
async function fetchPlayerMatches(player: Player): Promise<ParsedMatch[]> {
  if (!player.transfermarkt) {
    console.log(`  [SKIP] ${player.name.ja}: Transfermarkt情報がありません`);
    return [];
  }

  const { playerId, slug } = player.transfermarkt;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  // シーズンは8月以降なら今年、1-7月なら前年
  const season = currentMonth >= 8 ? currentYear : currentYear - 1;

  const url = `https://www.transfermarkt.us/${slug}/leistungsdaten/spieler/${playerId}/saison/${season}/plus/1`;

  console.log(`  [FETCH] ${player.name.ja}: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      console.log(`  [ERROR] HTTPエラー: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const matches: ParsedMatch[] = [];

    // 各大会セクションを処理
    const competitionSections = $("div.box");

    competitionSections.each((_, section) => {
      const $section = $(section);
      const headerText = $section.find("h2, .table-header").text();

      // 大会名を判定
      let competition = player.league.shortName;
      if (headerText.includes("Bundesliga")) competition = "ブンデスリーガ";
      else if (headerText.includes("Premier League")) competition = "プレミアリーグ";
      else if (headerText.includes("La Liga") || headerText.includes("LaLiga")) competition = "ラ・リーガ";
      else if (headerText.includes("Eredivisie")) competition = "エールディヴィジ";
      else if (headerText.includes("Conference League")) competition = "カンファレンスリーグ";
      else if (headerText.includes("Champions League")) competition = "チャンピオンズリーグ";
      else if (headerText.includes("Europa League")) competition = "ヨーロッパリーグ";
      else if (headerText.includes("DFB-Pokal")) competition = "DFBポカール";
      else if (headerText.includes("FA Cup")) competition = "FAカップ";
      else if (headerText.includes("KNVB")) competition = "KNVBカップ";
      else if (headerText.includes("Copa del Rey")) competition = "コパ・デル・レイ";

      // テーブル内の試合データを取得
      const $table = $section.find("table.items");
      $table.find("tbody tr").each((_, row) => {
        try {
          const $row = $(row);
          const cells = $row.find("td");
          if (cells.length < 5) return;

          // 日付を取得（2列目）
          const dateCell = cells.eq(1);
          const dateLinks = dateCell.find("a");
          let dateText = "";
          if (dateLinks.length > 0) {
            dateText = dateLinks.text().trim();
          } else {
            dateText = dateCell.text().trim();
          }

          if (!dateText) return;

          const parsedDate = parseDate(dateText);
          if (!parsedDate) return;

          // ホーム/アウェイチーム（4列目、5列目あたり）
          // Transfermarktの構造: 試合セル内にホームとアウェイがある
          let homeTeam = "";
          let awayTeam = "";
          let homeScore = 0;
          let awayScore = 0;

          // 結果セルを探す
          cells.each((i, cell) => {
            const $cell = $(cell);
            const text = $cell.text().trim();

            // スコアパターン (例: "2:0", "1:1")
            const scoreMatch = text.match(/^(\d+):(\d+)$/);
            if (scoreMatch) {
              homeScore = parseInt(scoreMatch[1], 10);
              awayScore = parseInt(scoreMatch[2], 10);
            }
          });

          // チーム名を取得
          const teamLinks = $row.find("td a[href*='/spielbericht/']").parent().find("a");
          const allLinks = $row.find("a");
          allLinks.each((i, link) => {
            const href = $(link).attr("href") || "";
            if (href.includes("/startseite/verein/") || href.includes("/spielplan/verein/")) {
              const teamText = $(link).text().trim();
              if (teamText && !teamText.match(/^\d/)) {
                if (!homeTeam) {
                  homeTeam = teamText;
                } else if (!awayTeam && teamText !== homeTeam) {
                  awayTeam = teamText;
                }
              }
            }
          });

          // チーム名が取れなかった場合は行のテキストからパース
          if (!homeTeam || !awayTeam) {
            const rowText = $row.text();
            // パターン: "Team1 (pos.) Team2 (pos.) X:Y"
            const teamMatch = rowText.match(/([A-Za-z\s\.]+?)(?:\s*\(\d+\.?\))?\s+([A-Za-z\s\.]+?)(?:\s*\(\d+\.?\))?\s+(\d+):(\d+)/);
            if (teamMatch) {
              homeTeam = teamMatch[1].trim();
              awayTeam = teamMatch[2].trim();
              homeScore = parseInt(teamMatch[3], 10);
              awayScore = parseInt(teamMatch[4], 10);
            }
          }

          if (!homeTeam || !awayTeam) return;

          // ポジションを取得
          let position = player.position;
          cells.each((i, cell) => {
            const text = $(cell).text().trim();
            if (text.match(/^(GK|SW|CB|LB|RB|LWB|RWB|DM|CM|AM|LM|RM|LW|RW|CF|SS|ST)$/)) {
              position = text;
            }
          });

          // 出場時間を取得（最後のセルに "'XX'" のパターン）
          let minutesPlayed = 0;
          const lastCells = cells.slice(-3);
          lastCells.each((i, cell) => {
            const text = $(cell).text().trim();
            const minutesMatch = text.match(/(\d+)'/);
            if (minutesMatch) {
              minutesPlayed = parseInt(minutesMatch[1], 10);
            }
          });

          // ゴール・アシストを取得
          let goals = 0;
          let assists = 0;
          const rowHtml = $row.html() || "";

          // ゴールアイコンを探す
          const goalIcons = $row.find(".icon-tor-symbol, .icons-tor");
          if (goalIcons.length > 0) {
            // アイコンの前後のテキストからゴール数を取得
            const goalCell = goalIcons.closest("td");
            const goalText = goalCell.text().trim();
            const goalNum = parseInt(goalText, 10);
            if (!isNaN(goalNum)) {
              goals = goalNum;
            } else {
              goals = goalIcons.length; // アイコンの数をカウント
            }
          }

          // 先発/途中出場を判定
          const starting = $row.find(".icon-startelf").length > 0 || minutesPlayed >= 60;

          matches.push({
            date: parsedDate,
            homeTeam,
            awayTeam,
            homeScore,
            awayScore,
            position,
            minutesPlayed,
            goals,
            assists,
            starting,
            competition,
          });
        } catch (e) {
          // 行のパースに失敗した場合はスキップ
        }
      });
    });

    // テーブルからデータが取れなかった場合、テキストベースでパース
    if (matches.length === 0) {
      console.log(`  [INFO] テーブルパース失敗、テキストベースでパース試行...`);
      const textMatches = parseMatchesFromText(html, player);
      matches.push(...textMatches);
    }

    console.log(`  [SUCCESS] ${matches.length}件の試合を取得`);
    return matches;
  } catch (error) {
    console.log(`  [ERROR] 取得失敗: ${error}`);
    return [];
  }
}

/**
 * HTMLテキストから試合データをパース（フォールバック）
 */
function parseMatchesFromText(html: string, player: Player): ParsedMatch[] {
  const matches: ParsedMatch[] = [];
  const $ = cheerio.load(html);

  // ページ全体のテキストを取得
  const pageText = $("body").text();

  // Bundesliga / Eredivisie などのセクションを探す
  const leaguePatterns = [
    { pattern: /Bundesliga.*?Squad:/gs, competition: "ブンデスリーガ" },
    { pattern: /Eredivisie.*?Squad:/gs, competition: "エールディヴィジ" },
    { pattern: /Premier League.*?Squad:/gs, competition: "プレミアリーグ" },
    { pattern: /La Liga.*?Squad:/gs, competition: "ラ・リーガ" },
    { pattern: /Conference League.*?Squad:/gs, competition: "カンファレンスリーグ" },
    { pattern: /KNVB.*?Squad:/gs, competition: "KNVBカップ" },
    { pattern: /DFB-Pokal.*?Squad:/gs, competition: "DFBポカール" },
  ];

  for (const { pattern, competition } of leaguePatterns) {
    const sectionMatches = pageText.match(pattern);
    if (!sectionMatches) continue;

    for (const section of sectionMatches) {
      // 日付とスコアのパターンを探す
      // パターン例: "Feb 7, 2026 Mainz (16.) Augsburg (11.) 2:0 DM 3.0 90'"
      const matchPattern = /(\w{3}\s+\d{1,2},\s+\d{4})\s+([A-Za-z\s\.\-0-9]+?)\s*(?:\(\d+\.?\))?\s+([A-Za-z\s\.\-0-9]+?)\s*(?:\(\d+\.?\))?\s+(\d+):(\d+)\s+(GK|SW|CB|LB|RB|LWB|RWB|DM|CM|AM|LM|RM|LW|RW|CF|SS|ST)?\s*[\d\.]*\s*(\d+)?'/g;

      let match;
      while ((match = matchPattern.exec(section)) !== null) {
        const parsedDate = parseDate(match[1]);
        if (!parsedDate) continue;

        const homeTeam = match[2].trim();
        const awayTeam = match[3].trim();
        const homeScore = parseInt(match[4], 10);
        const awayScore = parseInt(match[5], 10);
        const position = match[6] || player.position;
        const minutesPlayed = match[7] ? parseInt(match[7], 10) : 90;

        matches.push({
          date: parsedDate,
          homeTeam,
          awayTeam,
          homeScore,
          awayScore,
          position,
          minutesPlayed,
          goals: 0,
          assists: 0,
          starting: minutesPlayed >= 60,
          competition,
        });
      }
    }
  }

  return matches;
}

/**
 * 日付文字列をYYYY-MM-DD形式にパース
 */
function parseDate(dateText: string): string | null {
  // フォーマット1: "Feb 8, 2026"
  const format1 = dateText.match(/([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/);
  if (format1) {
    const months: Record<string, string> = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
      Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
    };
    const month = months[format1[1]];
    const day = format1[2].padStart(2, "0");
    const year = format1[3];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // フォーマット2: "08.02.2026" (DD.MM.YYYY)
  const format2 = dateText.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (format2) {
    return `${format2[3]}-${format2[2]}-${format2[1]}`;
  }

  // フォーマット3: "2026-02-08" (YYYY-MM-DD)
  const format3 = dateText.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (format3) {
    return dateText;
  }

  // フォーマット4: "8/2/26" (M/D/YY)
  const format4 = dateText.match(/(\d{1,2})\/(\d{1,2})\/(\d{2})/);
  if (format4) {
    const year = parseInt(format4[3], 10) + 2000;
    const month = format4[1].padStart(2, "0");
    const day = format4[2].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * 試合がnotableかどうかを判定
 */
function isNotableMatch(match: ParsedMatch, player: Player): boolean {
  // ゴールを決めた
  if (match.goals > 0) return true;

  // 2アシスト以上
  if (match.assists >= 2) return true;

  // 勝利の試合で長時間出場
  const playerClubShort = player.club.shortName.toLowerCase();
  const homeTeamNormalized = translateTeamName(match.homeTeam).toLowerCase();
  const awayTeamNormalized = translateTeamName(match.awayTeam).toLowerCase();

  const isHomeTeam = homeTeamNormalized.includes(playerClubShort) || playerClubShort.includes(homeTeamNormalized);
  const isAwayTeam = awayTeamNormalized.includes(playerClubShort) || playerClubShort.includes(awayTeamNormalized);

  const isWin = (isHomeTeam && match.homeScore > match.awayScore) ||
                (isAwayTeam && match.awayScore > match.homeScore);

  if (isWin && match.minutesPlayed >= 80) return true;

  return false;
}

/**
 * メイン処理
 */
async function main() {
  console.log("=== 試合データ自動取得スクリプト ===\n");

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

    for (const fm of fetchedMatches) {
      const matchId = `${player.id}-${fm.date.replace(/-/g, "")}`;

      if (existingMatchIds.has(matchId)) {
        continue; // 既存の試合はスキップ
      }

      const match: Match = {
        matchId,
        playerId: player.id,
        date: fm.date,
        competition: fm.competition || player.league.shortName,
        homeTeam: {
          name: translateTeamName(fm.homeTeam),
          score: fm.homeScore,
        },
        awayTeam: {
          name: translateTeamName(fm.awayTeam),
          score: fm.awayScore,
        },
        playerStats: {
          minutesPlayed: fm.minutesPlayed,
          goals: fm.goals,
          assists: fm.assists,
          starting: fm.starting,
          position: fm.position || player.position,
          rating: 6.5, // デフォルト値
        },
        notable: isNotableMatch(fm, player),
      };

      newMatches.push(match);
      existingMatchIds.add(matchId);
      newMatchCount++;
      console.log(`  [NEW] ${match.date}: ${match.homeTeam.name} ${match.homeTeam.score}-${match.awayTeam.score} ${match.awayTeam.name}`);
    }

    // レート制限を避けるため少し待つ
    await new Promise((resolve) => setTimeout(resolve, 1500));
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
