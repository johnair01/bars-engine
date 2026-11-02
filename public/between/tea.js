/* The cup by the fire, slice 1 of between-tea-1 (the solo cup): the kettle stands on a flat stone at the hearth and the cup
   sits in the right hand of whoever is sat there, so a pour is a code-made pose over the sit the same way the sit is a
   code-made pose over the walk (stance.js). The numbers are tea-pose.js, which the probes read without a browser.
   No qi, no shelf and no music yet: the free cup the pass's definition of done asks for, so a person who has worked through
   nothing can still sit down and pour.
   bt-tea-needs-a-spot: both shells' placements are full and roomWrite refuses a fixed spot, so the kettle is drawn here at the
   fire, from the moment the room is built, with the cup on its stone. bt-cup-is-the-figure: the cup is parented to the right
   wrist and marked noPaint, so the paint pass leaves it to the figure's own light (a cup lit by the room alone reads as a dark
   shape). Look tea-look-2 (his note 2026-10-29, "Cup isn't showing up in players hands"): the cup rides the hand, upright,
   and stays held in the lap after the pour until you stand, when it goes back on the stone. His look on it (2026-10-29: "The arm
   should move slowly as if someone is enjoying the tea. Maybe even a little effect of enlightenment and enjoyment"): the beats
   are slow (tea-pose.js TEA), steam rises from a full cup, and after each sip the figure savours it: the head lifts, the chest
   opens, a warm glow comes up round the head and a few motes of light drift up from the heart. Look tea-cup-look-3 (his note
   2026-10-29): the cup passed through the hands and the table clipped the robe and the arms, so the cup is held by its side
   (GRIP) and the kettle's table stone stands beside the seat, clear of the figure along the whole pour (tools/tea-hand-probe.mjs).
   Round 5 (his choice on look tea-drink-look-1): the drink is authored in Blender (art/between/tea-drink/build.py) and baked to
   clips (m/dusk/tea-drink.glb) that tea-drink.js plays on the figure with an AnimationMixer: the reach, the pour, the lift with
   the left hand coming up under the cup, a pause under the nose, three sips that tip the cup further each time with the head
   bowing to meet it, the settle, and a breathing hold. The cup rides the right wrist where the build's Child Of held it. Round 4's
   pose blending (tea-pose.js) stays reachable with ?drink=r4, for the side by side. */
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { teaAt, sipAt, HAND, GRIP, KETTLE, CUP, TOTAL, TEA, kettleAt } from "./tea-pose.js";
import { DRINK_URL, drinkFrom, drinkPlayer, beatAt, cupInHand } from "./tea-drink.js";

/* ?drink=r4 plays round 4's pose blending instead of the baked drink (the side by side). */
const R4 = typeof location !== "undefined" && new URLSearchParams(location.search).get("drink") === "r4";
const SKIP_R4 = TEA.reach + TEA.pour + TEA.back - 0.4;   // ?tea=sip: where each drink's first sip starts (s into the pour)
const SKIP_R5 = 0.6;                                     // round 5: this far past the first sip's start, the cup on its way from the nose to the lips

const IRON = 0x332f2c, STONE = 0x6a645c, CLAY = 0xd8c8ae, AMBER = 0xd9a24a, GLOW = 0xffc874;
const TEA_FULL = TEA.streamTo;   // of the pour beat: the cup counts as full once the stream stops
const STEAM = { n: 4, rise: 0.22, life: 2.6 }, MOTES = 7;   // wisps over the cup (m, s); motes of the savour

