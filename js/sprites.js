/* =========================================================
   sprites.js — every object in the room, drawn with p5.
   Each sprite is drawn centred on (0,0) inside a w x h box.
   `g` is the p5 instance or a p5.Graphics, `t` is time (ms).
   Swap any of these for real artwork later: see README.
   ========================================================= */
'use strict';

const INK = '#3a2a5c';
const PAL = {
  pink: '#ff9fd2', hot: '#ff5fb8', blush: '#ffd1e8', lilac: '#c7a8ff', grape: '#8f6bff',
  peri: '#9fb2ff', aqua: '#86f0e6', sky: '#9fdcff', mint: '#b9f5d0', lime: '#c9ff7a',
  lemon: '#fff2a8', gold: '#ffd35c', peach: '#ffc8a8', cream: '#fff8ec', white: '#ffffff',
  tan: '#e8b685', wood: '#d9a26f', woodDark: '#a8703f', red: '#ff6f7d', navy: '#2f2a6b',
  silver: '#e6e9f5', grey: '#cfd3e6', denim: '#7f9de8', teal: '#5fd0c4'
};

function ink(g, w) { g.stroke(INK); g.strokeWeight(w || 2.5); }
function gloss(g, x, y, w, h, a) { g.noStroke(); g.fill(255, 255, 255, a == null ? 150 : a); g.ellipse(x, y, w, h); }

