/* =========================================================
   game.js: the p5 sketch. Game states, drag & drop,
   placement rules, pixel feedback (hops, sparkles, wiggles)
   and the chapter-to-chapter memory box. Everything visual
   is drawn into a 320 x 180 pixel canvas, then scaled up 4x.
   Words drawn on the canvas (tooltips, the box counter, drop
   labels) use the smooth UI fonts so they're easy to read.
   ========================================================= */
'use strict';

const W = 1280, H = 720;          // the game canvas (16:9)
const STAGE_W = 1280, STAGE_H = 960, SCREEN_K = 1200 / 1280;   // the 4:3 page it sits in, and its on-page scale
const FONT_UI = '"Archivo Narrow", "Arial Narrow", Arial, sans-serif', FONT_BODY = 'Jost, "Trebuchet MS", Verdana, sans-serif';
const TRAY = { x: 16, y: 576, w: 1248, h: 140 };
const TRAY_FLOOR = 176;          // art row the tray items stand on

const G = {
  state: 'boot', modal: null, idx: 0, ch: null,
  items: [], drag: null, press: null, hover: null,
  pointer: { x: -99, y: -99 }, lastTrail: 0,
  particles: [], timers: [], queue: [], running: false,
  time: 0, lastInput: performance.now(), lastProgress: performance.now(), lastHelp: 0, helpFlash: null,
  memoryBox: ['teddy'], since: { teddy: 0 }, letGo: [], seen: new Set(), fired: new Set(), everTidy: new Set(),
  yaLayout: null, packed: [], boxClose: 0, gift: false, labels: [], marks: []
};

let canvasEl, artCv, art, bgCv = null, bgFor = null, trayCv = null, thumbCache = {}, CURSORS = {};

/* ================= p5 lifecycle ================= */

function setup() {
  const c = createCanvas(W, H);
  c.parent('screen');
  canvasEl = c.elt;
  canvasEl.id = 'game';
  canvasEl.style.touchAction = 'none';
  frameRate(60);
  noSmooth();
  fitStage();
  window.addEventListener('resize', fitStage);
  artCv = document.createElement('canvas'); artCv.width = ART_W; artCv.height = ART_H;
  art = artCv.getContext('2d'); art.imageSmoothingEnabled = false;
  initInput();
  UI.init({ onStart: startRun, onJump: jumpTo, onMenu: openMenu, onMute: toggleMute, onActivity: () => { G.lastInput = performance.now(); } });
  noLoop();
  const fonts = ['500 16px Jost', '700 16px Jost', '500 16px "Archivo Narrow"', '700 16px "Archivo Narrow"', '16px VT323'].map(f => document.fonts.load(f).catch(() => null));
  Promise.race([Promise.all(fonts), new Promise(r => setTimeout(r, 2500))]).then(() => {
    buildSprites();
    initCursors();
    goTitle(true);
    loop();
  });
}

function draw() {
  update(Math.min(50, deltaTime || 16.7));
  render();
}

function fitStage() {
  const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  document.documentElement.style.setProperty('--s', s);
  const pd = Math.min(3, Math.max(1, Math.round(s * SCREEN_K * (window.devicePixelRatio || 1) * 4) / 4));
  if (pd !== pixelDensity()) pixelDensity(pd);
}

/* vector cursors (crisp at any size); if a browser can't use them it falls back to the system ones */
function initCursors() {
  const svg = body => 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">' + body + '</svg>') + '")';
  const arrow = '<path d="M5 3v21l5.2-5 3.6 8.4 3.6-1.6-3.6-8.2H21z" fill="#fff" stroke="#221a13" stroke-width="2" stroke-linejoin="round"/>';
  const hand = '<path d="M11 15V5.5a2 2 0 014 0V13h.4v-1.5a2 2 0 014 0V13h.3v-.8a2 2 0 014 0V14h.3a2 2 0 014 0v6.5c0 5-3.4 8.5-8.4 8.5h-2c-3 0-4.8-1.4-6.6-3.8l-4.3-5.8a2 2 0 013-2.6z" fill="#fff" stroke="#221a13" stroke-width="2" stroke-linejoin="round"/>';
  const grab = '<path d="M8.5 15.5v-2.4a2 2 0 014 0V12a2 2 0 014 0v.2a2 2 0 014 0v.6a2 2 0 014 0v7.7c0 4.6-3.2 7.9-7.8 7.9h-2.3c-2.8 0-4.6-1.3-6.3-3.6l-2.6-3.6a2 2 0 013-2.6z" fill="#fff" stroke="#221a13" stroke-width="2" stroke-linejoin="round"/>';
  CURSORS = { arrow: svg(arrow) + ' 5 3, default', hand: svg(hand) + ' 13 4, pointer', grab: svg(grab) + ' 16 14, grabbing' };
  document.documentElement.style.setProperty('--cursor', CURSORS.arrow);
  document.documentElement.style.setProperty('--cursor-hand', CURSORS.hand);
  document.documentElement.style.setProperty('--cursor-grab', CURSORS.grab);
}