/* One room's kettle and cup. place(seat) moves the kettle to a seat; attach(body) puts the cup in that figure's hand. */
export function buildTea({ THREE, scene, seat, groundY = () => 0 }) {
  const up = new THREE.Vector3(0, 1, 0);
  const g = new THREE.Group(); scene.add(g);
  const iron = new THREE.MeshStandardMaterial({ color: IRON, roughness: 0.55, metalness: 0.35 });
  const rock = new THREE.MeshStandardMaterial({ color: STONE, roughness: 0.95 });
  const clay = new THREE.MeshStandardMaterial({ color: CLAY, roughness: 0.6 });

  const base = new THREE.Group(); g.add(base);            // the stone, the pot and its spout, in the kettle's own frame
  const stone = new THREE.Mesh(new THREE.CylinderGeometry(KETTLE.stone[0], KETTLE.stone[1], 1, 12), rock); base.add(stone);
  const pot = new THREE.Group(); base.add(pot);
  const body = new THREE.Mesh(new THREE.SphereGeometry(KETTLE.body, 14, 10), iron); body.scale.y = 0.82; body.position.y = 0.075; pot.add(body);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.02, 12), iron); lid.position.y = 0.16; pot.add(lid);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.024, 0.17, 8), iron);   // along the pot's -x, toward the seat
  spout.position.set(-0.095, 0.135, 0); spout.rotation.z = 0.9; pot.add(spout);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.009, 6, 12, Math.PI), iron);
  handle.position.set(0.02, 0.17, 0); handle.rotation.set(0, 0, 0); pot.add(handle);
  const lipAt = new THREE.Object3D(); lipAt.position.set(-KETTLE.spout, KETTLE.lipH, 0); pot.add(lipAt);   // where the tea comes out

  const cup = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(CUP.r, CUP.r * 0.78, CUP.h, 14), clay); cup.add(bowl);
  const ear = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 10), clay); ear.position.set(CUP.r * 0.9, 0.004, 0); ear.rotation.y = Math.PI / 2; cup.add(ear);
  cup.traverse(o => { o.userData.noPaint = true; });
  g.add(cup);

  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 1, 6, 1, true),
    new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.7, depthWrite: false }));
  stream.visible = false; scene.add(stream);

  /* Steam off a full cup, and the savour's glow: soft sprites on one radial texture, additive so they read as light. */
  const soft = (() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  })();
  const sprite = (color, opacity) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false })); m.userData.noPaint = true; m.visible = false; scene.add(m); return m; };
  const steam = Array.from({ length: STEAM.n }, () => sprite(0xf2e8dc, 0));
  const halo = sprite(GLOW, 0), motes = Array.from({ length: MOTES }, () => sprite(GLOW, 0));
  const seed = Array.from({ length: MOTES }, (_, i) => ({ a: i * 2.39996, r: 0.05 + (i % 3) * 0.025, d: i / MOTES }));

  const J = {};   // the held figure's bones, looked up once on attach
  let drink = null, player = null, holdT0 = 0, skipTo = 0;   // round 5: the baked clips, their player on the held figure
  if (!R4 && typeof document !== "undefined") new GLTFLoader().load(DRINK_URL, g => { try { drink = drinkFrom(g); } catch (e) { console.warn("tea drink:", e.message); } }, undefined, () => console.warn("tea drink: no clips, round 4's drink plays"));
  const r5 = () => !R4 && !!drink;
  let frozen = null, lastT = null;   // frozen: a probe holds the beat at that many seconds in (freeze())
  let seatNow = seat, attached = null, t0 = null, mode = "pour", held = false, stoneH = 0.04, full = false, glowK = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), dir = new THREE.Vector3(), ws = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0), gv = new THREE.Vector3();
  const qp = new THREE.Quaternion(), qt = new THREE.Quaternion(), eu = new THREE.Euler(), hp = new THREE.Vector3(), cp = new THREE.Vector3();

  /* The kettle on its table stone beside the seat, to the right and a little ahead, where the probe says the figure stays clear
     of it (tea-pose.js KETTLE, tools/tea-hand-probe.mjs): the stone's top KETTLE.top over the seat's top, whatever the ground. */
  function place(s) {
    if (!s) return;
    seatNow = s;
    const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw), lx = fz, lz = -fx;   // the figure's facing, and its left
    const k = kettleAt(), kx = s.x + lx * k.x + fx * k.z, kz = s.z + lz * k.x + fz * k.z;
    const gy = groundY(kx, kz);
    stoneH = Math.max(0.04, s.top + KETTLE.top - gy);
    base.position.set(kx, gy, kz);
    const ux = s.x - kx, uz = s.z - kz, ul = Math.hypot(ux, uz) || 1;
    base.rotation.y = Math.atan2(uz / ul, -ux / ul);        // the spout (the pot's -x) turns toward whoever sits
    stone.scale.y = stoneH; stone.position.y = stoneH / 2;
    pot.position.y = stoneH;
    if (!attached) putDown();
  }
  /* The cup on the stone, under the spout on the side toward the seat: where the tea is poured into it, and where it stays
     until the hand has it. */
  function putDown() {
    if (cup.parent !== g) g.add(cup);
    base.updateMatrix();
    cup.position.set(-KETTLE.spot, stoneH + CUP.h / 2, 0).applyMatrix4(base.matrix);
    cup.quaternion.identity(); cup.scale.setScalar(1); cup.visible = true;
  }

  /* The cup goes to the right hand once the hand is on it (the back beat): HAND past the wrist joint, along the hand, and then
     GRIP out through the palm, so the hand holds its side (tea-cup-look-3: the cup passed through the hands). A figure without
     a wrist bone keeps it at the elbow's end. */
  function attach(body3d) {
    const o = body3d && body3d.holder;
    const wrist = o && o.getObjectByName("wristR"), bone = wrist || (o && o.getObjectByName("elbowR"));
    if (!bone) return false;
    attached = body3d; J.hand = bone; J.along = wrist ? HAND : 0.3; J.wrist = wrist; player = null;
    for (const n of ["shoulderR", "elbowR", "neck", "spine", "head"]) J[n] = o.getObjectByName(n);
    return true;
  }
  /* In the hand, its side against the palm: `grip` is the way the palm faces, in the figure's frame (x left, z ahead). */
  function inHand(grip, tilt) {
    if (cup.parent !== J.hand) J.hand.add(cup);
    orient(tilt);
    const k = attached.scale || 1;
    J.hand.localToWorld(a.set(0, J.along, 0));
    attached.holder.getWorldQuaternion(qt);
    gv.set(grip.x, 0, grip.z).normalize().applyQuaternion(qt).multiplyScalar(GRIP * k);
    cup.position.copy(J.hand.worldToLocal(a.add(gv)));
  }
  function detach() { attached = null; player = null; held = false; t0 = null; full = false; glowK = 0; stream.visible = false; putDown(); for (const m of [...steam, halo, ...motes]) m.visible = false; }

  /* Upright in the figure's frame, tipped `tilt` about its left-right line, and sized in metres at the figure's scale,
     whatever the forearm's turn and the build's bone scales. */
  function orient(tilt) {
    const par = cup.parent; if (!par || !attached) return;
    attached.holder.updateMatrixWorld(true);
    attached.holder.getWorldQuaternion(qt).multiply(qp.setFromAxisAngle(X, tilt));
    par.getWorldQuaternion(qp);
    cup.quaternion.copy(qp.invert().multiply(qt));
    par.getWorldScale(ws); const k = attached.scale || 1;
    cup.scale.set(k / ws.x, k / ws.y, k / ws.z);
  }

  /* Each frame after pose(), while the cup is in a hand: the arm turns for the beat (or the lap, once poured), the cup's
     tilt, and the stream while it pours. Returns the beat, or null with nothing in hand. */
  let last = null;
  function tick(t) {
    if (!attached) return null;
    let s;
    const dt = lastT == null ? 0 : Math.min(0.1, Math.max(0, t - lastT)); lastT = t;
    if (!R4 && !drink && J.wrist) { if (t0 != null) t0 += dt; return null; }   // the clips are still loading: the drink waits for them
    if (r5() && J.wrist) return tick5(t, dt);
    if (skipTo) { t0 -= skipTo === "sip" ? SKIP_R4 : skipTo; skipTo = 0; }
    if (t0 != null) { s = (mode === "sip" ? sipAt : teaAt)(frozen != null ? frozen : t - t0); if (s.done) { t0 = null; held = true; } }
    else s = teaAt(TOTAL + 1);
    const S = J.shoulderR, E = J.elbowR;
    if (S) S.quaternion.multiply(qt.setFromEuler(eu.set(s.arm.sx, s.arm.sy || 0, s.arm.sz, "XYZ")));   // after pose(), so it sits on the sit
    if (E) E.quaternion.multiply(qt.setFromEuler(eu.set(s.arm.ex, 0, 0, "XYZ")));
    /* The savour: the head lifts and the chest opens a little (neck and spine X back, read off the rig). */
    const sv = s.savor || 0, N = J.neck, Sp = J.spine, lean = s.arm.lean || 0;
    if (Sp && lean) Sp.quaternion.multiply(qt.setFromAxisAngle(X, lean));   // the body bends a little toward the stone
    if (sv > 0.001) {
      if (N) N.quaternion.multiply(qt.setFromAxisAngle(X, -0.22 * sv));
      if (Sp) Sp.quaternion.multiply(qt.setFromAxisAngle(X, -0.05 * sv));
    }
    if (s.phase === "reach" || s.phase === "pour") { if (cup.parent !== g) putDown(); }   // on the stone until the hand has it
    else inHand(s.grip || { x: 1, z: 0 }, s.tilt);
    if (s.phase === "pour" ? s.pour > TEA_FULL : s.phase !== "reach") full = true;   // poured into once, it stays full
    glow(t, sv, dt); last = { phase: s.phase, savor: sv, up: s.up || 0, pour: s.pour || 0, glow: glowK, full, steam: steam.map(m => [m.visible, +m.material.opacity.toFixed(2), m.position.toArray().map(x => +x.toFixed(2))])[0], halo: [halo.visible, +halo.material.opacity.toFixed(2)] };
    if (s.stream) {
      lipAt.getWorldPosition(a); cup.getWorldPosition(b);
      dir.subVectors(a, b); const len = dir.length();
      if (len > 1e-4) {
        stream.visible = true; stream.position.copy(b).addScaledVector(dir, 0.5);
        stream.quaternion.setFromUnitVectors(up, dir.normalize()); stream.scale.y = len;
      }
    } else stream.visible = false;
    return s;
  }

  /* Round 5: the baked drink. The player sets the arms, the spine, the neck and the head for the moment (after pose(), so it
     sits on the sit); the cup is on the stone until the hand lifts it, then in the right wrist at the build's Child Of offset. */
  function tick5(t, dt) {
    if (!player) player = drinkPlayer(THREE, drink, attached.holder);
    if (skipTo) { t0 -= skipTo === "sip" ? drink.tl.beats.sip1 + SKIP_R5 : skipTo; skipTo = 0; }
    let s;
    if (t0 != null) {
      const run = frozen != null ? frozen : t - t0;
      s = beatAt(drink.tl, mode, run);
      player.apply(mode, run);
      if (s.done && frozen == null) { holdT0 = t - (run - player.end(mode)); t0 = null; held = true; }
    } else {
      s = beatAt(drink.tl, "sip", Infinity);
      player.apply("sip", Infinity, { holdT: t - holdT0 });
    }
    if (s.inHand) inHand5(); else onStone5();
    if (s.phase === "pour" ? s.pour > TEA_FULL : s.phase !== "reach") full = true;
    glow(t, s.savor, dt);
    last = { phase: s.phase, clip: s.clip, savor: s.savor, up: s.lips ? 1 : 0, pour: s.pour || 0, glow: glowK, full, drink: "r5", steam: steam.map(m => [m.visible, +m.material.opacity.toFixed(2), m.position.toArray().map(x => +x.toFixed(2))])[0], halo: [halo.visible, +halo.material.opacity.toFixed(2)] };
    if (s.stream) {
      lipAt.getWorldPosition(a); cup.getWorldPosition(b);
      dir.subVectors(a, b); const len = dir.length();
      if (len > 1e-4) { stream.visible = true; stream.position.copy(b).addScaledVector(dir, 0.5); stream.quaternion.setFromUnitVectors(up, dir.normalize()); stream.scale.y = len; }
    } else stream.visible = false;
    return s;
  }
  function inHand5() {
    const w = J.wrist, held5 = cupInHand(drink.tl), k = attached.scale || 1;
    if (cup.parent !== w) w.add(cup);
    w.updateMatrixWorld(true); w.getWorldScale(ws);
    cup.position.set(held5.p[0] * k / ws.x, held5.p[1] * k / ws.y, held5.p[2] * k / ws.z);
    cup.quaternion.set(...held5.q); cup.scale.set(k / ws.x, k / ws.y, k / ws.z);
  }
  function onStone5() {   // where putDown() stands it, turned as the hand will hold it, so the lift does not swing it
    if (cup.parent !== g) putDown();
    attached.holder.getWorldQuaternion(qt); cup.quaternion.copy(qt).multiply(qp.set(...cupInHand(drink.tl).stone));
  }

  /* Steam while the cup is full, the halo round the head and motes drifting up from the heart while the savour lasts. */
  function glow(t, sv, dt) {
    glowK += (sv - glowK) * Math.min(1, dt * 5);          // eased again, so a frame drop never pops it
    cup.getWorldPosition(cp); const k = attached.scale || 1;
    steam.forEach((m, i) => {
      const ph = ((t / STEAM.life) + i / STEAM.n) % 1;
      m.visible = full && !!soft;
      m.position.set(cp.x + Math.sin(t * 0.9 + i * 1.7) * 0.012 * k, cp.y + (CUP.h * 0.5 + ph * STEAM.rise) * k, cp.z + Math.cos(t * 0.7 + i) * 0.012 * k);
      m.scale.setScalar((0.04 + ph * 0.09) * k); m.material.opacity = 0.5 * Math.sin(ph * Math.PI);
    });
    const head = J.head, sp = J.spine;
    const on = glowK > 0.01 && !!soft && head;
    halo.visible = !!on; motes.forEach(m => { m.visible = !!on; });
    if (!on) return;
    head.getWorldPosition(hp); hp.y += 0.16 * k;
    halo.position.copy(hp); halo.scale.setScalar((0.8 + 0.3 * glowK) * k); halo.material.opacity = 0.75 * glowK;
    if (sp) sp.getWorldPosition(cp); else cp.copy(hp);
    motes.forEach((m, i) => {
      const q = seed[i], ph = (t * 0.18 + q.d) % 1;
      m.position.set(cp.x + Math.cos(q.a + t * 0.4) * q.r * k, cp.y + (0.25 + ph * 0.6) * k, cp.z + Math.sin(q.a + t * 0.4) * q.r * k);
      m.scale.setScalar(0.05 * k); m.material.opacity = glowK * Math.sin(ph * Math.PI);
    });
  }

  place(seat);
  return {
    group: g, cup, kettle: base,
    place, attach, detach,
    /* skip: seconds into the pour to start at, or "sip" for the first sip of whichever drink plays (?tea=sip). */
    pour(t, skip = 0) { if (t0 != null || held) return false; t0 = t; skipTo = skip; mode = "pour"; stream.visible = false; return true; },
    sip(t) { if (t0 != null || !held) return false; if (player) player.leaveHold(t - holdT0); t0 = t; mode = "sip"; return true; },
    stop() { detach(); },
    running: () => t0 != null,
    state: () => last,   // the beat drawn last frame, for the probes
    freeze(sec) { frozen = sec; },   // probes only: hold the beat at sec seconds in (null lets it run)
    holding: () => !!attached,
    player: () => player,   // probes only: round 5's player on the held figure
    tick,
    total: TOTAL,
  };
}
