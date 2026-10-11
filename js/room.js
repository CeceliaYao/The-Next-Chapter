/* =========================================================
   room.js — the one bedroom, redrawn for every chapter.
   These functions paint the static background (walls,
   window, furniture). They're cached into an image once per
   chapter, so they can be as detailed as we like.
   ========================================================= */
'use strict';

const ROOM = { wallX1: 170, wallX2: 1110, wallY1: 64, wallY2: 420, floorY: 566, left: 20, right: 1260, ceil: 44 };

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
}

function vGradient(g, x, y, w, h, stops) {
  const ctx = g.drawingContext, gr = ctx.createLinearGradient(0, y, 0, y + h);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
}

function clipRect(g, x, y, w, h, fn) {
  const ctx = g.drawingContext;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  fn(); ctx.restore();
}

/* ---------- walls, floor & wallpaper ---------- */

function roomShell(g, th) {
  const R = ROOM;
  g.noStroke();
  g.fill(th.ceil); g.quad(R.left, R.ceil, R.right, R.ceil, R.wallX2, R.wallY1, R.wallX1, R.wallY1);
  g.fill(th.side); g.quad(R.left, R.ceil, R.wallX1, R.wallY1, R.wallX1, R.wallY2, R.left, R.floorY);
  g.fill(th.side2 || th.side); g.quad(R.wallX2, R.wallY1, R.right, R.ceil, R.right, R.floorY, R.wallX2, R.wallY2);
  g.fill(th.wall); g.rect(R.wallX1, R.wallY1, R.wallX2 - R.wallX1, R.wallY2 - R.wallY1);
  clipRect(g, R.wallX1, R.wallY1, R.wallX2 - R.wallX1, R.wallY2 - R.wallY1, () => wallpaper(g, th));
  // floor + planks in perspective
  g.fill(th.floor); g.quad(R.wallX1, R.wallY2, R.wallX2, R.wallY2, R.right, R.floorY, R.left, R.floorY);
  g.stroke(th.floor2); g.strokeWeight(2);
  const spread = (R.right - R.left) / (R.wallX2 - R.wallX1);
  for (let x = R.wallX1; x <= R.wallX2 + 1; x += 47) g.line(x, R.wallY2, 640 + (x - 640) * spread, R.floorY);
  for (let y of [452, 492, 536]) {
    const k = (y - R.wallY2) / (R.floorY - R.wallY2);
    g.line(R.wallX1 + (R.left - R.wallX1) * k, y, R.wallX2 + (R.right - R.wallX2) * k, y);
  }
  // skirting board + room edges
  ink(g, 2.5); g.fill(th.base); g.rect(R.wallX1, R.wallY2 - 14, R.wallX2 - R.wallX1, 14);
  g.line(R.wallX1, R.wallY1, R.wallX1, R.wallY2); g.line(R.wallX2, R.wallY1, R.wallX2, R.wallY2);
  g.line(R.wallX1, R.wallY2, R.left, R.floorY); g.line(R.wallX2, R.wallY2, R.right, R.floorY);
  g.line(R.wallX1, R.wallY1, R.left, R.ceil); g.line(R.wallX2, R.wallY1, R.right, R.ceil);
  g.line(R.wallX1, R.wallY1, R.wallX2, R.wallY1);
  g.noFill(); g.strokeWeight(4); g.line(R.left, R.floorY, R.right, R.floorY);
}

