// Scripted measurement of the motion lab's own frames (spec .specify/specs/cultivator-motion-cloth-quality, FR-004/FR-005).
// Import it in the page, after motion-lab.js has built a walker:  const M = await import('/between/cult/motion-measure.js').
// It reads what renderPose() produced through window.__motionLabControl, so a measurement sees what a reviewer sees.
// Every length is reported twice: metres ("m") and as a fraction of the built figure's stature ("h"). Where a value is
// defined in world metres by the clip (root lift, flight travel) it is labelled "world metres" in the report notes.
import * as THREE from 'three';

const V = () => new THREE.Vector3();
const r4 = x => Math.round(x * 1e4) / 1e4;

// phases (seconds into the clip, or normalised run phase) the review samples; named for the contact event they hit
export const RUN_PHASES = [['strike', 0], ['compression', .09], ['toe-off', .20], ['flight', .35], ['strike-2', .50], ['compression-2', .59], ['toe-off-2', .70], ['flight-2', .85]];
export const JUMP_PHASES = [['grounded', 0], ['preload', .18], ['takeoff', .28], ['apex', .58], ['descent', .86], ['landing', .96], ['recovered', 1.12]];
export const WALK_PHASES = [['pass-L', 0], ['forward-L', .25], ['pass-R', .5], ['forward-R', .75]];

// world-space vertex positions of a skinned mesh after the current pose
function skinned(mesh) {
  mesh.updateWorldMatrix(true, false); mesh.skeleton.update();
  const g = mesh.geometry, n = g.attributes.position.count, out = new Float32Array(n * 3), t = V();
  for (let i = 0; i < n; i++) { mesh.getVertexPosition(i, t).applyMatrix4(mesh.matrixWorld); out[i * 3] = t.x; out[i * 3 + 1] = t.y; out[i * 3 + 2] = t.z; }
  return out;
}
function vertexNormals(pos, index) {
  const n = new Float32Array(pos.length), a = V(), b = V(), c = V(), e1 = V(), e2 = V();
  for (let i = 0; i < index.count; i += 3) {
    const ia = index.getX(i), ib = index.getX(i + 1), ic = index.getX(i + 2);
    a.fromArray(pos, ia * 3); b.fromArray(pos, ib * 3); c.fromArray(pos, ic * 3);
    e1.subVectors(b, a); e2.subVectors(c, a); e1.cross(e2); // area-weighted
    for (const k of [ia, ib, ic]) { n[k * 3] += e1.x; n[k * 3 + 1] += e1.y; n[k * 3 + 2] += e1.z; }
  }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  return n;
}
// a uniform grid over the body's vertices, for nearest-vertex queries
function grid(pos, cell) {
  const m = new Map(), key = (x, y, z) => `${x},${y},${z}`;
  for (let i = 0; i < pos.length; i += 3) { const k = key(Math.floor(pos[i] / cell), Math.floor(pos[i + 1] / cell), Math.floor(pos[i + 2] / cell)); (m.get(k) || m.set(k, []).get(k)).push(i / 3); }
  return { cell, near(x, y, z) { const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell), out = [];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { const l = m.get(key(cx + dx, cy + dy, cz + dz)); if (l) out.push(...l); } return out; } };
}
const wp = b => b.getWorldPosition(V());
const minY = pos => { let m = Infinity; for (let i = 1; i < pos.length; i += 3) if (pos[i] < m) m = pos[i]; return m; };

