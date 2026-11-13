// Round 30: the locomotion and camera check (council recipe cultivation-locomotion, "check"). It drives the game's own
// step(), the cultivation walker and the camera rig at a fixed 30 fps, synchronously, so the page's frame loop cannot
// interleave, and scores what a player feels: walk and run speeds, the jump's height and time in the air, planted feet
// that do not slide, and a camera that never sits in a wall, under the ground or behind something that hides the head.
// Run in the page: `(await import('/sect/heaven/movecheck.js')).moveCheck()`. ok is true only with no breaks.
import * as THREE from 'three';
import { step, groundAt } from './walk.js';
import { colliders } from './world.js';
import { wayColliders } from './crag.js';
import { segBoxes, MOVE, CAM } from './move.js';
import { wayRoute } from './walkcheck.js';

export const BOUNDS = { walk: [1.1, 1.5], run: [3.6, 4.8], apex: [0.55, 0.95], air: [0.55, 0.85], slideWalk: 0.04, slideRun: 0.08, land: 0.02, pop: 1.5 };
const DT = 1 / 30, V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const boxes = [colliders, wayColliders];
const inBox = c => boxes.some(L => L.some(b => { const dx = c.x - b.x, dz = c.z - b.z, lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c;
  return Math.abs(lx) < b.hw && Math.abs(lz) < b.hd && c.y > b.y0 && c.y < b.y1; }));

