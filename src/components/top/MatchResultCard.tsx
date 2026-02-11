import Link from "next/link";
import RatingBadge from "@/components/ui/RatingBadge";
import type { Match, Player } from "@/lib/types";

export default function MatchResultCard({
  match,
  player,
}: {
  match: Match;
  player: Player;
}) {
  return (
    <Link
      href={`/players/${match.playerId}/matches/${match.matchId}`}
      className="block min-w-[240px] bg-[#131829] rounded-xl p-4 border border-gray-800 hover:border-gray-600 transition-colors"
    >
      <div className="text-center mb-3">
        <div className="text-xs text-gray-400">{match.date}</div>
        <div className="text-xs text-gray-500">{match.competition}</div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-sm">{match.homeTeam.name}</span>
          </div>
          <span className="text-lg font-bold">{match.homeTeam.score}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm">{match.awayTeam.name}</span>
          </div>
          <span className="text-lg font-bold">{match.awayTeam.score}</span>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-300">{player.name.ja}</div>
          <div className="text-xs text-gray-500">
            {match.playerStats.minutesPlayed}&apos;
            <span className="ml-3">
              G:{match.playerStats.goals} A:{match.playerStats.assists}
            </span>
          </div>
        </div>
        <RatingBadge rating={match.playerStats.rating} size="sm" />
      </div>
    </Link>
  );
}
