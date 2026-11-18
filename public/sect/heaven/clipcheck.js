// Report-only clip checks for the cultivation walker (council recipe cultivation-locomotion, "Clip checks").
// Adapted in idea from luccacerfz/character-factory-skills (MIT): loops close, clips start on one pose, nothing sits
// under the floor, and every bone earns its place. Nothing here is a bound: it prints numbers and never sets ok,
// and movecheck.js does not call it. Run in the page: `(await import('/sect/heaven/clipcheck.js')).clipReport()`.
import * as THREE from 'three';
import { step, groundAt } from './walk.js';

const DT = 1 / 30, V = () => new THREE.Vector3(), mm = v => +(v * 1000).toFixed(1), cm = v => +(v * 100).toFixed(1);
const POSE = ['ankleL', 'ankleR', 'wristL', 'wristR', 'head'];

export async function clipReport() {
  const h = window.heaven, w = await h.walking, A = h.A, rig = h.rig, F = w.X.F, names = Object.keys(F.bones);
  h.stopWalk(); w.hold = false; rig.free = false;
  const loc = b => A.worldToLocal(F.bones[b].getWorldPosition(V()));   // a bone in the figure's own frame
  const tick = input => { step(A, input, DT, rig.yaw); w.update(DT); rig.update(A, DT, 1); };
  const place = () => { h.jump(1); rig.adopt(); A.userData.m = null; for (let i = 0; i < 20; i++) tick({ keys: new Set(), target: null }); };
  const snap = () => Object.fromEntries(POSE.map(b => [b, loc(b)]));
  const gap = (a, b) => Math.max(...POSE.map(k => a[k].distanceTo(b[k])));
  const floorNames = names.filter(b => b !== 'root'); // the root is a pivot at the origin, not a body part
  const out = { reportOnly: true, loop: {}, start: {}, floor: {}, bones: [] };
  const clips = {}, frames = {}, under = {};

  // clip: stand idle, then hold the key for three seconds (walk, then run), recording the pose each frame
  for (const [name, run] of [['walk', false], ['run', true]]) {
    place(); const idle = snap(), input = { keys: new Set(['w']), target: null, run }; rig.yaw = A.rotation.y; rig.hands = 0;
    const rec = [], starts = []; let wasSwing = false; frames[name] = [];
    for (let i = 0; i < 120; i++) { tick(input); const sw = !!w.feet.L.swing;
      if (sw && !wasSwing) starts.push(i); wasSwing = sw; rec.push(snap()); frames[name].push(Object.fromEntries(names.map(b => [b, loc(b)])));
      for (const b of floorNames) { const p = F.bones[b].getWorldPosition(V()), d = p.y - groundAt(p.x, p.z); if (!(b in under) || d < under[b].d) under[b] = { d, clip: name, frame: i }; } }
    clips[name] = { idle, first: rec[0] };
    // loop: the pose at the left foot's last two swing starts, one stride apart, in the figure's own frame
    const n = starts.length; out.loop[name] = n >= 2 ? { strideFrames: starts[n - 1] - starts[n - 2], mm: mm(gap(rec[starts[n - 2]], rec[starts[n - 1]])) } : { strideFrames: null, mm: null, note: 'fewer than two strides seen' };
  }
  { // jump clip: floor only
    place(); const input = { keys: new Set(), target: null, jump: true }; frames.jump = []; let k = 0; tick(input);
    while (A.userData.m && A.userData.m.air && k < 120) { tick(input); k++; frames.jump.push(Object.fromEntries(names.map(b => [b, loc(b)])));
      for (const b of floorNames) { const p = F.bones[b].getWorldPosition(V()), d = p.y - groundAt(p.x, p.z); if (!(b in under) || d < under[b].d) under[b] = { d, clip: 'jump', frame: k }; } }
    for (let i = 0; i < 20; i++) { tick({ keys: new Set(), target: null }); for (const b of floorNames) { const p = F.bones[b].getWorldPosition(V()), d = p.y - groundAt(p.x, p.z); if (d < under[b].d) under[b] = { d, clip: 'jump-land', frame: i }; } }
  }

  // start: do idle, the walk's first frame and the run's first frame begin on one pose? (the rule asks for 1 mm)
  out.start = { idleToWalkMm: mm(gap(clips.walk.idle, clips.walk.first)), idleToRunMm: mm(gap(clips.run.idle, clips.run.first)), walkToRunMm: mm(gap(clips.walk.first, clips.run.first)) };

  // floor: the lowest any bone sits against the ground under it, whole clips; negative is under the floor
  const low = Object.entries(under).sort((a, b) => a[1].d - b[1].d).slice(0, 5);
  out.floor = { lowestFive: low.map(([b, u]) => ({ bone: b, mm: mm(u.d), clip: u.clip, frame: u.frame })), anyUnderMm: mm(Math.min(0, ...low.map(([, u]) => u.d))) };

  // bone table: how far each bone's child (its tip) swings in the bone's parent frame, over walk, run and jump; the rule
  // says a bone that never moves its tip 5 cm is merged into its parent
  for (const b of names) { const bone = F.bones[b], kid = bone.children.find(c => c.isBone), all = [...frames.walk, ...frames.run, ...frames.jump];
    const tip = kid ? kid.name : null; let moves = null;
    if (tip && F.bones[tip]) { const pts = all.map(f => f[tip].clone().sub(f[b])); const c = pts.reduce((a, p) => a.add(p), V()).multiplyScalar(1 / pts.length); moves = cm(Math.max(...pts.map(p => p.distanceTo(c)))); }
    const pts2 = all.map(f => f[b]), c2 = pts2.reduce((a, p) => a.add(p), V()).multiplyScalar(1 / pts2.length);
    out.bones.push({ bone: b, tip, tipSwingCm: moves, travelCm: cm(Math.max(...pts2.map(p => p.distanceTo(c2)))), mergeCandidate: moves !== null && moves < 5 }); }
  out.mergeCandidates = out.bones.filter(r => r.mergeCandidate).map(r => r.bone);
  return out;
}
