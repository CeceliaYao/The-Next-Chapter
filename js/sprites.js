/* =========================================================
   sprites.js: every object in the room as pixel art.
   Each sprite is either a hand-placed pixel grid (`rows`)
   or drawn with pixel shapes (`draw`). Letters are colours
   from PALETTE in pixel.js; '.' is transparent. The dark
   outline is added automatically around each silhouette.
   Sizes are in art pixels (1 art pixel = 4 screen pixels).
   ========================================================= */
'use strict';

const PIXEL_SPRITES = {
  /* ---------------- 1 · NURSERY ---------------- */
  /* Teddy is drawn the same way every chapter, then worn down a little more each time:
     stage 0 = brand new (2000) … stage 5 = well loved (2018). See TEDDY_AGES in data.js. */
  teddy: {
    w: 16, h: 18, variants: 6,
    draw(b, f, v) {
      const rows = [
        '..DD........DD..',
        '.DCCD......DCCD.',
        '.DCFFFFFFFFFFCD.',
        '..FHHFFFFFFFFFD.',
        '..FHFFFFFFFFFFD.',
        '..FFNFFFFFFNFFD.',
        '..FFFFCCCCFFFFD.',
        '..FFFCCNNCCFFFD.',
        '..DFFCCCCCCFFD..',
        '...DFFCCCCFFD...',
        '..FFFDFFFFDFFF..',
        '.FFFFFFFFFFFFFF.',
        'FFFFFFFFFFFFFFFD',
        'FFFFFFFFFFFFFFDD',
        'FHFFFFFFFFFFFFDD',
        '.FFFFFFFFFFFFFD.',
        '.CCCFFFFFFFFCCC.',
        '.CCC.FFFFFF.CCC.'
      ];
      // fur fades from chestnut to dusty tan; the organza bow fades, droops, then is lost
      const T = [
        { F: '#b45f2e', D: '#87401c', H: '#da8b52', C: '#fbe9cf', N: '#2b160c', B: '#2fc6aa', b: '#a6f7e2', K: '#178676' },
        { F: '#ab6236', D: '#824426', H: '#cc8655', C: '#f3e1c7', N: '#2e1a10', B: '#47b8a2', b: '#9de4d2', K: '#2a7f72' },
        { F: '#a0663f', D: '#7b4b30', H: '#bd8560', C: '#eadac3', N: '#342015', B: '#6aac9d', b: '#acd6ca', K: '#467b72' },
        { F: '#966a4b', D: '#755039', H: '#b0866a', C: '#e0d2be', N: '#3a271b', B: '#88a59d', b: '#bccdc6', K: '#5d7a73' },
        { F: '#8d6e56', D: '#6e5544', H: '#a58a74', C: '#d7cbba', N: '#3f2d21' },
        { F: '#86705e', D: '#69574a', H: '#9b8a7a', C: '#cec4b5', N: '#433226' }
      ][v];
      const grid = rows.map(r => r.split(''));
      const set = (x, y, c) => { if (grid[y] && grid[y][x] !== undefined) grid[y][x] = c; };
      if (v <= 3) {                          // organza bow tie: two loops and a knot (limp by stage 3, lost after)
        const loop = v < 3
          ? [[3, 10, 'b'], [4, 10, 'B'], [5, 10, 'B'], [2, 11, 'b'], [3, 11, 'B'], [4, 11, 'K'], [5, 11, 'B'], [6, 11, 'B'], [3, 12, 'B'], [4, 12, 'B'], [5, 12, 'K']]
          : [[3, 11, 'B'], [4, 11, 'B'], [5, 11, 'B'], [6, 11, 'B'], [3, 12, 'b'], [4, 12, 'K'], [5, 12, 'B'], [4, 13, 'B']];
        loop.forEach(([x, y, c]) => { set(x, y, c); set(15 - x, y, c === 'b' ? 'B' : c); });
        [[7, 10, 'B'], [8, 10, 'B'], [7, 11, 'K'], [8, 11, 'K'], [7, 12, 'B'], [8, 12, 'B']].forEach(([x, y, c]) => set(x, y, c));
        if (v < 3) [[6, 13, 'B'], [9, 13, 'B'], [6, 14, 'K'], [9, 14, 'K']].forEach(([x, y, c]) => set(x, y, c));
      }
      if (v >= 5) {                          // the right ear has gone a bit floppy
        set(11, 0, '.'); set(12, 0, '.'); set(11, 1, 'D'); set(12, 1, 'D'); set(13, 1, 'D'); set(14, 1, '.');
        set(12, 2, 'C'); set(13, 2, 'D');
      }
      for (let y = 0; y < 18; y++) for (let x = 0; x < 16; x++) {
        const k = grid[y][x];
        if (k !== '.') b.px(x, y, T[k] || T.F);
      }
      const thread = '#e48aa8';
      if (v >= 1) {                          // fur hugged flat on the tummy
        [[5, 15], [7, 15], [6, 14], [8, 14], [10, 15]].forEach(([x, y]) => { if (b.get(x, y) === T.F) b.px(x, y, T.H); });
      }
      if (v >= 2) {                          // left ear sewn back on
        b.px(1, 2, thread); b.px(2, 3, thread); b.px(3, 2, thread);
      }
      if (v >= 3) {                          // gingham patch on the tummy
        for (let y = 13; y <= 15; y++) for (let x = 8; x <= 10; x++) b.px(x, y, (x + y) % 2 ? '#7fb2d9' : '#e2eff8');
        b.px(7, 13, thread); b.px(11, 15, thread);
      }
      if (v >= 4) {                          // a button where an eye used to be, and a mended leg seam
        b.px(11, 5, '#3a5a9a'); b.px(12, 5, '#3a5a9a'); b.px(11, 4, '#7d9ad0');
        b.px(5, 16, thread); b.px(6, 17, thread); b.px(7, 16, thread);
      }
      if (v >= 5) {                          // worn-through fur, a patched paw and a loose thread
        [[3, 4], [6, 3], [12, 14], [2, 13], [9, 2], [13, 6]].forEach(([x, y]) => b.px(x, y, T.D));
        b.px(1, 16, '#f2a8b9'); b.px(2, 16, '#ffd0de'); b.px(1, 17, '#ffd0de'); b.px(2, 17, '#f2a8b9');
        b.px(15, 15, thread); b.px(15, 16, thread);
      }
    }
  },
  blanket: {
    rows: [
      'bbbbbbbbbbbbbbbbbbbbbbbbb',
      'nnnnnnnnnnnnnnnnnnnnnnnnn',
      'BwBBwBBwBBwBhBhBwBBwBBwBB',
      'BwBBwBBwBBwBhhhBwBBwBBwBB',
      'BwBBwBBwBBwBBhBBwBBwBBwBB'
    ]
  },
  mobile: {
    w: 26, h: 19, frames: 2,
    draw(b, f) {
      const s = f ? 1 : 0;
      b.grid(11, 0, ['ooo', 'o.o', 'ooo']);
      b.vline(12, 3, 2, 'o');
      b.rect(1, 5, 24, 2, 'R'); b.hline(1, 5, 24, 'r');
      b.rect(0, 5, 1, 2, 'h'); b.rect(25, 5, 1, 2, 'h');
      b.vline(4 + s, 7, 3, 'o'); b.vline(12 + s, 7, 6, 'o'); b.vline(21 + s, 7, 3, 'o');
      b.grid(2 + s, 10, ['..Y..', '.YYY.', 'YYwYY', '.YYY.', '.Y.Y.']);
      b.grid(10 + s, 13, ['.LLL.', 'LLw..', 'LL...', 'LL...', 'LLL..', '.LLL.']);
      b.grid(18 + s, 10, ['..PPP..', '.PPwPP.', 'PPPPPPP', '.PPPPP.']);
    }
  },
  snowglobe: {
    w: 13, h: 16, frames: 4,
    draw(b, f) {
      b.grid(0, 0, [
        '....bbbbb....',
        '..bbwwbbbbb..',
        '.bbwbbYbbbbb.',
        '.bwbbbYbbbbb.',
        'bbbwwwYwwwbbb',
        'bbwwwwYwwwwbb',
        'bbbbwbYbwbbbb',
        'bbbwbbYbbwbbb',
        '.bbbbbYbbbbb.',
        '.bbYYYYYYYbb.',
        '..bbbbbbbbb..',
        '...ppppppp...',
        '..pPpxpPpxp..',
        '.ppppppppppp.',
        '.BBBBBBBBBBB.',
        '.ppppppppppp.'
      ]);
      // the horse bobs up and down on its pole, glitter swirls
      if (f % 2) { [[3, 4], [4, 4], [5, 4], [7, 4], [8, 4], [9, 4]].forEach(([x, y]) => b.px(x, y, 'b')); [[3, 6], [4, 6], [5, 6], [7, 6], [8, 6], [9, 6]].forEach(([x, y]) => b.px(x, y, 'w')); }
      const cols = ['h', 'Y', 'w', 'L'];
      for (let i = 0; i < 4; i++) {
        const x = 1 + ((f * 3 + i * 5) % 11), y = 1 + ((f * 2 + i * 3) % 8);
        if (b.get(x, y) === 'b') b.px(x, y, cols[i]);
      }
    }
  },
  rabbitbooks: {
    rows: [
      'BBB................',
      'BBB.....eee........',
      'BBBocccoeee........',
      'BBBocccoeeeoPPP....',
      'wwwocccowwwoPPPhh..',
      'BBBoyyyoeeeoPPPhhh.',
      'BBBocccoeeeowwwhhh.',
      'wBwocccoeeeoPPPhhhh',
      'wwwocccoeeeoPPP.hhh',
      'BBBocccoeeeoPPP.hhh',
      'BBBocccoeeeoPPP.hyh',
      'BBBoyyyowwwoPPP.hhh',
      'BBBocccoeeeoPPP.hhh',
      'BBBocccoeeeoPPP.hhh'
    ]
  },
  rabbit: {
    rows: [
      '..TT...TT.....',
      '.TWT..TWT.....',
      '.TWT..TWT.....',
      '.TWT..TWT.....',
      '.TWT.TWT......',
      '..TTTTTT......',
      '.TTTTTTTT.....',
      'TTnTTTTnTT....',
      'TTTTCCTTTT....',
      '.TTCpCCTT.....',
      '..TTCCTT......',
      '.JJJCCJJJ.....',
      'JJJJCCJJJJJ...',
      'TJJYCCJJJJJTT.',
      'TJJJCCYJJJ.TT.',
      '.JJJCCJJJJ....',
      '.JJJYCJJJJ....',
      '..TTTTTTTT....',
      '.TTTTTTTTTT...',
      'WWWTTTTTTWWW..',
      'WWW......WWW..'
    ],
    pal: { T: '#cfa475', W: '#fbf3e6', C: '#f3e2c4', J: '#7cc4ea', Y: '#e0aa2a', n: '#2b1d14', p: '#e3a0a0' }
  },
  nightlight: {
    rows: [
      '..yyyyy..',
      '.yyyyyyy.',
      'ywwyyyyyy',
      'yyooyooyy',
      'yPyyyyyPy',
      '.yyyyyyy.',
      '..yyyyy..',
      '..ggggg..',
      '..gGGGg..',
      '..ggggg..'
    ]
  },
  rattle: {
    rows: [
      '........aaa..',
      '.......aawaa.',
      '.......wwwww.',
      'yyPPPPPaaaaa.',
      'yyPPPPPaaaaa.',
      '.......aaaaa.',
      '........aaa..'
    ]
  },
  bottle: {
    rows: [
      '..tt..',
      '..tt..',
      '.tttt.',
      'PPPPPP',
      'PPPPPP',
      'wwwwww',
      'wwwwPw',
      'wwwwww',
      'ccccPc',
      'cccccc',
      'ccccPc',
      'cccccc',
      'cccccc',
      '.cccc.'
    ]
  },

  /* ---------------- 2 · CHILDHOOD ---------------- */
  picturebooks: {
    rows: [
      '..............LLLLL',
      '..............LLwLL',
      '..............LLLLL',
      '..............LLYLL',
      '..............LYYYL',
      '..............LYoYL',
      '..............LYoYL',
      '..............LLLLL',
      '..............LLLLL',
      '.eeeeeeeeeeecoLLLLL',
      '.wwwwwwwwwwwcoLLLLL',
      '.eeeeeeeeeeecoLLLLL',
      'PPPPPPPPPPPPPcLLLLL',
      'PwwwwwwwwwwwPcLLLLL',
      'PPPPPPPPPPPPPcLLLLL'
    ]
  },
  teaset: {
    rows: [
      '......hh.....................',
      '.....LLLL....................',
      '...LLLLLLLL..................',
      '..PPPPPPPPPP.................',
      'P.PwPPPPPPPPPP...............',
      'PPPwPPwPPPPP.P..aaaaa..YYYYY.',
      '.PPPPPPPPwPP.P..awaaa..YwYYY.',
      '..PPwPPPPPPPPP...aaa....YYY..',
      '..PPPPPPwPPPP..wwwwwwwwwwwwww',
      '...PPPPPPPP..................',
      '....PPPPPP...................'
    ]
  },
  doll: {
    rows: [
      '...YYYYYY...',
      '..YYYYYYYYhh',
      '.YYYYYYYYYYh',
      '.YYssssssYY.',
      '.YsossssosY.',
      '.YPssssssPY.',
      '..YsssXssY..',
      '....ssss....',
      '...wwwwww...',
      '..PPPPPPPP..',
      '.sPPwPPPPPs.',
      '.sPPPPPwPPs.',
      '..PPPPPPPP..',
      '..PPPPwPPP..',
      '.PPPPPPPPPP.',
      'PPPPPPPPPPPP',
      '...s....s...',
      '...s....s...',
      '..hh....hh..'
    ]
  },
  tutu: {
    rows: [
      '.........oo.........',
      '..........o.........',
      '........oo.oo.......',
      '.....ooo.....ooo....',
      '..oooooooooooooooo..',
      '...LLLLLLLLLLLLLL...',
      '...LLLLLlLLLLLLLL...',
      '..PPPPPPPPPPPPPPPP..',
      '.PPPPPwPPPPPPPPPPPP.',
      'PPPPPPPPPPPPPPwPPPPP',
      'pPPPpPPPpPPPpPPPpPPP',
      'ppp.ppp.ppp.ppp.ppp.'
    ]
  },
  tiara: {
    rows: [
      '.....33.....',
      '..w..33..w..',
      '.wgw.ww.wgw.',
      '.gwgwggwgwg.',
      'wggggggggggw',
      'gggggggggggg'
    ]
  },
  wings: {
    w: 22, h: 17,
    draw(b) {
      b.ell(5.5, 6, 5.5, 4.5, 'L'); b.ell(16.5, 6, 5.5, 4.5, 'L');
      b.ell(5, 5.5, 3, 2.5, 'l'); b.ell(17, 5.5, 3, 2.5, 'l');
      b.ell(7, 12.5, 4, 3.5, 'A'); b.ell(15, 12.5, 4, 3.5, 'A');
      b.ell(7, 12, 2, 2, 'a'); b.ell(15, 12, 2, 2, 'a');
      b.rect(10, 0, 2, 16, 'h'); b.vline(10, 1, 14, 'P');
      [[4, 4], [18, 6], [6, 12], [16, 13], [3, 7]].forEach(([x, y]) => b.px(x, y, 'w'));
    }
  },
  drawing: {
    w: 20, h: 16,
    draw(b) {
      b.rect(0, 0, 20, 16, 'w');
      b.rect(0, 0, 3, 2, 'y'); b.rect(17, 0, 3, 2, 'y');
      b.ell(16, 4.5, 2, 2, 'Y'); [[16, 1], [19, 4], [13, 4], [18, 2], [14, 2]].forEach(([x, y]) => b.px(x, y, 'Y'));
      b.line(2, 8, 5, 5, 'x'); b.line(5, 5, 8, 8, 'x');
      b.hline(3, 8, 5, 'n'); b.vline(3, 8, 4, 'n'); b.vline(7, 8, 4, 'n'); b.hline(3, 11, 5, 'n'); b.px(5, 10, 'R'); b.px(5, 11, 'R');
      [[10, 'U', 4], [12, 'h', 4], [14, 'v', 3], [16, 'A', 2]].forEach(([x, c, hh]) => {
        b.px(x, 12 - hh - 1, c); b.vline(x, 12 - hh, hh, c); b.px(x - 1, 12 - hh + 1, c); b.px(x + 1, 12 - hh + 1, c);
      });
      b.rect(17, 10, 2, 2, 'u');
      b.hline(1, 13, 18, 'E'); b.px(4, 12, 'E'); b.px(9, 12, 'E'); b.px(14, 12, 'E');
    }
  },
  crayons: {
    rows: [
      'xxxxxt.......',
      'xwwxxt.......',
      '.....nnnnnt..',
      '.....nwwnnt..',
      '..YYYYYt.....',
      '..YwwYYt.....'
    ]
  },
  truck: {
    w: 18, h: 10,
    draw(b) {
      b.poly([[7, 0], [18, 0], [17, 6], [7, 6]], 'Y'); b.hline(8, 1, 9, 'y');
      b.rect(0, 2, 7, 5, 'B'); b.rect(1, 3, 3, 2, 'a'); b.px(1, 3, 'w');
      b.rect(0, 6, 18, 2, 'n');
      b.ell(3.5, 8, 2, 2, 'D'); b.ell(14.5, 8, 2, 2, 'D'); b.px(3, 8, 'g'); b.px(14, 8, 'g');
    }
  },

  /* ---------------- 3 · TWEEN ---------------- */
  backpack: {
    w: 18, h: 20,
    draw(b) {
      b.rect(6, 0, 6, 1, 'V'); b.px(5, 1, 'V'); b.px(12, 1, 'V');
      b.rect(1, 2, 15, 18, 'v');
      [[1, 2], [15, 2], [1, 19], [15, 19]].forEach(([x, y]) => b.px(x, y, null));
      b.vline(14, 3, 16, 'V'); b.vline(3, 4, 7, 'L'); b.px(3, 3, 'l');
      b.rect(4, 11, 9, 7, 'L'); b.hline(4, 11, 9, 'l'); b.hline(5, 13, 7, 'V'); b.px(12, 13, 'Y');
      b.px(15, 4, 'o'); b.px(16, 5, 'o');
      b.grid(15, 6, ['.Y.', 'YYY', '.Y.']);
      b.rect(13, 8, 2, 2, 'P');
    }
  },
  skates: {
    w: 21, h: 14,
    draw(b) {
      const skate = (ox, oy) => {
        b.rect(ox, oy, 5, 9, 'w'); b.rect(ox, oy + 5, 11, 4, 'w'); b.px(ox + 11, oy + 7, 'w'); b.px(ox + 11, oy + 8, 'w');
        b.vline(ox + 4, oy + 1, 4, 'c'); b.vline(ox, oy + 1, 7, 'c');
        [[2, 2], [3, 4], [5, 6], [7, 6]].forEach(([x, y]) => b.px(ox + x, oy + y, 't'));   // laces
        b.hline(ox, oy + 9, 12, 'R'); b.rect(ox, oy + 8, 3, 1, 'r');                        // sole + heel
        [1, 4, 7, 10].forEach(wx => { b.rect(ox + wx, oy + 10, 2, 2, 'y'); b.px(ox + wx, oy + 10, 'Y'); });
        b.rect(ox + 12, oy + 9, 1, 2, 'R');                                                 // toe stop
      };
      skate(0, 0);
      skate(8, 2);
    }
  },
  artsupplies: {
    w: 23, h: 10,
    draw(b) {
      b.ell(6.5, 5.5, 6.5, 4.5, 'c');
      [[3, 3, 'h'], [6, 2, 'Y'], [9, 3, 'A'], [10, 6, 'v'], [3, 6, 'E']].forEach(([x, y, c]) => b.rect(x, y, 2, 1, c));
      b.px(7, 7, null);
      b.line(13, 9, 15, 0, 'h'); b.line(14, 9, 16, 0, 'h'); b.px(15, 0, 't');
      b.line(17, 9, 18, 0, 'n'); b.line(18, 9, 19, 0, 'n'); b.px(18, 0, 't');
      b.line(20, 9, 21, 1, 'E'); b.line(21, 9, 22, 1, 'E'); b.px(21, 1, 't');
    }
  },
  sketch: {
    w: 18, h: 22,
    draw(b) {
      b.rect(0, 0, 18, 22, 'w');
      [5, 9, 13, 17, 20].forEach(y => b.hline(1, y, 16, 'g'));
      b.rect(7, 0, 4, 2, 'y');
      b.ell(9, 10, 7, 7.5, 'v');
      b.rect(2, 10, 3, 9, 'v'); b.rect(13, 10, 3, 9, 'v');
      b.ell(9, 11.5, 5, 5, 's');
      b.ell(9, 6.5, 5.5, 2.5, 'v'); b.px(6, 8, 'v'); b.px(11, 8, 'v');
      b.rect(6, 10, 2, 3, 'N'); b.px(6, 10, 'w'); b.rect(10, 10, 2, 3, 'N'); b.px(10, 10, 'w');
      b.px(5, 13, 'P'); b.px(12, 13, 'P'); b.px(8, 14, 'X'); b.px(9, 14, 'X');
      b.rect(6, 17, 6, 3, 'h'); b.hline(7, 17, 4, 'w');
    }
  },
  familyphoto: {
    w: 18, h: 15,
    draw(b) {
      b.rect(0, 0, 18, 15, 'g'); b.hline(1, 0, 10, 'w'); b.vline(0, 1, 8, 'w');
      b.rect(2, 2, 14, 11, 'b'); b.rect(2, 9, 14, 4, 'e');
      [[4, 8, 'n'], [7, 9, 'P'], [10, 6, 'v'], [13, 5, 'A']].forEach(([x, hh, c]) => {
        b.rect(x - 1, 13 - hh + 2, 3, hh - 2, c); b.rect(x - 1, 13 - hh, 2, 2, 's');
      });
      b.line(2, 7, 15, 2, 'w'); b.line(2, 6, 14, 2, 'w'); b.line(3, 7, 15, 3, 'w');
      b.px(13, 3, 'y');
    }
  },
  flipphone: {
    rows: [
      '....hh.',
      '.PPPPP.',
      'PaaaaaP',
      'PawaaaP',
      'PPPPPPP',
      'mmmmmmm',
      'PPPPPPP',
      'PwPwPwP',
      'PPPPPPP',
      'PwPwPwP',
      '.PPPPP.'
    ]
  },
  discman: {
    w: 14, h: 8,
    draw(b) {
      b.ell(7, 4, 7, 4, 'g'); b.ell(7, 3.5, 4, 2.5, 'G'); b.ell(7, 3.5, 1.5, 1, 'L');
      b.px(3, 2, 'w'); b.px(4, 1, 'w'); b.px(12, 5, 'h'); b.px(11, 6, 'A');
    }
  },
  controller: {
    w: 15, h: 9,
    draw(b) {
      b.ell(3, 5.5, 3, 3.5, 'G'); b.ell(12, 5.5, 3, 3.5, 'G'); b.rect(2, 0, 11, 6, 'G'); b.hline(3, 0, 9, 'g');
      b.rect(2, 2, 3, 1, 'o'); b.rect(3, 1, 1, 3, 'o');
      b.px(11, 1, 'h'); b.px(12, 2, 'A'); b.px(10, 2, 'Y'); b.px(11, 3, 'E');
    }
  },

  /* ---------------- 4 · TEEN ---------------- */
  homework1: {
    w: 18, h: 13,
    draw(b) {
      b.rect(2, 0, 16, 12, 'g'); b.rect(0, 1, 16, 12, 'w');
      b.hline(2, 3, 7, 'n'); b.hline(2, 4, 7, 'n');
      [6, 8, 10].forEach(y => b.hline(2, y, 11, 'G'));
      b.ring(13, 3.5, 2, 2, 'x');
      b.line(4, 12, 12, 8, 'Y'); b.px(12, 8, 't'); b.px(4, 12, 'h');
    }
  },
  homework2: {
    w: 18, h: 13,
    draw(b) {
      b.rect(2, 0, 16, 12, 'g'); b.rect(0, 1, 16, 12, 'w');
      b.hline(2, 3, 9, 'v'); b.hline(2, 4, 9, 'v');
      [6, 8, 10].forEach(y => b.hline(2, y, 10, 'G'));
      b.rect(11, 8, 6, 5, 'Y'); b.hline(12, 9, 4, 'k'); b.hline(12, 11, 3, 'k');
    }
  },
  hoodie: {
    w: 20, h: 14,
    draw(b) {
      b.poly([[0, 12], [4, 2], [7, 4], [4, 13]], 'L'); b.poly([[20, 12], [16, 2], [13, 4], [16, 13]], 'L');
      b.rect(4, 2, 12, 12, 'L'); b.vline(15, 3, 10, 'v');
      b.ell(10, 2.5, 4.5, 2.5, 'v'); b.ell(10, 2.5, 2.5, 1.2, 'V');
      b.rect(6, 8, 8, 4, 'l');
      b.vline(8, 4, 3, 'w'); b.vline(11, 4, 3, 'w');
    }
  },
  jeans: {
    w: 18, h: 14,
    draw(b) {
      b.poly([[2, 3], [16, 3], [18, 14], [11, 14], [9, 7], [7, 14], [0, 14]], 'B');
      b.rect(2, 0, 14, 3, 'n'); b.px(9, 1, 'Y');
      b.vline(9, 3, 4, 'n'); b.line(3, 4, 6, 6, 'n'); b.line(15, 4, 12, 6, 'n');
      b.vline(4, 7, 6, 'b'); b.vline(14, 7, 6, 'b');
    }
  },
  tee: {
    w: 17, h: 13,
    draw(b) {
      b.poly([[0, 3], [5, 0], [12, 0], [17, 3], [15, 6], [13, 5], [13, 13], [4, 13], [4, 5], [2, 6]], 'P');
      b.ell(8.5, 0, 2.5, 1.5, null);
      b.grid(6, 5, ['..w..', '.www.', 'wwwww', '.w.w.']);
    }
  },
  sneakers: {
    w: 20, h: 8,
    draw(b) {
      // one trainer the right way up, one kicked over onto its side
      b.grid(0, 1, ['...wwww......', '..wwwhwww....', '.wwwhwhwww...', 'wwwwwwwwwwww.', 'cccccccccccc.', 'GGGGGGGGGGGG.']);
      b.px(2, 3, 'G'); b.px(9, 4, 'w');
      b.grid(11, 0, ['..GG.....', '.Gwwhw...', 'Gwwwhwww.', 'Gwwwwwwww', 'Gcwwwwwww', '.Gcccccc.', '..GGGG...']);
    }
  },
  heels: {
    w: 18, h: 10,
    draw(b) {
      const shoe = ['........hhh.', '.......hhhh.', '......hhw.h.', '..hhhhhh..h.', 'hwhhhhh...h.', 'hhhhh.....h.', '..........h.', '.........hh.'];
      b.grid(0, 0, shoe.map(r => r.replace(/h/g, 'm').replace(/w/g, 'h')));
      b.grid(6, 2, shoe);
    }
  },
  posterband: {
    w: 24, h: 32,
    draw(b) {
      b.rect(0, 0, 24, 32, 'V');
      b.dither(0, 0, 24, 16, 'v', 5);
      const star = (cx, cy, R, r, c) => {
        const pts = [];
        for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
        b.poly(pts, c);
      };
      star(12, 11, 9.5, 4, 'h'); star(12, 11.5, 5.5, 2.4, 'Y');
      miniText(b, 4, 21, 'STAR', 'w'); miniText(b, 2, 27, 'GIRLZ', 'a');
      b.rect(0, 0, 3, 2, 'y'); b.rect(21, 0, 3, 2, 'y');
      [[3, 4], [20, 17], [2, 15]].forEach(([x, y]) => { b.px(x, y, 'w'); b.px(x - 1, y, 'l'); b.px(x + 1, y, 'l'); });
    }
  },
  postermovie: {
    w: 24, h: 32,
    draw(b) {
      b.rect(0, 0, 24, 32, 'p');
      b.dither(0, 6, 24, 6, 'k', 6); b.rect(0, 12, 24, 6, 'k'); b.dither(0, 12, 24, 6, 'Y', 6);
      b.ell(12, 15, 5, 5, 'x'); b.ell(12, 15, 3.5, 3.5, 'k');
      b.rect(0, 18, 24, 14, 'v');
      b.poly([[0, 18], [6, 12], [12, 18]], 'V'); b.poly([[10, 18], [17, 13], [24, 18]], 'V');
      miniText(b, 0, 21, 'SUMMER', 'w'); miniText(b, 8, 27, '14', 'y');
      b.rect(0, 0, 3, 2, 'y'); b.rect(21, 0, 3, 2, 'y');
    }
  },
  trophy: {
    w: 12, h: 18,
    draw(b) {
      b.poly([[1, 0], [5, 2], [6, 0], [11, 0], [9, 9], [3, 9]], 'g');
      b.line(2, 2, 9, 7, 'N'); b.line(3, 2, 10, 6, 'n'); b.vline(4, 1, 6, 'w');
      b.ell(6, 5, 1.6, 1.6, 'w'); b.px(6, 5, 'x');
      b.rect(5, 9, 2, 3, 'G'); b.rect(3, 12, 6, 2, 'n'); b.hline(3, 12, 6, 'B');
      b.rect(2, 14, 8, 1, 'G'); b.rect(1, 15, 10, 3, 'z'); b.rect(3, 16, 6, 1, 'Y');
    }
  },
  medal: {
    w: 13, h: 16,
    draw(b) {
      b.poly([[0, 1], [3, 1], [6, 9], [5, 11], [4, 11]], 'g'); b.line(1, 1, 5, 9, 'w');
      b.ell(5, 3.5, 3, 3, 'w'); b.ring(5, 3.5, 2, 3, 'G'); b.px(5, 3, 'x'); b.px(4, 4, 'N');
      const star = (cx, cy, R, c) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * 0.45 : R; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } b.poly(p, c); };
      star(10, 3, 2.6, 'N'); star(8.5, 7.5, 2.2, 'N'); star(6.8, 10.5, 1.8, 'N');
      b.rect(4, 11, 3, 1, 'G'); b.rect(3, 12, 5, 2, 'n'); b.hline(3, 12, 5, 'w');
      b.rect(2, 14, 7, 2, 'w'); b.hline(2, 15, 7, 'g');
    }
  },
  award: {
    w: 12, h: 16,
    draw(b) {
      b.poly([[3, 11], [1, 6], [3, 1], [6, 0], [5, 3], [8, 1], [7, 4], [11, 3], [8, 7], [9, 11]], 'Y');
      b.ell(6, 7, 2.6, 2.6, 'k'); b.ell(6, 7, 1.4, 1.4, 'z'); b.line(3, 2, 2, 7, 'y'); b.px(6, 1, 'y');
      b.rect(5, 11, 2, 2, 'k');
      b.rect(2, 13, 8, 3, 'w'); b.hline(2, 15, 8, 'g');
    }
  },
  guitar: {
    w: 15, h: 38,
    draw(b) {
      b.rect(5, 0, 5, 4, 'Q'); [[4, 1], [10, 1], [4, 3], [10, 3]].forEach(([x, y]) => b.px(x, y, 'w'));
      b.rect(6, 4, 3, 16, 'R'); for (let y = 6; y < 19; y += 3) b.hline(6, y, 3, 'G');
      b.ell(7.5, 22.5, 5.5, 5, 'r'); b.ell(7.5, 31, 7.5, 7, 'r');
      b.ell(5.5, 30, 3, 4, 't');
      b.ell(7.5, 25.5, 2, 2, 'Q');
      b.rect(5, 32, 5, 1, 'Q');
      b.vline(7, 4, 28, 'c');
      b.grid(10, 33, ['h.h', 'hhh', '.h.']);
    }
  },

  /* ---------------- 5 · YOUNG ADULT ---------------- */
  laptop: {
    w: 23, h: 14,
    draw(b) {
      b.rect(1, 0, 21, 11, 'g');
      b.rect(2, 1, 19, 9, 'L'); b.dither(2, 1, 19, 9, 'A', 8); b.dither(2, 5, 19, 5, 'A', 14);
      b.rect(4, 3, 7, 4, 'w'); b.hline(4, 3, 7, 'h');
      b.rect(12, 5, 6, 3, 'w'); b.hline(12, 5, 6, 'v');
      b.rect(0, 11, 23, 3, 'G'); b.hline(0, 11, 23, 'g'); b.rect(9, 12, 5, 1, 'D');
      b.px(20, 1, 'h');
    }
  },
  plant: {
    w: 14, h: 18,
    draw(b) {
      b.ell(7, 5, 2.5, 5, 'E'); b.ell(3.5, 7.5, 3, 2.5, 'E'); b.ell(10.5, 7.5, 3, 2.5, 'E');
      b.ell(4.5, 3.5, 2, 3, 'F'); b.ell(9.5, 3.5, 2, 3, 'F');
      b.px(7, 2, 'e'); b.px(3, 7, 'e'); b.px(10, 7, 'e'); b.vline(7, 4, 6, 'F');
      b.poly([[2, 11], [12, 11], [11, 18], [3, 18]], 'P'); b.rect(1, 10, 12, 2, 'h');
      b.grid(6, 13, ['w.w', 'www', '.w.']);
    }
  },
  fairylights: {
    w: 75, h: 10, frames: 2,
    draw(b, f) {
      const ys = [];
      for (let x = 0; x < 75; x++) { const u = (x % 37.5) / 37.5; ys[x] = 1 + Math.round(Math.sin(u * Math.PI) * 5); b.px(x, ys[x], 'o'); }
      const cols = ['h', 'Y', 'A', 'L'];
      for (let k = 0, x = 2; x < 74; x += 5, k++) {
        const on = (k + f) % 2 === 0;
        b.rect(x, ys[x] + 1, 2, 2, on ? cols[k % 4] : 'g');
        if (on) b.px(x, ys[x] + 1, 'w');
      }
    }
  },
  mug: {
    rows: [
      'ccccccc..',
      'ccccccccc',
      'chchccc.c',
      'chhhccc.c',
      'cchcccc.c',
      'ccccccccc',
      'ccccccc..',
      '.ccccc...'
    ]
  },
  novel: {
    w: 12, h: 16,
    draw(b) {
      b.rect(2, 0, 10, 15, 'c'); b.rect(0, 0, 10, 15, 'A'); b.vline(0, 0, 15, 'T');
      b.hline(2, 3, 6, 'w'); b.hline(3, 5, 4, 'w');
      b.grid(3, 8, ['.y.', 'yYy', '.y.']);
      b.rect(7, 14, 1, 2, 'h');
    }
  },
  polaroids: {
    w: 35, h: 18,
    draw(b) {
      const sy = x => 1 + Math.round(Math.sin(x / 34 * Math.PI) * 2);
      for (let x = 0; x < 35; x++) b.px(x, sy(x), 'o');
      [[1, 'p', 'h'], [13, 'b', 'v'], [25, 'e', 'E']].forEach(([x0, bg, fg]) => {
        const y0 = sy(x0 + 4) + 2;
        b.rect(x0, y0, 9, 11, 'w');
        b.rect(x0 + 1, y0 + 1, 7, 7, bg); b.rect(x0 + 2, y0 + 3, 2, 2, fg); b.rect(x0 + 5, y0 + 4, 2, 2, fg);
        b.rect(x0 + 4, y0 - 1, 1, 2, 'R');
      });
    }
  },
  cosmetics: {                       // an open blush compact (mirror up) and a lipstick
    w: 15, h: 11,
    draw(b) {
      b.ell(9.5, 4, 5, 4, 'P'); b.ell(9.5, 4, 3.6, 2.8, 'g'); b.px(8, 2, 'w'); b.px(9, 2, 'w'); b.px(8, 3, 'w');
      b.rect(4, 7, 11, 4, 'P'); b.hline(4, 7, 11, 'p'); b.rect(6, 8, 7, 2, 'h'); b.hline(7, 8, 5, 'x');
      b.rect(0, 5, 3, 6, 'G'); b.hline(0, 5, 3, 'Y'); b.rect(0, 2, 3, 3, 'x'); b.px(1, 1, 'x'); b.px(2, 1, 'x'); b.px(2, 0, 'x'); b.px(0, 2, 'X');
    }
  },
  digicam: {                         // a pink compact digital camera
    w: 14, h: 10,
    draw(b) {
      b.rect(9, 0, 3, 1, 'G');
      b.rect(0, 1, 14, 9, 'h'); b.hline(0, 1, 14, 'P'); b.hline(0, 9, 14, 'm');
      b.ell(5.5, 5.5, 3.5, 3.5, 'G'); b.ell(5.5, 5.5, 2.4, 2.4, 'D'); b.ell(5.5, 5.5, 1.2, 1.2, 'z'); b.px(4, 4, 'w');
      b.rect(10, 3, 3, 2, 'w'); b.px(11, 7, 'm'); b.px(12, 7, 'm');
    }
  },

  /* ---------------- 6 · MOVING OUT ---------------- */
  uniletter: {
    w: 15, h: 11,
    draw(b) {
      b.rect(2, 0, 11, 6, 'w'); b.hline(4, 2, 7, 'G'); b.hline(4, 4, 5, 'G'); b.rect(7, 0, 2, 2, 'N');
      b.rect(0, 4, 15, 7, 'c'); b.line(0, 4, 7, 8, 'G'); b.line(14, 4, 7, 8, 'G');
      b.ell(7.5, 8.5, 1.6, 1.6, 'x');
    }
  },
  clothesstack: {
    w: 20, h: 10,
    draw(b) {
      b.rect(0, 7, 20, 3, 'n'); b.hline(1, 7, 18, 'B');
      b.rect(1, 4, 18, 3, 'P'); b.hline(2, 4, 16, 'p');
      b.rect(3, 1, 14, 3, 'L'); b.hline(4, 1, 12, 'l');
      b.px(15, 2, 'w');
    }
  }
};