function star4(g, x, y, r, col, inner) {
  g.noStroke(); g.fill(col);
  g.beginShape();
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 4;
    const rr = i % 2 ? r * (inner || 0.3) : r;
    g.vertex(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.endShape('close');
}

function star5(g, x, y, r, col, inner) {
  g.fill(col);
  g.beginShape();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? r * (inner || 0.45) : r;
    g.vertex(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.endShape('close');
}

function heart(g, x, y, s, col) {
  g.fill(col);
  g.beginShape();
  g.vertex(x, y + s * 0.6);
  g.bezierVertex(x - s * 1.2, y - s * 0.2, x - s * 0.6, y - s * 1.1, x, y - s * 0.45);
  g.bezierVertex(x + s * 0.6, y - s * 1.1, x + s * 1.2, y - s * 0.2, x, y + s * 0.6);
  g.endShape('close');
}

function tape(g, x, y, w, h, a) {
  g.push(); g.translate(x, y); g.rotate(a || 0);
  g.noStroke(); g.fill(255, 240, 170, 190); g.rect(-w / 2, -h / 2, w, h, 2);
  g.pop();
}

/* ---------------- 1. NURSERY ---------------- */

function sTeddy(g) {
  ink(g); g.fill('#d79a62');
  g.ellipse(-19, -27, 18, 18); g.ellipse(19, -27, 18, 18);       // ears
  g.ellipse(-23, 10, 15, 24); g.ellipse(23, 10, 15, 24);         // arms
  g.ellipse(-13, 29, 20, 13); g.ellipse(13, 29, 20, 13);         // feet
  g.ellipse(0, 15, 44, 40);                                       // body
  g.noStroke(); g.fill('#f2c79c'); g.ellipse(0, 19, 22, 18);
  g.ellipse(-19, -27, 8, 8); g.ellipse(19, -27, 8, 8);
  ink(g); g.fill('#d79a62'); g.ellipse(0, -13, 40, 34);          // head
  ink(g, 2); g.fill('#f6d7b3'); g.ellipse(0, -7, 18, 13);         // muzzle
  g.noStroke(); g.fill(INK);
  g.ellipse(0, -10, 7, 5); g.ellipse(-8, -18, 5, 6); g.ellipse(8, -18, 5, 6);
  g.fill(255, 150, 190, 150); g.ellipse(-13, -9, 7, 4); g.ellipse(13, -9, 7, 4);
  ink(g, 2); g.fill(PAL.hot);                                     // bow
  g.triangle(0, 4, -12, -2, -12, 10); g.triangle(0, 4, 12, -2, 12, 10);
  g.fill(PAL.pink); g.ellipse(0, 4, 7, 7);
  gloss(g, -8, -22, 9, 5, 120);
}

function sBlanket(g, w, h) {
  ink(g); g.fill('#a9d8ff'); g.rect(-w / 2, -h / 2, w, h, 9);
  g.noStroke(); g.fill(255, 255, 255, 120);
  for (let x = -w / 2 + 10; x < w / 2 - 4; x += 16) g.rect(x, -h / 2 + 3, 6, h - 6, 2);
  ink(g, 2); g.fill('#c6e6ff'); g.rect(-w / 2, -h / 2, w, 11, 9, 9, 3, 3);
  g.noStroke(); heart(g, w / 2 - 16, 4, 6, PAL.pink); heart(g, -w / 2 + 16, 4, 6, PAL.pink);
}

function sMobile(g, w, h, t) {
  const s = Math.sin(t / 700) * 0.12;
  ink(g, 2); g.noFill(); g.ellipse(0, -55, 10, 10);
  g.line(0, -50, 0, -38);
  g.push(); g.translate(0, -38); g.rotate(s * 0.4);
  ink(g, 3); g.line(-46, 0, 46, 0);
  g.fill(PAL.wood); ink(g, 2); g.ellipse(-46, 0, 8, 8); g.ellipse(46, 0, 8, 8);
  const hangs = [[-40, 40, 'star'], [0, 58, 'moon'], [40, 40, 'cloud']];
  hangs.forEach(([x, len, kind], i) => {
    g.push(); g.translate(x, 0); g.rotate(Math.sin(t / 520 + i * 2) * 0.18);
    ink(g, 1.5); g.line(0, 0, 0, len - 14);
    g.translate(0, len);
    if (kind === 'star') { ink(g, 2); star5(g, 0, 0, 15, PAL.lemon); }
    if (kind === 'moon') {
      ink(g, 2); g.fill(PAL.lilac); g.arc(0, 0, 28, 28, Math.PI * 0.35, Math.PI * 1.65, 'chord');
      g.noStroke(); g.fill(INK); g.ellipse(-4, -2, 3, 3);
    }
    if (kind === 'cloud') {
      ink(g, 2); g.fill(PAL.pink);
      g.ellipse(-8, 3, 18, 14); g.ellipse(8, 3, 18, 14); g.ellipse(0, -3, 20, 18);
      g.noStroke(); g.rect(-12, 0, 24, 9);
    }
    g.pop();
  });
  g.pop();
}

function sSnowglobe(g, w, h, t) {
  ink(g); g.fill(PAL.wood); g.quad(-22, 29, 22, 29, 17, 13, -17, 13);
  g.fill(PAL.pink); g.rect(-19, 18, 38, 5, 2);
  g.fill(200, 240, 255, 150); g.ellipse(0, -6, 46, 46);
  g.noStroke(); g.fill(255); g.arc(0, -6, 40, 40, 0.15, Math.PI - 0.15, 'chord');
  // tiny teddy inside
  g.fill('#d79a62'); g.ellipse(0, 4, 13, 12); g.ellipse(0, -5, 11, 10);
  g.ellipse(-4, -10, 4, 4); g.ellipse(4, -10, 4, 4);
  // glitter
  for (let i = 0; i < 14; i++) {
    const ph = (t / 2600 + i * 0.137) % 1;
    const x = Math.sin(i * 12.9) * 15 + Math.sin(t / 900 + i) * 2;
    const y = -26 + ph * 34;
    g.fill(i % 3 === 0 ? PAL.hot : i % 3 === 1 ? PAL.gold : 255);
    g.ellipse(x, y, 2.6, 2.6);
  }
  ink(g); g.noFill(); g.ellipse(0, -6, 46, 46);
  gloss(g, -9, -18, 12, 8, 170);
}

function sRabbitBooks(g) {
  const books = [[-34, 52, '#9fc5ff'], [-19, 46, '#fff3c9'], [-5, 50, '#b9f5d0'], [9, 44, '#ffc8a8']];
  books.forEach(([x, hh, c]) => {
    ink(g, 2); g.fill(c); g.rect(x, 28 - hh, 14, hh, 2);
    g.noStroke(); g.fill(255, 255, 255, 140); g.rect(x + 2, 28 - hh + 6, 10, 3);
  });
  g.push(); g.translate(28, 28); g.rotate(0.32);
  ink(g, 2); g.fill('#ffd1e8'); g.rect(-14, -46, 14, 46, 2); g.pop();
  // little rabbit on the blue spine
  g.noStroke(); g.fill(255);
  g.ellipse(-27, 0, 8, 7); g.ellipse(-29, -6, 3, 7); g.ellipse(-25, -6, 3, 7);
}

function sNightlight(g, w, h, t) {
  const glow = 0.75 + Math.sin(t / 600) * 0.25;
  g.noStroke(); g.fill(255, 240, 150, 60 * glow); g.ellipse(0, -4, 46, 46);
  ink(g, 2); g.fill(PAL.silver); g.rect(-10, 4, 20, 16, 4);
  g.fill(PAL.lemon); g.ellipse(0, -6, 30, 28);
  g.noStroke(); g.fill(255, 255, 255, 160); g.ellipse(-5, -12, 9, 6);
  ink(g, 1.6); g.noFill();
  g.arc(-6, -5, 6, 4, 0, Math.PI); g.arc(6, -5, 6, 4, 0, Math.PI);
  g.noStroke(); g.fill(255, 150, 190, 170); g.ellipse(-9, 1, 5, 3); g.ellipse(9, 1, 5, 3);
}

function sRattle(g) {
  ink(g, 2); g.fill(PAL.pink); g.rect(-24, -4, 26, 8, 4);
  g.fill(PAL.lemon); g.ellipse(-24, 0, 12, 12);
  ink(g); g.fill(PAL.aqua); g.ellipse(11, 0, 28, 28);
  g.noFill(); ink(g, 2); g.ellipse(11, 0, 28, 10);
  gloss(g, 5, -7, 9, 6);
  g.noStroke(); star4(g, 17, 6, 4, 255);
}

function sBottle(g) {
  ink(g, 2); g.fill(PAL.tan); g.ellipse(0, -22, 12, 14);
  g.fill(PAL.pink); g.rect(-11, -18, 22, 8, 3);
  g.fill(255, 255, 255, 200); g.rect(-11, -10, 22, 38, 8);
  g.noStroke(); g.fill(PAL.cream); g.rect(-9, 4, 18, 22, 0, 0, 6, 6);
  g.stroke(PAL.hot); g.strokeWeight(1.5);
  for (let y = -4; y < 24; y += 7) g.line(4, y, 9, y);
  gloss(g, -5, -2, 4, 14, 170);
}

/* ---------------- 2. CHILDHOOD ---------------- */

function sPictureBooks(g) {
  ink(g, 2);
  g.fill(PAL.pink); g.rect(-38, 16, 60, 13, 3);
  g.fill(PAL.mint); g.rect(-34, 4, 56, 12, 3);
  g.noStroke(); g.fill(255, 255, 255, 150); g.rect(-30, 19, 50, 3); g.rect(-28, 7, 46, 3);
  ink(g, 2); g.fill(PAL.lilac); g.rect(10, -30, 26, 59, 3);
  g.fill(PAL.lemon); g.rect(14, -2, 18, 14);
  g.triangle(14, -2, 23, -12, 32, -2);
  g.noStroke(); star4(g, 23, -20, 5, 255);
}

function sTeaset(g) {
  // teapot
  ink(g); g.fill(PAL.pink);
  g.quad(-44, -6, -38, -8, -30, 6, -36, 8);                     // spout
  g.noFill(); g.arc(-8, 4, 18, 20, -Math.PI / 2, Math.PI / 2);   // handle
  g.fill(PAL.pink); g.ellipse(-24, 6, 40, 32);
  g.fill(PAL.lilac); g.ellipse(-24, -10, 22, 8); g.ellipse(-24, -16, 7, 7);
  g.noStroke(); g.fill(255);
  [[-32, 4], [-22, 12], [-16, 0], [-28, 14]].forEach(([x, y]) => g.ellipse(x, y, 4, 4));
  gloss(g, -32, -2, 8, 5);
  // cups
  [[12, 'aqua'], [36, 'lemon']].forEach(([x, c]) => {
    ink(g, 2); g.fill(PAL.white); g.ellipse(x, 20, 26, 7);
    g.fill(PAL[c]); g.quad(x - 10, 4, x + 10, 4, x + 7, 17, x - 7, 17);
    g.noFill(); g.arc(x + 11, 10, 8, 9, -Math.PI / 2, Math.PI / 2);
    g.noStroke(); g.fill(255); g.ellipse(x - 2, 10, 4, 4);
  });
}

function sDoll(g) {
  ink(g, 2); g.fill('#ffd66b'); g.ellipse(0, -19, 34, 34);          // hair back
  g.fill(PAL.peach); g.ellipse(0, -18, 25, 25);
  g.noStroke(); g.fill('#ffd66b'); g.arc(0, -24, 26, 18, Math.PI, Math.PI * 2, 'chord');
  ink(g, 2); g.fill(PAL.pink);                                       // dress
  g.triangle(0, -6, -19, 26, 19, 26);
  g.line(-6, 26, -6, 36); g.line(6, 26, 6, 36);
  g.line(-8, 0, -16, 12); g.line(8, 0, 16, 12);
  g.fill(255); g.ellipse(0, -4, 12, 6);
  g.noStroke(); g.fill(INK); g.ellipse(-5, -18, 4, 4); g.ellipse(5, -18, 4, 4);
  g.fill(255, 120, 170, 160); g.ellipse(-8, -13, 5, 3); g.ellipse(8, -13, 5, 3);
  ink(g, 1.5); g.fill(PAL.hot); g.triangle(10, -34, 18, -38, 18, -28); g.triangle(10, -34, 3, -40, 4, -29);
  g.noStroke(); g.fill(255); [[-8, 10], [6, 16], [0, 20]].forEach(([x, y]) => g.ellipse(x, y, 3, 3));
}

function sTutu(g, w, h) {
  ink(g, 2); g.noFill(); g.arc(0, -22, 12, 12, Math.PI, Math.PI * 2);
  g.line(-22, -16, 0, -24); g.line(22, -16, 0, -24); g.line(-22, -16, 22, -16);
  g.fill(PAL.lilac); g.rect(-20, -16, 40, 7, 3);
  for (let layer = 0; layer < 3; layer++) {
    const y = -6 + layer * 9, half = 22 + layer * 7;
    g.fill(layer % 2 ? '#ffc4e4' : '#ffb0dc'); ink(g, 1.6);
    g.beginShape();
    g.vertex(-half, y);
    for (let x = -half; x <= half; x += 9) g.bezierVertex(x + 2, y + 15, x + 7, y + 15, x + 9, y);
    g.vertex(half, y - 4); g.vertex(-half, y - 4);
    g.endShape('close');
  }
  g.noStroke(); star4(g, -12, 4, 4, 255); star4(g, 14, 14, 3.5, 255);
}

function sWings(g, w, h, t) {
  const a = Math.sin(t / 900) * 0.04;
  ink(g, 2); g.line(0, -34, 0, -22);
  [-1, 1].forEach(s => {
    g.push(); g.rotate(s * a);
    ink(g, 2); g.fill(214, 190, 255, 190);
    g.push(); g.translate(s * 20, -8); g.rotate(s * -0.5); g.ellipse(0, 0, 40, 26); g.pop();
    g.fill(170, 240, 235, 190);
    g.push(); g.translate(s * 16, 16); g.rotate(s * 0.55); g.ellipse(0, 0, 30, 20); g.pop();
    g.noStroke(); star4(g, s * 22, -10, 4, 255); star4(g, s * 15, 17, 3, 255);
    g.pop();
  });
  ink(g, 2); g.fill(PAL.hot); g.ellipse(0, 0, 9, 22);
}

function sDrawing(g, w, h) {
  ink(g, 2); g.fill(255); g.rect(-w / 2, -h / 2, w, h, 2);
  tape(g, -w / 2 + 6, -h / 2 + 2, 18, 7, -0.6); tape(g, w / 2 - 6, -h / 2 + 2, 18, 7, 0.6);
  g.strokeWeight(2.4);
  g.stroke('#ffcc33'); g.noFill(); g.ellipse(26, -18, 12, 12);
  for (let i = 0; i < 6; i++) { const an = i * Math.PI / 3; g.line(26 + Math.cos(an) * 9, -18 + Math.sin(an) * 9, 26 + Math.cos(an) * 13, -18 + Math.sin(an) * 13); }
  g.stroke('#ff6f7d'); g.triangle(-30, -6, -18, -20, -6, -6);
  g.stroke('#7f9de8'); g.rect(-28, -6, 20, 18);
  g.stroke('#5fc46a'); g.line(-38, 24, 38, 24);
  const people = [[2, 2, '#c07a3a', 12], [11, 2, '#ff5fb8', 12], [19, 7, '#8f6bff', 8], [26, 8, '#5fd0c4', 7]];
  people.forEach(([x, y, c, s]) => {
    g.stroke(c); g.ellipse(x, y, 5, 5); g.line(x, y + 3, x, y + s + 4); g.line(x - 3, y + 7, x + 3, y + 7);
  });
  g.noStroke(); g.fill('#c98d5a'); g.ellipse(33, 18, 9, 10); g.ellipse(33, 12, 7, 7);
}

function sCrayons(g) {
  const cs = [[-14, -4, 0.3, '#ff6f7d'], [4, 2, -0.2, '#7f9de8'], [14, -6, 0.9, '#ffcc33'], [-4, 8, -0.7, '#5fc46a']];
  cs.forEach(([x, y, a, c]) => {
    g.push(); g.translate(x, y); g.rotate(a);
    ink(g, 1.6); g.fill(c); g.rect(-11, -3.5, 18, 7, 1);
    g.triangle(7, -3.5, 13, 0, 7, 3.5);
    g.noStroke(); g.fill(255, 255, 255, 150); g.rect(-6, -3.5, 6, 7);
    g.pop();
  });
}

function sTruck(g) {
  ink(g); g.fill(PAL.lemon); g.quad(-6, -16, 34, -16, 30, 8, -6, 8);
  g.fill('#7fb6ff'); g.rect(-34, -10, 28, 20, 5);
  g.fill(PAL.aqua); g.rect(-28, -6, 12, 8, 2);
  g.fill('#7fb6ff'); g.rect(-34, 4, 66, 8, 3);
  g.fill(INK); g.ellipse(-20, 14, 16, 16); g.ellipse(20, 14, 16, 16);
  g.noStroke(); g.fill(PAL.grey); g.ellipse(-20, 14, 6, 6); g.ellipse(20, 14, 6, 6);
  gloss(g, 8, -11, 18, 4, 140);
}

/* ---------------- 3. TWEEN ---------------- */

function sBackpack(g) {
  ink(g, 2); g.noFill(); g.arc(0, -30, 26, 20, Math.PI, Math.PI * 2);
  ink(g); g.fill('#a98cff'); g.rect(-28, -32, 56, 70, 18);
  g.fill('#c9b8ff'); g.rect(-20, 4, 40, 28, 9);
  ink(g, 2); g.line(-14, 10, 14, 10);
  g.fill(PAL.gold); g.ellipse(14, 10, 5, 5);
  g.line(-28, -10, -32, 20); g.line(28, -10, 32, 20);
  // keyrings
  ink(g, 1.5); g.line(20, -24, 24, -14); g.line(20, -24, 14, -12);
  ink(g, 1.5); star5(g, 25, -10, 7, PAL.lemon);
  g.fill(PAL.pink); g.ellipse(13, -8, 10, 10); g.ellipse(9, -13, 4, 4); g.ellipse(17, -13, 4, 4);
  gloss(g, -14, -20, 12, 18, 90);
}

function skate(g, x, y, c) {
  g.push(); g.translate(x, y);
  ink(g, 2); g.fill(c);
  g.beginShape();
  g.vertex(-22, -24); g.vertex(-6, -24); g.vertex(-4, -6); g.vertex(16, -2);
  g.bezierVertex(24, 0, 24, 8, 20, 10); g.vertex(-22, 10);
  g.endShape('close');
  g.fill(255); g.rect(-24, 9, 46, 5, 2);
  g.line(-10, -20, -4, -16); g.line(-10, -14, -4, -10); g.line(-10, -8, -2, -5);
  g.fill(PAL.aqua);
  [-16, -5, 6, 16].forEach(wx => g.ellipse(wx, 18, 9, 9));
  g.fill(PAL.hot); g.ellipse(22, 12, 6, 6);
  gloss(g, -15, -12, 6, 14, 120);
  g.pop();
}

function sSkates(g) { skate(g, -12, -2, '#e2c6ff'); skate(g, 10, 4, PAL.pink); }

function sArtSupplies(g) {
  ink(g, 2); g.fill(PAL.cream); g.ellipse(-14, 4, 56, 30);
  g.fill(PAL.peach); g.ellipse(-26, 8, 10, 8);
  g.noStroke();
  [[-28, -2, PAL.hot], [-16, -6, PAL.lemon], [-4, -2, PAL.aqua], [-6, 10, PAL.grape], [-18, 12, '#5fc46a']].forEach(([x, y, c]) => { g.fill(c); g.ellipse(x, y, 9, 7); });
  [[18, -8, -0.4, PAL.hot], [26, -6, -0.2, PAL.peri], [34, -4, 0.05, '#5fc46a']].forEach(([x, y, a, c]) => {
    g.push(); g.translate(x, y); g.rotate(a);
    ink(g, 1.5); g.fill(c); g.rect(-3, -12, 6, 30, 1);
    g.fill(PAL.tan); g.triangle(-3, 18, 3, 18, 0, 24);
    g.pop();
  });
}

function sSketch(g, w, h) {
  ink(g, 2); g.fill('#fffdf4'); g.rect(-w / 2, -h / 2, w, h, 2);
  tape(g, 0, -h / 2 + 2, 20, 7, 0.1);
  g.stroke(205, 200, 225); g.strokeWeight(1);
  for (let y = -h / 2 + 12; y < h / 2; y += 9) g.line(-w / 2 + 4, y, w / 2 - 4, y);
  // novice anime face
  ink(g, 2); g.fill('#b58cff');
  g.beginShape(); g.vertex(-24, 6); g.vertex(-22, -22); g.vertex(-10, -32); g.vertex(4, -34); g.vertex(18, -28); g.vertex(24, -12); g.vertex(26, 14); g.vertex(16, 4); g.vertex(-14, 4); g.endShape('close');
  g.fill(PAL.peach); g.ellipse(0, -4, 34, 36);
  g.fill('#b58cff'); g.triangle(-16, -18, 6, -24, -2, -8); g.triangle(4, -22, 18, -16, 12, -6);
  g.fill(INK); g.ellipse(-8, -2, 9, 13); g.ellipse(8, -2, 9, 13);
  g.noStroke(); g.fill(255); g.ellipse(-9, -5, 4, 4); g.ellipse(7, -5, 4, 4);
  ink(g, 1.5); g.line(-2, 10, 2, 10);
  g.noStroke(); g.fill(255, 140, 180, 150); g.ellipse(-12, 6, 6, 3); g.ellipse(12, 6, 6, 3);
  g.stroke(160, 150, 190); g.strokeWeight(1.5); g.noFill(); g.arc(0, 30, 30, 10, Math.PI, Math.PI * 2);
}

function sFamilyPhoto(g, w, h) {
  ink(g); g.fill(PAL.silver); g.rect(-w / 2, -h / 2, w, h, 4);
  g.fill('#cfe9ff'); g.rect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 2);
  g.noStroke(); g.fill('#a8e6a1'); g.rect(-w / 2 + 7, 10, w - 14, h / 2 - 17);
  const ppl = [[-17, 26, '#7f9de8'], [-6, 24, PAL.pink], [6, 18, PAL.lilac], [16, 16, PAL.aqua]];
  ppl.forEach(([x, hh, c]) => {
    g.fill(c); g.rect(x - 5, 18 - hh + 10, 10, hh - 4, 4);
    g.fill(PAL.peach); g.ellipse(x, 18 - hh + 6, 9, 9);
  });
  // the glare that hides their faces
  g.fill(255, 255, 255, 215);
  g.quad(-w / 2 + 7, -6, -w / 2 + 7, -16, w / 2 - 7, -22, w / 2 - 7, -6);
  g.fill(255, 255, 255, 130); g.quad(-w / 2 + 7, 0, -w / 2 + 7, -6, w / 2 - 7, -6, w / 2 - 7, 2);
  star4(g, 14, -12, 9, 255, 0.2);
  ink(g, 2); g.noFill(); g.rect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 2);
  gloss(g, -w / 2 + 8, -h / 2 + 4, 14, 4, 200);
}

