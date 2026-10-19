/* =========================================================
   room.js: the one bedroom, redrawn as pixel art for every
   chapter. Each background is painted once into a 320 x 180
   pixel buffer and cached. Layout numbers come from data.js
   (1280-wide world) and are divided by 4 into art pixels.
   ========================================================= */
'use strict';

const RA = { LX: 5, RX: 315, CY: 11, WX1: 42, WX2: 277, WY1: 16, WY2: 105, FY: 141 };
const q = v => Math.round(v / ART);

/* vertical gradient between 3 colours, one smooth step per row (no dithering) */
const mixHex = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
function skyGrad(b, x, y, w, h, cols) {
  for (let j = 0; j < h; j++) {
    const t = j / Math.max(1, h - 1);
    b.rect(x, y + j, w, 1, t < 0.5 ? mixHex(cols[0], cols[1], t * 2) : mixHex(cols[1], cols[2], (t - 0.5) * 2));
  }
}

/* soft effects drawn later at full resolution (smooth, not pixel): set while a room is built */
let ROOM_FX = {};

function stamp(b, x, y, rows, c, clip) {
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#' && (!clip || clip(x + i, y + j))) b.px(x + i, y + j, c); });
}

/* ---------- walls, floor & wallpaper ---------- */

function roomShell(b, th) {
  const { LX, RX, CY, WX1, WX2, WY1, WY2, FY } = RA;
  b.rect(0, 0, ART_W, ART_H, '#fbfaf6');   // around the room: the frame's window face, not part of the room
  b.poly([[LX, CY], [RX + 1, CY], [WX2 + 1, WY1], [WX1, WY1]], th.ceil);
  b.poly([[LX, CY], [WX1, WY1], [WX1, WY2 + 1], [LX, FY + 1]], th.side);
  b.poly([[WX2 + 1, WY1], [RX + 1, CY], [RX + 1, FY + 1], [WX2 + 1, WY2 + 1]], th.side2 || th.side);
  b.rect(WX1, WY1, WX2 - WX1 + 1, WY2 - WY1 + 1, th.wall);
  wallpaper(b, th);
  lowerWall(b, th.lower);
  drawFloor(b, th.floor);
  const xl = y => WX1 + (LX - WX1) * (y - WY2) / (FY - WY2), xr = y => WX2 + (RX - WX2) * (y - WY2) / (FY - WY2);
  for (let y = WY2 + 1; y <= WY2 + 2; y++) b.hline(Math.ceil(xl(y)), y, Math.floor(xr(y)) - Math.ceil(xl(y)) + 1, th.floor.shadow);   // soft shadow under the wall
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

/* the floor, in perspective. Each room has its own: f.style is
   plaid (gingham carpet), checker (tiles), harlequin (diamonds), tiles (big glossy tiles),
   carpet (speckled wall-to-wall) or planks (floorboards); f.c are its colours */
function drawFloor(b, f) {
  const { LX, RX, WX1, WX2, WY2, FY } = RA;
  const xl = y => WX1 + (LX - WX1) * (y - WY2) / (FY - WY2), xr = y => WX2 + (RX - WX2) * (y - WY2) / (FY - WY2);
  const c = f.c;
  b.poly([[WX1, WY2 + 1], [WX2 + 1, WY2 + 1], [RX + 1, FY + 1], [LX, FY + 1]], c[0]);
  // rows get deeper towards you; v is a smooth "how far back" coordinate (row number + fraction)
  const rowsOf = edges => y => { let k = 0; while (k < edges.length - 2 && y >= edges[k + 1]) k++; return k + (y - edges[k]) / (edges[k + 1] - edges[k]); };
  const each = fn => { for (let y = WY2 + 1; y <= FY; y++) { const a = xl(y), w = xr(y) - a; for (let x = Math.ceil(a); x <= Math.floor(xr(y)); x++) fn(x, y, (x - a) / w); } };
  const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
  if (f.style === 'plaid') {
    const v = rowsOf([WY2 + 1, 107, 109, 112, 115, 119, 123, 128, 133, 139, 142]);
    each((x, y, u) => b.px(x, y, c[(Math.floor(v(y)) % 2) * 2 + Math.floor(u * 16) % 2]));
  } else if (f.style === 'checker') {
    const v = rowsOf([WY2 + 1, 109, 113, 118, 124, 131, 142]);
    each((x, y, u) => { if ((Math.floor(v(y)) + Math.floor(u * 12)) % 2) b.px(x, y, c[1]); });
  } else if (f.style === 'harlequin') {
    const v = rowsOf([WY2 + 1, 111, 118, 127, 142]);
    each((x, y, u) => {
      const U = u * 9, V = v(y), fu = U - Math.floor(U) - 0.5, fv = V - Math.floor(V) - 0.5;
      if (Math.abs(fu) + Math.abs(fv) < 0.5) b.px(x, y, c[1]);
      if (Math.abs(fu) + Math.abs(fv) > 0.47 && Math.abs(fu) + Math.abs(fv) < 0.53) b.px(x, y, c[2]);
    });
  } else if (f.style === 'tiles') {
    const v = rowsOf([WY2 + 1, 112, 120, 130, 142]);
    each((x, y, u) => {
      const U = u * 7, V = v(y), fu = U - Math.floor(U), fv = V - Math.floor(V);
      if ((Math.floor(U) + Math.floor(V)) % 2) b.px(x, y, c[1]);
      if (fu < 0.04 || fv < 0.1) b.px(x, y, c[2]);                       // white grout
      else if (fu > 0.18 && fu < 0.3 && fv > 0.25 && fv < 0.75) b.px(x, y, c[3]);   // a shine on each tile
    });
  } else if (f.style === 'carpet') {
    each((x, y) => { const h = hash(x, y) % 13; if (h === 0) b.px(x, y, c[1]); else if (h === 1) b.px(x, y, c[2]); });
  } else {   // planks
    const rows = [WY2 + 1, 110, 116, 123, 131, 141];
    rows.slice(1, -1).forEach(y => b.hline(Math.ceil(xl(y)), y, Math.floor(xr(y)) - Math.ceil(xl(y)) + 1, c[1]));
    const spread = (RX - LX) / (WX2 - WX1);
    for (let k = 0; k < rows.length - 1; k++) {
      for (let xb = WX1 + (k % 2 ? 22 : 8); xb < WX2; xb += 30) {
        const xf = 160 + (xb - 160) * spread, at = y => xb + (xf - xb) * (y - WY2) / (FY - WY2);
        b.line(at(rows[k] + 1), rows[k] + 1, at(rows[k + 1] - 1), rows[k + 1] - 1, c[1]);
      }
    }
    if (c[2]) rows.slice(0, -1).forEach((y, k) => b.hline(Math.ceil(xl(y + 1)) + 3, y + 1, Math.floor(xr(y + 1)) - Math.ceil(xl(y + 1)) - 6, c[2]));   // a light edge on each board
  }
}

function wallpaper(b, th) {
  const { WX1, WX2, WY1, WY2 } = RA;
  const clip = (x, y) => x > WX1 && x < WX2 && y > WY1 && y < WY2 - 3;
  if (th.bands) for (let y = WY1 + 4; y < WY2 - 3; y += 10) b.rect(WX1 + 1, y, WX2 - WX1 - 1, 5, th.bands);
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
  // a wallpaper border under the ceiling (its own motif in each room that has one)
  const bd = th.border;
  if (bd) {
    b.rect(WX1 + 1, WY1 + 1, WX2 - WX1 - 1, 6, bd.c[0]);
    b.hline(WX1 + 1, WY1 + 7, WX2 - WX1 - 1, bd.c[1]);
    if (bd.style === 'hearts') for (let x = WX1 + 4; x < WX2 - 5; x += 10) stamp(b, x, WY1 + 2, ['##.##', '#####', '.###.', '..#..'], bd.c[1]);
    else for (let x = WX1 + 4; x < WX2 - 2; x += 8) stamp(b, x, WY1 + 3, ['##', '##'], bd.c[1]);
  }
  // ghost marks: lighter patches where posters and frames used to hang (the room being packed up)
  if (th.ghosts) th.ghosts.forEach(([x, y, w, h]) => {
    b.rect(x, y, w, h, th.ghostCol); b.px(x, y, 'w'); b.px(x + w - 1, y, 'w'); b.px(x + 1, y, 'w'); b.px(x + w - 2, y, 'w');
  });
}

/* the lower part of the walls, different in each room: beadboard, candy stripes under a scalloped rail,
   or pinstripes under a ribbon (l.c: base, line, side-wall base) */
function lowerWall(b, l) {
  if (!l) return;
  const { LX, RX, WX1, WX2, WY2, FY } = RA, top = WY2 - (l.h || 24), H = WY2 - top, front = FY - Math.round(H * 1.46);
  b.rect(WX1 + 1, top, WX2 - WX1 - 1, H, l.c[0]);
  b.poly([[WX1, top], [WX1, WY2], [LX, FY], [LX, front]], l.c[2]);
  b.poly([[WX2 + 1, top], [RX + 1, front], [RX + 1, FY], [WX2 + 1, WY2]], l.c[2]);
  if (l.style === 'beadboard') {
    for (let x = WX1 + 3; x < WX2 - 1; x += 4) b.vline(x, top + 2, H - 2, l.c[1]);
    b.rect(WX1 + 1, top - 2, WX2 - WX1 - 1, 2, 'w'); b.hline(WX1 + 1, top, WX2 - WX1 - 1, l.c[1]);
  } else if (l.style === 'stripes') {
    for (let x = WX1 + 2; x < WX2 - 1; x += 6) b.rect(x, top + 2, 3, H - 2, l.c[1]);
    b.rect(WX1 + 1, top - 2, WX2 - WX1 - 1, 3, 'w');
    for (let x = WX1 + 2; x < WX2 - 3; x += 5) { b.hline(x, top + 1, 3, 'w'); b.px(x + 1, top + 2, 'w'); }   // scalloped edge
  } else if (l.style === 'pinstripe') {
    for (let y = top + 3; y < WY2 - 2; y += 3) b.hline(WX1 + 1, y, WX2 - WX1 - 1, l.c[1]);
    b.rect(WX1 + 1, top - 1, WX2 - WX1 - 1, 2, l.c[3] || 'w');
  }
  b.line(WX1, top - 1, LX, front - 1, 'w'); b.line(WX1, top, LX, front, l.c[1]);
  b.line(WX2, top - 1, RX, front - 1, 'w'); b.line(WX2, top, RX, front, l.c[1]);
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
  if (curtain) drawCurtains(b, typeof curtain === 'string' ? { style: 'panels', c: curtain } : curtain);
}

/* curtains, a different kind in each room: tie-backs with a scalloped valance, café curtains,
   a bead curtain, straight panels on rings, a roller blind, or just the bare rod */
function drawCurtains(b, cu) {
  const x1 = 136, x2 = 183, c = cu.c;
  const outlinePoly = pts => { for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; b.line(ax, ay, bx, by, 'o'); } };
  const rod = () => b.box(x1 - 13, 19, x2 - x1 + 27, 3, 'w');
  const rings = (xs) => xs.forEach(x => { b.px(x, 21, 'o'); b.px(x, 22, 'o'); });
  const mirror = pts => pts.map(([x, y]) => [x1 + x2 - x, y]);
  if (cu.style === 'tieback') {
    rod();
    const left = [[x1 - 11, 22], [x1 + 7, 22], [x1 + 2, 38], [x1 - 3, 49], [x1 + 1, 60], [x1 + 4, 74], [x1 - 11, 74]];
    [left, mirror(left)].forEach(pts => { b.poly(pts, c); outlinePoly(pts); });
    [[x1 - 7, 26, 22], [x1 - 4, 54, 18], [x2 + 7, 26, 22], [x2 + 4, 54, 18]].forEach(([x, y, h]) => b.vline(x, y, h, cu.c2 || 'B'));
    [[x1 - 11, 48], [x2 - 2, 48]].forEach(([x, y]) => b.box(x, y, 14, 3, 'w'));   // the tie-backs
    b.rect(x1 - 12, 21, x2 - x1 + 25, 5, c);
    for (let x = x1 - 12; x <= x2 + 12; x += 6) { b.hline(x + 1, 26, 4, c); b.hline(x + 2, 27, 2, c); b.px(x, 26, 'o'); b.px(x + 1, 27, 'o'); b.px(x + 4, 27, 'o'); b.hline(x + 2, 28, 2, 'o'); }
    b.hline(x1 - 12, 20, x2 - x1 + 25, 'o');
  } else if (cu.style === 'cafe') {
    b.rect(x1 - 1, 44, x2 - x1 + 3, 1, 'o');
    [[x1 + 2, 159], [161, x2 - 2]].forEach(([a, z]) => {
      b.rect(a, 45, z - a + 1, 22, c);
      for (let x = a + 2; x < z; x += 4) b.vline(x, 47, 19, cu.c3 || 'g');
      b.rect(a, 63, z - a + 1, 2, cu.c2);
      b.vline(a - 1, 45, 22, 'o'); b.vline(z + 1, 45, 22, 'o');
    });
    b.rect(x1 - 6, 20, x2 - x1 + 13, 5, cu.c2); b.hline(x1 - 6, 19, x2 - x1 + 13, 'o');
    for (let x = x1 - 6; x <= x2 + 6; x += 4) { b.hline(x, 25, 3, cu.c2); b.px(x + 1, 26, cu.c2); b.px(x + 3, 25, 'o'); b.px(x, 26, 'o'); b.px(x + 2, 26, 'o'); b.px(x + 1, 27, 'o'); }
  } else if (cu.style === 'beads') {
    rod();
    const cols = cu.beads;
    for (let side = 0; side < 2; side++) for (let k = 0; k < 6; k++) {
      const x = side ? x2 + 11 - k * 3 : x1 - 11 + k * 3, len = 50 - k * 4;
      b.vline(x, 22, len, 'o');
      for (let y = 24, n = 0; y < 22 + len; y += 3, n++) b.px(x, y, cols[(n + k) % cols.length]);
    }
  } else if (cu.style === 'panels') {
    rod();
    const left = [[x1 - 10, 22], [x1 + 6, 22], [x1 + 3, 40], [x1 + 7, 60], [x1 + 3, 74], [x1 - 10, 74]];
    [left, mirror(left)].forEach(pts => {
      b.poly(pts, c);
      const xs = pts.map(p => p[0]), mx = (Math.min(...xs) + Math.max(...xs)) / 2;
      b.vline(Math.round(mx) - 2, 24, 48, 'o'); b.vline(Math.round(mx) + 3, 26, 46, 'o');
      outlinePoly(pts);
    });
    rings([x1 - 8, x1 - 3, x1 + 2, x2 - 2, x2 + 3, x2 + 8]);
  } else if (cu.style === 'blind') {
    b.box(x1 - 2, 22, x2 - x1 + 5, 4, 'w');
    b.rect(x1 + 1, 26, x2 - x1 - 1, 6, c);
    b.hline(x1 + 1, 28, x2 - x1 - 1, cu.c2); b.hline(x1 + 1, 30, x2 - x1 - 1, cu.c2);
    b.box(x1, 32, x2 - x1 + 1, 2, 'w');
    b.vline(x2 - 6, 34, 9, 'o'); b.box(x2 - 7, 43, 3, 3, 'w');
  } else {   // bare: the curtains are packed, only the rod and its rings are left
    rod(); rings([x1 - 9, x1 - 5, x1 - 1, x2 + 1, x2 + 5, x2 + 9]);
  }
}

