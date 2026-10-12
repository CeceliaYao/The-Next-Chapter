/* =========================================================
   pixel.js: the tiny pixel-art engine behind the game.
   Everything is drawn into crisp pixel buffers (no blur,
   no anti-aliasing) and then scaled up by whole numbers.
   1 art pixel = 4 screen pixels in the 1280 x 720 world.
   ========================================================= */
'use strict';

const ART = 4;
const ART_W = 320, ART_H = 180;

/* One shared Y2K pastel palette. Single letters are used in the pixel grids. */
const PALETTE = {
  o: '#2a1f1a', // outline / ink (warm, matches the logo's #221a13)
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

/* ---------- pixel text (thresholded pixel fonts, cached) ---------- */
const _textCache = {};
function pixText(str, col, opts) {
  opts = opts || {};
  const size = opts.size || 8, font = opts.font || 'Silkscreen', weight = opts.weight || 400;
  const key = [str, col, size, font, weight, opts.outline || '', opts.shadow || ''].join('|');
  if (_textCache[key]) return _textCache[key];
  const meas = document.createElement('canvas').getContext('2d');
  meas.font = weight + ' ' + size + 'px "' + font + '"';
  const tw = Math.ceil(meas.measureText(str).width) + 4, th = Math.ceil(size * 1.4) + 4;
  const cv = document.createElement('canvas'); cv.width = tw; cv.height = th;
  const ctx = cv.getContext('2d');
  ctx.font = meas.font; ctx.textBaseline = 'top'; ctx.fillStyle = '#000';
  ctx.fillText(str, 2, 2);
  const data = ctx.getImageData(0, 0, tw, th).data;
  const buf = new PixBuf(tw, th, 2);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) if (data[(y * tw + x) * 4 + 3] >= 120) buf.px(x, y, col);
  if (opts.outline) buf.outline(opts.outline);
  if (opts.shadow) {
    const sh = buf.clone();
    for (let y = buf.H - 1; y >= 0; y--) for (let x = buf.W - 1; x >= 0; x--) {
      const i = y * buf.W + x;
      if (!buf.d[i] && x > 0 && y > 0 && buf.d[(y - 1) * buf.W + x - 1]) sh.d[i] = opts.shadow;
    }
    buf.d = sh.d;
  }
  const out = trimCanvas(buf.toCanvas(1));
  return (_textCache[key] = out);
}

function trimCanvas(cv) {
  const ctx = cv.getContext('2d'), d = ctx.getImageData(0, 0, cv.width, cv.height).data;
  let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return cv;
  const out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext('2d').drawImage(cv, -x0, -y0);
  return out;
}

/* ---------- Y2K pixel logo: chrome-pink bands, ink outline, hard shadow, sparkles ---------- */
function pixLogo(str, opts) {
  opts = opts || {};
  const size = opts.size || 16, font = opts.font || 'Pixelify Sans';
  const bands = opts.bands || ['#ffffff', '#ffe3f4', '#ffb6e1', '#ff7ec8', '#ff5fb4', '#c7a8ff', '#ffe9f7', '#ffffff'];
  const meas = document.createElement('canvas').getContext('2d');
  meas.font = '700 ' + size + 'px "' + font + '"';
  const tw = Math.ceil(meas.measureText(str).width) + 4, th = Math.ceil(size * 1.3) + 4;
  const cv = document.createElement('canvas'); cv.width = tw; cv.height = th;
  const ctx = cv.getContext('2d'); ctx.font = meas.font; ctx.textBaseline = 'top'; ctx.fillText(str, 2, 2);
  const data = ctx.getImageData(0, 0, tw, th).data;
  let top = th, bot = 0;
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) if (data[(y * tw + x) * 4 + 3] >= 120) { top = Math.min(top, y); bot = Math.max(bot, y); }
  const buf = new PixBuf(tw, th, 4);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    if (data[(y * tw + x) * 4 + 3] < 120) continue;
    const k = Math.min(bands.length - 1, Math.floor((y - top) / Math.max(1, bot - top + 1) * bands.length));
    buf.px(x, y, bands[k]);
  }
  buf.outline('o');
  // hard drop shadow 2px down-right
  const shadow = opts.shadow || '#221a13', src = buf.d.slice();   // ink, like the 3D edge on the team logo
  for (let y = buf.H - 1; y >= 0; y--) for (let x = buf.W - 1; x >= 0; x--) {
    const i = y * buf.W + x;
    if (src[i]) continue;
    const a = y > 1 && x > 1 && src[(y - 2) * buf.W + x - 2], b = y > 0 && x > 0 && src[(y - 1) * buf.W + x - 1];
    if (a || b) buf.d[i] = shadow;
  }
  if (opts.sparkles !== false) {
    const st = (x, y) => { buf.px(x, y, 'w'); buf.px(x - 1, y, 'w'); buf.px(x + 1, y, 'w'); buf.px(x, y - 1, 'w'); buf.px(x, y + 1, 'w'); };
    st(tw - 3, 1); st(1, th - 4);
  }
  return trimCanvas(buf.toCanvas(1));
}

