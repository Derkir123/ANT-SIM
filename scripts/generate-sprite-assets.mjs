import { promises as fs } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const FRAME_SIZE = 32;
const VIEWS = ['topdown', 'side'];
const PHASES = ['core', 'extended'];

const ROLES = {
  worker: {
    animations: {
      idle: { frames: 4, fps: 4, loop: true },
      walk: { frames: 6, fps: 8, loop: true },
      dig: { frames: 4, fps: 6, loop: true },
      die: { frames: 6, fps: 8, loop: false },
    },
  },
  soldier: {
    animations: {
      idle: { frames: 4, fps: 4, loop: true },
      walk: { frames: 6, fps: 8, loop: true },
      attack: { frames: 4, fps: 10, loop: false },
      die: { frames: 6, fps: 8, loop: false },
    },
  },
  scout: {
    animations: {
      idle: { frames: 3, fps: 4, loop: true },
      walk: { frames: 6, fps: 10, loop: true },
      search: { frames: 4, fps: 6, loop: true },
      die: { frames: 6, fps: 8, loop: false },
    },
  },
  nurse: {
    animations: {
      idle: { frames: 4, fps: 3, loop: true },
      walk: { frames: 6, fps: 6, loop: true },
      feed: { frames: 4, fps: 6, loop: true },
      die: { frames: 6, fps: 8, loop: false },
    },
  },
  builder: {
    animations: {
      idle: { frames: 3, fps: 4, loop: true },
      walk: { frames: 6, fps: 6, loop: true },
      dig: { frames: 6, fps: 8, loop: true },
      carry: { frames: 4, fps: 6, loop: true },
      die: { frames: 6, fps: 8, loop: false },
    },
  },
  queen: {
    animations: {
      idle: { frames: 4, fps: 3, loop: true },
      walk: { frames: 6, fps: 4, loop: true },
      layEgg: { frames: 8, fps: 6, loop: false },
      die: { frames: 8, fps: 6, loop: false },
    },
  },
  guard: {
    animations: {
      idle: { frames: 4, fps: 4, loop: true },
      attack: { frames: 4, fps: 12, loop: false },
      die: { frames: 6, fps: 8, loop: false },
    },
  },
  drone: {
    animations: {
      idle: { frames: 3, fps: 4, loop: true },
      fly: { frames: 4, fps: 8, loop: true },
      die: { frames: 4, fps: 6, loop: false },
    },
  },
  alate: {
    animations: {
      idle: { frames: 3, fps: 4, loop: true },
      walk: { frames: 4, fps: 6, loop: true },
      fly: { frames: 4, fps: 8, loop: true },
      die: { frames: 4, fps: 6, loop: false },
    },
  },
};

const ROLE_PALETTES = {
  worker: { dark: [44, 28, 18, 255], base: [73, 50, 29, 255], light: [106, 74, 46, 255], detail: [21, 13, 8, 255], accent: [180, 133, 92, 255] },
  soldier: { dark: [30, 18, 12, 255], base: [54, 33, 19, 255], light: [86, 52, 31, 255], detail: [15, 9, 6, 255], accent: [164, 110, 74, 255] },
  scout: { dark: [50, 34, 20, 255], base: [95, 68, 41, 255], light: [130, 95, 61, 255], detail: [26, 16, 9, 255], accent: [193, 146, 96, 255] },
  nurse: { dark: [56, 39, 26, 255], base: [90, 67, 47, 255], light: [127, 98, 73, 255], detail: [30, 21, 13, 255], accent: [185, 144, 110, 255] },
  builder: { dark: [45, 30, 19, 255], base: [78, 54, 34, 255], light: [115, 86, 58, 255], detail: [23, 15, 10, 255], accent: [172, 126, 87, 255] },
  queen: { dark: [21, 13, 8, 255], base: [49, 30, 20, 255], light: [94, 59, 41, 255], detail: [12, 7, 5, 255], accent: [209, 160, 94, 255] },
  guard: { dark: [27, 16, 10, 255], base: [55, 35, 22, 255], light: [92, 63, 42, 255], detail: [14, 9, 7, 255], accent: [186, 130, 79, 255] },
  drone: { dark: [38, 24, 16, 255], base: [76, 50, 33, 255], light: [118, 80, 57, 255], detail: [19, 12, 9, 255], accent: [160, 114, 86, 200] },
  alate: { dark: [47, 29, 17, 255], base: [84, 55, 35, 255], light: [128, 86, 58, 255], detail: [25, 15, 9, 255], accent: [170, 122, 93, 200] },
};

