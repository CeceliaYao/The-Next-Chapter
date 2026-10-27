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

/* light and shade without new shapes: every pixel in the box (outlines and empty pixels left alone) is mixed
   towards a dark plum or towards white; with a level it only takes every so many pixels (an ordered dither) */
function shadeRect(b, x, y, w, h, t, level, toward) {
  x = Math.round(x); y = Math.round(y);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const X = x + i, Y = y + j, k = b.idx(X, Y);
    if (k < 0) continue;
    const c = b.d[k];
    if (!c || c === 'o' || (level != null && BAYER4[(Y & 3) * 4 + (X & 3)] >= level)) continue;
    b.d[k] = mixCol(c, toward || SHADOW, t);
  }
}
const lightRect = (b, x, y, w, h, t, level) => shadeRect(b, x, y, w, h, t, level, '#ffffff');
/* a raised, glossy edge for a box drawn with b.box(x, y, w, h): lit along the top and left, shaded along the bottom and right */
function bevel(b, x, y, w, h, k) {
  k = k || 1;
  lightRect(b, x + 1, y + 1, w - 2, 1, 0.45 * k); lightRect(b, x + 1, y + 2, 1, h - 3, 0.3 * k);
  shadeRect(b, x + 1, y + h - 2, w - 2, 1, 0.18 * k); shadeRect(b, x + w - 2, y + 2, 1, h - 4, 0.14 * k);
}
/* furniture is drawn as solid blocks seen a little from above: the floorboards' lines meet at VP, so the tops and
   the side facing the middle of the room go back towards it; DARK makes shadows deeper (the nursery at night) */
const VP = [158, -8];
let DARK = 1;
const back = (x, y, f) => [Math.round(x + (VP[0] - x) * f), Math.round(y - (y - VP[1]) * f)];
function edges(b, pts) { for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; b.line(ax, ay, bx, by, 'o'); } }
/* a block whose front face is x1..x2 / top..bot (as it was drawn before), with a lit top D pixels deep and the
   side towards the middle of the room in shade; o.noTop / o.noSide leave those out */
function block(b, x1, x2, top, bot, D, col, o) {
  o = o || {};
  const f = D / (top - VP[1]);
  if (!o.noSide) {
    const sx = x1 > VP[0] + 2 ? x1 : x2 < VP[0] - 2 ? x2 : null;
    if (sx != null) {
      const side = [[sx, top], back(sx, top, f), back(sx, bot, f), [sx, bot]];
      b.poly(side, mixCol(col, SHADOW, o.sideT == null ? 0.3 : o.sideT)); edges(b, side);
      shadeRect(b, Math.min(sx, side[2][0]), bot - 2, Math.abs(side[2][0] - sx) + 1, 2, 0.12);
    }
  }
  if (!o.noTop) {
    const tp = [[x1, top], [x2, top], back(x2, top, f), back(x1, top, f)];
    b.poly(tp, mixCol(col, '#ffffff', 0.32)); edges(b, tp);
  }
  b.box(x1, top, x2 - x1 + 1, bot - top + 1, col);
  const h = bot - top, k = Math.max(1, Math.round(h / 3));
  if (h > 3) { lightRect(b, x1 + 1, top + 1, x2 - x1 - 1, 1, 0.28); shadeRect(b, x1 + 1, bot - k, x2 - x1 - 1, k, 0.12); }
  return f;
}
/* a drawer front set into the furniture: dark along its top and left, catching the light along its bottom and right */
function inset(b, x, y, w, h, col) {
  b.box(x, y, w, h, col);
  shadeRect(b, x + 1, y + 1, w - 2, 1, 0.24); shadeRect(b, x + 1, y + 2, 1, h - 3, 0.16);
  lightRect(b, x + 1, y + h - 2, w - 2, 1, 0.3); lightRect(b, x + w - 2, y + 2, 1, h - 4, 0.2);
}
/* a soft shadow on the floor where a piece of furniture stands */
function floorShadow(b, x1, x2, y) {
  shadeRect(b, x1, y + 1, x2 - x1 + 1, 1, 0.36 * DARK); shadeRect(b, x1 + 1, y + 2, x2 - x1 - 1, 1, 0.26 * DARK); shadeRect(b, x1 + 3, y + 3, x2 - x1 - 5, 1, 0.14 * DARK);
}

/* the light from the window: its colour changes with the time of day in each chapter */
const DAYLIGHT = { night: ['#9fb4ff', 0.14], day: ['#fffbe8', 0.2], afternoon: ['#ffd49a', 0.18], dusk: ['#ff9fd2', 0.16], morning: ['#fff6df', 0.18] };
const PATCH = [[139, 106], [186, 106], [218, 141], [145, 141]];
/* light through the window lands as a patch on the floor: brightest by the wall, fading towards the front, with soft
   edges and a sheen along the boards; it also lights whatever stands in it (the rug, a table, a basket) */
