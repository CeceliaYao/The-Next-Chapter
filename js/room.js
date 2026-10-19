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

/* light effects drawn later on the same pixel grid (the window's light, glows): set while a room is built */
let ROOM_FX = {};

/* ---------- shading: one light from the upper left, three tones per surface ----------
   lit() for faces that catch the light (tops, left edges), dim() for faces in shadow (sides, undersides),
   both mixed towards white or towards the plum ink so every room shades the same way */
const INK = '#3d2c4a';
const hexOf = c => (c[0] === '#' ? c : PALETTE[c]);
const lit = (c, k) => mixHex(hexOf(c), '#ffffff', k == null ? 0.4 : k);
const dim = (c, k) => mixHex(hexOf(c), INK, k == null ? 0.2 : k);
let LINE2 = INK;   // the softer line for the room's own edges (walls, skirting), set per room: weaker than the outlines of things
function darkenAt(b, x, y, k) { const c = b.get(x, y); if (c && c !== 'o') b.px(x, y, dim(c, k)); }
// the shadow a piece of furniture casts on the floor: a band under it, pushed a little to the right
function castShadow(b, x1, x2, y, rows) { (rows || [0.22, 0.12]).forEach((k, i) => { for (let x = x1 + 1 + i; x <= x2 + 2 + i; x++) darkenAt(b, x, y + i, k); }); }
// which side of a piece we see: things right of the middle show their left side, things left of it their right side
const sideOf = (x1, x2) => ((x1 + x2) / 2 > 175 ? 'L' : (x1 + x2) / 2 < 145 ? 'R' : null);
/* a box with a lit top, a base-coloured front and a darker side, outlined in ink; returns the front's rectangle */
function block(b, x1, y1, x2, y2, col, o) {
  o = o || {};
  const d = o.depth == null ? 3 : o.depth, t = o.top == null ? 2 : o.top, side = o.side === undefined ? sideOf(x1, x2) : o.side;
  if (side === 'L') { b.poly([[x1 - d, y1 - t], [x1, y1], [x1, y2], [x1 - d, y2 - t]], dim(col, 0.24)); b.line(x1 - d, y1 - t, x1 - d, y2 - t, 'o'); b.line(x1 - d, y2 - t, x1, y2, 'o'); }
  if (side === 'R') { b.poly([[x2, y1], [x2 + d, y1 - t], [x2 + d, y2 - t], [x2, y2]], dim(col, 0.24)); b.line(x2 + d, y1 - t, x2 + d, y2 - t, 'o'); b.line(x2 + d, y2 - t, x2, y2, 'o'); }
  if (t > 0) {
    const l = side === 'L' ? x1 - d : x1, r = side === 'R' ? x2 + d : x2;
    b.rect(l, y1 - t, r - l + 1, t, o.topCol || lit(col, 0.42)); b.hline(l + 1, y1 - t, r - l - 1, lit(col, 0.6)); b.hline(l, y1 - t - 1, r - l + 1, 'o');
    if (side === 'L') b.line(x1 - d, y1 - t, x1, y1, 'o'); if (side === 'R') b.line(x2, y1, x2 + d, y1 - t, 'o');
    b.vline(l, y1 - t - 1, t + 1, 'o'); b.vline(r, y1 - t - 1, t + 1, 'o');
  }
  b.box(x1, y1, x2 - x1 + 1, y2 - y1 + 1, col);
  b.hline(x1 + 1, y1 + 1, x2 - x1 - 1, lit(col, 0.32));                 // the front's top edge catches the light
  if (y2 - y1 > 5) { b.hline(x1 + 1, y2 - 2, x2 - x1 - 1, dim(col, 0.1)); b.hline(x1 + 1, y2 - 1, x2 - x1 - 1, dim(col, 0.2)); }   // and its lower part turns away from it
  else b.hline(x1 + 1, y2 - 1, x2 - x1 - 1, dim(col, 0.15));
  if (side === 'R') b.vline(x2 - 1, y1 + 1, y2 - y1 - 1, dim(col, 0.08)); if (side === 'L') b.vline(x1 + 1, y1 + 1, y2 - y1 - 1, lit(col, 0.15));
  if (o.shine !== false) { b.px(x1 + 2, y1 + 2, 'w'); b.px(x1 + 3, y1 + 2, lit(col, 0.6)); b.px(x1 + 2, y1 + 3, lit(col, 0.6)); }   // one small, clear highlight
  return { x1, y1, x2, y2 };
}
// a drawer or door front set into a carcass: a dark seam round it, light along its top, a pull with a glint
function drawerFront(b, x, y, w, h, col, pull) {
  for (let i = x; i < x + w; i++) darkenAt(b, i, y + h, 0.3);   // the gap under the drawer, in shadow
  b.box(x, y, w, h, col);
  b.hline(x + 1, y + 1, w - 2, lit(col, 0.38)); b.vline(x + 1, y + 1, h - 2, lit(col, 0.22));
  b.hline(x + 1, y + h - 2, w - 2, dim(col, 0.2)); b.vline(x + w - 2, y + 2, h - 3, dim(col, 0.12));
  if (h > 6) b.hline(x + 2, y + h - 3, w - 4, dim(col, 0.08));
  const px = x + Math.floor(w / 2) - 2, py = y + Math.floor(h / 2) - 1;
  if (pull === 'knob') { b.rect(px + 1, py, 2, 2, 'o'); b.px(px + 1, py, 'w'); }
  else { b.rect(px, py, 4, 2, 'o'); b.rect(px + 1, py, 2, 1, lit(col, 0.75)); }
}

function stamp(b, x, y, rows, c, clip) {
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#' && (!clip || clip(x + i, y + j))) b.px(x + i, y + j, c); });
}

/* ---------- walls, floor & wallpaper ---------- */

