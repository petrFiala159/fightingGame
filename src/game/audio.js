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

export function startBgMusic() {
  getBgAudio().play().catch(() => {});
}

export function pauseBgMusic() {
  if (bgAudio) bgAudio.pause();
}

export function resumeBgMusic() {
  getBgAudio().play().catch(() => {});
}

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioContextCtor) {
      audioCtx = new AudioContextCtor();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function unlockAudio() {
  getAudioContext();
}

export function playHitSound(kind = "punch") {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    noise.buffer = noiseBuffer;
    filter.type = "lowpass";
    filter.frequency.value = kind === "kick" ? 420 : 780;

    osc.type = kind === "kick" ? "triangle" : "square";
    osc.frequency.setValueAtTime(kind === "kick" ? 95 : 155, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(kind === "kick" ? 45 : 70, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

    osc.connect(gain);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    noise.start();
    osc.stop(ctx.currentTime + 0.14);
    noise.stop(ctx.currentTime + 0.08);
  } catch {
    // ignore
  }
}

export function playVictorySound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.12;

      osc.type = i % 2 === 0 ? "triangle" : "sawtooth";
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch {
    // ignore
  }
}
