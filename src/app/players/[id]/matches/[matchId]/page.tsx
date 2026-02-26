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
  getHighlightVideoByMatchId,
  getAllMatches,
} from "@/lib/data";
import AdBanner from "@/components/ads/AdBanner";

export function generateStaticParams() {
  const matches = getAllMatches();
  return matches.map((match) => ({
    id: match.playerId,
    matchId: match.matchId,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>;
}) {
  const { id, matchId } = await params;
  const player = getPlayerById(id);
  const match = getMatchById(matchId);
  if (!player || !match) return { title: "試合が見つかりません" };
  const opponent = match.homeTeam.name === player.club.shortName ? match.awayTeam.name : match.homeTeam.name;
  const title = `${player.name.ja} vs ${opponent}`;
  const description = `${match.date} ${match.competition} ${match.homeTeam.name} ${match.homeTeam.score}-${match.awayTeam.score} ${match.awayTeam.name} - ${player.name.ja}の試合詳細・評価・現地の声`;
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

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>;
}) {
  const { id, matchId } = await params;
  const player = getPlayerById(id);
  const match = getMatchById(matchId);
  const mediaData = getMediaRatingsByMatchId(matchId);
  const highlightVideo = getHighlightVideoByMatchId(matchId);

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

      {highlightVideo && (
        <div className="mt-8">
          <HighlightVideo video={highlightVideo} />
        </div>
      )}

      {mediaData && mediaData.ratings.length > 0 && (
        <div className="mt-8">
          <MediaRatings ratings={mediaData.ratings} />
        </div>
      )}

      {/* Ad Banner 1 */}
      <div className="mt-8">
        <AdBanner slot="match-1" format="horizontal" />
      </div>

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

      {/* Ad Banner 2 */}
      <div className="mt-8">
        <AdBanner slot="match-2" format="horizontal" />
      </div>
    </div>
  );
}
