// 生成 PWA PNG 图标（无第三方依赖，手工 PNG 编码 + zlib deflate）
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(size, pixelFn) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y, size);
      raw[o++] = r; raw[o++] = g; raw[o++] = b; raw[o++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// ---- 形状判定 ----
const inShield = (x, y, s) => {
  // 归一化到中心坐标系
  const u = (x - s / 2) / (s / 2), v = (y - s / 2) / (s / 2);
  // 盾形：上半圆 + 下尖
  const cy = 0.05;
  if (v < cy) return u * u + (v - cy) * (v - cy) <= 0.62 * 0.62;
  // 下半：宽度随 v 线性收窄到底部尖点
  const half = 0.62 * (1 - (v - cy) / (0.95 - cy));
  return Math.abs(u) <= half && v <= 0.95;
};
const segDist = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
};
const inCheck = (x, y, s) => {
  const u = x / s, v = y / s; // 0..1
  const d1 = segDist(u, v, 0.30, 0.56, 0.46, 0.72);
  const d2 = segDist(u, v, 0.46, 0.72, 0.74, 0.38);
  return Math.min(d1, d2) <= 0.055;
};

function icon(maskable) {
  const s = 512;
  const inset = maskable ? 0.22 : 0.06; // maskable 安全区
  const cx = 0.5, cy = 0.5;
  return encodePNG(s, (x, y) => {
    const u = x / s, v = y / s;
    // 背景
    const dx = u - cx, dy = v - cy;
    const dist = Math.hypot(dx, dy);
    const edge = maskable ? 0.5 : 0.5;
    if (dist > edge) return [0, 0, 0, 0];
    const bg = Math.floor(8 + 20 * (1 - dist / edge)); // 径向渐变深蓝
    // 底光圈
    let glow = 0;
    const shieldDist = Math.min(
      ...Array.from({ length: 64 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2;
        return Math.hypot(u - (cx + 0.24 * Math.cos(a)), v - (cy + 0.24 * Math.sin(a)));
      })
    );
    if (maskable) glow = 0;
    let r = bg, g = bg + 12, b = bg + 26;
    const sc = s * (maskable ? 0.72 : 0.78);
    if (inShield(x, y, sc)) {
      // 盾体：青色，边缘描边
      const steps = 48;
      let minD = 1e9;
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const px = cx + 0.26 * Math.cos(a), py = cy + 0.26 * Math.sin(a);
        if (!inShield(Math.round(px * s), Math.round(py * s), sc)) continue;
        minD = Math.min(minD, Math.hypot(u - px, v - py));
      }
      if (minD < 0.035) return [4, 10, 16, 255]; // 深色边缘
      if (inCheck(x, y, sc)) return [0, 255, 157, 255];
      return [0, 229, 255, 255];
    }
    return [r, g, b, 255];
  });
}

const outDir = path.join(__dirname, 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
fs.writeFileSync(path.join(outDir, 'icon-192.png'), icon(false));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), icon(false));
fs.writeFileSync(path.join(outDir, 'icon-maskable-512.png'), icon(true));
console.log('icons generated ✓');
