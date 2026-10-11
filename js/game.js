/* =========================================================
   game.js — the p5 sketch: game states, drag & drop,
   placement rules, juice (pops, sparkles, wiggles) and the
   chapter-to-chapter memory box.
   ========================================================= */
'use strict';

const W = 1280, H = 720;
const TRAY = { x: 20, y: 576, w: 1240, h: 136 };
const PAD = 14;

const G = {
  state: 'boot', modal: null, idx: 0, ch: null,
  items: [], drag: null, press: null, hover: null,
  pointer: { x: -99, y: -99 },
  particles: [], timers: [], queue: [], running: false,
  time: 0, lastInput: performance.now(), lastProgress: performance.now(), lastHelp: 0, helpFlash: null,
  memoryBox: ['teddy'], since: { teddy: 0 }, letGo: [], seen: new Set(), fired: new Set(), everTidy: new Set(),
  yaLayout: null, packed: [], boxClose: 0, gift: false, memPH: null
};

let canvasEl, bgImg = null, bgFor = null, spriteCache = {}, thumbCache = {}, memG = null;

/* ================= p5 lifecycle ================= */

function setup() {
  const c = createCanvas(W, H);
  c.parent('stage');
  canvasEl = c.elt;
  canvasEl.id = 'game';
  canvasEl.style.touchAction = 'none';
  frameRate(60);
  fitStage();
  window.addEventListener('resize', fitStage);
  initInput();
  UI.init({ onStart: startRun, onJump: jumpTo, onMenu: openMenu, onMute: toggleMute, onActivity: () => { G.lastInput = performance.now(); } });
  noLoop();
  const fonts = ['16px "Sniglet"', '800 16px "Sniglet"', '16px "Rubik Bubbles"', '16px "VT323"'].map(f => document.fonts.load(f).catch(() => null));
  Promise.race([Promise.all(fonts), new Promise(r => setTimeout(r, 2500))]).then(() => { clearCaches(); goTitle(); loop(); });
}

function draw() {
  update(Math.min(50, deltaTime || 16.7));
  render();
}

function fitStage() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  document.documentElement.style.setProperty('--s', s);
  const pd = Math.min(3, Math.max(1, Math.round(s * (window.devicePixelRatio || 1) * 4) / 4));
  if (pd !== pixelDensity()) { pixelDensity(pd); clearCaches(); }
}

function dropGraphics(g) {
  try { g.remove(); } catch (e) { if (g.elt && g.elt.parentNode) g.elt.parentNode.removeChild(g.elt); }
}

function clearCaches() {
  Object.values(spriteCache).forEach(dropGraphics);
  spriteCache = {}; bgImg = null; bgFor = null;
}

/* ================= flow ================= */

function resetRun() {
  G.memoryBox = ['teddy']; G.since = { teddy: 0 }; G.letGo = []; G.seen = new Set(); G.yaLayout = null;
}

function goTitle() {
  UI.closeMemory(true); G.modal = null; G.memPH = null;
  Sound.stopAmbience(); UI.clearToasts();
  setupChapter(0);
  autoTidy();
  G.state = 'title';
  setBlur(true);
  UI.showTitle(CHAPTERS);
}

function startRun() { Sound.init(); Sound.click(); resetRun(); goChapter(0); }

function jumpTo(i) { Sound.init(); Sound.click(); resetRun(); goChapter(i); }

function goChapter(i) {
  UI.closeMemory(true); G.modal = null;
  setupChapter(i);
  G.state = 'intro';
  setBlur(true);
  Sound.stopAmbience();
  UI.clearToasts();
  UI.showIntro(G.ch, i, beginChapter);
}

function beginChapter() {
  G.state = 'play';
  UI.clearScreen();
  setBlur(false);
  UI.showHUD(true);
  updateHUD();
  UI.hint(G.ch.tip, { ms: 9000 });
  Sound.startAmbience(G.ch.ambience);
  G.lastProgress = performance.now();
  const start = G.ch.onStart.slice();
  if (G.gift) start.push({ do: 'wait', ms: 2600 }, { do: 'toast', from: 'Mum', text: 'Left a copy of the family photo on your bed for you. For your new place ♥' });
  enqueue(start);
}

function setupChapter(i) {
  G.idx = i; G.ch = CHAPTERS[i];
  G.items = []; G.particles = []; G.queue = []; G.running = false; G.timers = [];
  G.fired = new Set(); G.everTidy = new Set(); G.drag = null; G.press = null; G.hover = null;
  G.boxClose = 0; G.packed = []; G.gift = false; G.helpFlash = null;
  const ch = G.ch;
  if (ch.moving) buildMovingOut();
  else {
    let order = 0;
    const carried = i === 0 ? [] : G.memoryBox.filter(id => !ch.tray.includes(id));
    carried.forEach(id => G.items.push(makeItem(id, { carried: true, order: order++ })));
    ch.tray.forEach(id => G.items.push(makeItem(id, { order: order++ })));
    ch.mess.forEach(m => {
      const it = makeItem(m.id, {});
      it.state = 'placed'; it.mess = true; it.x = m.x; it.y = m.y; it.rot = m.rot || 0;
      it.surface = m.surface || surfaceUnder(it);
      G.items.push(it);
    });
  }
  layoutTray(true);
  bgImg = null;
}

function makeItem(id, o) {
  const def = ITEM_DEFS[id];
  let fits = def.fits.slice();
  if (o.carried) CARRY_FITS.forEach(f => { if (!fits.includes(f)) fits.push(f); });
  if (G.ch && G.ch.moving) fits = fits.concat(CARRY_FITS, ['box']);
  return {
    id, def, w: def.w, h: def.h, fits, carried: !!o.carried, order: o.order || 0,
    x: 640, y: 646, ox: 0, oy: 0, rot: 0, scale: 1, trayScale: 1, sx: 1, sy: 1, alpha: 1,
    state: 'tray', surface: null, mess: false, tw: null, wig: 0, hop: 0, vx: 0
  };
}

function buildMovingOut() {
  const layout = G.yaLayout || autoLayoutYoungAdult();
  const extras = G.ch.extras.slice();
  if (!layout.some(p => p.id === 'familyphoto')) { extras.push({ id: 'familyphoto', surface: 'bed', x: 430 }); G.gift = true; }
  // the letter and the packed-up things go down first, then the rest of the room shuffles around them
  const put = (it, sid, x, y) => {
    let s = surfaceById(sid);
    let pos = s && computePlacement(it, s, x, y, G.items);
    if (!pos) { s = surfaceById('floor'); pos = computePlacement(it, s, x, 540, G.items) || { x: 300, y: 540 - it.h / 2 }; }
    Object.assign(it, { state: 'placed', surface: s.id, x: pos.x, y: pos.y });
    G.items.push(it);
  };
  extras.forEach(e => { const it = makeItem(e.id, {}); put(it, e.surface, e.x, surfaceById(e.surface).y || 0); });
  layout.forEach(p => put(makeItem(p.id, { carried: true }), p.surface, p.x, p.y));
}

