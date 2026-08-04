"use client";

import { useState } from "react";
import RatingChart from "./RatingChart";
import PlayerMatchList from "./PlayerMatchList";
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

      {ratingData.length > 0 && (
        <div className="mb-8">
          <RatingChart data={ratingData} />
        </div>
      )}

      <PlayerMatchList matches={matches} playerId={playerId} />
    </>
  );
}
