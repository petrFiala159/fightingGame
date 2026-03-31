import bgMusicUrl from "../assets/music.mp3";

let audioCtx = null;
let bgAudio = null;

function getBgAudio() {
  if (!bgAudio) {
    bgAudio = new Audio(bgMusicUrl);
    bgAudio.loop = true;
    bgAudio.volume = 0.35;
  }
  return bgAudio;
}

export function startBgMusic() { getBgAudio().play().catch(() => {}); }
export function pauseBgMusic() { if (bgAudio) bgAudio.pause(); }
export function resumeBgMusic() { getBgAudio().play().catch(() => {}); }

function ctx() {
  if (!audioCtx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (C) audioCtx = new C();
  }
  if (audioCtx?.state === "suspended") audioCtx.resume();
  return audioCtx;
}

export function unlockAudio() { ctx(); }

// ─── helpers ───────────────────────────────────────────────────────────────

function noise(ac, dur) {
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ac.createBufferSource();
  s.buffer = buf;
  return s;
}

function osc(ac, type, freq) {
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  return o;
}

function gain(ac, val = 0) {
  const g = ac.createGain();
  g.gain.value = val;
  return g;
}

function lpf(ac, freq) {
  const f = ac.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = freq;
  return f;
}

function hpf(ac, freq) {
  const f = ac.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = freq;
  return f;
}

function distort(ac, amount = 80) {
  const w = ac.createWaveShaper();
  const samples = 256;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  w.curve = curve;
  return w;
}

// ─── PUNCH ─────────────────────────────────────────────────────────────────
// Sharp mid-frequency crack + body thud
export function playPunchSound() {
  try {
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const master = gain(ac, 1); master.connect(ac.destination);

    // Thud layer
    const thudOsc = osc(ac, "sine", 120);
    const thudGain = gain(ac);
    thudOsc.frequency.setValueAtTime(120, t);
    thudOsc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
    thudGain.gain.setValueAtTime(0.001, t);
    thudGain.gain.exponentialRampToValueAtTime(0.5, t + 0.005);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    thudOsc.connect(thudGain); thudGain.connect(master);
    thudOsc.start(t); thudOsc.stop(t + 0.12);

    // Crack layer
    const n = noise(ac, 0.06);
    const nGain = gain(ac);
    const nFilter = lpf(ac, 2200);
    const nHp = hpf(ac, 600);
    nGain.gain.setValueAtTime(0.001, t);
    nGain.gain.exponentialRampToValueAtTime(0.4, t + 0.003);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    n.connect(nHp); nHp.connect(nFilter); nFilter.connect(nGain); nGain.connect(master);
    n.start(t); n.stop(t + 0.06);
  } catch {}
}

// ─── KICK ──────────────────────────────────────────────────────────────────
// Deep bass thump + mid crack
export function playKickSound() {
  try {
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const master = gain(ac, 1); master.connect(ac.destination);

    // Sub bass
    const subOsc = osc(ac, "sine", 80);
    const subGain = gain(ac);
    subOsc.frequency.setValueAtTime(80, t);
    subOsc.frequency.exponentialRampToValueAtTime(28, t + 0.15);
    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.exponentialRampToValueAtTime(0.65, t + 0.004);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    subOsc.connect(subGain); subGain.connect(master);
    subOsc.start(t); subOsc.stop(t + 0.2);

    // Smack noise
    const n = noise(ac, 0.09);
    const nGain = gain(ac);
    const f = lpf(ac, 900);
    nGain.gain.setValueAtTime(0.001, t);
    nGain.gain.exponentialRampToValueAtTime(0.45, t + 0.004);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    n.connect(f); f.connect(nGain); nGain.connect(master);
    n.start(t); n.stop(t + 0.09);

    // Distorted mid layer
    const midOsc = osc(ac, "sawtooth", 200);
    const midGain = gain(ac);
    const dist = distort(ac, 120);
    const midLpf = lpf(ac, 500);
    midOsc.frequency.setValueAtTime(200, t);
    midOsc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
    midGain.gain.setValueAtTime(0.001, t);
    midGain.gain.exponentialRampToValueAtTime(0.22, t + 0.005);
    midGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    midOsc.connect(dist); dist.connect(midLpf); midLpf.connect(midGain); midGain.connect(master);
    midOsc.start(t); midOsc.stop(t + 0.14);
  } catch {}
}