/* ================= flow ================= */

function resetRun() {
  G.memoryBox = ['teddy']; G.since = { teddy: 0 }; G.letGo = []; G.seen = new Set(); G.yaLayout = null;
}

function goTitle(withDoor) {
  UI.closeMemory(true); G.modal = null;
  Sound.stopAmbience(); UI.clearToasts();
  setupChapter(0);
  autoTidy();
  G.state = 'title';
  setBlur(true);
  UI.showTitle(CHAPTERS, withDoor === true);
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
  UI.showIntro(G.ch, i, beginChapter, { thumb: getThumb('teddy'), label: TEDDY_AGES[i] });
}

function beginChapter() {
  G.state = 'play';
  UI.clearScreen();
  setBlur(false);
  UI.showHUD(true);
  updateHUD();
  UI.setHelper(getThumb('teddy'), G.ch.tip);   // Teddy gives the chapter's tip in the dock under the room
  Sound.startAmbience(G.ch.ambience);
  G.lastProgress = performance.now();
  const start = G.ch.onStart.slice();
  if (G.gift) start.push({ do: 'wait', ms: 2600 }, { do: 'toast', from: 'Mum', text: 'Left a copy of the family photo on your bed for you. For your new place ♥' });
  enqueue(start);
}

function setupChapter(i) {
  G.idx = i; G.ch = CHAPTERS[i];
  SPRITE_VARIANT.teddy = i;          // Teddy looks a little older every chapter
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
  bgCv = null;
}

function makeItem(id, o) {
  const def = ITEM_DEFS[id];
  let fits = def.fits.slice();
  if (o.carried) CARRY_FITS.forEach(f => { if (!fits.includes(f)) fits.push(f); });
  if (G.ch && G.ch.moving) fits = fits.concat(CARRY_FITS, ['box']);
  return {
    id, def, w: def.w, h: def.h, fits, carried: !!o.carried, order: o.order || 0,
    x: 640, y: 646, ox: 0, oy: 0, rot: 0, scale: 1, trayScale: 1, alpha: 1, land: 0,
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
    if (!hasRoom(it)) CARRY_FITS.forEach(f => { if (!it.fits.includes(f)) it.fits.push(f); });
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
    thumb: id => getThumb(id), names: id => ITEM_DEFS[id].name, teddyLabel: TEDDY_AGES[G.idx],
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
  UI.showThanks(ENDING_NOTE, getThumb('teddy', CHAPTERS.length - 1), () => { if (G.state === 'ending') showSummary(); });
}

function showSummary() {
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
    memSeen: G.seen.size, memTotal, credits: CREDITS, thumb: id => getThumb(id), names: id => ITEM_DEFS[id].name,
    teddy: CHAPTERS.map((c, k) => ({ thumb: getThumb('teddy', k), year: c.year, label: TEDDY_AGES[k] }))
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
  it.tw = { from: { ox: it.ox, oy: it.oy, rot: -2 }, to: { ox: 0, oy: 0, rot: a.rot || 0 }, t: 0, dur: 650, ease: easeOutCubic, arc: 120, done: () => { it.land = 1; Sound.wrong(); burst(it.x, it.y + it.h / 2, 8, 30); done(); } };
  updateHUD();
}

function openMemory(id, done) {
  const mem = G.ch.memories.find(m => m.id === id);
  if (!mem) { done && done(); return; }
  G.seen.add(mem.id);
  G.modal = 'memory';
  Sound.stopAmbience();
  UI.openMemory(mem, G.ch, {
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
  if (canInteract() && p.y < H && p.y > 0) trail(p.x, p.y);
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
  else if (k === 'N' && e.shiftKey && G.state === 'play' && !G.modal) debugSkip();
  else if (k === 'Enter') {
    if (document.querySelector('.door-splash')) return;   // the closed door handles Enter itself (it opens)
    const b = document.querySelector('#beginBtn, #nextBtn, #keepDone, #startBtn, #thanksNext'); if (b && !b.disabled) b.click();
  }
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
    it.tw = { from: { ox: it.ox, oy: it.oy, rot: it.rot }, to: { ox: 0, oy: 0, rot: 0 }, t: 0, dur: 170, ease: easeOutBack, done: () => { it.land = 1; burst(it.x, it.y + it.h / 2 - 4, 9, 36); } };
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
  it.land = 1;
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
    if (a === 'door') { closeMenu(); goTitle(true); }   // all the way back to the closed bedroom door
    if (a === 'sound') { toggleMute(); G.modal = null; openMenu(); }
  });
}
function closeMenu() { G.modal = null; UI.hideMenu(); }

function toggleMute() {
  Sound.init();
  Sound.toggle();
  UI.refreshMute();
  if (!Sound.isMuted() && G.state === 'play' && !G.modal) Sound.startAmbience(G.ch.ambience);
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
    if (it.land) it.land = Math.max(0, it.land - dt / 200);
    it.wig *= k(0.94); it.hop *= k(0.975);
  }

  if (G.drag) G.drag.target = findTarget(G.drag.item, G.drag.tx, G.drag.ty);

  G.particles = G.particles.filter(p => {
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt;
    return p.life > 0;
  });

  // hover
  G.hover = (canInteract() && !G.drag) ? itemAt(G.pointer.x, G.pointer.y) : null;
  if (canvasEl) canvasEl.style.cursor = G.drag ? CURSORS.grab : G.hover ? CURSORS.hand : '';

  const now = performance.now();
  if (G.state !== 'title' && G.state !== 'boot' && now - G.lastInput > IDLE_RESET_MS) goTitle(true);
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
  const x0 = 40, x1 = 311, avail = x1 - x0;
  const sum = list.reduce((t, i) => t + SPR[i.id].w, 0);
  const gap = n > 1 ? Math.min(6, (avail - sum) / (n - 1)) : 0;
  let ax = x0 + Math.max(0, (avail - (sum + gap * (n - 1))) / 2);
  list.forEach(it => {
    const S = SPR[it.id];
    const tx = (Math.round(ax) + S.w / 2) * ART, ty = (TRAY_FLOOR - S.h / 2) * ART;
    ax += S.w + gap;
    it.trayScale = 1;
    if (snap) { it.x = tx; it.y = ty; it.ox = it.oy = 0; it.scale = 1; return; }
    if (it.x !== tx || it.y !== ty) { it.ox += it.x - tx; it.oy += it.y - ty; it.x = tx; it.y = ty; }
  });
}