function sFlipPhone(g) {
  ink(g, 2); g.fill(PAL.hot); g.rect(4, -26, 5, 8, 2);
  g.fill(PAL.pink); g.rect(-11, -21, 22, 20, 5);
  g.fill(PAL.aqua); g.rect(-7, -17, 14, 11, 2);
  g.fill(PAL.pink); g.rect(-12, 1, 24, 21, 5);
  g.noStroke(); g.fill(255, 255, 255, 220);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g.ellipse(-6 + c * 6, 7 + r * 5, 3.5, 3);
  g.fill(255, 255, 255, 120); g.rect(-6, -15, 4, 7);
  ink(g, 1.2); g.line(10, 18, 13, 22);
  g.noStroke(); star4(g, 13, 22, 4, PAL.gold);
}

function sDiscman(g) {
  ink(g, 1.6); g.noFill(); g.bezier(20, 4, 34, 2, 30, 14, 24, 12);
  ink(g, 2); g.fill(PAL.silver); g.ellipse(-2, 0, 50, 28);
  g.fill('#dfe3f7'); g.ellipse(-2, -2, 32, 16);
  g.fill(PAL.lilac); g.ellipse(-2, -2, 8, 5);
  g.noStroke(); g.fill(255, 255, 255, 160); g.arc(-2, -2, 30, 14, Math.PI, Math.PI * 1.6);
  g.fill(PAL.hot); g.ellipse(18, 4, 4, 4); g.fill(PAL.aqua); g.ellipse(14, 8, 4, 4);
  ink(g, 1.5); g.fill(PAL.grape); g.ellipse(25, 12, 7, 7);
}

