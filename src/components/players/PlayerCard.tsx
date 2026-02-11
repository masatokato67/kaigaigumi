import Link from "next/link";
import Image from "next/image";
import RatingBadge from "@/components/ui/RatingBadge";
import PositionBadge from "@/components/ui/PositionBadge";
import type { Player } from "@/lib/types";

export default function PlayerCard({ player }: { player: Player }) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="block bg-[#131829] rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-colors"
    >
      <div className="relative h-48 bg-gradient-to-br from-blue-900/40 to-gray-900">
        <Image
          src={player.photo}
          alt={player.name.ja}
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#131829] via-transparent to-transparent" />
        <div className="absolute top-3 right-3">
          <RatingBadge rating={player.seasonStats.averageRating} size="sm" />
        </div>
        <div className="absolute bottom-3 left-3">
          <PositionBadge position={player.position} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg">{player.name.ja}</h3>
        <p className="text-xs text-gray-400 mb-3">{player.name.en}</p>
        <div className="space-y-1 mb-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">所属</span>
            <span>{player.club.shortName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">リーグ</span>
            <span>{player.league.shortName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">市場価値</span>
            <span>{player.marketValue}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">代表キャップ</span>
            <span>{player.caps}</span>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-3 mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-gray-500">ゴール</div>
            <div className="text-red-500 font-bold">
              {player.seasonStats.goals}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">アシスト</div>
            <div className="text-red-500 font-bold">
              {player.seasonStats.assists}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">出場</div>
            <div className="text-white font-bold">
              {player.seasonStats.appearances}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
