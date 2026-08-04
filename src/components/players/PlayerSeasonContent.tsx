"use client";

import { useState, useMemo } from "react";
import RatingChart from "./RatingChart";
import PlayerMatchList from "./PlayerMatchList";
import StatBox from "@/components/ui/StatBox";
import type { Match } from "@/lib/types";

interface SeasonOption {
  id: string;
  label: string;
}

interface SeasonMatches {
  [seasonId: string]: Match[];
}

export default function PlayerSeasonContent({
  playerId,
  seasons,
  matchesBySeason,
  defaultSeason,
}: {
  playerId: string;
  seasons: SeasonOption[];
  matchesBySeason: SeasonMatches;
  defaultSeason: string;
}) {
  const [currentSeason, setCurrentSeason] = useState(defaultSeason);
  const matches = matchesBySeason[currentSeason] || [];

  const stats = useMemo(() => {
    return matches.reduce(
      (acc, m) => ({
        goals: acc.goals + m.playerStats.goals,
        assists: acc.assists + m.playerStats.assists,
        appearances: acc.appearances + 1,
        minutesPlayed: acc.minutesPlayed + m.playerStats.minutesPlayed,
      }),
      { goals: 0, assists: 0, appearances: 0, minutesPlayed: 0 }
    );
  }, [matches]);

  const ratingData = [...matches]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10)
    .map((m) => ({
      date: m.date,
      rating: m.playerStats.rating,
    }));

  return (
    <>
      {seasons.length > 1 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {seasons.map((season) => (
            <button
              key={season.id}
              onClick={() => setCurrentSeason(season.id)}
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
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatBox value={stats.goals} label="ゴール" accent />
        <StatBox value={stats.assists} label="アシスト" accent />
        <StatBox value={stats.appearances} label="出場試合" />
        <StatBox value={stats.minutesPlayed} label="出場時間" />
      </div>

      {ratingData.length > 0 && (
        <div className="mb-8">
          <RatingChart data={ratingData} />
        </div>
      )}

      <PlayerMatchList matches={matches} playerId={playerId} />
    </>
  );
}