function sController(g) {
  ink(g); g.fill('#b7bde0');
  g.ellipse(-18, 6, 20, 26); g.ellipse(18, 6, 20, 26);
  g.rect(-24, -14, 48, 22, 10);
  g.noStroke(); g.fill('#b7bde0'); g.rect(-20, -6, 40, 14);
  g.fill(INK); g.rect(-21, -6, 12, 4, 1); g.rect(-17, -10, 4, 12, 1);
  [[14, -8, PAL.hot], [20, -4, PAL.aqua], [14, 0, PAL.gold], [8, -4, '#5fc46a']].forEach(([x, y, c]) => { g.fill(c); g.ellipse(x, y, 5, 5); });
  g.fill(255, 255, 255, 120); g.rect(-16, -12, 30, 3, 2);
}

/* ---------------- 4. TEEN ---------------- */

function paperStack(g, w, h, title, mark, col) {
  g.push(); g.rotate(-0.08); ink(g, 1.5); g.fill('#f1f0fb'); g.rect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 2); g.pop();
  ink(g, 2); g.fill(255); g.rect(-w / 2 + 3, -h / 2 + 1, w - 6, h - 4, 2);
  g.noStroke(); g.fill(INK); g.textFont('VT323'); g.textSize(13); g.textAlign('left', 'top');
  g.text(title, -w / 2 + 8, -h / 2 + 3);
  g.stroke(190, 190, 220); g.strokeWeight(1);
  for (let y = -h / 2 + 18; y < h / 2 - 6; y += 6) g.line(-w / 2 + 8, y, w / 2 - 16, y);
  if (mark) { g.noFill(); g.stroke(PAL.red); g.strokeWeight(2); g.ellipse(w / 2 - 14, -h / 2 + 12, 18, 14); g.noStroke(); g.fill(PAL.red); g.textSize(12); g.textAlign('center', 'center'); g.text(mark, w / 2 - 14, -h / 2 + 11); }
  if (col) { g.noStroke(); g.fill(col); g.rect(w / 2 - 26, h / 2 - 22, 20, 16, 1); g.fill(INK); g.textSize(9); g.textAlign('center', 'center'); g.text('due!!', w / 2 - 16, h / 2 - 14); }
}

