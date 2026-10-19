/* =========================================================
   room.js: the one bedroom, redrawn as pixel art for every
   chapter. Each background is painted once into a 320 x 180
   pixel buffer and cached. Layout numbers come from data.js
   (1280-wide world) and are divided by 4 into art pixels.
   ========================================================= */
'use strict';

const RA = { LX: 5, RX: 315, CY: 11, WX1: 42, WX2: 277, WY1: 16, WY2: 105, FY: 141 };
const q = v => Math.round(v / ART);

/* fill a polygon with an ordered-dither of colour c */
function polyDither(b, pts, c, level) {
  const mask = new PixBuf(b.W, b.H, 0);
  mask.poly(pts, 'w');
  for (let y = 0; y < b.H; y++) for (let x = 0; x < b.W; x++)
    if (mask.d[y * b.W + x] && BAYER4[(y & 3) * 4 + (x & 3)] < level) b.px(x, y, c);
}

/* vertical gradient between 3 colours using ordered dithering */
function skyGrad(b, x, y, w, h, cols) {
  for (let j = 0; j < h; j++) {
    const t = j / Math.max(1, h - 1);
    const [a, c, k] = t < 0.5 ? [cols[0], cols[1], t * 2] : [cols[1], cols[2], (t - 0.5) * 2];
    b.rect(x, y + j, w, 1, a);
    b.dither(x, y + j, w, 1, c, Math.round(k * 16));
  }
}

function stamp(b, x, y, rows, c, clip) {
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#' && (!clip || clip(x + i, y + j))) b.px(x + i, y + j, c); });
}

/* ---------- walls, floor & wallpaper ---------- */

function roomShell(b, th) {
  const { LX, RX, CY, WX1, WX2, WY1, WY2, FY } = RA;
  b.rect(0, 0, ART_W, ART_H, '#f2f2ed'); b.dither(0, 0, ART_W, ART_H, '#e4e1d6', 6);   // the guideline's white around the room
  b.poly([[LX, CY], [RX + 1, CY], [WX2 + 1, WY1], [WX1, WY1]], th.ceil);
  b.poly([[LX, CY], [WX1, WY1], [WX1, WY2 + 1], [LX, FY + 1]], th.side);
  b.poly([[WX2 + 1, WY1], [RX + 1, CY], [RX + 1, FY + 1], [WX2 + 1, WY2 + 1]], th.side2 || th.side);
  b.dither(LX, CY, 12, FY - CY, th.sideShade || th.side, 6);
  b.rect(WX1, WY1, WX2 - WX1 + 1, WY2 - WY1 + 1, th.wall);
  wallpaper(b, th);
  // floor + planks in perspective
  b.poly([[WX1, WY2 + 1], [WX2 + 1, WY2 + 1], [RX + 1, FY + 1], [LX, FY + 1]], th.floor);
  const xl = y => WX1 + (LX - WX1) * (y - WY2) / (FY - WY2), xr = y => WX2 + (RX - WX2) * (y - WY2) / (FY - WY2);
  const rows = [WY2 + 1, 110, 116, 123, 131, 141];
  rows.slice(1, -1).forEach(y => b.hline(Math.ceil(xl(y)), y, Math.floor(xr(y)) - Math.ceil(xl(y)) + 1, th.floor2));
  const spread = (RX - LX) / (WX2 - WX1);
  for (let k = 0; k < rows.length - 1; k++) {
    for (let xb = WX1 + (k % 2 ? 22 : 8); xb < WX2; xb += 30) {
      const xf = 160 + (xb - 160) * spread, at = y => xb + (xf - xb) * (y - WY2) / (FY - WY2);
      b.line(at(rows[k] + 1), rows[k] + 1, at(rows[k + 1] - 1), rows[k + 1] - 1, th.floor2);
    }
  }
  b.dither(LX, WY2 + 1, RX - LX + 1, 4, th.floor2, 4);
  // skirting board
  b.rect(WX1, WY2 - 2, WX2 - WX1 + 1, 3, th.base || 'w'); b.hline(WX1, WY2 - 3, WX2 - WX1 + 1, 'o');
  // room edges (dollhouse cut-away)
  b.vline(WX1, WY1, WY2 - WY1 + 1, 'o'); b.vline(WX2, WY1, WY2 - WY1 + 1, 'o');
  b.hline(WX1, WY1, WX2 - WX1 + 1, 'o');
  b.line(WX1, WY2, LX, FY, 'o'); b.line(WX2, WY2, RX, FY, 'o');
  b.line(WX1, WY1, LX, CY, 'o'); b.line(WX2, WY1, RX, CY, 'o');
  b.rect(LX - 1, CY - 1, RX - LX + 3, 1, 'o'); b.rect(LX - 1, CY - 1, 1, FY - CY + 3, 'o'); b.rect(RX + 1, CY - 1, 1, FY - CY + 3, 'o');
  b.rect(LX - 1, FY + 1, RX - LX + 3, 2, 'o');
}

