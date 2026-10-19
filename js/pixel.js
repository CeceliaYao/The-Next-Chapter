/* =========================================================
   pixel.js: the tiny pixel-art engine behind the game.
   Everything is drawn into crisp pixel buffers (no blur,
   no anti-aliasing) and then scaled up by whole numbers.
   1 art pixel = 4 screen pixels in the 1280 x 720 world.
   Only the room and its things are pixel art; the words
   and windows around it use normal fonts and CSS.
   ========================================================= */
'use strict';

const ART = 4;
const ART_W = 320, ART_H = 180;

/* One shared Y2K pastel palette. Single letters are used in the pixel grids. */
const PALETTE = {
  o: '#3d2c4a', // outline / ink: a soft plum, like the pastel pixel-room reference (softer than black)
  w: '#ffffff', c: '#fff4e6', g: '#e4def4', G: '#b4abd4', D: '#7d73a8',
  p: '#ffd0ea', P: '#ff9fd6', h: '#ff5fb4', m: '#c93a88',
  l: '#e6d8ff', L: '#c3a6ff', v: '#9a72f0', V: '#6a48c4',
  b: '#d2f0ff', B: '#8fcfff', n: '#5a86e6', N: '#3a4fae',
  a: '#b5fff4', A: '#5fe0d0', T: '#2fa8a0',
  e: '#c8f7cf', E: '#6fd88a', F: '#3a9a62',
  y: '#fff6b8', Y: '#ffd95a', k: '#f3a93a', K: '#c47a2c',
  t: '#f7d6a8', u: '#dc9c5c', U: '#a8663a',
  r: '#ecbc84', R: '#c98a52', Q: '#8e5634',
  s: '#ffdcc4', S: '#f2ad94', x: '#ff6478', X: '#c4304e', z: '#241733',
  // the team's brand colours (from the logo)
  '1': '#00b5ff', '2': '#ff5400', '3': '#ff84e4', '4': '#ffc700', '5': '#8de328', '6': '#f6e680'
};

const _rgba = {};
function toRGBA(c) {
  if (_rgba[c]) return _rgba[c];
  let hex = c.length === 1 ? PALETTE[c] : c;
  if (!hex) hex = '#ff00ff';
  const n = parseInt(hex.slice(1, 7), 16);
  const a = hex.length > 7 ? parseInt(hex.slice(7, 9), 16) : 255;
  return (_rgba[c] = [n >> 16 & 255, n >> 8 & 255, n & 255, a]);
}

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