function windowLight(b, sky) {
  const [c, t] = DAYLIGHT[sky], mask = new PixBuf(b.W, b.H, 0);
  mask.poly(PATCH, 'w');
  const inside = (x, y) => x >= 0 && y >= 0 && x < b.W && y < b.H && mask.d[y * b.W + x];
  for (let y = 106; y <= 141; y++) for (let x = 120; x < 240; x++) {
    if (!inside(x, y)) continue;
    const k = b.idx(x, y), v = k >= 0 && b.d[k];
    if (!v || v === 'o') continue;
    const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x - 2, y) || !inside(x + 2, y);
    let a = t * 1.7 * (1.35 - (y - 106) / 40) * (edge ? 0.45 : 1);
    if ([111, 117, 124, 132].includes(y)) a *= 1.6;          // a sheen along the boards
    b.d[k] = mixCol(v, c, Math.max(0.03, a));
  }
}
/* a soft glow on the wall around the window frame */
function windowGlow(b, sky) {
  const [c, t] = DAYLIGHT[sky];
  shadeRect(b, 130, 22, 60, 52, t * 0.45, null, c); shadeRect(b, 133, 24, 54, 48, t * 0.35, null, c);
}

function stamp(b, x, y, rows, c, clip) {
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#' && (!clip || clip(x + i, y + j))) b.px(x + i, y + j, c); });
}

/* ---------- walls, floor & wallpaper ---------- */

function roomShell(b, th) {
  const { LX, RX, CY, WX1, WX2, WY1, WY2, FY } = RA;
  b.rect(0, 0, ART_W, ART_H, '#fff6ea'); b.dither(0, 0, ART_W, ART_H, '#ffe3c8', 6);
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
  // soft shade along the back of the floor (only on the floor, not over the side walls)
  for (let y = WY2 + 1; y <= WY2 + 4; y++) { const x0 = Math.ceil(xl(y)), x1 = Math.floor(xr(y)); b.dither(x0, y, x1 - x0 + 1, 1, th.floor2, 4); }
  // boards of slightly different tones, so the floor reads as wood; the floor also gets lighter towards the front
  for (let k = 1; k < rows.length - 1; k++) {
    for (let y = rows[k] + 1; y < rows[k + 1]; y++) {
      const x0 = Math.ceil(xl(y)) + 1, x1 = Math.floor(xr(y)) - 1;
      const seams = [];
      for (let xb = WX1 + (k % 2 ? 22 : 8) - 30; xb < WX2 + 30; xb += 30) { const xf = 160 + (xb - 160) * spread; seams.push(xb + (xf - xb) * (y - WY2) / (FY - WY2)); }
      for (let x = x0; x <= x1; x++) {
        const n = seams.filter(sx => sx < x).length, tone = (k * 5 + n * 3) % 5;
        if (tone === 0) shadeRect(b, x, y, 1, 1, 0.07); else if (tone === 2) lightRect(b, x, y, 1, 1, 0.1);
      }
    }
  }
  for (let y = 131; y <= FY; y++) { const x0 = Math.ceil(xl(y)), x1 = Math.floor(xr(y)); lightRect(b, x0, y, x1 - x0 + 1, 1, 0.06); }
  // the back wall: darker into the corners, under the ceiling and in two steps down towards the skirting
  shadeRect(b, WX1 + 1, WY1 + 1, 2, WY2 - WY1 - 3, 0.12); shadeRect(b, WX2 - 2, WY1 + 1, 2, WY2 - WY1 - 3, 0.12);
  shadeRect(b, WX1 + 3, WY1 + 1, WX2 - WX1 - 5, 2, 0.1);
  shadeRect(b, WX1 + 3, WY2 - 12, WX2 - WX1 - 5, 5, 0.05); shadeRect(b, WX1 + 3, WY2 - 7, WX2 - WX1 - 5, 4, 0.1);
  // side walls: darker towards the room's open front edge, like the left one already was
  shadeRect(b, RX - 9, CY, 10, FY - CY, 0.06);
  // skirting board
  b.rect(WX1, WY2 - 2, WX2 - WX1 + 1, 3, th.base || 'w'); b.hline(WX1, WY2 - 3, WX2 - WX1 + 1, 'o');
  shadeRect(b, WX1 + 1, WY2, WX2 - WX1 - 1, 1, 0.12);
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
  // only the nursery's night sky gets a shooting star
  if (sky === 'night') for (let i = 0; i < 9; i++) { put(x1 + 4 + i, y1 + 13 - i, 'w'); if (i % 2) put(x1 + 5 + i, y1 + 13 - i, 'w'); }
  // frame, mullions, sill
  b.rect(x1, y1, x2 - x1 + 1, 2, 'w'); b.rect(x1, y2 - 1, x2 - x1 + 1, 2, 'w');
  b.rect(x1, y1, 2, y2 - y1 + 1, 'w'); b.rect(x2 - 1, y1, 2, y2 - y1 + 1, 'w');
  b.rect(159, y1, 2, y2 - y1, 'w'); b.rect(x1, 45, x2 - x1, 2, 'w');
  b.hline(x1 - 1, y1 - 1, x2 - x1 + 3, 'o'); b.vline(x1 - 1, y1 - 1, y2 - y1 + 2, 'o'); b.vline(x2 + 1, y1 - 1, y2 - y1 + 2, 'o');
  block(b, x1 - 4, x2 + 4, 68, 70, 3, 'w', { noSide: true });
  shadeRect(b, x1 - 3, 71, x2 - x1 + 7, 2, 0.14);
  if (curtain) {
    b.box(x1 - 13, 19, x2 - x1 + 27, 3, 'w');
    const left = [[x1 - 10, 22], [x1 + 6, 22], [x1 + 3, 40], [x1 + 7, 60], [x1 + 3, 74], [x1 - 10, 74]];
    const right = left.map(([x, y]) => [x1 + x2 - x, y]);
    [left, right].forEach(pts => {
      b.poly(pts, curtain);
      const xs = pts.map(p => p[0]), mx = (Math.min(...xs) + Math.max(...xs)) / 2;
      // soft folds: bands that catch the light and bands in shade, running down the curtain
      const x0 = Math.min(...xs);
      for (let y = 22; y < 75; y++) for (let x = x0; x <= Math.max(...xs); x++) {
        const k = b.idx(x, y); if (k < 0 || b.d[k] !== curtain) continue;
        const ph = (x - x0 + (y > 58 ? Math.round((y - 58) / 4) : 0)) % 6;
        b.d[k] = ph < 2 ? mixCol(curtain, '#ffffff', 0.3) : ph === 3 ? mixCol(curtain, SHADOW, 0.18) : ph === 4 ? mixCol(curtain, SHADOW, 0.32) : curtain;
      }
      for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; b.line(ax, ay, bx, by, 'o'); }
    });
  }
}

