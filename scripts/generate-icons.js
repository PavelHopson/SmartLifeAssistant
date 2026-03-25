// Generate SVG icons for the app in all needed sizes
const fs = require("fs");
const path = require("path");

const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#18181b"/>
  <text x="50%" y="55%" font-family="system-ui,sans-serif" font-size="${size * 0.4}" font-weight="700" fill="#2563eb" text-anchor="middle" dominant-baseline="middle">SL</text>
</svg>`;

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

for (const size of [16, 32, 48, 64, 128, 192, 256, 512]) {
  fs.writeFileSync(path.join(outDir, `icon-${size}.svg`), svg(size));
  console.log(`Created icon-${size}.svg`);
}

console.log("\nFor Windows installer: convert icon-256.svg to icon.ico");
