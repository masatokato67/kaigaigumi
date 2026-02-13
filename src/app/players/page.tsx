"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FilterBar from "@/components/players/FilterBar";
import PlayerCard from "@/components/players/PlayerCard";
import { getFilteredPlayers, getAllPlayers } from "@/lib/data";
import type { LeagueFilter, PositionFilter, SortField, SortOrder } from "@/lib/types";

function PlayerList() {
  const searchParams = useSearchParams();
  const players = getFilteredPlayers({
    league: (searchParams.get("league") as LeagueFilter) || "all",
    position: (searchParams.get("position") as PositionFilter) || "all",
    sortBy: (searchParams.get("sortBy") as SortField) || "rating",
    sortOrder: (searchParams.get("order") as SortOrder) || "desc",
  });

  return (
    <>
      <p className="text-sm text-gray-400 mb-6">
        {players.length}件の選手が見つかりました
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </>
  );
}

export default function PlayersPage() {
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

      <Suspense fallback={<p className="text-sm text-gray-400 mb-6">読み込み中...</p>}>
        <PlayerList />
      </Suspense>
    </div>
  );
}
