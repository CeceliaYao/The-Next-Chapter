/* =========================================================
   ui.js — the Y2K "operating system" layered over the room:
   title screen, chapter cards, HUD, Mum's messenger pop-ups,
   the Memory Player (photos / videos), the memory box and
   the ending. Plain DOM + CSS, so it's easy to restyle.
   ========================================================= */
'use strict';

const UI = (() => {
  const $ = sel => document.querySelector(sel);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
    if (b) { b.textContent = Sound.isMuted() ? '♪̸' : '♪'; b.title = Sound.isMuted() ? 'Sound off' : 'Sound on'; b.classList.toggle('off', Sound.isMuted()); }
  }

  function setScreen(html, cls) {
    overlay.innerHTML = html ? '<div class="screen ' + (cls || '') + '">' + html + '</div>' : '';
    return overlay.firstElementChild;
  }

  /* ---------------- title ---------------- */
  function showTitle(chapters) {
    const discs = chapters.map((c, i) =>
      '<button class="disc" data-i="' + i + '" style="--accent:' + c.accent + '"><span class="disc-shine"></span><b>' + (i + 1) + '</b><small>' + c.year + '</small></button>').join('');
    const floaters = ['★', '♥', '✦', '☾', '✿', '★', '♥', '✦', '✧', '♡'].map((s, i) =>
      '<span class="floater" style="left:' + (5 + i * 9.5) + '%;animation-delay:' + (-i * 1.7) + 's;font-size:' + (18 + (i % 3) * 10) + 'px">' + s + '</span>').join('');
    const el = setScreen(
      '<div class="holo"></div><div class="floaters">' + floaters + '</div>' +
      '<div class="win title-win pop-in">' +
      '  <div class="titlebar"><span>✦ the_next_chapter.exe</span><span class="tb-dots"><i></i><i></i><i></i></span></div>' +
      '  <div class="win-body">' +
      '    <div class="logo"><span class="logo-small">the</span><span class="logo-big">Next Chapter</span></div>' +
      '    <p class="tagline">a little game about keeping up a room, and letting go</p>' +
      '    <button class="aqua big" id="startBtn">▶&nbsp; START</button>' +
      '    <div class="discs">' + discs + '</div>' +
      '    <p class="small">or pick a disc to jump to a chapter · best with sound on ♪</p>' +
      '  </div>' +
      '</div>' +
      '<div class="title-foot">KKB385 · A3 · an interactive room by Isabella, Lyebin, Chloee &amp; Cecelia</div>', 'title-screen');
    el.querySelector('#startBtn').addEventListener('click', () => H.onStart());
    el.querySelectorAll('.disc').forEach(b => b.addEventListener('click', () => H.onJump(+b.dataset.i)));
    showHUD(false); hideHint();
  }

  /* ---------------- chapter card ---------------- */
  function showIntro(ch, idx, onBegin) {
    const el = setScreen(
      '<div class="card pop-in" style="--accent:' + ch.accent + '">' +
      '  <div class="card-disc"><span>' + (idx + 1) + '</span></div>' +
      '  <div class="card-kicker">' + esc(ch.kicker) + '</div>' +
      '  <div class="card-title">' + esc(ch.title) + '</div>' +
      '  <div class="lcd">' + ch.year + '</div>' +
      '  <p class="card-text" id="typed"></p>' +
      '  <button class="aqua" id="beginBtn">' + (ch.moving ? 'Start packing ▶' : 'Open the box ▶') + '</button>' +
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
    $('#hudMem').textContent = '✦ ' + s.memSeen + '/' + s.memTotal;
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
    t.innerHTML = '<div class="toast-bar"><span class="buddy">' + (from === 'Mum' ? '♥' : '☺') + '</span> ' + esc(from) + ' says:<i>✕</i></div><div class="toast-text">' + esc(text) + '</div>';
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
          ? '<div class="cam"><span class="rec">● REC</span><span class="cam-mode">SP ▶</span><span class="stamp">' + stampFor(ch.year, seed) + '</span></div>'
          : '<span class="photo-stamp">' + stampFor(ch.year, seed) + '</span>') +
        '  <div class="missing hidden">placeholder · add <b>' + esc(mem.src) + '</b></div>' +
        '</div>' +
        (mem.type === 'video' ? '<div class="mem-controls"><button class="ctl" id="memPlay">❚❚</button><div class="seek"><i id="memSeek"></i></div><button class="ctl" id="memReplay">↺</button></div>' : '');
    } else {
      frame = '<div class="paper ' + (mem.type === 'letter' ? 'letter' : '') + '"><p id="memTyped"></p></div>';
    }
    modal.innerHTML =
      '<div class="backdrop fade-in">' +
      '  <div class="win mem-win pop-in" style="--accent:' + ch.accent + '">' +
      '    <div class="titlebar"><span>' + (mem.type === 'video' ? '▶ Memory Player 2000' : mem.type === 'photo' ? '✿ Photo Viewer' : '✎ Notepad') + ' — ' + esc(fileName) + '</span><button class="tb-close" id="memClose">✕</button></div>' +
      '    <div class="mem-body">' + frame +
      (isMedia ? '<div class="mem-caption">' + esc(mem.caption || '') + '</div>' : '') +
      '    </div>' +
      '    <div class="mem-foot">click anywhere to continue ✦</div>' +
      '  </div>' +
      '</div>';
    const back = modal.querySelector('.backdrop');
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
      modal.querySelector('.missing').classList.remove('hidden');
      opts.mountPlaceholder(host, mem);
      if (mem.type === 'video') fakePlayback();
    };
    if (mem.type === 'photo') {
      const img = new Image();
      img.alt = mem.caption || '';
      img.onload = () => { host.innerHTML = ''; host.appendChild(img); };
      img.onerror = showPlaceholder;
      img.src = mem.src;
    } else {
      const v = document.createElement('video');
      v.playsInline = true; v.preload = 'auto';
      v.addEventListener('error', showPlaceholder, { once: true });
      v.addEventListener('loadeddata', () => { host.innerHTML = ''; host.appendChild(v); const p = v.play(); if (p && p.catch) p.catch(() => setPlayIcon(false)); });
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
  function setPlayIcon(playing) { const b = document.getElementById('memPlay'); if (b) b.textContent = playing ? '❚❚' : '▶'; }

  /* placeholder "playback" for videos that haven't been added yet */
  function fakePlayback() {
    const dur = 7000;
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
    fakePlayback();
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
      '  <div class="tidy-title">' + (ch.id === 'youngadult' ? 'Home sweet home' : 'Room tidy!') + '</div>' +
      '  <div class="tidy-sub">' + esc(ch.title) + ' · ' + ch.year + ' ✦ complete</div>' +
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
        '<div class="titlebar"><span>💾 Save to Memory Box (A:)</span><span class="tb-dots"><i></i><i></i><i></i></span></div>' +
        '<div class="keep-body">' +
        '  <p class="keep-lead">Pack a memory box for the next chapter. <b>Teddy always comes.</b> There’s room for ' + o.capacity + ' more things.</p>' +
        '  <div class="keep-row box-row"><div class="tile locked"><img src="' + o.thumb('teddy') + '" alt=""><span>Teddy</span><em>always</em></div>' + slots.join('') + '</div>' +
        '  <div class="keep-label">From this chapter: click to keep</div>' +
        '  <div class="keep-row">' + (fresh.length ? fresh.map(id => tile(id, 'out')).join('') : '<span class="keep-none">nothing left to choose</span>') + '</div>' +
        (goingAway.length ? '<div class="keep-label">Letting go: click to rescue</div><div class="keep-row">' + goingAway.map(id => tile(id, 'out gone', 'let go')).join('') + '</div>' : '') +
        '  <div class="keep-foot"><span>Things you don’t keep stay in this room’s past.</span><button class="aqua" id="keepDone">Save &amp; continue ▶</button></div>' +
        '</div>';
      win.querySelectorAll('.tile.in').forEach(b => b.addEventListener('click', () => { Sound.back(); selected.splice(selected.indexOf(b.dataset.id), 1); render(); }));
      win.querySelectorAll('.tile.out').forEach(b => b.addEventListener('click', () => {
        if (selected.length >= o.capacity) { Sound.wrong(); win.querySelector('.box-row').classList.remove('shake'); void win.offsetWidth; win.querySelector('.box-row').classList.add('shake'); return; }
        Sound.pick(); selected.push(b.dataset.id); render();
      }));
      win.querySelector('#keepDone').addEventListener('click', () => { Sound.click(); o.onDone(selected.slice()); });
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
      '  <div class="titlebar"><span>✦ the_next_chapter.exe: complete</span><span class="tb-dots"><i></i><i></i><i></i></span></div>' +
      '  <div class="end-body">' +
      '    <div class="logo"><span class="logo-small">the</span><span class="logo-big">Next Chapter</span></div>' +
      '    <p class="end-lead">She packed Teddy last. She always does.</p>' +
      '    <div class="end-cols">' +
      '      <div><div class="keep-label">Packed for uni</div><div class="keep-row">' + tiles(s.packed) + '</div></div>' +
      (s.letGo.length ? '<div><div class="keep-label">Let go along the way</div><div class="keep-row">' + tiles(s.letGo, 'gone') + '</div></div>' : '') +
      '    </div>' +
      '    <p class="end-stat">memories found: ' + s.memSeen + ' / ' + s.memTotal + '</p>' +
      '    <div class="credits">' + s.credits.map(c => '<span><b>' + esc(c[0]) + '</b> · ' + esc(c[1]) + '</span>').join('') + '</div>' +
      '    <button class="aqua big" id="replayBtn">↺ Play again</button>' +
      '  </div>' +
      '</div>', 'end-screen');
    el.querySelector('#replayBtn').addEventListener('click', () => { Sound.click(); onReplay(); });
    showHUD(false); hideHint(); clearToasts();
  }

  /* ---------------- pause menu ---------------- */
  function showMenu(h) {
    modal.innerHTML =
      '<div class="backdrop fade-in">' +
      '  <div class="win menu-win pop-in">' +
      '    <div class="titlebar"><span>★ menu</span><button class="tb-close" data-a="resume">✕</button></div>' +
      '    <div class="menu-body">' +
      '      <button class="aqua" data-a="resume">▶ Keep playing</button>' +
      '      <button class="aqua alt" data-a="restart">↺ Restart this chapter</button>' +
      '      <button class="aqua alt" data-a="title">⌂ Chapter select</button>' +
      '      <button class="aqua alt" data-a="sound">' + (Sound.isMuted() ? '♪ Sound: off' : '♪ Sound: on') + '</button>' +
      '      <button class="aqua alt" data-a="fullscreen">⛶ Fullscreen</button>' +
      '      <p class="small">keys: Esc menu · M sound · F fullscreen</p>' +
      '    </div>' +
      '  </div>' +
      '</div>';
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
