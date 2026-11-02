/* The drink of tea as authored in Blender (round 5 of the Between tea, his choice on look tea-drink-look-1): the clips in
   m/dusk/tea-drink.glb, baked by art/between/tea-drink/build.py from IK arms, a head that leads, an arc to the lips, unequal
   ease, overlap and a breathing layer, played on the live figure by a three.js AnimationMixer. No loading here and no scene,
   so the page (tea.js) and the probe (tools/tea-hand-probe.mjs) play the same clips the same way.
   The glb carries only turns for the bones the drink moves (spine, neck, head, both arms), as the bones' own local turns, so
   the legs, the hips and the robe stay the sit's. Its scene's extras hold the timeline the build wrote: the clips' times, the
   frame the hand lifts the cup, the stream, the lips, and the cup's place in the right hand (the Child Of the build switches
   to), so the cup the page draws sits where Blender held it. */
export const DRINK_URL = "/between/m/dusk/tea-drink.glb";
export const FADE = { cut: 0.12, join: 0.5, onset: 0.4 };   // crossfades (s): between clips cut from one bake, into a sip from the hold, off the sit

const smooth = k => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));

/* The run of clips for a mode: "pour" is the whole drink (reach to settle), "sip" one more sip from the hold; both end in
   the hold, which loops. Each entry: the clip, where it starts in the run, how long it is. */
function runOf(tl, mode) {
  const by = Object.fromEntries(tl.clips.map(c => [c.name, c]));
  const names = mode === "sip" ? ["sip"] : ["reach", "pour", "lift", "savour", "sip1", "sip2", "sip3", "settle"];
  let at = 0;
  const run = names.map(n => { const c = by[n], r = { name: n, at, len: c.end - c.start, from: c.start }; at += r.len; return r; });
  return { run, end: at, hold: by.hold };
}

/* The drink's numbers from a parsed glb (GLTFLoader's result). */
export function drinkFrom(gltf) {
  const tl = JSON.parse((gltf.scene && gltf.scene.userData && gltf.scene.userData.tea_drink) || "null");
  if (!tl) throw new Error("tea-drink.glb has no timeline");
  const keep = new Set(tl.driven);
  const clips = {};
  for (const a of gltf.animations) {
    const c = a.clone();
    c.tracks = c.tracks.filter(t => keep.has(t.name.split(".")[0]) && t.name.endsWith(".quaternion"));
    c.name = a.name.replace(/^Clip_/, "");
    clips[c.name] = c;
  }
  return { tl, clips };
}

/* What the drink is doing at t seconds into a run, as the page's beats: the phase (reach, pour, back, sip, set, done), the
   stream, whether the cup is in the hand, the savour (0..1, after each sip once the cup is coming down), and whether the
   cup is at the lips. Run time past the end is the hold. */
export function beatAt(tl, mode, t) {
  const { run, end } = runOf(tl, mode), at = Math.max(0, t || 0);
  const out = { phase: "done", done: at >= end, stream: 0, pour: 0, inHand: true, savor: 0, lips: false, sip: 0, clip: "hold" };
  if (at >= end) return out;
  const r = run.find(x => at < x.at + x.len) || run[run.length - 1], u = at - r.at, T = r.from + u;   // T: time on the build's timeline
  out.clip = r.name;
  out.phase = { reach: "reach", pour: "pour", lift: "back", settle: "set" }[r.name] || "sip";
  out.inHand = T >= tl.grab;
  if (r.name === "pour") { out.pour = u / r.len; out.stream = T >= tl.stream[0] && T <= tl.stream[1] ? 1 : 0; }
  const sipName = /^sip/.test(r.name) ? r.name : null;
  if (sipName) {
    out.sip = r.name === "sip" ? 1 : +r.name.slice(3);
    const L = tl.lips[sipName]; out.lips = T >= L[0] && T <= L[1];
    const k = (u - tl.savour[0]) / (tl.savour[1] - tl.savour[0]);   // the savour swells as the cup lands in the lap, gone by the next
    out.savor = k > 0 && k < 1 ? Math.sin(k * Math.PI) ** 2 : 0;
  }
  return out;
}

