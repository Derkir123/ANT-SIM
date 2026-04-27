import { promises as fs } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const WIDTH = 640;
const HEIGHT = 360;
const SURFACE_TOP = 122;

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }

  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function idx(x, y) {
  return (y * WIDTH + x) * 4;
}

const pixels = Buffer.alloc(WIDTH * HEIGHT * 4, 0);

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  const i = idx(x, y);
  pixels[i] = color[0];
  pixels[i + 1] = color[1];
  pixels[i + 2] = color[2];
  pixels[i + 3] = color[3] ?? 255;
}

function rect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      setPixel(xx, yy, color);
    }
  }
}

function ellipse(cx, cy, rx, ry, color) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if ((dx * dx) + (dy * dy) <= 1) setPixel(x, y, color);
    }
  }
}

function line(x0, y0, x1, y1, color) {
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    setPixel(x, y, color);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function drawSky() {
  const skyTop = [92, 160, 210, 255];
  const skyBottom = [190, 218, 234, 255];
  for (let y = 0; y < SURFACE_TOP; y += 1) {
    const t = y / Math.max(1, SURFACE_TOP - 1);
    rect(0, y, WIDTH, 1, [
      Math.round(skyTop[0] + (skyBottom[0] - skyTop[0]) * t),
      Math.round(skyTop[1] + (skyBottom[1] - skyTop[1]) * t),
      Math.round(skyTop[2] + (skyBottom[2] - skyTop[2]) * t),
      255,
    ]);
  }

  ellipse(540, 45, 30, 30, [244, 212, 118, 255]);
  ellipse(540, 45, 22, 22, [255, 233, 164, 255]);

  for (let x = 20; x < WIDTH; x += 72) {
    rect(x, 92 + ((x * 7) % 12), 22, 2, [248, 250, 255, 120]);
  }
}

function drawSurface() {
  for (let x = 0; x < WIDTH; x += 4) {
    const h = ((x * 17) % 11) + 5;
    rect(x, SURFACE_TOP - h, 4, h + 1, [76, 133, 61, 255]);
  }
  rect(0, SURFACE_TOP, WIDTH, 6, [72, 118, 52, 255]);
}

function drawUnderground() {
  const layerColors = [
    [86, 58, 38, 255],
    [107, 72, 47, 255],
    [92, 61, 39, 255],
    [76, 51, 33, 255],
  ];

  for (let y = SURFACE_TOP + 6; y < HEIGHT; y += 1) {
    const layer = Math.floor(((y - SURFACE_TOP) / 40) % layerColors.length);
    rect(0, y, WIDTH, 1, layerColors[layer]);
  }

  for (let y = SURFACE_TOP + 8; y < HEIGHT; y += 4) {
    const offset = (y * 13) % 23;
    for (let x = offset; x < WIDTH; x += 32) {
      rect(x, y, 2, 1, [119, 82, 55, 255]);
    }
  }
}

function drawNestMoundAndAnt() {
  const cx = 116;
  const stepColors = [
    [141, 96, 57, 255],
    [156, 108, 65, 255],
    [176, 123, 76, 255],
    [194, 139, 88, 255],
    [210, 152, 96, 255],
  ];

  ellipse(cx, SURFACE_TOP + 7, 72, 13, [78, 56, 35, 255]);

  for (let i = 0; i < stepColors.length; i += 1) {
    const w = 56 + (i * 26);
    const x = cx - Math.floor(w / 2);
    const y = SURFACE_TOP - 34 + (i * 7);
    rect(x, y, w, 7, stepColors[i]);
    rect(x, y + 6, w, 1, [65, 45, 29, 255]);
  }

  ellipse(cx, SURFACE_TOP - 8, 18, 10, [31, 22, 14, 255]);
  ellipse(cx, SURFACE_TOP - 8, 11, 6, [10, 8, 7, 255]);

  ellipse(cx, SURFACE_TOP - 13, 10, 6, [60, 40, 25, 255]);
  ellipse(cx, SURFACE_TOP - 13, 8, 4, [80, 55, 35, 255]);

  rect(cx - 5, SURFACE_TOP - 15, 3, 3, [245, 238, 218, 255]);
  rect(cx + 2, SURFACE_TOP - 15, 3, 3, [245, 238, 218, 255]);
  setPixel(cx - 4, SURFACE_TOP - 14, [18, 12, 9, 255]);
  setPixel(cx + 3, SURFACE_TOP - 14, [18, 12, 9, 255]);

  line(cx - 5, SURFACE_TOP - 18, cx - 10, SURFACE_TOP - 26, [28, 19, 13, 255]);
  line(cx + 5, SURFACE_TOP - 18, cx + 10, SURFACE_TOP - 26, [28, 19, 13, 255]);
  rect(cx - 10, SURFACE_TOP - 26, 2, 2, [28, 19, 13, 255]);
  rect(cx + 9, SURFACE_TOP - 26, 2, 2, [28, 19, 13, 255]);
}

function drawChambers() {
  const chambers = [
    { x: 110, y: 178, rx: 46, ry: 21 },
    { x: 188, y: 214, rx: 34, ry: 16 },
    { x: 88, y: 248, rx: 26, ry: 13 },
    { x: 158, y: 282, rx: 24, ry: 12 },
    { x: 255, y: 252, rx: 36, ry: 16 },
  ];

  for (const chamber of chambers) {
    ellipse(chamber.x, chamber.y, chamber.rx + 2, chamber.ry + 2, [55, 39, 26, 255]);
    ellipse(chamber.x, chamber.y, chamber.rx, chamber.ry, [68, 49, 32, 255]);
    ellipse(chamber.x, chamber.y - 3, chamber.rx - 5, chamber.ry - 5, [84, 60, 40, 255]);
  }

  line(116, 130, 112, 160, [45, 32, 22, 255]);
  line(112, 160, 110, 178, [45, 32, 22, 255]);
  line(116, 130, 150, 182, [45, 32, 22, 255]);
  line(150, 182, 188, 214, [45, 32, 22, 255]);
  line(110, 178, 98, 224, [45, 32, 22, 255]);
  line(98, 224, 88, 248, [45, 32, 22, 255]);
  line(188, 214, 220, 236, [45, 32, 22, 255]);
  line(220, 236, 255, 252, [45, 32, 22, 255]);
  line(188, 214, 172, 248, [45, 32, 22, 255]);
  line(172, 248, 158, 282, [45, 32, 22, 255]);
}

drawSky();
drawSurface();
drawUnderground();
drawNestMoundAndAnt();
drawChambers();

const outPath = path.resolve('src/assets/backgrounds/menu-colony-bg.png');
await fs.writeFile(outPath, encodePng(WIDTH, HEIGHT, pixels));
console.log(`Wrote ${outPath}`);