function lightBeam() { /* the dotted beam is gone: the light now lands as a patch on the floor (windowLight) */ }

function drawDoor(b, col, deco) {
  const x1 = 253, x2 = 274, y1 = 48, y2 = 105;
  b.box(x1 - 2, y1 - 2, x2 - x1 + 5, y2 - y1 + 3, 'w');
  b.box(x1, y1, x2 - x1 + 1, y2 - y1 + 1, col);
  b.box(x1 + 3, y1 + 4, x2 - x1 - 5, 20, col); b.box(x1 + 3, y1 + 28, x2 - x1 - 5, 24, col);
  b.box(x1 + 2, 79, 3, 3, 'Y');
  bevel(b, x1, y1, x2 - x1 + 1, y2 - y1 + 1, 0.8);
  [[y1 + 4, 20], [y1 + 28, 24]].forEach(([py, ph]) => { shadeRect(b, x1 + 4, py + 1, x2 - x1 - 7, 1, 0.14); shadeRect(b, x1 + 4, py + 2, 1, ph - 3, 0.12); lightRect(b, x1 + 4, py + ph - 2, x2 - x1 - 7, 1, 0.3); });
  shadeRect(b, x1 - 4, y1 - 1, 2, y2 - y1 + 2, 0.1);   // shadow on the wall beside the frame
  if (deco === 'baby') { b.box(x1 + 3, 58, 16, 7, 'w'); miniText(b, x1 + 5, 59, 'SHH', 'v'); }
  if (deco === 'letters') ['x', 'n', 'Y', 'E'].forEach((c, i) => b.box(x1 + 3 + i * 4, 60, 3, 3, c));
  if (deco === 'butterfly') stamp(b, x1 + 9, 58, ['##.##', '#####', '.###.', '##.##'], 'L');
  if (deco === 'keepout') { b.box(x1 + 1, 56, 20, 14, 'Y'); miniText(b, x1 + 3, 57, 'KEEP', 'h'); miniText(b, x1 + 3, 63, 'OUT!', 'h'); }
  if (deco === 'wreath') { b.ring(x1 + 11, 62, 5, 5, 'E'); b.ring(x1 + 11, 62, 4, 4, 'F'); b.px(x1 + 11, 67, 'h'); }
}

/* ---------- furniture ---------- */

function shelfPlank(b, x1, x2, y, col) {
  shadeRect(b, x1, y + 3, x2 - x1 + 2, 2, 0.18); shadeRect(b, x1 + 1, y + 5, x2 - x1, 2, 0.08);
  block(b, x1 - 1, x2 + 1, y, y + 2, 3, col, { noSide: true });
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
  bevel(b, x1 - 1, top - 20, 4, bot - top + 20); bevel(b, x2 - 3, top - 20, 4, bot - top + 20);
  bevel(b, x1 + 2, top, x2 - x1 - 3, 6);
  shadeRect(b, x1 + 3, top + 8, x2 - x1 - 5, 2, 0.14);
  shadeRect(b, x1 - 1, bot + 1, x2 - x1 + 3, 2, 0.24); shadeRect(b, x1 + 1, bot + 3, x2 - x1 - 1, 1, 0.12);   // its light shadow on the floor
}