function lightBeam(b, level) { ROOM_FX.beam = level || 3; }   // drawn as a soft, smooth beam of light (see drawRoomGlow)

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
  drawChair(b, x1, top, bot, o.chair || 'P', o.chairStyle);
  if (o.lamp) {
    const lx = x2 - 4;
    b.box(lx - 4, top - 2, 8, 2, o.lamp);
    b.line(lx, top - 3, lx - 3, top - 12, 'o'); b.line(lx - 3, top - 12, lx + 1, top - 17, 'o');
    b.poly([[lx - 2, top - 17], [lx + 6, top - 21], [lx + 9, top - 14]], o.lamp);
    b.line(lx - 2, top - 17, lx + 6, top - 21, 'o'); b.line(lx + 6, top - 21, lx + 9, top - 14, 'o'); b.line(lx + 9, top - 14, lx - 2, top - 17, 'o');
  }
  if (o.papers) [[x1 + 4, 'w'], [x1 + 14, 'g'], [x1 + 24, 'w']].forEach(([x, c]) => { b.rect(x, top - 1, 8, 1, c); b.hline(x, top - 2, 8, 'o'); });
}

// the desk chair, a different shape in each room: a plain chair, a round-backed one, a swivel chair or a café chair
function drawChair(b, x1, top, bot, col, style) {
  if (style === 'round') {
    b.ell(x1 + 16, top + 11, 9, 7, col); b.ring(x1 + 16, top + 11, 9, 7, 'o'); b.ring(x1 + 16, top + 11, 6, 4, 'w');
    b.box(x1 + 6, top + 18, 21, 4, col);
    b.line(x1 + 9, top + 22, x1 + 7, bot, 'o'); b.line(x1 + 23, top + 22, x1 + 25, bot, 'o');
  } else if (style === 'swivel') {
    b.box(x1 + 9, top + 2, 15, 16, col); b.rect(x1 + 10, top + 3, 13, 3, 'L');
    b.box(x1 + 6, top + 18, 21, 4, col);
    b.box(x1 + 15, top + 22, 3, bot - top - 26, 'D');
    b.line(x1 + 16, bot - 4, x1 + 7, bot - 1, 'o'); b.line(x1 + 16, bot - 4, x1 + 25, bot - 1, 'o'); b.vline(x1 + 16, bot - 4, 4, 'o');
    [[x1 + 6, bot - 1], [x1 + 25, bot - 1], [x1 + 16, bot]].forEach(([x, y]) => b.rect(x, y - 1, 2, 2, 'o'));
  } else if (style === 'cafe') {
    b.box(x1 + 7, top + 4, 19, 4, col);
    [x1 + 9, x1 + 15, x1 + 21].forEach(x => b.box(x, top + 7, 3, 12, col));
    b.box(x1 + 6, top + 18, 21, 4, col);
    b.line(x1 + 8, top + 22, x1 + 7, bot, 'o'); b.line(x1 + 24, top + 22, x1 + 25, bot, 'o');
  } else {
    b.box(x1 + 8, top + 6, 17, 13, col); b.box(x1 + 6, top + 18, 21, 4, col);
    b.vline(x1 + 8, top + 22, bot - top - 22, 'o'); b.vline(x1 + 24, top + 22, bot - top - 22, 'o');
  }
}