function roomShell(b, th) {
  const { LX, RX, CY, WX1, WX2, WY1, WY2, FY } = RA;
  LINE2 = mixHex(th.wall, INK, 0.55);
  b.rect(0, 0, ART_W, ART_H, '#fbfaf6');   // around the room: the frame's window face, not part of the room
  b.poly([[LX, CY], [RX + 1, CY], [WX2 + 1, WY1], [WX1, WY1]], th.ceil);
  b.poly([[LX, CY], [WX1, WY1], [WX1, WY2 + 1], [LX, FY + 1]], th.side);
  b.poly([[WX2 + 1, WY1], [RX + 1, CY], [RX + 1, FY + 1], [WX2 + 1, WY2 + 1]], th.side2 || th.side);
  b.rect(WX1, WY1, WX2 - WX1 + 1, WY2 - WY1 + 1, th.wall);
  wallpaper(b, th);
  sidePanels(b, th);
  lowerWall(b, th.lower);
  drawFloor(b, th.floor);
  const xl = y => WX1 + (LX - WX1) * (y - WY2) / (FY - WY2), xr = y => WX2 + (RX - WX2) * (y - WY2) / (FY - WY2);
  // skirting board: a lit top, a white face, a shadow where it meets the floor
  b.rect(WX1, WY2 - 2, WX2 - WX1 + 1, 3, th.base || 'w'); b.hline(WX1, WY2 - 3, WX2 - WX1 + 1, LINE2);
  b.hline(WX1 + 1, WY2, WX2 - WX1 - 1, dim(th.base || 'w', 0.12));
  // ambient shading in steps: darker into the corners, under the ceiling and along the floor's edges
  for (let y = WY1 + 1; y < WY2 - 3; y++) [0.16, 0.1, 0.05, 0.02].forEach((k, i) => { darkenAt(b, WX1 + 1 + i, y, k); darkenAt(b, WX2 - 1 - i, y, k); });
  [0.16, 0.09, 0.04].forEach((k, i) => { for (let x = WX1 + 1; x < WX2; x++) darkenAt(b, x, WY1 + 1 + i, k); });
  [0.24, 0.15, 0.08, 0.03].forEach((k, i) => { const y = WY2 + 1 + i; for (let x = Math.ceil(xl(y)); x <= Math.floor(xr(y)); x++) darkenAt(b, x, y, k); });
  for (let y = WY2 + 1; y <= FY; y++) [0.14, 0.08, 0.03].forEach((k, i) => { darkenAt(b, Math.ceil(xl(y)) + i, y, k); darkenAt(b, Math.floor(xr(y)) - i, y, k); });
  // the side walls are darker towards the back corner, where less light reaches
  const sideAt = (x, top) => top ? CY + (WY1 - CY) * (x - LX) / (WX1 - LX) : FY + (WY2 - FY) * (x - LX) / (WX1 - LX);
  for (let i = 0; i < 4; i++) { const k = [0.14, 0.08, 0.04, 0.02][i];
    for (let y = Math.ceil(sideAt(WX1 - 1 - i, 1)); y < sideAt(WX1 - 1 - i, 0); y++) darkenAt(b, WX1 - 1 - i, y, k);
    const xr2 = WX2 + 1 + i, t = CY + (WY1 - CY) * (RX - xr2) / (RX - WX2), f = FY + (WY2 - FY) * (RX - xr2) / (RX - WX2);
    for (let y = Math.ceil(t); y < f; y++) darkenAt(b, xr2, y, k); }
  // the room's own edges: a softer line than the outlines of the things in it
  b.vline(WX1, WY1, WY2 - WY1 + 1, LINE2); b.vline(WX2, WY1, WY2 - WY1 + 1, LINE2);
  b.hline(WX1, WY1, WX2 - WX1 + 1, LINE2);
  b.line(WX1, WY2, LX, FY, LINE2); b.line(WX2, WY2, RX, FY, LINE2);
  b.line(WX1, WY1, LX, CY, LINE2); b.line(WX2, WY1, RX, CY, LINE2);
  // the walls have thickness: where the dollhouse is cut open, their cut faces show as light strips
  [[LX, th.side], [RX - 3, th.side2 || th.side]].forEach(([x, c]) => {
    b.rect(x, CY, 4, FY - CY + 1, lit(c, 0.55)); b.vline(x === LX ? x + 3 : x, CY, FY - CY + 1, dim(c, 0.08));
    b.vline(x === LX ? x + 4 : x - 1, CY, FY - CY + 1, LINE2);
  });
  b.rect(LX, CY, RX - LX + 1, 2, lit(th.ceil, 0.5)); b.hline(LX + 4, CY + 2, RX - LX - 7, LINE2);
  // the cut-away frame round the whole room stays in full ink
  b.rect(LX - 1, CY - 1, RX - LX + 3, 1, 'o'); b.rect(LX - 1, CY - 1, 1, FY - CY + 3, 'o'); b.rect(RX + 1, CY - 1, 1, FY - CY + 3, 'o');
  b.rect(LX - 1, FY + 1, RX - LX + 3, 2, 'o');
}

// a moulded panel on the upper part of each side wall, in perspective: lit on its lower edge, shaded on its upper one
function sidePanels(b, th) {
  const { LX, RX, CY, WX1, WX2, WY1, WY2, FY } = RA;
  const lowTop = th.lower ? (th.lower.h || 24) : 0;
  [[LX + 12, WX1 - 8, th.side], [WX2 + 8, RX - 12, th.side2 || th.side]].forEach(([a, z, c], side) => {
    const ceilY = x => side ? CY + (WY1 - CY) * (RX - x) / (RX - WX2) : CY + (WY1 - CY) * (x - LX) / (WX1 - LX);
    const floorY = x => side ? FY + (WY2 - FY) * (RX - x) / (RX - WX2) : FY + (WY2 - FY) * (x - LX) / (WX1 - LX);
    const scale = x => (floorY(x) - ceilY(x)) / (WY2 - WY1);
    const top = x => ceilY(x) + 8 * scale(x), bot = x => floorY(x) - (lowTop + 8) * scale(x);
    for (let x = a; x <= z; x++) for (let y = Math.ceil(top(x)); y <= Math.floor(bot(x)); y++) {
      const edgeT = y < top(x) + 1.2, edgeB = y > bot(x) - 1.2, edgeS = x === a || x === z;
      b.px(x, y, edgeT ? dim(c, 0.16) : edgeB ? lit(c, 0.45) : edgeS ? (x === a ? dim(c, 0.1) : lit(c, 0.3)) : lit(c, 0.12));
    }
  });
}

/* the floor, in perspective. Each room has its own: f.style is
   plaid (gingham carpet), checker (tiles), harlequin (diamonds) or planks (floorboards); f.c are its colours */
function drawFloor(b, f) {
  const { LX, RX, WX1, WX2, WY2, FY } = RA;
  const xl = y => WX1 + (LX - WX1) * (y - WY2) / (FY - WY2), xr = y => WX2 + (RX - WX2) * (y - WY2) / (FY - WY2);
  const c = f.c;
  b.poly([[WX1, WY2 + 1], [WX2 + 1, WY2 + 1], [RX + 1, FY + 1], [LX, FY + 1]], c[0]);
  // rows get deeper towards you; v is a smooth "how far back" coordinate (row number + fraction)
  const rowsOf = edges => y => { let k = 0; while (k < edges.length - 2 && y >= edges[k + 1]) k++; return k + (y - edges[k]) / (edges[k + 1] - edges[k]); };
  const each = fn => { for (let y = WY2 + 1; y <= FY; y++) { const a = xl(y), w = xr(y) - a; for (let x = Math.ceil(a); x <= Math.floor(xr(y)); x++) fn(x, y, (x - a) / w); } };
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
   pinstripes under a ribbon, or a flat two-tone block (l.c: base, line, side-wall base) */
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
  } else if (l.style === 'block') {   // a plain two-tone wall: a flat colour block under a white line
    b.rect(WX1 + 1, top - 1, WX2 - WX1 - 1, 2, 'w');
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
  ROOM_FX.sky = sky;   // the light it lets in (see buildFx in game.js)
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
  // the recess: the frame's inner top and left edges throw a shadow on the glass, in two steps
  for (let x = x1 + 3; x < x2 - 2; x++) { darkenAt(b, x, y1 + 3, 0.26); darkenAt(b, x, y1 + 4, 0.12); }
  for (let y = y1 + 3; y < y2 - 2; y++) { darkenAt(b, x1 + 3, y, 0.26); darkenAt(b, x1 + 4, y, 0.12); }
  // a chunky frame and mullions: lit faces, shaded lower and right edges
  const shade = '#e0d9e6', deep = '#c9c0d3';
  b.rect(x1, y1, x2 - x1 + 1, 3, 'w'); b.rect(x1, y2 - 2, x2 - x1 + 1, 3, 'w');
  b.rect(x1, y1, 3, y2 - y1 + 1, 'w'); b.rect(x2 - 2, y1, 3, y2 - y1 + 1, 'w');
  b.hline(x1 + 3, y1 + 2, x2 - x1 - 5, shade); b.vline(x2, y1 + 1, y2 - y1 - 1, shade); b.hline(x1 + 1, y2, x2 - x1, shade);
  b.rect(159, y1, 2, y2 - y1, 'w'); b.vline(160, y1 + 3, y2 - y1 - 5, shade);
  b.rect(x1, 45, x2 - x1, 2, 'w'); b.hline(x1 + 3, 46, x2 - x1 - 5, shade);
  b.hline(x1 - 1, y1 - 1, x2 - x1 + 3, 'o'); b.vline(x1 - 1, y1 - 1, y2 - y1 + 2, 'o'); b.vline(x2 + 1, y1 - 1, y2 - y1 + 2, 'o');
  // the sill: a lit top, a shaded front and its shadow on the wall
  b.box(x1 - 5, 67, x2 - x1 + 11, 6, 'w'); b.hline(x1 - 4, 68, x2 - x1 + 9, '#ffffff'); b.hline(x1 - 4, 70, x2 - x1 + 9, shade); b.hline(x1 - 4, 71, x2 - x1 + 9, deep);
  for (let x = x1 - 4; x <= x2 + 7; x++) { darkenAt(b, x, 73, 0.18); darkenAt(b, x + 1, 74, 0.09); }
  if (curtain) drawCurtains(b, typeof curtain === 'string' ? { style: 'panels', c: curtain } : curtain);
}