function wallpaper(g, th) {
  const R = ROOM;
  g.noStroke();
  if (th.pattern === 'stars') {
    for (let y = R.wallY1 + 20, r = 0; y < R.wallY2; y += 46, r++) {
      for (let x = R.wallX1 + (r % 2 ? 30 : 6); x < R.wallX2; x += 52) {
        if ((x + y) % 3 < 1.5) star5(g, x, y, 6, th.dots, 0.45);
        else { g.fill(th.dots); g.arc(x, y, 12, 12, Math.PI * 0.4, Math.PI * 1.6, 'chord'); }
      }
    }
  } else if (th.pattern === 'dots') {
    for (let y = R.wallY1 + 14, r = 0; y < R.wallY2; y += 34, r++) {
      for (let x = R.wallX1 + (r % 2 ? 22 : 4); x < R.wallX2; x += 38) {
        if ((r + Math.round(x / 38)) % 4 === 0) heart(g, x, y, 5, th.dots2);
        else { g.fill(th.dots); g.ellipse(x, y, 10, 10); }
      }
    }
  } else if (th.pattern === 'butterflies') {
    for (let y = R.wallY1 + 26, r = 0; y < R.wallY2; y += 52, r++) {
      for (let x = R.wallX1 + (r % 2 ? 40 : 10); x < R.wallX2; x += 66) {
        g.fill((r + x) % 2 ? th.dots : th.dots2);
        g.ellipse(x - 5, y - 3, 10, 12); g.ellipse(x + 5, y - 3, 10, 12);
        g.ellipse(x - 4, y + 5, 7, 8); g.ellipse(x + 4, y + 5, 7, 8);
      }
    }
  } else if (th.pattern === 'stripes') {
    for (let x = R.wallX1; x < R.wallX2; x += 40) { g.fill(th.dots); g.rect(x, R.wallY1, 18, R.wallY2 - R.wallY1); }
    for (let y = R.wallY1 + 30; y < R.wallY2; y += 70) for (let x = R.wallX1 + 29; x < R.wallX2; x += 80) star4(g, x, y + (x % 160 ? 0 : 35), 4, th.dots2);
  } else {
    for (let x = R.wallX1; x < R.wallX2; x += 24) { g.fill(th.dots); g.rect(x, R.wallY1, 2, R.wallY2 - R.wallY1); }
  }
}

function drawWindow(g, sky, curtain) {
  const x1 = 545, x2 = 735, y1 = 100, y2 = 270;
  const skies = {
    night: [[0, '#1f1a5c'], [1, '#5a4bb0']],
    day: [[0, '#7fd0ff'], [1, '#d8f4ff']],
    afternoon: [[0, '#9fc4ff'], [0.6, '#ffd6b8'], [1, '#ffe9b0']],
    dusk: [[0, '#4a3a9c'], [0.55, '#c77dd9'], [1, '#ffab7a']],
    morning: [[0, '#bfe6ff'], [1, '#fff6e0']]
  };
  vGradient(g, x1, y1, x2 - x1, y2 - y1, skies[sky]);
  clipRect(g, x1, y1, x2 - x1, y2 - y1, () => {
    g.noStroke();
    if (sky === 'night') {
      g.fill('#fff6c9'); g.ellipse(690, 140, 34, 34); g.fill('#3a3190'); g.ellipse(700, 134, 30, 30);
      [[575, 130], [610, 175], [655, 120], [600, 230], [700, 215], [640, 200]].forEach(([x, y], i) => star4(g, x, y, i % 2 ? 4 : 6, '#fff6c9'));
    } else if (sky === 'day' || sky === 'morning') {
      g.fill('#ffe066'); g.ellipse(690, 140, 40, 40);
      g.fill(255, 255, 255, 230); g.ellipse(590, 160, 50, 22); g.ellipse(612, 152, 36, 22); g.ellipse(660, 210, 60, 20);
      g.fill('#9be59b'); g.ellipse(600, 280, 160, 60); g.ellipse(710, 286, 160, 60);
    } else if (sky === 'afternoon') {
      g.fill('#ffd27a'); g.ellipse(600, 210, 46, 46);
      g.fill('#8fd88f'); g.ellipse(620, 282, 200, 60); g.fill('#6cc77a'); g.rect(700, 210, 18, 60); g.ellipse(709, 205, 44, 50);
    } else if (sky === 'dusk') {
      g.fill('#ffcf8a'); g.ellipse(640, 262, 70, 70);
      g.fill('#2f2468'); g.rect(560, 236, 30, 40); g.rect(600, 220, 24, 60); g.rect(690, 230, 36, 50);
      star4(g, 580, 130, 4, '#fff6c9'); star4(g, 700, 118, 5, '#fff6c9');
    }
  });
  ink(g, 3); g.noFill(); g.rect(x1, y1, x2 - x1, y2 - y1);
  g.fill(255); g.rect(x1 - 8, y1 - 8, x2 - x1 + 16, 10, 3);
  g.rect(636, y1, 8, y2 - y1); g.rect(x1, 181, x2 - x1, 8);
  g.fill(255); g.rect(x1 - 14, y2, x2 - x1 + 28, 12, 3);
  if (curtain) {
    g.fill(curtain); ink(g, 2.5);
    g.beginShape(); g.vertex(x1 - 30, y1 - 14); g.vertex(x1 + 26, y1 - 14); g.bezierVertex(x1 + 14, 170, x1 + 30, 230, x1 + 6, 290); g.vertex(x1 - 30, 290); g.endShape('close');
    g.beginShape(); g.vertex(x2 + 30, y1 - 14); g.vertex(x2 - 26, y1 - 14); g.bezierVertex(x2 - 14, 170, x2 - 30, 230, x2 - 6, 290); g.vertex(x2 + 30, 290); g.endShape('close');
    g.fill(255); g.rect(x1 - 40, y1 - 20, x2 - x1 + 80, 8, 4);
  }
}

