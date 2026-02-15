import { notFound } from "next/navigation";
import BackLink from "@/components/ui/BackLink";
import StatBox from "@/components/ui/StatBox";
import PlayerProfile from "@/components/players/PlayerProfile";
import RatingChart from "@/components/players/RatingChart";
import PlayerMatchList from "@/components/players/PlayerMatchList";
import { getPlayerById, getMatchesByPlayerId, getAllPlayers } from "@/lib/data";

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
  return {
    title: `${player.name.ja} | 海外組サカレポ`,
    description: `${player.name.ja}（${player.club.shortName}）の試合評価・スタッツ`,
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

      <PlayerMatchList matches={matches} playerId={id} />
    </div>
  );
}
