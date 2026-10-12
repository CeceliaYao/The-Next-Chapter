/* =========================================================
   audio.js — tiny synthesised Y2K sound kit (Web Audio).
   No sound files needed. Everything is generated live.
   ========================================================= */
'use strict';

const Sound = (() => {
  let ctx = null, master = null, amb = null;
  let muted = false;
  let ambTimer = null, ambCfg = null;
  try { muted = localStorage.getItem('tnc-muted') === '1'; } catch (e) { /* storage blocked */ }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.55; master.connect(ctx.destination);
      amb = ctx.createGain(); amb.gain.value = 0.5; amb.connect(master);
    } catch (e) { ctx = null; }
  }

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function tone(freq, dur, o) {
    if (!ctx) return;
    o = o || {};
    const t0 = ctx.currentTime + (o.delay || 0);
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
    const v = o.vol == null ? 0.2 : o.vol;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(v, t0 + (o.attack || 0.006));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(o.bus || master);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, o) {
    if (!ctx) return;
    o = o || {};
    const t0 = ctx.currentTime + (o.delay || 0);
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.from || 800, t0);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol || 0.15, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  /* --- the kit --- */
  const kit = {
    pick() { tone(520, 0.09, { slideTo: 820, vol: 0.12 }); },
    place(progress) {
      const base = 72 + Math.round((progress || 0) * 7);
      tone(mtof(base), 0.18, { type: 'triangle', vol: 0.16 });
      tone(mtof(base + 4), 0.22, { type: 'triangle', vol: 0.14, delay: 0.07 });
      tone(mtof(base + 19), 0.3, { vol: 0.05, delay: 0.1 });
    },
    wrong() { tone(220, 0.16, { type: 'square', vol: 0.06, slideTo: 150 }); },
    back() { tone(600, 0.1, { slideTo: 380, vol: 0.07 }); },
    bin() { noise(0.28, { from: 2400, to: 300, vol: 0.12 }); tone(140, 0.16, { vol: 0.12, delay: 0.16 }); },
    click() { tone(1200, 0.04, { type: 'square', vol: 0.03 }); },
    toast() { tone(mtof(84), 0.14, { vol: 0.12 }); tone(mtof(79), 0.22, { vol: 0.12, delay: 0.12 }); },
    nudge() { for (let i = 0; i < 4; i++) tone(180 + (i % 2) * 40, 0.06, { type: 'square', vol: 0.04, delay: i * 0.06 }); },
    complete() {
      [72, 76, 79, 84, 88, 91].forEach((n, i) => tone(mtof(n), 0.5, { type: 'triangle', vol: 0.13, delay: i * 0.08 }));
      noise(0.9, { from: 6000, to: 9000, filter: 'highpass', vol: 0.03, delay: 0.3 });
    },
    sparkle() { [96, 100, 103].forEach((n, i) => tone(mtof(n), 0.18, { vol: 0.035, delay: i * 0.05 })); },
    boxClose() { noise(0.12, { from: 400, vol: 0.2 }); noise(0.5, { from: 3000, to: 1200, vol: 0.08, delay: 0.15 }); },
    page() { noise(0.18, { from: 3000, to: 5000, filter: 'highpass', vol: 0.05 }); },
    door() {                                  // latch click, a little creak, then a warm chord
      tone(900, 0.03, { type: 'square', vol: 0.05 }); tone(500, 0.05, { type: 'square', vol: 0.04, delay: 0.05 });
      tone(240, 0.55, { type: 'sawtooth', vol: 0.025, slideTo: 330, delay: 0.12 });
      [67, 71, 74, 79].forEach((n, i) => tone(mtof(n), 0.9, { type: 'triangle', vol: 0.09, delay: 0.45 + i * 0.07 }));
    }
  };

  /* soft music-box ambience, one note every couple of seconds */
  function startAmbience(cfg) {
    stopAmbience();
    ambCfg = cfg || ambCfg;
    if (!ctx || !ambCfg) return;
    let step = 0;
    ambTimer = setInterval(() => {
      if (!ctx || muted) return;
      step++;
      if (Math.random() < 0.35) return;
      const n = ambCfg.root + ambCfg.notes[(step * 3 + Math.floor(Math.random() * 3)) % ambCfg.notes.length] + (Math.random() < 0.3 ? 12 : 0);
      tone(mtof(n), 1.6, { vol: 0.045, attack: 0.01, bus: amb });
      if (Math.random() < 0.25) tone(mtof(n + 7), 1.4, { vol: 0.025, delay: 0.25, bus: amb });
    }, 900);
  }
  function stopAmbience() { if (ambTimer) clearInterval(ambTimer); ambTimer = null; }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem('tnc-muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.55, ctx.currentTime, 0.05);
  }

  return Object.assign(kit, {
    init, startAmbience, stopAmbience, setMuted,
    toggle() { setMuted(!muted); return muted; },
    isMuted() { return muted; }
  });
})();