function drawBed(b, bed, style) {
  const s = {
    flowers: { frame: '#f3d3d6', duvet: '#eaa5b5', dark: '#d88799', pillow: 'w' },
    butterflies: { frame: '#e2dbef', duvet: '#a9d9d0', dark: '#86c2b7', pillow: 'y' },
    messy: { frame: '#6d5a8f', duvet: '#9a88c4', dark: '#7d6aa8', pillow: 'l' },
    linen: { frame: 'R', duvet: 'c', dark: 'g', pillow: 'w' },
    bare: { frame: 'R', duvet: 'g', dark: 'G', pillow: null }
  }[style];
  const x1 = q(bed.x1), x2 = q(bed.x2), top = q(bed.top), bot = q(bed.bottom), D = 6, f = D / (top - VP[1]);
  floorShadow(b, x1 - 1, x2 + 4, bot);
  // headboard: a panel at the head end; we see its inner face going back to the wall
  block(b, x1, x1 + 5, top - 21, bot, D, s.frame, { sideT: 0.14 });
  lightRect(b, x1 + 6, top - 18, 2, 18, 0.12);                                   // light catching the panel's edge
  // the base: one thin line along its bottom, and its legs
  b.rect(x1 + 6, top + 9, x2 - x1 - 10, bot - top - 12, s.frame); b.hline(x1 + 6, bot - 3, x2 - x1 - 10, 'o');
  b.rect(x1 + 9, bot - 2, 2, 2, 'o'); b.rect(x2 - 11, bot - 2, 2, 2, 'o');
  shadeRect(b, x1 + 7, bot - 6, x2 - x1 - 12, 3, 0.16);                                   // the base darkens towards the floor
  // the mattress, its top going back to the wall
  block(b, x1 + 5, x2 - 4, top + 2, top + 8, D, 'w', { noSide: true });
  const dx1 = x1 + 15, dx2 = x2 - 4;
  if (style === 'bare') {
    const tp = [[x1 + 5, top + 2], [x2 - 4, top + 2], back(x2 - 4, top + 2, f), back(x1 + 5, top + 2, f)];
    b.poly(tp, mixCol(s.duvet, '#ffffff', 0.25)); edges(b, tp);
    b.box(x1 + 5, top, x2 - x1 - 8, 10, s.duvet);
    for (let x = x1 + 8; x < x2 - 4; x += 4) b.vline(x, top + 1, 8, 'G');
    lightRect(b, x1 + 6, top + 1, x2 - x1 - 10, 1, 0.35); shadeRect(b, x1 + 6, top + 7, x2 - x1 - 10, 2, 0.14);
  } else {
    // pillow: a soft, rounded shape lying on the mattress by the headboard
    const pillow = () => {
      if (!s.pillow) return;
      const [cx, cy] = back(x1 + 13, top, f * 0.45);
      b.ell(cx, cy, 7, 3.5, s.pillow); b.ring(cx, cy, 7, 3.5, mixCol(s.pillow, SHADOW, 0.5));
      lightRect(b, cx - 5, cy - 2, 9, 1, 0.5); shadeRect(b, cx - 5, cy + 2, 11, 1, 0.18); shadeRect(b, cx - 1, cy - 1, 2, 2, 0.12);
    };
    if (style === 'messy') {
      // the top of the duvet, rumpled
      const tp = [[dx1 + 3, top], [dx2, top], back(dx2, top, f), back(dx1 + 6, top, f)];
      b.poly(tp, mixCol(s.duvet, '#ffffff', 0.18)); edges(b, tp);
      pillow();
      b.poly([[x1 + 18, top], [x1 + 40, top - 1], [x1 + 60, top + 2], [x2 - 3, top], [x2 - 2, top + 15], [x1 + 50, top + 17], [x1 + 30, top + 13], [x1 + 16, top + 16]], s.duvet);
      b.line(x1 + 26, top + 5, x1 + 46, top + 8, '#6d5a8f'); b.line(x1 + 50, top + 4, x1 + 64, top + 6, '#6d5a8f');
      b.line(x1 + 18, top, x1 + 16, top + 16, 'o'); b.line(x1 + 16, top + 16, x1 + 30, top + 13, 'o'); b.line(x1 + 30, top + 13, x1 + 50, top + 17, 'o'); b.line(x1 + 50, top + 17, x2 - 2, top + 15, 'o');
      b.hline(x1 + 18, top, x2 - x1 - 20, 'o');
      lightRect(b, x1 + 19, top + 1, x2 - x1 - 23, 2, 0.24); shadeRect(b, x1 + 17, top + 10, x2 - x1 - 20, 8, 0.18);
    } else {
      // the top of the duvet going back to the wall, with a roll where it's folded back by the pillow
      const tp = [[dx1, top], [dx2, top], back(dx2, top, f), back(dx1, top, f)];
      b.poly(tp, mixCol(s.duvet, '#ffffff', 0.28)); edges(b, tp);
      const [rx, ry] = back(dx1, top, f / 2); b.line(dx1 + 1, top - 1, rx + 1, ry, mixCol(s.duvet, SHADOW, 0.2));
      pillow();
      // the front: it hangs over the side of the bed
      b.box(dx1, top, dx2 - dx1 + 1, 13, s.duvet);
      lightRect(b, dx1 + 1, top + 1, dx2 - dx1 - 1, 2, 0.3);
      shadeRect(b, dx1 + 1, top + 8, dx2 - dx1 - 1, 2, 0.1); shadeRect(b, dx1 + 1, top + 10, dx2 - dx1 - 1, 3, 0.2);
      if (style === 'flowers') for (let x = dx1 + 5, k = 0; x < dx2 - 4; x += 9, k++) { const y = top + 3 + (k % 2) * 2; stamp(b, x, y, ['.#.', '#.#', '.#.'], 'w'); b.px(x + 1, y + 1, 'Y'); }
      if (style === 'butterflies') for (let x = dx1 + 5, k = 0; x < dx2 - 4; x += 10, k++) stamp(b, x, top + 3 + (k % 2), ['#.#', '###', '#.#'], k % 2 ? 'L' : 'h');
      if (style === 'linen') { b.hline(dx1 + 1, top + 3, dx2 - dx1 - 1, 'g'); b.hline(dx1 + 1, top + 5, dx2 - dx1 - 1, 'L'); }
    }
  }
  // footboard: its outer side shows
  block(b, x2 - 4, x2, top - 7, bot, D, s.frame, { sideT: 0.16 });
}