/* Build every sprite once: normal, hover (white glow) and ghost (dithered) versions. */
const SPR = {};
function buildSprites() {
  Object.keys(PIXEL_SPRITES).forEach(id => {
    const def = PIXEL_SPRITES[id];
    const w = def.rows ? def.rows[0].length : def.w, h = def.rows ? def.rows.length : def.h;
    const variants = [];
    for (let v = 0; v < (def.variants || 1); v++) {
      const frames = [];
      for (let f = 0; f < (def.frames || 1); f++) {
        const b = new PixBuf(w, h, 2);
        if (def.rows) b.grid(0, 0, def.rows); else def.draw(b, f, v);
        if (def.pal) b.d = b.d.map(c => (c && def.pal[c]) || c);
        b.outline('o');
        frames.push({
          normal: b.toCanvas(1),
          hover: b.clone().halo('w').toCanvas(1),
          ghost: b.map((c, x, y) => ((x + y) % 2 ? null : c)).toCanvas(1),
          buf: b
        });
      }
      variants.push(frames);
    }
    SPR[id] = { w: w + 2, h: h + 2, frames: variants[0], variants, frameMs: def.frameMs || (id === 'snowglobe' ? 260 : 520) };
    if (ITEM_DEFS[id]) { ITEM_DEFS[id].w = (w + 2) * ART; ITEM_DEFS[id].h = (h + 2) * ART; }
  });
}

/* Some sprites change between chapters (Teddy gets older). game.js sets SPRITE_VARIANT.teddy. */
const SPRITE_VARIANT = {};
function spriteFrame(id, t, v) {
  const s = SPR[id];
  const vv = Math.min(s.variants.length - 1, v != null ? v : (SPRITE_VARIANT[id] || 0));
  const frames = s.variants[vv];
  return frames.length === 1 ? frames[0] : frames[Math.floor(t / s.frameMs) % frames.length];
}
