import Link from "next/link";
import HeroSection from "@/components/top/HeroSection";
import MatchResultCard from "@/components/top/MatchResultCard";
import FeaturedPlayerCard from "@/components/top/FeaturedPlayerCard";
import SeasonStatsSummary from "@/components/top/SeasonStatsSummary";
import {
  getRecentMatches,
  getTopRatedMatches,
  getFeaturedPlayers,
  getSeasonAggregateStats,
  getPlayerById,
} from "@/lib/data";

export default function Home() {
  const recentMatches = getRecentMatches(10);
  const topRatedMatches = getTopRatedMatches(10);
  const featuredPlayers = getFeaturedPlayers();
  const seasonStats = getSeasonAggregateStats();

  return (
    <div>
      <HeroSection />

      {/* Recent Match Results */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-8 bg-red-600 rounded" />
          <div>
            <p className="text-red-500 text-xs font-medium tracking-wider">
              RESULTS
            </p>
            <h2 className="text-xl font-bold">最新の試合結果</h2>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {recentMatches.map((match) => {
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
      </section>

      {/* Top Rated Matches */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-8 bg-yellow-500 rounded" />
          <div>
            <p className="text-yellow-500 text-xs font-medium tracking-wider">
              HIGHLIGHTS
            </p>
            <h2 className="text-xl font-bold">注目の試合結果</h2>
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
      </section>

      {/* Featured Players */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-red-600 rounded" />
            <div>
              <p className="text-red-500 text-xs font-medium tracking-wider">
                LINEUP
              </p>
              <h2 className="text-xl font-bold">注目の選手</h2>
            </div>
          </div>
          <Link
            href="/players"
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            全て見る
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {featuredPlayers.map((player) => (
            <FeaturedPlayerCard key={player.id} player={player} />
          ))}
        </div>
      </section>

      {/* Season Stats */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-8 bg-red-600 rounded" />
          <div>
            <p className="text-red-500 text-xs font-medium tracking-wider">
              STATISTICS
            </p>
            <h2 className="text-xl font-bold">今シーズンの統計</h2>
          </div>
        </div>
        <SeasonStatsSummary stats={seasonStats} />
      </section>
    </div>
  );
}
