// The cultivation figure as the Between's player body (Wendell's B on hc-checkin-look-1, 2026-11-09: "have the
// cultivation model be here"; and his A on hw5-hearth-give-look-2, the same figure in the nook). One adapter, shared by
// the hollow check-in and the nook's give: makeCultBody returns the shape garden.js makeBody returns, so garden.js can
// hold either figure the same way.
//
//   { holder, mixer, isPlayer, scale, dressed, cult, stance, setWalking, wave, pose(t, dt, wantSit, wantRest, seatAt),
//     breathe(k), hold(on), give() }
//
// The figure is walker.js's: built in the page from make/ (UBC body, shells, accessories), the walk drawn by aiming the
// limbs. breathe(k) lifts the forearms toward chest height, palms up (the first part of Holding Up the Sky): k 0 is the
// standing rest, 1 the top of the in-breath. hold(on) puts a small ember of light between the hands.
//
// Sitting and the give belong to the nook's kneel (kneel.js, from the hearth-give round). It plugs in with useKneel(fn),
// fn(walker) -> { sit(seatAt), stand(), give(), update(t, dt), kneeling }; without it a sit request leaves her standing.
import * as THREE from "three";
import * as FG from "./make/figure.js";
import { makeWalker } from "./walker.js";

let KNEEL = null;
export function useKneel(fn) { KNEEL = fn; }

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const ease = x => x * x * (3 - 2 * x);

export async function makeCultBody({ who = "f", outfit = "B2", ring = null, ringR = 0.42, ringW = 0.09, ringA = 0.85 } = {}) {
  const W = await makeWalker({ who, outfit });
  const F = W.X.F, holder = W.holder;
  /* garden.js turns a body by holder.rotation.y = yaw + FACE with FACE = 0: the figure must face +z in the holder. The
     figure faces F.fr.f; turn the figure's root to +z and turn its body frame with it, so every aim stays in holder space. */
  const turn = -Math.atan2(F.fr.f.x, F.fr.f.z);
  if (Math.abs(turn) > 1e-3) {
    F.root.rotation.y = turn;
    F.fr.f.applyAxisAngle(V(0, 1, 0), turn); F.fr.l.applyAxisAngle(V(0, 1, 0), turn);
    F.root.updateMatrixWorld(true);
  }
  if (ring != null) {
    const r = new THREE.Mesh(new THREE.RingGeometry(ringR, ringR + ringW, 40), new THREE.MeshBasicMaterial({ color: ring, transparent: true, opacity: ringA, side: THREE.DoubleSide, depthWrite: false }));
    r.rotation.x = -Math.PI / 2; r.position.y = 0.02; holder.add(r);
  }

  const { f, l } = F.fr, dn = V(0, -1, 0), up = V(0, 1, 0), q = new THREE.Quaternion();
  const aim = (name, child, d) => { holder.getWorldQuaternion(q); FG.aim(F, name, child, d.clone().applyQuaternion(q)); };
  /* the arms: the walker's standing arms (k 0) toward the breath's lift (k 1): the upper arm forward and a little out,
     the forearm level and turned in, so the hands meet in front of the chest, a hand's width apart */
  function arms(k) {
    for (const [s, sg] of [["L", 1], ["R", -1]]) {
      const ua0 = V().copy(dn).addScaledVector(l, sg * 0.29).addScaledVector(f, 0.03);
      const fa0 = V().copy(dn).addScaledVector(l, sg * 0.16).addScaledVector(f, 0.24);
      const ua1 = V().copy(dn).addScaledVector(l, sg * 0.32).addScaledVector(f, 0.62);
      const fa1 = V().copy(f).addScaledVector(l, -sg * 0.62).addScaledVector(up, 0.22);
      aim("shoulder" + s, "elbow" + s, ua0.normalize().lerp(ua1.normalize(), k));
      aim("elbow" + s, "wrist" + s, fa0.normalize().lerp(fa1.normalize(), k));
    }
  }

  // the ember held between the hands: a warm core and a soft halo, and a small light so the palms take its colour
  const ember = new THREE.Group(); ember.visible = false;
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd7a0, transparent: true, depthWrite: false }));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff9a4a, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
  const glow = new THREE.PointLight(0xffb070, 0, 1.4, 2);
  ember.add(core, halo, glow); holder.add(ember);
  const wpos = b => holder.worldToLocal(b.getWorldPosition(V()));

  const kneel = KNEEL ? KNEEL(W) : null;
  let walking = false, breath = 0, breathWant = 0, held = 0, holdWant = false, waveT = -9, posedArms = false;
  return {
    holder, mixer: { update() {} }, isPlayer: true, scale: 1, dressed: true, cult: W,
    stance: () => (kneel && kneel.kneeling ? "sit" : walking ? "walk" : "idle"),
    setWalking(w) { walking = !!w; },
    wave(t) { waveT = t; },
    breathe(k) { breathWant = Math.max(0, Math.min(1, k || 0)); },
    hold(on) { holdWant = !!on; },
    give() { if (kneel && kneel.give) kneel.give(); },
    pose(t, dt, wantSit, wantRest, seatAt) {
      if (kneel) {
        if (wantSit && seatAt != null && !kneel.kneeling) kneel.sit(seatAt);
        else if (!wantSit && kneel.kneeling) kneel.stand();
        if (kneel.kneeling) { kneel.update(t, dt); return; }
      }
      W.update(dt, walking);
      // the breath and the held ember only while standing still; a step forward lets the arms swing again
      const want = walking ? 0 : Math.max(breathWant, holdWant ? 0.8 : 0);
      breath += (want - breath) * Math.min(1, dt * 3.2);
      held += ((holdWant && !walking ? 1 : 0) - held) * Math.min(1, dt * 2.5);
      if (!walking && (breath > 0.002 || posedArms)) {
        const w = ease(Math.min(1, breath)), sway = Math.sin(t * 1.3) * 0.015 * w;
        arms(w + sway);
        posedArms = breath > 0.002;
      }
      ember.visible = held > 0.01;
      if (ember.visible) {
        const a = wpos(F.bones.wristL), b = wpos(F.bones.wristR);
        ember.position.copy(a).add(b).multiplyScalar(0.5).addScaledVector(f, 0.03).addScaledVector(up, 0.06);
        const p = 1 + Math.sin(t * 2.4) * 0.12;
        core.scale.setScalar(held * p); halo.scale.setScalar(held * (1.1 + Math.sin(t * 1.7) * 0.15));
        core.material.opacity = held; glow.intensity = 1.6 * held * p;
      }
    },
    dispose() { W.dispose(); },
  };
}