/* Lay the young-adult room out automatically (used when someone jumps straight to chapter 6). */
function autoLayoutYoungAdult() {
  const keep = { ch: G.ch, items: G.items, idx: G.idx };
  G.ch = CHAPTERS[4];
  G.items = ['teddy'].concat(CHAPTERS[4].tray).map(id => makeItem(id, { carried: id === 'teddy' }));
  autoTidy();
  const out = G.items.map(it => ({ id: it.id, surface: it.surface, x: it.x, y: it.y }));
  G.ch = keep.ch; G.items = keep.items; G.idx = keep.idx;
  return out;
}

/* Put every item in its first legal spot. Used for the title backdrop and the debug skip key. */
function autoTidy() {
  G.items.forEach(it => {
    if (it.state === 'binned' || (it.state === 'placed' && !it.mess)) return;
    for (const tag of it.fits) {
      if (tag === 'box') continue;
      const surfs = G.ch.surfaces.filter(s => s.tag === tag);
      for (const s of surfs) {
        const cx = s.type === 'spot' ? s.x : (s.x1 + s.x2) / 2;
        const cy = s.type === 'spot' ? s.y : (s.y != null ? s.y : (s.y1 + s.y2) / 2);
        const pos = computePlacement(it, s, cx, cy, G.items);
        if (pos) {
          Object.assign(it, { state: pos.bin ? 'binned' : 'placed', surface: s.id, x: pos.x, y: pos.y, ox: 0, oy: 0, rot: 0, scale: 1, mess: false, alpha: pos.bin ? 0 : 1 });
          return;
        }
      }
    }
  });
}

function completeChapter() {
  G.state = 'complete';
  if (G.ch.id === 'youngadult') G.yaLayout = G.items.filter(i => i.state === 'placed').map(i => ({ id: i.id, surface: i.surface, x: i.x, y: i.y }));
  Sound.complete();
  confetti(70);
  UI.hideHint();
  const last = G.idx >= CHAPTERS.length - 2;
  addTimer(1300, () => {
    if (G.state !== 'complete') return;
    UI.showHUD(false);
    UI.showComplete(G.ch, (G.ch.noKeep || last) ? 'Next chapter ▶' : 'Pack the memory box ▶', () => {
      if (G.ch.noKeep || last) goChapter(G.idx + 1);
      else showKeep();
    });
  });
}

function showKeep() {
  G.state = 'keep';
  setBlur(true);
  const box = G.memoryBox.filter(id => id !== 'teddy');
  const seen = new Set();
  const candidates = G.items.map(i => i.id).filter(id => {
    if (id === 'teddy' || box.includes(id) || seen.has(id) || ITEM_DEFS[id].keep === false) return false;
    seen.add(id); return true;
  });
  UI.showKeep({
    chapter: G.ch, candidates, box, capacity: MEMORY_BOX_SIZE,
    thumb: getThumb, names: id => ITEM_DEFS[id].name,
    sinceLabel: id => 'since ' + CHAPTERS[G.since[id] || 0].year,
    onDone: sel => {
      box.filter(id => !sel.includes(id)).forEach(id => G.letGo.push({ id, year: G.ch.year }));
      sel.forEach(id => { if (G.since[id] == null) G.since[id] = G.idx; });
      G.memoryBox = ['teddy'].concat(sel);
      goChapter(G.idx + 1);
    }
  });
}

function goEnding() {
  G.state = 'ending';
  Sound.stopAmbience();
  setBlur(true);
  confetti(90);
  const yearOf = id => {
    if (G.since[id] != null) return CHAPTERS[G.since[id]].year;
    const c = CHAPTERS.find(ch => ch.tray.includes(id) || ch.mess.some(m => m.id === id) || (ch.extras || []).some(e => e.id === id));
    return c ? c.year : 2018;
  };
  const packed = G.packed.map(id => ({ id, label: (id === 'familyphoto' && G.gift) ? 'from Mum' : 'since ' + yearOf(id) }));
  const memTotal = CHAPTERS.reduce((n, c) => n + c.memories.length, 0);
  UI.showEnding({
    packed, letGo: G.letGo.map(l => ({ id: l.id, label: 'let go ' + l.year })),
    memSeen: G.seen.size, memTotal, credits: CREDITS, thumb: getThumb, names: id => ITEM_DEFS[id].name
  }, goTitle);
}

function setBlur(on) { if (canvasEl) canvasEl.classList.toggle('blur', on); }

/* ================= action queue (toasts, memories, scripted moments) ================= */

function enqueue(acts) { G.queue.push(...acts); runQueue(); }

function runQueue() {
  if (G.running) return;
  const a = G.queue.shift();
  if (!a) return;
  G.running = true;
  const idxAtStart = G.idx;
  doAction(a, () => { if (G.idx !== idxAtStart) return; G.running = false; runQueue(); });
}

function doAction(a, done) {
  switch (a.do) {
    case 'wait': addTimer(a.ms, done); break;
    case 'toast': UI.toast(a.from, a.text, a.nudge); done(); break;
    case 'memory':
      if (G.modal) { addTimer(250, () => doAction(a, done)); break; }
      openMemory(a.id, done); break;
    case 'spawnMess': spawnMess(a, done); break;
    case 'closeBox':
      G.state = 'finale'; Sound.boxClose();
      tweenValue('boxClose', 0, 1, 700, () => { Sound.sparkle(); burst(640, 600, 18, 70); done(); });
      break;
    case 'ending': goEnding(); done(); break;
    case 'check': checkComplete(); done(); break;
    default: done();
  }
}

function addTimer(ms, fn) { G.timers.push({ at: G.time + ms, fn }); }

let valueTweens = [];
function tweenValue(key, from, to, dur, done) {
  G[key] = from;
  valueTweens.push({ key, from, to, t: 0, dur, done });
}

function spawnMess(a, done) {
  let it = G.items.find(i => i.id === a.id);
  if (!it) { it = makeItem(a.id, {}); G.items.push(it); }
  Object.assign(it, { state: 'placed', mess: true, x: a.x, y: a.y, rot: a.rot || 0, alpha: 1, scale: 1 });
  it.surface = surfaceUnder(it);
  it.ox = a.fromX - a.x; it.oy = a.fromY - a.y;
  it.tw = { from: { ox: it.ox, oy: it.oy, rot: -2 }, to: { ox: 0, oy: 0, rot: a.rot || 0 }, t: 0, dur: 650, ease: easeOutCubic, arc: 120, done: () => { it.sx = 1.25; it.sy = 0.75; Sound.wrong(); burst(it.x, it.y + it.h / 2, 8, 30); done(); } };
  updateHUD();
}