function lightBeam(g, a) {
  g.noStroke(); g.fill(255, 250, 220, a || 34);
  g.quad(545, 270, 735, 270, 860, 560, 560, 560);
}

function drawDoor(g, col, deco) {
  const x1 = 1010, x2 = 1095, y1 = 190, y2 = 420;
  ink(g, 3); g.fill('#ffffff'); g.rect(x1 - 7, y1 - 7, x2 - x1 + 14, y2 - y1 + 7, 3);
  g.fill(col); g.rect(x1, y1, x2 - x1, y2 - y1);
  ink(g, 2); g.noFill(); g.rect(x1 + 12, y1 + 14, x2 - x1 - 24, 86, 3); g.rect(x1 + 12, y1 + 116, x2 - x1 - 24, 96, 3);
  g.fill('#ffd35c'); g.ellipse(x1 + 14, 316, 11, 11);
  g.noStroke();
  if (deco === 'baby') { g.fill(255); g.rect(1025, 236, 56, 24, 12); g.fill(INK); g.textFont('Sniglet'); g.textSize(13); g.textAlign('center', 'center'); g.text('shh ☾', 1053, 247); }
  if (deco === 'letters') { ['#ff6f7d', '#7f9de8', '#ffcc33', '#5fc46a'].forEach((c, i) => { g.fill(c); g.ellipse(1028 + i * 13, 246, 13, 13); }); }
  if (deco === 'butterfly') { g.fill('#c7a8ff'); g.ellipse(1046, 246, 16, 18); g.ellipse(1062, 246, 16, 18); g.fill('#86f0e6'); g.ellipse(1048, 258, 11, 11); g.ellipse(1060, 258, 11, 11); }
  if (deco === 'keepout') {
    g.push(); g.translate(1053, 250); g.rotate(-0.06);
    ink(g, 2); g.fill('#fff27a'); g.rect(-34, -18, 68, 36, 3);
    g.noStroke(); g.fill('#ff3f7f'); g.textFont('Rubik Bubbles'); g.textSize(13); g.textAlign('center', 'center'); g.text('KEEP', 0, -6); g.text('OUT!!', 0, 8);
    g.pop();
  }
  if (deco === 'wreath') { ink(g, 3); g.noFill(); g.stroke('#7ed9a0'); g.ellipse(1053, 248, 30, 30); g.noStroke(); g.fill('#ff9fd2'); g.ellipse(1053, 262, 8, 8); }
}

/* ---------- furniture ---------- */

function shelfPlank(g, x1, x2, y, col) {
  ink(g, 2.5); g.fill(col || PAL.wood);
  g.triangle(x1 + 14, y + 10, x1 + 14, y + 36, x1 + 34, y + 10);
  g.triangle(x2 - 14, y + 10, x2 - 14, y + 36, x2 - 34, y + 10);
  g.rect(x1 - 6, y, x2 - x1 + 12, 11, 3);
}

