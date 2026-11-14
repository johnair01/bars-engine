/* The hollow's music (pass between-tea-1, bt-music-ours, bt-music-bus; his answer on bt-music-form: "Both, and you pick by
   ear"). Two versions for his ear, played inside the room's one AudioContext on their own gain, under the room's sound:
     code: a pad and a few bell notes written here in Web Audio, in C, that follow the room.
     bed:  one CC0 recording ("Contemplation" by Joth, opengameart.org/content/contemplation-0, CC0), looped.
     both: the bed under the code.
   The room sets a mood and the music follows it:
     away     standing about the room: a thin pad, a bell now and then
     alone    sitting by yourself: the pad opens
     together both of you sitting: the pad swells, a low root comes in, more bells
     close    the hearth moment or a cup in hand: the music thins so the room and the words carry it
   Nobody home: the page is hidden and the whole context is suspended (ambient.js). The music never carries a decision. */

export const MUSIC_VERSIONS = ["code", "bed", "both"];
export const BED_URL = "/between/music/contemplation-joth-cc0.mp3";

// target levels per mood: pad gain, pad filter cutoff (Hz), seconds between bells (0 = none), root gain, bed gain
export const MOODS = {
  away:     { pad: 0.30, cut: 900,  bell: 11, root: 0.0,  bed: 0.55 },
  alone:    { pad: 0.45, cut: 1250, bell: 8,  root: 0.0,  bed: 0.75 },
  together: { pad: 0.60, cut: 1700, bell: 5,  root: 0.35, bed: 0.95 },
  close:    { pad: 0.22, cut: 700,  bell: 0,  root: 0.0,  bed: 0.40 },
};

const hz = m => 440 * Math.pow(2, (m - 69) / 12);
// Fmaj9, Cmaj9, Am9, G6sus2: diatonic to C, every chord shares a note with the next, 12 s each
export const CHORDS = [
  [53, 57, 60, 64, 67],
  [48, 55, 59, 62, 64],
  [45, 52, 55, 59, 60],
  [43, 50, 55, 57, 62],
];
export const BELLS = [72, 74, 76, 79, 81, 84]; // C pentatonic, above the pad
export const CHORD_S = 12;

export function moodOf({ sitting, together, close }) {
  if (close) return "close";
  if (together) return "together";
  return sitting ? "alone" : "away";
}

export function createMusic(ctx, out, version) {
  const code = version === "code" || version === "both", bedOn = version === "bed" || version === "both";
  const bus = ctx.createGain(); bus.gain.value = 0; bus.connect(out);
  let mood = "away", chordI = -1, timer = null, dead = false, nextChord = 0, nextBell = 0;
  const m = () => MOODS[mood];

  // the pad: per chord note, two slightly detuned triangles through one slow low-pass
  const padF = ctx.createBiquadFilter(); padF.type = "lowpass"; padF.frequency.value = MOODS.away.cut; padF.Q.value = 0.4;
  const padG = ctx.createGain(); padG.gain.value = 0; padF.connect(padG); padG.connect(bus);
  const rootG = ctx.createGain(); rootG.gain.value = 0; rootG.connect(bus);
  let voices = [];
  function chord(t) {
    chordI = (chordI + 1) % CHORDS.length;
    const notes = CHORDS[chordI];
    for (const v of voices) { v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.linearRampToValueAtTime(0, t + 5); v.o.forEach(o => o.stop(t + 5.1)); }
    voices = notes.map((n, i) => {
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06 / (1 + i * 0.25), t + 5);
      const o = [-4, 4].map(c => { const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = hz(n); o.detune.value = c; o.connect(g); o.start(t); return o; });
      g.connect(padF); return { g, o };
    });
    // a low root under the chord, heard only when the mood brings it in
    const r = ctx.createOscillator(); r.type = "sine"; r.frequency.value = hz(notes[0] - 12);
    const rg = ctx.createGain(); rg.gain.setValueAtTime(0, t); rg.gain.linearRampToValueAtTime(0.12, t + 4); rg.gain.setValueAtTime(0.12, t + CHORD_S - 1); rg.gain.linearRampToValueAtTime(0, t + CHORD_S + 4);
    r.connect(rg); rg.connect(rootG); r.start(t); r.stop(t + CHORD_S + 4.1);
  }
  function bell(t) {
    const every = m().bell;
    if (every) {
      const n = BELLS[Math.floor(Math.random() * BELLS.length)];
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = hz(n);
      const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = hz(n) * 2.76; // a bell's inharmonic partial
      const g = ctx.createGain(), g2 = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, t + 4.5);
      g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(0.012, t + 0.01); g2.gain.exponentialRampToValueAtTime(0.0003, t + 1.2);
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const dst = pan || bus; if (pan) { pan.pan.value = Math.random() * 1.2 - 0.6; pan.connect(bus); }
      o.connect(g); o2.connect(g2); g.connect(dst); g2.connect(dst); o.start(t); o2.start(t); o.stop(t + 4.6); o2.stop(t + 1.3);
    }
    return (every || 4) * (0.6 + Math.random() * 0.8);
  }
  /* Everything is timed on the context's own clock, a little ahead, so a slow frame or a background tab never smears a
     chord change; tick() runs four times a second (and by hand when rendered offline). */
  function tick() {
    if (dead || !code) return;
    const ahead = ctx.currentTime + 0.5;
    while (nextChord <= ahead) { chord(Math.max(nextChord, ctx.currentTime)); nextChord += CHORD_S; }
    while (nextBell <= ahead) nextBell += bell(Math.max(nextBell, ctx.currentTime));
  }

  // the bed: one CC0 recording, fetched once, looped with its ends trimmed past the encoder's padding
  const bedG = ctx.createGain(); bedG.gain.value = 0; bedG.connect(bus);
  let bedSrc = null;
  if (bedOn) {
    fetch(BED_URL).then(r => r.arrayBuffer()).then(b => new Promise((ok, no) => ctx.decodeAudioData(b, ok, no))).then(buf => {
      if (dead) return;
      bedSrc = ctx.createBufferSource(); bedSrc.buffer = buf; bedSrc.loop = true;
      bedSrc.loopStart = 0.05; bedSrc.loopEnd = buf.duration - 0.05;
      bedSrc.connect(bedG); bedSrc.start(ctx.currentTime, 0.05); setMood(mood, 6);
    }).catch(() => {});
  }

  function setMood(next, secs = 4) {
    mood = MOODS[next] ? next : "away";
    const t = ctx.currentTime, k = m(), ramp = (p, v) => { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(v, t + secs); };
    if (code) { ramp(padG.gain, k.pad); ramp(padF.frequency, k.cut); ramp(rootG.gain, k.root); }
    if (bedOn) ramp(bedG.gain, bedSrc ? k.bed * (code ? 0.6 : 1) : 0);
  }
  if (code) { nextChord = ctx.currentTime; nextBell = ctx.currentTime + 3; tick(); if (typeof setInterval === "function" && !(ctx instanceof (globalThis.OfflineAudioContext || Object))) timer = setInterval(tick, 250); }
  setMood("away", 1);
  return {
    get current() { return mood; },
    follow(next) { if (next !== mood) setMood(next); },
    tick,
    level(on) { const t = ctx.currentTime; bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(bus.gain.value, t); bus.gain.linearRampToValueAtTime(on ? 1 : 0, t + 2); },
    stop() { dead = true; clearInterval(timer); this.level(false); if (bedSrc) try { bedSrc.stop(ctx.currentTime + 2.1); } catch {} },
  };
}