/* curtains, a different kind in each room: tie-backs with a scalloped valance, café curtains,
   a bead curtain, straight panels on rings, a roller blind, or just the bare rod */
function drawCurtains(b, cu) {
  const x1 = 136, x2 = 183, c = cu.c;
  const outlinePoly = pts => { for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; b.line(Math.round(ax), Math.round(ay), Math.round(bx), Math.round(by), 'o'); } };
  const mirror = pts => pts.map(([x, y]) => [x1 + x2 - x, y]);
  // a gathered panel: fabric falls in folds, each a lit ridge, a mid tone and a crease in shade
  const panel = (pts, col, step) => {
    const m = new PixBuf(ART_W, ART_H, 0); m.poly(pts, 'w');
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs);
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) for (let x = x0; x <= Math.max(...xs); x++) {
      if (!m.get(x, y)) continue;
      const k = (x - x0) % (step || 5);
      b.px(x, y, k === 0 ? lit(col, 0.4) : k >= (step || 5) - 2 ? dim(col, k === (step || 5) - 1 ? 0.24 : 0.12) : col);
    }
    outlinePoly(pts);
  };
  // a ruffled valance across the top: gathered folds and a scalloped hem
  const valance = (y, h, col) => {
    const a = x1 - 15, z = x2 + 15;
    for (let x = a; x <= z; x++) { const k = (x - a) % 4; b.vline(x, y, h, k === 0 ? lit(col, 0.4) : k === 3 ? dim(col, 0.18) : col); }
    for (let x = a; x <= z; x += 6) { b.hline(x + 1, y + h, 4, col); b.hline(x + 2, y + h + 1, 2, col); b.px(x, y + h, 'o'); b.px(x + 1, y + h + 1, 'o'); b.px(x + 4, y + h + 1, 'o'); b.hline(x + 2, y + h + 2, 2, 'o'); b.px(x + 5, y + h, 'o'); }
    b.hline(a, y - 1, z - a + 1, 'o'); b.vline(a - 1, y, h, 'o'); b.vline(z + 1, y, h, 'o');
    for (let x = a + 1; x < z; x += 2) b.px(x, y + h - 2, lit(col, 0.55));   // stitching
  };
  const rod = () => { b.box(x1 - 17, 18, x2 - x1 + 35, 3, 'w'); b.hline(x1 - 16, 19, x2 - x1 + 33, 'w'); b.box(x1 - 20, 17, 4, 5, cu.knob || 'Y'); b.box(x2 + 17, 17, 4, 5, cu.knob || 'Y'); };
  const rings = xs => xs.forEach(x => { b.px(x, 21, 'o'); b.px(x, 22, 'o'); });
  const bow = (x, y, col) => { stamp(b, x - 3, y - 1, ['##.##', '#####', '##.##'], col); b.px(x - 1, y, dim(col, 0.3)); b.px(x, y, 'o'); b.px(x - 2, y + 2, col); b.px(x + 1, y + 2, col); };
  if (cu.style === 'tieback') {
    rod();
    const left = [[x1 - 15, 21], [x1 + 9, 21], [x1 + 4, 36], [x1 - 2, 49], [x1 + 2, 60], [x1 + 6, 77], [x1 - 15, 77]];
    panel(left, c); panel(mirror(left), c);
    valance(21, 7, c);
    bow(x1 - 4, 49, cu.bow || '#f39ab9'); bow(x2 + 4, 49, cu.bow || '#f39ab9');
  } else if (cu.style === 'cafe') {
    b.rect(x1 - 1, 44, x2 - x1 + 3, 1, 'o');
    [[x1 + 3, 159], [161, x2 - 3]].forEach(([a, z]) => panel([[a, 45], [z, 45], [z, 66], [a, 66]], c, 4));
    [[x1 + 3, 159], [161, x2 - 3]].forEach(([a, z]) => { b.rect(a + 1, 62, z - a - 1, 2, cu.c2); });
    valance(20, 7, cu.c2);
  } else if (cu.style === 'beads') {
    rod();
    const cols = cu.beads;
    for (let side = 0; side < 2; side++) for (let k = 0; k < 7; k++) {
      const x = side ? x2 + 14 - k * 3 : x1 - 14 + k * 3, len = 54 - k * 4;
      b.vline(x, 22, len, 'o');
      for (let y = 24, n = 0; y < 22 + len; y += 3, n++) { b.px(x, y, cols[(n + k) % cols.length]); b.px(x, y + 1, dim(cols[(n + k) % cols.length], 0.2)); }
    }
  } else if (cu.style === 'panels') {
    rod();
    const left = [[x1 - 14, 22], [x1 + 7, 22], [x1 + 4, 40], [x1 + 8, 60], [x1 + 4, 76], [x1 - 14, 76]];
    panel(left, c, 6); panel(mirror(left), c, 6);
    for (let x = x1 - 13; x < x1 + 5; x += 2) { b.px(x, 74, lit(c, 0.5)); b.px(x1 + x2 - x, 74, lit(c, 0.5)); }
    rings([x1 - 12, x1 - 7, x1 - 2, x1 + 3, x2 - 3, x2 + 2, x2 + 7, x2 + 12]);
  } else if (cu.style === 'blind') {
    b.box(x1 - 3, 21, x2 - x1 + 7, 5, 'w'); b.hline(x1 - 2, 22, x2 - x1 + 5, 'w'); b.hline(x1 - 2, 24, x2 - x1 + 5, '#e0d9e6');
    b.rect(x1 + 3, 26, x2 - x1 - 5, 8, c);
    for (let y = 27; y < 34; y += 2) b.hline(x1 + 3, y, x2 - x1 - 5, cu.c2);
    b.box(x1 + 2, 34, x2 - x1 - 3, 3, 'w'); b.hline(x1 + 3, 35, x2 - x1 - 5, '#e0d9e6');
    b.vline(x2 - 7, 37, 9, 'o'); b.box(x2 - 8, 46, 3, 3, 'w');
  } else {   // bare: the curtains are packed, only the rod and its rings are left
    rod(); rings([x1 - 12, x1 - 8, x1 - 4, x2 + 4, x2 + 8, x2 + 12]);
  }
}

function lightBeam(b, level) { ROOM_FX.beam = level || 3; }   // how strong the window's light is (drawn by buildFx in game.js)

function drawDoor(b, col, deco) {
  const x1 = 253, x2 = 274, y1 = 48, y2 = 105;
  b.box(x1 - 2, y1 - 2, x2 - x1 + 5, y2 - y1 + 3, 'w');                       // the casing
  b.vline(x2 + 1, y1 - 1, y2 - y1 + 1, '#e3dde8');
  for (let y = y1 - 1; y < y2; y++) darkenAt(b, x2 + 3, y, 0.12);                // its shadow on the wall
  b.box(x1, y1, x2 - x1 + 1, y2 - y1 + 1, col);
  b.vline(x1 + 1, y1 + 1, y2 - y1 - 1, lit(col, 0.35)); b.vline(x2 - 1, y1 + 1, y2 - y1 - 1, dim(col, 0.12));
  [[y1 + 4, 20], [y1 + 28, 24]].forEach(([py, ph]) => {                         // two recessed panels
    b.box(x1 + 3, py, x2 - x1 - 5, ph, col);
    b.hline(x1 + 4, py + 1, x2 - x1 - 7, dim(col, 0.18)); b.vline(x1 + 4, py + 1, ph - 2, dim(col, 0.18));
    b.hline(x1 + 4, py + ph - 2, x2 - x1 - 7, lit(col, 0.4)); b.vline(x2 - 3, py + 1, ph - 2, lit(col, 0.4));
  });
  b.box(x1 + 2, 79, 3, 3, 'Y'); b.px(x1 + 3, 80, 'w');
  if (deco === 'baby') { b.box(x1 + 3, 58, 16, 7, 'w'); miniText(b, x1 + 5, 59, 'SHH', 'v'); }
  if (deco === 'letters') ['x', 'n', 'Y', 'E'].forEach((c, i) => { b.box(x1 + 3 + i * 4, 60, 3, 3, c); b.px(x1 + 4 + i * 4, 61, lit(c, 0.6)); });
  if (deco === 'butterfly') stamp(b, x1 + 9, 58, ['##.##', '#####', '.###.', '##.##'], 'L');
  if (deco === 'keepout') { b.box(x1 + 1, 56, 20, 14, 'Y'); b.hline(x1 + 2, 57, 18, lit('Y', 0.5)); miniText(b, x1 + 3, 57, 'KEEP', 'h'); miniText(b, x1 + 3, 63, 'OUT!', 'h'); }
  if (deco === 'wreath') { b.ring(x1 + 11, 62, 5, 5, 'E'); b.ring(x1 + 11, 62, 4, 4, 'F'); b.px(x1 + 8, 59, lit('E', 0.6)); b.px(x1 + 11, 67, 'h'); }
}