function wallpaper(b, th) {
  const { WX1, WX2, WY1, WY2 } = RA;
  const clip = (x, y) => x > WX1 && x < WX2 && y > WY1 && y < WY2 - 3;
  const STAR = ['.#.', '###', '.#.'], MOON = ['.##', '#..', '.##'], HEART = ['##.##', '#####', '.###.', '..#..'],
    FLY = ['##.##', '#####', '.###.', '##.##'], DOT = ['##', '##'], TINY = ['#'];
  if (th.pattern === 'stars') {
    for (let y = WY1 + 4, r = 0; y < WY2; y += 11, r++) for (let x = WX1 + 3 + (r % 2 ? 6 : 0), k = 0; x < WX2; x += 12, k++) stamp(b, x, y, (k + r) % 3 ? STAR : MOON, th.dots, clip);
  } else if (th.pattern === 'dots') {
    for (let y = WY1 + 4, r = 0; y < WY2; y += 9, r++) for (let x = WX1 + 3 + (r % 2 ? 5 : 0), k = 0; x < WX2; x += 10, k++) {
      if ((k + r * 2) % 5 === 0) stamp(b, x - 1, y - 1, HEART, th.dots2, clip); else stamp(b, x, y, DOT, th.dots, clip);
    }
  } else if (th.pattern === 'butterflies') {
    for (let y = WY1 + 5, r = 0; y < WY2; y += 13, r++) for (let x = WX1 + 4 + (r % 2 ? 8 : 0), k = 0; x < WX2; x += 16, k++) stamp(b, x, y, FLY, (k + r) % 2 ? th.dots : th.dots2, clip);
  } else if (th.pattern === 'stripes') {
    for (let x = WX1 + 1; x < WX2; x += 10) b.rect(x, WY1 + 1, 5, WY2 - WY1 - 4, th.dots);
    for (let y = WY1 + 8, r = 0; y < WY2 - 6; y += 18, r++) for (let x = WX1 + 7 + (r % 2 ? 10 : 0); x < WX2; x += 20) stamp(b, x - 1, y - 1, STAR, th.dots2, clip);
  } else {
    for (let x = WX1 + 3; x < WX2; x += 6) b.vline(x, WY1 + 1, WY2 - WY1 - 4, th.dots);
    for (let y = WY1 + 6; y < WY2 - 4; y += 12) for (let x = WX1 + 6; x < WX2; x += 24) stamp(b, x, y, TINY, th.dots2 || th.dots, clip);
  }
}

const SKIES = {
  night: ['#231d63', '#3d3398', '#6a52c0'],
  day: ['#6cc8ff', '#9fdcff', '#dff6ff'],
  afternoon: ['#9fc4ff', '#ffc8b8', '#ffe7a8'],
  dusk: ['#3d2f8f', '#b56bd0', '#ffa070'],
  morning: ['#b7e3ff', '#e2f3ff', '#fff4dc']
};

