import Image from "next/image";
import RatingBadge from "@/components/ui/RatingBadge";
import type { Player } from "@/lib/types";

export default function PlayerProfile({ player }: { player: Player }) {
  return (
    <div className="bg-[#131829] rounded-xl overflow-hidden border border-gray-800">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-72 h-56 bg-gradient-to-br from-blue-900/40 to-gray-900 flex-shrink-0 relative">
          <Image
            src={player.photo}
            alt={player.name.ja}
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 288px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#131829]/80 hidden md:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131829] to-transparent md:hidden" />
        </div>
        <div className="p-6 flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{player.name.ja}</h1>
              <p className="text-gray-400">{player.name.en}</p>
            </div>
            <RatingBadge
              rating={player.seasonStats.averageRating}
              size="lg"
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                所属クラブ
              </div>
              <div className="font-medium">{player.club.shortName}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                </svg>
                リーグ
              </div>
              <div className="font-medium">{player.league.shortName}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2L13 8H17L14 12L15 18L10 15L5 18L6 12L3 8H7L10 2Z" />
                </svg>
                ポジション
              </div>
              <div className="font-medium">{player.position}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-400">市場価値</div>
              <div className="font-medium">{player.marketValue}</div>
            </div>
            <div>
              <div className="text-gray-400">代表キャップ</div>
              <div className="font-medium">{player.caps}</div>
            </div>
            <div>
              <div className="text-gray-400">国籍</div>
              <div className="font-medium">{player.nationality}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
