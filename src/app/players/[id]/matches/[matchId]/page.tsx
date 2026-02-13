import { notFound } from "next/navigation";
import BackLink from "@/components/ui/BackLink";
import MatchHeader from "@/components/matches/MatchHeader";
import HighlightVideo from "@/components/matches/HighlightVideo";
import MediaRatings from "@/components/matches/MediaRatings";
import LocalVoices from "@/components/matches/LocalVoices";
import XThreads from "@/components/matches/XThreads";
import {
  getPlayerById,
  getMatchById,
  getMediaRatingsByMatchId,
} from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>;
}) {
  const { id, matchId } = await params;
  const player = getPlayerById(id);
  const match = getMatchById(matchId);
  if (!player || !match) return { title: "試合が見つかりません" };
  return {
    title: `${player.name.ja} vs ${match.homeTeam.name === player.club.shortName ? match.awayTeam.name : match.homeTeam.name} | 海外組トラッカー`,
    description: `${match.date} ${match.competition} - ${player.name.ja}の試合詳細`,
  };
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>;
}) {
  const { id, matchId } = await params;
  const player = getPlayerById(id);
  const match = getMatchById(matchId);
  const mediaData = getMediaRatingsByMatchId(matchId);

  if (!player || !match) notFound();

  const averageRating = mediaData?.averageRating ?? match.playerStats.rating;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BackLink href={`/players/${id}`} label={`${player.name.ja}の詳細に戻る`} />

      <MatchHeader
        match={match}
        player={player}
        averageRating={averageRating}
      />

      {match.highlightVideo && (
        <div className="mt-8">
          <HighlightVideo video={match.highlightVideo} />
        </div>
      )}

      {mediaData && mediaData.ratings.length > 0 && (
        <div className="mt-8">
          <MediaRatings ratings={mediaData.ratings} />
        </div>
      )}

      {mediaData && mediaData.localVoices.length > 0 && (
        <div className="mt-8">
          <LocalVoices voices={mediaData.localVoices} />
        </div>
      )}

      {mediaData && mediaData.xThreads && mediaData.xThreads.length > 0 && (
        <div className="mt-8">
          <XThreads threads={mediaData.xThreads} />
        </div>
      )}
    </div>
  );
}
