import RatingBadge from "@/components/ui/RatingBadge";
import type { Match, Player } from "@/lib/types";

export default function MatchHeader({
  match,
  player,
  averageRating,
}: {
  match: Match;
  player: Player;
  averageRating: number;
}) {
  return (
    <div className="bg-[#131829] rounded-xl p-6 border border-gray-800">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">
            {match.date} | {match.competition}
          </div>
          <h1 className="text-2xl font-bold">{player.name.ja}</h1>
          <p className="text-gray-400 text-sm">{player.name.en}</p>
        </div>
        <div className="text-center">
          <RatingBadge rating={averageRating} size="lg" />
          <div className="text-xs text-gray-400 mt-1">平均評価点</div>
        </div>
      </div>

      {/* Score Display */}
      <div className="bg-[#0a0e1a] rounded-lg p-6 text-center mb-6">
        <div className="flex items-center justify-center gap-6">
          <span className="text-xl font-bold">{match.homeTeam.name}</span>
          <div className="text-3xl font-bold">
            <span className="text-green-500">{match.homeTeam.score}</span>
            <span className="text-gray-500 mx-2">-</span>
            <span>{match.awayTeam.score}</span>
          </div>
          <span className="text-xl font-bold">{match.awayTeam.name}</span>
        </div>
      </div>

      {/* Player Match Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0a0e1a] rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-500">
            {match.playerStats.minutesPlayed}
          </div>
          <div className="text-xs text-gray-400 mt-1">出場時間</div>
        </div>
        <div className="bg-[#0a0e1a] rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-500">
            {match.playerStats.goals}
          </div>
          <div className="text-xs text-gray-400 mt-1">ゴール</div>
        </div>
        <div className="bg-[#0a0e1a] rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-500">
            {match.playerStats.assists}
          </div>
          <div className="text-xs text-gray-400 mt-1">アシスト</div>
        </div>
        <div className="bg-[#0a0e1a] rounded-lg p-4 text-center flex items-center justify-center">
          {match.playerStats.starting ? (
            <span className="bg-red-600 text-white px-4 py-1 rounded text-sm font-medium">
              先発出場
            </span>
          ) : (
            <span className="bg-gray-700 text-gray-300 px-4 py-1 rounded text-sm font-medium">
              途中出場
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