function drawCot(g, x1, x2, top, bottom) {
  const col = '#fff0f6';
  ink(g, 2.5); g.fill(col);
  g.rect(x1 + 10, top - 62, x2 - x1 - 20, 8, 3);
  for (let x = x1 + 24; x < x2 - 14; x += 18) g.rect(x, top - 56, 6, 56, 2);
  g.fill('#cfe9ff'); g.rect(x1 + 6, top, x2 - x1 - 12, 24, 6);
  g.noStroke(); g.fill(255, 255, 255, 170); for (let x = x1 + 14; x < x2 - 14; x += 22) g.rect(x, top + 4, 10, 16, 3);
  ink(g, 2.5); g.fill(PAL.blush);
  g.beginShape(); g.vertex(x1 + 6, top + 24); g.vertex(x2 - 6, top + 24);
  for (let x = x2 - 6; x > x1 + 6; x -= 26) g.bezierVertex(x - 4, top + 52, x - 22, top + 52, x - 26, top + 24);
  g.endShape();
  g.fill(col);
  g.rect(x1, top - 80, 16, bottom - top + 80, 4); g.rect(x2 - 16, top - 80, 16, bottom - top + 80, 4);
  g.fill(PAL.pink); g.ellipse(x1 + 8, top - 86, 18, 18); g.ellipse(x2 - 8, top - 86, 18, 18);
  gloss(g, x1 + 5, top - 90, 6, 5);
}

function drawBed(g, x1, x2, top, bottom, style) {
  const s = {
    flowers: { frame: '#fff0f6', duvet: '#ffb3d9', pattern: 'flowers', pillow: '#ffffff' },
    butterflies: { frame: '#e9ddff', duvet: '#b8f2ea', pattern: 'butterflies', pillow: '#fff7d6' },
    messy: { frame: '#5b4a9c', duvet: '#9a7cf0', pattern: 'messy', pillow: '#e2d6ff' },
    linen: { frame: '#c8a27a', duvet: '#f4f1ea', pattern: 'linen', pillow: '#ffffff' },
    bare: { frame: '#c8a27a', duvet: '#e9e4f6', pattern: 'ticking', pillow: null }
  }[style];
  ink(g, 2.5); g.fill(s.frame);
  g.rect(x1, top - 86, 22, bottom - top + 86, 6);
  g.rect(x2 - 16, top - 26, 16, bottom - top + 26, 4);
  g.fill('#ffffff'); g.rect(x1 + 18, top + 6, x2 - x1 - 32, 22, 4);
  g.fill(s.duvet);
  if (style === 'messy') {
    g.beginShape(); g.vertex(x1 + 70, top + 2); g.bezierVertex(x1 + 120, top - 10, x1 + 180, top + 14, x2 - 16, top);
    g.vertex(x2 - 10, top + 56); g.bezierVertex(x2 - 80, top + 74, x1 + 120, top + 50, x1 + 60, top + 66); g.endShape('close');
  } else {
    g.rect(x1 + 60, top, x2 - x1 - 70, 46, 6, 6, 10, 10);
    g.rect(x1 + 60, top + 40, x2 - x1 - 70, 30, 0, 0, 10, 10);
  }
  g.noStroke();
  if (s.pattern === 'flowers') for (let x = x1 + 80; x < x2 - 20; x += 40) { g.fill(255); for (let k = 0; k < 5; k++) g.ellipse(x + Math.cos(k * 1.256) * 6, top + 22 + Math.sin(k * 1.256) * 6, 8, 8); g.fill('#ffd35c'); g.ellipse(x, top + 22, 6, 6); }
  if (s.pattern === 'butterflies') for (let x = x1 + 84; x < x2 - 20; x += 46) { g.fill('#c7a8ff'); g.ellipse(x - 5, top + 20, 10, 12); g.ellipse(x + 5, top + 20, 10, 12); }
  if (s.pattern === 'linen') { g.fill('#d9d4e8'); g.rect(x1 + 60, top + 10, x2 - x1 - 70, 6); }
  if (s.pattern === 'ticking') { g.fill('#c9c3e3'); for (let x = x1 + 70; x < x2 - 14; x += 14) g.rect(x, top + 2, 4, 66); }
  if (s.pattern === 'messy') { g.stroke(INK); g.strokeWeight(1.5); g.noFill(); g.bezier(x1 + 100, top + 20, x1 + 140, top + 10, x1 + 170, top + 34, x1 + 220, top + 24); }
  if (s.pillow) { ink(g, 2.5); g.fill(s.pillow); g.rect(x1 + 24, top - 16, 64, 24, 10); }
  ink(g, 2.5); g.fill(s.frame); g.rect(x1 + 30, bottom - 10, 10, 10); g.rect(x2 - 40, bottom - 10, 10, 10);
}