/* ---------- furniture ---------- */

function shelfPlank(b, x1, x2, y, col) {   // a plank three pixels thick: a lit top, its front, a shaded underside and its shadow on the wall
  for (let x = x1; x <= x2 + 3; x++) { darkenAt(b, x + 1, y + 5, 0.22); darkenAt(b, x + 2, y + 6, 0.11); }
  b.box(x1 - 2, y, x2 - x1 + 5, 5, col);
  b.hline(x1 - 1, y + 1, x2 - x1 + 3, lit(col, 0.45)); b.hline(x1 - 1, y + 3, x2 - x1 + 3, dim(col, 0.16));
  [x1 + 4, x2 - 4].forEach((x, i) => { b.rect(x, y + 5, 2, 5, 'o'); b.line(x + (i ? 0 : 1), y + 9, x + (i ? -4 : 5), y + 5, 'o'); b.line(x + (i ? 1 : 0), y + 9, x + (i ? -3 : 4), y + 5, 'o'); });
}

function drawCot(b, c) {
  const x1 = q(c.x1), x2 = q(c.x2), top = q(c.top), bot = q(c.bottom), sh = '#e3dde8', deep = '#cfc7da';
  castShadow(b, x1, x2, bot + 1, [0.26, 0.15, 0.06]);
  b.box(x1 + 2, top - 17, x2 - x1 - 3, 4, 'w'); b.hline(x1 + 3, top - 15, x2 - x1 - 5, sh);   // the top rail
  for (let x = x1 + 6; x < x2 - 5; x += 6) { b.rect(x, top - 13, 3, 13, 'w'); b.vline(x + 2, top - 13, 13, sh); b.vline(x + 3, top - 13, 13, deep); }   // round bars, shaded on the right
  b.box(x1 + 2, top, x2 - x1 - 3, 6, 'b');                                         // the mattress, quilted
  b.hline(x1 + 3, top + 1, x2 - x1 - 5, lit('b', 0.6)); b.hline(x1 + 3, top + 4, x2 - x1 - 5, dim('b', 0.12));
  for (let x = x1 + 5; x < x2 - 3; x += 5) b.vline(x, top + 2, 2, 'w');
  b.rect(x1 + 3, top + 6, x2 - x1 - 5, 5, 'p');                                      // the skirt: fabric with eyelet lace and a stitched hem
  b.hline(x1 + 3, top + 6, x2 - x1 - 5, lit('p', 0.4)); b.hline(x1 + 3, top + 9, x2 - x1 - 5, dim('p', 0.14));
  for (let x = x1 + 4; x < x2 - 3; x += 2) b.px(x, top + 7, lit('p', 0.7));
  for (let x = x1 + 3; x < x2 - 2; x += 4) { b.rect(x, top + 11, 3, 1, 'w'); b.px(x + 1, top + 12, 'w'); b.px(x + 1, top + 11, 'p'); b.px(x + 3, top + 11, 'o'); b.px(x, top + 12, 'o'); b.px(x + 2, top + 12, 'o'); b.px(x + 1, top + 13, 'o'); }
  [x1 - 2, x2 - 3].forEach(x => { b.box(x, top - 20, 5, bot - top + 20, 'w'); b.vline(x + 3, top - 19, bot - top + 18, sh); b.vline(x + 1, top - 19, bot - top + 18, '#ffffff'); });   // posts
  [x1 + 0.5, x2 - 0.5].forEach(x => { b.ell(x, top - 23, 3.2, 3.2, 'P'); b.ring(x, top - 23, 3.2, 3.2, 'o'); b.px(Math.floor(x) - 1, top - 25, 'w'); b.px(Math.floor(x) + 1, top - 21, dim('P', 0.25)); });
}

function drawBed(b, bed, style) {
  const s = {
    flowers: { frame: '#f3d3d6', duvet: '#ef87ad', dark: '#d76d94', pillow: 'w' },
    butterflies: { frame: '#e2dbef', duvet: '#b5e2d2', dark: '#95cfbb', pillow: 'l' },
    messy: { frame: '#6d5a8f', duvet: '#9a88c4', dark: '#7d6aa8', pillow: 'l' },
    linen: { frame: '#d8b48a', duvet: 'w', dark: '#cfdccb', pillow: '#f1d3d0' },
    bare: { frame: '#d8b48a', duvet: '#f6f4ef', dark: '#a9bfdc', pillow: null }
  }[style];
  const x1 = q(bed.x1), x2 = q(bed.x2), top = q(bed.top), bot = q(bed.bottom), F = s.frame;
  castShadow(b, x1 + 2, x2, bot + 1, [0.26, 0.15, 0.06]);
  const post = (x, y, w, h) => {   // a thick post: lit on the left, a mid tone, shaded on the right, with a cap
    b.box(x, y, w, h, F); b.vline(x + 1, y + 1, h - 2, lit(F, 0.42)); b.vline(x + 2, y + 1, h - 2, lit(F, 0.18));
    b.vline(x + w - 2, y + 1, h - 2, dim(F, 0.24)); b.vline(x + w - 3, y + 1, h - 2, dim(F, 0.1));
    b.box(x - 1, y - 2, w + 2, 3, F); b.hline(x, y - 1, w, lit(F, 0.45));
  };
  b.rect(x1 + 6, top + 9, x2 - x1 - 10, bot - top - 12, F); b.hline(x1 + 6, bot - 3, x2 - x1 - 10, 'o');   // side rail
  b.hline(x1 + 6, top + 9, x2 - x1 - 10, lit(F, 0.35)); b.hline(x1 + 6, bot - 5, x2 - x1 - 10, dim(F, 0.1)); b.hline(x1 + 6, bot - 4, x2 - x1 - 10, dim(F, 0.22));
  post(x1 - 1, top - 21, 8, bot - top + 21);                                                       // headboard
  post(x2 - 5, top - 7, 7, bot - top + 7);                                                         // footboard
  b.box(x1 + 6, top + 1, x2 - x1 - 10, 9, 'w'); b.hline(x1 + 7, top + 6, x2 - x1 - 12, '#ebe6f0'); b.hline(x1 + 7, top + 7, x2 - x1 - 12, '#ddd6e4');   // a thick mattress
  if (F[0] === '#' && style !== 'messy') for (let x = x1 + 12; x < x2 - 8; x += 17) b.hline(x, top + 11, 6, dim(F, 0.1));   // a little wood grain
  if (style === 'bare') {   // a bare mattress in ticking stripes, with buttons
    b.box(x1 + 5, top, x2 - x1 - 8, 10, s.duvet);
    for (let x = x1 + 7; x < x2 - 4; x += 3) b.vline(x, top + 1, 8, s.dark);
    for (let x = x1 + 12; x < x2 - 6; x += 12) b.px(x, top + 4, 'o');
    b.hline(x1 + 6, top + 1, x2 - x1 - 10, 'w');
    return;
  }
  if (s.pillow) {   // a pillow: lit along the top, shaded underneath, with a seam
    b.box(x1 + 6, top - 4, 17, 7, s.pillow);
    b.hline(x1 + 8, top - 3, 12, lit(s.pillow, 0.5)); b.hline(x1 + 7, top + 1, 15, dim(s.pillow, 0.14)); b.px(x1 + 7, top - 3, dim(s.pillow, 0.1));
  }
  if (style === 'messy') {
    b.poly([[x1 + 18, top], [x1 + 40, top - 1], [x1 + 60, top + 2], [x2 - 3, top], [x2 - 2, top + 15], [x1 + 50, top + 17], [x1 + 30, top + 13], [x1 + 16, top + 16]], s.duvet);
    b.line(x1 + 26, top + 5, x1 + 46, top + 8, '#6d5a8f'); b.line(x1 + 50, top + 4, x1 + 64, top + 6, '#6d5a8f');
    b.line(x1 + 27, top + 4, x1 + 45, top + 7, lit(s.duvet, 0.35)); b.line(x1 + 51, top + 3, x1 + 63, top + 5, lit(s.duvet, 0.35));   // folds catch the light
    b.line(x1 + 18, top, x1 + 16, top + 16, 'o'); b.line(x1 + 16, top + 16, x1 + 30, top + 13, 'o'); b.line(x1 + 30, top + 13, x1 + 50, top + 17, 'o'); b.line(x1 + 50, top + 17, x2 - 2, top + 15, 'o');
    b.hline(x1 + 18, top, x2 - x1 - 20, 'o');
    return;
  }
  // the duvet: a turned-down top edge, soft folds, a stitched hem, and its side hanging down in shadow
  b.box(x1 + 15, top, x2 - x1 - 18, 13, s.duvet);
  b.hline(x1 + 16, top + 1, x2 - x1 - 20, lit(s.duvet, 0.45));
  b.rect(x1 + 16, top + 9, x2 - x1 - 20, 3, s.dark);
  for (let x = x1 + 17; x < x2 - 4; x += 2) b.px(x, top + 8, lit(s.duvet, 0.5));
  [[x1 + 30, 0], [x1 + 52, 1]].forEach(([fx, k]) => { if (fx < x2 - 8) { b.line(fx, top + 2, fx + 3, top + 7, dim(s.duvet, 0.12)); b.line(fx + 1, top + 2, fx + 4, top + 7, lit(s.duvet, 0.25)); } });
  if (style === 'flowers') for (let x = x1 + 20, k = 0; x < x2 - 6; x += 9, k++) { const y = top + 3 + (k % 2) * 2; stamp(b, x, y, ['.#.', '#.#', '.#.'], 'w'); b.px(x + 1, y + 1, 'Y'); }
  if (style === 'butterflies') for (let x = x1 + 20, k = 0; x < x2 - 6; x += 10, k++) stamp(b, x, top + 3 + (k % 2), ['#.#', '###', '#.#'], k % 2 ? 'L' : 'h');
  if (style === 'linen') { b.hline(x1 + 16, top + 3, x2 - x1 - 20, s.dark); b.hline(x1 + 16, top + 5, x2 - x1 - 20, '#f1d3d0'); }
  // a checked throw over the foot of the bed, with a fringe
  if (bed.throwCols) {
    const tx = x2 - 26, c2 = bed.throwCols;
    b.box(tx, top - 1, 20, 15, c2[0]);
    for (let y = top; y < top + 13; y++) for (let x = tx + 1; x < tx + 19; x++) if ((Math.floor((x - tx) / 3) + Math.floor((y - top) / 3)) % 2) b.px(x, y, c2[1]);
    b.hline(tx + 1, top + 12, 18, dim(c2[0], 0.15));
    for (let x = tx + 1; x < tx + 19; x += 2) b.px(x, top + 14, dim(c2[0], 0.1));
  }
}