function sHomework1(g, w, h) {
  paperStack(g, w, h, 'MATHS', 'C+');
  g.push(); g.translate(-6, 14); g.rotate(-0.5);
  ink(g, 1.5); g.fill(PAL.gold); g.rect(-20, -3, 32, 6, 1); g.fill(PAL.tan); g.triangle(12, -3, 18, 0, 12, 3); g.fill(PAL.hot); g.rect(-24, -3, 4, 6, 1);
  g.pop();
}

function sHomework2(g, w, h) { paperStack(g, w, h, 'MOCK EXAM', null, '#fff27a'); }

function sHoodie(g) {
  ink(g); g.fill('#b9a2ff');
  g.quad(-22, -12, -38, 14, -30, 20, -18, 2);
  g.quad(22, -12, 38, 14, 30, 20, 18, 2);
  g.rect(-24, -16, 48, 42, 9);
  g.fill('#a58cf5'); g.ellipse(0, -18, 30, 16);
  g.fill('#c9b8ff'); g.rect(-14, 6, 28, 13, 5);
  ink(g, 1.5); g.line(-4, -10, -5, 2); g.line(4, -10, 5, 2);
  g.noStroke(); star4(g, 0, -2, 4, 255);
}

function sJeans(g) {
  ink(g); g.fill(PAL.denim);
  g.quad(-20, -20, 20, -20, 30, 26, -30, 26);
  g.fill('#a8bdf5'); g.triangle(-2, -10, 2, -10, 0, 26);
  g.noStroke(); g.fill('#9fb6f5'); g.rect(-2, -10, 4, 36);
  ink(g, 2); g.fill('#6c8ade'); g.rect(-21, -24, 42, 8, 2);
  g.noFill(); g.arc(-12, -14, 14, 10, 0, Math.PI); g.arc(12, -14, 14, 10, 0, Math.PI);
  g.noStroke(); g.fill(PAL.gold); g.ellipse(0, -20, 4, 4);
}

