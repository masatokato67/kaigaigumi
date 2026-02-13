import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative py-20 px-4 overflow-hidden min-h-[500px]">
      {/* 背景画像 */}
      <div className="absolute inset-0">
        <Image
          src="/images/top/bg_image.png"
          alt="背景"
          fill
          className="object-cover object-center"
          priority
        />
        {/* オーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e1a] via-[#0a0e1a]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#131829] via-transparent to-[#0a0e1a]/50" />
      </div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />
      <div className="relative max-w-6xl mx-auto">
        <p className="text-red-500 text-sm font-medium tracking-wider mb-4">
          WELCOME
        </p>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          海外組
          <br />
          <span className="ml-2">サカレポ</span>
        </h1>
        <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
          日本人選手の海外での活躍を詳細に追跡。試合結果、スタッツ、現地の評価まで全てをカバー。
        </p>
        <Link
          href="/players"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
        >
          選手を見る
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}
