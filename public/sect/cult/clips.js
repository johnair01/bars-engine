// Heaven clips: the Quaternius Universal Animation Library (CC0, ual.glb beside this file) played on the cultivation figure.
// Moved here from clip lab 1 (/mnt/project-files/3d-build/clip-lab-1/src/clips.js). No motion is written by hand: each frame samples a
// library clip on its own skeleton and carries each bone across (torso, head, hands, feet by world turn from rest; limbs by direction + twist).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as FG from './figure.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), Q = () => new THREE.Quaternion();
const wq = o => o.getWorldQuaternion(Q()), wp = o => o.getWorldPosition(V());

// our bone -> UAL bone (GLTFLoader drops the dots: DEF-thigh.L becomes DEF-thighL)
const MAP = { hips: 'DEF-hips', spine01: 'DEF-spine001', spine: 'DEF-spine002', spine03: 'DEF-spine003', neck: 'DEF-neck', head: 'DEF-head',
  clavL: 'DEF-shoulderL', clavR: 'DEF-shoulderR', shoulderL: 'DEF-upper_armL', shoulderR: 'DEF-upper_armR', elbowL: 'DEF-forearmL', elbowR: 'DEF-forearmR',
  wristL: 'DEF-handL', wristR: 'DEF-handR', hipL: 'DEF-thighL', hipR: 'DEF-thighR', kneeL: 'DEF-shinL', kneeR: 'DEF-shinR',
  ankleL: 'DEF-footL', ankleR: 'DEF-footR', ballL: 'DEF-toeL', ballR: 'DEF-toeR' };
// limbs carried by direction: [bone, child, source bone, source child]
const LIMBS = s => [['shoulder' + s, 'elbow' + s, 'DEF-upper_arm' + s, 'DEF-forearm' + s], ['elbow' + s, 'wrist' + s, 'DEF-forearm' + s, 'DEF-hand' + s],
  ['hip' + s, 'knee' + s, 'DEF-thigh' + s, 'DEF-shin' + s], ['knee' + s, 'ankle' + s, 'DEF-shin' + s, 'DEF-foot' + s]];
const ORDER = ['hips', 'spine01', 'spine', 'spine03', 'neck', 'head', 'clavL', 'clavR',
  ...['L', 'R'].flatMap(s => ['shoulder' + s, 'elbow' + s, 'wrist' + s, 'hip' + s, 'knee' + s, 'ankle' + s, 'ball' + s])];

export async function loadLib(url) {
  const g = await new GLTFLoader().loadAsync(url); const root = g.scene; root.updateMatrixWorld(true);
  const B = {}; root.traverse(o => { if (o.isBone) B[o.name] = o; });
  const rq = {}, rp = {}; for (const k in B) { rq[k] = wq(B[k]); rp[k] = wp(B[k]); }
  const clips = Object.fromEntries(g.animations.map(a => [a.name, a]));
  return { root, B, rq, rp, clips, mixer: new THREE.AnimationMixer(root), act: null };
}