function drawRug(b, cx, cy, rx, ry, c1, c2) {
  b.ell(cx, cy, rx, ry, c1);
  b.ring(cx, cy, rx - 4, ry - 2.5, c2);
  b.ring(cx, cy, rx, ry, 'o');
}

/* a rug of any shape: inside(x, y) says what's rug; the edge is outlined and a trim runs just inside it */
function shapeRug(b, inside, box, fill, trim) {
  const [X0, Y0, X1, Y1] = box;
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
    if (!inside(x, y)) continue;
    if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) b.px(x, y, 'o');
    else if (trim && !(inside(x - 3, y) && inside(x + 3, y) && inside(x, y - 2) && inside(x, y + 2))) b.px(x, y, trim);
    else b.px(x, y, fill);
  }
}
const inEll = (x, y, cx, cy, rx, ry) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
function cloudRug(b, cx, cy, fill, trim) {
  const parts = [[cx, cy + 1, 36, 6], [cx - 20, cy - 3, 14, 5], [cx - 1, cy - 4, 16, 5.5], [cx + 19, cy - 3, 14, 5]];
  shapeRug(b, (x, y) => parts.some(([a, c, rx, ry]) => inEll(x, y, a, c, rx, ry)), [cx - 40, cy - 10, cx + 40, cy + 8], fill, trim);
}
function flowerRug(b, cx, cy, rx, ry, fill, trim) {   // a round rug with twelve round petals on its edge
  const petals = Array.from({ length: 12 }, (_, k) => { const a = k * Math.PI / 6; return [cx + Math.cos(a) * rx * 0.9, cy + Math.sin(a) * ry * 0.86]; });
  shapeRug(b, (x, y) => inEll(x, y, cx, cy, rx * 0.9, ry * 0.86) || petals.some(([px, py]) => inEll(x, y, px, py, rx * 0.15, ry * 0.32)),
    [cx - rx - 4, cy - ry - 3, cx + rx + 4, cy + ry + 3], fill, trim);
}
function starRug(b, cx, cy, r, sy, fill, inner) {
  const star = k => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 * k : r * k; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * sy]; });
  const pts = star(1);
  b.poly(pts, fill);
  for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; b.line(Math.round(ax), Math.round(ay), Math.round(bx), Math.round(by), 'o'); }
  b.poly(star(0.42), inner);
}
function fuzzyRug(b, cx, cy, rx, ry, fill, trim, speck) {
  const h = x => ((x * 2654435761) >>> 0) % 3;   // a ragged, furry edge
  shapeRug(b, (x, y) => { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1 + 0.07 * (h(x + y * 7) - 1); },
    [cx - rx - 3, cy - ry - 2, cx + rx + 3, cy + ry + 2], fill, trim);
  if (speck) for (let y = cy - ry + 2; y < cy + ry - 1; y++) for (let x = cx - rx + 4; x < cx + rx - 4; x++) if (((x * 31 + y * 17) % 11) === 0 && inEll(x, y, cx, cy, rx - 4, ry - 2)) b.px(x, y, speck);
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

/* ---------- one background per chapter ----------
   Colours and style from Chloee's moodboard (its swatches, Cyworld / My Scene rooms) and the pastel pixel-room
   reference: soft striped walls, pastel plaid carpets for the younger rooms, wood for the older ones.
   The pastels are soft and slightly greyed (about as saturated as the teen room's teal), pearly rather than candy. */

function bgNursery(b, L) {   // lemon + powder blue: beadboard, gingham carpet, a cloud rug, tie-back curtains
  roomShell(b, { ceil: '#faf8ea', side: '#eae2b8', side2: '#e7deb1', wall: '#f3edcd', bands: '#f7f3de', dots: '#9cb6d3', pattern: 'stars',
    border: { style: 'dots', c: ['#d1dbe6', '#ffffff'] },
    lower: { style: 'beadboard', c: ['#d4dde8', '#b2c1d1', '#c6d0dd'] },
    floor: { style: 'plaid', c: ['#f7f2e3', '#d0dbe7', '#f3edcd', '#becbd9'], shadow: '#dbd4bd' } });
  ceilingStars(b);
  drawWindow(b, 'night', { style: 'tieback', c: 'b', c2: 'B' });
  drawDoor(b, 'p', 'baby');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'w');
  drawDresser(b, L.dresser, 'b');
  drawSocket(b, q(L.socket.x), q(L.socket.y) + 2);
  cloudRug(b, 160, 129, 'w', '#dbe7f3');
  drawCot(b, L.cot);
  hangString(b, q(L.mobile.x), Math.round((L.mobile.y - ITEM_DEFS.mobile.h / 2) / ART));
}

