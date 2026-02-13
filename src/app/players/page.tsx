import { Suspense } from "react";
import FilterBar from "@/components/players/FilterBar";
import PlayerCard from "@/components/players/PlayerCard";
import { getFilteredPlayers } from "@/lib/data";
import type { LeagueFilter, PositionFilter, SortField, SortOrder } from "@/lib/types";

export const metadata = {
  title: "選手一覧 | 海外組サカレポ",
  description: "海外でプレーする日本人選手を詳しく見る",
};

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const players = getFilteredPlayers({
    league: (params.league as LeagueFilter) || "all",
    position: (params.position as PositionFilter) || "all",
    sortBy: (params.sortBy as SortField) || "rating",
    sortOrder: (params.order as SortOrder) || "desc",
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-8 bg-red-600 rounded" />
          <div>
            <p className="text-red-500 text-xs font-medium tracking-wider">
              PLAYERS
            </p>
            <h1 className="text-2xl font-bold">選手一覧</h1>
          </div>
        </div>
        <p className="text-gray-400 text-sm ml-3">
          海外でプレーする日本人選手を詳しく見る
        </p>
      </div>

      <Suspense fallback={null}>
        <FilterBar />
      </Suspense>

      <p className="text-sm text-gray-400 mb-6">
        {players.length}件の選手が見つかりました
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}