function drawDresser(b, d, col) {
  const x1 = q(d.x1), x2 = q(d.x2), top = q(d.top), bot = q(d.bottom), D = 6;
  floorShadow(b, x1 - 1, x2 + 4, bot);
  block(b, x1, x2, top + 3, bot - 3, D, col, { noTop: true });
  block(b, x1 - 2, x2 + 2, top, top + 2, D, 'w');
  const h = Math.floor((bot - top - 9) / 3);
  for (let i = 0; i < 3; i++) { inset(b, x1 + 3, top + 6 + i * h, x2 - x1 - 5, h - 1, col); b.rect(Math.round((x1 + x2) / 2) - 1, top + 6 + i * h + Math.floor(h / 2) - 1, 2, 2, 'h'); }
  b.rect(x1 + 2, bot - 2, 3, 2, 'o'); b.rect(x2 - 4, bot - 2, 3, 2, 'o');
}

function drawBookshelf(b, s, col) {
  const x1 = q(s.x1), x2 = q(s.x2), top = q(s.top - 4), mid = q(s.mid), low = q(s.low), bot = q(s.bottom), D = 5;
  floorShadow(b, x1 - 1, x2 + 4, bot);
  block(b, x1, x2, top + 3, bot - 1, D, col, { noTop: true });
  b.rect(x1 + 2, top + 4, x2 - x1 - 3, bot - top - 6, '#f2d98e');
  // each shelf is a hollow: dark under the board above, the inner right-hand wall in view
  [[top + 4, mid], [mid + 3, low], [low + 3, bot - 2]].forEach(([y0, y1]) => {
    shadeRect(b, x1 + 2, y0, x2 - x1 - 3, 3, 0.2); shadeRect(b, x1 + 2, y0 + 3, x2 - x1 - 3, 2, 0.08);
    b.rect(x2 - 3, y0, 2, y1 - y0, mixCol(col, SHADOW, 0.1)); b.vline(x2 - 4, y0, y1 - y0, mixCol(col, SHADOW, 0.25));
  });
  b.vline(x1 + 2, top + 4, bot - top - 6, '#e2c070');
  [mid, low].forEach(y => { b.box(x1, y, x2 - x1 + 1, 3, col); lightRect(b, x1 + 1, y + 1, x2 - x1 - 1, 1, 0.35); });
  block(b, x1 - 2, x2 + 2, top, top + 2, D, 'w');
}

function drawDesk(b, d, o) {
  o = o || {};
  const x1 = q(d.x1), x2 = q(d.x2), top = q(d.top), bot = q(d.bottom), col = o.col || 'w', D = 6;
  // the space under the desk: the wall and the floor both in its shadow
  shadeRect(b, x1 + 4, top + 3, x2 - x1 - 23, RA.WY2 - top - 3, 0.16); shadeRect(b, x1 + 4, top + 3, x2 - x1 - 23, 3, 0.12);
  shadeRect(b, x1 + 4, RA.WY2 + 1, x2 - x1 - 23, bot - RA.WY2, 0.22 * DARK);
  floorShadow(b, x1 - 1, x2 + 4, bot);
  // a leg and the drawer unit, each a solid block
  block(b, x1 + 1, x1 + 3, top + 3, bot - 1, D, col, { noTop: true });
  block(b, x2 - 19, x2 - 1, top + 3, bot - 1, D, col, { noTop: true });
  inset(b, x2 - 17, top + 6, 15, 10, o.drawer || 'L'); inset(b, x2 - 17, top + 18, 15, 10, o.drawer || 'L');
  b.rect(x2 - 11, top + 10, 3, 2, 'Y'); b.rect(x2 - 11, top + 22, 3, 2, 'Y'); b.hline(x2 - 11, top + 12, 3, mixCol(o.drawer || 'L', SHADOW, 0.3)); b.hline(x2 - 11, top + 24, 3, mixCol(o.drawer || 'L', SHADOW, 0.3));
  // the desk top: a slab with its lit top going back to the wall
  block(b, x1 - 2, x2 + 2, top, top + 2, D, col);
  // the chair: seat with a top, a back, legs
  block(b, x1 + 6, x1 + 26, top + 18, top + 21, 3, o.chair || 'P', { noSide: true });
  b.box(x1 + 8, top + 6, 17, 13, o.chair || 'P'); lightRect(b, x1 + 9, top + 7, 15, 1, 0.35); shadeRect(b, x1 + 9, top + 14, 15, 4, 0.14);
  b.vline(x1 + 8, top + 22, bot - top - 22, 'o'); b.vline(x1 + 24, top + 22, bot - top - 22, 'o');
  shadeRect(b, x1 + 7, bot, 19, 1, 0.25 * DARK);
  if (o.lamp) {
    const lx = x2 - 4;
    b.box(lx - 4, top - 2, 8, 2, o.lamp);
    b.line(lx, top - 3, lx - 3, top - 12, 'o'); b.line(lx - 3, top - 12, lx + 1, top - 17, 'o');
    b.poly([[lx - 2, top - 17], [lx + 6, top - 21], [lx + 9, top - 14]], o.lamp);
    shadeRect(b, lx + 2, top - 18, 6, 4, 0.18);
    b.line(lx - 2, top - 17, lx + 6, top - 21, 'o'); b.line(lx + 6, top - 21, lx + 9, top - 14, 'o'); b.line(lx + 9, top - 14, lx - 2, top - 17, 'o');
    shadeRect(b, lx - 5, top - 1, 10, 1, 0.2);
  }
  if (o.papers) [[x1 + 4, 'w'], [x1 + 14, 'g'], [x1 + 24, 'w']].forEach(([x, c]) => { b.rect(x, top - 1, 8, 1, c); b.hline(x, top - 2, 8, 'o'); });
}

