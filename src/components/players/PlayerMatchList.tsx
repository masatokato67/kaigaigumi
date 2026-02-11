import Link from "next/link";
import RatingBadge from "@/components/ui/RatingBadge";
import type { Match } from "@/lib/types";

export default function PlayerMatchList({
  matches,
  playerId,
}: {
  matches: Match[];
  playerId: string;
}) {
  return (
    <div className="bg-[#131829] rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h2 className="font-bold">試合リスト</h2>
      </div>
      <div className="space-y-3">
        {matches.map((match) => (
          <Link
            key={match.matchId}
            href={`/players/${playerId}/matches/${match.matchId}`}
            className="block bg-[#0a0e1a] rounded-lg p-4 hover:bg-[#1a2035] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs text-gray-400 mb-1">
                  {match.date} | {match.competition}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold">{match.homeTeam.name}</span>
                  <span className="text-red-500 font-bold text-lg">
                    {match.homeTeam.score}-{match.awayTeam.score}
                  </span>
                  <span className="font-bold">{match.awayTeam.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>
                    出場時間: {match.playerStats.minutesPlayed}分
                  </span>
                  <span>ゴール: {match.playerStats.goals}</span>
                  <span>アシスト: {match.playerStats.assists}</span>
                  {match.playerStats.starting && (
                    <span className="bg-red-600/20 text-red-400 px-2 py-0.5 rounded text-xs">
                      先発
                    </span>
                  )}
                </div>
              </div>
              <RatingBadge rating={match.playerStats.rating} size="md" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