function drawDresser(g, x1, x2, top, bottom, col) {
  ink(g, 2.5); g.fill(col);
  g.rect(x1, top + 10, x2 - x1, bottom - top - 18, 4);
  g.fill('#ffffff'); g.rect(x1 - 8, top, x2 - x1 + 16, 12, 4);
  const h = (bottom - top - 30) / 3;
  for (let i = 0; i < 3; i++) {
    g.fill(col); g.rect(x1 + 10, top + 16 + i * h, x2 - x1 - 20, h - 6, 4);
    g.fill(PAL.hot); g.ellipse((x1 + x2) / 2, top + 13 + i * h + h / 2, 10, 10);
  }
  g.fill(col); g.rect(x1 + 8, bottom - 8, 12, 8); g.rect(x2 - 20, bottom - 8, 12, 8);
}

function drawBookshelf(g, x1, x2, top, mid, low, bottom, col) {
  ink(g, 2.5); g.fill(col); g.rect(x1, top, x2 - x1, bottom - top, 4);
  g.fill(rgba('#3a2a5c', 0.12)); g.noStroke(); g.rect(x1 + 10, top + 10, x2 - x1 - 20, bottom - top - 22);
  ink(g, 2.5); g.fill(col); g.rect(x1, mid, x2 - x1, 10); g.rect(x1, low, x2 - x1, 10);
  g.fill('#ffffff'); g.rect(x1 - 6, top - 4, x2 - x1 + 12, 10, 3);
}

function drawDesk(g, x1, x2, top, bottom, opts) {
  opts = opts || {};
  const col = opts.col || '#ffffff';
  ink(g, 2.5); g.fill(col);
  g.rect(x1 + 6, top + 10, 12, bottom - top - 10);
  g.rect(x2 - 80, top + 10, 74, bottom - top - 10, 3);
  g.fill(opts.drawer || PAL.lilac);
  g.rect(x2 - 72, top + 20, 58, 30, 3); g.rect(x2 - 72, top + 58, 58, 30, 3);
  g.fill(PAL.gold); g.ellipse(x2 - 43, top + 35, 8, 8); g.ellipse(x2 - 43, top + 73, 8, 8);
  g.fill(col); g.rect(x1 - 6, top, x2 - x1 + 12, 13, 3);
  // chair, tucked in on the left
  g.fill(opts.chair || PAL.pink);
  g.rect(x1 + 30, top + 26, 70, 52, 12);
  g.rect(x1 + 26, top + 74, 80, 12, 5);
  g.line(x1 + 36, top + 86, x1 + 34, bottom); g.line(x1 + 96, top + 86, x1 + 98, bottom);
  if (opts.lamp) {
    const lx = x2 - 22;
    g.fill(opts.lamp); g.ellipse(lx, top - 3, 30, 8);
    g.strokeWeight(4); g.line(lx, top - 4, lx - 12, top - 46); g.line(lx - 12, top - 46, lx + 4, top - 70);
    ink(g, 2.5); g.fill(opts.lamp); g.arc(lx + 10, top - 62, 40, 34, Math.PI * 0.95, Math.PI * 1.95, 'chord');
  }
  if (opts.papers) {
    [[x1 + 60, -0.2], [x1 + 110, 0.15], [x1 + 160, -0.05]].forEach(([px, a]) => {
      g.push(); g.translate(px, top - 2); g.rotate(a); ink(g, 1.5); g.fill(255); g.rect(-20, -4, 40, 5, 1); g.pop();
    });
  }
}

