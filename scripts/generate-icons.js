const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#0a0e1a" rx="20"/>
  <circle cx="50" cy="50" r="35" fill="#ffffff"/>
  <text x="50" y="58" font-size="32" font-weight="bold" fill="#e63946" text-anchor="middle" font-family="Arial, sans-serif">日</text>
</svg>`;

const publicDir = path.join(__dirname, "../public");

async function generateIcons() {
  const svgBuffer = Buffer.from(svgContent);

  // 48x48 PNG (for ICO)
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, "icon-48.png"));
  console.log("Generated: icon-48.png");

  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, "icon-192.png"));
  console.log("Generated: icon-192.png");

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, "icon-512.png"));
  console.log("Generated: icon-512.png");

  // Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("Generated: apple-touch-icon.png");

  // Copy 48x48 as favicon.ico placeholder (browsers will use this)
  // Note: Real ICO files need multiple sizes, but for Google Search 48x48 PNG works
  const pngBuffer = await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toBuffer();

  // Create a simple ICO file (single 48x48 image)
  const icoBuffer = createIco(pngBuffer, 48, 48);
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), icoBuffer);
  console.log("Generated: favicon.ico (48x48)");
}

// Simple ICO file creator
function createIco(pngBuffer, width, height) {
  // ICO header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type (1 = ICO)
  header.writeUInt16LE(1, 4); // Number of images

  // Image entry (16 bytes)
  const entry = Buffer.alloc(16);
  entry.writeUInt8(width, 0); // Width
  entry.writeUInt8(height, 1); // Height
  entry.writeUInt8(0, 2); // Color palette
  entry.writeUInt8(0, 3); // Reserved
  entry.writeUInt16LE(1, 4); // Color planes
  entry.writeUInt16LE(32, 6); // Bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // Image size
  entry.writeUInt32LE(22, 12); // Image offset (6 + 16)

  return Buffer.concat([header, entry, pngBuffer]);
}

generateIcons().catch(console.error);