function openMemory(id, done) {
  const mem = G.ch.memories.find(m => m.id === id);
  if (!mem) { done && done(); return; }
  G.seen.add(mem.id);
  G.modal = 'memory';
  Sound.stopAmbience();
  UI.openMemory(mem, G.ch, {
    mountPlaceholder: mountPlaceholder, unmountPlaceholder: unmountPlaceholder,
    onClose: () => {
      G.modal = null; G.lastInput = performance.now(); G.lastProgress = performance.now();
      updateHUD();
      if (G.state === 'play') Sound.startAmbience(G.ch.ambience);
      done && done();
    }
  });
  updateHUD();
}

function memoryFor(itemId) { return G.ch.memories.find(m => m.items.includes(itemId)); }

/* ================= placement rules ================= */

function surfaceById(id) { return G.ch.surfaces.find(s => s.id === id); }

function surfaceUnder(it) {
  const by = it.y + it.h / 2;
  const s = G.ch.surfaces.find(s => s.type === 'area' && it.x >= s.x1 && it.x <= s.x2 && by >= s.y1 - 4 && by <= s.y2 + 4);
  return s ? s.id : null;
}

function zoneOf(s) {
  switch (s.type) {
    case 'line': return { x1: s.x1 - 10, x2: s.x2 + 10, y1: s.y - 110, y2: s.y + 30 };
    case 'hang': return { x1: s.x1 - 10, x2: s.x2 + 10, y1: s.y - 30, y2: s.y + 120 };
    case 'area': return { x1: s.x1, x2: s.x2, y1: s.y1 - 70, y2: s.y2 + 24 };
    case 'spot': return { x1: s.x - s.r, x2: s.x + s.r, y1: s.y - s.r, y2: s.y + s.r };
    case 'bin': return { x1: s.x1 - 22, x2: s.x2 + 22, y1: s.y1 - 22, y2: s.y2 + 22 };
    default: return { x1: s.x1 - 10, x2: s.x2 + 10, y1: s.y1 - 10, y2: s.y2 + 10 };
  }
}

const binCount = (sid, list) => list.filter(i => i.state === 'binned' && i.surface === sid).length;

function overlaps(ax, ay, aw, ah, bx, by, bw, bh) { return Math.abs(ax - bx) * 2 < aw + bw && Math.abs(ay - by) * 2 < ah + bh; }

function computePlacement(it, s, cx, cy, list) {
  if (!s) return null;
  const w = it.w, h = it.h;
  if (s.type === 'bin') {
    if (s.capacity) {
      const cap = it.id === 'teddy' ? s.capacity : s.capacity - 1;
      if (binCount(s.id, list) >= cap) return null;
    }
    return { x: (s.x1 + s.x2) / 2, y: (s.y1 + s.y2) / 2, bin: true };
  }
  if (s.type === 'spot') {
    if (list.some(o => o !== it && o.state === 'placed' && o.surface === s.id)) return null;
    return { x: s.x, y: s.y };
  }
  if (s.maxH && h > s.maxH) return null;
  let xmin, xmax, ymin, ymax;
  if (s.type === 'line') { ymin = ymax = s.y - h / 2; xmin = s.x1 + w / 2; xmax = s.x2 - w / 2; }
  else if (s.type === 'hang') { ymin = ymax = s.y + h / 2; xmin = s.x1 + w / 2; xmax = s.x2 - w / 2; }
  else if (s.type === 'wall') { xmin = s.x1 + w / 2; xmax = s.x2 - w / 2; ymin = s.y1 + h / 2; ymax = s.y2 - h / 2; }
  else { xmin = s.x1 + w / 2; xmax = s.x2 - w / 2; ymin = s.y1 - h / 2; ymax = s.y2 - h / 2; }
  if (xmin > xmax) xmin = xmax = (s.x1 + s.x2) / 2;
  if (ymin > ymax) ymin = ymax = (ymin + ymax) / 2;
  const x = constrain(cx, xmin, xmax), y = constrain(cy, ymin, ymax);
  const k = s.type === 'area' ? 0.6 : s.type === 'line' ? 0.78 : 0.84;
  const others = list.filter(o => o !== it && o.state === 'placed' && o.surface === s.id);
  const free = (px, py) => !others.some(o => overlaps(px, py, w * k, h * k, o.x, o.y, o.w * k, o.h * k));
  if (free(x, y)) return { x, y };
  for (let d = 4; d < 760; d += 4) {
    for (const sg of [1, -1]) {
      const nx = constrain(x + sg * d, xmin, xmax);
      if (free(nx, y)) return { x: nx, y };
      if (ymax > ymin) { const ny = constrain(y + sg * d, ymin, ymax); if (free(x, ny)) return { x, y: ny }; }
    }
  }
  return null;
}

/* Which surface would this item land on if dropped at (px,py)? */
function findTarget(it, px, py) {
  let best = null, bestD = Infinity, wrong = null, full = null;
  for (const s of G.ch.surfaces) {
    const z = zoneOf(s);
    if (px < z.x1 || px > z.x2 || py < z.y1 || py > z.y2) continue;
    if (!it.fits.includes(s.tag)) { if (!wrong || wrong.type === 'area') wrong = s; continue; }
    const pos = computePlacement(it, s, px, py, G.items);
    if (!pos) { full = s; continue; }
    const d = Math.hypot(pos.x - px, pos.y - py) - ((s.type === 'bin' || s.type === 'spot') ? 1000 : 0);
    if (d < bestD) { bestD = d; best = { surf: s, pos }; }
  }
  if (best) return best;
  if (full) return { full };
  if (wrong) return { wrong };
  return null;
}

const isTidy = it => it.state === 'binned' || (it.state === 'placed' && !it.mess);
const tidyCount = () => G.items.filter(isTidy).length;

function checkComplete() {
  if (G.state !== 'play' || G.ch.moving) return;
  if (G.items.every(isTidy)) completeChapter();
}

function checkEvents(acts) {
  G.ch.events.forEach((ev, i) => {
    if (G.fired.has(i)) return;
    const w = ev.when;
    let ok = false;
    if (w.type === 'binCount') ok = binCount(w.surface, G.items) >= w.count;
    if (w.type === 'binned') ok = G.items.some(it => it.id === w.item && it.state === 'binned' && it.surface === w.surface);
    if (ok) { G.fired.add(i); acts.push(...ev.actions); }
  });
}

/* ================= input ================= */

function toWorld(e) {
  const r = canvasEl.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}

function initInput() {
  canvasEl.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  window.addEventListener('keydown', onKey);
  ['pointerdown', 'keydown', 'wheel'].forEach(ev => window.addEventListener(ev, () => { G.lastInput = performance.now(); Sound.init(); }, true));
}

const canInteract = () => G.state === 'play' && !G.modal;

