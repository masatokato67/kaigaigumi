"use client";

interface AdBannerProps {
  slot: string;
  format?: "horizontal" | "rectangle" | "vertical";
  className?: string;
}

export default function AdBanner({
  slot,
  format = "horizontal",
  className = "",
}: AdBannerProps) {
  const isProduction = process.env.NODE_ENV === "production";

  // サイズ設定
  const sizeClasses = {
    horizontal: "h-[90px] md:h-[90px]", // 728x90 レスポンシブ
    rectangle: "h-[250px]", // 300x250
    vertical: "h-[600px]", // 300x600
  };

  // 開発環境ではプレースホルダーを表示
  if (!isProduction) {
    return (
      <div
        className={`w-full ${sizeClasses[format]} bg-gray-800/50 border border-dashed border-gray-600 rounded-lg flex items-center justify-center ${className}`}
      >
        <div className="text-center text-gray-500">
          <div className="text-xs mb-1">広告枠</div>
          <div className="text-xs font-mono">{slot}</div>
          <div className="text-xs mt-1">
            {format === "horizontal" && "728x90"}
            {format === "rectangle" && "300x250"}
            {format === "vertical" && "300x600"}
          </div>
        </div>
      </div>
    );
  }

  // 本番環境: AdSenseコード（Publisher ID取得後に有効化）
  return (
    <div className={`w-full ${sizeClasses[format]} ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-2824221352087137"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
