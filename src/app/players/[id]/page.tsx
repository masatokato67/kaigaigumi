import { notFound } from "next/navigation";
import BackLink from "@/components/ui/BackLink";
import PlayerProfile from "@/components/players/PlayerProfile";
import PlayerSeasonContent from "@/components/players/PlayerSeasonContent";
import { getPlayerById, getMatchesByPlayerId, getAllPlayers, getPlayerMediaData, getPlayerSeasons } from "@/lib/data";
import PlayerMediaRatings from "@/components/players/PlayerMediaRatings";
import PlayerXThreads from "@/components/players/PlayerXThreads";
import ImobileAd from "@/components/ads/ImobileAd";

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
  const playerMedia = getPlayerMediaData(id);
  const seasons = getPlayerSeasons(id);
  const matchesBySeason: Record<string, typeof matches> = {};
  for (const s of seasons) {
    matchesBySeason[s.id] = getMatchesByPlayerId(id, s.id);
  }
  const defaultSeason = seasons[0]?.id || "";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BackLink href="/players" label="選手一覧に戻る" />

      <PlayerProfile player={player} />

      <ImobileAd className="my-8" />

      <PlayerSeasonContent
        playerId={id}
        seasons={seasons}
        matchesBySeason={matchesBySeason}
        defaultSeason={defaultSeason}
      />

      <ImobileAd className="my-8" />

      {playerMedia && playerMedia.mediaRatings.length > 0 && (
        <div className="mb-8">
          <PlayerMediaRatings ratings={playerMedia.mediaRatings} playerId={id} />
        </div>
      )}

      {playerMedia && playerMedia.xThreads.length > 0 && (
        <div className="mb-8">
          <PlayerXThreads threads={playerMedia.xThreads} playerId={id} />
        </div>
      )}

      <ImobileAd className="mt-8" />
    </div>
  );
}
