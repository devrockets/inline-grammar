import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const sizes = [16, 32, 48, 96, 128];
const outputDir = resolve('public/icon');
const sourcePath = resolve('assets/icon-source.svg');

const palette = {
  transparent: [0, 0, 0, 0],
  background: [24, 24, 27, 255],
  backgroundEdge: [39, 39, 42, 255],
  paper: [244, 244, 245, 255],
  mutedText: [161, 161, 170, 255],
  accent: [14, 165, 233, 255],
  correction: [244, 114, 182, 255],
};

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);

  length.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const rawRow = y * (width * 4 + 1);
    raw[rawRow] = 0;

    for (let x = 0; x < width; x += 1) {
      const source = (y * width + x) * 4;
      const target = rawRow + 1 + x * 4;
      raw[target] = rgba[source];
      raw[target + 1] = rgba[source + 1];
      raw[target + 2] = rgba[source + 2];
      raw[target + 3] = rgba[source + 3];
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function setPixel(buffer, size, x, y, color) {
  if (x < 0 || x >= size || y < 0 || y >= size) return;

  const offset = (y * size + x) * 4;
  buffer[offset] = color[0];
  buffer[offset + 1] = color[1];
  buffer[offset + 2] = color[2];
  buffer[offset + 3] = color[3];
}

function fillRect(buffer, size, rect, color) {
  const left = Math.floor((rect.x / 128) * size);
  const top = Math.floor((rect.y / 128) * size);
  const right = Math.ceil(((rect.x + rect.width) / 128) * size);
  const bottom = Math.ceil(((rect.y + rect.height) / 128) * size);

  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      setPixel(buffer, size, x, y, color);
    }
  }
}

function insideRoundedRect(px, py, rect, radius) {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const dx = Math.abs(px - centerX) - rect.width / 2 + radius;
  const dy = Math.abs(py - centerY) - rect.height / 2 + radius;
  const outsideX = Math.max(dx, 0);
  const outsideY = Math.max(dy, 0);
  const insideDistance = Math.min(Math.max(dx, dy), 0);

  return insideDistance + Math.hypot(outsideX, outsideY) <= radius;
}

function fillRoundedRect(buffer, size, rect, radius, color) {
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = ((x + 0.5) / size) * 128;
      const py = ((y + 0.5) / size) * 128;

      if (insideRoundedRect(px, py, rect, radius)) {
        setPixel(buffer, size, x, y, color);
      }
    }
  }
}

function drawIcon(size) {
  const buffer = Buffer.alloc(size * size * 4);

  for (let index = 0; index < buffer.length; index += 4) {
    buffer[index] = palette.transparent[0];
    buffer[index + 1] = palette.transparent[1];
    buffer[index + 2] = palette.transparent[2];
    buffer[index + 3] = palette.transparent[3];
  }

  fillRoundedRect(buffer, size, { x: 8, y: 8, width: 112, height: 112 }, 26, palette.background);
  fillRoundedRect(
    buffer,
    size,
    { x: 18, y: 18, width: 92, height: 92 },
    16,
    palette.backgroundEdge,
  );
  fillRoundedRect(buffer, size, { x: 30, y: 26, width: 68, height: 76 }, 10, palette.paper);

  fillRect(buffer, size, { x: 40, y: 42, width: 38, height: 7 }, palette.mutedText);
  fillRect(buffer, size, { x: 40, y: 58, width: 28, height: 7 }, palette.mutedText);
  fillRect(buffer, size, { x: 40, y: 74, width: 36, height: 7 }, palette.mutedText);

  fillRoundedRect(buffer, size, { x: 78, y: 38, width: 18, height: 18 }, 9, palette.accent);
  fillRect(buffer, size, { x: 85, y: 43, width: 4, height: 26 }, palette.accent);

  fillRect(buffer, size, { x: 40, y: 86, width: 30, height: 5 }, palette.correction);
  fillRect(buffer, size, { x: 68, y: 82, width: 6, height: 5 }, palette.correction);
  fillRect(buffer, size, { x: 74, y: 78, width: 6, height: 5 }, palette.correction);

  return buffer;
}

mkdirSync(outputDir, { recursive: true });
mkdirSync(dirname(sourcePath), { recursive: true });

for (const size of sizes) {
  const target = resolve(outputDir, `${size}.png`);
  writeFileSync(target, png(size, size, drawIcon(size)));
  console.log(`Generated ${target}`);
}

writeFileSync(
  sourcePath,
  `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-labelledby="title">
  <title id="title">Inline Grammar icon</title>
  <rect x="8" y="8" width="112" height="112" rx="26" fill="#18181b"/>
  <rect x="18" y="18" width="92" height="92" rx="16" fill="#27272a"/>
  <rect x="30" y="26" width="68" height="76" rx="10" fill="#f4f4f5"/>
  <rect x="40" y="42" width="38" height="7" fill="#a1a1aa"/>
  <rect x="40" y="58" width="28" height="7" fill="#a1a1aa"/>
  <rect x="40" y="74" width="36" height="7" fill="#a1a1aa"/>
  <circle cx="87" cy="47" r="9" fill="#0ea5e9"/>
  <rect x="85" y="43" width="4" height="26" fill="#0ea5e9"/>
  <rect x="40" y="86" width="30" height="5" fill="#f472b6"/>
  <rect x="68" y="82" width="6" height="5" fill="#f472b6"/>
  <rect x="74" y="78" width="6" height="5" fill="#f472b6"/>
</svg>
`,
);