function bgChildhood(b, L) {   // pearl rose + lavender: candy stripes under a scalloped rail, a checkerboard floor, a flower rug, café curtains
  roomShell(b, { ceil: '#f6eaee', side: '#dabec8', side2: '#d6b8c3', wall: '#ead1da', dots: '#fcf7f9', dots2: '#d9a6b7', pattern: 'dots',
    border: { style: 'hearts', c: ['#dcd7e5', '#d9a6b7'] },
    lower: { style: 'stripes', c: ['#dcd6e6', '#cbc2da', '#cfc8da'] },
    floor: { style: 'checker', c: ['#f4ece6', '#e0cdd6'], shadow: '#d8c8cf' } });
  lightBeam(b, 2);
  drawWindow(b, 'day', { style: 'cafe', c: 'w', c2: '#e9b9c9', c3: '#f1e6ea' });
  drawDoor(b, 'w', 'letters');
  drawHookRail(b, L.hooks);
  drawBookshelf(b, L.shelf, 'y');
  flowerRug(b, 160, 130, 56, 9, '#ddd3f2', 'w');
  drawBed(b, L.bed, 'flowers');
  drawTeaTable(b, 640, 476, 240, 530);
  drawToyBox(b, L.toybox);
}

function bgTween(b, L) {   // silver lilac + soft aqua: pinstripes under a pink ribbon, harlequin floor, a star rug, a bead curtain, a round chair
  roomShell(b, { ceil: '#f2edf7', side: '#c9bcd7', side2: '#c3b6d2', wall: '#dbd0e7', dots: '#e3b5cc', dots2: '#8ecacc', pattern: 'butterflies',
    lower: { style: 'pinstripe', h: 22, c: ['#d2e4e2', '#bdd6d3', '#c5d8d6', '#e3b5cc'] },
    floor: { style: 'harlequin', c: ['#f2f1f9', '#dfd8ee', '#c6dfe0'], shadow: '#d5d0e3' } });
  lightBeam(b, 2);
  drawWindow(b, 'afternoon', { style: 'beads', beads: ['#e3b5cc', '#8ecacc', '#f1e3a6', '#c4b3e6'] });
  drawDoor(b, 'l', 'butterfly');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'w');
  starRug(b, 118, 131, 32, 0.26, '#cdeae6', '#f4fbfa');
  drawDesk(b, L.desk, { lamp: 'P', chair: 'A', chairStyle: 'round', drawer: 'L' });
  drawBed(b, L.bed, 'butterflies');
}