function drawRug(g, cx, cy, w, h, c1, c2) {
  ink(g, 2.5); g.fill(c1); g.ellipse(cx, cy, w, h);
  g.noFill(); g.stroke(c2); g.strokeWeight(5); g.ellipse(cx, cy, w - 30, h - 14);
  g.stroke(255); g.strokeWeight(2); g.drawingContext.setLineDash([6, 8]); g.ellipse(cx, cy, w - 60, h - 26); g.drawingContext.setLineDash([]);
}

function drawToyBox(g, x1, y1, x2, y2) {
  ink(g, 2.5); g.fill('#ffd35c');
  g.quad(x1 + 4, y1 - 2, x2 - 4, y1 - 2, x2 + 6, y1 - 40, x1 + 14, y1 - 46);
  g.fill('#7fb6ff'); g.rect(x1, y1, x2 - x1, y2 - y1, 6);
  g.noStroke(); g.fill(255); g.textFont('Rubik Bubbles'); g.textSize(20); g.textAlign('center', 'center');
  g.text('TOYS', (x1 + x2) / 2, (y1 + y2) / 2 + 2);
  star4(g, x1 + 14, y1 + 12, 6, '#fff2a8'); star4(g, x2 - 14, y2 - 12, 5, '#fff2a8');
}

function drawBasket(g, x1, y1, x2, y2) {
  ink(g, 2.5); g.fill('#f0d6a8'); g.rect(x1, y1, x2 - x1, y2 - y1, 6, 6, 12, 12);
  g.stroke('#c9a26e'); g.strokeWeight(2);
  for (let y = y1 + 12; y < y2 - 4; y += 12) g.line(x1 + 4, y, x2 - 4, y);
  for (let x = x1 + 12; x < x2 - 4; x += 14) g.line(x, y1 + 4, x, y2 - 6);
  ink(g, 2.5); g.noFill(); g.rect(x1, y1, x2 - x1, y2 - y1, 6, 6, 12, 12);
  g.fill('#f0d6a8'); g.rect(x1 - 4, y1 - 4, x2 - x1 + 8, 10, 4);
}

function drawHookRail(g, x1, x2, y) {
  ink(g, 2.5); g.fill(PAL.wood); g.rect(x1 - 10, y - 18, x2 - x1 + 20, 12, 4);
  for (let x = x1 + 20; x < x2; x += 58) { g.fill(PAL.hot); g.ellipse(x, y - 4, 10, 10); }
}

function drawSocket(g, x, y) { ink(g, 2); g.fill(255); g.rect(x - 9, y - 12, 18, 24, 3); g.noStroke(); g.fill(INK); g.rect(x - 4, y - 6, 2, 6); g.rect(x + 2, y - 6, 2, 6); }

function drawTeaTable(g, cx, top, w, bottom) {
  ink(g, 2.5); g.fill('#ffffff');
  g.rect(cx - w / 2 + 20, top + 10, 12, bottom - top - 10, 3); g.rect(cx + w / 2 - 32, top + 10, 12, bottom - top - 10, 3);
  g.fill('#ffd1e8'); g.ellipse(cx, top + 6, w, 22);
  g.fill('#ffffff'); g.rect(cx - w / 2 + 4, top + 6, w - 8, 14, 0, 0, 8, 8);
  g.noStroke(); g.fill('#ff9fd2'); for (let x = cx - w / 2 + 16; x < cx + w / 2 - 8; x += 18) g.ellipse(x, top + 15, 7, 7);
  // tiny stools
  ink(g, 2.5); g.fill('#b9f5d0'); g.ellipse(cx - w / 2 - 34, bottom - 22, 46, 14); g.line(cx - w / 2 - 34, bottom - 16, cx - w / 2 - 34, bottom + 6);
  g.fill('#fff2a8'); g.ellipse(cx + w / 2 + 34, bottom - 22, 46, 14); g.line(cx + w / 2 + 34, bottom - 16, cx + w / 2 + 34, bottom + 6);
}