function drawDresser(b, d, col, fronts) {   // fronts: a colour per drawer (colour blocks), or all in col
  const x1 = q(d.x1), x2 = q(d.x2), top = q(d.top), bot = q(d.bottom);
  castShadow(b, x1 - 3, x2, bot);
  block(b, x1, top + 4, x2, bot - 2, col, { top: 0, shine: false });                    // the carcass, its left side in shade
  block(b, x1 - 2, top, x2 + 2, top + 3, 'w', { depth: 3, top: 2 });                     // the top board
  const h = Math.floor((bot - top - 10) / 3);
  for (let i = 0; i < 3; i++) drawerFront(b, x1 + 3, top + 6 + i * h, x2 - x1 - 5, h - 1, fronts ? fronts[i] : col, 'bar');
  b.rect(x1 + 1, bot - 2, 3, 2, 'o'); b.rect(x2 - 3, bot - 2, 3, 2, 'o');
}

function drawBookshelf(b, s, col, backs) {   // backs: the colour behind each of the three shelves
  const x1 = q(s.x1), x2 = q(s.x2), top = q(s.top - 4), mid = q(s.mid), low = q(s.low), bot = q(s.bottom);
  castShadow(b, x1 - 3, x2, bot + 1);
  block(b, x1, top + 3, x2, bot, col, { top: 0, shine: false });
  [[top + 4, mid], [mid + 3, low], [low + 3, bot - 1]].forEach(([y1, y2], i) => {    // recessed backs, in shadow under each shelf
    const c = backs ? backs[i] : '#f2d98e';
    b.rect(x1 + 2, y1, x2 - x1 - 3, y2 - y1, c);
    b.hline(x1 + 2, y1, x2 - x1 - 3, dim(c, 0.28)); b.hline(x1 + 2, y1 + 1, x2 - x1 - 3, dim(c, 0.14)); b.vline(x1 + 2, y1, y2 - y1, dim(c, 0.18));
  });
  [mid, low].forEach(y => { b.box(x1, y, x2 - x1 + 1, 3, col); b.hline(x1 + 1, y + 1, x2 - x1 - 1, lit(col, 0.4)); });
  block(b, x1 - 2, top, x2 + 2, top + 2, 'w', { depth: 3, top: 2 });
}

function drawDesk(b, d, o) {
  o = o || {};
  const x1 = q(d.x1), x2 = q(d.x2), top = q(d.top), bot = q(d.bottom), col = o.col || 'w';
  castShadow(b, x1 - 3, x2, bot + 1);
  for (let x = x1 + 1; x < x2 - 22; x++) { darkenAt(b, x, top + 5, 0.2); darkenAt(b, x + 1, top + 6, 0.1); darkenAt(b, x + 2, top + 7, 0.04); }   // the desktop's shadow on the wall
  if (o.hairpin) { b.line(x1 + 2, top + 3, x1, bot, 'o'); b.line(x1 + 2, top + 3, x1 + 5, bot, 'o'); }   // hairpin legs
  else { b.box(x1 + 1, top + 4, 5, bot - top - 4, col); b.vline(x1 + 2, top + 5, bot - top - 6, lit(col, 0.4)); b.vline(x1 + 4, top + 5, bot - top - 6, dim(col, 0.18)); }
  block(b, x2 - 19, top + 5, x2, bot, col, { top: 0, shine: false });                       // the drawer unit, its side in shade
  const dr = o.drawers || [o.drawer || 'L', o.drawer || 'L'];
  drawerFront(b, x2 - 17, top + 8, 15, 11, dr[0]); drawerFront(b, x2 - 17, top + 21, 15, 10, dr[1]);
  block(b, x1 - 2, top, x2 + 2, top + 4, col, { depth: 3, top: 2 });                       // the desktop: a lit top, a thick front edge
  drawChair(b, x1, top, bot, o.chair || 'P', o.chairStyle);
  if (o.lamp) {
    const lx = x2 - 4;
    b.box(lx - 4, top - 2, 8, 2, o.lamp);
    b.line(lx, top - 3, lx - 3, top - 12, 'o'); b.line(lx - 3, top - 12, lx + 1, top - 17, 'o');
    b.poly([[lx - 2, top - 17], [lx + 6, top - 21], [lx + 9, top - 14]], o.lamp);
    b.line(lx - 2, top - 17, lx + 6, top - 21, 'o'); b.line(lx + 6, top - 21, lx + 9, top - 14, 'o'); b.line(lx + 9, top - 14, lx - 2, top - 17, 'o');
    b.px(lx + 1, top - 17, lit(o.lamp, 0.6)); b.px(lx + 2, top - 18, lit(o.lamp, 0.6));               // a glint on the shade
    ROOM_FX.lamp = [lx, top];
  }
  if (o.papers) [[x1 + 4, 'w'], [x1 + 14, 'g'], [x1 + 24, 'w']].forEach(([x, c]) => { b.rect(x, top - 3, 8, 1, c); b.hline(x, top - 4, 8, 'o'); });
}

