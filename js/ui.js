/* =========================================================
   ui.js: the Y2K pixel "operating system" over the room:
   title screen, chapter cards, HUD, Mum's messenger pop-ups,
   the Memory Player (photos / videos), the memory box and
   the ending. Plain DOM + CSS, so it's easy to restyle.
   ========================================================= */
'use strict';

const UI = (() => {
  const $ = sel => document.querySelector(sel);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const bandsFor = c => ['#ffffff', mix(c, '#ffffff', 0.7), mix(c, '#ffffff', 0.35), c, c, mix(c, '#221a13', 0.25), mix(c, '#ffffff', 0.6), '#ffffff'];
  const logoImg = (text, scale, opts, cls) => { const L = logoURL(text, Object.assign({ font: 'Silkscreen', size: 8 }, opts || {})); return '<img class="px ' + (cls || '') + '" src="' + L.url + '" alt="' + esc(text) + '" style="width:' + L.w * scale + 'px;height:' + L.h * scale + 'px">'; };
  const icon = (name, scale) => { const b = iconBuf(name); return '<img class="px icon" src="' + iconURL(name, 1) + '" alt="" style="width:' + b.W * scale + 'px;height:' + b.H * scale + 'px">'; };
  const DEV = /[?&]dev\b/.test(location.search);   // add ?dev to the URL to see which media files are missing
  let H = {};                // handlers from game.js
  let overlay, modal, hud, hintEl, toasts;
  let memState = null;
  let hintTimer = null;

  function init(handlers) {
    H = handlers;
    overlay = $('#overlay'); modal = $('#modal'); hud = $('#hud'); hintEl = $('#hint'); toasts = $('#toasts');
    $('#menuBtn').addEventListener('click', () => { Sound.click(); H.onMenu(); });
    $('#muteBtn').addEventListener('click', () => { H.onMute(); });
    refreshMute();
  }

  function refreshMute() {
    const b = $('#muteBtn');
    if (b) { b.textContent = Sound.isMuted() ? 'x' : '♪'; b.title = Sound.isMuted() ? 'Sound off' : 'Sound on'; b.classList.toggle('off', Sound.isMuted()); }
  }

  /* windows can be dragged around by their title bar, like a real desktop.
     The CSS `translate` property is used so it stacks with the pop-in animation. */
  function draggable(win) {
    const bar = win && win.querySelector('.titlebar');
    if (!bar) return;
    bar.classList.add('grab');
    let x = 0, y = 0, drag = null, moved = false;
    bar.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('button')) return;
      const s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 1;
      const t = (win.style.translate || '').split(' ').map(parseFloat);   // keeps its spot if the window re-renders
      x = t[0] || 0; y = t[1] || 0;
      const r = win.getBoundingClientRect(), st = document.getElementById('stage').getBoundingClientRect();
      drag = {
        id: e.pointerId, s, cx: e.clientX, cy: e.clientY, x0: x, y0: y,
        minX: x + (st.left - r.left) / s - (r.width / s - 96), maxX: x + (st.right - r.left) / s - 96,
        minY: y + (st.top - r.top) / s, maxY: y + (st.bottom - r.top) / s - 44
      };
      moved = false;
      try { bar.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      bar.classList.add('grabbing');
      e.preventDefault();
    });
    bar.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = (e.clientX - drag.cx) / drag.s, dy = (e.clientY - drag.cy) / drag.s;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      x = Math.round(Math.min(drag.maxX, Math.max(drag.minX, drag.x0 + dx)) / 4) * 4;   // snap to the 4px pixel grid
      y = Math.round(Math.min(drag.maxY, Math.max(drag.minY, drag.y0 + dy)) / 4) * 4;
      win.style.translate = x + 'px ' + y + 'px';
      H.onActivity && H.onActivity();
    });
    const end = e => { if (drag && e.pointerId === drag.id) { drag = null; bar.classList.remove('grabbing'); } };
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
    // a drag shouldn't count as "click anywhere to continue"
    bar.addEventListener('click', e => { if (moved) { e.stopPropagation(); moved = false; } });
  }

  function setScreen(html, cls) {
    overlay.innerHTML = html ? '<div class="screen ' + (cls || '') + '">' + html + '</div>' : '';
    return overlay.firstElementChild;
  }

  /* ---------------- title ---------------- */
  // withDoor: the visitor first sees the bedroom door (logo + our names on it) and opens it to reach this screen.
  function showTitle(chapters, withDoor) {
    const discs = chapters.map((c, i) =>
      '<button class="disc" data-i="' + i + '"><img class="px" src="' + discURL(c.accent, 1) + '" alt=""><b>' + (i + 1) + '</b><small>' + c.year + '</small></button>').join('');
    const floaters = ['star', 'heart', 'sparkle', 'heart', 'star', 'sparkle', 'heart', 'star', 'sparkle', 'heart'].map((n, i) =>
      '<span class="floater" style="left:' + (5 + i * 9.5) + '%;animation-delay:' + (-i * 1.7) + 's">' + icon(n, 4 + (i % 3) * 2) + '</span>').join('');
    const names = CREDITS.map(c => c[0].replace(/\s*\(.*\)/, '')).sort().join(' · ');
    const el = setScreen(
      '<div class="holo"></div><div class="floaters">' + floaters + '</div>' +
      '<div class="logo pop-in"><img class="brand-logo" src="assets/brand/logo-main.png" alt="The Next Chapter" style="width:510px;height:355px"></div>' +
      '<div class="win title-win pop-in">' +
      '  <div class="titlebar"><span>THE_NEXT_CHAPTER.EXE</span><span class="tb-dots"><i>_</i><i>□</i><i>x</i></span></div>' +
      '  <div class="win-body">' +
      '    <p class="tagline">a little game about keeping up a room,<br>and letting go</p>' +
      '    <button class="aqua big" id="startBtn">&gt; START</button>' +
      '    <div class="discs">' + discs + '</div>' +
      '    <p class="small">or pick a disc to jump to a chapter · best with sound on ♪</p>' +
      '  </div>' +
      '</div>' +
      '<div class="title-foot">KKB385 · A3 · an interactive room by Isabella, Lyebin, Chloee &amp; Cecelia</div>' +
      (withDoor
        ? '<div class="door-splash" role="button" aria-label="Open the door">' +
          '  <canvas class="px door-wall" width="320" height="180"></canvas>' +
          '  <div class="door-leaf"><canvas class="px" width="' + DOOR_ART.w + '" height="180"></canvas>' +
          '    <img class="door-logo" src="assets/brand/logo-stacked.png" alt="The Next Chapter">' +
          '    <div class="door-names">' + esc(names) + '</div>' +
          '    <div class="door-hint">click the door to come in &gt;</div>' +
          '  </div>' +
          '</div>'
        : ''), 'title-screen' + (withDoor ? ' door-closed' : ''));
    draggable(el.querySelector('.title-win'));
    el.querySelector('#startBtn').addEventListener('click', () => H.onStart());
    el.querySelectorAll('.disc').forEach(b => b.addEventListener('click', () => H.onJump(+b.dataset.i)));
    if (withDoor) {
      const splash = el.querySelector('.door-splash');
      const paint = (sel, cv) => { const c = splash.querySelector(sel).getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(cv, 0, 0); };
      paint('.door-wall', drawDoorWall());
      paint('.door-leaf canvas', drawDoorLeaf());
      let opened = false;
      const open = () => {
        if (opened || !splash.isConnected) return; opened = true;
        window.removeEventListener('keydown', onKeyOpen);
        Sound.init(); Sound.door();
        splash.classList.add('opening');
        setTimeout(() => el.classList.remove('door-closed'), 750);   // the title screen pops in as you walk through
        setTimeout(() => splash.remove(), 1400);
      };
      const onKeyOpen = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
      splash.addEventListener('click', open);
      window.addEventListener('keydown', onKeyOpen);
    }
    showHUD(false); hideHint();
  }

  /* ---------------- chapter card ---------------- */
  function showIntro(ch, idx, onBegin, teddy) {
    const el = setScreen(
      '<div class="card pop-in" style="--accent:' + ch.accent + '">' +
      '  <div class="card-disc"><img class="px" src="' + discURL(ch.accent, 1) + '" alt=""><span>' + (idx + 1) + '</span></div>' +
      '  <div class="card-kicker">' + esc(ch.kicker) + '</div>' +
      '  <div class="card-title">' + logoImg(ch.title.toUpperCase(), 5, { bands: bandsFor(ch.accent) }) + '</div>' +
      '  <div class="lcd">' + ch.year + '</div>' +
      '  <p class="card-text" id="typed"></p>' +
      (teddy ? '  <div class="card-teddy"><img class="px" src="' + teddy.thumb + '" alt="Teddy"><span>Teddy: <b>' + esc(teddy.label) + '</b></span></div>' : '') +
      '  <button class="aqua" id="beginBtn">' + (ch.moving ? 'Start packing &gt;' : 'Open the box &gt;') + '</button>' +
      '</div>', 'intro-screen');
    typeText(el.querySelector('#typed'), ch.intro);
    const go = () => { Sound.click(); onBegin(); };
    el.querySelector('#beginBtn').addEventListener('click', go);
    showHUD(false); hideHint();
  }

  function typeText(node, text) {
    let i = 0;
    node.textContent = '';
    const tick = () => {
      if (!node.isConnected) return;
      i += 2; node.textContent = text.slice(0, i);
      if (i < text.length) setTimeout(tick, 28);
    };
    tick();
  }

  /* ---------------- HUD ---------------- */
  function showHUD(on) { hud.classList.toggle('hidden', !on); }
  function setHUD(s) {
    $('#hudChapter').textContent = s.kicker + ' · ' + s.title;
    $('#hudYear').textContent = s.year;
    $('#hudTidy').textContent = s.moving ? (s.packed + ' packed') : (s.tidy + '/' + s.total);
    $('#hudLabel').textContent = s.moving ? 'PACKING' : 'UPKEEP';
    const pct = s.moving ? Math.min(1, s.packed / 5) : (s.total ? s.tidy / s.total : 0);
    $('#hudBar').style.width = Math.round(pct * 100) + '%';
    $('#hudMem').textContent = 'MEM ' + s.memSeen + '/' + s.memTotal;
    refreshMute();
  }

  function hint(text, opts) {
    if (!text) return hideHint();
    hintEl.textContent = text;
    hintEl.classList.remove('hidden', 'pulse');
    void hintEl.offsetWidth;
    if (opts && opts.pulse) hintEl.classList.add('pulse');
    clearTimeout(hintTimer);
    if (opts && opts.ms) hintTimer = setTimeout(hideHint, opts.ms);
  }
  function hideHint() { hintEl.classList.add('hidden'); }

  /* ---------------- messenger toasts ---------------- */
  function toast(from, text, nudge) {
    const t = document.createElement('div');
    t.className = 'toast slide-in' + (nudge ? ' nudge' : '');
    t.innerHTML = '<div class="toast-bar">' + icon(from === 'Mum' ? 'heart' : 'smiley', 2) + ' ' + esc(from) + ' says:<i>x</i></div><div class="toast-text">' + esc(text) + '</div>';
    toasts.appendChild(t);
    while (toasts.children.length > 3) toasts.firstElementChild.remove();
    nudge ? Sound.nudge() : Sound.toast();
    const kill = () => { t.classList.add('slide-out'); setTimeout(() => t.remove(), 400); };
    t.addEventListener('click', kill);
    setTimeout(kill, 6500);
  }
  function clearToasts() { toasts.innerHTML = ''; }

  /* ---------------- memory player ---------------- */
  function stampFor(year, seed) {
    const yy = String(year).slice(2);
    const m = 1 + (seed * 7) % 12, d = 1 + (seed * 13) % 28;
    return "'" + yy + ' ' + m + ' ' + d;
  }

  function openMemory(mem, ch, opts) {
    closeMemory(true);
    const seed = [...mem.id].reduce((n, c) => n + c.charCodeAt(0), 0);
    const fileName = mem.title || (mem.src ? mem.src.split('/').pop() : 'memory');
    const isMedia = mem.type === 'photo' || mem.type === 'video';
    let frame = '';
    if (isMedia) {
      frame =
        '<div class="mem-frame ' + mem.type + '">' +
        '  <div class="mem-media"></div>' +
        (mem.type === 'video'
          ? '<div class="cam"><span class="rec">REC</span><span class="cam-mode">SP &gt;</span><span class="stamp">' + stampFor(ch.year, seed) + '</span></div>'
          : '<span class="photo-stamp">' + stampFor(ch.year, seed) + '</span>') +
        '  <div class="missing hidden">placeholder · add <b>' + esc(mem.src) + '</b></div>' +
        '</div>' +
        (mem.type === 'video' ? '<div class="mem-controls"><button class="ctl" id="memPlay">||</button><div class="seek"><i id="memSeek"></i></div><button class="ctl" id="memReplay">&lt;&lt;</button></div>' : '');
    } else {
      frame = '<div class="paper ' + (mem.type === 'letter' ? 'letter' : '') + '"><p id="memTyped"></p></div>';
    }
    modal.innerHTML =
      '<div class="backdrop fade-in">' +
      '  <div class="win mem-win pop-in" style="--accent:' + ch.accent + '">' +
      '    <div class="titlebar"><span>' + (mem.type === 'video' ? 'MEMORY PLAYER 2000' : mem.type === 'photo' ? 'PHOTO VIEWER' : 'NOTEPAD') + ' : ' + esc(fileName) + '</span><button class="tb-close" id="memClose">x</button></div>' +
      '    <div class="mem-body">' + frame +
      (isMedia ? '<div class="mem-caption">' + esc(mem.caption || '') + '</div>' : '') +
      '    </div>' +
      '    <div class="mem-foot">click anywhere to continue</div>' +
      '  </div>' +
      '</div>';
    const back = modal.querySelector('.backdrop');
    draggable(modal.querySelector('.mem-win'));
    memState = { mem, opts, opened: performance.now(), timers: [], video: null, fakeT: null };
    const close = () => { if (performance.now() - memState.opened > 450) closeMemory(); };
    modal.querySelector('#memClose').addEventListener('click', e => { e.stopPropagation(); closeMemory(); });
    back.addEventListener('click', e => {
      if (e.target.closest('.mem-controls') || e.target.closest('.mem-frame.video')) return;
      close();
    });
    if (mem.type === 'video') {
      modal.querySelector('.mem-frame').addEventListener('click', e => { e.stopPropagation(); togglePlay(); });
    }
    if (!isMedia) { typeText(modal.querySelector('#memTyped'), mem.caption || ''); Sound.page(); return; }

    const host = modal.querySelector('.mem-media');
    const showPlaceholder = () => {
      host.innerHTML = '';
      if (DEV) modal.querySelector('.missing').classList.remove('hidden');
      opts.mountPlaceholder(host, mem);
      if (mem.type === 'video') fakePlayback();
    };
    const PX = typeof MEDIA_PIXEL === 'number' ? MEDIA_PIXEL : 0;
    const frameEl = modal.querySelector('.mem-frame');
    // photos and stills keep their own shape (portrait photos get a tall frame, nothing is cropped)
    const fitFrame = (ratio, inset) => {
      const a = Math.min(1.9, Math.max(0.6, ratio)), MW = 576, MH = 420;
      const w = a >= MW / MH ? MW : Math.round(MH * a), h = a >= MW / MH ? Math.round(MW / a) : MH;
      frameEl.style.width = (w + inset) + 'px'; frameEl.style.height = (h + inset) + 'px';
    };
    // canvas for real footage: full resolution for the screen it's on (the stage may be scaled up)
    const photoCanvas = () => {
      const s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 1;
      const k = PX > 0 ? PX : 1 / Math.min(3, s * (window.devicePixelRatio || 1));
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(host.clientWidth / k)); cv.height = Math.max(1, Math.round(host.clientHeight / k));
      cv.className = PX > 0 ? 'pixel-canvas' : 'photo-canvas';
      return cv;
    };
    // the stand-in illustrations are pixel art on purpose, always 3 screen px per pixel
    const artCanvas = () => { const cv = document.createElement('canvas'); cv.width = Math.round(host.clientWidth / 3); cv.height = Math.round(host.clientHeight / 3); cv.className = 'pixel-canvas'; return cv; };
    const showArt = () => {
      host.innerHTML = '';
      const cv = artCanvas(), art = MEMORY_ART[mem.art](cv.width, cv.height);
      const c2 = cv.getContext('2d'); c2.imageSmoothingEnabled = false; c2.drawImage(art.toCanvas(1), 0, 0);
      host.appendChild(cv);
    };
    const showStill = () => {          // the video isn't in yet, but there's a photo: a slow camcorder zoom towards the subject
      const img = new Image();
      img.onerror = showPlaceholder;
      img.onload = () => {
        host.innerHTML = '';
        const sw = img.naturalWidth, sh = img.naturalHeight;
        fitFrame(sw / sh, 0); frameEl.classList.add('real');
        const cv = photoCanvas(), ctx = cv.getContext('2d'); host.appendChild(cv);
        ctx.imageSmoothingEnabled = PX === 0; ctx.imageSmoothingQuality = 'high';
        const st = memState, dur = 8000, f = mem.focus || [0.5, 0.5];
        fakePlayback(dur);
        const loop = () => {
          if (memState !== st || !cv.isConnected) return;
          const t = Math.min(1, fakeTime() / dur), e = t * t * (3 - 2 * t);
          const k = Math.max(cv.width / sw, cv.height / sh) * (1 + 0.22 * e);
          const w = cv.width / k, h = cv.height / k;
          const cx = sw * (0.5 + (f[0] - 0.5) * e), cy = sh * (0.5 + (f[1] - 0.5) * e);
          ctx.drawImage(img, Math.max(0, Math.min(sw - w, cx - w / 2)), Math.max(0, Math.min(sh - h, cy - h / 2)), w, h, 0, 0, cv.width, cv.height);
          requestAnimationFrame(loop);
        };
        loop();
      };
      img.src = mem.still;
    };
    const pixCanvas = photoCanvas;
    const cover = (ctx, src, sw, sh, cv) => { const k = Math.max(cv.width / sw, cv.height / sh), w = cv.width / k, h = cv.height / k; ctx.drawImage(src, (sw - w) / 2, (sh - h) / 2, w, h, 0, 0, cv.width, cv.height); };
    if (mem.type === 'photo') {
      const img = new Image();
      img.alt = mem.caption || '';
      img.onload = () => {
        host.innerHTML = '';
        fitFrame(img.naturalWidth / img.naturalHeight, 24);
        if (PX > 0) { const cv = pixCanvas(); cover(cv.getContext('2d'), img, img.naturalWidth, img.naturalHeight, cv); host.appendChild(cv); }
        else host.appendChild(img);
      };
      img.onerror = () => (mem.art && typeof MEMORY_ART !== 'undefined' && MEMORY_ART[mem.art]) ? showArt() : showPlaceholder();
      img.src = mem.src;
    } else {
      const v = document.createElement('video');
      v.playsInline = true; v.preload = 'auto';
      v.addEventListener('error', () => (mem.still ? showStill() : showPlaceholder()), { once: true });
      v.addEventListener('loadeddata', () => {
        host.innerHTML = '';
        if (v.videoWidth) fitFrame(v.videoWidth / v.videoHeight, 0);   // portrait phone videos get a tall frame
        frameEl.classList.add('real');
        if (PX > 0) {
          v.className = 'hidden-video'; host.appendChild(v);
          const cv = pixCanvas(), ctx = cv.getContext('2d'); host.appendChild(cv);
          const st = memState;
          const loop = () => { if (memState !== st || !v.isConnected) return; if (v.videoWidth) cover(ctx, v, v.videoWidth, v.videoHeight, cv); requestAnimationFrame(loop); };
          loop();
        } else host.appendChild(v);
        const p = v.play(); if (p && p.catch) p.catch(() => setPlayIcon(false));
      });
      v.addEventListener('timeupdate', () => { H.onActivity && H.onActivity(); setSeek(v.duration ? v.currentTime / v.duration : 0); });
      v.addEventListener('play', () => setPlayIcon(true));
      v.addEventListener('pause', () => setPlayIcon(false));
      v.addEventListener('ended', () => { setSeek(1); memState.timers.push(setTimeout(() => closeMemory(), 2600)); });
      v.src = mem.src;
      memState.video = v;
    }
    const replay = modal.querySelector('#memReplay');
    if (replay) replay.addEventListener('click', e => { e.stopPropagation(); restart(); });
    const playB = modal.querySelector('#memPlay');
    if (playB) playB.addEventListener('click', e => { e.stopPropagation(); togglePlay(); });
  }

  function setSeek(p) { const s = document.getElementById('memSeek'); if (s) s.style.width = Math.round(p * 100) + '%'; }
  function setPlayIcon(playing) { const b = document.getElementById('memPlay'); if (b) b.textContent = playing ? '||' : '>'; }

  /* placeholder "playback" for videos that haven't been added yet */
  function fakeTime() {
    const f = memState && memState.fakeT;
    if (!f) return memState && memState.fakeDur ? memState.fakeDur : 0;
    return f.paused ? f.acc : f.acc + (performance.now() - f.start);
  }
  function fakePlayback(d) {
    const dur = d || 7000;
    memState.fakeDur = dur;
    memState.fakeT = { start: performance.now(), paused: false, acc: 0 };
    const step = () => {
      if (!memState || !memState.fakeT) return;
      const f = memState.fakeT;
      const t = f.paused ? f.acc : f.acc + (performance.now() - f.start);
      setSeek(Math.min(1, t / dur));
      if (t >= dur) { memState.fakeT = null; setPlayIcon(false); memState.timers.push(setTimeout(() => closeMemory(), 2600)); return; }
      requestAnimationFrame(step);
    };
    setPlayIcon(true); step();
  }

  function togglePlay() {
    if (!memState) return;
    const v = memState.video;
    if (v && v.isConnected) { v.paused ? v.play() : v.pause(); return; }
    const f = memState.fakeT;
    if (!f) return;
    if (f.paused) { f.paused = false; f.start = performance.now(); setPlayIcon(true); }
    else { f.acc += performance.now() - f.start; f.paused = true; setPlayIcon(false); }
  }

  function restart() {
    if (!memState) return;
    memState.timers.forEach(clearTimeout); memState.timers = [];
    const v = memState.video;
    if (v && v.isConnected) { v.currentTime = 0; v.play(); return; }
    fakePlayback(memState.fakeDur);
  }

  function closeMemory(silent) {
    if (!memState) { modal.innerHTML = ''; return; }
    const st = memState; memState = null;
    st.timers.forEach(clearTimeout);
    if (st.video) { st.video.pause(); st.video.removeAttribute('src'); st.video.load(); }
    st.opts.unmountPlaceholder && st.opts.unmountPlaceholder();
    const win = modal.querySelector('.backdrop');
    if (win) { win.classList.add('fade-out'); setTimeout(() => { if (!memState) modal.innerHTML = ''; }, 220); }
    if (!silent && st.opts.onClose) st.opts.onClose();
  }
  const memoryOpen = () => !!memState;

  /* ---------------- room tidy! ---------------- */
  function showComplete(ch, label, onNext) {
    const el = setScreen(
      '<div class="tidy-banner pop-in" style="--accent:' + ch.accent + '">' +
      '  <div class="tidy-title">' + logoImg(ch.id === 'youngadult' ? 'HOME SWEET HOME' : 'ROOM TIDY!', 6, { bands: bandsFor(ch.accent) }) + '</div>' +
      '  <div class="tidy-sub">' + esc(ch.title) + ' · ' + ch.year + ' · complete</div>' +
      '  <button class="aqua" id="nextBtn">' + esc(label) + '</button>' +
      '</div>', 'complete-screen');
    const b = el.querySelector('#nextBtn');
    b.disabled = true; setTimeout(() => { b.disabled = false; }, 900);
    b.addEventListener('click', () => { Sound.click(); onNext(); });
    hideHint();
  }

  /* ---------------- memory box (keep / let go) ---------------- */
  function showKeep(o) {
    // o: { chapter, candidates:[ids], box:[ids w/o teddy], names, thumb(id), sinceLabel(id), onDone(selected[]) }
    const selected = o.box.slice();
    const prev = new Set(o.box);
    const el = setScreen('<div class="win keep-win pop-in" style="--accent:' + o.chapter.accent + '"></div>', 'keep-screen');
    const win = el.firstElementChild;
    const tile = (id, extra, label) =>
      '<button class="tile ' + (extra || '') + '" data-id="' + id + '"><img src="' + o.thumb(id) + '" alt=""><span>' + esc(o.names(id)) + '</span>' + (label ? '<em>' + esc(label) + '</em>' : '') + '</button>';
    const render = () => {
      const slots = [];
      for (let i = 0; i < o.capacity; i++) slots.push(selected[i] ? tile(selected[i], 'in', prev.has(selected[i]) ? o.sinceLabel(selected[i]) : 'new') : '<div class="tile empty"><span>empty</span></div>');
      const fresh = o.candidates.filter(id => !selected.includes(id));
      const goingAway = o.box.filter(id => !selected.includes(id));
      win.innerHTML =
        '<div class="titlebar"><span>' + icon('floppy', 2) + ' SAVE TO MEMORY BOX (A:)</span><span class="tb-dots"><i>_</i><i>□</i><i>x</i></span></div>' +
        '<div class="keep-body">' +
        '  <p class="keep-lead">Pack a memory box for the next chapter. <b>Teddy always comes.</b> There’s room for ' + o.capacity + ' more things.</p>' +
        '  <div class="keep-row box-row"><div class="tile locked"><img src="' + o.thumb('teddy') + '" alt=""><span>Teddy' + (o.teddyLabel ? '<small>' + esc(o.teddyLabel) + '</small>' : '') + '</span><em>always</em></div>' + slots.join('') + '</div>' +
        '  <div class="keep-label">From this chapter: click to keep</div>' +
        '  <div class="keep-row">' + (fresh.length ? fresh.map(id => tile(id, 'out')).join('') : '<span class="keep-none">nothing left to choose</span>') + '</div>' +
        (goingAway.length ? '<div class="keep-label">Letting go: click to rescue</div><div class="keep-row">' + goingAway.map(id => tile(id, 'out gone', 'let go')).join('') + '</div>' : '') +
        '  <div class="keep-foot"><span>Things you don’t keep stay in this room’s past.</span><button class="aqua" id="keepDone">Save &amp; continue &gt;</button></div>' +
        '</div>';
      win.querySelectorAll('.tile.in').forEach(b => b.addEventListener('click', () => { Sound.back(); selected.splice(selected.indexOf(b.dataset.id), 1); render(); }));
      win.querySelectorAll('.tile.out').forEach(b => b.addEventListener('click', () => {
        if (selected.length >= o.capacity) { Sound.wrong(); win.querySelector('.box-row').classList.remove('shake'); void win.offsetWidth; win.querySelector('.box-row').classList.add('shake'); return; }
        Sound.pick(); selected.push(b.dataset.id); render();
      }));
      win.querySelector('#keepDone').addEventListener('click', () => { Sound.click(); o.onDone(selected.slice()); });
      draggable(win);
    };
    render();
    showHUD(false); hideHint();
  }

  /* ---------------- ending ---------------- */
  function showEnding(s, onReplay) {
    const tiles = (list, cls) => list.map(x => '<div class="tile mini ' + (cls || '') + '"><img src="' + s.thumb(x.id) + '" alt=""><span>' + esc(s.names(x.id)) + '</span>' + (x.label ? '<em>' + esc(x.label) + '</em>' : '') + '</div>').join('');
    const el = setScreen(
      '<div class="holo"></div>' +
      '<div class="win end-win pop-in">' +
      '  <div class="titlebar"><span>THE_NEXT_CHAPTER.EXE : COMPLETE</span><span class="tb-dots"><i>_</i><i>□</i><i>x</i></span></div>' +
      '  <div class="end-body">' +
      '    <div class="logo"><img class="brand-logo" src="assets/brand/logo-liner.png" alt="The Next Chapter" style="width:340px;height:62px"></div>' +
      '    <p class="end-lead">She packed Teddy last. She always does.</p>' +
      '    <div class="end-cols">' +
      '      <div><div class="keep-label">Packed for uni</div><div class="keep-row">' + tiles(s.packed) + '</div></div>' +
      (s.letGo.length ? '<div><div class="keep-label">Let go along the way</div><div class="keep-row">' + tiles(s.letGo, 'gone') + '</div></div>' : '') +
      '    </div>' +
      (s.teddy ? '    <div class="teddy-row"><div class="keep-label">Teddy through<br>the years</div><div class="teddy-years">' + s.teddy.map(t => '<div class="ty"><img class="px" src="' + t.thumb + '" alt="" title="' + esc(t.label) + '"><span>' + t.year + '</span></div>').join('<i>›</i>') + '</div></div>' : '') +
      '    <p class="end-stat">memories found: ' + s.memSeen + ' / ' + s.memTotal + '</p>' +
      '    <div class="credits">' + s.credits.map(c => '<span><b>' + esc(c[0]) + '</b> · ' + esc(c[1]) + '</span>').join('') + '</div>' +
      '    <button class="aqua big" id="replayBtn">&lt;&lt; Play again</button>' +
      '  </div>' +
      '</div>', 'end-screen');
    draggable(el.querySelector('.end-win'));
    el.querySelector('#replayBtn').addEventListener('click', () => { Sound.click(); onReplay(); });
    showHUD(false); hideHint(); clearToasts();
  }

  /* ---------------- pause menu ---------------- */
  function showMenu(h) {
    modal.innerHTML =
      '<div class="backdrop fade-in">' +
      '  <div class="win menu-win pop-in">' +
      '    <div class="titlebar"><span>MENU</span><button class="tb-close" data-a="resume">x</button></div>' +
      '    <div class="menu-body">' +
      '      <button class="aqua" data-a="resume">&gt; Keep playing</button>' +
      '      <button class="aqua alt" data-a="restart">Restart chapter</button>' +
      '      <button class="aqua alt" data-a="title">Chapter select</button>' +
      '      <button class="aqua alt" data-a="sound">' + (Sound.isMuted() ? 'Sound: off' : 'Sound: on') + '</button>' +
      '      <button class="aqua alt" data-a="fullscreen">Fullscreen</button>' +
      '      <p class="small">keys: Esc menu · M sound · F fullscreen</p>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    draggable(modal.querySelector('.menu-win'));
    modal.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); Sound.click(); h(b.dataset.a); }));
    modal.querySelector('.backdrop').addEventListener('click', e => { if (e.target.classList.contains('backdrop')) h('resume'); });
  }
  function hideMenu() { if (!memState) modal.innerHTML = ''; }

  return {
    init, showTitle, showIntro, showHUD, setHUD, hint, hideHint, toast, clearToasts,
    openMemory, closeMemory, memoryOpen, showComplete, showKeep, showEnding, showMenu, hideMenu,
    clearScreen: () => setScreen(''), refreshMute
  };
})();