function drawRug(b, cx, cy, rx, ry, c1, c2) {
  b.ell(cx, cy, rx, ry, c1);
  shadeRect(b, cx - rx, cy - ry, rx * 2 + 1, Math.ceil(ry * 0.5), 0.07); lightRect(b, cx - rx, cy + Math.ceil(ry * 0.4), rx * 2 + 1, Math.ceil(ry * 0.6), 0.1);
  b.ring(cx, cy, rx - 4, ry - 2.5, c2);
  b.ring(cx, cy, rx, ry, 'o');
}

function drawToyBox(b, t) {
  const x1 = q(t.x1), y1 = q(t.y1), x2 = q(t.x2), y2 = q(t.y2);
  floorShadow(b, x1, x2 + 4, y2);
  block(b, x1, x2, y1, y2, 6, 'B', { noTop: true });
  b.poly([[x1 + 1, y1], [x2, y1], [x2 + 2, y1 - 10], [x1 + 3, y1 - 12]], 'Y');
  lightRect(b, x1 + 3, y1 - 10, x2 - x1 - 2, 3, 0.3); shadeRect(b, x1 + 2, y1 - 3, x2 - x1 - 2, 2, 0.16);
  b.line(x1 + 1, y1, x1 + 3, y1 - 12, 'o'); b.line(x1 + 3, y1 - 12, x2 + 2, y1 - 10, 'o'); b.line(x2 + 2, y1 - 10, x2, y1, 'o');
  b.hline(x1 + 1, y1, x2 - x1, 'o');
  miniText(b, Math.round((x1 + x2) / 2) - 7, y1 + 8, 'TOYS', 'w');
  stamp(b, x1 + 3, y1 + 3, ['.#.', '###', '.#.'], 'y'); stamp(b, x2 - 6, y2 - 6, ['.#.', '###', '.#.'], 'y');
}

function drawBasket(b, k) {
  const x1 = q(k.x1), y1 = q(k.y1), x2 = q(k.x2), y2 = q(k.y2), D = 5, f = D / (y1 - VP[1]);
  floorShadow(b, x1, x2 + 4, y2);
  // the open top: the dark inside of the basket going back
  const tp = [[x1, y1], [x2, y1], back(x2, y1, f), back(x1, y1, f)];
  b.poly(tp, mixCol('r', SHADOW, 0.55)); edges(b, tp);
  block(b, x1, x2, y1, y2, D, 'r', { noTop: true });
  for (let y = y1 + 2; y < y2; y += 3) for (let x = x1 + 1 + (y % 2); x < x2; x += 3) b.px(x, y, 'R');
  b.box(x1 - 1, y1 - 1, x2 - x1 + 3, 3, 't'); lightRect(b, x1, y1, x2 - x1 + 1, 1, 0.4);
}

function drawHookRail(b, h) {
  const x1 = q(h.x1) - 3, x2 = q(h.x2) + 3, y = q(h.y);
  b.box(x1, y - 5, x2 - x1, 4, 'R');
  for (let x = x1 + 6; x < x2 - 2; x += 14) b.box(x, y - 1, 3, 3, 'h');
}

function drawSocket(b, x, y) { b.box(x - 3, y - 3, 6, 7, 'w'); b.vline(x - 1, y - 1, 2, 'o'); b.vline(x + 1, y - 1, 2, 'o'); }

function drawTeaTable(b, cx, top, w, bot) {
  cx = q(cx); const half = q(w) / 2, ty = q(top), by = q(bot);
  shadeRect(b, cx - half + 2, by + 1, half * 2 - 3, 2, 0.24 * DARK);
  [cx - half + 3, cx + half - 8].forEach(x => shadeRect(b, x, by, 6, 2, 0.3 * DARK));
  b.box(cx - half + 4, ty + 4, 3, by - ty - 4, 'w'); b.box(cx + half - 7, ty + 4, 3, by - ty - 4, 'w');
  block(b, cx - half, cx + half, ty, ty + 4, 4, 'p', { noSide: true });
  for (let x = cx - half + 3; x < cx + half - 1; x += 5) b.px(x, ty + 2, 'w');
  [[cx - half - 9, 'e'], [cx + half + 9, 'y']].forEach(([sx, c]) => { shadeRect(b, sx - 5, by + 1, 11, 1, 0.24 * DARK); shadeRect(b, sx - 2, by, 5, 1, 0.3 * DARK); block(b, sx - 6, sx + 6, by - 6, by - 4, 2, c, { noSide: true }); b.vline(sx, by - 3, 4, 'o'); });
}