// robe vertices inside the body: the nearest body vertex within 6 cm whose outward normal points away from the robe point
// by more than tol (an approximation, not a mesh-mesh test; the same code runs on every cell so cells compare).
function robeVsBody(bodyPos, bodyNorm, garmentPos, tol = .004) {
  const g = grid(bodyPos, .06); let count = 0, max = 0;
  for (let i = 0; i < garmentPos.length; i += 3) {
    const x = garmentPos[i], y = garmentPos[i + 1], z = garmentPos[i + 2];
    let best = -1, bd = 1e9;
    for (const j of g.near(x, y, z)) { const dx = x - bodyPos[j * 3], dy = y - bodyPos[j * 3 + 1], dz = z - bodyPos[j * 3 + 2], d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; best = j; } }
    if (best < 0 || bd > .0036) continue;
    const s = (x - bodyPos[best * 3]) * bodyNorm[best * 3] + (y - bodyPos[best * 3 + 1]) * bodyNorm[best * 3 + 1] + (z - bodyPos[best * 3 + 2]) * bodyNorm[best * 3 + 2];
    if (s < -tol) { count++; if (-s > max) max = -s; }
  }
  return { count, maxDepth: max };
}

// the lab's references are fixed-size rigs; these functions report how big they are next to the figure
export function referenceSize(c) {
  const F = c.walker.X.F, ref = c.ref, B = n => ref.bones.find(b => b.name === n);
  ref.group.updateMatrixWorld(true);
  const d = (a, b) => wp(a).distanceTo(wp(b));
  const refLeg = d(B('thigh.L'), B('shin.L')) + d(B('shin.L'), B('foot.L')), charLeg = wp(F.bones.hipL).distanceTo(wp(F.bones.kneeL)) + wp(F.bones.kneeL).distanceTo(wp(F.bones.ankleL));
  return { refLegWorld: r4(refLeg), charLeg: r4(charLeg), stature: r4(F.stature), refScale: r4(ref.group.scale.x), jumpScale: r4(c.jumpRef.group.scale.x) };
}

// forward angle of a segment from vertical, in degrees; positive leans toward `fwd`
const leanDeg = (a, b, fwd) => { const d = wp(b).sub(wp(a)); return r4(Math.atan2(d.dot(fwd), d.y) * 180 / Math.PI); };
// torso forward lean of the figure (hips to spine03, the README's definition; also the lower and upper halves)
export function figureLean(F) {
  const B = F.bones, f = F.fr.f.clone().setY(0).normalize();
  return { hipsSpine03Deg: leanDeg(B.hips, B.spine03, f), hipsSpine01Deg: leanDeg(B.hips, B.spine01, f), spine01Spine03Deg: leanDeg(B.spine01, B.spine03, f), spine03NeckDeg: leanDeg(B.spine03, B.neck, f) };
}
// the same on the orange CMU rig (spine = its pelvis root), forward taken from its own feet
export function refLean(ref) {
  const byName = n => ref.bones.find(b => b.name === n); ref.group.updateMatrixWorld(true);
  const fwd = wp(byName('toe.L')).sub(wp(byName('foot.L'))).add(wp(byName('toe.R')).sub(wp(byName('foot.R')))).setY(0).normalize();
  return { hipsSpine03Deg: leanDeg(byName('spine'), byName('spine.003'), fwd), hipsSpine01Deg: leanDeg(byName('spine'), byName('spine.001'), fwd), spine01Spine03Deg: leanDeg(byName('spine.001'), byName('spine.003'), fwd), spine03NeckDeg: leanDeg(byName('spine.003'), byName('spine.006'), fwd) };
}