function drawWindow(b, sky, curtain) {
  const x1 = 136, x2 = 183, y1 = 25, y2 = 67;
  skyGrad(b, x1 + 2, y1 + 2, x2 - x1 - 3, y2 - y1 - 3, SKIES[sky]);
  const inSky = (x, y) => x > x1 + 1 && x < x2 - 1 && y > y1 + 1 && y < y2 - 1;
  const put = (x, y, c) => { if (inSky(x, y)) b.px(x, y, c); };
  const disc = (cx, cy, r, c) => { for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.5) put(x, y, c); };
  if (sky === 'night') {
    disc(172, 34, 5, 'y'); disc(174, 33, 4, SKIES.night[0]);
    [[142, 31], [151, 40], [163, 29], [146, 55], [170, 52], [156, 60], [178, 44]].forEach(([x, y], i) => { put(x, y, 'w'); if (i % 3 === 0) { put(x - 1, y, 'b'); put(x + 1, y, 'b'); put(x, y - 1, 'b'); put(x, y + 1, 'b'); } });
  } else if (sky === 'day' || sky === 'morning') {
    disc(172, 34, 5, 'Y'); disc(172, 34, 3, 'y');
    [[144, 37, 6, 2], [150, 35, 4, 2], [160, 52, 7, 2]].forEach(([cx, cy, rx, ry]) => { for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) put(x, y, 'w'); });
    for (let x = x1; x <= x2; x++) for (let y = 58; y < y2; y++) if (((x - 148) / 22) ** 2 + ((y - 70) / 10) ** 2 <= 1 || ((x - 176) / 20) ** 2 + ((y - 71) / 9) ** 2 <= 1) put(x, y, (x + y) % 5 ? 'E' : 'e');
  } else if (sky === 'afternoon') {
    disc(150, 52, 6, 'k'); disc(150, 52, 4, 'Y');
    for (let x = x1; x <= x2; x++) for (let y = 56; y < y2; y++) if (((x - 160) / 30) ** 2 + ((y - 70) / 10) ** 2 <= 1) put(x, y, 'E');
    for (let y = 44; y < 62; y++) put(176, y, 'Q');
    disc(176, 44, 5, 'F'); disc(175, 42, 3, 'E');
  } else if (sky === 'dusk') {
    disc(160, 64, 8, 'y'); disc(160, 64, 6, 'Y');
    [[140, 54, 6], [148, 49, 5], [166, 52, 6], [174, 46, 6]].forEach(([x, y, w]) => { for (let yy = y; yy < y2; yy++) for (let xx = x; xx < x + w; xx++) put(xx, yy, '#2b2160'); put(x + 2, y + 3, 'y'); });
    put(145, 33, 'w'); put(171, 30, 'w');
  }
  // frame, mullions, sill
  b.rect(x1, y1, x2 - x1 + 1, 2, 'w'); b.rect(x1, y2 - 1, x2 - x1 + 1, 2, 'w');
  b.rect(x1, y1, 2, y2 - y1 + 1, 'w'); b.rect(x2 - 1, y1, 2, y2 - y1 + 1, 'w');
  b.rect(159, y1, 2, y2 - y1, 'w'); b.rect(x1, 45, x2 - x1, 2, 'w');
  b.hline(x1 - 1, y1 - 1, x2 - x1 + 3, 'o'); b.vline(x1 - 1, y1 - 1, y2 - y1 + 2, 'o'); b.vline(x2 + 1, y1 - 1, y2 - y1 + 2, 'o');
  b.box(x1 - 4, 68, x2 - x1 + 9, 3, 'w');
  if (curtain) {
    b.box(x1 - 13, 19, x2 - x1 + 27, 3, 'w');
    const left = [[x1 - 10, 22], [x1 + 6, 22], [x1 + 3, 40], [x1 + 7, 60], [x1 + 3, 74], [x1 - 10, 74]];
    const right = left.map(([x, y]) => [x1 + x2 - x, y]);
    [left, right].forEach(pts => {
      b.poly(pts, curtain);
      const xs = pts.map(p => p[0]), mx = (Math.min(...xs) + Math.max(...xs)) / 2;
      b.vline(Math.round(mx) - 2, 24, 48, 'o'); b.vline(Math.round(mx) + 3, 26, 46, 'o');
      for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; b.line(ax, ay, bx, by, 'o'); }
    });
  }
}

function lightBeam(b, level) { polyDither(b, [[138, 72], [182, 72], [214, 141], [142, 141]], 'w', level || 3); }