function sTee(g) {
  ink(g); g.fill(PAL.pink);
  g.beginShape();
  g.vertex(-14, -22); g.vertex(-32, -12); g.vertex(-24, 0); g.vertex(-18, -4); g.vertex(-18, 24);
  g.vertex(18, 24); g.vertex(18, -4); g.vertex(24, 0); g.vertex(32, -12); g.vertex(14, -22);
  g.bezierVertex(8, -14, -8, -14, -14, -22);
  g.endShape('close');
  g.noStroke(); star5(g, 0, 4, 9, 255);
}

function heelShape(g, x, y, c) {
  g.push(); g.translate(x, y);
  ink(g, 2); g.fill(c);
  g.beginShape();
  g.vertex(-26, 4); g.bezierVertex(-26, -6, -10, -6, 0, 0);
  g.vertex(16, -16); g.vertex(22, -16); g.vertex(22, -10); g.vertex(19, -10); g.vertex(16, 10); g.vertex(13, 10);
  g.vertex(10, 2); g.bezierVertex(0, 4, -12, 10, -26, 10);
  g.endShape('close');
  g.noStroke(); g.fill(255, 255, 255, 130); g.ellipse(-14, 1, 10, 3);
  g.pop();
}

function sHeels(g) { heelShape(g, -6, -4, '#c94a7a'); heelShape(g, 6, 6, '#ff5f8f'); }

function sPosterBand(g, w, h) {
  ink(g); g.fill('#3b2a7a'); g.rect(-w / 2, -h / 2, w, h, 2);
  g.noStroke(); star5(g, 0, -18, 34, PAL.hot, 0.5); star5(g, 0, -18, 20, PAL.lemon, 0.5);
  g.fill(255); g.textFont('Rubik Bubbles'); g.textAlign('center', 'center'); g.textSize(17);
  g.text('STARGIRLZ', 0, 30);
  g.fill(PAL.aqua); g.textFont('VT323'); g.textSize(15); g.text('LIVE  *  2014  TOUR', 0, 50);
  star4(g, -36, -54, 5, 255); star4(g, 38, 8, 4, 255);
  tape(g, -w / 2 + 5, -h / 2 + 3, 20, 8, -0.7); tape(g, w / 2 - 5, -h / 2 + 3, 20, 8, 0.7);
}

function sPosterMovie(g, w, h) {
  ink(g); g.fill(255); g.rect(-w / 2, -h / 2, w, h, 2);
  const bands = ['#ffb3d9', '#ffc8b0', '#ffe0a3', '#ffd1e8'];
  g.noStroke();
  bands.forEach((c, i) => { g.fill(c); g.rect(-w / 2 + 4, -h / 2 + 4 + i * 22, w - 8, 22); });
  g.fill('#ff8a5c'); g.ellipse(0, -10, 44, 44);
  g.fill('#8f6bff'); g.rect(-w / 2 + 4, 4, w - 8, h / 2 - 8);
  g.fill('#6a4fd6'); g.triangle(-w / 2 + 4, 4, -10, -16, 20, 4); g.triangle(0, 4, 30, -10, w / 2 - 4, 4);
  g.fill(255); g.textFont('Rubik Bubbles'); g.textAlign('center', 'center'); g.textSize(18);
  g.text("SUMMER '14", 0, 36);
  g.textFont('VT323'); g.textSize(13); g.fill(PAL.lemon); g.text('in cinemas soon', 0, 54);
  tape(g, -w / 2 + 5, -h / 2 + 3, 20, 8, -0.7); tape(g, w / 2 - 5, -h / 2 + 3, 20, 8, 0.7);
}