function onDown(e) {
  G.lastInput = performance.now();
  const p = toWorld(e); G.pointer = p;
  if (!canInteract()) return;
  const it = itemAt(p.x, p.y);
  if (!it) return;
  e.preventDefault();
  try { canvasEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  G.press = { item: it, sx: p.x, sy: p.y, t: G.time };
}

function onMove(e) {
  const p = toWorld(e); G.pointer = p;
  if (G.press && !G.drag && canInteract() && Math.hypot(p.x - G.press.sx, p.y - G.press.sy) > 6) startDrag(G.press.item, p);
  if (G.drag) {
    G.lastInput = performance.now();
    G.drag.tx = p.x + G.drag.offX; G.drag.ty = p.y + G.drag.offY;
  }
}

function onUp(e) {
  const p = toWorld(e); G.pointer = p;
  if (G.drag) drop();
  else if (G.press && canInteract()) clickItem(G.press.item);
  G.press = null;
}

function onKey(e) {
  const k = e.key;
  if (UI.memoryOpen()) {
    if (k === 'Escape' || k === 'Enter' || k === ' ') { e.preventDefault(); UI.closeMemory(); }
    return;
  }
  if (k === 'Escape') { if (G.modal === 'menu') closeMenu(); else if (G.state === 'play') openMenu(); }
  else if (k === 'm' || k === 'M') toggleMute();
  else if (k === 'f' || k === 'F') toggleFullscreen();
  else if (k === 'N' && e.shiftKey && G.state === 'play' && !G.modal) debugSkip();
  else if (k === 'Enter') { const b = document.querySelector('#beginBtn, #nextBtn, #keepDone, #startBtn'); if (b && !b.disabled) b.click(); }
}

function itemAt(px, py) {
  const list = drawList();
  for (let i = list.length - 1; i >= 0; i--) {
    const it = list[i];
    if (it.state === 'binned' || it.tw) continue;
    const s = it.state === 'tray' ? it.trayScale : 1;
    const hw = it.w * s / 2 + 6, hh = it.h * s / 2 + 6;
    if (Math.abs(px - (it.x + it.ox)) < hw && Math.abs(py - (it.y + it.oy)) < hh) return it;
  }
  return null;
}

/* Anti-softlock: if every spot this item fits is full, let it go on any shelf / desk / bed / floor. */
function hasRoom(it) {
  return G.ch.surfaces.some(s => it.fits.includes(s.tag) && computePlacement(it, s, s.type === 'spot' ? s.x : (s.x1 + s.x2) / 2, s.y != null ? s.y : (s.y1 + s.y2) / 2, G.items));
}

function startDrag(it, p) {
  G.press = null;
  if (!G.ch.moving && !hasRoom(it)) {
    CARRY_FITS.forEach(f => { if (!it.fits.includes(f)) it.fits.push(f); });
    addTimer(200, () => UI.hint('It’s getting crowded! ' + it.def.name + ' can go anywhere for now.', { ms: 4500 }));
  }
  const fromTray = it.state === 'tray';
  G.drag = {
    item: it,
    home: { state: it.state, x: it.x, y: it.y, surface: it.surface, rot: it.rot, mess: it.mess },
    offX: fromTray ? 0 : (it.x + it.ox) - p.x, offY: fromTray ? 0 : (it.y + it.oy) - p.y,
    tx: p.x, ty: p.y, target: null
  };
  if (fromTray) { it.scale = it.trayScale; }
  it.x += it.ox; it.y += it.oy; it.ox = it.oy = 0;
  it.state = 'drag'; it.surface = null; it.tw = null;
  it.sx = 0.85; it.sy = 1.15;
  Sound.pick();
  UI.hideHint();
  G.helpFlash = null;
}

function drop() {
  const d = G.drag; G.drag = null;
  const it = d.item;
  const overTray = !G.ch.moving && G.pointer.y > TRAY.y - 4;
  if (overTray) {
    if (d.home.state === 'tray' || !d.home.mess) { toTray(it); return; }
  }
  const t = findTarget(it, d.tx, d.ty);
  if (t && t.surf) { place(it, t.surf, t.pos); return; }
  if (t || d.ty < 566) {
    it.wig = 1; Sound.wrong();
    let msg = it.def.hint || 'Hmm, not there.';
    if (t && t.full) msg = (t.full.id === 'box') ? 'The box is nearly full. Only room for Teddy now!' : 'No room there. Try another spot!';
    UI.hint(msg, { pulse: true, ms: 4500 });
  } else Sound.back();
  flyBack(it, d.home);
}

function toTray(it) {
  it.state = 'tray'; it.surface = null; it.mess = false; it.rot = 0;
  it.order = Math.max(0, ...G.items.map(i => i.order)) + 1;
  Sound.back();
  layoutTray(false);
  updateHUD();
}

function flyBack(it, home) {
  if (home.state === 'tray') { it.state = 'tray'; layoutTray(false); return; }
  const fromX = it.x, fromY = it.y;
  Object.assign(it, { state: 'placed', x: home.x, y: home.y, surface: home.surface, mess: home.mess });
  it.ox = fromX - home.x; it.oy = fromY - home.y;
  it.tw = { from: { ox: it.ox, oy: it.oy, rot: it.rot }, to: { ox: 0, oy: 0, rot: home.rot }, t: 0, dur: 260, ease: easeOutCubic };
}

function place(it, s, pos) {
  const fromX = it.x, fromY = it.y;
  it.x = pos.x; it.y = pos.y; it.surface = s.id; it.mess = false;
  it.ox = fromX - pos.x; it.oy = fromY - pos.y;
  if (pos.bin) {
    it.state = 'binned';
    if (s.id === 'box') G.packed.push(it.id);
    it.tw = { from: { ox: it.ox, oy: it.oy, scale: it.scale, alpha: 1, rot: it.rot }, to: { ox: 0, oy: 10, scale: 0.25, alpha: 0, rot: it.rot + 1.2 }, t: 0, dur: 300, ease: easeInCubic, done: () => { burst(pos.x, s.y1 + 20, 10, 50); } };
    Sound.bin();
  } else {
    it.state = 'placed';
    it.tw = { from: { ox: it.ox, oy: it.oy, rot: it.rot }, to: { ox: 0, oy: 0, rot: 0 }, t: 0, dur: 170, ease: easeOutBack, done: () => { it.sx = 1.22; it.sy = 0.8; burst(it.x, it.y + it.h / 2 - 4, 9, 36); } };
    Sound.place(tidyCount() / Math.max(1, G.items.length));
  }
  afterPlace(it);
}

function afterPlace(it) {
  G.lastProgress = performance.now();
  updateHUD();
  const acts = [];
  const mem = memoryFor(it.id);
  if (mem && !G.seen.has(mem.id)) acts.push({ do: 'wait', ms: 320 }, { do: 'memory', id: mem.id });
  if (!G.everTidy.has(it.id) && G.ch.onPlace[it.id]) acts.push(...G.ch.onPlace[it.id]);
  G.everTidy.add(it.id);
  checkEvents(acts);
  acts.push({ do: 'check' });
  enqueue(acts);
}

function clickItem(it) {
  if (it.state === 'placed' && !it.mess) {
    const mem = memoryFor(it.id);
    if (mem && !G.modal) { Sound.click(); openMemory(mem.id); return; }
  }
  it.sx = 1.15; it.sy = 0.88; it.hop = 0.6;
  Sound.click();
  if (it.state === 'tray' || it.mess) UI.hint(it.def.hint, { ms: 4000 });
}

function debugSkip() {
  if (G.ch.moving) {
    const teddy = G.items.find(i => i.id === 'teddy');
    const box = surfaceById('box');
    if (teddy && teddy.state !== 'binned') place(teddy, box, computePlacement(teddy, box, 0, 0, G.items));
    return;
  }
  autoTidy();
  layoutTray(false);
  updateHUD();
  checkComplete();
}

/* ================= menu / settings ================= */

function openMenu() {
  if (G.state !== 'play' || G.modal) return;
  G.modal = 'menu';
  UI.showMenu(a => {
    if (a === 'resume') closeMenu();
    if (a === 'restart') { closeMenu(); setupChapter(G.idx); beginChapter(); }
    if (a === 'title') { closeMenu(); goTitle(); }
    if (a === 'sound') { toggleMute(); G.modal = null; openMenu(); }
    if (a === 'fullscreen') { toggleFullscreen(); }
  });
}
function closeMenu() { G.modal = null; UI.hideMenu(); }

function toggleMute() {
  Sound.init();
  Sound.toggle();
  UI.refreshMute();
  if (!Sound.isMuted() && G.state === 'play' && !G.modal) Sound.startAmbience(G.ch.ambience);
}

function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  } catch (e) { /* not allowed here */ }
}