const EXTENDED_PRIORITY = ['dig', 'die', 'layEgg', 'search', 'feed', 'carry', 'attack', 'fly', 'walk'];

function getCoreAnimations(role, allAnimations) {
  const core = ['idle'];

  if (role === 'drone') {
    if (allAnimations.fly) core.push('fly');
  } else if (role === 'guard') {
    if (allAnimations.attack) core.push('attack');
  } else if (allAnimations.walk) {
    core.push('walk');
  } else if (allAnimations.fly) {
    core.push('fly');
  }

  return core;
}

function getExtendedAnimations(core, allAnimations) {
  const coreSet = new Set(core);
  return EXTENDED_PRIORITY.filter((name) => allAnimations[name] && !coreSet.has(name));
}

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
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  crcBuffer.writeUInt32BE(crc, 0);

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
    const rawOffset = y * (stride + 1);
    raw[rawOffset] = 0;
    const srcStart = y * stride;
    rgba.copy(raw, rawOffset + 1, srcStart, srcStart + stride);
  }

  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function createCanvas(width, height) {
  return Buffer.alloc(width * height * 4, 0);
}

function setPixel(buf, width, height, x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const idx = (y * width + x) * 4;
  buf[idx] = color[0];
  buf[idx + 1] = color[1];
  buf[idx + 2] = color[2];
  buf[idx + 3] = color[3];
}

function drawRect(buf, width, height, x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      setPixel(buf, width, height, xx, yy, color);
    }
  }
}

function drawEllipse(buf, width, height, cx, cy, rx, ry, color) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if ((dx * dx) + (dy * dy) <= 1) {
        setPixel(buf, width, height, x, y, color);
      }
    }
  }
}