function drawStackedBoxes(g) {
  const boxes = [[1124, 470, 120, 84, 'BOOKS'], [1138, 392, 100, 78, 'CLOTHES'], [1150, 326, 78, 66, 'MISC ♥']];
  boxes.forEach(([x, y, w, h, label]) => {
    ink(g, 2.5); g.fill('#e7b886'); g.rect(x, y, w, h, 3);
    g.noStroke(); g.fill(255, 240, 170, 200); g.rect(x + w / 2 - 9, y, 18, h);
    g.fill(INK); g.textFont('Sniglet'); g.textSize(13); g.textAlign('center', 'center'); g.text(label, x + w / 2, y + h / 2 + 8);
  });
}

function glowStarsOnCeiling(g) {
  [[260, 52], [420, 50], [600, 54], [820, 50], [980, 53]].forEach(([x, y], i) => star5(g, x, y, i % 2 ? 5 : 7, 'rgba(225,255,170,0.9)'));
}

/* ---------- one background per chapter ---------- */

function bgNursery(g, L) {
  roomShell(g, { ceil: '#fff7dc', side: '#f6e2a8', side2: '#f2dc9c', wall: '#fff1c1', dots: '#d9c4ff', floor: '#e9c79c', floor2: '#d7b384', base: '#ffffff', pattern: 'stars' });
  g.noStroke(); glowStarsOnCeiling(g);
  drawWindow(g, 'night', '#cfe9ff');
  drawDoor(g, '#ffe7f3', 'baby');
  shelfPlank(g, L.shelf.x1, L.shelf.x2, L.shelf.y, '#ffffff');
  drawDresser(g, L.dresser.x1, L.dresser.x2, L.dresser.top, L.dresser.bottom, '#cfe9ff');
  drawSocket(g, L.socket.x, L.socket.y + 6);
  drawRug(g, 640, 515, 400, 70, '#b9f5d0', '#ffffff');
  drawCot(g, L.cot.x1, L.cot.x2, L.cot.top, L.cot.bottom);
  ink(g, 1.6); g.line(L.mobile.x, ROOM.ceil + 20, L.mobile.x, L.mobile.y - 60);
  g.noFill(); g.ellipse(L.mobile.x, L.mobile.y - 60, 8, 8);
  // night tint
  g.noStroke(); g.fill(60, 40, 140, 26); g.rect(0, 0, 1280, 570);
}

function bgChildhood(g, L) {
  roomShell(g, { ceil: '#fff0f7', side: '#ffbfdc', side2: '#ffb6d6', wall: '#ffd1e8', dots: '#ffffff', dots2: '#ff9fd2', floor: '#e8bf92', floor2: '#d6aa7a', base: '#ffffff', pattern: 'dots' });
  lightBeam(g, 30);
  drawWindow(g, 'day', '#ffffff');
  drawDoor(g, '#fff6fb', 'letters');
  drawHookRail(g, L.hooks.x1, L.hooks.x2, L.hooks.y);
  drawBookshelf(g, L.shelf.x1, L.shelf.x2, L.shelf.top, L.shelf.mid, L.shelf.low, L.shelf.bottom, '#fff2a8');
  drawRug(g, 640, 522, 440, 70, '#c7a8ff', '#ffffff');
  drawBed(g, L.bed.x1, L.bed.x2, L.bed.top, L.bed.bottom, 'flowers');
  drawTeaTable(g, 640, L.table.y, 240, 530);
  drawToyBox(g, L.toybox.x1, L.toybox.y1, L.toybox.x2, L.toybox.y2);
}