function drawDoor(b, col, deco) {
  const x1 = 253, x2 = 274, y1 = 48, y2 = 105;
  b.box(x1 - 2, y1 - 2, x2 - x1 + 5, y2 - y1 + 3, 'w');
  b.box(x1, y1, x2 - x1 + 1, y2 - y1 + 1, col);
  b.box(x1 + 3, y1 + 4, x2 - x1 - 5, 20, col); b.box(x1 + 3, y1 + 28, x2 - x1 - 5, 24, col);
  b.box(x1 + 2, 79, 3, 3, 'Y');
  if (deco === 'baby') { b.box(x1 + 3, 58, 16, 7, 'w'); miniText(b, x1 + 5, 59, 'SHH', 'v'); }
  if (deco === 'letters') ['x', 'n', 'Y', 'E'].forEach((c, i) => b.box(x1 + 3 + i * 4, 60, 3, 3, c));
  if (deco === 'butterfly') stamp(b, x1 + 9, 58, ['##.##', '#####', '.###.', '##.##'], 'L');
  if (deco === 'keepout') { b.box(x1 + 1, 56, 20, 14, 'Y'); miniText(b, x1 + 3, 57, 'KEEP', 'h'); miniText(b, x1 + 3, 63, 'OUT!', 'h'); }
  if (deco === 'wreath') { b.ring(x1 + 11, 62, 5, 5, 'E'); b.ring(x1 + 11, 62, 4, 4, 'F'); b.px(x1 + 11, 67, 'h'); }
}

/* ---------- furniture ---------- */

function shelfPlank(b, x1, x2, y, col) {
  b.box(x1 - 1, y, x2 - x1 + 3, 3, col);
  [x1 + 4, x2 - 4].forEach((x, i) => { b.vline(x, y + 3, 5, 'o'); b.line(x, y + 7, x + (i ? -4 : 4), y + 3, 'o'); });
}

function drawCot(b, c) {
  const x1 = q(c.x1), x2 = q(c.x2), top = q(c.top), bot = q(c.bottom);
  b.box(x1 + 2, top - 16, x2 - x1 - 3, 3, 'w');
  for (let x = x1 + 6; x < x2 - 4; x += 5) { b.rect(x, top - 13, 2, 13, 'w'); b.vline(x + 2, top - 13, 13, 'g'); }
  b.box(x1 + 2, top, x2 - x1 - 3, 6, 'b');
  for (let x = x1 + 5; x < x2 - 3; x += 5) b.vline(x, top + 1, 4, 'w');
  b.rect(x1 + 3, top + 6, x2 - x1 - 5, 4, 'p');
  for (let x = x1 + 3; x < x2 - 2; x += 4) { b.px(x, top + 10, 'p'); b.px(x + 1, top + 10, 'p'); b.px(x + 1, top + 11, 'o'); b.px(x + 3, top + 10, 'o'); }
  b.box(x1 - 1, top - 20, 4, bot - top + 20, 'w'); b.box(x2 - 3, top - 20, 4, bot - top + 20, 'w');
  b.ell(x1 + 1, top - 22, 2.5, 2.5, 'P'); b.ell(x2 - 1, top - 22, 2.5, 2.5, 'P');
  b.px(x1, top - 23, 'w'); b.px(x2 - 2, top - 23, 'w');
}

