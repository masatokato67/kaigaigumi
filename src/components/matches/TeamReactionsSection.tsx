"use client";

import { TeamReactions } from "@/lib/types";
import XThreadCard from "./XThreadCard";

interface TeamReactionsSectionProps {
  reactions: TeamReactions;
}

function CountryFlag({ country }: { country: string }) {
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

export default function TeamReactionsSection({ reactions }: TeamReactionsSectionProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-8 bg-blue-500 rounded" />
        <div>
          <p className="text-blue-400 text-xs font-medium tracking-wider">
            WORLD REACTIONS
          </p>
          <h2 className="text-lg font-bold">日本代表に対する世界の評価</h2>
        </div>
      </div>

      {/* Articles */}
      {reactions.articles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">海外メディアの評価</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reactions.articles.map((article, i) => (
              <a
                key={i}
                href={article.articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-gray-800 hover:border-gray-600 p-4 transition-colors group"
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
                  <p className="text-xs text-gray-500 leading-relaxed mb-1 line-clamp-2">
                    {article.comment}
                  </p>
                )}
                {article.commentTranslated && (
                  <div className="bg-gray-800/40 rounded-lg p-2.5 border-l-2 border-blue-500/60 mt-2">
                    <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
                      {article.commentTranslated}
                    </p>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* X Threads */}
      {reactions.xThreads.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Xでの反応</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reactions.xThreads.map((thread) => (
              <XThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