class PixBuf {
  constructor(w, h, pad) {
    this.pad = pad || 0;
    this.w = w; this.h = h;
    this.W = w + this.pad * 2; this.H = h + this.pad * 2;
    this.d = new Array(this.W * this.H).fill(null);
  }
  idx(x, y) { x = Math.floor(x) + this.pad; y = Math.floor(y) + this.pad; return (x < 0 || y < 0 || x >= this.W || y >= this.H) ? -1 : y * this.W + x; }
  px(x, y, c) { const i = this.idx(x, y); if (i >= 0) this.d[i] = (c === '.' || c == null) ? null : c; }
  get(x, y) { const i = this.idx(x, y); return i < 0 ? null : this.d[i]; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
  box(x, y, w, h, fill, ol) { this.rect(x, y, w, h, ol || 'o'); if (w > 2 && h > 2) this.rect(x + 1, y + 1, w - 2, h - 2, fill); }
  hline(x, y, w, c) { this.rect(x, y, w, 1, c); }
  vline(x, y, h, c) { this.rect(x, y, 1, h, c); }
  ell(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1.0001) this.px(x, y, c);
      }
  }
  ring(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++)
      for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
        const inside = (px, py) => { const dx = (px + 0.5 - cx) / rx, dy = (py + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1.0001; };
        if (inside(x, y) && (!inside(x + 1, y) || !inside(x - 1, y) || !inside(x, y + 1) || !inside(x, y - 1))) this.px(x, y, c);
      }
  }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  poly(pts, c) {
    const ys = pts.map(p => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const cy = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= cy && by > cy) || (by <= cy && ay > cy)) xs.push(ax + (cy - ay) / (by - ay) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) this.px(x, y, c);
    }
  }
  grid(x, y, rows) {
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') this.px(x + i, y + j, row[i]); });
  }
  /* ordered dither: level 0..16 of colour c over the area (pattern locked to the canvas) */
  dither(x, y, w, h, c, level) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const X = Math.floor(x + i), Y = Math.floor(y + j);
      if (BAYER4[(Y & 3) * 4 + (X & 3)] < level) this.px(X, Y, c);
    }
  }
  /* add a 1px outline around every filled pixel that isn't already outline-coloured */
  outline(ol) {
    ol = ol || 'o';
    const W = this.W, H = this.H, src = this.d.slice(), out = [];
    const solid = i => src[i] && src[i] !== ol;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (src[i]) continue;
      if ((x > 0 && solid(i - 1)) || (x < W - 1 && solid(i + 1)) || (y > 0 && solid(i - W)) || (y < H - 1 && solid(i + W))) out.push(i);
    }
    out.forEach(i => { this.d[i] = ol; });
    return this;
  }
  /* a ring of colour c around everything (used for the hover glow) */
  halo(c) {
    const W = this.W, H = this.H, src = this.d.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (src[i]) continue;
      if ((x > 0 && src[i - 1]) || (x < W - 1 && src[i + 1]) || (y > 0 && src[i - W]) || (y < H - 1 && src[i + W])) this.d[i] = c;
    }
    return this;
  }
  clone() { const b = new PixBuf(this.w, this.h, this.pad); b.d = this.d.slice(); return b; }
  map(fn) { const b = this.clone(); b.d = b.d.map((c, i) => c && fn(c, i % b.W, Math.floor(i / b.W))); return b; }
  toCanvas(scale) {
    scale = scale || 1;
    const cv = document.createElement('canvas');
    cv.width = this.W * scale; cv.height = this.H * scale;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(this.W, this.H);
    this.d.forEach((c, i) => { if (!c) return; const v = toRGBA(c); img.data.set(v, i * 4); });
    if (scale === 1) { ctx.putImageData(img, 0, 0); return cv; }
    const tmp = document.createElement('canvas'); tmp.width = this.W; tmp.height = this.H;
    tmp.getContext('2d').putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, 0, 0, cv.width, cv.height);
    return cv;
  }
}

/* ---------- the little heart drawn over carried things ---------- */
const ICONS = {
  heart: ['.hh.hh.', 'hwhhhhh', 'hhhhhhh', 'hhhhhhh', '.hhhhh.', '..hhh..', '...h...']
};

function iconBuf(name) {
  const b = new PixBuf(ICONS[name][0].length, ICONS[name].length, 1);
  b.grid(0, 0, ICONS[name]);
  b.outline('o');
  return b;
}

/* ---------- 3x5 mini font for tiny in-room labels ---------- */
const MINI = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
  6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '##.'], '!': ['.#.', '.#.', '.#.', '...', '.#.'], "'": ['.#.', '.#.', '...', '...', '...'],
  '.': ['...', '...', '...', '...', '.#.'], ',': ['...', '...', '...', '.#.', '#..'], '-': ['...', '...', '###', '...', '...'],
  '?': ['##.', '..#', '.#.', '...', '.#.'], '/': ['..#', '..#', '.#.', '#..', '#..'], '>': ['#..', '.#.', '..#', '.#.', '#..'],
  '♥': ['#.#', '###', '###', '.#.', '...'], '*': ['...', '#.#', '.#.', '#.#', '...'], ' ': ['...', '...', '...', '...', '...']
};
function miniWidth(str) { return str.length * 4 - 1; }
function miniText(buf, x, y, str, col) {
  [...String(str).toUpperCase()].forEach((ch, k) => {
    const g = MINI[ch] || MINI['?'];
    g.forEach((row, j) => { for (let i = 0; i < 3; i++) if (row[i] === '#') buf.px(x + k * 4 + i, y + j, col); });
  });
}