/* A player on one figure: the mixer on a stand-in of its driven bones, every clip an action, and apply(mode, t) to set the pose for that moment.
   The weights are set from the run time each call (no clock inside), so a probe that holds a moment and the page that plays
   through it draw the same pose: within FADE.cut of a clip's start it crossfades from the clip before (held at its end), the
   extra sip crossfades from the hold where the hold was, and the first FADE.onset seconds ease off the pose the figure had
   (the sit, with its own breath). */
export function drinkPlayer(THREE, drink, root) {
  /* The mixer drives a stand-in of the driven bones, copied onto the figure's bones after each update: a three.js mixer only
     writes a bone when its own result changes, and the page's pose() rewrites the arms and the spine every frame, so a held
     moment (a hold, a probe's freeze) would otherwise show the sit, not the drink. */
  const { tl, clips } = drink, proxy = new THREE.Object3D(), acts = {};
  for (const n of tl.driven) { const o = new THREE.Object3D(); o.name = n; proxy.add(o); }
  const mixer = new THREE.AnimationMixer(proxy);
  for (const [n, c] of Object.entries(clips)) {
    const a = mixer.clipAction(c); a.setLoop(n === "hold" ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); a.clampWhenFinished = true;
    a.enabled = true; a.setEffectiveWeight(0); a.play(); acts[n] = a;
  }
  const pairs = tl.driven.map(n => [root.getObjectByName(n), proxy.getObjectByName(n)]).filter(([b]) => b);
  const bones = pairs.map(([b]) => b);
  const before = bones.map(() => new THREE.Quaternion());
  const holdLen = tl.hold[1] - tl.hold[0];
  let holdFrom = 0;   // where the hold was when "Take a sip" crossfades out of it
  const set = (n, time, w) => { const a = acts[n]; a.time = Math.max(0, Math.min(time, a.getClip().duration - 1e-4)); a.setEffectiveWeight(w); };
  return {
    mixer, acts,
    /* mode "pour" or "sip"; t seconds into the run; hold: seconds the hold has looped (for the held cup after the run). */
    apply(mode, t, { holdT = null, onset = true } = {}) {
      bones.forEach((b, i) => before[i].copy(b.quaternion));
      for (const a of Object.values(acts)) a.setEffectiveWeight(0);
      const { run, end } = runOf(tl, mode), at = Math.max(0, t);
      if (at >= end || holdT != null) {
        const h = holdT != null ? holdT : at - end;
        set("hold", ((h % holdLen) + holdLen) % holdLen, 1);
      } else {
        const i = Math.max(0, run.findIndex(x => at < x.at + x.len)), r = run[i], u = at - r.at;
        const fade = mode === "sip" && i === 0 ? FADE.join : FADE.cut, k = i === 0 && mode !== "sip" ? 1 : smooth(u / fade);
        set(r.name, u, k);
        if (k < 1) { if (i > 0) set(run[i - 1].name, run[i - 1].len, 1 - k); else set("hold", holdFrom, 1 - k); }
      }
      mixer.update(0);
      const k = onset && mode === "pour" && at < FADE.onset ? smooth(at / FADE.onset) : 1;
      pairs.forEach(([b, p], i) => { if (k < 1) b.quaternion.slerpQuaternions(before[i], p.quaternion, k); else b.quaternion.copy(p.quaternion); });
    },
    /* "Take a sip" from the hold: remember where the hold was, so the sip crossfades out of that pose. */
    leaveHold(holdT) { holdFrom = ((holdT % holdLen) + holdLen) % holdLen; },
    end: mode => runOf(tl, mode).end,
    holdLen,
  };
}

/* The cup in the right hand where the build's Child Of holds it: its middle and turn in the wrist's frame (metres, three.js's
   cup: +Y up, its ear +X), and its turn on the stone in the figure's frame, so it does not swing when the hand lifts it. */
export function cupInHand(tl) { return { p: tl.cupInWrist.p, q: tl.cupInWrist.q, stone: tl.cupStone.q }; }