/* ================= particles (in art pixels) ================= */

const SPARK_COLS = ['1', '2', '3', '4', '5', 'w', '6'];

function burst(x, y, n, spread) {
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3, sp = 0.02 + Math.random() * 0.045;
    G.particles.push({ x: x / ART + (Math.random() - 0.5) * spread / ART, y: y / ART, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.00012, life: 450 + Math.random() * 300, size: Math.random() < 0.4 ? 2 : 1, col: SPARK_COLS[i % SPARK_COLS.length], kind: 'star' });
  }
}

function confetti(n) {
  for (let i = 0; i < n; i++) {
    G.particles.push({ x: Math.random() * ART_W, y: -5 - Math.random() * 50, vx: (Math.random() - 0.5) * 0.02, vy: 0.02 + Math.random() * 0.03, g: 0.00002, life: 3200 + Math.random() * 1500, size: 1 + (i % 2), col: SPARK_COLS[i % SPARK_COLS.length], kind: ['star', 'heart', 'chip'][i % 3] });
  }
}

function trail(px, py) {
  if (G.time - G.lastTrail < 45) return;
  G.lastTrail = G.time;
  G.particles.push({ x: px / ART, y: py / ART, vx: (Math.random() - 0.5) * 0.01, vy: 0.012, g: 0, life: 380, size: 1, col: ['3', 'w', '1', '4'][Math.floor(Math.random() * 4)], kind: 'star' });
}

/* ================= rendering ================= */

const colOf = c => (c && c.length === 1 ? PALETTE[c] : c);
function apx(x, y, c) { art.fillStyle = colOf(c); art.fillRect(Math.round(x), Math.round(y), 1, 1); }
function arect(x, y, w, h, c) { art.fillStyle = colOf(c); art.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }

function buildBg() {
  const b = new PixBuf(ART_W, ART_H, 0);
  ROOM_FX = {};
  G.ch.bg(b, G.ch.layout);
  bgCv = b.toCanvas(1);
  bgFor = G.idx;
}

function buildTray() {
  const b = new PixBuf(312, 35, 0);
  // the shelf the box sits on is part of the frame (white, plum outline, a faint grid), not the room
  b.rect(0, 0, 312, 35, '#ffffff');
  b.rect(1, 31, 310, 3, '#ebe8e1');
  b.rect(0, 0, 312, 1, 'o'); b.rect(0, 34, 312, 1, 'o'); b.rect(0, 0, 1, 35, 'o'); b.rect(311, 0, 1, 35, 'o');
  b.box(4, 4, 30, 27, 'r'); b.rect(17, 5, 4, 3, 'y'); b.box(7, 8, 24, 21, 'w');   // cardboard box + label sticker
  trayCv = b.toCanvas(1);
}