function sTrophy(g) {
  ink(g); g.fill(PAL.woodDark); g.rect(-18, 22, 36, 12, 2);
  g.fill(PAL.gold); g.rect(-5, 6, 10, 16);
  g.noFill(); ink(g, 3); g.arc(-17, -14, 16, 20, Math.PI * 0.5, Math.PI * 1.5); g.arc(17, -14, 16, 20, -Math.PI * 0.5, Math.PI * 0.5);
  ink(g); g.fill(PAL.gold); g.arc(0, -26, 34, 60, 0, Math.PI, 'chord');
  g.fill(255); g.ellipse(0, -14, 13, 13);
  ink(g, 1.2); g.noFill(); g.arc(0, -14, 13, 6, 0, Math.PI); g.line(0, -20.5, 0, -7.5);
  gloss(g, -9, -18, 5, 14, 170);
  g.noStroke(); g.fill(PAL.gold); g.rect(-8, 25, 16, 6, 1);
}

function sMedal(g) {
  ink(g, 2); g.fill(PAL.red); g.quad(-14, -30, -4, -30, 4, 2, -6, 2);
  g.fill(255); g.quad(4, -30, 14, -30, 6, 2, -4, 2);
  ink(g); g.fill(PAL.gold); g.ellipse(0, 14, 30, 30);
  g.fill('#ffe28a'); g.ellipse(0, 14, 20, 20);
  g.noStroke(); star5(g, 0, 14, 8, PAL.hot);
  gloss(g, -7, 7, 6, 9, 170);
}

function sAward(g) {
  ink(g); g.fill(PAL.navy); g.rect(-22, 18, 44, 14, 3);
  g.noStroke(); g.fill(PAL.gold); g.rect(-14, 22, 28, 6, 1);
  ink(g, 2); star5(g, 0, -10, 26, 'rgba(199,168,255,0.85)', 0.5);
  g.noStroke(); g.fill(255, 255, 255, 170); g.ellipse(-6, -16, 6, 12);
  ink(g, 2); g.fill(PAL.lilac); g.rect(-4, 10, 8, 8);
}

function sGuitar(g) {
  ink(g); g.fill('#8a5a33'); g.rect(-8, -75, 16, 15, 3);
  g.fill('#a8703f'); g.rect(-5, -62, 10, 64);
  ink(g); g.fill(PAL.peach);
  g.ellipse(0, 42, 56, 62); g.ellipse(0, 2, 44, 46);
  g.noStroke(); g.fill(PAL.peach); g.rect(-20, 10, 40, 22);
  g.fill('#ffd9c4'); g.ellipse(-6, 34, 22, 26);
  ink(g, 2); g.fill(INK); g.ellipse(0, 16, 16, 16);
  g.fill(PAL.woodDark); g.rect(-10, 48, 20, 6, 2);
  g.stroke(255, 255, 255, 200); g.strokeWeight(1);
  for (let s = -3; s <= 3; s += 2) g.line(s, -60, s, 50);
  g.stroke(INK); g.strokeWeight(1.5); for (let y = -52; y < 0; y += 10) g.line(-5, y, 5, y);
  g.noStroke(); g.fill(255); [[-12, -72], [-12, -64], [12, -72], [12, -64]].forEach(([x, y]) => g.ellipse(x, y, 4, 4));
  g.noStroke(); heart(g, 14, 50, 4, PAL.hot);
}

/* ---------------- 5. YOUNG ADULT ---------------- */

function sLaptop(g) {
  ink(g); g.fill(PAL.silver); g.rect(-38, -28, 76, 46, 6);
  g.noStroke();
  const ctx = g.drawingContext, gr = ctx.createLinearGradient(0, -24, 0, 12);
  gr.addColorStop(0, '#c7a8ff'); gr.addColorStop(1, '#86f0e6');
  ctx.fillStyle = gr; ctx.fillRect(-33, -23, 66, 36);
  g.fill(255, 255, 255, 220); g.rect(-28, -18, 26, 16, 2); g.rect(4, -10, 22, 16, 2);
  g.fill(PAL.hot); g.rect(-28, -18, 26, 4, 2); g.fill(PAL.grape); g.rect(4, -10, 22, 4, 2);
  ink(g); g.fill('#dfe3f7'); g.quad(-38, 18, 38, 18, 45, 28, -45, 28);
  g.noStroke(); g.fill(INK); g.rect(-10, 22, 20, 2, 1);
  star4(g, 30, -22, 5, 255);
}

function sPlant(g) {
  const leaves = [[-0.9, 30], [-0.45, 36], [0, 40], [0.45, 36], [0.9, 30], [-0.2, 26], [0.25, 28]];
  leaves.forEach(([a, len], i) => {
    g.push(); g.translate(0, 10); g.rotate(a);
    ink(g, 2); g.fill(i % 2 ? '#7ed9a0' : '#9ae8b4'); g.ellipse(0, -len / 2 - 4, 16, len);
    g.stroke(INK); g.strokeWeight(1); g.line(0, -4, 0, -len + 2);
    g.pop();
  });
  ink(g); g.fill(PAL.pink); g.quad(-18, 10, 18, 10, 14, 35, -14, 35);
  g.fill(PAL.hot); g.rect(-20, 8, 40, 7, 2);
  g.noStroke(); heart(g, 0, 24, 5, 255);
}

function sFairyLights(g, w, h, t) {
  const pts = [];
  for (let i = 0; i <= 26; i++) {
    const u = i / 26, x = -w / 2 + u * w;
    const local = (u * 2) % 1;
    pts.push([x, -16 + Math.sin(local * Math.PI) * 18]);
  }
  ink(g, 1.6); g.noFill(); g.beginShape(); pts.forEach(p => g.vertex(p[0], p[1])); g.endShape();
  const cols = [PAL.hot, PAL.gold, PAL.aqua, PAL.lilac];
  pts.forEach((p, i) => {
    if (i % 2) return;
    const tw = 0.55 + 0.45 * Math.sin(t / 380 + i * 1.7);
    const c = g.color(cols[(i / 2) % 4]);
    c.setAlpha(80 * tw); g.noStroke(); g.fill(c); g.ellipse(p[0], p[1] + 6, 18, 18);
    ink(g, 1.4); c.setAlpha(255); g.fill(c); g.ellipse(p[0], p[1] + 6, 8, 10);
  });
}