// the desk chair, a different shape in each room: a plain chair, a round-backed one, a swivel chair or a moulded one
function drawChair(b, x1, top, bot, col, style) {
  for (let x = x1 + 7; x <= x1 + 28; x++) darkenAt(b, x, bot + 1, 0.16);   // its shadow on the floor
  const seat = () => { b.box(x1 + 6, top + 18, 21, 4, col); b.hline(x1 + 7, top + 19, 19, lit(col, 0.4)); b.hline(x1 + 7, top + 20, 19, dim(col, 0.12)); };
  if (style === 'round') {   // plastic: one clean highlight
    b.ell(x1 + 16, top + 11, 9, 7, col); b.ring(x1 + 16, top + 11, 9, 7, 'o'); b.ring(x1 + 16, top + 11, 6, 4, lit(col, 0.6));
    b.px(x1 + 11, top + 7, 'w'); b.px(x1 + 12, top + 6, 'w');
    seat();
    b.line(x1 + 9, top + 22, x1 + 7, bot, 'o'); b.line(x1 + 10, top + 22, x1 + 8, bot, dim(col, 0.3)); b.line(x1 + 23, top + 22, x1 + 25, bot, 'o'); b.line(x1 + 22, top + 22, x1 + 24, bot, dim(col, 0.3));
  } else if (style === 'swivel') {
    b.box(x1 + 9, top + 2, 15, 16, col); b.rect(x1 + 10, top + 3, 13, 3, lit(col, 0.45)); b.vline(x1 + 22, top + 6, 11, dim(col, 0.2));
    for (let y = top + 8; y < top + 16; y += 3) b.hline(x1 + 11, y, 10, dim(col, 0.12));   // stitched padding
    seat();
    b.box(x1 + 15, top + 22, 3, bot - top - 26, 'D');
    b.line(x1 + 16, bot - 4, x1 + 7, bot - 1, 'o'); b.line(x1 + 16, bot - 4, x1 + 25, bot - 1, 'o'); b.vline(x1 + 16, bot - 4, 4, 'o');
    [[x1 + 6, bot - 1], [x1 + 25, bot - 1], [x1 + 16, bot]].forEach(([x, y]) => b.rect(x, y - 1, 2, 2, 'o'));
  } else if (style === 'moulded') {   // a white moulded chair on light wooden legs with a black wire cross
    b.ell(x1 + 16, top + 11, 9, 6, 'w'); b.ring(x1 + 16, top + 11, 9, 6, 'o');
    for (let x = x1 + 18; x < x1 + 24; x++) b.px(x, top + 15, '#e3dde8');
    b.box(x1 + 6, top + 16, 21, 5, 'w'); b.hline(x1 + 7, top + 19, 19, '#e3dde8');
    [[x1 + 10, x1 + 7], [x1 + 22, x1 + 25]].forEach(([a, z]) => { b.line(a, top + 21, z, bot, '#c9a479'); b.line(a + 1, top + 21, z + 1, bot, '#a8835a'); });
    b.line(x1 + 9, top + 23, x1 + 23, bot - 3, 'o'); b.line(x1 + 23, top + 23, x1 + 9, bot - 3, 'o');
  } else {
    b.box(x1 + 8, top + 6, 17, 13, col); b.hline(x1 + 9, top + 7, 15, lit(col, 0.4)); seat();
    b.vline(x1 + 8, top + 22, bot - top - 22, 'o'); b.vline(x1 + 24, top + 22, bot - top - 22, 'o');
  }
}