// ─── HEADSHOT ──────────────────────────────────────────────────────────────
// Crunchy bone-crack with high transient
export function playHeadshotSound() {
  try {
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const master = gain(ac, 0.9); master.connect(ac.destination);

    // Crack
    const n = noise(ac, 0.05);
    const nGain = gain(ac);
    const f1 = lpf(ac, 3500);
    const f2 = hpf(ac, 1000);
    nGain.gain.setValueAtTime(0.001, t);
    nGain.gain.exponentialRampToValueAtTime(0.55, t + 0.002);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    n.connect(f2); f2.connect(f1); f1.connect(nGain); nGain.connect(master);
    n.start(t); n.stop(t + 0.05);

    // Pitch drop
    const crackOsc = osc(ac, "square", 500);
    const crackGain = gain(ac);
    const crackLpf = lpf(ac, 1200);
    crackOsc.frequency.setValueAtTime(500, t);
    crackOsc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
    crackGain.gain.setValueAtTime(0.001, t);
    crackGain.gain.exponentialRampToValueAtTime(0.3, t + 0.003);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    crackOsc.connect(crackLpf); crackLpf.connect(crackGain); crackGain.connect(master);
    crackOsc.start(t); crackOsc.stop(t + 0.1);
  } catch {}
}

// ─── BLOCK ─────────────────────────────────────────────────────────────────
// Metallic clang
export function playBlockSound() {
  try {
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const master = gain(ac, 0.7); master.connect(ac.destination);

    [900, 1350, 1800].forEach((freq, i) => {
      const o = osc(ac, "triangle", freq);
      const g = gain(ac);
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.18 / (i + 1), t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22 - i * 0.04);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.25);
    });

    const n = noise(ac, 0.03);
    const ng = gain(ac);
    const nf = hpf(ac, 2000);
    ng.gain.setValueAtTime(0.001, t);
    ng.gain.exponentialRampToValueAtTime(0.2, t + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    n.connect(nf); nf.connect(ng); ng.connect(master);
    n.start(t); n.stop(t + 0.03);
  } catch {}
}

// ─── COMBO ─────────────────────────────────────────────────────────────────
// Power hit whoosh + heavy impact
export function playComboSound() {
  try {
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const master = gain(ac, 1); master.connect(ac.destination);

    // Whoosh sweep
    const sweepOsc = osc(ac, "sawtooth", 600);
    const sweepGain = gain(ac);
    const sweepLpf = lpf(ac, 800);
    sweepOsc.frequency.setValueAtTime(600, t);
    sweepOsc.frequency.exponentialRampToValueAtTime(150, t + 0.07);
    sweepGain.gain.setValueAtTime(0.001, t);
    sweepGain.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    sweepOsc.connect(sweepLpf); sweepLpf.connect(sweepGain); sweepGain.connect(master);
    sweepOsc.start(t); sweepOsc.stop(t + 0.1);

    // Heavy thud
    const thudOsc = osc(ac, "sine", 100);
    const thudGain = gain(ac);
    thudOsc.frequency.setValueAtTime(100, t + 0.04);
    thudOsc.frequency.exponentialRampToValueAtTime(25, t + 0.22);
    thudGain.gain.setValueAtTime(0.001, t + 0.04);
    thudGain.gain.exponentialRampToValueAtTime(0.75, t + 0.046);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    thudOsc.connect(thudGain); thudGain.connect(master);
    thudOsc.start(t + 0.04); thudOsc.stop(t + 0.26);

    // High crack
    const n = noise(ac, 0.05);
    const ng = gain(ac);
    const nf = lpf(ac, 3000);
    ng.gain.setValueAtTime(0.001, t + 0.04);
    ng.gain.exponentialRampToValueAtTime(0.5, t + 0.044);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    n.connect(nf); nf.connect(ng); ng.connect(master);
    n.start(t); n.stop(t + 0.1);
  } catch {}
}

// ─── SHOT FIRE ─────────────────────────────────────────────────────────────
// Energy zap / laser
export function playShotFireSound() {
  try {
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const master = gain(ac, 0.5); master.connect(ac.destination);

    const o = osc(ac, "sawtooth", 900);
    const g = gain(ac);
    const f = lpf(ac, 1400);
    o.frequency.setValueAtTime(900, t);
    o.frequency.exponentialRampToValueAtTime(220, t + 0.12);
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    o.connect(f); f.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.14);

    // Zap noise
    const n = noise(ac, 0.04);
    const ng = gain(ac);
    const nf = hpf(ac, 1800);
    ng.gain.setValueAtTime(0.001, t);
    ng.gain.exponentialRampToValueAtTime(0.25, t + 0.003);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    n.connect(nf); nf.connect(ng); ng.connect(master);
    n.start(t); n.stop(t + 0.04);
  } catch {}
}

