/* The hollow's quiet sound: a crackling fire, running water and night insects, made in Web Audio (no sound files).
   Browsers only allow sound after a tap, so it starts on the first one; the mute choice is kept on this device. */
export function createAmbient() {
  let ctx = null, master = null, on = true;
  try { on = localStorage.getItem("between.sound") !== "off"; } catch {}

  function noiseBuffer(c, seconds, brown) {
    const b = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return b;
  }
  function start() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);

    // water: brown noise through a moving band-pass, with a slow swell
    const water = ctx.createBufferSource(); water.buffer = noiseBuffer(ctx, 4, true); water.loop = true;
    const wf = ctx.createBiquadFilter(); wf.type = "bandpass"; wf.frequency.value = 700; wf.Q.value = 0.6;
    const wg = ctx.createGain(); wg.gain.value = 0.35;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.13; const lg = ctx.createGain(); lg.gain.value = 260; lfo.connect(lg); lg.connect(wf.frequency); lfo.start();
    water.connect(wf); wf.connect(wg); wg.connect(master); water.start();

    // fire: a low rumble plus little crackles at random
    const rumble = ctx.createBufferSource(); rumble.buffer = noiseBuffer(ctx, 3, true); rumble.loop = true;
    const rf = ctx.createBiquadFilter(); rf.type = "lowpass"; rf.frequency.value = 220;
    const rg = ctx.createGain(); rg.gain.value = 0.25; rumble.connect(rf); rf.connect(rg); rg.connect(master); rumble.start();
    const crackBuf = noiseBuffer(ctx, 0.05, false);
    const crackle = () => {
      if (!ctx) return;
      const s = ctx.createBufferSource(); s.buffer = crackBuf;
      const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1500 + Math.random() * 2500;
      const g = ctx.createGain(); const t = ctx.currentTime; g.gain.setValueAtTime(0.05 + Math.random() * 0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.03 + Math.random() * 0.05);
      s.connect(f); f.connect(g); g.connect(master); s.start(t);
      setTimeout(crackle, 60 + Math.random() * (Math.random() < 0.2 ? 900 : 260));
    };
    crackle();

    // crickets: short high chirps in little trains, now and then
    const chirp = () => {
      if (!ctx) return;
      const t0 = ctx.currentTime, f0 = 4200 + Math.random() * 600, n = 2 + Math.floor(Math.random() * 3);
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; pan.connect(master); }
      for (let i = 0; i < n; i++) {
        const o = ctx.createOscillator(); o.frequency.value = f0; const g = ctx.createGain(); const t = t0 + i * 0.07;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.018, t + 0.01); g.gain.linearRampToValueAtTime(0, t + 0.045);
        o.connect(g); g.connect(pan || master); o.start(t); o.stop(t + 0.06);
      }
      setTimeout(chirp, 700 + Math.random() * 2600);
    };
    chirp();
    apply();
  }
  function apply() {
    if (!ctx) return;
    if (on && ctx.state === "suspended") ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(on ? 0.6 : 0, ctx.currentTime + 1.2);
  }
  return {
    get on() { return on; },
    /* Call from a tap: the first one starts the sound if it is on. */
    wake() { if (on) start(); else if (ctx && ctx.state === "suspended") ctx.resume(); },
    toggle() { on = !on; try { localStorage.setItem("between.sound", on ? "on" : "off"); } catch {} if (on) start(); apply(); return on; },
    pause() { if (ctx && ctx.state === "running") ctx.suspend(); },
    resume() { if (ctx && on) ctx.resume(); },
  };
}