function updateHUD() {
  if (!G.ch) return;
  const ch = G.ch;
  UI.setHUD({
    kicker: ch.kicker, title: ch.title, year: ch.year, moving: !!ch.moving,
    tidy: tidyCount(), total: G.items.length, packed: G.packed.length,
    memSeen: ch.memories.filter(m => G.seen.has(m.id)).length, memTotal: ch.memories.length
  });
}

/* ================= update ================= */

const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInCubic = t => t * t * t;

function update(dt) {
  G.time += dt;
  const k = n => Math.pow(n, dt / 16.7);

  // timers
  if (G.timers.length) {
    const due = G.timers.filter(t => t.at <= G.time);
    G.timers = G.timers.filter(t => t.at > G.time);
    due.forEach(t => t.fn());
  }
  valueTweens = valueTweens.filter(v => {
    v.t += dt; const p = Math.min(1, v.t / v.dur);
    G[v.key] = v.from + (v.to - v.from) * easeOutCubic(p);
    if (p >= 1) { v.done && v.done(); return false; }
    return true;
  });

  layoutTray(false);

  for (const it of G.items) {
    if (it.tw) {
      const tw = it.tw; tw.t += dt;
      const p = Math.min(1, tw.t / tw.dur), e = tw.ease(p);
      for (const key in tw.to) it[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * e;
      if (tw.arc) it.oy -= Math.sin(p * Math.PI) * tw.arc;
      if (p >= 1) { it.tw = null; tw.done && tw.done(); }
    } else if (it.state === 'tray') {
      it.ox *= k(0.78); it.oy *= k(0.78);
      it.scale += (it.trayScale - it.scale) * (1 - k(0.75));
      it.rot *= k(0.8);
    } else if (it.state === 'drag' && G.drag) {
      const nx = it.x + (G.drag.tx - it.x) * (1 - k(0.55));
      const ny = it.y + (G.drag.ty - it.y) * (1 - k(0.55));
      it.vx = (nx - it.x) / dt;
      it.x = nx; it.y = ny;
      it.rot += (constrain(it.vx * 0.12, -0.35, 0.35) - it.rot) * (1 - k(0.8));
      it.scale += (1.08 - it.scale) * (1 - k(0.7));
    } else if (it.state === 'placed') {
      it.scale += (1 - it.scale) * (1 - k(0.75));
    }
    it.sx += (1 - it.sx) * (1 - k(0.78)); it.sy += (1 - it.sy) * (1 - k(0.78));
    it.wig *= k(0.94); it.hop *= k(0.975);
  }

  if (G.drag) G.drag.target = findTarget(G.drag.item, G.drag.tx, G.drag.ty);

  G.particles = G.particles.filter(p => {
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.r += p.vr * dt;
    return p.life > 0;
  });

  // hover
  G.hover = (canInteract() && !G.drag) ? itemAt(G.pointer.x, G.pointer.y) : null;
  if (canvasEl) canvasEl.style.cursor = G.drag ? 'grabbing' : G.hover ? 'grab' : 'default';

  const now = performance.now();
  if (G.state !== 'title' && G.state !== 'boot' && now - G.lastInput > IDLE_RESET_MS) goTitle();
  if (canInteract() && !G.drag && !G.running && now - G.lastProgress > 15000 && now - G.lastHelp > 15000) showHelp();
}

function showHelp() {
  G.lastHelp = performance.now();
  const it = G.items.filter(i => i.state === 'tray' || (i.state === 'placed' && i.mess)).sort((a, b) => (b.mess - a.mess) || (a.order - b.order))[0]
    || (G.ch.moving ? G.items.find(i => i.id === 'teddy') : null);
  if (!it) return;
  it.hop = 1;
  G.helpFlash = { item: it, until: G.time + 3200 };
  UI.hint(G.ch.moving ? 'Drag things into the box at the bottom. Teddy goes in last.' : (it.def.name + ': ' + it.def.hint), { pulse: true, ms: 6000 });
}

function layoutTray(snap) {
  if (G.ch && G.ch.moving) return;
  const list = G.items.filter(i => i.state === 'tray').sort((a, b) => a.order - b.order);
  const n = list.length;
  if (!n) return;
  const slotW = Math.min(150, (TRAY.w - 170) / n);
  const x0 = 640 + 60 - (n * slotW) / 2 + slotW / 2;
  list.forEach((it, i) => {
    const tx = x0 + i * slotW, ty = TRAY.y + TRAY.h / 2 + 6;
    it.trayScale = Math.min(1, (slotW - 16) / it.w, 100 / it.h);
    if (snap) { it.x = tx; it.y = ty; it.ox = it.oy = 0; it.scale = it.trayScale; return; }
    if (it.x !== tx || it.y !== ty) { it.ox += it.x - tx; it.oy += it.y - ty; it.x = tx; it.y = ty; }
  });
}

/* ================= particles ================= */

const SPARK_COLS = ['#ff5fb8', '#ffd35c', '#86f0e6', '#c7a8ff', '#ffffff', '#9fdcff'];

function burst(x, y, n, spread) {
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4, sp = 0.08 + Math.random() * 0.18;
    G.particles.push({ x: x + (Math.random() - 0.5) * spread, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.0004, life: 500 + Math.random() * 300, max: 800, size: 5 + Math.random() * 6, col: SPARK_COLS[i % SPARK_COLS.length], kind: 'star', r: 0, vr: (Math.random() - 0.5) * 0.01 });
  }
}

