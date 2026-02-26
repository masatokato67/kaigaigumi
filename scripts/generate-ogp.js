const sharp = require("sharp");
const path = require("path");

const publicDir = path.join(__dirname, "../public");

// OGP画像（1200x630）を生成
async function generateOGP() {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="#0a0e1a"/>

    <!-- 装飾線 -->
    <rect x="0" y="0" width="1200" height="4" fill="#e63946"/>
    <rect x="0" y="626" width="1200" height="4" fill="#e63946"/>

    <!-- サッカーボールアイコン -->
    <circle cx="600" cy="230" r="80" fill="#ffffff" opacity="0.1"/>
    <circle cx="600" cy="230" r="50" fill="#ffffff" opacity="0.15"/>

    <!-- タイトル -->
    <text x="600" y="320" font-size="72" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">海外組サカレポ</text>

    <!-- サブタイトル -->
    <text x="600" y="400" font-size="28" fill="#9ca3af" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">日本人選手の海外での活躍を詳細に追跡</text>

    <!-- 下部テキスト -->
    <text x="600" y="480" font-size="22" fill="#6b7280" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">試合結果 / スタッツ / 現地の評価</text>

    <!-- URL -->
    <text x="600" y="570" font-size="18" fill="#4b5563" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">kaigaigumi-football.com</text>
  </svg>`;

  await sharp(Buffer.from(svgContent))
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicDir, "ogp.png"));
  console.log("Generated: ogp.png (1200x630)");
}

generateOGP().catch(console.error);
