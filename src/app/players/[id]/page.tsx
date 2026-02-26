import { notFound } from "next/navigation";
import BackLink from "@/components/ui/BackLink";
import StatBox from "@/components/ui/StatBox";
import PlayerProfile from "@/components/players/PlayerProfile";
import RatingChart from "@/components/players/RatingChart";
import PlayerMatchList from "@/components/players/PlayerMatchList";
import { getPlayerById, getMatchesByPlayerId, getAllPlayers } from "@/lib/data";
import AdBanner from "@/components/ads/AdBanner";

export function generateStaticParams() {
  const players = getAllPlayers();
  return players.map((player) => ({
    id: player.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = getPlayerById(id);
  if (!player) return { title: "選手が見つかりません" };
  const title = `${player.name.ja}（${player.club.shortName}）`;
  const description = `${player.name.ja}（${player.club.shortName}/${player.league.shortName}）の試合評価・スタッツ・現地の声`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ["/ogp.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/ogp.png"],
    },
  };
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = getPlayerById(id);
  if (!player) notFound();

  const matches = getMatchesByPlayerId(id);
  const ratingData = matches
    .slice(0, 10) // 最新10試合のみ
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({
      date: m.date,
      rating: m.playerStats.rating,
    }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BackLink href="/players" label="選手一覧に戻る" />

      <PlayerProfile player={player} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
        <StatBox value={player.seasonStats.goals} label="ゴール" accent />
        <StatBox value={player.seasonStats.assists} label="アシスト" accent />
        <StatBox value={player.seasonStats.appearances} label="出場試合" />
        <StatBox value={player.seasonStats.minutesPlayed} label="出場時間" />
      </div>

      <div className="mb-8">
        <RatingChart data={ratingData} />
      </div>

      {/* Ad Banner 1 */}
      <div className="mb-8">
        <AdBanner slot="player-1" format="horizontal" />
      </div>

      <PlayerMatchList matches={matches} playerId={id} />

      {/* Ad Banner 2 */}
      <div className="mt-8">
        <AdBanner slot="player-2" format="horizontal" />
      </div>
    </div>
  );
}
