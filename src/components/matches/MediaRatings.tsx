import { getRatingColor, getRatingTextColor, getGermanRatingColor } from "@/lib/utils";
import type { MediaRating } from "@/lib/types";

export default function MediaRatings({
  ratings,
}: {
  ratings: MediaRating[];
}) {
  const hasGermanRating = ratings.some((r) => r.ratingSystem === "german");

  return (
    <div className="bg-[#131829] rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-2 mb-4">
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
        <h2 className="font-bold">海外メディア評価</h2>
      </div>
      <div className="space-y-3">
        {ratings.map((rating) => {
          const isGerman = rating.ratingSystem === "german";
          const colorClass = isGerman
            ? getGermanRatingColor(rating.rating)
            : getRatingColor(rating.rating);
          const textColorClass = isGerman
            ? "text-green-400"
            : getRatingTextColor(rating.rating);

          return (
            <div
              key={rating.source}
              className="bg-[#0a0e1a] rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-400">
                    {rating.source.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{rating.source}</div>
                    <div className="text-xs text-gray-400">{rating.country}</div>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${textColorClass}`}>
                  {rating.rating.toFixed(1)}
                </div>
              </div>
              {rating.comment && (
                <div className="mt-3 pl-11 text-sm text-gray-400 italic border-l-2 border-gray-700 ml-4">
                  &ldquo;{rating.comment}&rdquo;
                </div>
              )}
            </div>
          );
        })}
      </div>
      {hasGermanRating && (
        <div className="mt-4 bg-red-900/20 border border-red-800/30 rounded-lg p-3 text-xs text-red-400">
          注：評価点は各メディアの基準に基づいています。ドイツのメディア(kicker等)は1が最高点、6が最低点の特殊な採点方式を採用しています。
        </div>
      )}
    </div>
  );
}