function bgTeen(b, L) {   // the teen teal: striped walls, big glossy tiles, a fluffy pink rug, purple panels on rings, a swivel chair
  roomShell(b, { ceil: '#eef6f3', side: '#a3c6be', side2: '#99bdb5', wall: '#c0dcd5', dots: '#b0d0c8', dots2: '#f4fbf8', pattern: 'stripes',
    floor: { style: 'tiles', c: ['#dcd6e8', '#d3cce2', '#f5f3f9', '#ebe7f4'], shadow: '#c3bcd3' } });
  lightBeam(b, 2);
  drawWindow(b, 'dusk', { style: 'panels', c: 'v' });
  drawDoor(b, 'w', 'keepout');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'V');
  fuzzyRug(b, 176, 130, 38, 8, 'P', 'p');
  drawDesk(b, L.desk, { lamp: 'V', chair: 'v', chairStyle: 'swivel', drawer: 'A', papers: true });
  drawBed(b, L.bed, 'messy');
  drawBasket(b, L.basket);
}

function bgYoungAdult(b, L) {   // pale blue: soft carpet, a white faux-fur rug by the bed, a roller blind, a café chair
  roomShell(b, { ceil: '#eef6fb', side: '#bcd5e8', side2: '#b4cee3', wall: '#d4e6f3', dots: '#e4f0f8', dots2: '#ffffff', pattern: 'plain',
    floor: { style: 'carpet', c: ['#ccd0e6', '#bec2dc', '#dcdeee'], shadow: '#b8bcd6' } });
  lightBeam(b, 3);
  drawWindow(b, 'morning', { style: 'blind', c: '#f6f8fc', c2: '#dfe5ef' });
  drawDoor(b, 'w', 'wreath');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'R');
  fuzzyRug(b, 104, 132, 36, 7, 'w', '#eef0f7', '#dfe2ee');
  drawDesk(b, L.desk, { col: 'c', chair: 'R', chairStyle: 'cafe', drawer: 'g' });
  drawBed(b, L.bed, 'linen');
}

function bgMovingOut(b, L) {   // the same room, packed up: bare pale floorboards, no rug, curtains down, marks where things hung
  roomShell(b, { ceil: '#eef6fb', side: '#bcd5e8', side2: '#b4cee3', wall: '#d4e6f3', dots: '#e4f0f8', dots2: '#ffffff', pattern: 'plain',
    ghosts: [[58, 36, 20, 15], [88, 42, 12, 16], [204, 28, 18, 13]], ghostCol: '#e6f0f8',
    floor: { style: 'planks', c: ['#ece5df', '#d6ccc4', '#f7f2ee'], shadow: '#d6ccc4' } });
  lightBeam(b, 4);
  drawWindow(b, 'morning', { style: 'bare' });
  drawDoor(b, 'w', null);
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'R');
  drawDesk(b, L.desk, { col: 'c', chair: 'R', chairStyle: 'cafe', drawer: 'g' });
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