// one frame: pose the lab at (motion, t) and read everything. t is seconds for walk/jump, normalised phase for run/pose.
export function measureFrame(c, motion, t) {
  const W = c.walker, F = W.X.F, H = F.stature, dur = c.duration;
  const seconds = motion === 'jump' ? t : t * ({ walk: 1.2, run: .64, pose: .64 }[motion]);
  c.set(motion, seconds); W.X.scene.updateMatrixWorld(true);
  const f = F.fr.f, l = F.fr.l, B = F.bones;
  const bodyPos = skinned(F.mesh), bodyIdx = F.idx0 || F.mesh.geometry.index, bodyNorm = vertexNormals(bodyPos, bodyIdx);
  const clothed = document.getElementById('bodyOnly').checked ? [] : W.X.parts.filter(p => p.mesh && p.mesh.visible);
  const out = { motion, t, seconds: r4(seconds), stature: r4(H) };
  const rec = (k, v) => { out[k + 'M'] = r4(v); out[k + 'H'] = r4(v / H); };
  out.lean = figureLean(F); out.refLean = refLean(c.ref);
  rec('rootForward', W.holder.position.dot(f)); rec('rootUp', F.root.position.y - c.groundY);
  rec('hipsHeight', wp(B.hips).y);
  rec('bodyLowest', minY(bodyPos));
  rec('ballL', wp(B.ballL).y); rec('ballR', wp(B.ballR).y); rec('ankleL', wp(B.ankleL).y); rec('ankleR', wp(B.ankleR).y);
  const kneeL = wp(B.kneeL), kneeR = wp(B.kneeR);
  rec('kneeGap', Math.abs(kneeL.clone().sub(kneeR).dot(l))); rec('kneeGap3D', kneeL.distanceTo(kneeR));
  rec('kneeLHeight', kneeL.y); rec('kneeRHeight', kneeR.y);
  rec('ankleGap', Math.abs(wp(B.ankleL).sub(wp(B.ankleR)).dot(l)));
  const names = ['robe', 'robe-shell', 'trousersL', 'trousersR', 'boots', 'bootsL', 'bootsR'];
  let lowestClothed = minY(bodyPos), robe = null;
  for (const p of clothed) {
    if (!names.includes(p.name)) continue; const pos = skinned(p.mesh);
    if (p.name === 'boots' || p.name === 'bootsL' || p.name === 'bootsR') lowestClothed = Math.min(lowestClothed, minY(pos));
    if (p.name === 'robe') { robe = { minY: minY(pos), vs: robeVsBody(bodyPos, bodyNorm, pos) }; }
  }
  rec('clothedLowest', lowestClothed);
  if (robe) { rec('robeHem', robe.minY); out.robeInsideBody = robe.vs.count; rec('robeInsideMax', robe.vs.maxDepth); }
  return out;
}

// frame-to-frame discontinuity: sweep a full cycle in `steps` equal steps, report the largest per-step change in the hips'
// position and in the lowest body point, and the same for the median step (so one spike reads against the usual stride)
export function sweep(c, motion, steps = 96) {
  const W = c.walker, F = W.X.F, H = F.stature, dur = { walk: 1.2, run: .64, pose: .64, jump: 1.12 }[motion];
  let prev = null; const d = [], dl = [], dRoot = [];
  for (let i = 0; i <= steps; i++) {
    c.set(motion, dur * i / steps); W.X.scene.updateMatrixWorld(true);
    const p = skinned(F.mesh), hip = wp(F.bones.hips), low = minY(p), fw = W.holder.position.dot(F.fr.f);
    if (prev) { d.push(hip.distanceTo(prev.hip)); dl.push(Math.abs(low - prev.low)); dRoot.push(Math.abs(fw - prev.fw)); }
    prev = { hip, low, fw };
  }
  const med = a => [...a].sort((x, y) => x - y)[a.length >> 1], max = a => Math.max(...a);
  return { steps, hipsStepMaxH: r4(max(d) / H), hipsStepMedH: r4(med(d) / H), lowestStepMaxH: r4(max(dl) / H), lowestStepMedH: r4(med(dl) / H), rootForwardStepMaxM: r4(max(dRoot)) };
}

// reference rigs against the current figure: lowest bone and hip height at each run phase
export function referenceFrame(c, motion, t) {
  const F = c.walker.X.F, ref = c.ref, H = F.stature;
  c.set(motion, t * ({ walk: 1.2, run: .64, pose: .64 }[motion] || 1));
  const ys = ref.bones.map(b => wp(b).y), hip = wp(ref.bones.find(b => b.name === 'pelvis.L')).y;
  const rec = (k, v) => ({ [k + 'M']: r4(v), [k + 'H']: r4(v / H) });
  return { motion, t, ...rec('refLowestBone', Math.min(...ys)), ...rec('refHip', hip), ...rec('charHips', wp(F.bones.hips).y), ...rec('charBodyLowest', minY(skinned(F.mesh))) };
}