/* ---------- small icons (cursor, hearts, sparkles, discs...) ---------- */
const ICONS = {
  cursor: [
    'o...........', 'oo..........', 'owo.........', 'owwo........', 'owwwo.......', 'owwwwo......', 'owwwwwo.....', 'owwwwwwo....',
    'owwwwwwwo...', 'owwwwwwwwo..', 'owwwwwoooo..', 'owwowwo.....', 'owo.owwo....', 'oo..owwo....', 'o....owwo...', '.....oooo...'
  ],
  hand: [
    '....oo......', '...owwo.....', '...owwo.....', '...owwo.....', '...owwooo...', '...owwowwoo.', '.oooww wwowo', 'owwowwwwwwwo',
    'owwwwwwwwwwo', '.owwwwwwwwwo', '.owwwwwwwwo.', '..owwwwwwwo.', '..owwwwwwo..', '...owwwwwo..', '...oooooo...'
  ],
  grab: [
    '............', '............', '....oooooo..', '...owwowwoo.', '..owwowwowwo', '.oowwwwwwwwo', 'owwowwwwwwwo', 'owwwwwwwwwwo',
    '.owwwwwwwwwo', '.owwwwwwwwo.', '..owwwwwwwo.', '..owwwwwwo..', '...owwwwwo..', '...oooooo...'
  ],
  heart: ['.hh.hh.', 'hwhhhhh', 'hhhhhhh', 'hhhhhhh', '.hhhhh.', '..hhh..', '...h...'],
  smiley: ['..YYYY..', '.YYYYYY.', 'YYoYYoYY', 'YYYYYYYY', 'YoYYYYoY', 'YYooooYY', '.YYYYYY.', '..YYYY..'],
  star: ['...w...', '...w...', '..wyw..', 'wwyYyww', '..wyw..', '...w...', '...w...'],
  sparkle: ['..w..', '..w..', 'wwhww', '..w..', '..w..'],
  floppy: ['NNNNNNNNNN', 'NNwwwwwwgN', 'NNwwwwwwNN', 'NNNNNNNNNN', 'NNNNNNNNNN', 'NNgggggNNN', 'NNgggoggNN', 'NNgggoggNN', 'NNgggggNNN', 'NNNNNNNNNN']
};

function iconBuf(name) {
  const rows = ICONS[name].map(r => r.replace(/ /g, 'w'));
  const b = new PixBuf(rows[0].length, rows.length, 1);
  b.grid(0, 0, rows);
  if (!['cursor', 'hand', 'grab'].includes(name)) b.outline('o');
  return b;
}
function iconURL(name, scale) { return iconBuf(name).toCanvas(scale || 4).toDataURL(); }

/* pixel CD for the chapter-select discs */
function discURL(accent, scale) {
  const b = new PixBuf(22, 22, 1);
  b.ell(11, 11, 11, 11, 'g');
  const band = [accent, 'w', 'b', 'p', 'y', accent];
  for (let y = 0; y < 22; y++) for (let x = 0; x < 22; x++) {
    if (!b.get(x, y)) continue;
    const ang = Math.atan2(y + 0.5 - 11, x + 0.5 - 11);
    const k = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 12) % band.length;
    if ((x + y) % 2 === 0 || k % 2 === 0) b.px(x, y, band[k]);
  }
  b.ell(11, 11, 4, 4, 'w'); b.ell(11, 11, 2, 2, null);
  b.ring(11, 11, 4, 4, 'G');
  b.px(5, 5, 'w'); b.px(6, 4, 'w'); b.px(4, 6, 'w');
  b.outline('o');
  return b.toCanvas(scale || 4).toDataURL();
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
/* draw mini text straight onto a 2d context (art layer) */
function miniTextCtx(ctx, x, y, str, col) {
  ctx.fillStyle = col.length === 1 ? PALETTE[col] : col;
  [...String(str).toUpperCase()].forEach((ch, k) => {
    const g = MINI[ch] || MINI['?'];
    g.forEach((row, j) => { for (let i = 0; i < 3; i++) if (row[i] === '#') ctx.fillRect(x + k * 4 + i, y + j, 1, 1); });
  });
}

const _logoCache = {};
function logoURL(text, opts) {
  const key = text + JSON.stringify(opts || {});
  if (!_logoCache[key]) { const cv = pixLogo(text, opts); _logoCache[key] = { url: cv.toDataURL(), w: cv.width, h: cv.height }; }
  return _logoCache[key];
}
