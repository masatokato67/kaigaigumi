import BackLink from "@/components/ui/BackLink";
import XThreadCard from "@/components/matches/XThreadCard";
import { ArticleCard } from "@/components/matches/TeamReactionsSection";
import { getTeamReactions } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "日本代表に対する世界の評価 - 海外組サカレポ",
  description: "2026ワールドカップにおける日本代表に対する海外メディア・Xの反応一覧",
};

const MATCH_LABELS: { before: string; label: string }[] = [
  { before: "2026-06-26", label: "チュニジア戦後" },
  { before: "2026-06-30", label: "スウェーデン戦後（ブラジル戦前）" },
];

function getMatchLabel(postedAt?: string): string {
  if (!postedAt) return MATCH_LABELS[0].label;
  const date = postedAt.slice(0, 10);
  for (const m of MATCH_LABELS) {
    if (date < m.before) return m.label;
  }
  return "";
}

function groupThreadsByMatch(threads: { postedAt?: string }[]) {
  const groups: { label: string; indices: number[] }[] = [];
  const labelMap = new Map<string, number[]>();

  threads.forEach((t, i) => {
    const label = getMatchLabel(t.postedAt);
    if (!labelMap.has(label)) {
      labelMap.set(label, []);
      groups.push({ label, indices: labelMap.get(label)! });
    }
    labelMap.get(label)!.push(i);
  });

  return groups.reverse();
}

export default function TeamReactionsPage() {
  const reactions = getTeamReactions("wc2026");

  const articles = reactions?.articles ?? [];
  const threads = reactions?.xThreads ?? [];
  const threadGroups = groupThreadsByMatch(threads);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BackLink href="/matches?season=wc2026" label="試合結果に戻る" />

      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-8 bg-blue-500 rounded" />
        <div>
          <p className="text-blue-400 text-xs font-medium tracking-wider">
            WORLD REACTIONS
          </p>
          <h1 className="text-2xl font-bold">
            日本代表に対する世界の評価
          </h1>
        </div>
      </div>

      {threads.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Xの反応</h2>
              <p className="text-xs text-gray-500">日本代表に関するXの投稿</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">{threads.length}件の投稿</p>
          <div className="space-y-3">
            {threadGroups.map((group) => (
              <div key={group.label}>
                {group.label && (
                  <div className="flex items-center gap-2 pt-2 pb-3">
                    <div className="h-px flex-1 bg-gray-700" />
                    <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
                      {group.label}
                    </span>
                    <div className="h-px flex-1 bg-gray-700" />
                  </div>
                )}
                <div className="space-y-3">
                  {group.indices.map((idx) => (
                    <XThreadCard key={threads[idx].id} thread={threads[idx]} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {articles.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <div>
              <h2 className="text-lg font-bold text-white">海外メディアの評価</h2>
              <p className="text-xs text-gray-500">日本代表に関する海外メディアの記事</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-4">{articles.length}件の記事</p>
          <div className="space-y-3">
            {articles.map((article, i) => (
              <ArticleCard key={i} article={article} />
            ))}
          </div>
        </div>
      )}

      {threads.length === 0 && articles.length === 0 && (
        <p className="text-gray-400 text-sm py-8 text-center">
          まだ評価データがありません。
        </p>
      )}
    </div>
  );
}