// the retarget, built once per figure. F is a posed cultivation figure at rest ('stand' is not used: rest is the bind)
export function retarget(F, U) {
  FG.resetPose(F); F.root.updateMatrixWorld(true);
  const restW = {}, restP = {}; for (const k of ORDER) if (F.bones[k]) { restW[k] = wq(F.bones[k]); restP[k] = wp(F.bones[k]); }
  // yaw that turns the source's forward onto ours (forward = heel to toe, both feet)
  const sf = U.rp['DEF-toeL'].clone().sub(U.rp['DEF-footL']).add(U.rp['DEF-toeR'].clone().sub(U.rp['DEF-footR'])); sf.y = 0; sf.normalize();
  const of = F.fr.f.clone(); of.y = 0; of.normalize();
  const yaw = Q().setFromUnitVectors(sf, of), yawI = yaw.clone().invert();
  const hipH = restP.hips.y - Math.min(restP.ankleL.y, restP.ankleR.y), srcH = U.rp['DEF-hips'].y - Math.min(U.rp['DEF-footL'].y, U.rp['DEF-footR'].y);
  const sc = hipH / srcH, rootY0 = F.root.position.y;

  const sample = (clip, t) => { const c = U.clips[clip]; if (!U.act || U.act.getClip() !== c) { if (U.act) U.act.stop(); U.act = U.mixer.clipAction(c); U.act.play(); }
    U.mixer.setTime(t % c.duration); U.root.updateMatrixWorld(true); };
  const D = n => yaw.clone().multiply(wq(U.B[n])).multiply(U.rq[n].clone().invert()).multiply(yawI); // world turn from rest, in our frame
  const sdir = (a, b) => wp(U.B[b]).sub(wp(U.B[a])).applyQuaternion(yaw).normalize();
  const setW = (n, want) => { const b = F.bones[n]; b.quaternion.copy(wq(b.parent).invert().multiply(want)); b.updateMatrixWorld(true); };

  // one pose: local quaternions for every bone, and the hips' world offset
  function poseOf(clip, t) {
    sample(clip, t); FG.resetPose(F); F.root.position.y = rootY0; F.root.updateMatrixWorld(true);
    const hp = wp(U.B['DEF-hips']).sub(U.rp['DEF-hips']).applyQuaternion(yaw).multiplyScalar(sc);
    const hb = F.bones.hips; hb.position.copy(hb.parent.worldToLocal(restP.hips.clone().add(hp))); F.root.updateMatrixWorld(true);
    for (const n of ORDER) {
      if (!F.bones[n] || !MAP[n]) continue;
      const lim = /[LR]$/.test(n) && LIMBS(n.slice(-1)).find(x => x[0] === n);
      if (lim) { // direction from the source, then the source's twist about the bone
        FG.aim(F, n, lim[1], sdir(lim[2], lim[3]));
        const b = F.bones[n], ax = wp(F.bones[lim[1]]).sub(wp(b)).normalize();
        const r = wq(b).multiply(restW[n].clone().invert()).multiply(D(lim[2]).invert());
        setW(n, Q().setFromAxisAngle(ax, -twist(r, ax)).multiply(wq(b)));
      } else setW(n, D(MAP[n]).multiply(restW[n]));
    }
    F.root.updateMatrixWorld(true);
    const q = {}; for (const n of ORDER) if (F.bones[n]) q[n] = F.bones[n].quaternion.clone();
    return { q, hip: F.bones.hips.position.clone() };
  }
  function apply(P) { for (const n in P.q) F.bones[n].quaternion.copy(P.q[n]); F.bones.hips.position.copy(P.hip); F.root.updateMatrixWorld(true); F.mesh.skeleton.update(); }
  function blend(A, B, k) { const q = {}; for (const n in A.q) q[n] = A.q[n].clone().slerp(B.q[n], k); return { q, hip: A.hip.clone().lerp(B.hip, k) }; }
  return { poseOf, apply, blend, sc, duration: n => U.clips[n].duration };
}
function twist(q, ax) { const d = q.x * ax.x + q.y * ax.y + q.z * ax.z; const t = new THREE.Quaternion(ax.x * d, ax.y * d, ax.z * d, q.w); if (t.lengthSq() < 1e-12) return 0; t.normalize(); const a = 2 * Math.acos(Math.min(1, Math.abs(t.w))); return d * t.w < 0 ? -a : a; }

// a timeline: [clip, seconds (null = the clip's own length), crossfade into the next]
export function timeline(R, steps) {
  let t0 = 0; const segs = steps.map(([clip, len, fade = 0.2]) => { const d = len ?? R.duration(clip); const s = { clip, t0, d, fade }; t0 += d; return s; });
  return { total: t0, at(t) {
    const i = Math.max(0, segs.findIndex(s => t < s.t0 + s.d)); const s = segs[i < 0 ? segs.length - 1 : i], n = segs[i + 1];
    const lt = t - s.t0, once = !/Loop/.test(s.clip) ? Math.min(lt, R.duration(s.clip) - 1e-3) : lt;
    const A = R.poseOf(s.clip, once); const into = s.d - lt;
    if (n && into < s.fade) { const B = R.poseOf(n.clip, 0); return { pose: R.blend(A, B, 1 - into / s.fade), clip: s.clip + ' > ' + n.clip }; }
    return { pose: A, clip: s.clip };
  } };
}