// ─── SHOT HIT ──────────────────────────────────────────────────────────────
// Small explosion burst
export function playShotHitSound() {
  try {
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const master = gain(ac, 0.8); master.connect(ac.destination);

    // Explosion sub
    const subOsc = osc(ac, "sine", 90);
    const subGain = gain(ac);
    subOsc.frequency.setValueAtTime(90, t);
    subOsc.frequency.exponentialRampToValueAtTime(22, t + 0.14);
    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.exponentialRampToValueAtTime(0.6, t + 0.005);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    subOsc.connect(subGain); subGain.connect(master);
    subOsc.start(t); subOsc.stop(t + 0.18);

    // Burst noise
    const n = noise(ac, 0.12);
    const ng = gain(ac);
    const f = lpf(ac, 1800);
    ng.gain.setValueAtTime(0.001, t);
    ng.gain.exponentialRampToValueAtTime(0.55, t + 0.004);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    n.connect(f); f.connect(ng); ng.connect(master);
    n.start(t); n.stop(t + 0.15);
  } catch {}
}

// ─── JUMP ──────────────────────────────────────────────────────────────────
// Quick upward whoosh
export function playJumpSound() {
  try {
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const master = gain(ac, 0.3); master.connect(ac.destination);

    const o = osc(ac, "triangle", 180);
    const g = gain(ac);
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(520, t + 0.1);
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.11);
  } catch {}
}

// ─── LOW HP WARNING ────────────────────────────────────────────────────────
// Tense heartbeat pulse
export function playLowHpSound() {
  try {
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const master = gain(ac, 0.35); master.connect(ac.destination);

    [0, 0.1].forEach((offset) => {
      const o = osc(ac, "sine", 55);
      const g = gain(ac);
      o.frequency.setValueAtTime(55, t + offset);
      o.frequency.exponentialRampToValueAtTime(30, t + offset + 0.08);
      g.gain.setValueAtTime(0.001, t + offset);
      g.gain.exponentialRampToValueAtTime(0.5, t + offset + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.09);
      o.connect(g); g.connect(master);
      o.start(t + offset); o.stop(t + offset + 0.1);
    });
  } catch {}
}

// ─── FIGHT ANNOUNCE ────────────────────────────────────────────────────────
// Dramatic stinger chord
export function playAnnounceSound() {
  try {
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const master = gain(ac, 0.55); master.connect(ac.destination);

    // Rising sweep
    const sweep = osc(ac, "sawtooth", 80);
    const sweepG = gain(ac);
    const sweepLpf = lpf(ac, 600);
    sweep.frequency.setValueAtTime(80, t);
    sweep.frequency.exponentialRampToValueAtTime(400, t + 0.15);
    sweepG.gain.setValueAtTime(0.001, t);
    sweepG.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    sweepG.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    sweep.connect(sweepLpf); sweepLpf.connect(sweepG); sweepG.connect(master);
    sweep.start(t); sweep.stop(t + 0.2);

    // Power chord (C E G)
    [261.63, 329.63, 392, 523.25].forEach((freq, i) => {
      const o = osc(ac, i < 2 ? "sawtooth" : "triangle", freq);
      const g = gain(ac);
      const f = lpf(ac, 2000);
      const start = t + 0.12 + i * 0.02;
      g.gain.setValueAtTime(0.001, start);
      g.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.38);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(start); o.stop(start + 0.42);
    });

    // Noise burst
    const n = noise(ac, 0.04);
    const ng = gain(ac);
    const nf = lpf(ac, 2500);
    ng.gain.setValueAtTime(0.001, t);
    ng.gain.exponentialRampToValueAtTime(0.4, t + 0.003);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    n.connect(nf); nf.connect(ng); ng.connect(master);
    n.start(t); n.stop(t + 0.04);
  } catch {}
}

// ─── VICTORY ───────────────────────────────────────────────────────────────
// Arcade fanfare melody
export function playVictorySound() {
  try {
    const ac = ctx(); if (!ac) return;

    // Melody: C5 E5 G5 C6 G5 C6
    const melody = [
      { freq: 523.25, dur: 0.12, type: "triangle" },
      { freq: 659.25, dur: 0.12, type: "triangle" },
      { freq: 783.99, dur: 0.12, type: "triangle" },
      { freq: 1046.5, dur: 0.22, type: "sawtooth" },
      { freq: 783.99, dur: 0.10, type: "triangle" },
      { freq: 1046.5, dur: 0.38, type: "sawtooth" },
    ];

    let time = ac.currentTime;
    melody.forEach(({ freq, dur, type }) => {
      const o = osc(ac, type, freq);
      const g = gain(ac);
      const f = lpf(ac, 3000);
      g.gain.setValueAtTime(0.001, time);
      g.gain.exponentialRampToValueAtTime(0.2, time + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
      o.connect(f); f.connect(g); g.connect(ac.destination);
      o.start(time); o.stop(time + dur + 0.02);
      time += dur * 0.88;
    });
  } catch {}
}

// ─── UNIFIED HIT DISPATCHER (backward compat) ──────────────────────────────
export function playHitSound(kind = "punch") {
  if (kind === "kick") playKickSound();
  else playPunchSound();
}
