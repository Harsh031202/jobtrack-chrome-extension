import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple CRC32 table & function for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crcVal = crc32(typeAndData);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

function createPng(size) {
  // RGBA buffer: size * size * 4
  const rawData = Buffer.alloc(size * (size * 4 + 1)); // 1 filter byte per line
  
  // Design: Dark rounded square with a crisp geometric "J" / checklist track symbol
  // Background: #18191d (deep charcoal slate)
  // Symbol: Crisp white (#ffffff) and subtle indicator dot (#10b981 - status dot)
  
  const bgR = 24, bgG = 25, bgB = 29; // #18191d
  const symR = 255, symG = 255, symB = 255; // White
  const dotR = 16, dotG = 185, dotB = 129; // Emerald #10b981
  const borderR = 45, borderG = 48, borderB = 58;

  const radius = Math.floor(size * 0.22);
  const center = size / 2;

  for (let y = 0; y < size; y++) {
    const lineOffset = y * (size * 4 + 1);
    rawData[lineOffset] = 0; // Filter byte: None

    for (let x = 0; x < size; x++) {
      const pixelOffset = lineOffset + 1 + x * 4;

      // Determine rounded rectangle mask
      const dx = Math.abs(x - (size - 1) / 2);
      const dy = Math.abs(y - (size - 1) / 2);
      const halfW = (size - 2) / 2;
      const cornerDx = Math.max(0, dx - (halfW - radius));
      const cornerDy = Math.max(0, dy - (halfW - radius));
      const distFromCorner = Math.sqrt(cornerDx * cornerDx + cornerDy * cornerDy);

      let alpha = 255;
      if (distFromCorner > radius) {
        // Anti-aliased edge or transparent outside
        const diff = distFromCorner - radius;
        if (diff >= 1) {
          alpha = 0;
        } else {
          alpha = Math.floor(255 * (1 - diff));
        }
      }

      if (alpha === 0) {
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
        continue;
      }

      // Check if border pixel
      const isBorder = (distFromCorner > radius - 1 && distFromCorner <= radius) ||
                       (dx >= halfW - 1 && dy < halfW - radius) ||
                       (dy >= halfW - 1 && dx < halfW - radius);

      let r = bgR, g = bgG, b = bgB;
      if (isBorder && size >= 32) {
        r = borderR; g = borderG; b = borderB;
      }

      // Draw geometric "J" / Job track symbol:
      // Vertical bar on right, curved bottom to left, top tick
      // Plus a clean tracking status dot
      const nx = x / size;
      const ny = y / size;

      // Vertical stem of J: x around 0.55 to 0.70, y from 0.25 to 0.65
      const inStem = (nx >= 0.54 && nx <= 0.70 && ny >= 0.26 && ny <= 0.66);
      
      // Bottom curve of J: ny from 0.56 to 0.74, nx from 0.30 to 0.70
      const inCurve = (ny >= 0.58 && ny <= 0.74 && nx >= 0.32 && nx <= 0.68 && (
        Math.hypot(nx - 0.50, ny - 0.58) <= 0.22 && Math.hypot(nx - 0.50, ny - 0.58) >= 0.08
      ));
      
      // Left upward tip of J: nx from 0.32 to 0.46, ny from 0.50 to 0.66
      const inTip = (nx >= 0.30 && nx <= 0.44 && ny >= 0.48 && ny <= 0.64);

      // Top horizontal crossbar or notch: nx from 0.44 to 0.70, ny from 0.26 to 0.36
      const inTopBar = (nx >= 0.46 && nx <= 0.70 && ny >= 0.26 && ny <= 0.36);

      // Status indicator dot at top-left: center (0.34, 0.32), radius 0.08
      const inDot = Math.hypot(nx - 0.34, ny - 0.32) <= 0.075;

      if (inDot) {
        r = dotR; g = dotG; b = dotB;
      } else if (inStem || inCurve || inTip || inTopBar) {
        r = symR; g = symG; b = symB;
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = alpha;
    }
  }

  // PNG Header
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve(__dirname, '../public/icons');
fs.mkdirSync(outDir, { recursive: true });

const sizes = [16, 32, 48, 128];
for (const size of sizes) {
  const buf = createPng(size);
  const filePath = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, buf);
  console.log(`Generated icon-${size}.png (${buf.length} bytes)`);
}

console.log('All icons generated successfully!');
