// Generate a proper .ico file for Windows from raw pixel data
// ICO format: header + directory entries + BMP image data
const fs = require("fs");
const path = require("path");

const SIZE = 32;
const outPath = path.join(__dirname, "..", "public", "icons", "icon-256.ico");

// Generate simple 32x32 icon with "SL" text concept
// Dark background (#18181b) with blue accent (#2563eb)
function generateIco() {
  const pixels = new Uint8Array(SIZE * SIZE * 4);

  const bg = [0x18, 0x18, 0x1b, 0xff];
  const accent = [0x25, 0x63, 0xeb, 0xff];
  const white = [0xfa, 0xfa, 0xfa, 0xff];

  // Fill background with rounded corners
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const idx = (y * SIZE + x) * 4;
      const cornerRadius = 6;

      // Rounded corner check
      let inRect = true;
      if (x < cornerRadius && y < cornerRadius) {
        inRect = Math.sqrt((cornerRadius - x) ** 2 + (cornerRadius - y) ** 2) <= cornerRadius;
      } else if (x >= SIZE - cornerRadius && y < cornerRadius) {
        inRect = Math.sqrt((x - (SIZE - cornerRadius - 1)) ** 2 + (cornerRadius - y) ** 2) <= cornerRadius;
      } else if (x < cornerRadius && y >= SIZE - cornerRadius) {
        inRect = Math.sqrt((cornerRadius - x) ** 2 + (y - (SIZE - cornerRadius - 1)) ** 2) <= cornerRadius;
      } else if (x >= SIZE - cornerRadius && y >= SIZE - cornerRadius) {
        inRect = Math.sqrt((x - (SIZE - cornerRadius - 1)) ** 2 + (y - (SIZE - cornerRadius - 1)) ** 2) <= cornerRadius;
      }

      const color = inRect ? bg : [0, 0, 0, 0];
      pixels[idx] = color[0];
      pixels[idx + 1] = color[1];
      pixels[idx + 2] = color[2];
      pixels[idx + 3] = color[3];
    }
  }

  // Draw "S" shape (simplified pixel art)
  const drawPixel = (x, y, color) => {
    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) {
      const idx = (y * SIZE + x) * 4;
      pixels[idx] = color[0]; pixels[idx + 1] = color[1]; pixels[idx + 2] = color[2]; pixels[idx + 3] = color[3];
    }
  };

  // Draw "SL" letters in accent blue, centered
  // S: columns 8-14, rows 9-22
  for (let x = 9; x <= 14; x++) { drawPixel(x, 9, accent); drawPixel(x, 10, accent); } // top
  for (let y = 9; y <= 14; y++) { drawPixel(8, y, accent); drawPixel(9, y, accent); } // left top
  for (let x = 9; x <= 14; x++) { drawPixel(x, 15, accent); drawPixel(x, 16, accent); } // middle
  for (let y = 17; y <= 22; y++) { drawPixel(14, y, accent); drawPixel(15, y, accent); } // right bottom
  for (let x = 8; x <= 14; x++) { drawPixel(x, 22, accent); drawPixel(x, 23, accent); } // bottom

  // L: columns 18-24, rows 9-23
  for (let y = 9; y <= 23; y++) { drawPixel(18, y, white); drawPixel(19, y, white); } // vertical
  for (let x = 18; x <= 24; x++) { drawPixel(x, 22, white); drawPixel(x, 23, white); } // horizontal

  // Create ICO file
  // ICO Header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = ICO
  header.writeUInt16LE(1, 4); // count: 1 image

  // Directory Entry (16 bytes)
  const entry = Buffer.alloc(16);
  entry.writeUInt8(SIZE, 0);  // width
  entry.writeUInt8(SIZE, 1);  // height
  entry.writeUInt8(0, 2);     // color palette
  entry.writeUInt8(0, 3);     // reserved
  entry.writeUInt16LE(1, 4);  // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel

  // BMP Info Header (40 bytes)
  const bmpHeader = Buffer.alloc(40);
  bmpHeader.writeUInt32LE(40, 0);       // header size
  bmpHeader.writeInt32LE(SIZE, 4);      // width
  bmpHeader.writeInt32LE(SIZE * 2, 8);  // height (doubled for ICO format)
  bmpHeader.writeUInt16LE(1, 12);       // planes
  bmpHeader.writeUInt16LE(32, 14);      // bits per pixel
  bmpHeader.writeUInt32LE(0, 16);       // compression
  bmpHeader.writeUInt32LE(SIZE * SIZE * 4, 20); // image size

  // Pixel data (bottom-up BGRA)
  const pixelData = Buffer.alloc(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const srcIdx = ((SIZE - 1 - y) * SIZE + x) * 4; // flip vertically
      const dstIdx = (y * SIZE + x) * 4;
      pixelData[dstIdx] = pixels[srcIdx + 2];     // B
      pixelData[dstIdx + 1] = pixels[srcIdx + 1]; // G
      pixelData[dstIdx + 2] = pixels[srcIdx];     // R
      pixelData[dstIdx + 3] = pixels[srcIdx + 3]; // A
    }
  }

  // AND mask (transparency mask, all zeros since we use alpha)
  const andMask = Buffer.alloc(Math.ceil(SIZE / 8) * SIZE);

  const imageData = Buffer.concat([bmpHeader, pixelData, andMask]);

  // Update directory entry with size and offset
  entry.writeUInt32LE(imageData.length, 8); // data size
  entry.writeUInt32LE(6 + 16, 12);         // data offset

  const ico = Buffer.concat([header, entry, imageData]);
  fs.writeFileSync(outPath, ico);
  console.log(`Created ${outPath} (${ico.length} bytes)`);
}

generateIco();