function drawBed(b, bed, style) {
  const s = {
    flowers: { frame: '#f3d3d6', duvet: '#eaa5b5', dark: '#d88799', pillow: 'w' },
    butterflies: { frame: '#e2dbef', duvet: '#a9d9d0', dark: '#86c2b7', pillow: 'y' },
    messy: { frame: '#6d5a8f', duvet: '#9a88c4', dark: '#7d6aa8', pillow: 'l' },
    linen: { frame: 'R', duvet: 'c', dark: 'g', pillow: 'w' },
    bare: { frame: 'R', duvet: 'g', dark: 'G', pillow: null }
  }[style];
  const x1 = q(bed.x1), x2 = q(bed.x2), top = q(bed.top), bot = q(bed.bottom);
  b.box(x1, top - 21, 6, bot - top + 21, s.frame); b.px(x1, top - 21, null); b.px(x1 + 5, top - 21, null);
  b.box(x2 - 4, top - 7, 5, bot - top + 7, s.frame);
  b.box(x1 + 5, top + 2, x2 - x1 - 8, 7, 'w');
  b.rect(x1 + 6, top + 9, x2 - x1 - 10, bot - top - 12, s.frame); b.hline(x1 + 6, bot - 3, x2 - x1 - 10, 'o');
  b.rect(x1 + 9, bot - 2, 2, 2, 'o'); b.rect(x2 - 11, bot - 2, 2, 2, 'o');
  if (style === 'bare') {
    b.box(x1 + 5, top, x2 - x1 - 8, 10, s.duvet);
    for (let x = x1 + 8; x < x2 - 4; x += 4) b.vline(x, top + 1, 8, 'G');
    return;
  }
  if (s.pillow) b.box(x1 + 6, top - 4, 17, 7, s.pillow);
  if (style === 'messy') {
    b.poly([[x1 + 18, top], [x1 + 40, top - 1], [x1 + 60, top + 2], [x2 - 3, top], [x2 - 2, top + 15], [x1 + 50, top + 17], [x1 + 30, top + 13], [x1 + 16, top + 16]], s.duvet);
    b.line(x1 + 26, top + 5, x1 + 46, top + 8, '#6d5a8f'); b.line(x1 + 50, top + 4, x1 + 64, top + 6, '#6d5a8f');
    b.line(x1 + 18, top, x1 + 16, top + 16, 'o'); b.line(x1 + 16, top + 16, x1 + 30, top + 13, 'o'); b.line(x1 + 30, top + 13, x1 + 50, top + 17, 'o'); b.line(x1 + 50, top + 17, x2 - 2, top + 15, 'o');
    b.hline(x1 + 18, top, x2 - x1 - 20, 'o');
    return;
  }
  b.box(x1 + 15, top, x2 - x1 - 18, 13, s.duvet);
  b.rect(x1 + 16, top + 9, x2 - x1 - 20, 3, s.dark);
  if (style === 'flowers') for (let x = x1 + 20, k = 0; x < x2 - 6; x += 9, k++) { const y = top + 3 + (k % 2) * 2; stamp(b, x, y, ['.#.', '#.#', '.#.'], 'w'); b.px(x + 1, y + 1, 'Y'); }
  if (style === 'butterflies') for (let x = x1 + 20, k = 0; x < x2 - 6; x += 10, k++) stamp(b, x, top + 3 + (k % 2), ['#.#', '###', '#.#'], k % 2 ? 'L' : 'h');
  if (style === 'linen') { b.hline(x1 + 16, top + 3, x2 - x1 - 20, 'g'); b.hline(x1 + 16, top + 5, x2 - x1 - 20, 'L'); }
}

function drawDresser(b, d, col) {
  const x1 = q(d.x1), x2 = q(d.x2), top = q(d.top), bot = q(d.bottom);
  b.box(x1 - 2, top, x2 - x1 + 5, 3, 'w');
  b.box(x1, top + 3, x2 - x1 + 1, bot - top - 5, col);
  const h = Math.floor((bot - top - 9) / 3);
  for (let i = 0; i < 3; i++) { b.box(x1 + 3, top + 6 + i * h, x2 - x1 - 5, h - 1, col); b.rect(Math.round((x1 + x2) / 2) - 1, top + 6 + i * h + Math.floor(h / 2) - 1, 2, 2, 'h'); }
  b.rect(x1 + 2, bot - 2, 3, 2, 'o'); b.rect(x2 - 4, bot - 2, 3, 2, 'o');
}

function drawBookshelf(b, s, col) {
  const x1 = q(s.x1), x2 = q(s.x2), top = q(s.top - 4), mid = q(s.mid), low = q(s.low), bot = q(s.bottom);
  b.box(x1, top + 3, x2 - x1 + 1, bot - top - 3, col);
  b.rect(x1 + 2, top + 4, x2 - x1 - 3, bot - top - 6, '#f2d98e');
  b.vline(x1 + 2, top + 4, bot - top - 6, '#e2c070');
  b.box(x1, mid, x2 - x1 + 1, 3, col); b.box(x1, low, x2 - x1 + 1, 3, col);
  b.box(x1 - 2, top, x2 - x1 + 5, 3, 'w');
}

function drawDesk(b, d, o) {
  o = o || {};
  const x1 = q(d.x1), x2 = q(d.x2), top = q(d.top), bot = q(d.bottom), col = o.col || 'w';
  b.box(x1 + 1, top + 3, 3, bot - top - 3, col);
  b.box(x2 - 19, top + 3, 19, bot - top - 3, col);
  b.box(x2 - 17, top + 6, 15, 10, o.drawer || 'L'); b.box(x2 - 17, top + 18, 15, 10, o.drawer || 'L');
  b.rect(x2 - 11, top + 10, 3, 2, 'Y'); b.rect(x2 - 11, top + 22, 3, 2, 'Y');
  b.box(x1 - 2, top, x2 - x1 + 5, 3, col);
  b.box(x1 + 8, top + 6, 17, 13, o.chair || 'P'); b.box(x1 + 6, top + 18, 21, 4, o.chair || 'P');
  b.vline(x1 + 8, top + 22, bot - top - 22, 'o'); b.vline(x1 + 24, top + 22, bot - top - 22, 'o');
  if (o.lamp) {
    const lx = x2 - 4;
    b.box(lx - 4, top - 2, 8, 2, o.lamp);
    b.line(lx, top - 3, lx - 3, top - 12, 'o'); b.line(lx - 3, top - 12, lx + 1, top - 17, 'o');
    b.poly([[lx - 2, top - 17], [lx + 6, top - 21], [lx + 9, top - 14]], o.lamp);
    b.line(lx - 2, top - 17, lx + 6, top - 21, 'o'); b.line(lx + 6, top - 21, lx + 9, top - 14, 'o'); b.line(lx + 9, top - 14, lx - 2, top - 17, 'o');
  }
  if (o.papers) [[x1 + 4, 'w'], [x1 + 14, 'g'], [x1 + 24, 'w']].forEach(([x, c]) => { b.rect(x, top - 1, 8, 1, c); b.hline(x, top - 2, 8, 'o'); });
}