function bgTween(g, L) {
  roomShell(g, { ceil: '#f6f0ff', side: '#d2c0ff', side2: '#cbb6ff', wall: '#e3d4ff', dots: '#b9a2ff', dots2: '#8fe3d9', floor: '#dcb38a', floor2: '#c99e74', base: '#ffffff', pattern: 'butterflies' });
  lightBeam(g, 36);
  drawWindow(g, 'afternoon', '#fff2a8');
  drawDoor(g, '#f4eeff', 'butterfly');
  shelfPlank(g, L.shelf.x1, L.shelf.x2, L.shelf.y, '#ffffff');
  drawRug(g, 640, 520, 360, 64, '#86f0e6', '#ffffff');
  drawDesk(g, L.desk.x1, L.desk.x2, L.desk.top, L.desk.bottom, { lamp: '#ff9fd2', chair: '#86f0e6', drawer: '#c7a8ff' });
  drawBed(g, L.bed.x1, L.bed.x2, L.bed.top, L.bed.bottom, 'butterflies');
}

function bgTeen(g, L) {
  roomShell(g, { ceil: '#eafbf8', side: '#8fd9cf', side2: '#86d2c8', wall: '#b8f0e6', dots: '#a2e6db', dots2: '#ffffff', floor: '#c9a27c', floor2: '#b58f6a', base: '#ffffff', pattern: 'stripes' });
  lightBeam(g, 22);
  drawWindow(g, 'dusk', '#9a7cf0');
  drawDoor(g, '#ffffff', 'keepout');
  shelfPlank(g, L.shelf.x1, L.shelf.x2, L.shelf.y, '#3a2a5c');
  drawRug(g, 700, 522, 300, 60, '#ff9fd2', '#3a2a5c');
  drawDesk(g, L.desk.x1, L.desk.x2, L.desk.top, L.desk.bottom, { lamp: '#3a2a5c', chair: '#9a7cf0', drawer: '#86f0e6', papers: true });
  drawBed(g, L.bed.x1, L.bed.x2, L.bed.top, L.bed.bottom, 'messy');
  drawBasket(g, L.basket.x1, L.basket.y1, L.basket.x2, L.basket.y2);
}

function bgYoungAdult(g, L) {
  roomShell(g, { ceil: '#fffdf6', side: '#e7e1cf', side2: '#e2dbc6', wall: '#f3efe2', dots: '#ebe5d2', floor: '#d8b896', floor2: '#c7a682', base: '#ffffff', pattern: 'plain' });
  lightBeam(g, 40);
  drawWindow(g, 'morning', null);
  drawDoor(g, '#ffffff', 'wreath');
  shelfPlank(g, L.shelf.x1, L.shelf.x2, L.shelf.y, '#c8a27a');
  drawRug(g, 640, 520, 420, 66, '#e9e4f6', '#c7a8ff');
  drawDesk(g, L.desk.x1, L.desk.x2, L.desk.top, L.desk.bottom, { col: '#f7f2e8', chair: '#c8a27a', drawer: '#e9e4f6' });
  drawBed(g, L.bed.x1, L.bed.x2, L.bed.top, L.bed.bottom, 'linen');
}

function bgMovingOut(g, L) {
  roomShell(g, { ceil: '#fffdf6', side: '#e7e1cf', side2: '#e2dbc6', wall: '#f3efe2', dots: '#ebe5d2', floor: '#d8b896', floor2: '#c7a682', base: '#ffffff', pattern: 'plain' });
  lightBeam(g, 52);
  drawWindow(g, 'morning', null);
  drawDoor(g, '#ffffff', null);
  shelfPlank(g, L.shelf.x1, L.shelf.x2, L.shelf.y, '#c8a27a');
  drawDesk(g, L.desk.x1, L.desk.x2, L.desk.top, L.desk.bottom, { col: '#f7f2e8', chair: '#c8a27a', drawer: '#e9e4f6' });
  drawBed(g, L.bed.x1, L.bed.x2, L.bed.top, L.bed.bottom, 'bare');
  drawStackedBoxes(g);
}