/* a rug of any shape: inside(x, y) says what's rug; the edge is outlined and a trim runs just inside it */
function shapeRug(b, inside, box, fill, trim) {
  const [X0, Y0, X1, Y1] = box;
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
    if (!inside(x, y)) continue;
    if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) b.px(x, y, 'o');
    else if (!inside(x, y + 2)) b.px(x, y, dim(trim || fill, 0.18));   // the rug's front edge: its thickness, in shade
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
function heartRug(b, cx, cy, rx, ry, fill, trim) {   // a heart, lying on the floor
  shapeRug(b, (x, y) => { const X = (x + 0.5 - cx) / rx * 1.15, Y = -(y + 0.5 - cy) / ry * 1.15 + 0.15; return (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3 <= 0; },
    [cx - rx - 2, cy - ry - 3, cx + rx + 2, cy + ry + 3], fill, trim);
}
function harlequinRug(b, cx, cy, w, h, cols, trim) {   // a big rug in pastel diamonds (2010)
  const y0 = cy - h, y1 = cy + h, sl = 0.25;
  const inside = (x, y) => y >= y0 && y <= y1 && Math.abs(x + 0.5 - cx) <= w + (y - cy) * sl;
  shapeRug(b, inside, [cx - w - h, y0, cx + w + h, y1], cols[0], trim);
  for (let y = y0 + 2; y <= y1 - 3; y++) for (let x = Math.floor(cx - w - h); x <= cx + w + h; x++) {
    if (!inside(x - 3, y) || !inside(x + 3, y)) continue;
    const U = (x - cx) / 9 + 0.5, V = (y - y0 - 2) / 4.5, iu = Math.floor(U), iv = Math.floor(V);
    if (Math.abs(U - iu - 0.5) + Math.abs(V - iv - 0.5) < 0.5) b.px(x, y, cols[1 + ((iu + iv) % (cols.length - 1) + cols.length - 1) % (cols.length - 1)]);
  }
}
function chevronRug(b, cx, cy, w, h, c1, c2, trim) {   // a rectangular rug in zigzag stripes (2014)
  const y0 = cy - h, y1 = cy + h, sl = 0.25;
  const inside = (x, y) => y >= y0 && y <= y1 && Math.abs(x + 0.5 - cx) <= w + (y - cy) * sl;
  shapeRug(b, inside, [cx - w - h, y0, cx + w + h, y1], c1, trim);
  for (let y = y0 + 2; y <= y1 - 2; y++) for (let x = Math.floor(cx - w - h); x <= cx + w + h; x++) {
    if (!inside(x - 3, y) || !inside(x + 3, y)) continue;
    const zig = Math.abs(((x - cx + 64) % 8) - 4) / 2;
    if (Math.floor((y - y0 + zig) / 2.5) % 2) b.px(x, y, c2);
  }
}
function diamondRug(b, cx, cy, w, h, fill, line) {   // a cream rug with a thin diamond lattice and fringed ends (2017)
  const y0 = cy - h, y1 = cy + h, sl = 0.25;
  const inside = (x, y) => y >= y0 && y <= y1 && Math.abs(x + 0.5 - cx) <= w + (y - cy) * sl;
  shapeRug(b, inside, [cx - w - h, y0, cx + w + h, y1], fill, null);
  for (let y = y0 + 1; y < y1; y++) { const half = w + (y - cy) * sl; for (let x = Math.ceil(cx - half) + 1; x < cx + half - 1; x++) {
    const U = (x - cx) / 10 + 0.5, V = (y - y0) / h, d = Math.abs(U - Math.floor(U) - 0.5) + Math.abs(V - Math.floor(V) - 0.5);
    if (d > 0.4 && d < 0.56) b.px(x, y, line);
  } }
  for (let y = y0 + 1; y < y1; y += 2) { const half = w + (y - cy) * sl; b.px(Math.floor(cx - half) - 1, y, 'o'); b.px(Math.ceil(cx + half) + 1, y, 'o'); }   // fringe
}
function beanbag(b, cx, cy, col, light) {   // a vinyl beanbag slumped in the corner (2010): a shine on top, its base in shade
  b.ell(cx, cy, 13, 8, col); b.ell(cx - 2, cy - 5, 9, 6, col);
  for (let y = cy + 2; y <= cy + 8; y++) for (let x = cx - 13; x <= cx + 13; x++) if (inEll(x, y, cx, cy, 12, 7)) b.px(x, y, dim(col, 0.16));
  b.ring(cx, cy, 13, 8, 'o'); b.ring(cx - 2, cy - 5, 9, 6, 'o'); b.ell(cx - 2, cy - 4, 8, 5, col);
  b.ell(cx - 5, cy - 7, 3, 1.5, light); b.px(cx - 6, cy - 8, 'w'); b.line(cx - 8, cy + 1, cx + 4, cy - 1, 'o');
  for (let x = cx - 10; x <= cx + 14; x++) darkenAt(b, x + 1, cy + 9, 0.16);
}
function monstera(b, x, y) {   // a big leafy plant in a white pot (2017)
  for (let i = x - 5; i <= x + 8; i++) darkenAt(b, i, y + 1, 0.16);
  b.box(x - 6, y - 9, 13, 10, 'w'); b.hline(x - 5, y - 8, 11, 'w'); b.vline(x + 5, y - 8, 8, '#e3dde8'); b.hline(x - 5, y - 6, 10, '#e6e1da');
  [[x - 7, y - 22, 7, 5], [x + 6, y - 25, 7, 6], [x - 1, y - 31, 7, 6], [x + 9, y - 15, 5, 4], [x - 10, y - 13, 5, 4]].forEach(([cx, cy, rx, ry], k) => {
    b.ell(cx, cy, rx, ry, k % 2 ? 'F' : '#4f9b6c'); b.ring(cx, cy, rx, ry, 'o');
    b.line(cx - rx + 2, cy, cx + rx - 2, cy, k % 2 ? '#4f9b6c' : 'F');
    b.px(cx - rx + 2, cy - ry + 2, lit(k % 2 ? 'F' : '#4f9b6c', 0.45));
    b.line(x, y - 9, cx, cy, 'F');
  });
}
function rolledRug(b, x1, x2, y, fill, line) {   // the rug, rolled up and tied with string for the move
  const h = 9, cy = y - (h - 1) / 2;
  b.box(x1, y - h + 1, x2 - x1, h, fill);
  for (let x = x1 + 4; x < x2 - 3; x += 6) { b.line(x, y - h + 2, x + 3, y - 1, line); b.line(x + 3, y - h + 2, x, y - 1, line); }
  b.ell(x2, cy, 3, h / 2, fill); b.ring(x2, cy, 3, h / 2, 'o'); b.ring(x2, cy, 1.6, 2.6, line); b.px(x2, Math.round(cy), line);   // the rolled end
  [x1 + 9, x2 - 10].forEach(x => { b.vline(x, y - h + 1, h, '#b58b5c'); b.vline(x + 1, y - h + 1, h, '#b58b5c'); });
}

// a garland of little triangle flags across the wall: a row of colour blocks
function bunting(b, x1, x2, y, sag, cols) {
  const at = x => y + Math.round(sag * Math.sin(Math.PI * (x - x1) / (x2 - x1)));
  for (let x = x1; x <= x2; x++) b.px(x, at(x), 'o');
  for (let x = x1 + 3, k = 0; x < x2 - 5; x += 8, k++) {
    const yy = at(x + 2) + 1;
    b.poly([[x, yy], [x + 5, yy], [x + 2.5, yy + 5]], cols[k % cols.length]);
    b.line(x, yy, x + 2, yy + 5, 'o'); b.line(x + 5, yy, x + 3, yy + 5, 'o');
  }
}

function drawToyBox(b, t) {   // a plastic toy box: a glossy streak, its right side in shade, the yellow lid propped open
  const x1 = q(t.x1), y1 = q(t.y1), x2 = q(t.x2), y2 = q(t.y2);
  castShadow(b, x1, x2 + 3, y2 + 1);
  b.poly([[x1 + 1, y1], [x2, y1], [x2 + 2, y1 - 10], [x1 + 3, y1 - 12]], 'Y');
  b.line(x1 + 4, y1 - 11, x2 + 1, y1 - 9, lit('Y', 0.5));
  b.line(x1 + 1, y1, x1 + 3, y1 - 12, 'o'); b.line(x1 + 3, y1 - 12, x2 + 2, y1 - 10, 'o'); b.line(x2 + 2, y1 - 10, x2, y1, 'o');
  block(b, x1, y1, x2, y2, '#5ea6ec', { top: 0, side: 'R', depth: 3 });
  b.vline(x1 + 2, y1 + 4, 6, lit('#5ea6ec', 0.6)); b.px(x1 + 2, y1 + 11, lit('#5ea6ec', 0.6));
  miniText(b, Math.round((x1 + x2) / 2) - 7, y1 + 8, 'TOYS', 'w');
  stamp(b, x1 + 3, y1 + 3, ['.#.', '###', '.#.'], 'y'); stamp(b, x2 - 6, y2 - 6, ['.#.', '###', '.#.'], 'y');
}

function drawBasket(b, k) {   // wicker: woven texture, a lit rim, its side in shade
  const x1 = q(k.x1), y1 = q(k.y1), x2 = q(k.x2), y2 = q(k.y2);
  castShadow(b, x1, x2, y2 + 1);
  block(b, x1, y1, x2, y2, 'r', { top: 0, shine: false });
  for (let y = y1 + 2; y < y2 - 1; y += 3) for (let x = x1 + 1 + (y % 2); x < x2; x += 3) b.px(x, y, 'R');
  b.vline(x2 - 1, y1 + 2, y2 - y1 - 3, dim('r', 0.18));
  b.box(x1 - 1, y1 - 1, x2 - x1 + 3, 3, 't'); b.hline(x1, y1, x2 - x1 + 1, lit('t', 0.5));
}

function drawHookRail(b, h) {   // a wooden rail: lit top, shaded underside, its shadow on the wall, pink hooks with a glint
  const x1 = q(h.x1) - 3, x2 = q(h.x2) + 3, y = q(h.y);
  b.box(x1, y - 5, x2 - x1, 4, 'R'); b.hline(x1 + 1, y - 4, x2 - x1 - 2, lit('R', 0.35)); b.hline(x1 + 1, y - 3, x2 - x1 - 2, dim('R', 0.1));
  for (let x = x1 + 1; x < x2 + 1; x++) { darkenAt(b, x + 1, y - 1, 0.16); darkenAt(b, x + 2, y, 0.08); }
  for (let x = x1 + 6; x < x2 - 2; x += 14) { b.box(x, y - 1, 3, 3, 'h'); b.px(x + 1, y, lit('h', 0.6)); }
}

function drawSocket(b, x, y) { b.box(x - 3, y - 3, 6, 7, 'w'); b.vline(x - 1, y - 1, 2, 'o'); b.vline(x + 1, y - 1, 2, 'o'); }

function drawTeaTable(b, cx, top, w, bot) {
  cx = q(cx); const half = q(w) / 2, ty = q(top), by = q(bot);
  castShadow(b, cx - half, cx + half, by + 1);
  [cx - half + 4, cx + half - 7].forEach(x => { b.box(x, ty + 4, 3, by - ty - 4, 'w'); b.vline(x + 1, ty + 5, by - ty - 6, '#ece7f0'); });
  b.box(cx - half, ty, half * 2 + 1, 5, 'p'); b.hline(cx - half + 1, ty + 1, half * 2 - 1, lit('p', 0.55)); b.hline(cx - half + 1, ty + 3, half * 2 - 1, dim('p', 0.1));
  for (let x = cx - half + 3; x < cx + half - 1; x += 5) b.px(x, ty + 2, 'w');
  [[cx - half - 9, 'e'], [cx + half + 9, 'y']].forEach(([sx, c]) => { b.box(sx - 6, by - 6, 13, 3, c); b.hline(sx - 5, by - 5, 11, lit(c, 0.5)); b.vline(sx, by - 3, 4, 'o'); darkenAt(b, sx + 1, by + 1, 0.16); darkenAt(b, sx + 2, by + 1, 0.1); });
}

function drawStackedBoxes(b) {   // cardboard: the left side in shade, a lit top on the highest box, tape with a sheen
  [[281, 118, 30, 22, 'BOOKS'], [284, 97, 26, 21, 'STUFF'], [287, 80, 21, 17, 'MISC']].forEach(([x, y, w, h, label], i) => {
    castShadow(b, x - 3, x + w - 1, y + h, i ? [0.16] : [0.22, 0.12]);
    block(b, x, y, x + w - 1, y + h - 1, 'r', { top: i === 2 ? 2 : 0, shine: false, side: 'L', depth: 3 });
    b.rect(x + Math.floor(w / 2) - 1, y + 1, 3, h - 2, 'y'); b.vline(x + Math.floor(w / 2) - 1, y + 1, h - 2, lit('y', 0.6));
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
  roomShell(b, { ceil: '#f1f6fd', side: '#c9daf3', side2: '#c2d4ef', wall: '#f8eec2', bands: '#fbf4d8', dots: '#8fb2e0', pattern: 'stars',
    border: { style: 'dots', c: ['#bcd2ee', '#ffffff'] },
    lower: { style: 'beadboard', c: ['#a9c6ea', '#8bb0de', '#9fbde4'] },
    floor: { style: 'plaid', c: ['#fbf2d6', '#cfe0f5', '#f6e3a8', '#b5cdee'], shadow: '#dbd4bd' } });
  ceilingStars(b);
  bunting(b, 46, 120, 25, 3, ['#f3b9cc', '#f3dc8e', '#a9c8ea', '#bfe3c8']);
  bunting(b, 198, 248, 25, 2, ['#a9c8ea', '#f3b9cc', '#f3dc8e']);
  drawWindow(b, 'night', { style: 'tieback', c: 'b', c2: 'B' });
  drawDoor(b, '#f6a9c9', 'baby');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'w');
  drawDresser(b, L.dresser, 'b', ['#f39ab9', '#82b5ea', '#ffd25e']);
  drawSocket(b, q(L.socket.x), q(L.socket.y) + 2);
  cloudRug(b, 160, 129, 'w', '#dbe7f3');
  drawCot(b, L.cot);
  hangString(b, q(L.mobile.x), Math.round((L.mobile.y - ITEM_DEFS.mobile.h / 2) / ART));
}

function bgChildhood(b, L) {   // pearl rose + lavender: candy stripes under a scalloped rail, a checkerboard floor, a flower rug, café curtains
  roomShell(b, { ceil: '#fdf5f7', side: '#dccff0', side2: '#d5c8ec', wall: '#f9dfe6', dots: '#fff7fa', dots2: '#ec9ab5', pattern: 'dots',
    border: { style: 'hearts', c: ['#e4d8f4', '#ec9ab5'] },
    lower: { style: 'stripes', c: ['#d9cdf2', '#c4b4ea', '#cfc2ee'] },
    floor: { style: 'checker', c: ['#fcf2ec', '#f2c9d7'], shadow: '#d8c8cf' } });
  lightBeam(b, 2);
  drawWindow(b, 'day', { style: 'cafe', c: 'w', c2: '#e9b9c9', c3: '#f1e6ea' });
  drawDoor(b, 'w', 'letters');
  drawHookRail(b, L.hooks);
  drawBookshelf(b, L.shelf, '#ffd25e', ['#f7d0dc', '#d9cff0', '#cdeee0']);
  flowerRug(b, 160, 130, 56, 9, '#cdbdf0', 'w');
  drawBed(b, Object.assign({ throwCols: ['#c8b6ea', '#ffffff'] }, L.bed), 'flowers');
  drawTeaTable(b, 640, 476, 240, 530);
  drawToyBox(b, L.toybox);
}

function bgTween(b, L) {   // 2010, lilac + mint: butterflies, mint pinstripes, a big harlequin rug on the wooden floor, a heart rug, a bead curtain, a beanbag
  roomShell(b, { ceil: '#fbf6fd', side: '#ddcdf0', side2: '#d6c6ec', wall: '#ecdef6', dots: '#eaa9c6', dots2: '#7cc7c3', pattern: 'butterflies',
    lower: { style: 'pinstripe', h: 22, c: ['#c9ecdf', '#ade0cd', '#bfe6d8', '#eaa9c6'] },
    floor: { style: 'planks', c: ['#e4b78a', '#c99a6b', '#efcda4'], shadow: '#c99a6b' } });
  lightBeam(b, 2);
  drawWindow(b, 'afternoon', { style: 'beads', beads: ['#c9b6ea', '#a9dccb', '#ffffff', '#e3b5cc'] });
  drawDoor(b, 'l', 'butterfly');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'w');
  harlequinRug(b, 164, 130, 62, 8, ['#fbf3ea', '#f6c4dc', '#c9ecdf', '#d9cbf3', '#fbe7a9'], '#ffffff');
  heartRug(b, 112, 131, 20, 7, '#b9a2ee', '#ece4fb');
  beanbag(b, 290, 116, '#8f72dd', '#c2b1f3');
  drawDesk(b, L.desk, { lamp: 'P', chair: '#66cdb3', chairStyle: 'round', drawers: ['#a68ce9', '#8fd8c1'] });
  drawBed(b, Object.assign({ throwCols: ['#c9b6ea', '#ffffff'] }, L.bed), 'butterflies');
}

function bgTeen(b, L) {   // 2014, teal + purple: striped walls, the honey wood floor, a teal chevron rug, purple panels on rings, a swivel chair
  roomShell(b, { ceil: '#eef6f3', side: '#a3c6be', side2: '#99bdb5', wall: '#c0dcd5', dots: '#b0d0c8', dots2: '#f4fbf8', pattern: 'stripes',
    floor: { style: 'planks', c: ['#e4b78a', '#c99a6b', '#efcda4'], shadow: '#c99a6b' } });
  lightBeam(b, 2);
  drawWindow(b, 'dusk', { style: 'panels', c: 'v' });
  drawDoor(b, 'w', 'keepout');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), 'V');
  chevronRug(b, 176, 130, 26, 6, '#f6f8f7', '#4fb8a6', '#9c86de');
  drawDesk(b, L.desk, { lamp: 'V', chair: 'v', chairStyle: 'swivel', drawers: ['A', '#c7b7ec'], papers: true });
  drawBed(b, L.bed, 'messy');
  drawBasket(b, L.basket);
}