function drawRug(b, cx, cy, rx, ry, c1, c2) {
  b.ell(cx, cy, rx, ry, c1);
  b.ring(cx, cy, rx - 4, ry - 2.5, c2);
  b.ring(cx, cy, rx, ry, 'o');
}

function drawToyBox(b, t) {
  const x1 = q(t.x1), y1 = q(t.y1), x2 = q(t.x2), y2 = q(t.y2);
  b.poly([[x1 + 1, y1], [x2, y1], [x2 + 2, y1 - 10], [x1 + 3, y1 - 12]], 'Y');
  b.line(x1 + 1, y1, x1 + 3, y1 - 12, 'o'); b.line(x1 + 3, y1 - 12, x2 + 2, y1 - 10, 'o'); b.line(x2 + 2, y1 - 10, x2, y1, 'o');
  b.box(x1, y1, x2 - x1 + 1, y2 - y1 + 1, 'B');
  miniText(b, Math.round((x1 + x2) / 2) - 7, y1 + 8, 'TOYS', 'w');
  stamp(b, x1 + 3, y1 + 3, ['.#.', '###', '.#.'], 'y'); stamp(b, x2 - 6, y2 - 6, ['.#.', '###', '.#.'], 'y');
}

function drawBasket(b, k) {
  const x1 = q(k.x1), y1 = q(k.y1), x2 = q(k.x2), y2 = q(k.y2);
  b.box(x1, y1, x2 - x1 + 1, y2 - y1 + 1, 'r');
  for (let y = y1 + 2; y < y2; y += 3) for (let x = x1 + 1 + (y % 2); x < x2; x += 3) b.px(x, y, 'R');
  b.box(x1 - 1, y1 - 1, x2 - x1 + 3, 3, 't');
}

function drawHookRail(b, h) {
  const x1 = q(h.x1) - 3, x2 = q(h.x2) + 3, y = q(h.y);
  b.box(x1, y - 5, x2 - x1, 4, 'R');
  for (let x = x1 + 6; x < x2 - 2; x += 14) b.box(x, y - 1, 3, 3, 'h');
}

function drawSocket(b, x, y) { b.box(x - 3, y - 3, 6, 7, 'w'); b.vline(x - 1, y - 1, 2, 'o'); b.vline(x + 1, y - 1, 2, 'o'); }

function drawTeaTable(b, cx, top, w, bot) {
  cx = q(cx); const half = q(w) / 2, ty = q(top), by = q(bot);
  b.box(cx - half + 4, ty + 4, 3, by - ty - 4, 'w'); b.box(cx + half - 7, ty + 4, 3, by - ty - 4, 'w');
  b.box(cx - half, ty, half * 2 + 1, 5, 'p');
  for (let x = cx - half + 3; x < cx + half - 1; x += 5) b.px(x, ty + 2, 'w');
  [[cx - half - 9, 'e'], [cx + half + 9, 'y']].forEach(([sx, c]) => { b.box(sx - 6, by - 6, 13, 3, c); b.vline(sx, by - 3, 4, 'o'); });
}

function drawStackedBoxes(b) {
  [[281, 118, 30, 22, 'BOOKS'], [284, 97, 26, 21, 'STUFF'], [287, 80, 21, 17, 'MISC']].forEach(([x, y, w, h, label]) => {
    b.box(x, y, w, h, 'r'); b.rect(x + Math.floor(w / 2) - 1, y + 1, 3, h - 2, 'y');
    miniText(b, x + Math.round((w - miniWidth(label)) / 2), y + Math.floor(h / 2) - 2, label, 'o');
  });
}