function confetti(n) {
  for (let i = 0; i < n; i++) {
    G.particles.push({ x: Math.random() * W, y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 0.08, vy: 0.08 + Math.random() * 0.12, g: 0.00008, life: 3200 + Math.random() * 1500, max: 4700, size: 6 + Math.random() * 8, col: SPARK_COLS[i % SPARK_COLS.length], kind: ['star', 'heart', 'chip'][i % 3], r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.008 });
  }
}

/* ================= rendering ================= */

function buildBg() {
  if (bgImg) dropGraphics(bgImg);
  bgImg = createGraphics(W, H);
  const g = bgImg, ctx = g.drawingContext;
  const gr = ctx.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, '#ffd6f2'); gr.addColorStop(0.5, '#d9c9ff'); gr.addColorStop(1, '#c4f4ff');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  G.ch.bg(g, G.ch.layout);
  bgFor = G.idx;
}

function render() {
  if (!G.ch) return;
  if (!bgImg || bgFor !== G.idx) buildBg();
  image(bgImg, 0, 0, W, H);
  drawRoomFx();
  const guideItem = G.drag ? G.drag.item : (G.helpFlash && G.time < G.helpFlash.until ? G.helpFlash.item : null);
  if (guideItem) drawGuides(guideItem);
  const list = drawList();
  list.filter(i => i.state !== 'tray' && i.state !== 'drag').forEach(it => drawItem(it));
  drawFront();
  drawTray();
  list.filter(i => i.state === 'tray').forEach(it => drawItem(it));
  if (G.drag) { drawGhost(); drawItem(G.drag.item); }
  drawMarkers();
  drawParticles();
  drawTooltip();
  if (G.memPH) drawPlaceholder();
}

function layerOf(it) {
  if (it.state === 'tray') return 9;
  const s = it.surface && surfaceById(it.surface);
  if (!s) return 2;
  if (s.type === 'wall' || s.type === 'hang' || s.type === 'spot') return 0;
  if (s.type === 'line') return 1;
  if (s.type === 'bin') return 3;
  return 2;
}

function drawList() {
  return G.items.slice().sort((a, b) => (layerOf(a) - layerOf(b)) || ((a.y + a.h / 2) - (b.y + b.h / 2)));
}

function drawSprite(g, id, w, h, t) {
  const sp = SPRITES[id];
  if (sp.anim) { g.push(); sp.draw(g, w, h, t); g.pop(); return; }
  g.image(spriteImg(id), -w / 2 - PAD, -h / 2 - PAD);
}

function spriteImg(id) {
  if (spriteCache[id]) return spriteCache[id];
  const d = ITEM_DEFS[id];
  const pg = createGraphics(d.w + PAD * 2, d.h + PAD * 2);
  pg.push(); pg.translate(d.w / 2 + PAD, d.h / 2 + PAD); SPRITES[id].draw(pg, d.w, d.h, 0); pg.pop();
  spriteCache[id] = pg;
  return pg;
}

let thumbG = null;
function getThumb(id) {
  if (thumbCache[id]) return thumbCache[id];
  const d = ITEM_DEFS[id], size = 120;
  if (!thumbG) { thumbG = createGraphics(size, size); thumbG.pixelDensity(2); }
  const pg = thumbG;
  pg.clear();
  const s = Math.min(1.3, 96 / d.w, 96 / d.h);
  pg.push(); pg.translate(size / 2, size / 2); pg.scale(s); SPRITES[id].draw(pg, d.w, d.h, 0); pg.pop();
  thumbCache[id] = pg.elt.toDataURL('image/png');
  return thumbCache[id];
}

function drawItem(it) {
  if (it.state === 'binned' && !it.tw) return;
  const hover = G.hover === it;
  const hopY = -Math.abs(Math.sin(G.time / 90)) * 14 * it.hop;
  const sc = it.scale * (hover ? 1.06 : 1);
  push();
  translate(it.x + it.ox, it.y + it.oy + hopY);
  if (it.state === 'drag') {
    noStroke(); fill(58, 42, 92, 45); ellipse(0, it.h * sc / 2 + 16, it.w * sc * 0.8, 14);
  }
  rotate(it.rot + Math.sin(G.time / 26) * 0.16 * it.wig);
  scale(sc * it.sx, sc * it.sy);
  if (it.alpha < 1) drawingContext.globalAlpha = Math.max(0, it.alpha);
  if (it.state === 'tray' && it.carried) {
    noStroke(); fill(255, 255, 255, 120); ellipse(0, 0, it.w + 26, it.h + 20);
  }
  drawSprite(window, it.id, it.w, it.h, G.time);
  drawingContext.globalAlpha = 1;
  pop();
  if (it.state === 'tray' && it.carried) {
    push(); noStroke();
    heart(window, it.x + it.ox + it.w * it.trayScale / 2 - 2, it.y + it.oy - it.h * it.trayScale / 2 + 2, 7, '#ff5fb8');
    pop();
  }
  if (it.mess && it.state === 'placed' && !it.tw && G.state === 'play') {
    push(); noStroke(); fill(255, 95, 184, 140 + 80 * Math.sin(G.time / 200));
    textFont('Sniglet'); textSize(20); textAlign(CENTER, CENTER);
    text('!', it.x + it.w / 2 - 2, it.y - it.h / 2 - 4);
    pop();
  }
}

function drawRoomFx() {
  const ctx = drawingContext;
  const nl = G.items.find(i => i.id === 'nightlight' && i.state === 'placed' && i.surface === 'socket');
  if (nl) {
    const pulse = 0.85 + Math.sin(G.time / 700) * 0.15;
    const gr = ctx.createRadialGradient(nl.x, nl.y, 6, nl.x, nl.y, 260);
    gr.addColorStop(0, 'rgba(255,236,150,' + (0.45 * pulse) + ')'); gr.addColorStop(1, 'rgba(255,236,150,0)');
    ctx.fillStyle = gr; ctx.fillRect(nl.x - 260, nl.y - 260, 520, 520);
  }
  const fl = G.items.find(i => i.id === 'fairylights' && i.state === 'placed');
  if (fl) {
    const gr = ctx.createRadialGradient(fl.x, fl.y, 10, fl.x, fl.y, 320);
    gr.addColorStop(0, 'rgba(255,190,230,0.22)'); gr.addColorStop(1, 'rgba(255,190,230,0)');
    ctx.fillStyle = gr; ctx.fillRect(fl.x - 320, fl.y - 320, 640, 640);
  }
  // little twinkles in the room
  noStroke();
  for (let i = 0; i < 7; i++) {
    const ph = (G.time / 1800 + i * 0.37) % 1;
    const a = Math.sin(ph * Math.PI);
    star4(window, 200 + ((i * 397) % 880), 90 + ((i * 211) % 300), 3 + a * 5, 'rgba(255,255,255,' + (a * 0.85).toFixed(2) + ')');
  }
}