// 2017-18: the same room, blush + sage on the honey wood: a two-tone painted wall, a diamond rug, a hairpin desk, a moulded chair, a big plant
const YA_SHELL = { ceil: '#fff9f5', side: '#f2d9cc', side2: '#edd2c4', wall: '#fbe7dd', dots: '#fdf0e9', dots2: '#ffffff', pattern: 'plain',
  lower: { style: 'block', h: 30, c: ['#c5dcbf', '#a9c8a2', '#bad3b3'] },
  floor: { style: 'planks', c: ['#e4b78a', '#c99a6b', '#efcda4'], shadow: '#c99a6b' } };

function bgYoungAdult(b, L) {
  roomShell(b, YA_SHELL);
  lightBeam(b, 3);
  drawWindow(b, 'morning', { style: 'blind', c: '#f8eeec', c2: '#ecdad7' });
  drawDoor(b, 'w', 'wreath');
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), '#d8b48a');
  diamondRug(b, 158, 131, 42, 7, '#f4efe7', '#7c6a70');
  monstera(b, 291, 121);
  drawDesk(b, L.desk, { col: 'w', hairpin: true, chair: 'w', chairStyle: 'moulded', drawers: ['#ec9a6c', '#a9c7a3'] });
  drawBed(b, Object.assign({ throwCols: ['#f28cb1', '#ffffff'] }, L.bed), 'linen');
}

function bgMovingOut(b, L) {   // packed up: no rug (it's rolled up), no curtains, no plant, paler patches where things hung
  roomShell(b, Object.assign({}, YA_SHELL, { ghosts: [[58, 36, 20, 15], [88, 42, 12, 16], [204, 28, 18, 13]], ghostCol: '#fcf4f0' }));
  lightBeam(b, 4);
  drawWindow(b, 'morning', { style: 'bare' });
  drawDoor(b, 'w', null);
  shelfPlank(b, q(L.shelf.x1), q(L.shelf.x2), q(L.shelf.y), '#d8b48a');
  rolledRug(b, 132, 178, 121, '#f4efe7', '#7c6a70');
  drawDesk(b, L.desk, { col: 'w', hairpin: true, chair: 'w', chairStyle: 'moulded', drawers: ['#ec9a6c', '#a9c7a3'] });
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
