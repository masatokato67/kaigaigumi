"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  LEAGUE_OPTIONS,
  POSITION_OPTIONS,
  SORT_OPTIONS,
  ORDER_OPTIONS,
} from "@/lib/constants";

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentLeague = searchParams.get("league") || "all";
  const currentPosition = searchParams.get("position") || "all";
  const currentSort = searchParams.get("sortBy") || "rating";
  const currentOrder = searchParams.get("order") || "desc";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" && (key === "league" || key === "position")) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`/players?${params.toString()}`);
  }

  return (
    <div className="bg-[#131829] rounded-xl p-6 border border-gray-800 mb-8">
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
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span className="font-medium">フィルター・並び替え</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">リーグ</label>
          <select
            value={currentLeague}
            onChange={(e) => updateFilter("league", e.target.value)}
            className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          >
            {LEAGUE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">ポジション</label>
          <select
            value={currentPosition}
            onChange={(e) => updateFilter("position", e.target.value)}
            className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          >
            {POSITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">並び替え</label>
          <select
            value={currentSort}
            onChange={(e) => updateFilter("sortBy", e.target.value)}
            className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">順序</label>
          <select
            value={currentOrder}
            onChange={(e) => updateFilter("order", e.target.value)}
            className="w-full bg-[#0a0e1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          >
            {ORDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
