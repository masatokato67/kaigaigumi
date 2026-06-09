"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import MatchResultCard from "@/components/top/MatchResultCard";
import {
  getMatchesBySeason,
  getTopRatedMatches,
  getAvailableSeasons,
  getPlayerById,
} from "@/lib/data";

function MatchesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const seasons = getAvailableSeasons();
  const currentSeason = searchParams.get("season") || seasons[0]?.id;
  const topRatedMatches = getTopRatedMatches(10);
  const allMatches = getMatchesBySeason(currentSeason);

  const handleSeasonChange = (seasonId: string) => {
    router.push(`/matches?season=${seasonId}`);
  };

  return (
    <>
      {/* Season Selector */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {seasons.map((season) => (
          <button
            key={season.id}
            onClick={() => handleSeasonChange(season.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentSeason === season.id
                ? "bg-red-600 text-white"
                : "bg-[#1a1f35] text-gray-400 hover:text-white border border-gray-700"
            }`}
          >
            {season.label}
          </button>
        ))}
      </div>

      {/* Top Rated Matches */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-8 bg-yellow-500 rounded" />
          <div>
            <p className="text-yellow-500 text-xs font-medium tracking-wider">
              HIGHLIGHTS
            </p>
            <h2 className="text-lg font-bold">注目の試合結果</h2>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {topRatedMatches.map((match) => {
            const player = getPlayerById(match.playerId);
            if (!player) return null;
            return (
              <MatchResultCard
                key={match.matchId}
                match={match}
                player={player}
              />
            );
          })}
        </div>
      </div>

      {/* All Matches */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-8 bg-red-600 rounded" />
          <div>
            <p className="text-red-500 text-xs font-medium tracking-wider">
              ALL RESULTS
            </p>
            <h2 className="text-lg font-bold">試合結果一覧</h2>
          </div>
        </div>
        {allMatches.length > 0 ? (
          <>
            <p className="text-sm text-gray-400 mb-4">
              {allMatches.length}件の試合
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {allMatches.map((match) => {
                const player = getPlayerById(match.playerId);
                if (!player) return null;
                return (
                  <MatchResultCard
                    key={match.matchId}
                    match={match}
                    player={player}
                    fullWidth
                  />
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-sm py-8 text-center">
            この期間の試合データはまだありません
          </p>
        )}
      </div>
    </>
  );
}

export default function MatchesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-8 bg-red-600 rounded" />
          <div>
            <p className="text-red-500 text-xs font-medium tracking-wider">
              MATCHES
            </p>
            <h1 className="text-2xl font-bold">試合結果</h1>
          </div>
        </div>
      </div>

      <Suspense fallback={<p className="text-sm text-gray-400">読み込み中...</p>}>
        <MatchesContent />
      </Suspense>
    </div>
  );
}