function drawLine(buf, width, height, x0, y0, x1, y1, color) {
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    setPixel(buf, width, height, x, y, color);
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

function drawWing(buf, width, height, x, y, w, h, color) {
  for (let yy = 0; yy < h; yy += 1) {
    for (let xx = 0; xx < w; xx += 1) {
      const nx = xx / Math.max(w - 1, 1);
      const ny = yy / Math.max(h - 1, 1);
      if (ny <= (1 - Math.abs(nx - 0.5) * 1.6)) {
        setPixel(buf, width, height, x + xx, y + yy, color);
      }
    }
  }
}

function applyAnimationState(anim, frame, frames) {
  const cycle = Math.sin((frame / Math.max(frames, 1)) * Math.PI * 2);
  const wave = Math.cos((frame / Math.max(frames, 1)) * Math.PI * 2);

  const state = {
    bob: 0,
    sway: 0,
    legSwing: 0,
    headTilt: 0,
    wingFlap: 0,
    collapse: 0,
    actionPulse: 0,
  };

  switch (anim) {
    case 'walk':
      state.bob = Math.round(cycle * 1);
      state.sway = Math.round(wave * 1);
      state.legSwing = cycle;
      break;
    case 'fly':
      state.bob = Math.round(cycle * 1);
      state.sway = Math.round(wave * 1);
      state.wingFlap = cycle;
      break;
    case 'attack':
      state.sway = Math.round(cycle * 2);
      state.actionPulse = Math.max(0, cycle);
      state.headTilt = Math.round(cycle * 2);
      break;
    case 'dig':
      state.bob = Math.round(cycle * 1);
      state.actionPulse = Math.max(0, cycle);
      state.legSwing = cycle;
      break;
    case 'search':
      state.headTilt = Math.round(cycle * 2);
      state.sway = Math.round(wave * 1);
      break;
    case 'feed':
      state.bob = Math.round(cycle * 1);
      state.actionPulse = Math.max(0, wave);
      break;
    case 'carry':
      state.bob = Math.round(cycle * 1);
      state.sway = Math.round(wave * 1);
      break;
    case 'layEgg':
      state.bob = Math.round(cycle * 1);
      state.actionPulse = frame / Math.max(frames - 1, 1);
      break;
    case 'die':
      state.collapse = frame / Math.max(frames - 1, 1);
      state.bob = Math.round((1 - state.collapse) * cycle);
      state.sway = Math.round(state.collapse * 4);
      break;
    default:
      state.bob = Math.round(cycle * 0.5);
      state.sway = Math.round(wave * 0.5);
      state.legSwing = cycle * 0.5;
      break;
  }

  return state;
}

function drawAntTopdown(buf, sheetW, sheetH, role, palette, anim, frame, frames, xOff, yOff) {
  const state = applyAnimationState(anim, frame, frames);

  const queenScale = role === 'queen' ? 1.3 : 1;
  const heavyScale = (role === 'soldier' || role === 'guard') ? 1.1 : 1;
  const scale = queenScale * heavyScale;

  const cx = xOff + 16 + state.sway;
  const cy = yOff + 16 + state.bob + Math.round(state.collapse * 4);

  const abdomenRy = Math.round(7 * scale);
  const abdomenRx = Math.round(6 * scale);
  const thoraxRy = Math.round(4 * scale);
  const thoraxRx = Math.round(4 * scale);
  const headR = Math.round(4 * scale);

  const collapse = state.collapse;

  drawEllipse(buf, sheetW, sheetH, cx, cy + 6 - Math.round(collapse * 2), abdomenRx + (anim === 'carry' ? 1 : 0), Math.max(2, abdomenRy - Math.round(collapse * 3)), palette.dark);
  drawEllipse(buf, sheetW, sheetH, cx, cy + 4 - Math.round(collapse * 2), Math.max(2, abdomenRx - 1), Math.max(2, abdomenRy - 2), palette.base);
  drawEllipse(buf, sheetW, sheetH, cx, cy, thoraxRx, Math.max(2, thoraxRy - Math.round(collapse * 1.5)), palette.base);
  drawEllipse(buf, sheetW, sheetH, cx, cy - 6 + state.headTilt - Math.round(collapse * 1.5), Math.max(2, headR - 1), Math.max(2, headR - 1), palette.light);

  if (role === 'soldier' || role === 'guard') {
    drawRect(buf, sheetW, sheetH, cx - 8, cy - 8 + state.headTilt, 2, 2, palette.detail);
    drawRect(buf, sheetW, sheetH, cx + 6, cy - 8 + state.headTilt, 2, 2, palette.detail);
  }

  const legBaseY = cy - 1 + Math.round(collapse * 2);
  const legOffsets = [-4, 0, 4];
  for (const offset of legOffsets) {
    const swing = Math.round(Math.sin((frame + offset) * 0.9) * (2 + Math.abs(state.legSwing)) * (1 - collapse));
    drawLine(buf, sheetW, sheetH, cx - 2, legBaseY + offset, cx - 8 - swing, legBaseY + offset + 2, palette.detail);
    drawLine(buf, sheetW, sheetH, cx + 2, legBaseY + offset, cx + 8 + swing, legBaseY + offset + 2, palette.detail);
  }

  drawLine(buf, sheetW, sheetH, cx - 2, cy - 10 + state.headTilt, cx - 6 - Math.round(state.headTilt * 0.4), cy - 14, palette.detail);
  drawLine(buf, sheetW, sheetH, cx + 2, cy - 10 + state.headTilt, cx + 6 + Math.round(state.headTilt * 0.4), cy - 14, palette.detail);

  if (role === 'drone' || role === 'alate' || anim === 'fly') {
    const flap = Math.round(state.wingFlap * 2);
    drawWing(buf, sheetW, sheetH, cx - 10, cy - 8 - flap, 7, 8, palette.accent);
    drawWing(buf, sheetW, sheetH, cx + 3, cy - 8 + flap, 7, 8, palette.accent);
  }

  if (anim === 'carry') {
    drawRect(buf, sheetW, sheetH, cx + 7, cy - 10, 4, 4, [164, 124, 69, 255]);
  }

  if (anim === 'feed') {
    drawEllipse(buf, sheetW, sheetH, cx + 8, cy - 9, 2, 2, [112, 189, 226, 255]);
  }

  if (anim === 'dig') {
    drawRect(buf, sheetW, sheetH, cx - 10, cy + 9, 4, 3, [96, 69, 43, 255]);
  }

  if (anim === 'layEgg') {
    const eggShift = Math.round(state.actionPulse * 6);
    drawEllipse(buf, sheetW, sheetH, cx - 5 + eggShift, cy + 10, 3, 2, [236, 227, 199, 255]);
  }
}

function drawAntSide(buf, sheetW, sheetH, role, palette, anim, frame, frames, xOff, yOff) {
  const state = applyAnimationState(anim, frame, frames);
  const queenScale = role === 'queen' ? 1.25 : 1;
  const heavyScale = (role === 'soldier' || role === 'guard') ? 1.1 : 1;
  const scale = queenScale * heavyScale;

  const cx = xOff + 15 + state.sway;
  const cy = yOff + 18 + state.bob + Math.round(state.collapse * 4);
  const collapse = state.collapse;

  drawEllipse(buf, sheetW, sheetH, cx + 6, cy + 1 - Math.round(collapse * 1), Math.round(7 * scale), Math.max(2, Math.round(5 * scale) - Math.round(collapse * 2)), palette.dark);
  drawEllipse(buf, sheetW, sheetH, cx + 6, cy, Math.max(2, Math.round(6 * scale)), Math.max(2, Math.round(4 * scale) - Math.round(collapse * 1.5)), palette.base);
  drawEllipse(buf, sheetW, sheetH, cx, cy, Math.round(5 * scale), Math.max(2, Math.round(3 * scale) - Math.round(collapse * 1)), palette.base);
  drawEllipse(buf, sheetW, sheetH, cx - 6, cy - 1 + state.headTilt, Math.round(4 * scale), Math.round(3 * scale), palette.light);

  const legY = cy + 3 + Math.round(collapse * 2);
  for (let i = 0; i < 3; i += 1) {
    const segmentX = cx - 2 + i * 4;
    const kick = Math.round(Math.sin((frame + i * 2) * 0.9) * 2 * (1 - collapse));
    drawLine(buf, sheetW, sheetH, segmentX, legY, segmentX - 3, legY + 5 + kick, palette.detail);
    drawLine(buf, sheetW, sheetH, segmentX + 1, legY, segmentX + 4, legY + 5 - kick, palette.detail);
  }

  drawLine(buf, sheetW, sheetH, cx - 9, cy - 4 + state.headTilt, cx - 13, cy - 7 + state.headTilt, palette.detail);
  drawLine(buf, sheetW, sheetH, cx - 8, cy - 3 + state.headTilt, cx - 12, cy - 2 + state.headTilt, palette.detail);

  if (role === 'soldier' || role === 'guard' || anim === 'attack') {
    drawRect(buf, sheetW, sheetH, cx - 13 - Math.round(state.actionPulse * 2), cy - 3, 2, 2, palette.detail);
    drawRect(buf, sheetW, sheetH, cx - 12 - Math.round(state.actionPulse * 2), cy + 1, 2, 2, palette.detail);
  }

  if (role === 'drone' || role === 'alate' || anim === 'fly') {
    const flap = Math.round(state.wingFlap * 2);
    drawWing(buf, sheetW, sheetH, cx - 1, cy - 10 - flap, 8, 6, palette.accent);
    drawWing(buf, sheetW, sheetH, cx + 3, cy - 8 + flap, 8, 6, palette.accent);
  }

  if (anim === 'carry') {
    drawRect(buf, sheetW, sheetH, cx + 11, cy - 6, 4, 4, [164, 124, 69, 255]);
  }

  if (anim === 'feed') {
    drawEllipse(buf, sheetW, sheetH, cx + 11, cy - 6, 2, 2, [112, 189, 226, 255]);
  }

  if (anim === 'search') {
    drawEllipse(buf, sheetW, sheetH, cx - 14, cy - 8, 2, 2, [224, 197, 118, 255]);
  }

  if (anim === 'dig') {
    drawRect(buf, sheetW, sheetH, cx + 12, cy + 5, 4, 3, [96, 69, 43, 255]);
  }

  if (anim === 'layEgg') {
    const eggShift = Math.round(state.actionPulse * 7);
    drawEllipse(buf, sheetW, sheetH, cx + 11 + eggShift, cy + 5, 3, 2, [236, 227, 199, 255]);
  }
}

function drawFrame(buf, sheetW, sheetH, role, view, anim, frame, frames, row) {
  const xOff = frame * FRAME_SIZE;
  const yOff = row * FRAME_SIZE;
  const palette = ROLE_PALETTES[role] || ROLE_PALETTES.worker;

  if (view === 'topdown') {
    drawAntTopdown(buf, sheetW, sheetH, role, palette, anim, frame, frames, xOff, yOff);
  } else {
    drawAntSide(buf, sheetW, sheetH, role, palette, anim, frame, frames, xOff, yOff);
  }
}

async function generateRoleView(role, view, phase, animationNames) {
  const roleConfig = ROLES[role];
  const animations = roleConfig.animations;
  const metadataAnimations = {};

  if (animationNames.length === 0) {
    return null;
  }

  const maxFrames = Math.max(...animationNames.map((name) => animations[name].frames));
  const width = maxFrames * FRAME_SIZE;
  const height = animationNames.length * FRAME_SIZE;
  const canvas = createCanvas(width, height);

  animationNames.forEach((animName, row) => {
    const anim = animations[animName];
    metadataAnimations[animName] = {
      row,
      frames: anim.frames,
      fps: anim.fps,
      loop: anim.loop,
    };

    for (let frame = 0; frame < anim.frames; frame += 1) {
      drawFrame(canvas, width, height, role, view, animName, frame, anim.frames, row);
    }
  });

  const outputDir = path.resolve('src/assets/sprites/ants', view);
  await fs.mkdir(outputDir, { recursive: true });

  const pngPath = path.join(outputDir, `${role}-${phase}.png`);
  const jsonPath = path.join(outputDir, `${role}-${phase}.json`);

  await fs.writeFile(pngPath, encodePng(width, height, canvas));

  const metadata = {
    frameWidth: FRAME_SIZE,
    frameHeight: FRAME_SIZE,
    view,
    role,
    animations: metadataAnimations,
  };

  await fs.writeFile(jsonPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');

  return { pngPath, jsonPath, animationCount: animationNames.length };
}

async function run() {
  const generated = [];

  for (const role of Object.keys(ROLES)) {
    const allAnimations = ROLES[role].animations;
    const coreAnimations = getCoreAnimations(role, allAnimations);
    const extendedAnimations = getExtendedAnimations(coreAnimations, allAnimations);

    for (const view of VIEWS) {
      for (const phase of PHASES) {
        const animationNames = phase === 'core' ? coreAnimations : extendedAnimations;
        const result = await generateRoleView(role, view, phase, animationNames);
        if (result) generated.push(result);
      }
    }
  }

  console.log(`Generated ${generated.length} sprite sheets.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
