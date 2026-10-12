/* =========================================================
   memory-art.js: a pixel stand-in for a memory whose photo
   hasn't been taken yet (the teen posters). As soon as the
   real file is added to assets/photos, the game shows that.
   Each function draws into a PixBuf of the given size.
   ========================================================= */
'use strict';

const MEMORY_ART = (() => {
  // small seeded random so the art looks the same every time
  const rnd = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

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

  return { posters };
})();