function drawStackedBoxes(b) {
  floorShadow(b, 276, 315, 139); shadeRect(b, 276, 138, 5, 3, 0.22 * DARK);
  [[281, 118, 30, 22, 'BOOKS'], [284, 97, 26, 21, 'STUFF'], [287, 80, 21, 17, 'MISC']].forEach(([x, y, w, h, label], i) => {
    block(b, x, x + w - 1, y, y + h - 1, 6, 'r');
    if (i < 2) shadeRect(b, x + 3, y + 1, w - 4, 2, 0.22);                        // the box above sits on this one
    b.rect(x + Math.floor(w / 2) - 1, y + 1, 3, h - 2, 'y');
    miniText(b, x + Math.round((w - miniWidth(label)) / 2), y + Math.floor(h / 2) - 2, label, 'o');
  });
}

function ceilingStars(b) { [[70, 13], [110, 12], [150, 13], [200, 12], [240, 13]].forEach(([x, y]) => stamp(b, x - 1, y - 1, ['.#.', '###', '.#.'], 'e')); }

function hangString(b, x, toY) { b.vline(x, RA.WY1, Math.max(1, toY - RA.WY1), 'o'); }

/* ---------- one background per chapter ---------- */

function bgNursery(b, L) {
  DARK = 1.35;
  roomShell(b, { ceil: '#fbf1d8', side: '#ecd9ac', side2: '#e5d09e', sideShade: '#dcc490', wall: '#f7e8c4', dots: '#c9b8e0', floor: '#d9b48a', floor2: '#c29a6c', pattern: 'stars' });
  ceilingStars(b);
  lightBeam(b, 1, 'night'); windowGlow(b, 'night');
  drawWindow(b, 'night', 'b');
  drawDoor(b, 'p', 'baby');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'w');
  drawDresser(b, L.dresser, 'b');
  drawSocket(b, q(L.socket.x), q(L.socket.y) + 2);
  drawRug(b, 160, 129, 50, 9, 'e', 'w');
  drawCot(b, L.cot);
  hangString(b, q(L.mobile.x), Math.round((L.mobile.y - ITEM_DEFS.mobile.h / 2) / ART));
  windowLight(b, 'night');
}

function bgChildhood(b, L) {
  DARK = 1;
  roomShell(b, { ceil: '#fbeeee', side: '#e5bcc0', side2: '#ddb2b7', sideShade: '#d3a5ab', wall: '#f0d0d2', dots: '#fbeeee', dots2: '#e3a0b2', floor: '#dcb48a', floor2: '#c59a6e', pattern: 'dots' });
  lightBeam(b, 2, 'day'); windowGlow(b, 'day');
  drawWindow(b, 'day', 'w');
  drawDoor(b, 'w', 'letters');
  drawHookRail(b, L.hooks);
  drawBookshelf(b, L.shelf, 'y');
  drawRug(b, 160, 130, 55, 9, 'L', 'w');
  drawBed(b, L.bed, 'flowers');
  drawTeaTable(b, 640, 476, 240, 530);
  drawToyBox(b, L.toybox);
  windowLight(b, 'day');
}

function bgTween(b, L) {
  DARK = 1;
  roomShell(b, { ceil: '#f2eef8', side: '#cdc2e2', side2: '#c4b8db', sideShade: '#b9acd2', wall: '#ddd5ec', dots: '#bcaadd', dots2: '#9fcfc6', floor: '#d6ae86', floor2: '#bf956b', pattern: 'butterflies' });
  lightBeam(b, 2, 'afternoon'); windowGlow(b, 'afternoon');
  drawWindow(b, 'afternoon', 'y');
  drawDoor(b, 'l', 'butterfly');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'w');
  drawRug(b, 160, 130, 45, 8, 'a', 'w');
  drawDesk(b, L.desk, { lamp: 'P', chair: 'A', drawer: 'L' });
  drawBed(b, L.bed, 'butterflies');
  windowLight(b, 'afternoon');
}

function bgTeen(b, L) {
  DARK = 1;
  roomShell(b, { ceil: '#eef6f3', side: '#a3c6be', side2: '#99bdb5', sideShade: '#8fb2aa', wall: '#c0dcd5', dots: '#b0d0c8', dots2: '#f4fbf8', floor: '#c69f7a', floor2: '#ae8762', pattern: 'stripes' });
  lightBeam(b, 2, 'dusk'); windowGlow(b, 'dusk');
  drawWindow(b, 'dusk', 'v');
  drawDoor(b, 'w', 'keepout');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'V');
  drawRug(b, 175, 130, 38, 8, 'P', 'o');
  drawDesk(b, L.desk, { lamp: 'V', chair: 'v', drawer: 'A' });
  drawBed(b, L.bed, 'messy');
  drawBasket(b, L.basket);
  windowLight(b, 'dusk');
}

