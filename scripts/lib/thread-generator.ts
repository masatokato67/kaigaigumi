/**
 * Gemini APIを使ってX風スレッドを自動生成するユーティリティ
 * テンプレートベースではなく、試合データに基づいてAIが自然な文面を生成
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../.env.local") });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY が .env.local に設定されていません");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface MatchData {
  matchId: string;
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
}

interface PlayerData {
  name: { ja: string; en: string };
  club: { name: string; shortName: string };
  league: { name: string; shortName: string; country: string };
}

interface GeneratedThread {
  username: string;
  verified: boolean;
  languageCode: string;
  originalText: string;
  translatedText: string;
  likes: number;
  retweets: number;
  replies: {
    username: string;
    languageCode: string;
    originalText: string;
    translatedText: string;
    likes: number;
  }[];
}

const COUNTRY_LANG: Record<string, string> = {
  イングランド: "EN",
  ドイツ: "DE",
  スペイン: "ES",
  フランス: "FR",
  オランダ: "NL",
  イタリア: "IT",
};

/**
 * 試合データからAI生成Xスレッドを3件生成
 */
export async function generateAIThreads(
  match: MatchData,
  player: PlayerData
): Promise<GeneratedThread[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const opponent = match.homeTeam.name.includes(player.club.shortName)
    ? match.awayTeam.name
    : match.homeTeam.name;

  const isHome = match.homeTeam.name.includes(player.club.shortName);
  const teamScore = isHome ? match.homeTeam.score : match.awayTeam.score;
  const opponentScore = isHome ? match.awayTeam.score : match.homeTeam.score;
  const result =
    teamScore > opponentScore ? "win" : teamScore < opponentScore ? "loss" : "draw";

  const langCode = COUNTRY_LANG[player.league.country] || "EN";

  const { goals, assists, minutesPlayed, starting, rating, position } =
    match.playerStats;

  const prompt = `Generate 3 realistic X (Twitter) posts about a football match. Each post should feel like it was written by a different type of account.

Match Info:
- ${player.name.en} (${player.name.ja}) plays for ${player.club.name}
- Competition: ${match.competition}
- ${match.homeTeam.name} ${match.homeTeam.score}-${match.awayTeam.score} ${match.awayTeam.name}
- Date: ${match.date}
- Result for ${player.club.shortName}: ${result}
- Player stats: ${minutesPlayed} min, ${goals} goals, ${assists} assists, rating ${rating}/10
- Position: ${position}, ${starting ? "started" : "came off the bench"}
- League country language: ${langCode}

Generate EXACTLY 3 posts as a JSON array. Each post must have 2 replies. Respond with ONLY a valid JSON array (no markdown):

[
  {
    "type": "media",
    "username": "@RealMediaAccountName",
    "verified": true,
    "languageCode": "${langCode}",
    "originalText": "Post in ${langCode} language. A factual match report style post about the player's performance.",
    "translatedText": "Japanese translation",
    "likes": 5000,
    "retweets": 800,
    "replies": [
      { "username": "@FanName1", "languageCode": "${langCode}", "originalText": "Reply in same language", "translatedText": "Japanese", "likes": 200 },
      { "username": "@FanName2", "languageCode": "EN", "originalText": "Reply", "translatedText": "Japanese", "likes": 100 }
    ]
  },
  {
    "type": "supporter",
    "username": "@ClubFanAccount",
    "verified": false,
    "languageCode": "EN",
    "originalText": "An emotional fan reaction post in English about the player's performance. Use emojis sparingly.",
    "translatedText": "Japanese translation",
    "likes": 2000,
    "retweets": 300,
    "replies": [
      { "username": "@Fan3", "languageCode": "EN", "originalText": "Reply", "translatedText": "Japanese", "likes": 150 },
      { "username": "@Fan4", "languageCode": "EN", "originalText": "Reply", "translatedText": "Japanese", "likes": 80 }
    ]
  },
  {
    "type": "japanese_fan",
    "username": "@JapaneseFanName",
    "verified": false,
    "languageCode": "JA",
    "originalText": "Japanese fan post about the player in natural Japanese. Casual tone.",
    "translatedText": "Same as originalText since it's already Japanese",
    "likes": 1500,
    "retweets": 200,
    "replies": [
      { "username": "@JPFan1", "languageCode": "JA", "originalText": "Japanese reply", "translatedText": "Same text", "likes": 100 },
      { "username": "@JPFan2", "languageCode": "JA", "originalText": "Japanese reply", "translatedText": "Same text", "likes": 60 }
    ]
  }
]

IMPORTANT rules:
- Usernames must look realistic (e.g., @SkySportsNews, @PLMatchday, @BrightonFanZone, @日本代表応援)
- Do NOT use generic names like @Fan_1234 or @User123
- Media post should be in the league's local language (${langCode})
- Supporter post should be in English
- Japanese fan post must be in natural, casual Japanese
- Likes/retweets should be realistic (media: 3K-20K likes, fans: 500-5K likes, replies: 50-500)
- Content should accurately reflect the match result and player performance
- If the player had a poor game (rating < 6.0), include some critical/disappointed reactions
- If the player scored or had great stats, reactions should be enthusiastic
- Keep posts concise (1-3 sentences max)
- Each reply should be 1 sentence`;

  const genResult = await model.generateContent(prompt);
  const responseText = genResult.response.text().trim();

  let jsonStr = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1].trim();

  let parsed: Record<string, unknown>[];
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Gemini応答のパースに失敗:\n${responseText.slice(0, 500)}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini応答が配列ではありません");
  }

  return parsed.slice(0, 3).map((thread) => ({
    username: String(thread.username || "@Unknown"),
    verified: Boolean(thread.verified),
    languageCode: String(thread.languageCode || "EN"),
    originalText: String(thread.originalText || ""),
    translatedText: String(thread.translatedText || ""),
    likes: Number(thread.likes) || 1000,
    retweets: Number(thread.retweets) || 200,
    replies: Array.isArray(thread.replies)
      ? (thread.replies as Record<string, unknown>[]).slice(0, 2).map((r) => ({
          username: String(r.username || "@Fan"),
          languageCode: String(r.languageCode || "EN"),
          originalText: String(r.originalText || ""),
          translatedText: String(r.translatedText || ""),
          likes: Number(r.likes) || 100,
        }))
      : [],
  }));
}