function sMug(g) {
  ink(g, 2); g.noFill(); g.arc(13, 2, 14, 16, -Math.PI / 2, Math.PI / 2);
  ink(g); g.fill(PAL.cream); g.rect(-14, -10, 26, 30, 5);
  g.noStroke(); heart(g, -1, 6, 6, PAL.hot);
  g.stroke(200, 200, 230); g.strokeWeight(2); g.noFill();
  g.bezier(-6, -14, -10, -18, -2, -20, -6, -24); g.bezier(4, -14, 0, -18, 8, -20, 4, -24);
}

function sNovel(g) {
  ink(g, 2); g.fill('#f4ecd8'); g.rect(-14, -27, 32, 54, 3);
  g.fill(PAL.teal); g.rect(-18, -28, 32, 56, 3);
  g.noStroke(); g.fill(255, 255, 255, 200); g.rect(-12, -18, 20, 3); g.rect(-12, -12, 14, 3);
  star4(g, -2, 8, 8, PAL.lemon);
  ink(g, 1.5); g.fill(PAL.hot); g.quad(6, 28, 10, 28, 10, 34, 8, 31);
}

function sPolaroids(g, w, h) {
  ink(g, 1.6); g.noFill(); g.bezier(-w / 2, -30, -20, -18, 20, -18, w / 2, -30);
  const ps = [[-46, -0.12, ['#ffd1e8', PAL.hot]], [0, 0.05, ['#cfe9ff', PAL.grape]], [46, -0.06, ['#d7f8e3', '#5fc46a']]];
  ps.forEach(([x, a, c]) => {
    g.push(); g.translate(x, 6); g.rotate(a);
    ink(g, 2); g.fill(255); g.rect(-18, -22, 36, 44, 2);
    g.noStroke(); g.fill(c[0]); g.rect(-14, -18, 28, 28);
    g.fill(c[1]); g.ellipse(-4, -6, 9, 9); g.ellipse(6, -4, 7, 7);
    g.fill(255, 255, 255, 140); g.rect(-14, 2, 28, 8);
    ink(g, 1.5); g.fill(PAL.wood); g.rect(-3, -27, 6, 10, 1);
    g.pop();
  });
}

/* ---------------- 6. MOVING OUT ---------------- */

function sUniLetter(g) {
  ink(g, 2); g.fill(255); g.rect(-22, -22, 44, 30, 2);
  g.stroke(190, 190, 220); g.strokeWeight(1);
  for (let y = -10; y < 6; y += 5) g.line(-14, y, 14, y);
  ink(g, 1.5); g.fill(PAL.navy); g.ellipse(0, -16, 9, 9); g.noStroke(); star4(g, 0, -16, 3.5, PAL.gold);
  ink(g, 2); g.fill(PAL.cream); g.rect(-28, -4, 56, 26, 3);
  g.noFill(); g.line(-28, -4, 0, 12); g.line(28, -4, 0, 12);
  g.fill(PAL.red); g.ellipse(0, 12, 12, 12);
  g.noStroke(); heart(g, 0, 12, 3, 255);
}

function sClothesStack(g) {
  ink(g, 2);
  g.fill(PAL.denim); g.rect(-36, 6, 72, 14, 4);
  g.fill(PAL.pink); g.rect(-32, -7, 64, 14, 4);
  g.fill(PAL.lilac); g.rect(-28, -19, 56, 13, 4);
  g.noStroke(); g.fill(255, 255, 255, 120);
  g.rect(-30, 9, 60, 3, 2); g.rect(-26, -4, 52, 3, 2); g.rect(-22, -16, 44, 3, 2);
  star4(g, 18, -12, 4, 255);
}

/* sprite registry: id -> draw fn. `anim: true` means redraw every frame (not cached). */
const SPRITES = {
  teddy: { draw: sTeddy }, blanket: { draw: sBlanket }, mobile: { draw: sMobile, anim: true },
  snowglobe: { draw: sSnowglobe, anim: true }, rabbitbooks: { draw: sRabbitBooks },
  nightlight: { draw: sNightlight, anim: true }, rattle: { draw: sRattle }, bottle: { draw: sBottle },
  picturebooks: { draw: sPictureBooks }, teaset: { draw: sTeaset }, doll: { draw: sDoll },
  tutu: { draw: sTutu }, wings: { draw: sWings, anim: true }, drawing: { draw: sDrawing },
  crayons: { draw: sCrayons }, truck: { draw: sTruck },
  backpack: { draw: sBackpack }, skates: { draw: sSkates }, artsupplies: { draw: sArtSupplies },
  sketch: { draw: sSketch }, familyphoto: { draw: sFamilyPhoto }, flipphone: { draw: sFlipPhone },
  discman: { draw: sDiscman }, controller: { draw: sController },
  homework1: { draw: sHomework1 }, homework2: { draw: sHomework2 }, hoodie: { draw: sHoodie },
  jeans: { draw: sJeans }, tee: { draw: sTee }, heels: { draw: sHeels },
  posterband: { draw: sPosterBand }, postermovie: { draw: sPosterMovie },
  trophy: { draw: sTrophy }, medal: { draw: sMedal }, award: { draw: sAward }, guitar: { draw: sGuitar },
  laptop: { draw: sLaptop }, plant: { draw: sPlant }, fairylights: { draw: sFairyLights, anim: true },
  mug: { draw: sMug }, novel: { draw: sNovel }, polaroids: { draw: sPolaroids },
  uniletter: { draw: sUniLetter }, clothesstack: { draw: sClothesStack }
};