function drawGuides(it) {
  const ctx = drawingContext;
  const tgt = G.drag && G.drag.target && G.drag.target.surf;
  const pulse = 0.6 + 0.4 * Math.sin(G.time / 180);
  for (const s of G.ch.surfaces) {
    if (!it.fits.includes(s.tag)) continue;
    const hot = tgt === s;
    push();
    ctx.setLineDash([10, 7]); ctx.lineDashOffset = -G.time / 30;
    const shape = () => {
      if (s.type === 'line') rect(s.x1, s.y - 5, s.x2 - s.x1, 10, 5);
      else if (s.type === 'hang') rect(s.x1, s.y - 6, s.x2 - s.x1, 12, 5);
      else if (s.type === 'spot') ellipse(s.x, s.y, s.r * 1.3, s.r * 1.3);
      else if (s.type === 'area') rect(s.x1 + 6, s.y1 - 30, s.x2 - s.x1 - 12, s.y2 - s.y1 + 34, 14);
      else rect(s.x1, s.y1, s.x2 - s.x1, s.y2 - s.y1, 12);
    };
    noFill(); stroke(255, 255, 255, 220); strokeWeight(hot ? 8 : 6); shape();
    fill(255, 95, 184, hot ? 70 : 22 + 18 * pulse); stroke(255, 63, 160, 255 * (hot ? 1 : pulse)); strokeWeight(hot ? 4 : 2.5); shape();
    ctx.setLineDash([]);
    if (s.label) {
      const lx = (s.x1 + s.x2) / 2, ly = s.y1 - 8;
      textFont('Sniglet'); textSize(14); textAlign(CENTER, CENTER);
      const tw = textWidth(s.label) + 20;
      stroke(INK); strokeWeight(2); fill(255); rect(lx - tw / 2, ly - 12, tw, 24, 12);
      noStroke(); fill(INK); text(s.label, lx, ly);
    }
    pop();
  }
}

function drawGhost() {
  const t = G.drag.target;
  if (!t || !t.surf || t.pos.bin) return;
  const it = G.drag.item;
  push();
  translate(t.pos.x, t.pos.y);
  drawingContext.globalAlpha = 0.38;
  drawSprite(window, it.id, it.w, it.h, G.time);
  drawingContext.globalAlpha = 1;
  pop();
}

function drawFront() {
  const ch = G.ch;
  if (ch.id === 'teen') {
    const n = binCount('basket', G.items);
    const cols = [PAL.lilac, PAL.denim, PAL.pink];
    push(); ink(window, 2);
    for (let i = 0; i < n; i++) { fill(cols[i % 3]); ellipse(520 + i * 22, 452 - (i % 2) * 6, 40, 22); }
    pop();
  }
  if (ch.id === 'childhood' && binCount('toybox', G.items)) {
    push(); ink(window, 1.5);
    ['#ff6f7d', '#7f9de8', '#ffcc33'].forEach((c, i) => { fill(c); rect(80 + i * 12, 456 - i * 3, 7, 22, 2); });
    pop();
  }
}

function drawTray() {
  const ctx = drawingContext;
  if (G.ch.moving) { drawPackingBox(); return; }
  push();
  stroke(INK); strokeWeight(3); fill(255);
  const gr = ctx.createLinearGradient(0, TRAY.y, 0, TRAY.y + TRAY.h);
  gr.addColorStop(0, 'rgba(175,232,255,0.92)'); gr.addColorStop(1, 'rgba(208,182,255,0.92)');
  ctx.fillStyle = gr;
  rect(TRAY.x, TRAY.y, TRAY.w, TRAY.h, 26);
  noStroke(); fill(255, 255, 255, 110); rect(TRAY.x + 18, TRAY.y + 7, TRAY.w - 36, 16, 10);
  // cardboard "box" sticker on the left
  stroke(INK); strokeWeight(2.5); fill('#e7b886'); rect(TRAY.x + 18, TRAY.y + 26, 104, 92, 12);
  noStroke(); fill(255, 240, 170, 220); rect(TRAY.x + 62, TRAY.y + 26, 16, 92);
  fill(INK); textFont('Rubik Bubbles'); textSize(19); textAlign(CENTER, CENTER);
  const left = G.items.filter(i => i.state === 'tray').length;
  text(left ? 'UNPACK' : 'EMPTY!', TRAY.x + 70, TRAY.y + 58);
  textFont('VT323'); textSize(22); text(left + ' left', TRAY.x + 70, TRAY.y + 88);
  pop();
}

function drawPackingBox() {
  const bx1 = 470, bx2 = 810, top = 618, bottom = 716, k = G.boxClose;
  const ctx = drawingContext;
  push();
  stroke(INK); strokeWeight(3);
  // back flap
  fill('#f0c896');
  quad(bx1 + 16, top, bx2 - 16, top, bx2 - 40, top - 56 * (1 - k), bx1 + 40, top - 56 * (1 - k));
  fill('#8a5a33'); rect(bx1, top - 2, bx2 - bx1, 22, 4);
  // packed things peeking out
  const shown = G.items.filter(i => i.state === 'binned' && i.surface === 'box' && !i.tw).slice(-6);
  shown.forEach((it, i) => {
    const px = shown.length === 1 ? 640 : bx1 + 50 + i * (bx2 - bx1 - 100) / (shown.length - 1);
    push(); translate(px, top + 2 - 6 * (i % 2));
    const s = Math.min(0.75, 70 / it.h, 80 / it.w); scale(s);
    drawSprite(window, it.id, it.w, it.h, G.time);
    pop();
  });
  // front panel
  stroke(INK); strokeWeight(3); fill('#e7b886'); rect(bx1, top + 16, bx2 - bx1, bottom - top, 6);
  noStroke(); fill(255, 240, 170, 210); rect(640 - 12, top + 16, 24, bottom - top);
  fill(INK); textFont('Sniglet'); textSize(20); textAlign(CENTER, CENTER);
  text('THE NEXT CHAPTER →', 640, top + 50);
  textFont('VT323'); textSize(20); text('fragile ♥ handle with care', 640, top + 74);
  // side flaps closing in
  stroke(INK); strokeWeight(3); fill('#f0c896');
  const lx = lerp(bx1 - 90, bx1 + 4, k), rx = lerp(bx2 + 90, bx2 - 4, k);
  const ly = lerp(top + 40, top - 6, k);
  quad(bx1, top + 16, bx1, top - 2, lx + (k > 0.5 ? (640 - bx1) * (k - 0.5) * 2 : 0), ly, lx, ly + 26 * (1 - k));
  quad(bx2, top + 16, bx2, top - 2, rx - (k > 0.5 ? (bx2 - 640) * (k - 0.5) * 2 : 0), ly, rx, ly + 26 * (1 - k));
  if (k > 0.95) { noStroke(); fill(255, 240, 170, 230); rect(bx1 + 10, top - 10, bx2 - bx1 - 20, 16, 3); }
  // instructions on either side
  noStroke(); fill(INK); textFont('Sniglet'); textSize(18); textAlign(CENTER, CENTER);
  if (G.state === 'play') {
    text('drag what you’ll take\ninto the box ✦', 250, 648);
    text('teddy goes in last ♥', 1030, 640);
    textFont('VT323'); textSize(24); text(G.packed.length + ' packed', 1030, 670);
  }
  pop();
}