export async function moveCheck({ legsMax = 2400 } = {}) {
  const h = window.heaven, w = await h.walking, A = h.A, rig = h.rig, F = w.X.F;
  h.stopWalk(); w.hold = false; rig.free = false;
  const out = { breaks: [], scores: {} }, brk = (k, v) => out.breaks.push({ k, ...v });
  const ankle = s => F.bones['ankle' + s].getWorldPosition(V());
  const tick = input => { const p0 = A.position.clone(); step(A, input, DT, rig.yaw); const sp = Math.hypot(A.position.x - p0.x, A.position.z - p0.z) / DT;
    w.update(DT); rig.update(A, DT, sp); return sp; };
  const place = n => { h.jump(n); rig.adopt(); A.userData.m = null; for (let i = 0; i < 20; i++) tick({ keys: new Set(), target: null }); };

  // 1-2: speeds and foot slide on the great court, walking then running straight ahead for three seconds
  for (const [name, run] of [['walk', false], ['run', true]]) {
    place(1); const input = { keys: new Set(['w']), target: null, run }; rig.yaw = A.rotation.y; rig.hands = 0;
    const sp = [], last = { L: null, R: null }; let slide = 0, below = 0;
    for (let i = 0; i < 90; i++) { sp.push(tick(input));
      for (const s of ['L', 'R']) { const ft = w.feet[s], a = ankle(s);
        if (!ft.swing && i > 30) { if (last[s]) slide = Math.max(slide, Math.hypot(a.x - last[s].x, a.z - last[s].z)); last[s] = a; } else last[s] = null;
        below = Math.max(below, groundAt(a.x, a.z) - a.y); } }
    const v = sp.slice(45).reduce((a, b) => a + b, 0) / 45; out.scores[name] = +v.toFixed(2); out.scores[name + 'Slide'] = +slide.toFixed(3);
    const [lo, hi] = BOUNDS[name]; if (v < lo || v > hi) brk(name + ' speed', { got: +v.toFixed(2), want: BOUNDS[name] });
    const lim = run ? BOUNDS.slideRun : BOUNDS.slideWalk; if (slide > lim) brk(name + ' foot slide', { got: +slide.toFixed(3), max: lim });
    if (below > 0.03) brk(name + ' ankle below ground', { got: +below.toFixed(3) });
  }

  // 3: a standing jump: height, time in the air, the feet off the ground at the top, a clean landing
  { place(1); const input = { keys: new Set(), target: null, jump: true }, y0 = A.position.y, stand = Math.min(ankle('L').y, ankle('R').y); let t = 0, apex = y0, feetUp = 1e9, n = 0;
    tick(input); while (A.userData.m.air && n < 120) { t += DT; tick(input); apex = Math.max(apex, A.position.y); n++;
      if (A.userData.m.air && Math.abs(A.userData.m.vy) < 1) feetUp = Math.min(feetUp, ...['L', 'R'].map(s => ankle(s).y - stand)); } // how far each ankle rose above its standing height
    t += DT; const land = Math.abs(A.position.y - groundAt(A.position.x, A.position.z));
    Object.assign(out.scores, { apex: +(apex - y0).toFixed(2), air: +t.toFixed(2), feetUp: +feetUp.toFixed(2) });
    if (apex - y0 < BOUNDS.apex[0] || apex - y0 > BOUNDS.apex[1]) brk('jump height', { got: +(apex - y0).toFixed(2), want: BOUNDS.apex });
    if (t < BOUNDS.air[0] || t > BOUNDS.air[1]) brk('time in the air', { got: +t.toFixed(2), want: BOUNDS.air });
    if (feetUp < 0.6) brk('feet stay down at the top of the jump', { got: +feetUp.toFixed(2) });
    if (land > BOUNDS.land) brk('landing off the ground', { got: +land.toFixed(3) }); }

  // 4: the camera along the sect's whole way, walking it leg by leg with the hands off the camera
  { const route = wayRoute(), [x0, z0] = route[0]; A.position.set(x0, groundAt(x0, z0), z0); A.userData.m = null;
    const [x1, z1] = route[1]; A.rotation.y = Math.atan2(-(x1 - x0), -(z1 - z0)); rig.yaw = A.rotation.y; rig.pitch = CAM.pitch; rig.dist = CAM.dist; rig.arm = CAM.dist; rig.pivotY = null; rig.hands = 99;
    let frames = 0, bad = { inWall: 0, underGround: 0, hidden: 0, pop: 0 }, prev = null, prevArm = rig.arm, first = {}; out.level = [];
    const note = (k, at) => { bad[k]++; if (!first[k]) first[k] = at; };
    for (let i = 1; i < route.length; i++) { const input = { keys: new Set(), target: { x: route[i][0], z: route[i][1] } }; let n = 0;
      while (input.target && n < legsMax) { tick(input); n++; frames++;
        const c = h.cam.position, head = A.position.clone().add(V(0, CAM.head, 0)), at = [+c.x.toFixed(1), +c.y.toFixed(1), +c.z.toFixed(1)];
        if (inBox(c)) note('inWall', at);
        if (c.y < groundAt(c.x, c.z) + 0.2) note('underGround', at);
        if (segBoxes(c, head, boxes, 0) < 0.97) note('hidden', at);
        if (prev && prev.distanceTo(c) > BOUNDS.pop && rig.arm >= prevArm - 0.05) note('pop', at); prev = c.clone(); prevArm = rig.arm; } // a pull-in to clear a wall is not a pop
      // a leg the way's straight line cannot walk (a collider across it) is the level's to fix, not the locomotion's:
      // it is listed under level, and the figure is set down at the leg's end so the camera walk goes on
      if (input.target) { out.level.push({ leg: i, stuckAt: [+A.position.x.toFixed(1), +A.position.z.toFixed(1)], to: route[i].map(v => +v.toFixed(1)) });
        A.position.set(route[i][0], groundAt(route[i][0], route[i][1]), route[i][1]); A.userData.m = null; prev = null; } }
    out.scores.cameraFrames = frames; Object.assign(out.scores, Object.fromEntries(Object.entries(bad).map(([k, v]) => ['cam_' + k, v])));
    for (const k in bad) if (bad[k]) brk('camera ' + k, { frames: bad[k], first: first[k] }); }

  out.ok = out.breaks.length === 0; out.move = { ...MOVE }; out.cam = { ...CAM };
  return out;
}