function ceilingStars(b) { [[70, 13], [110, 12], [150, 13], [200, 12], [240, 13]].forEach(([x, y]) => stamp(b, x - 1, y - 1, ['.#.', '###', '.#.'], 'e')); }

function hangString(b, x, toY) { b.vline(x, RA.WY1, Math.max(1, toY - RA.WY1), 'o'); }

/* ---------- one background per chapter ---------- */

function bgNursery(b, L) {
  roomShell(b, { ceil: '#fbf1d8', side: '#ecd9ac', side2: '#e5d09e', sideShade: '#dcc490', wall: '#f7e8c4', dots: '#c9b8e0', floor: '#d9b48a', floor2: '#c29a6c', pattern: 'stars' });
  ceilingStars(b);
  drawWindow(b, 'night', 'b');
  drawDoor(b, 'p', 'baby');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'w');
  drawDresser(b, L.dresser, 'b');
  drawSocket(b, q(L.socket.x), q(L.socket.y) + 2);
  drawRug(b, 160, 129, 50, 9, 'e', 'w');
  drawCot(b, L.cot);
  hangString(b, q(L.mobile.x), Math.round((L.mobile.y - ITEM_DEFS.mobile.h / 2) / ART));
}

function bgChildhood(b, L) {
  roomShell(b, { ceil: '#fbeeee', side: '#e5bcc0', side2: '#ddb2b7', sideShade: '#d3a5ab', wall: '#f0d0d2', dots: '#fbeeee', dots2: '#e3a0b2', floor: '#dcb48a', floor2: '#c59a6e', pattern: 'dots' });
  lightBeam(b, 2);
  drawWindow(b, 'day', 'w');
  drawDoor(b, 'w', 'letters');
  drawHookRail(b, L.hooks);
  drawBookshelf(b, L.shelf, 'y');
  drawRug(b, 160, 130, 55, 9, 'L', 'w');
  drawBed(b, L.bed, 'flowers');
  drawTeaTable(b, 640, 476, 240, 530);
  drawToyBox(b, L.toybox);
}

function bgTween(b, L) {
  roomShell(b, { ceil: '#f2eef8', side: '#cdc2e2', side2: '#c4b8db', sideShade: '#b9acd2', wall: '#ddd5ec', dots: '#bcaadd', dots2: '#9fcfc6', floor: '#d6ae86', floor2: '#bf956b', pattern: 'butterflies' });
  lightBeam(b, 2);
  drawWindow(b, 'afternoon', 'y');
  drawDoor(b, 'l', 'butterfly');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'w');
  drawRug(b, 160, 130, 45, 8, 'a', 'w');
  drawDesk(b, L.desk, { lamp: 'P', chair: 'A', drawer: 'L' });
  drawBed(b, L.bed, 'butterflies');
}

function bgTeen(b, L) {
  roomShell(b, { ceil: '#eef6f3', side: '#a3c6be', side2: '#99bdb5', sideShade: '#8fb2aa', wall: '#c0dcd5', dots: '#b0d0c8', dots2: '#f4fbf8', floor: '#c69f7a', floor2: '#ae8762', pattern: 'stripes' });
  lightBeam(b, 2);
  drawWindow(b, 'dusk', 'v');
  drawDoor(b, 'w', 'keepout');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'V');
  drawRug(b, 175, 130, 38, 8, 'P', 'o');
  drawDesk(b, L.desk, { lamp: 'V', chair: 'v', drawer: 'A', papers: true });
  drawBed(b, L.bed, 'messy');
  drawBasket(b, L.basket);
}

function bgYoungAdult(b, L) {
  roomShell(b, { ceil: '#fffdf6', side: '#e7e1cf', side2: '#dfd8c2', sideShade: '#d6cdb4', wall: '#f3efe2', dots: '#e8e2cf', dots2: '#d9c9f5', floor: '#d8b896', floor2: '#c3a07e', pattern: 'plain' });
  lightBeam(b, 3);
  drawWindow(b, 'morning', null);
  drawDoor(b, 'w', 'wreath');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'R');
  drawRug(b, 160, 130, 52, 9, 'g', 'L');
  drawDesk(b, L.desk, { col: 'c', chair: 'R', drawer: 'g' });
  drawBed(b, L.bed, 'linen');
}

