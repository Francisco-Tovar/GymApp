import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Helper: Pure JS minimal uncompressed PNG generator
function createPng(size: number, isMaskable = false): Buffer {
  // We will generate raw RGBA pixels and pack into standard PNG
  const width = size;
  const height = size;
  
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // color type RGBA (6)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Generate RGBA pixels (Dark slate background #0F172A with orange dumbbell graphic)
  // Each scanline begins with a filter byte (0 = None)
  const rawScanlines: Buffer[] = [];
  const cx = width / 2;
  const cy = height / 2;
  const cornerRadius = isMaskable ? 0 : width * 0.22;

  for (let y = 0; y < height; y++) {
    const scanline = Buffer.alloc(1 + width * 4);
    scanline[0] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const idx = 1 + x * 4;

      // Check rounded corner mask if not maskable
      let insideAppBox = true;
      if (!isMaskable) {
        const dx = Math.max(0, Math.abs(x - cx) - (cx - cornerRadius));
        const dy = Math.max(0, Math.abs(y - cy) - (cy - cornerRadius));
        if (dx * dx + dy * dy > cornerRadius * cornerRadius) {
          insideAppBox = false;
        }
      }

      if (!insideAppBox) {
        scanline[idx] = 0;
        scanline[idx + 1] = 0;
        scanline[idx + 2] = 0;
        scanline[idx + 3] = 0;
        continue;
      }

      // Base Background #0F172A to #1E293B gradient
      const gradT = (x + y) / (width + height);
      let r = Math.round(15 + gradT * (30 - 15));
      let g = Math.round(23 + gradT * (41 - 23));
      let b = Math.round(42 + gradT * (59 - 42));
      let a = 255;

      // Rotate coordinates by 45 degrees around center to draw diagonal dumbbell
      const rad = -Math.PI / 4;
      const rx = (x - cx) * Math.cos(rad) - (y - cy) * Math.sin(rad);
      const ry = (x - cx) * Math.sin(rad) + (y - cy) * Math.cos(rad);

      const scale = size / 512;
      const sx = rx / scale;
      const sy = ry / scale;

      // Dumbbell handle (-80 to +80 x, -14 to +14 y)
      if (Math.abs(sx) <= 80 && Math.abs(sy) <= 14) {
        // Bright silver / white bar
        r = 248;
        g = 250;
        b = 252;
      }
      // Left Inner collar (-100 to -80 x, -56 to +56 y)
      else if (sx >= -100 && sx <= -80 && Math.abs(sy) <= 56) {
        r = 249;
        g = 115;
        b = 22; // #f97316
      }
      // Left Heavy plate (-136 to -100 x, -82 to +82 y)
      else if (sx >= -136 && sx <= -100 && Math.abs(sy) <= 82) {
        r = 234;
        g = 88;
        b = 12; // #ea580c
      }
      // Left End cap (-156 to -136 x, -26 to +26 y)
      else if (sx >= -156 && sx <= -136 && Math.abs(sy) <= 26) {
        r = 203;
        g = 213;
        b = 225; // #cbd5e1
      }
      // Right Inner collar (80 to 100 x, -56 to +56 y)
      else if (sx >= 80 && sx <= 100 && Math.abs(sy) <= 56) {
        r = 249;
        g = 115;
        b = 22; // #f97316
      }
      // Right Heavy plate (100 to 136 x, -82 to +82 y)
      else if (sx >= 100 && sx <= 136 && Math.abs(sy) <= 82) {
        r = 234;
        g = 88;
        b = 12; // #ea580c
      }
      // Right End cap (136 to 156 x, -26 to +26 y)
      else if (sx >= 136 && sx <= 156 && Math.abs(sy) <= 26) {
        r = 203;
        g = 213;
        b = 225; // #cbd5e1
      }

      scanline[idx] = r;
      scanline[idx + 1] = g;
      scanline[idx + 2] = b;
      scanline[idx + 3] = a;
    }

    rawScanlines.push(scanline);
  }

  const rawData = Buffer.concat(rawScanlines);
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation for PNG chunks
const crcTable: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Generate PNG files
const publicDir = path.resolve('public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), createPng(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), createPng(512));
fs.writeFileSync(path.join(iconsDir, 'maskable-icon-512x512.png'), createPng(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64));

console.log('Valid PNG raster icons generated successfully for PWA install!');