function drawMarkers() {
  if (G.state !== 'play' || G.modal) return;
  G.items.forEach(it => {
    if (it.state !== 'placed' || it.mess || it.tw) return;
    const mem = memoryFor(it.id);
    if (!mem) return;
    const unseen = !G.seen.has(mem.id);
    if (!unseen && G.hover !== it) return;
    const x = it.x + it.w / 2 - 4, y = it.y - it.h / 2 - 8 + (unseen ? Math.sin(G.time / 180) * 3 : 0);
    push(); stroke(INK); strokeWeight(2); fill(unseen ? '#ff5fb8' : '#ffffff'); ellipse(x, y, 22, 22);
    noStroke(); fill(unseen ? 255 : INK); textFont('Sniglet'); textSize(12); textAlign(CENTER, CENTER);
    text(unseen ? '!' : '▶', x + (unseen ? 0 : 1), y);
    pop();
  });
}

function drawParticles() {
  noStroke();
  G.particles.forEach(p => {
    const a = Math.min(1, p.life / 400);
    push(); translate(p.x, p.y); rotate(p.r);
    drawingContext.globalAlpha = a;
    if (p.kind === 'heart') heart(window, 0, 0, p.size * 0.6, p.col);
    else if (p.kind === 'chip') { fill(p.col); rect(-p.size / 2, -p.size / 4, p.size, p.size / 2, 2); }
    else star4(window, 0, 0, p.size, p.col);
    drawingContext.globalAlpha = 1;
    pop();
  });
}

function drawTooltip() {
  const it = G.hover;
  if (!it || G.drag) return;
  const mem = it.state === 'placed' && !it.mess ? memoryFor(it.id) : null;
  let label = it.def.name + (it.carried && it.state === 'tray' ? ' ♥ kept' : '') + (mem ? '  ▶ click to replay' : '');
  if (it.mess) label = it.def.name + ' (tidy me!)';
  const s = it.state === 'tray' ? it.trayScale : 1;
  const x = constrain(it.x + it.ox, 120, W - 120), y = it.y + it.oy - it.h * s / 2 - 20;
  push();
  textFont('Sniglet'); textSize(15); textAlign(CENTER, CENTER);
  const tw = textWidth(label) + 22;
  stroke(INK); strokeWeight(2); fill(255); rect(x - tw / 2, y - 13, tw, 26, 13);
  noStroke(); fill(INK); text(label, x, y);
  pop();
}

/* ---------- placeholder art for photos / videos that haven't been added yet ---------- */

function mountPlaceholder(host, mem) {
  if (!memG) memG = createGraphics(560, 340);
  memG.elt.style.display = 'block';
  memG.elt.style.width = '100%'; memG.elt.style.height = '100%';
  host.appendChild(memG.elt);
  let ids = mem.items.length ? mem.items.slice(0, 3) : (mem.id === 'te-clothes' ? ['hoodie', 'jeans', 'tee'] : ['teddy', 'familyphoto', 'clothesstack']);
  G.memPH = { mem, ids, t0: G.time };
}

function unmountPlaceholder() {
  G.memPH = null;
  if (memG && memG.elt.parentNode) { memG.elt.parentNode.removeChild(memG.elt); memG.elt.style.display = 'none'; document.body.appendChild(memG.elt); }
}

function drawPlaceholder() {
  const g = memG, ph = G.memPH, t = G.time - ph.t0;
  const ctx = g.drawingContext;
  const gr = ctx.createLinearGradient(0, 0, 560, 340);
  gr.addColorStop(0, G.ch.accent); gr.addColorStop(0.55, '#e6d6ff'); gr.addColorStop(1, '#bff3ff');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, 560, 340);
  g.noStroke();
  for (let i = 0; i < 18; i++) {
    const ph2 = (t / 3200 + i * 0.13) % 1;
    star4(g, (i * 97) % 560, ph2 * 360 - 10, 3 + (i % 3) * 2, 'rgba(255,255,255,0.75)');
  }
  g.fill(255, 255, 255, 120); g.ellipse(280, 300, 420, 50);
  const n = ph.ids.length;
  ph.ids.forEach((id, i) => {
    const d = ITEM_DEFS[id];
    const s = Math.min(2.6, 190 / d.h, (440 / n) / d.w);
    const bob = Math.sin(t / 500 + i) * 6;
    g.push(); g.translate(280 + (i - (n - 1) / 2) * (480 / n), 170 + bob + (ph.mem.type === 'video' ? Math.sin(t / 260 + i) * 3 : 0));
    g.rotate(Math.sin(t / 900 + i * 2) * 0.05);
    g.scale(s);
    g.push(); SPRITES[id].draw(g, d.w, d.h, G.time); g.pop();
    g.pop();
  });
}

/* ================= test hooks (used by automated playtests) ================= */

window.render_game_to_text = () => JSON.stringify({
  state: G.state, modal: G.modal, chapter: G.ch && G.ch.id,
  tray: G.items.filter(i => i.state === 'tray').map(i => i.id),
  placed: G.items.filter(i => i.state === 'placed').map(i => ({ id: i.id, surface: i.surface, x: Math.round(i.x), y: Math.round(i.y), mess: i.mess })),
  binned: G.items.filter(i => i.state === 'binned').map(i => i.id + '@' + i.surface),
  tidy: tidyCount(), total: G.items.length, memoryBox: G.memoryBox, seen: [...G.seen], packed: G.packed
});

window.advanceTime = ms => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i++) update(1000 / 60);
  render();
};

window.__tnc = {
  G,
  surface: id => G.ch.surfaces.find(s => s.id === id),
  item: id => { const it = G.items.find(i => i.id === id); return it && { x: it.x + it.ox, y: it.y + it.oy, state: it.state, w: it.w, h: it.h }; },
  skip: debugSkip
};
