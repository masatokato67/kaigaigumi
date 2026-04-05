"use client";

import { useState } from "react";
import Link from "next/link";
import XThreadCard from "@/components/matches/XThreadCard";
import type { PlayerXThread } from "@/lib/types";

const INITIAL_COUNT = 3;
const LOAD_MORE_COUNT = 5;

export default function PlayerXThreads({
  threads,
  playerId,
}: {
  threads: PlayerXThread[];
  playerId: string;
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  if (threads.length === 0) return null;

  // 手動（実際のX投稿）→ AI生成 の順でソート
  const sorted = [...threads].sort((a, b) => {
    if (a.isManual && !b.isManual) return -1;
    if (!a.isManual && b.isManual) return 1;
    return 0;
  });

  const visibleThreads = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  return (
    <div className="bg-[#131829] rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Xの反応</h2>
            <p className="text-xs text-gray-500">この選手に関するXの投稿</p>
          </div>
        </div>
        <Link
          href={`/players/${playerId}/x-threads`}
          className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          一覧を見る
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="space-y-3">
        {visibleThreads.map((thread) => (
          <XThreadCard key={thread.id} thread={thread} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + LOAD_MORE_COUNT)}
          className="mt-4 w-full py-2.5 rounded-lg bg-[#1a1f35] text-gray-400 hover:text-white text-sm font-medium transition-colors border border-gray-700 hover:border-gray-600"
        >
          もっと表示する（残り{sorted.length - visibleCount}件）
        </button>
      )}
    </div>
  );
}
