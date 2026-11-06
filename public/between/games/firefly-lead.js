/* Firefly lead (Flirtcraft's game at stage 1; canon/mechanics/firefly-lead.yaml; FR-019). Live, face to face on the dais: each
   friend raises a hand and draws a stream of fireflies through the air; the other phone draws it a breath behind. Where the two
   streams cross the Wisp between them brightens and hums. Lowering a hand stops that stream on both screens at once. Nothing is
   kept unless the two held it for thirty seconds, and then only that a dance happened (the crossings are never shown).
   The Between has no socket, so a raised hand speeds the existing poll to 250 ms and the finger's path rides on presence. */
import { DANCE_MIN_MS, DANCE_MAX_MS, POLL_LIVE_MS, TRAIL_S, CROSS_M, DELAY_MS, FLIES, COPY, betweenDay } from "./core.js";

const DAIS_R = 2.5, DAIS_Y = 0.28, Y0 = DAIS_Y + 1.35;

export function create(X) {
  const { THREE, scene } = X;
  const G = new THREE.Group(); G.name = "firefly-lead"; scene.add(G);
  const reduce = !!(matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.3, "rgba(255,255,255,.5)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();

  const stream = colour => {
    const flies = []; for (let i = 0; i < FLIES; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: colour, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(0.42); s.visible = false; G.add(s); flies.push({ s, born: -9, pos: new THREE.Vector3() }); }
    return { flies, next: 0, colour };
  };
  const emit = (st, x, y, z, t) => {
    // a finger moves faster than it is sampled: fill the gap with fireflies so the stream reads as a line, not as sparks
    const last = st.last; st.last = { x, y, z, t };
    if (last && t - last.t < 0.2) { const d = Math.hypot(x - last.x, y - last.y, z - last.z), n = Math.min(5, Math.floor(d / 0.09)); for (let k = 1; k <= n; k++) put(st, last.x + (x - last.x) * k / (n + 1), last.y + (y - last.y) * k / (n + 1), last.z + (z - last.z) * k / (n + 1), last.t + (t - last.t) * k / (n + 1)); }
    return put(st, x, y, z, t);
  };
  const put = (st, x, y, z, t) => { const f = st.flies[st.next++ % FLIES]; f.born = t; f.pos.set(x, y, z); f.s.position.copy(f.pos); f.s.visible = true; return f; };
  const mine = stream(0x6fe0c8), theirs = stream(0xe28fcf);
  const wisp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xfff0c0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); wisp.scale.setScalar(1.2); G.add(wisp);

  let up = false, t0 = 0, outbox = [], heldMs = 0, lastTick = performance.now(), crossings = 0, glow = 0, hum = null, wrote = false, startedAt = 0, lastEmit = 0;
  const rem = { up: false, t0: -1, off: null, queue: [], lastT: -1, lastUp: false };
  let wasBoth = false;

  const onDais = p => !!p && Math.hypot(p.x, p.z) < DAIS_R - 0.15;
  const friend = () => X.other();
  const together = () => { const q = friend() && X.peerPos(friend()); return onDais(X.player()) && onDais(q); };

  /* ---- the finger: a ray from the camera to a plane at hand height over the dais ---- */
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -Y0), hit = new THREE.Vector3();
  function fingerAt(cx, cy) {
    const r = X.renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), X.camera);
    if (!ray.ray.intersectPlane(plane, hit)) return null;
    const d = Math.hypot(hit.x, hit.z); if (d > DAIS_R + 0.9) { hit.x *= (DAIS_R + 0.9) / d; hit.z *= (DAIS_R + 0.9) / d; }
    return hit;
  }
  let down = false;
  function onPointer(e) {
    if (!up) return;
    const onCanvas = e.target === X.renderer.domElement;
    if (e.type === "pointerdown") { if (!onCanvas) return; down = true; }
    if (e.type === "pointerup" || e.type === "pointercancel") { down = false; return; }
    if (e.type === "pointerdown" && onCanvas) { e.stopImmediatePropagation(); }
    if (!onCanvas) return;
    if (e.pointerType !== "mouse" && !down) return;
    const now = performance.now(); if (now - lastEmit < 28) { e.stopImmediatePropagation(); return; } lastEmit = now;
    const p = fingerAt(e.clientX, e.clientY); if (!p) return;
    e.stopImmediatePropagation();
    emit(mine, p.x, p.y, p.z, now / 1000);
    outbox.push([p.x, p.y, p.z, now - t0]);
    if (window.__ffLog) window.__ffLog.sent.push([Math.round(now - t0), Date.now()]);   // a measuring run's own log (never set on a player's page)
  }
  for (const ev of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) addEventListener(ev, onPointer, true);

  /* ---- the hand ---- */
  function raise() {
    up = true; t0 = performance.now(); outbox = []; startedAt = t0; heldMs = 0; crossings = 0; wrote = false; wasBoth = false;
    try { if (!reduce) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) { const c = hum ? hum.c : new AC(), o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = 196; g.gain.value = 0; o.connect(g); g.connect(c.destination); o.start(); hum = { c, o, g }; } } } catch {}
    X.poke();
  }
  function lower() {
    up = false; outbox = []; down = false; endDance();
    if (hum) { try { hum.o.stop(); hum.c.close(); } catch {} hum = null; }
    X.poke();
  }
  function endDance() {
    // a dance both held for thirty seconds or more leaves one record, written by the lower id so it is written once
    const a = X.me(), b = friend();
    if (!wrote && heldMs >= DANCE_MIN_MS && b && a < b) {
      wrote = true; const day = betweenDay(X.g(), X.now());
      if (!X.items().some(i => i.kind === "dance" && i.day === day)) X.write("items/dance-" + day, "set", { kind: "dance", by: a, pair: [a, b], day, at: X.now(), ms: Math.round(heldMs), crossings });
    }
    heldMs = 0;
  }
  X.extra.f = () => (X.active("firefly-lead") ? { up, t0: Math.round(t0), p: outbox.splice(0) } : undefined);

  /* ---- their stream ---- */
  function takeRemote() {
    const o = friend(), raw = o && X.raw(o), f = raw && raw.f;
    rem.up = !!(f && f.up);
    if (!f) { rem.queue = []; return; }
    if (f.t0 !== rem.t0) { rem.t0 = f.t0; rem.off = null; rem.queue = []; rem.lastT = -1; }
    const now = performance.now();
    for (const q of f.p || []) {
      if (q[3] <= rem.lastT) continue; rem.lastT = q[3];
      if (window.__ffLog) window.__ffLog.got.push([q[3], Date.now()]);
      const off = now - q[3]; rem.off = rem.off === null ? off : Math.min(rem.off, off);
      rem.queue.push({ at: q[3] + rem.off + DELAY_MS, q });
    }
    if (rem.queue.length > 160) rem.queue.splice(0, rem.queue.length - 160);
  }
  function playRemote(now) {
    while (rem.queue.length && rem.queue[0].at <= now) { const { q } = rem.queue.shift(); emit(theirs, q[0], q[1], q[2], now / 1000); }
    if (!rem.up && rem.lastUp) { rem.queue = []; for (const f of theirs.flies) f.born = -9; }   // a lowered hand stops that stream at once
    rem.lastUp = rem.up;
  }

  /* ---- the stand-in friend for a preview: leads a slow loop, then follows, and crosses the player's stream ---- */
  function standin(now) {
    if (!X.standin || !up) { if (X.standin && rem.up) { rem.up = false; rem.lastUp = true; } return; }
    rem.up = true; rem.lastUp = true;
    const s = (now - startedAt) / 1000, b = 0.0; void b;
    const x = Math.cos(s * 0.9) * 1.1 + Math.sin(s * 0.37) * 0.5, z = Math.sin(s * 1.3) * 0.9 + 0.2;
    if (now - (standin.last || 0) > 28) { standin.last = now; emit(theirs, x, Y0 + Math.sin(s * 0.8) * 0.25, z, now / 1000); }
  }

  function moment() {
    if (!X.active("firefly-lead")) return null;
    const o = friend(); if (!o) return null;
    if (up) return { head: X.name(o), sub: "", soft: true, key: "up", actions: [{ label: COPY.lower, quiet: true, on: lower }] };
    if (!together()) return null;
    return { head: X.name(o), sub: "", soft: true, key: "raise", actions: [{ label: COPY.raise, on: raise }] };
  }

  function frame(T) {
    const now = performance.now(), dt = Math.min(0.1, (now - lastTick) / 1000); lastTick = now; const t = now / 1000;
    takeRemote(); standin(now); playRemote(now);
    // one friend's side lowered, or off the dais, ends it on this phone too
    if (up && !onDais(X.player())) lower();
    if (up) {
      const both = rem.up && together();
      if (both) heldMs += dt * 1000; else if (wasBoth && !rem.up) { endDance(); }
      if (!both && wasBoth && heldMs >= DANCE_MIN_MS) endDance();
      wasBoth = both;
      if (now - startedAt > DANCE_MAX_MS) lower();
    }
    if (up || rem.up) X.wantPoll("firefly", POLL_LIVE_MS); else X.wantPoll("firefly", 0);
    // the fireflies fade over the trail
    let live = 0;
    for (const st of [mine, theirs]) for (const f of st.flies) {
      const age = t - f.born; if (age > TRAIL_S || age < 0) { f.s.visible = false; continue; }
      f.s.material.color.set(st.colour); f.s.material.opacity = reduce ? 0.7 * (1 - age / TRAIL_S) : 0.95 * (1 - age / TRAIL_S) ** 1.4; f.s.position.y = f.pos.y + (reduce ? 0 : age * 0.05); f.s.visible = true; live++;
    }
    // crossings: a firefly of each within a quarter metre brightens the Wisp between the two
    let hit = false;
    if (up && rem.up) for (const a of mine.flies) { if (!a.s.visible) continue; for (const b of theirs.flies) { if (!b.s.visible) continue; if (a.pos.distanceTo(b.pos) < CROSS_M) { hit = true; break; } } if (hit) break; }
    if (hit) { glow = Math.min(1, glow + dt * 2.2); if (!X._crossGate || now - X._crossGate > 400) { X._crossGate = now; crossings++; } } else glow = Math.max(0, glow - dt * 0.6);
    const p = X.player(), q = friend() && X.peerPos(friend());
    if (p && q && (up || rem.up)) { wisp.position.set((p.x + q.x) / 2, 1.35, (p.z + q.z) / 2); wisp.material.opacity = 0.12 + glow * 0.8; wisp.scale.setScalar(0.9 + glow * 1.6); }
    else wisp.material.opacity = 0;
    if (hum) hum.g.gain.value += (glow * 0.025 - hum.g.gain.value) * 0.1;
    void live;
  }
  function dispose() { lower(); for (const ev of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) removeEventListener(ev, onPointer, true); scene.remove(G); }
  return { frame, moment, dispose, raise, lower, view: () => ({ up, remoteUp: rem.up, heldMs: Math.round(heldMs), crossings, together: together(), queue: rem.queue.length, off: rem.off }), _stream: () => ({ mine, theirs }) };
}
