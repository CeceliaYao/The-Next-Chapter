/* =========================================================
   memory-art.js: pixel stand-ins for memories whose photo
   hasn't been taken yet (the printed props: family photo,
   posters, the childhood drawing). As soon as the real file
   is added to assets/photos, the game shows that instead.
   Each function draws into a PixBuf of the given size.
   ========================================================= */
'use strict';

const MEMORY_ART = (() => {
  // small seeded random so the art looks the same every time
  const rnd = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  /* Studio family portrait. The shot list asks for light glare over the faces. */
  function familyphoto(W, H) {
    const b = new PixBuf(W, H, 0), r = rnd(7);
    skyGrad(b, 0, 0, W, H, ['#a9bcd8', '#8aa1c6', '#6f84ad']);
    b.ell(W / 2, H * 0.45, W * 0.34, H * 0.42, '#b9cbe3'); b.dither(0, 0, W, H, '#93a9cc', 3);
    b.rect(0, H - 16, W, 16, '#5d6f94'); b.dither(0, H - 18, W, 4, '#5d6f94', 8);
    const person = (cx, h, hair, top, bottom, skirt, long) => {
      const foot = H - 10, head = foot - h, hr = Math.max(4, Math.round(h * 0.09));
      b.rect(cx - 3, foot - Math.round(h * 0.38), 2, Math.round(h * 0.38), bottom); b.rect(cx + 1, foot - Math.round(h * 0.38), 2, Math.round(h * 0.38), bottom);
      if (skirt) b.poly([[cx - 2, head + hr * 2 + 4], [cx + 3, head + hr * 2 + 4], [cx + 8, foot - Math.round(h * 0.3)], [cx - 7, foot - Math.round(h * 0.3)]], top);
      else b.rect(cx - 6, head + hr * 2 + 2, 13, Math.round(h * 0.42), top);
      b.rect(cx - 8, head + hr * 2 + 3, 2, Math.round(h * 0.3), top); b.rect(cx + 7, head + hr * 2 + 3, 2, Math.round(h * 0.3), top);
      b.rect(cx - 8, head + hr * 2 + 3 + Math.round(h * 0.3), 2, 2, '#f2c9a8'); b.rect(cx + 7, head + hr * 2 + 3 + Math.round(h * 0.3), 2, 2, '#f2c9a8');
      b.ell(cx + 0.5, head + hr + 1, hr, hr + 1, '#f2c9a8');
      b.ell(cx + 0.5, head + hr - 1, hr + 1, hr - 1, hair);
      if (long) { b.rect(cx - hr - 1, head + hr, 3, hr + 4, hair); b.rect(cx + hr - 1, head + hr, 3, hr + 4, hair); }
      b.rect(cx - 3, foot, 3, 2, 'z'); b.rect(cx + 1, foot, 3, 2, 'z');
      return head;
    };
    const s = W / 192;
    person(Math.round(54 * s), 78, '#4a2f1f', '#3f5f9e', '#2c2c3a');
    person(Math.round(86 * s), 70, '#7a4a2a', '#e98aa6', '#e98aa6', true, true);
    const kid = person(Math.round(116 * s), 52, '#a8622f', '#ffc700', '#5aa0d8', false, true);
    person(Math.round(142 * s), 40, '#5a3a24', '#6fbf6a', '#3a4f7a');
    const ted = SPR.teddy.variants[2][0].normal;        // she's holding Teddy (tween Teddy)
    const tb = new PixBuf(ted.width, ted.height, 0);
    const d = ted.getContext('2d').getImageData(0, 0, ted.width, ted.height).data;
    for (let y = 0; y < ted.height; y++) for (let x = 0; x < ted.width; x++) {
      const i = (y * ted.width + x) * 4; if (d[i + 3] > 128) tb.px(x, y, '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''));
    }
    for (let y = 0; y < tb.H; y++) for (let x = 0; x < tb.W; x++) { const c = tb.get(x, y); if (c) b.px(Math.round(116 * s) - 9 + x, kid + 22 + y, c); }
    // the glare: a soft diagonal streak of light across every face, and a lens flare
    const headY = [[54, 29], [86, 37], [116, 55], [142, 67]].map(([x, y]) => [x * s, y * H / 113]);   // where the faces are
    for (let x = 0; x < W; x++) {
      const yc = headY[0][1] + (x - headY[0][0]) * (headY[3][1] - headY[0][1]) / (headY[3][0] - headY[0][0]), half = 6;
      for (let y = Math.floor(yc - half - 6); y <= yc + half + 6; y++) {
        const dist = Math.abs(y - yc);
        if (dist <= half) b.px(x, y, dist > half - 3 && (x + y) % 2 ? '#fff6e0' : '#ffffff');
        else if ((x + y) % 2 === 0 && r() < 1 - (dist - half) / 6) b.px(x, y, '#fff6e0');
      }
    }
    b.ring(W * 0.8, H * 0.14, 5, 6, '#ffffff'); b.px(Math.round(W * 0.8), Math.round(H * 0.14), '#ffffff');
    b.ell(W * 0.66, H * 0.3, 2, 2, '#fffbe8');
    return b;
  }

  /* The teen wall: both posters, washi tape, stickers. */
  function posters(W, H) {
    const b = new PixBuf(W, H, 0), r = rnd(11);
    b.rect(0, 0, W, H, '#c0dcd5');
    for (let x = 4; x < W; x += 12) b.rect(x, 0, 4, H, '#b2d2ca');
    for (let i = 0; i < 18; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * H); b.px(x, y, '#e8f6f2'); }
    const stampScaled = (id, ox, oy, k) => {
      const def = PIXEL_SPRITES[id], pb = new PixBuf(def.w, def.h, 0);
      def.draw(pb, 0, 0);
      b.rect(ox + 2 * k - 2, oy + 2 * k - 2, def.w * k + 4, def.h * k + 4, '#8fb3ab');      // soft shadow
      for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) { const c = pb.get(x, y); if (c) b.rect(ox + x * k, oy + y * k, k, k, c); }
      b.rect(ox - 3, oy - 2, 10, 4, '4'); b.rect(ox + def.w * k - 7, oy - 2, 10, 4, '3');      // tape
    };
    const k = Math.max(2, Math.floor((H - 26) / 32));
    stampScaled('posterband', Math.round(W * 0.14), 12, k);
    stampScaled('postermovie', Math.round(W * 0.56), 16, k);
    const star = (cx, cy, R, c) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * 0.45 : R; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } b.poly(p, c); };
    star(W * 0.08, H * 0.2, 4, '4'); star(W * 0.92, H * 0.75, 4, '3'); star(W * 0.5, H * 0.86, 3, '1');
    b.rect(Math.round(W * 0.86), 10, 18, 22, 'w'); b.rect(Math.round(W * 0.86) + 2, 12, 14, 13, '#f2a8b9'); b.ell(W * 0.86 + 9, 20, 4, 3, '#ffd0de');
    return b;
  }

  /* A kid's crayon drawing: "This is my family. Teddy is the biggest." */
  function crayon(W, H) {
    const b = new PixBuf(W, H, 0), r = rnd(3);
    b.rect(0, 0, W, H, '#fffaf0');
    for (let i = 0; i < 40; i++) b.px(Math.floor(r() * W), Math.floor(r() * H), '#f3ead8');
    const stroke = (x1, y1, x2, y2, c, t) => {                 // waxy, slightly gappy crayon line
      const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
      for (let i = 0; i <= n; i++) {
        const x = x1 + (x2 - x1) * i / n, y = y1 + (y2 - y1) * i / n;
        for (let j = 0; j < (t || 1); j++) if (r() > 0.12) b.px(x + (j % 2), y + Math.floor(j / 2), c);
      }
    };
    const circle = (cx, cy, rad, c, fill) => {
      for (let a = 0; a < 64; a++) { const p = a / 64 * Math.PI * 2; stroke(cx + Math.cos(p) * rad, cy + Math.sin(p) * rad, cx + Math.cos(p + 0.1) * rad, cy + Math.sin(p + 0.1) * rad, c, 2); }
      if (fill) for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (x * x + y * y < (rad - 1) * (rad - 1) && r() > 0.45) b.px(cx + x, cy + y, fill);
    };
    // sun and grass
    circle(16, 14, 7, '#ffb300', '#ffd95a');
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; stroke(16 + Math.cos(a) * 10, 14 + Math.sin(a) * 10, 16 + Math.cos(a) * 15, 14 + Math.sin(a) * 15, '#ffb300', 1); }
    for (let x = 0; x < W; x += 3) stroke(x, H - 4, x + 1, H - 10 - Math.floor(r() * 4), '#5cc25a', 1);
    stroke(0, H - 4, W, H - 4, '#3fa84a', 2);
    miniText(b, Math.round(W / 2) - 18, 4, 'MY FAMILY', '#e8455a');
    // stick people: mum, dad, me, little brother
    const stick = (cx, h, c, dress) => {
      const foot = H - 8, head = foot - h;
      circle(cx, head + 4, 4, c);
      stroke(cx, head + 8, cx, foot - h * 0.35, c, 2);
      if (dress) b.poly([[cx, head + 10], [cx - 6, foot - h * 0.3], [cx + 6, foot - h * 0.3]], c);
      stroke(cx - 7, head + 12, cx + 7, head + 12, c, 1);
      stroke(cx, foot - h * 0.35, cx - 4, foot, c, 1); stroke(cx, foot - h * 0.35, cx + 4, foot, c, 1);
    };
    stick(Math.round(W * 0.12), 46, '#9a72f0', true);
    stick(Math.round(W * 0.26), 52, '#3a7be0');
    stick(Math.round(W * 0.39), 34, '#ff5fb4', true);
    stick(Math.round(W * 0.5), 26, '#2fa84a');
    // TEDDY, the biggest of all
    const tx = Math.round(W * 0.76), ty = H - 46;
    circle(tx - 13, ty - 26, 6, '#9a5a2a', '#c47a3c'); circle(tx + 13, ty - 26, 6, '#9a5a2a', '#c47a3c');
    circle(tx, ty - 14, 14, '#9a5a2a', '#c47a3c');
    circle(tx, ty + 18, 20, '#9a5a2a', '#c47a3c');
    b.rect(tx - 6, ty - 18, 3, 3, '#241733'); b.rect(tx + 4, ty - 18, 3, 3, '#241733'); b.rect(tx - 1, ty - 11, 3, 2, '#241733');
    stroke(tx - 5, ty - 6, tx + 5, ty - 6, '#e8455a', 1);
    b.poly([[tx - 8, ty + 1], [tx, ty + 5], [tx - 8, ty + 9]], '#2fc6aa'); b.poly([[tx + 8, ty + 1], [tx, ty + 5], [tx + 8, ty + 9]], '#2fc6aa');
    miniText(b, tx - 9, H - 11, 'TEDDY', '#9a5a2a');
    return b;
  }

  return { familyphoto, posters, crayon };
})();