function bgYoungAdult(b, L) {
  DARK = 1;
  roomShell(b, { ceil: '#fffdf6', side: '#e7e1cf', side2: '#dfd8c2', sideShade: '#d6cdb4', wall: '#f3efe2', dots: '#e8e2cf', dots2: '#d9c9f5', floor: '#d8b896', floor2: '#c3a07e', pattern: 'plain' });
  lightBeam(b, 3, 'morning'); windowGlow(b, 'morning');
  drawWindow(b, 'morning', null);
  drawDoor(b, 'w', 'wreath');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'R');
  drawRug(b, 160, 130, 52, 9, 'g', 'L');
  drawDesk(b, L.desk, { col: 'c', chair: 'R', drawer: 'g' });
  drawBed(b, L.bed, 'linen');
  windowLight(b, 'morning');
}

function bgMovingOut(b, L) {
  DARK = 1;
  roomShell(b, { ceil: '#fffdf6', side: '#e7e1cf', side2: '#dfd8c2', sideShade: '#d6cdb4', wall: '#f3efe2', dots: '#e8e2cf', dots2: '#d9c9f5', floor: '#d8b896', floor2: '#c3a07e', pattern: 'plain' });
  lightBeam(b, 4, 'morning'); windowGlow(b, 'morning');
  drawWindow(b, 'morning', null);
  drawDoor(b, 'w', null);
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'R');
  drawDesk(b, L.desk, { col: 'c', chair: 'R', drawer: 'g' });
  drawBed(b, L.bed, 'bare');
  drawStackedBoxes(b);
  windowLight(b, 'morning');
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

/* ---------- title-screen wallpaper: a Windows XP-style hill, redrawn in pixels in our colours ---------- */
function drawDeskBg() {
  const W = ART_W, H = 240, b = new PixBuf(W, H, 0);   // 320 x 240 art grid = the 4:3 stage at 4 screen px per pixel
  const clamp = (v, a, z) => Math.max(a, Math.min(z, v));
  const hash = (x, y) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  // pick from a colour ramp with ordered dithering between neighbours (t: 0..1)
  const pick = (pal, t, x, y) => {
    const v = clamp(t, 0, 1) * (pal.length - 1), i = Math.min(pal.length - 2, Math.floor(v)), f = v - i;
    return (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16 < f ? pal[i + 1] : pal[i];
  };
  const ridge = x => 128 - 24 * Math.exp(-Math.pow((x - 110) / 140, 2));

  // sky: brand blue at the top, fading to warm peach at the horizon
  const SKY = ['#2fa9f2', '#55bff8', '#82d3fb', '#b0e3fd', '#d9f0fb', '#fff0e0', '#ffd9b8'];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) b.px(x, y, pick(SKY, Math.pow(y / 128, 1.25), x, y));

  // clouds: soft dithered edges, white on top with a pink-lilac underside
  const puff = (cx, cy, rx, ry, col, strength) => {
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++) for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
      if (d <= 1 && BAYER4[(y & 3) * 4 + (x & 3)] < (1 - d) * strength) b.px(x, y, col);
    }
  };
  const cloud = (list) => {
    list.forEach(([cx, cy, rx, ry]) => puff(cx, cy + Math.max(1, ry * 0.45), rx, ry, '#ffd3ec', 22));
    list.forEach(([cx, cy, rx, ry]) => puff(cx, cy, rx, ry * 0.9, '#ffffff', 24));
  };
  cloud([[44, 86, 38, 7], [80, 79, 42, 10], [116, 85, 34, 7], [62, 70, 26, 8], [98, 68, 22, 7], [136, 90, 26, 5]]);
  cloud([[252, 74, 50, 9], [286, 64, 40, 7], [226, 88, 36, 6], [270, 84, 30, 5]]);
  cloud([[40, 34, 56, 2], [86, 44, 64, 2], [22, 54, 44, 3], [170, 24, 64, 2], [214, 46, 52, 2], [300, 38, 36, 2], [180, 102, 50, 3]]);

  // the hill: lime highlights fading into deeper greens, lit from the upper left
  const GRASS = ['#e6f77e', '#c6f04a', '#8de328', '#6cca2a', '#4fb030', '#3a9532', '#2b7a33'];
  for (let x = 0; x < W; x++) {
    const r = Math.round(ridge(x));
    for (let y = r; y < H; y++) {
      const u = (y - r) / (H - r);
      const wave = 0.09 * Math.sin(x / 34 + y / 21) + 0.05 * Math.sin(x / 13 - y / 9);
      const glow = 0.22 * Math.exp(-Math.pow((x - 90) / 95, 2) - Math.pow((y - r) / 34, 2));
      const grain = (hash(x >> 1, y) - 0.5) * 0.2;
      const t = 0.1 + 0.62 * u + 0.16 * (x / W) + wave - glow + grain;
      b.px(x, y, y === r ? '#f4ffa6' : pick(GRASS, t, x, y));
    }
  }
  // a few tiny flowers in the foreground, in the team's colours
  const FL = ['#ff84e4', '#ffc700', '#ff5400', '#ffffff'];
  for (let i = 0; i < 34; i++) {
    const x = Math.floor(hash(i, 7) * W), r = Math.round(ridge(x)), y = Math.floor(r + (H - r) * (0.4 + 0.58 * hash(i, 13)));
    b.px(x, y, FL[i % FL.length]);
  }
  return b.toCanvas(1);
}