function bgMovingOut(b, L) {
  roomShell(b, { ceil: '#fffdf6', side: '#e7e1cf', side2: '#dfd8c2', sideShade: '#d6cdb4', wall: '#f3efe2', dots: '#e8e2cf', dots2: '#d9c9f5', floor: '#d8b896', floor2: '#c3a07e', pattern: 'plain' });
  lightBeam(b, 4);
  drawWindow(b, 'morning', null);
  drawDoor(b, 'w', null);
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'R');
  drawDesk(b, L.desk, { col: 'c', chair: 'R', drawer: 'g' });
  drawBed(b, L.bed, 'bare');
  drawStackedBoxes(b);
}

/* ---------- the bedroom door you open first (after Chloee's laptop mock-up) ---------- */
const DOOR_ART = { x: 84, w: 152, h: 240 };   // door leaf on a 320 x 240 art grid (the 4:3 stage, 4 screen px per pixel)
function drawDoorWall() {
  const H = DOOR_ART.h, b = new PixBuf(ART_W, H, 0), x1 = DOOR_ART.x, x2 = DOOR_ART.x + DOOR_ART.w;
  b.rect(0, 0, ART_W, H, '#c9b496');
  for (let x = 0; x < ART_W; x += 6) b.vline(x, 0, H, '#c2ad8e');
  b.dither(0, 0, ART_W, H, '#b8a284', 3);
  // the doorway is left open: when the door swings, the title screen shows through
  b.rect(x1, 0, DOOR_ART.w, H, null);
  for (let y = 0; y < H; y++) for (let x = x1; x < x1 + 6; x++) if ((x + y) % 2) b.px(x, y, '#fff2d8');
  // door casing, two shades of beige
  [[x1 - 12, 12], [x2, 12]].forEach(([x, w]) => {
    b.rect(x, 0, w, H, '#e6d6b8'); b.vline(x, 0, H, '#f3e8d2'); b.vline(x + w - 1, 0, H, '#bfa985');
    b.vline(x + 3, 0, H, '#d8c5a2');
  });
  b.rect(x1 - 2, 0, 2, H, '#7a5a40'); b.rect(x2, 0, 1, H, '#7a5a40');
  // hinges
  [40, 200].forEach(y => { b.rect(x1 - 3, y, 3, 8, '#b08a3e'); b.px(x1 - 2, y + 2, '#e8c46a'); });
  return b.toCanvas(1);
}
function drawDoorLeaf() {
  const W = DOOR_ART.w, H = DOOR_ART.h, b = new PixBuf(W, H, 0);
  const base = '#d9604f', dark = '#b8483a', groove = '#c4523f', hi = '#ec8a75';
  b.rect(0, 0, W, H, base);
  for (let x = 6; x < W; x += 5) b.vline(x, 0, H, groove);
  b.dither(0, 0, W, H, '#cf5646', 4);
  const panel = (x, y, w, h) => {
    b.rect(x, y, w, h, '#d35a49');
    for (let i = x + 4; i < x + w - 2; i += 6) b.vline(i, y + 3, h - 6, dark);
    b.hline(x, y, w, dark); b.vline(x, y, h, dark); b.hline(x, y + h - 1, w, hi); b.vline(x + w - 1, y, h, hi);
    b.hline(x + 2, y + 2, w - 4, groove); b.vline(x + 2, y + 2, h - 4, groove);
  };
  panel(12, 24, W - 24, 140);
  panel(12, 178, W - 24, 70);
  b.vline(0, 0, H, dark); b.vline(W - 1, 0, H, '#a8402f');
  // peephole
  b.ell(W / 2, 12, 2.6, 2.6, '#c9a24a'); b.px(Math.floor(W / 2), 12, '#3a2a1a');
  // deadbolt + lever handle (below the names)
  b.ell(W - 13, 136, 3.4, 3.4, '#c9a24a'); b.ell(W - 13, 136, 1.6, 1.6, '#7a5a2a');
  b.rect(W - 16, 144, 6, 18, '#2a2420'); b.rect(W - 15, 145, 4, 16, '#3a322c');
  b.rect(W - 16, 148, 2, 3, '#555'); b.rect(W - 22, 148, 8, 3, '#2a2420'); b.px(W - 22, 148, '#555');
  return b.toCanvas(1);
}
