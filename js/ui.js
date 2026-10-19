/* =========================================================
   ui.js: the early-2000s "desktop" around the room:
   title screen, chapter cards, top bar, Teddy's tips,
   Mum's messenger pop-ups, the Memory Player (photos /
   videos), the memory box and the ending.
   Plain DOM + CSS, so it's easy to restyle.
   ========================================================= */
'use strict';

const UI = (() => {
  const $ = sel => document.querySelector(sel);
  // escapes text for HTML; hearts get the text-style selector so phones don't turn them into emoji
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])).replace(/\u2665(?!\uFE0E)/g, '\u2665\uFE0E');
  const DEV = /[?&]dev\b/.test(location.search);   // add ?dev to the URL to see which media files are missing

  /* small vector icons (smooth at any size) */
  const ICONS = {
    heart: '<path d="M12 21s-7.6-4.7-9.6-9.3C.8 8.2 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.8 3.7 4.2 7.2C19.6 16.3 12 21 12 21z" fill="#ff84e4" stroke="#211a14" stroke-width="1.8" stroke-linejoin="round"/>',
    smiley: '<circle cx="12" cy="12" r="10" fill="#ffc700" stroke="#211a14" stroke-width="1.6"/><circle cx="8.6" cy="10" r="1.4" fill="#211a14"/><circle cx="15.4" cy="10" r="1.4" fill="#211a14"/><path d="M7.5 14c2.4 3 6.6 3 9 0" stroke="#211a14" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
    floppy: '<path d="M3 3h15l3 3v15H3z" fill="#00b5ff" stroke="#211a14" stroke-width="1.6" stroke-linejoin="round"/><rect x="7" y="3.8" width="9" height="5.4" fill="#f2f2ed" stroke="#211a14" stroke-width="1"/><rect x="13" y="4.6" width="2" height="3.6" fill="#211a14"/><rect x="6" y="12.5" width="12" height="7.5" rx="1" fill="#f2f2ed" stroke="#211a14" stroke-width="1"/>',
    soundOn: '<path d="M3.5 9h4l5-4v14l-5-4h-4z" fill="currentColor"/><path d="M15.8 8.6a4.8 4.8 0 010 6.8M18.4 6a8.5 8.5 0 010 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
    soundOff: '<path d="M3.5 9h4l5-4v14l-5-4h-4z" fill="currentColor"/><path d="M15.8 8.6a4.8 4.8 0 010 6.8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" opacity=".35"/><path d="M3 21L21 3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3z" fill="none" stroke="#221a13" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13" r="4" fill="none" stroke="#221a13" stroke-width="1.6"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="1.5" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M7 4v16M17 4v16M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4" stroke="#fff" stroke-width="1.4"/>'
  };
  const svg = (name, size, extra) => '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true"' + (extra || '') + '>' + ICONS[name] + '</svg>';
  // every window's title bar carries the brand's play icon, like an app icon
  const APP_ICON = '<img class="tb-icon" src="assets/brand/favicon.svg" alt="">';

  /* colour themes: one per chapter, taken from its room, and a holographic one for the start page,
     the thank-you note and the ending. They set the frame colour, the title bars and the page background. */
  const HOLO = 'linear-gradient(135deg, #ffd1ef 0%, #e2cbff 26%, #c4e6ff 50%, #c9fbe3 74%, #fff4b8 100%)';
  const HOME_THEME = { accent: '#ff5400', bar: ['#e6f7ff', '#ade3ff', '#8fd8ff'], holo: HOLO };
  function applyTheme(t) {
    const st = document.getElementById('stage').style;
    st.setProperty('--chapter', t.accent);
    st.setProperty('--bar-hi', t.bar[0]); st.setProperty('--bar', t.bar[1]); st.setProperty('--bar-lo', t.bar[2]);
    st.setProperty('--page', t.holo || 'linear-gradient(180deg, ' + t.page[0] + ' 0%, ' + t.page[1] + ' 100%)');
  }

  let H = {};                // handlers from game.js
  let overlay, modal, hud, dock, hintEl, hintText, toasts;
  let memState = null;
  let hintTimer = null, baseHint = '';

  function init(handlers) {
    H = handlers;
    overlay = $('#overlay'); modal = $('#modal'); hud = $('#hud'); dock = $('#dock'); hintEl = $('#hint'); hintText = $('#hintText'); toasts = $('#toasts');
    $('#menuBtn').addEventListener('click', () => { Sound.click(); H.onMenu(); });
    $('#muteBtn').addEventListener('click', () => { H.onMute(); });
    // "click anywhere to continue" also counts the black margins around the 4:3 page
    // (only a real click out there: a drag that starts on the memory window and ends outside doesn't count)
    let downOutside = false;
    document.addEventListener('pointerdown', e => { downOutside = !e.target.closest('#stage'); }, true);
    document.addEventListener('click', e => {
      if (memState && downOutside && !e.target.closest('#stage') && performance.now() - memState.opened > 450) closeMemory();
    });
    refreshMute();
  }

  // the sound button shows a speaker (never an "x", which reads as "close")
  function refreshMute() {
    const b = $('#muteBtn');
    if (!b) return;
    const off = Sound.isMuted();
    b.innerHTML = svg(off ? 'soundOff' : 'soundOn', 24);
    b.title = off ? 'Sound is off (M)' : 'Sound is on (M)';
    b.setAttribute('aria-label', b.title);
    b.classList.toggle('off', off);
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
      x = Math.round(Math.min(drag.maxX, Math.max(drag.minX, drag.x0 + dx)));
      y = Math.round(Math.min(drag.maxY, Math.max(drag.minY, drag.y0 + dy)));
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
    applyTheme(HOME_THEME);
    const discs = chapters.map((c, i) =>
      '<button class="disc" data-i="' + i + '" style="--accent:' + c.accent + '" aria-label="Chapter ' + (i + 1) + ', ' + c.year + '"><b>' + (i + 1) + '</b><small>' + c.year + '</small></button>').join('');
    const names = CREDITS.map(c => c[0].replace(/\s*\(.*\)/, '')).join(' · ');   // full names, in CREDITS order
    const short = CREDITS.map(c => c[2]);
    const byLine = short.slice(0, -1).join(', ') + ' &amp; ' + short[short.length - 1];
    const el = setScreen(
      '<div class="desk"></div>' +
      '<div class="logo pop-in"><img class="brand-logo" src="assets/brand/logo-main.svg" alt="The Next Chapter" style="width:389px;height:270px"></div>' +
      '<div class="win title-win pop-in">' +
      '  <div class="titlebar"><span>' + APP_ICON + 'The Next Chapter</span></div>' +
      '  <div class="win-body">' +
      '    <p class="tagline">one room, from nursery to moving out:<br>what we keep up, carry on, and leave behind</p>' +
      '    <button class="aqua big" id="startBtn"><img class="btn-play" src="assets/brand/favicon.svg" alt=""><span>Start</span></button>' +
      '    <div class="discs">' + discs + '</div>' +
      '    <p class="small">or pick a disc to jump to a chapter</p>' +
      '  </div>' +
      '</div>' +
      '<div class="title-foot"><span class="badge navy">KKB385 · A3</span><span class="badge">an interactive room by ' + byLine + '</span><span class="badge dark">♪ best with sound on</span></div>' +
      (withDoor
        ? '<div class="door-splash" role="button" aria-label="Open the door">' +
          '  <canvas class="px door-wall" width="' + ART_W + '" height="' + DOOR_ART.h + '"></canvas>' +
          '  <div class="door-leaf"><canvas class="px" width="' + DOOR_ART.w + '" height="' + DOOR_ART.h + '"></canvas>' +
          '    <img class="door-logo" src="assets/brand/logo-stacked.svg" alt="The Next Chapter">' +
          '    <div class="door-names">' + esc(names) + '</div>' +
          '    <div class="door-hint">click the door to come in ▶︎</div>' +
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
        window.removeEventListener('keydown', onKeyOpen, true);
        Sound.init(); Sound.door();
        splash.classList.add('opening');
        setTimeout(() => el.classList.remove('door-closed'), 750);   // the title screen comes in as you walk through
        setTimeout(() => splash.remove(), 1400);
      };
      const onKeyOpen = e => {
        if (!splash.isConnected) { window.removeEventListener('keydown', onKeyOpen, true); return; }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); open(); }
      };
      splash.addEventListener('click', open);
      window.addEventListener('keydown', onKeyOpen, true);   // capture: runs before the game's own key handler
    }
    showHUD(false);
  }

  /* ---------------- chapter card ---------------- */
  function showIntro(ch, idx, onBegin, teddy) {
    applyTheme(ch);   // this chapter's colours, from its room
    const el = setScreen(
      '<div class="card pop-in" style="--accent:' + ch.accent + '">' +
      '  <div class="cd"><span>' + (idx + 1) + '</span></div>' +
      '  <div class="card-kicker">' + esc(ch.kicker) + '</div>' +
      '  <h1 class="big-title">' + esc(ch.title) + '</h1>' +
      '  <div class="lcd">' + ch.year + '</div>' +
      '  <p class="card-text">' + esc(ch.intro) + '</p>' +
      (teddy ? '  <div class="card-teddy"><img class="px" src="' + teddy.thumb + '" alt="Teddy"><span>Teddy: <b>' + esc(teddy.label) + '</b></span></div>' : '') +
      '  <button class="aqua" id="beginBtn">' + (ch.moving ? 'Start packing ▶︎' : 'Open the box ▶︎') + '</button>' +
      '</div>', 'intro-screen');
    const go = () => { Sound.click(); onBegin(); };
    el.querySelector('#beginBtn').addEventListener('click', go);
    showHUD(false);
  }

  /* ---------------- top bar + dock ---------------- */
  function showHUD(on) { hud.classList.toggle('hidden', !on); dock.classList.toggle('hidden', !on); }
  function setHUD(s) {
    $('#hudChapter').textContent = s.kicker + ' · ' + s.title;
    $('#hudYear').textContent = s.year;
    $('#hudTidy').textContent = s.moving ? (s.packed + ' packed') : (s.tidy + '/' + s.total);
    $('#hudLabel').textContent = s.moving ? 'Packing' : 'Upkeep';
    const pct = s.moving ? Math.min(1, s.packed / 5) : (s.total ? s.tidy / s.total : 0);
    $('#hudBar').style.width = Math.round(pct * 100) + '%';
    $('#hudMem').textContent = 'Memories ' + s.memSeen + '/' + s.memTotal;
    refreshMute();
  }

  // Teddy sits in the dock and gives the tips (Teddy ages with the chapters)
  function setHelper(thumb, text) {
    $('#hintIcon').src = thumb;
    baseHint = text || '';
    hint(baseHint);
  }
  function hint(text, opts) {
    if (!text) return hideHint();
    hintText.textContent = text;
    hintEl.classList.remove('pulse', 'fresh');
    void hintEl.offsetWidth;
    hintEl.classList.add('fresh');
    if (opts && opts.pulse) hintEl.classList.add('pulse');
    clearTimeout(hintTimer);
    if (opts && opts.ms) hintTimer = setTimeout(hideHint, opts.ms);
  }
  // "hiding" a tip goes back to the chapter's standing instruction
  function hideHint() {
    clearTimeout(hintTimer);
    hintEl.classList.remove('pulse', 'fresh');
    if (hintText.textContent !== baseHint) hintText.textContent = baseHint;
  }

  /* ---------------- messenger pop-ups ---------------- */
  function toast(from, text, nudge) {
    const t = document.createElement('div');
    t.className = 'toast slide-in' + (nudge ? ' nudge' : '') + (from === 'Mum' ? ' mum' : '');
    t.innerHTML = '<div class="toast-bar">' + svg(from === 'Mum' ? 'heart' : 'smiley', 18) + ' ' + esc(from) + ' says:<i>✕</i></div><div class="toast-text">' + esc(text) + '</div>';
    toasts.appendChild(t);
    while (toasts.children.length > 2) toasts.firstElementChild.remove();
    nudge ? Sound.nudge() : Sound.toast();
    const kill = () => { t.classList.add('slide-out'); setTimeout(() => t.remove(), 300); };
    t.addEventListener('click', kill);
    setTimeout(kill, 7000);
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
    const isMedia = mem.type === 'photo' || mem.type === 'video';
    let frame = '';
    if (isMedia) {
      frame =
        '<div class="mem-frame ' + mem.type + '">' +
        '  <div class="mem-media"></div>' +
        (mem.type === 'video'
          ? '<div class="cam"><span class="rec">REC</span><span class="cam-mode">SP ▶︎</span><span class="stamp">' + stampFor(ch.year, seed) + '</span></div>'
          : '<span class="photo-stamp">' + stampFor(ch.year, seed) + '</span>') +
        '  <div class="missing hidden">waiting for <b>' + esc(mem.src) + '</b></div>' +
        '</div>' +
        (mem.type === 'video' ? '<div class="mem-controls"><button class="ctl" id="memPlay">❚❚</button><div class="seek"><i id="memSeek"></i></div><button class="ctl" id="memReplay">↺</button></div>' : '');
    } else {
      frame = '<div class="paper ' + (mem.type === 'letter' ? 'letter' : '') + '"><p id="memText"></p></div>';
    }
    // the title bar just says what kind of window it is: the file name would only distract from the caption
    const kind = mem.type === 'video' ? 'Memory Player' : mem.type === 'photo' ? 'Photo Viewer' : mem.type === 'letter' ? 'Mail' : 'Notepad';
    modal.innerHTML =
      '<div class="backdrop fade-in">' +
      '  <div class="win mem-win pop-in" style="--accent:' + ch.accent + '">' +
      '    <div class="titlebar"><span>' + APP_ICON + kind + '</span><button class="tb-close" id="memClose" aria-label="Close">✕</button></div>' +
      '    <div class="mem-body">' + frame +
      (isMedia ? '<div class="mem-caption">' + esc(mem.caption || '') + '</div>' : '') +
      '    </div>' +
      '    <div class="mem-foot">click anywhere to continue</div>' +
      '  </div>' +
      '</div>';
    const back = modal.querySelector('.backdrop');
    draggable(modal.querySelector('.mem-win'));
    memState = { mem, opts, opened: performance.now(), timers: [], video: null, fakeT: null };
    const st0 = memState, live = () => memState === st0;   // late image/video callbacks must not touch a newer memory
    const close = () => { if (memState && performance.now() - memState.opened > 450) closeMemory(); };
    modal.querySelector('#memClose').addEventListener('click', e => { e.stopPropagation(); closeMemory(); });
    back.addEventListener('click', e => {
      if (e.target.closest('.mem-controls') || e.target.closest('.mem-frame.video')) return;
      close();
    });
    if (mem.type === 'video') {
      modal.querySelector('.mem-frame').addEventListener('click', e => { e.stopPropagation(); togglePlay(); });
    }
    if (!isMedia) { modal.querySelector('#memText').textContent = mem.caption || ''; Sound.page(); return; }

    const host = modal.querySelector('.mem-media');
    const frameEl = modal.querySelector('.mem-frame');
    // no photo / video yet: the frame stays empty (the caption still shows)
    const showEmpty = () => {
      if (!live()) return;
      host.innerHTML = svg(mem.type === 'video' ? 'film' : 'camera', 64, ' class="mem-empty"');
      if (DEV) modal.querySelector('.missing').classList.remove('hidden');
      const c = modal.querySelector('.mem-controls'); if (c) c.style.visibility = 'hidden';
    };
    // photos and stills keep their own shape (portrait photos get a tall frame, nothing is cropped)
    const fitFrame = (ratio, inset) => {
      const a = Math.min(1.9, Math.max(0.6, ratio)), MW = 600, MH = 440;
      const w = a >= MW / MH ? MW : Math.round(MH * a), h = a >= MW / MH ? Math.round(MW / a) : MH;
      frameEl.style.width = (w + inset) + 'px'; frameEl.style.height = (h + inset) + 'px';
    };
    // canvas for the still-photo zoom: full resolution for the screen it's on (the stage may be scaled up)
    const photoCanvas = () => {
      const s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 1;
      const k = 1 / Math.min(3, s * (window.devicePixelRatio || 1));
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(host.clientWidth / k)); cv.height = Math.max(1, Math.round(host.clientHeight / k));
      cv.className = 'photo-canvas';
      return cv;
    };
    const showStill = () => {          // the video isn't in yet, but there's a photo: a slow camcorder zoom towards the subject
      const img = new Image();
      img.onerror = showEmpty;
      img.onload = () => {
        if (!live()) return;
        host.innerHTML = '';
        const sw = img.naturalWidth, sh = img.naturalHeight;
        fitFrame(sw / sh, 0);
        const cv = photoCanvas(), ctx = cv.getContext('2d'); host.appendChild(cv);
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        const st = memState, dur = 8000, f = mem.focus || [0.5, 0.5];
        fakePlayback(dur);
        const loop = () => {
          if (memState !== st || !cv.isConnected) return;
          const t = Math.min(1, fakeTime() / dur), e = t * t * (3 - 2 * t);
          st.stillLoop = loop; st.stillDone = t >= 1;
          const k = Math.max(cv.width / sw, cv.height / sh) * (1 + 0.22 * e);
          const w = cv.width / k, h = cv.height / k;
          const cx = sw * (0.5 + (f[0] - 0.5) * e), cy = sh * (0.5 + (f[1] - 0.5) * e);
          ctx.drawImage(img, Math.max(0, Math.min(sw - w, cx - w / 2)), Math.max(0, Math.min(sh - h, cy - h / 2)), w, h, 0, 0, cv.width, cv.height);
          if (!st.stillDone) requestAnimationFrame(loop);
        };
        loop();
      };
      img.src = mem.still;
    };
    if (mem.type === 'photo') {
      const img = new Image();
      img.alt = mem.caption || '';
      img.onload = () => {
        if (!live()) return;
        host.innerHTML = '';
        fitFrame(img.naturalWidth / img.naturalHeight, 24);
        host.appendChild(img);
      };
      img.onerror = showEmpty;
      img.src = mem.src;
    } else {
      const v = document.createElement('video');
      v.playsInline = true; v.preload = 'auto';
      v.addEventListener('error', () => (mem.still ? showStill() : showEmpty()), { once: true });
      v.addEventListener('loadeddata', () => {
        if (!live()) return;
        host.innerHTML = '';
        if (v.videoWidth) fitFrame(v.videoWidth / v.videoHeight, 0);   // portrait phone videos get a tall frame
        host.appendChild(v);
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
  function setPlayIcon(playing) { const b = document.getElementById('memPlay'); if (b) b.textContent = playing ? '❚❚' : '▶︎'; }

  /* "playback" timeline for the camcorder zoom over a still photo */
  function fakeTime() {
    const f = memState && memState.fakeT;
    if (!f) return memState && memState.fakeDur ? memState.fakeDur : 0;
    return f.paused ? f.acc : f.acc + (performance.now() - f.start);
  }
  function fakePlayback(d) {
    if (!memState) return;
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
    if (!memState || (!memState.fakeDur && !(memState.video && memState.video.isConnected))) return;
    memState.timers.forEach(clearTimeout); memState.timers = [];
    const v = memState.video;
    if (v && v.isConnected) { v.currentTime = 0; v.play(); return; }
    fakePlayback(memState.fakeDur);
    if (memState.stillLoop && memState.stillDone) { memState.stillDone = false; requestAnimationFrame(memState.stillLoop); }
  }

  function closeMemory(silent) {
    if (!memState) { modal.innerHTML = ''; return; }
    const st = memState; memState = null;
    st.timers.forEach(clearTimeout);
    if (st.video) { st.video.pause(); st.video.removeAttribute('src'); st.video.load(); }
    const win = modal.querySelector('.backdrop');
    if (win) { win.classList.add('fade-out'); setTimeout(() => { if (win.isConnected && !win.querySelector('.menu-win')) win.remove(); }, 220); }
    if (!silent && st.opts.onClose) st.opts.onClose();
  }
  const memoryOpen = () => !!memState;

  /* ---------------- room tidy! ---------------- */
  function showComplete(ch, label, onNext) {
    const el = setScreen(
      '<div class="tidy-banner pop-in" style="--accent:' + ch.accent + '">' +
      '  <div class="big-title">' + (ch.id === 'youngadult' ? 'Home sweet home' : 'Room tidy!') + '</div>' +
      '  <div class="tidy-sub">' + esc(ch.title) + ' · ' + ch.year + ' · complete</div>' +
      '  <button class="aqua" id="nextBtn">' + esc(label) + '</button>' +
      '</div>', 'complete-screen');
    const b = el.querySelector('#nextBtn');
    b.disabled = true; setTimeout(() => { b.disabled = false; }, 900);
    b.addEventListener('click', () => { Sound.click(); onNext(); });
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
        '<div class="titlebar"><span>' + svg('floppy', 24) + ' Save to memory box (A:)</span></div>' +
        '<div class="keep-body">' +
        '  <p class="keep-lead">Pack a memory box for the next chapter. <b>Teddy always comes.</b> There’s room for ' + o.capacity + ' more things.</p>' +
        '  <div class="keep-row box-row"><div class="tile locked"><img src="' + o.thumb('teddy') + '" alt=""><span>Teddy' + (o.teddyLabel ? '<small>' + esc(o.teddyLabel) + '</small>' : '') + '</span><em>always</em></div>' + slots.join('') + '</div>' +
        '  <div class="keep-label">From this chapter: click to keep</div>' +
        '  <div class="keep-row">' + (fresh.length ? fresh.map(id => tile(id, 'out')).join('') : '<span class="keep-none">nothing left to choose</span>') + '</div>' +
        (goingAway.length ? '<div class="keep-label">Letting go: click to rescue</div><div class="keep-row">' + goingAway.map(id => tile(id, 'out gone', 'let go')).join('') + '</div>' : '') +
        '  <div class="keep-foot"><span>Things you don’t keep stay in this room’s past.</span><button class="aqua" id="keepDone">Save &amp; continue ▶︎</button></div>' +
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
    showHUD(false);
  }

  /* ---------------- thank-you note (after the last box, before the summary) ---------------- */
  // everything is readable straight away; the lines just settle in quickly one after another
  function showThanks(note, teddyThumb, onNext) {
    applyTheme(HOME_THEME);
    const lines = note.lines.map((t, i) => '<p class="tl" style="--d:' + (0.15 + i * 0.15).toFixed(2) + 's">' + esc(t) + '</p>').join('');
    const el = setScreen(
      '<div class="desk"></div>' +
      '<div class="win thanks-win pop-in">' +
      '  <div class="titlebar"><span>' + APP_ICON + 'Notepad · thank you</span></div>' +
      '  <div class="thanks-body">' +
      '    <h2 class="tl" style="--d:0s">' + esc(note.title) + '</h2>' + lines +
      '    <div class="thanks-foot tl" style="--d:' + (0.15 + note.lines.length * 0.15).toFixed(2) + 's">' +
      '      <img class="px" src="' + teddyThumb + '" alt="">' +
      '      <p class="thanks-sign">' + esc(note.sign) + ' ' + svg('heart', 22) + '</p>' +
      '      <button class="aqua" id="thanksNext">What she packed ▶︎</button>' +
      '    </div>' +
      '  </div>' +
      '</div>', 'thanks-screen');
    draggable(el.querySelector('.thanks-win'));
    el.querySelector('#thanksNext').addEventListener('click', e => { e.stopPropagation(); Sound.click(); onNext(); });
    Sound.page();
    showHUD(false); clearToasts();
  }

  /* ---------------- ending ---------------- */
  function showEnding(s, onReplay) {
    applyTheme(HOME_THEME);
    const tiles = (list, cls) => list.map(x => '<div class="tile mini ' + (cls || '') + '"><img src="' + s.thumb(x.id) + '" alt=""><span>' + esc(s.names(x.id)) + '</span>' + (x.label ? '<em>' + esc(x.label) + '</em>' : '') + '</div>').join('');
    const el = setScreen(
      '<div class="desk"></div>' +
      '<div class="win end-win pop-in">' +
      '  <div class="titlebar"><span>' + APP_ICON + 'The Next Chapter · complete</span></div>' +
      '  <div class="end-body">' +
      '    <div class="logo"><img class="brand-logo" src="assets/brand/logo-liner.svg" alt="The Next Chapter" style="width:532px;height:96px"></div>' +
      '    <p class="end-lead">She packed Teddy last. She always does.</p>' +
      '    <div class="end-cols">' +
      '      <div><div class="keep-label">Packed for uni</div><div class="keep-row">' + tiles(s.packed) + '</div></div>' +
      (s.letGo.length ? '<div><div class="keep-label">Let go along the way</div><div class="keep-row">' + tiles(s.letGo, 'gone') + '</div></div>' : '') +
      '    </div>' +
      (s.teddy ? '    <div class="teddy-row"><div class="keep-label">Teddy through<br>the years</div><div class="teddy-years">' + s.teddy.map(t => '<div class="ty"><img class="px" src="' + t.thumb + '" alt="" title="' + esc(t.label) + '"><span>' + t.year + '</span></div>').join('<i>›</i>') + '</div></div>' : '') +
      '    <p class="end-stat">memories found: ' + s.memSeen + ' / ' + s.memTotal + '</p>' +
      '    <div class="credits">' + s.credits.map(c => '<span><b>' + esc(c[0]) + '</b> · ' + esc(c[1]) + '</span>').join('') + '</div>' +
      '    <button class="aqua big" id="replayBtn">↺ Play again</button>' +
      '  </div>' +
      '</div>', 'end-screen');
    draggable(el.querySelector('.end-win'));
    el.querySelector('#replayBtn').addEventListener('click', () => { Sound.click(); onReplay(); });
    showHUD(false); clearToasts();
  }

  /* ---------------- pause menu ---------------- */
  function showMenu(h) {
    modal.innerHTML =
      '<div class="backdrop fade-in">' +
      '  <div class="win menu-win pop-in">' +
      '    <div class="titlebar"><span>' + APP_ICON + 'Menu</span><button class="tb-close" data-a="resume" aria-label="Close">✕</button></div>' +
      '    <div class="menu-body">' +
      '      <button class="aqua" data-a="resume">▶︎ Keep playing</button>' +
      '      <button class="aqua alt" data-a="restart">Restart chapter</button>' +
      '      <button class="aqua alt" data-a="title">Chapter select</button>' +
      '      <button class="aqua alt" data-a="door">Back to the door</button>' +
      '      <button class="aqua alt" data-a="sound">' + (Sound.isMuted() ? 'Sound: off' : 'Sound: on') + '</button>' +
      '      <p class="small">keys: Esc menu · M sound</p>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    draggable(modal.querySelector('.menu-win'));
    modal.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); Sound.click(); h(b.dataset.a); }));
    modal.querySelector('.backdrop').addEventListener('click', e => { if (e.target.classList.contains('backdrop')) h('resume'); });
  }
  function hideMenu() { if (!memState) modal.innerHTML = ''; }

  return {
    init, showTitle, showIntro, showHUD, setHUD, setHelper, hint, hideHint, toast, clearToasts,
    openMemory, closeMemory, memoryOpen, showComplete, showKeep, showThanks, showEnding, showMenu, hideMenu,
    clearScreen: () => setScreen(''), refreshMute
  };
})();