function render() {
  if (!G.ch || !art) return;
  if (!bgCv || bgFor !== G.idx) buildBg();
  if (!trayCv) buildTray();
  const ctx = drawingContext;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bgCv, 0, 0, W, H);   // the room itself
  drawRoomGlow(ctx);                 // soft light, gloss and sparkles on top of it (smooth, full resolution)
  art.clearRect(0, 0, ART_W, ART_H);
  G.labels = []; G.marks = [];
  const guideItem = G.drag ? G.drag.item : (G.helpFlash && G.time < G.helpFlash.until ? G.helpFlash.item : null);
  const list = drawList();
  list.filter(i => i.state !== 'tray' && i.state !== 'drag').forEach(drawItem);
  drawFront();
  if (guideItem) drawGuides(guideItem);
  drawTray();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(artCv, 0, 0, W, H);
  drawTrayGloss(ctx);
  drawLabels(ctx);               // the words sit on the room and the box...
  art.clearRect(0, 0, ART_W, ART_H);
  list.filter(i => i.state === 'tray').forEach(drawItem);   // ...and the things in the tray / in your hand go over them
  if (G.drag) { drawGhost(); drawItem(G.drag.item); }
  drawMarkers();
  drawParticles();
  ctx.drawImage(artCv, 0, 0, W, H);
  drawMarks(ctx);
  drawTooltip(ctx);
}

