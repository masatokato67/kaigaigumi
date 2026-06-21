"use client";

import Link from "next/link";
import { TeamReactions } from "@/lib/types";
import XThreadCard from "./XThreadCard";

const PREVIEW_COUNT = 3;

interface TeamReactionsSectionProps {
  reactions: TeamReactions;
}

export function CountryFlag({ country }: { country: string }) {
  const flags: Record<string, string> = {
    "イギリス": "🇬🇧", "イングランド": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "アメリカ": "🇺🇸", "フランス": "🇫🇷", "ドイツ": "🇩🇪",
    "スペイン": "🇪🇸", "イタリア": "🇮🇹", "ブラジル": "🇧🇷",
    "アルゼンチン": "🇦🇷", "オランダ": "🇳🇱", "ポルトガル": "🇵🇹",
    "韓国": "🇰🇷", "中国": "🇨🇳", "オーストラリア": "🇦🇺",
    "カタール": "🇶🇦", "サウジアラビア": "🇸🇦", "メキシコ": "🇲🇽",
    "カナダ": "🇨🇦", "トルコ": "🇹🇷", "ベルギー": "🇧🇪",
  };
  return <span>{flags[country] || "🌍"}</span>;
}

export function ArticleCard({ article }: { article: TeamReactions["articles"][0] }) {
  return (
    <a
      href={article.articleUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[#0a0e1a] rounded-lg p-4 hover:bg-[#0f1424] transition-colors group"
    >
      <div className="flex items-center gap-2 mb-2">
        <CountryFlag country={article.country} />
        <span className="text-xs text-gray-400">{article.source}</span>
        <span className="text-xs text-gray-600 ml-auto">{article.date}</span>
      </div>
      <h4 className="text-sm font-medium text-white mb-2 group-hover:text-blue-400 transition-colors">
        {article.title}
      </h4>
      {article.comment && (
        <div className="pl-3 border-l-2 border-gray-700 space-y-2">
          <p className="text-sm text-gray-300 italic leading-relaxed line-clamp-2">
            &ldquo;{article.comment}&rdquo;
          </p>
          {article.commentTranslated && (
            <p className="text-sm text-white leading-relaxed line-clamp-3">
              {article.commentTranslated}
            </p>
          )}
        </div>
      )}
    </a>
  );
}

export default function TeamReactionsSection({ reactions }: TeamReactionsSectionProps) {
  const allItems = [
    ...reactions.xThreads.map((t) => ({ type: "thread" as const, data: t })),
    ...reactions.articles.map((a) => ({ type: "article" as const, data: a })),
  ];
  const previewItems = allItems.slice(0, PREVIEW_COUNT);
  const totalCount = allItems.length;

  return (
    <div className="mb-8">
      {/* X Threads Preview */}
      {previewItems.some((item) => item.type === "thread") && (
        <div className="bg-[#131829] rounded-xl p-6 border border-gray-800 mb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">日本代表に対する世界の評価</h2>
                <p className="text-xs text-gray-500">海外メディア・Xの反応</p>
              </div>
            </div>
            <Link
              href="/matches/team-reactions"
              className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              一覧を見る
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="space-y-3">
            {previewItems.map((item, i) =>
              item.type === "thread" ? (
                <XThreadCard key={item.data.id} thread={item.data} />
              ) : (
                <ArticleCard key={i} article={item.data} />
              )
            )}
          </div>

          {totalCount > PREVIEW_COUNT && (
            <Link
              href="/matches/team-reactions"
              className="mt-4 block w-full py-2.5 rounded-lg bg-[#1a1f35] text-gray-400 hover:text-white text-sm font-medium transition-colors border border-gray-700 hover:border-gray-600 text-center"
            >
              すべて表示する（{totalCount}件）
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
