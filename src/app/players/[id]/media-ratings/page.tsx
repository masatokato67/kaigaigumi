import { notFound } from "next/navigation";
import BackLink from "@/components/ui/BackLink";
import { getPlayerById, getPlayerMediaData, getAllPlayers } from "@/lib/data";
import { getRatingTextColor } from "@/lib/utils";
import type { PlayerMediaRating } from "@/lib/types";

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
    title: `${player.name.ja} - 海外メディア評価一覧`,
    description: `${player.name.ja}（${player.club.shortName}）に対する海外メディアの評価一覧`,
  };
}

export default async function MediaRatingsListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = getPlayerById(id);
  if (!player) notFound();

  const mediaData = getPlayerMediaData(id);
  const ratings = mediaData?.mediaRatings ?? [];

  const hasGermanRating = ratings.some(
    (r) => r.ratingSystem === "german" && r.hasArticleRating !== false
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BackLink href={`/players/${id}`} label={`${player.name.ja}に戻る`} />

      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-8 bg-red-600 rounded" />
        <div>
          <p className="text-red-500 text-xs font-medium tracking-wider">
            MEDIA RATINGS
          </p>
          <h1 className="text-2xl font-bold">
            {player.name.ja} - 海外メディア評価一覧
          </h1>
        </div>
      </div>

      {ratings.length === 0 ? (
        <p className="text-gray-400 text-sm">まだ評価データがありません。</p>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">{ratings.length}件の評価</p>
          <div className="space-y-3">
            {ratings.map((rating, i) => (
              <RatingCard key={`${rating.source}-${rating.date}-${i}`} rating={rating} />
            ))}
          </div>
          {hasGermanRating && (
            <div className="mt-4 bg-red-900/20 border border-red-800/30 rounded-lg p-3 text-xs text-red-400">
              注：ドイツのメディア(kicker等)は1が最高点、6が最低点の特殊な採点方式を採用しています。
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RatingCard({ rating }: { rating: PlayerMediaRating }) {
  const isGerman = rating.ratingSystem === "german";
  const textColorClass = isGerman
    ? "text-green-400"
    : getRatingTextColor(rating.rating);
  const scoreVisible = rating.hasArticleRating !== false;

  return (
    <div className="bg-[#131829] rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-400">
            {rating.source.charAt(0)}
          </div>
          <div>
            <div className="font-medium">
              {rating.articleUrl ? (
                <a
                  href={rating.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  {rating.source}
                </a>
              ) : (
                rating.source
              )}
            </div>
            <div className="text-xs text-gray-400">
              {rating.country}
              <span className="ml-2 text-gray-500">{rating.date}</span>
            </div>
          </div>
        </div>
        {scoreVisible && (
          <div className={`text-2xl font-bold ${textColorClass}`}>
            {rating.rating.toFixed(1)}
          </div>
        )}
      </div>
      {rating.comment && (
        <div className="mt-3 pl-11 border-l-2 border-gray-700 ml-4 space-y-2">
          <div className="text-sm text-gray-300 italic leading-relaxed">
            &ldquo;{rating.comment}&rdquo;
          </div>
          {rating.commentTranslated && (
            <div className="text-sm text-white leading-relaxed">
              {rating.commentTranslated}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
