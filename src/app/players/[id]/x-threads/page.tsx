import { notFound } from "next/navigation";
import BackLink from "@/components/ui/BackLink";
import XThreadCard from "@/components/matches/XThreadCard";
import { getPlayerById, getPlayerMediaData, getAllPlayers } from "@/lib/data";

export function generateStaticParams() {
  const players = getAllPlayers();
  return players.map((player) => ({ id: player.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = getPlayerById(id);
  if (!player) return { title: "選手が見つかりません" };
  return {
    title: `${player.name.ja} - Xの反応一覧`,
    description: `${player.name.ja}（${player.club.shortName}）に関するXの投稿一覧`,
  };
}

export default async function XThreadsListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = getPlayerById(id);
  if (!player) notFound();

  const mediaData = getPlayerMediaData(id);
  const threads = mediaData?.xThreads ?? [];

  // 手動（実際のX投稿）→ AI生成 の順でソート
  const sorted = [...threads].sort((a, b) => {
    if (a.isManual && !b.isManual) return -1;
    if (!a.isManual && b.isManual) return 1;
    return 0;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BackLink href={`/players/${id}`} label={`${player.name.ja}に戻る`} />

      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-8 bg-red-600 rounded" />
        <div>
          <p className="text-red-500 text-xs font-medium tracking-wider">
            X REACTIONS
          </p>
          <h1 className="text-2xl font-bold">
            {player.name.ja} - Xの反応一覧
          </h1>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-gray-400 text-sm">まだXの反応データがありません。</p>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">{sorted.length}件の投稿</p>
          <div className="space-y-3">
            {sorted.map((thread) => (
              <XThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