/* ---------- words on the canvas: smooth fonts on top of the pixel art ---------- */
function canvasText(ctx, str, x, y, o) {
  ctx.font = (o.weight || 700) + ' ' + o.size + 'px ' + (o.family || FONT_UI);
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = o.color || PALETTE.o;
  ctx.fillText(str, x, y);
}
function pill(ctx, str, cx, cy, size, accent) {
  ctx.font = '700 ' + size + 'px ' + FONT_UI;
  const w = ctx.measureText(str).width + size * 1.1, h = size * 1.6;
  // kept inside the visible part of the screen (the top 44 px of the canvas are cropped by #screen)
  const x = Math.round(Math.max(8, Math.min(W - w - 8, cx - w / 2))), y = Math.round(Math.max(50, Math.min(H - h - 6, cy - h / 2)));
  // a little frame-style label: white, the frame's plum outline and a hard offset shadow
  ctx.fillStyle = 'rgba(61,44,74,.25)'; ctx.fillRect(x + 4, y + 4, w, h);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h);
  ctx.lineWidth = 3; ctx.strokeStyle = accent || PALETTE.o; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  canvasText(ctx, str, x + w / 2, y + h / 2 + 1, { size });
}
const HEART = '\u2665\uFE0E';
function drawLabels(ctx) {
  G.labels.forEach(l => {
    if (l.pill) pill(ctx, l.text, l.x, l.y, l.size, l.accent);
    else canvasText(ctx, l.text, l.x, l.y, l);
  });
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

/* top-left art pixel of an item's box (outline included) */
function artPos(it, wx, wy) {
  const S = SPR[it.id];
  return [Math.round((wx == null ? it.x + it.ox : wx) / ART - S.w / 2), Math.round((wy == null ? it.y + it.oy : wy) / ART - S.h / 2)];
}

const _shadowCache = {};
function shadowCv(w) {
  if (_shadowCache[w]) return _shadowCache[w];
  const b = new PixBuf(w, 3, 0);
  b.ell(w / 2, 1.5, w / 2, 1.5, 'w');
  const out = b.map((c, x, y) => ((x + y) % 2 ? null : 'o'));
  return (_shadowCache[w] = out.toCanvas(1));
}

function drawItem(it) {
  if (it.state === 'binned' && (!it.tw || it.alpha < 0.15)) return;
  const S = SPR[it.id], fr = spriteFrame(it.id, G.time);
  let [ax, ay] = artPos(it);
  ay -= Math.round(Math.abs(Math.sin(G.time / 90)) * 3 * it.hop);
  if (it.land) ay -= Math.round(Math.sin(it.land * Math.PI) * 2);
  if (it.wig > 0.15) ax += Math.floor(G.time / 45) % 2 ? 1 : -1;
  const lifted = it.state === 'drag';
  if (lifted) { const sw = Math.max(4, Math.round(S.w * 0.8)); art.drawImage(shadowCv(sw), ax + Math.round((S.w - sw) / 2), ay + S.h); ay -= 3; }
  const img = it.alpha < 0.6 ? fr.ghost : (lifted || G.hover === it) ? fr.hover : fr.normal;
  art.drawImage(img, ax - 1, ay - 1);
  if (it.state === 'tray' && it.carried) art.drawImage(heartCv(), ax + S.w - 5, ay - 3);
  if (it.mess && it.state === 'placed' && !it.tw && G.state === 'play') bubble(ax + S.w - 3, ay - 6 + (Math.floor(G.time / 300) % 2), '2', '!');
}

let _heart = null;
function heartCv() { return _heart || (_heart = iconBuf('heart').toCanvas(1)); }

function bubble(x, y, c, ch) { G.marks.push({ x, y, c, ch }); }   // drawn later as glossy gel badges (drawMarks)

// a round Y2K "gel" badge: colour gradient, plum rim, white shine on the top half
function drawMarks(ctx) {
  G.marks.forEach(m => {
    if (m.ch === 'spark' || m.ch === 'spark-seen') return drawMemorySpark(ctx, (m.x + 0.5) * ART, (m.y + 0.5) * ART, m.ch === 'spark');
    const x = (m.x + 0.5) * ART, y = (m.y + 0.5) * ART, r = 15, col = PALETTE[m.c];
    ctx.save();
    ctx.shadowColor = 'rgba(61,44,74,.3)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    const g = ctx.createRadialGradient(x - r * .35, y - r * .4, 1, x, y, r);
    g.addColorStop(0, mixHex(col, '#ffffff', .55)); g.addColorStop(1, col);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    ctx.lineWidth = 2.5; ctx.strokeStyle = PALETTE.o; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y - r * .45, r * .62, r * .32, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
    if (m.ch === '!') {
      ctx.font = '800 21px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.o; ctx.strokeText('!', x, y + 1);
      ctx.fillStyle = '#ffffff'; ctx.fillText('!', x, y + 1);
    }
    else { ctx.beginPath(); ctx.moveTo(x - 3, y - 6); ctx.lineTo(x + 5, y); ctx.lineTo(x - 3, y + 6); ctx.closePath(); ctx.fillStyle = PALETTE.o; ctx.fill(); }
  });
  G.marks = [];
}

// the twinkle on a thing that holds a memory: a pink-and-white four-point star with a small one beside it
function drawMemorySpark(ctx, x, y, unseen) {
  const t = G.time / 1000, a = unseen ? 0.5 + 0.5 * Math.sin(t * 4) : 0.6;
  const r = unseen ? 13 + a * 5 : 12;
  ctx.save();
  ctx.shadowColor = 'rgba(255,132,228,.9)'; ctx.shadowBlur = 12;
  ctx.fillStyle = '#ff84e4'; sparkle(ctx, x, y, r + 3);
  ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'; sparkle(ctx, x, y, r - 2);
  ctx.globalAlpha = unseen ? 1 - a * 0.6 : 0.8;
  ctx.fillStyle = '#ffffff'; ctx.shadowColor = 'rgba(255,132,228,.9)'; ctx.shadowBlur = 6;
  sparkle(ctx, x - 14, y + 11, 5 + (1 - a) * 3);
  ctx.restore();
}

/* ---------- the room's Y2K finish: smooth light and gloss over the pixel drawing ---------- */
function sparkle(ctx, x, y, r) {   // a four-point twinkle
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}
function drawRoomGlow(ctx) {
  const k = ART, { LX, RX, WX1, WX2, WY1, WY2, FY } = RA;
  const floor = () => { ctx.beginPath(); ctx.moveTo(WX1 * k, (WY2 + 1) * k); ctx.lineTo((WX2 + 1) * k, (WY2 + 1) * k); ctx.lineTo((RX + 1) * k, (FY + 1) * k); ctx.lineTo(LX * k, (FY + 1) * k); ctx.closePath(); };
  ctx.save();
  // a glossy sheen across the back wall, like the shiny plastic screens of the time
  ctx.save();
  ctx.beginPath(); ctx.rect((WX1 + 1) * k, (WY1 + 1) * k, (WX2 - WX1 - 1) * k, (WY2 - WY1 - 3) * k); ctx.clip();
  let g = ctx.createLinearGradient(WX1 * k, WY1 * k, (WX1 + 120) * k, WY2 * k);
  g.addColorStop(0, 'rgba(255,255,255,.34)'); g.addColorStop(.38, 'rgba(255,255,255,.08)'); g.addColorStop(.39, 'rgba(255,255,255,0)');
  g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(.51, 'rgba(255,255,255,.1)'); g.addColorStop(.6, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(WX1 * k, WY1 * k, (WX2 - WX1) * k, (WY2 - WY1) * k);
  ctx.restore();
  // light from the window
  if (ROOM_FX.beam) {
    ctx.beginPath(); ctx.moveTo(138 * k, 72 * k); ctx.lineTo(182 * k, 72 * k); ctx.lineTo(214 * k, 141 * k); ctx.lineTo(142 * k, 141 * k); ctx.closePath();
    g = ctx.createLinearGradient(0, 72 * k, 0, 141 * k);
    g.addColorStop(0, 'rgba(255,255,255,' + (0.14 + ROOM_FX.beam * 0.05) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fill();
  }
  // a shiny floor: the light reflected at the back, fading towards you
  ctx.save(); floor(); ctx.clip();
  g = ctx.createLinearGradient(0, WY2 * k, 0, (WY2 + 22) * k);
  g.addColorStop(0, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(LX * k, WY2 * k, (RX - LX + 2) * k, 24 * k);
  ctx.restore();
  // the night-light's warm glow and the fairy lights' pink glow
  const nl = G.items.find(i => i.id === 'nightlight' && i.state === 'placed' && i.surface === 'socket');
  if (nl) {
    const r = 120 + Math.sin(G.time / 450) * 10;
    g = ctx.createRadialGradient(nl.x, nl.y, 0, nl.x, nl.y, r);
    g.addColorStop(0, 'rgba(255,243,168,.75)'); g.addColorStop(.35, 'rgba(255,243,168,.3)'); g.addColorStop(1, 'rgba(255,243,168,0)');
    ctx.fillStyle = g; ctx.fillRect(nl.x - r, nl.y - r, r * 2, r * 2);
  }
  const fl = G.items.find(i => i.id === 'fairylights' && i.state === 'placed');
  if (fl) {
    g = ctx.createRadialGradient(fl.x, fl.y + 30, 0, fl.x, fl.y + 30, 230);
    g.addColorStop(0, 'rgba(255,190,230,.45)'); g.addColorStop(1, 'rgba(255,190,230,0)');
    ctx.fillStyle = g; ctx.fillRect(fl.x - 230, fl.y - 200, 460, 460);
  }
  // sparkles that twinkle on the walls
  ctx.fillStyle = '#ffffff'; ctx.shadowColor = 'rgba(255,255,255,.95)'; ctx.shadowBlur = 10;
  for (let i = 0; i < 7; i++) {
    const ph = (G.time / 1700 + i * 0.37) % 1;
    if (ph > 0.45) continue;
    const a = Math.sin(ph / 0.45 * Math.PI);
    ctx.globalAlpha = a;
    sparkle(ctx, (50 + ((i * 97) % 220)) * k, (22 + ((i * 53) % 70)) * k, 6 + a * 8);
  }
  ctx.restore();
}

function dashRect(x1, y1, x2, y2, hot) {
  const ph = Math.floor(G.time / 120);
  const plot = (x, y, k) => apx(x, y, (k + ph) % 4 < 2 ? '1' : 'w');
  let k = 0;
  for (let x = x1; x <= x2; x++) { if (hot || (k + ph) % 4 < 2) plot(x, y1, k); k++; }
  for (let y = y1; y <= y2; y++) { if (hot || (k + ph) % 4 < 2) plot(x2, y, k); k++; }
  for (let x = x2; x >= x1; x--) { if (hot || (k + ph) % 4 < 2) plot(x, y2, k); k++; }
  for (let y = y2; y >= y1; y--) { if (hot || (k + ph) % 4 < 2) plot(x1, y, k); k++; }
}

function drawGuides(it) {
  const tgt = G.drag && G.drag.target && G.drag.target.surf;
  const ph = Math.floor(G.time / 120);
  for (const s of G.ch.surfaces) {
    if (!it.fits.includes(s.tag)) continue;
    const hot = tgt === s;
    if (s.type === 'line' || s.type === 'hang') {
      const y = q(s.y) - (s.type === 'line' ? 1 : 0), x1 = q(s.x1), x2 = q(s.x2);
      for (let x = x1; x <= x2; x++) {
        if (hot) { apx(x, y, (x + ph) % 4 < 2 ? '1' : 'w'); apx(x, y - 1, '1'); }
        else if ((x + ph) % 4 < 2) apx(x, y, '1'); else apx(x, y, 'w');
      }
    } else if (s.type === 'spot') {
      const cx = q(s.x), cy = q(s.y), r = Math.round(q(s.r) * 0.6);
      for (let a = 0; a < 64; a++) { if (!hot && (a + ph) % 4 >= 2) continue; apx(cx + Math.cos(a / 64 * Math.PI * 2) * r, cy + Math.sin(a / 64 * Math.PI * 2) * r, (a + ph) % 4 < 2 ? '1' : 'w'); }
    } else if (s.type === 'area') {
      dashRect(q(s.x1) + 1, q(s.y1) - 8, q(s.x2) - 1, Math.min(140, q(s.y2) + 1), hot);
    } else {
      dashRect(q(s.x1), q(s.y1), q(s.x2), q(s.y2), hot);
    }
    if (s.label) G.labels.push({ pill: true, text: s.label, x: (s.x1 + s.x2) / 2, y: s.y1 - 18, size: 20, accent: hot ? PALETTE['1'] : PALETTE.o });
  }
}

function drawGhost() {
  const t = G.drag.target;
  if (!t || !t.surf || t.pos.bin) return;
  const it = G.drag.item, [ax, ay] = artPos(it, t.pos.x, t.pos.y);
  art.drawImage(spriteFrame(it.id, G.time).ghost, ax - 1, ay - 1);
}

function drawFront() {
  const ch = G.ch;
  if (ch.id === 'teen') {
    const n = binCount('basket', G.items), cols = ['L', 'n', 'P'], k = ch.layout.basket;
    for (let i = 0; i < n; i++) { const x = q(k.x1) + 2 + i * 7, y = q(k.y1) - 3 - (i % 2); arect(x - 1, y - 1, 8, 4, 'o'); arect(x, y, 6, 2, cols[i % 3]); }
  }
  if (ch.id === 'teen' && binCount('underbed', G.items)) {
    const bed = ch.layout.bed, y = q(bed.bottom) - 2, x0 = q(bed.x1) + 14;
    const under = G.items.filter(i => i.state === 'binned' && i.surface === 'underbed').map(i => i.id);
    if (under.includes('sneakers')) { arect(x0 - 1, y - 2, 8, 4, 'o'); arect(x0, y - 1, 6, 2, 'w'); apx(x0 + 1, y - 1, 'h'); }
    if (under.includes('skates')) { [0, 4].forEach(dx => { arect(x0 + 22 + dx, y - 1, 3, 3, 'o'); apx(x0 + 23 + dx, y, 'y'); }); arect(x0 + 21, y - 2, 9, 1, 'R'); }
  }
  if (ch.id === 'childhood' && binCount('toybox', G.items)) {
    const t = ch.layout.toybox;
    ['x', 'n', 'Y'].forEach((c, i) => { arect(q(t.x1) + 6 + i * 3, q(t.y1) - 4 - i, 2, 5, c); });
  }
}

function drawTray() {
  if (G.ch.moving) { drawPackingBox(); return; }
  art.drawImage(trayCv, 4, 144);
  const left = G.items.filter(i => i.state === 'tray').length, cx = 23 * ART;   // centred on the box's label sticker
  if (left) {
    G.labels.push({ text: 'BOX', x: cx, y: 621, size: 18 });
    G.labels.push({ text: String(left), x: cx, y: 650, size: 34, color: PALETTE['2'] });
    G.labels.push({ text: 'LEFT', x: cx, y: 678, size: 18 });
  } else {
    G.labels.push({ text: 'ALL', x: cx, y: 630, size: 20 });
    G.labels.push({ text: 'DONE ' + HEART, x: cx, y: 668, size: 20, color: PALETTE['3'] });
  }
}

// the tray's shine: a soft white sheen across its top half (smooth, over the pixel panel)
function drawTrayGloss(ctx) {
  if (G.ch.moving) return;
  const x = 5 * ART, y = 145 * ART, w = 310 * ART, h = 16 * ART;
  ctx.fillStyle = 'rgba(61,44,74,.07)';   // a faint grid, like the reference's panels
  for (let gx = x + 18; gx < x + w; gx += 22) ctx.fillRect(gx, y, 1, 31 * ART);
  for (let gy = y + 14; gy < y + 31 * ART; gy += 22) ctx.fillRect(x, gy, w, 1);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}

function artPoly(pts, c) {
  const b = new PixBuf(ART_W, ART_H, 0);
  b.poly(pts, c);
  for (let i = 0; i < pts.length; i++) b.line(pts[i][0], pts[i][1], pts[(i + 1) % pts.length][0], pts[(i + 1) % pts.length][1], 'o');
  return b;
}

let _boxCache = { k: -1, cv: null };
function drawPackingBox() {
  const bx1 = 118, bx2 = 202, top = 155, k = Math.round(G.boxClose * 8) / 8;
  if (_boxCache.k !== k) {
    const b = new PixBuf(ART_W, ART_H, 0);
    const flapH = Math.round(12 * (1 - k));
    if (flapH > 0) { b.poly([[bx1 + 4, top], [bx2 - 3, top], [bx2 - 9, top - flapH], [bx1 + 10, top - flapH]], 't'); b.line(bx1 + 4, top, bx1 + 10, top - flapH, 'o'); b.line(bx1 + 10, top - flapH, bx2 - 9, top - flapH, 'o'); b.line(bx2 - 9, top - flapH, bx2 - 3, top, 'o'); }
    b.box(bx1, top, bx2 - bx1 + 1, 5, 'Q');
    _boxCache = { k, cv: b.toCanvas(1), front: null };
    const f = new PixBuf(ART_W, ART_H, 0);
    f.box(bx1, top + 4, bx2 - bx1 + 1, 180 - top - 3, 'r');
    f.rect(158, top + 5, 5, 180 - top - 5, 'y');
    const reach = Math.round(30 * k), lift = Math.round(10 * k);
    const L = [[bx1, top + 4], [bx1, top], [bx1 - 24 + reach * 2 + (k > 0.5 ? (k - 0.5) * 40 : 0), top + 8 - lift * 2], [bx1 - 24 + reach * 2, top + 14 - lift * 2]];
    const R = L.map(([x, y]) => [bx1 + bx2 - x, y]);
    [L, R].forEach(pts => { f.poly(pts, 't'); for (let i = 0; i < pts.length; i++) f.line(pts[i][0], pts[i][1], pts[(i + 1) % pts.length][0], pts[(i + 1) % pts.length][1], 'o'); });
    if (k >= 1) { f.box(bx1 + 2, top - 2, bx2 - bx1 - 3, 4, 't'); f.rect(158, top - 1, 5, 3, 'y'); }
    _boxCache.front = f.toCanvas(1);
  }
  art.drawImage(_boxCache.cv, 0, 0);
  const shown = G.items.filter(i => i.state === 'binned' && i.surface === 'box' && !i.tw).slice(-5);
  shown.forEach((it, i) => {
    const S = SPR[it.id], cv = spriteFrame(it.id, G.time).normal;
    const x = shown.length === 1 ? 160 - S.w / 2 : bx1 + 8 + i * ((bx2 - bx1 - 16 - S.w) / Math.max(1, shown.length - 1));
    const rows = Math.min(S.h, 9 + (i % 2) * 2);
    art.drawImage(cv, 0, 0, cv.width, rows + 1, Math.round(x) - 1, top + 5 - rows, cv.width, rows + 1);
  });
  art.drawImage(_boxCache.front, 0, 0);
  G.labels.push({ text: 'NEXT CHAPTER ▸', x: 160 * ART, y: (top + 11) * ART, size: 28 });   // printed on the box
  G.labels.push({ text: 'FRAGILE ' + HEART, x: 160 * ART, y: (top + 19) * ART, size: 24, color: PALETTE.m });
  if (G.state === 'play') {
    const t = (text, x, y, color) => G.labels.push({ text, x, y, size: 27, align: 'left', family: FONT_BODY, color });
    t('Drag what you’ll take', 56, 622); t('into the box', 56, 656);
    t('Teddy goes in last ' + HEART, 916, 622, PALETTE.m);
    t(G.packed.length + ' packed', 916, 676, '#c94300');
  }
}

function drawMarkers() {
  if (G.state !== 'play' || G.modal) return;
  G.items.forEach(it => {
    if (it.state !== 'placed' || it.mess || it.tw) return;
    const mem = memoryFor(it.id);
    if (!mem) return;
    const unseen = !G.seen.has(mem.id);
    if (!unseen && G.hover !== it) return;
    const [ax, ay] = artPos(it), S = SPR[it.id];
    G.marks.push({ x: ax + S.w - 2, y: ay - 3, ch: unseen ? 'spark' : 'spark-seen' });   // a memory twinkles (the "!" is kept for messes)
  });
}

function drawParticles() {
  G.particles.forEach(p => {
    if (p.life < 120 && Math.floor(p.life / 40) % 2) return;
    const x = Math.round(p.x), y = Math.round(p.y);
    if (p.kind === 'heart') { apx(x - 1, y, p.col); apx(x + 1, y, p.col); arect(x - 1, y + 1, 3, 1, p.col); apx(x, y + 2, p.col); }
    else if (p.kind === 'chip') arect(x, y, 2, 1, p.col);
    else { apx(x, y, 'w'); for (let k = 1; k <= p.size; k++) { apx(x - k, y, p.col); apx(x + k, y, p.col); apx(x, y - k, p.col); apx(x, y + k, p.col); } }
  });
}

function drawTooltip(ctx) {
  const it = G.hover;
  if (!it || G.drag) return;
  const mem = it.state === 'placed' && !it.mess ? memoryFor(it.id) : null;
  let label = it.def.name + (it.carried && it.state === 'tray' ? ' ' + HEART : '') + (mem ? '  ·  click to replay' : '');
  if (it.mess) label = it.def.name + '  ·  tidy me!';
  const S = SPR[it.id], [ax, ay] = artPos(it);
  pill(ctx, label, (ax + S.w / 2) * ART, Math.max(66, (ay - 3) * ART - 22), 22);
}

function getThumb(id, v) {
  const vv = v != null ? v : (SPRITE_VARIANT[id] || 0), key = id + ':' + vv;
  if (thumbCache[key]) return thumbCache[key];
  const cv = spriteFrame(id, 0, vv).normal, size = 120;
  const k = Math.max(1, Math.floor(Math.min(108 / cv.width, 108 / cv.height)));
  const out = document.createElement('canvas'); out.width = size; out.height = size;
  const ctx = out.getContext('2d'); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cv, Math.round((size - cv.width * k) / 2), Math.round((size - cv.height * k) / 2), cv.width * k, cv.height * k);
  return (thumbCache[key] = out.toDataURL('image/png'));
}

/* ================= debug helpers (handy for testing a build) ================= */

window.TNC_DEBUG = {
  G,
  state: () => ({
    state: G.state, modal: G.modal, chapter: G.ch && G.ch.id,
    tray: G.items.filter(i => i.state === 'tray').map(i => i.id),
    placed: G.items.filter(i => i.state === 'placed').map(i => ({ id: i.id, surface: i.surface, x: Math.round(i.x), y: Math.round(i.y), mess: i.mess })),
    binned: G.items.filter(i => i.state === 'binned').map(i => i.id + '@' + i.surface),
    tidy: tidyCount(), total: G.items.length, memoryBox: G.memoryBox, seen: [...G.seen], packed: G.packed
  }),
  step: ms => { const n = Math.max(1, Math.round(ms / (1000 / 60))); for (let i = 0; i < n; i++) update(1000 / 60); render(); },
  surface: id => G.ch.surfaces.find(s => s.id === id),
  item: id => { const it = G.items.find(i => i.id === id); return it && { x: it.x + it.ox, y: it.y + it.oy, state: it.state, w: it.w, h: it.h }; },
  skip: debugSkip
};
