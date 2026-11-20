// The trainee walk (build 2026-11-17, council pass records/trainee-walk-three-beats_2026-11-17).
// A player who walks on from the Hollow (heaven.html?from=hollow) arrives at the crown, in the court in front of the
// founder's hall, and does three things in his order (cd-walk-look-1): meets the Elders, carries a bucket to the heart
// stone, and meets the team of three. Nothing here is saved: no rank, no rep, no meter. The want is read from the
// walk-own sessionStorage pair that the Hollow leaves.
import * as THREE from 'three';
import { CROWN } from './crag.js';
import { ALTAR } from './altar.js';
import { interiors } from './world.js';
import { groundAt } from './walk.js';
import { PILGRIM } from './layout.js';
import { CREST_STAIR, ROAD, ROAD_START } from './crag.js';
import { GREAT } from './world.js';
import { elder, wayfarer } from './people.js';
import { WAYFARERS } from './wayfarer-words.js';
import { talk } from './talk.js';
import { doubtQuest } from './doubt.js';
import { own } from '../../between/walk-own.js';

import { LINES, SENSATIONS, readBack, entryLine, stoneLine, TEAM, endLine, CLIMB, climbIntro } from './trainee-words.js';
export { LINES, SENSATIONS, readBack, entryLine, stoneLine, TEAM, endLine, CLIMB, climbIntro };
const ORDER = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']; // layout.js COURTS order

const CSS = `
.tw-card{box-sizing:border-box;position:fixed;left:50%;transform:translateX(-50%);top:calc(12px + env(safe-area-inset-top,0px));z-index:60;width:min(92vw,440px);display:grid;gap:10px;padding:14px 16px;border-radius:16px;background:rgba(18,14,24,.9);color:#f6ecdc;box-shadow:0 10px 30px rgba(0,0,0,.45);font:400 16px/1.45 var(--ui-body,system-ui,sans-serif)}
.tw-card[hidden]{display:none}
.tw-card b{font:400 22px/1.2 var(--ui-display,Georgia,serif)}
.tw-card p{margin:0}
.tw-row{display:flex;gap:10px;flex-wrap:wrap}
.tw-row button{font:700 15px/1 var(--ui-body,system-ui,sans-serif);min-height:48px;padding:0 18px;border-radius:24px;cursor:pointer;border:1px solid rgba(255,255,255,.35);color:#fff;background:transparent}
.tw-row button.go,.tw-row button[aria-pressed="true"]{background:#2f8f86;border-color:#2f8f86}
.tw-row button:focus-visible{outline:3px solid #5fc2ba;outline-offset:2px}
.tw-hint{position:fixed;left:50%;transform:translateX(-50%);top:calc(12px + env(safe-area-inset-top,0px));z-index:55;max-width:min(92vw,440px);padding:8px 14px;border-radius:14px;background:rgba(243,234,214,.92);color:#2b2118;font:600 14px/1.35 system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.2)}
.tw-hint[hidden]{display:none}
.tw-skip{position:fixed;right:12px;top:calc(76px + env(safe-area-inset-top,0px));z-index:56;min-height:44px;padding:0 18px;border-radius:22px;border:1px solid rgba(255,255,255,.4);background:rgba(18,14,24,.8);color:#f6ecdc;font:600 14px/1 system-ui,sans-serif;cursor:pointer}
.tw-skip[hidden]{display:none}
.tw-pip{position:fixed;z-index:50;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:3px solid #f0c969;background:rgba(240,201,105,.35);box-shadow:0 0 12px #f0c969;pointer-events:none}
.tw-pip[hidden]{display:none}
body.trainee .stops,body.trainee .views,body.trainee .hud{display:none}
body.trainee .tw-card:not([hidden])+.tw-hint{display:none}
`;

const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function traineeWalk(ctx) {
  const { S, A, cam, orbit, rig, input, ready, walking, hooks } = ctx;
  const startStop = ctx.stop || '';
  const want = (() => { const m = own(); return m ? m.want : ''; })();
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  document.body.classList.add('trainee');
  const card = document.createElement('div'); card.className = 'tw-card'; card.setAttribute('role', 'dialog'); card.hidden = true;
  const hint = document.createElement('div'); hint.className = 'tw-hint'; hint.hidden = true;
  const pip = document.createElement('div'); pip.className = 'tw-pip'; pip.hidden = true;
  for (const ev of ['pointerdown', 'pointerup', 'keydown', 'wheel']) card.addEventListener(ev, e => e.stopPropagation());
  document.body.append(card, hint, pip);
  const show = (html, label) => { card.innerHTML = html; card.setAttribute('aria-label', label || 'The trainee walk'); card.hidden = false; };
  const say = (text, label) => show(`<p>${esc(text)}</p>`, label);
  const C = CROWN, N = [C.nx, C.nz];
  const at = (r, v) => { const [x, z] = C.at(r); return [x + N[0] * v, z + N[1] * v]; };
  const F0 = interiors.find(i => i.key === 'founder'), Rm = F0.R;
  const plan = ([x, y]) => { const lx = x - Rm.Wd / 2, lz = y - Rm.D / 2; return [F0.x + F0.c * lx + F0.s * lz, F0.z - F0.s * lx + F0.c * lz]; };
  const toPlan = (wx, wz) => { const dx = wx - F0.x, dz = wz - F0.z; const lx = dx * F0.c - dz * F0.s, lz = dx * F0.s + dz * F0.c; return [lx + Rm.Wd / 2, lz + Rm.D / 2]; };
  const stone = at(ALTAR.r, 0), stoneY = C.y0 + ALTAR.TOP;

  // ---- the player's start: in the court at the foot of the gate hall's back stair, facing the founder's hall ----
  const place = (x, z, dx, dz, back = 6, up = 3.2) => {
    const L = Math.hypot(dx, dz); dx /= L; dz /= L;
    A.position.set(x, groundAt(x, z), z); A.rotation.y = Math.atan2(-dx, -dz);
    cam.position.set(x - dx * back, A.position.y + up, z - dz * back);
    orbit.target.set(x + dx * 6, A.position.y + 1.6, z + dz * 6); rig.pending = true; input.target = null;
  };
  const [sx, sz] = at(C.rFoot - 0.4, 0);
  const placeSummit = () => place(sx, sz, C.ux, C.uz, 6.5, 3.4);

  // ---- the people ----
  const people = await ready.then(() => ctx.people());
  await walking;
  const students = (people && people.students) || [];
  const stand = (m, x, z, dx, dz) => { S.add(m.h); m.h.position.set(x, groundAt(x, z) + 0.0, z); m.h.rotation.y = 0; m.turn(dx, dz); };
  // nine students at work in the court and by the gate hall (they were in the great court, far below)
  const spots = [[8.2, -10], [13, 9.8], [8.0, -7], [8.2, 4.8], [8.1, 8.5], [13, 11.2], [8.3, -4.6], [13, -11.2], [8.5, -2.8]];
  const cross = [1, 2, 3, 4, 5, 6, 7, 8]; // student 0 stays below, at the bronze bell, to start the climb
  cross.forEach(i => { const m = students[i]; if (!m) return; const [r, v] = spots[i], [x, z] = at(r, v); const k = (i % 3 - 1) * 0.5;
    stand(m, x, z, C.ux + N[0] * k, C.uz + N[1] * k); });
  // the Elders: six, in the hall's plan coordinates; the Shaman Elder at the trigram disc's north rim
  const ELD = {}, DISC = plan([15, 11]);
  // the five stand in an arc round the disc's north half, the Shaman Elder at its rim
  const arc = d => [15 + 6.3 * Math.cos(d * Math.PI / 180), 11 - 6.3 * Math.sin(d * Math.PI / 180)];
  const seats = { shaman: [15, 8.6], challenger: arc(166), regent: arc(131), architect: arc(90), diplomat: arc(49), sage: arc(14) };
  const built = await Promise.all(ORDER.map((k, i) => elder(i).then(m => ({ k, m })).catch(e => { console.warn('elder', k, e); return null; })));
  for (const b of built) { if (!b) continue; const [x, z] = plan(seats[b.k]); const to = b.k === 'shaman' ? plan([15, 22]) : DISC;
    stand(b.m, x, z, to[0] - x, to[1] - z); b.m.h.position.y = 90.06; ELD[b.k] = b.m; }

  // ---- the bucket, the waymark and the stone ----
  const bucket = new THREE.Group();
  { const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a33, roughness: 0.8 }), band = new THREE.MeshStandardMaterial({ color: 0x3b3128, metalness: 0.5, roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.26, 18, 1, true), wood); body.material.side = THREE.DoubleSide; body.position.y = 0.13;
    const base = new THREE.Mesh(new THREE.CircleGeometry(0.12, 18), wood); base.rotation.x = -Math.PI / 2; base.position.y = 0.01;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 6, 24), band); rim.rotation.x = Math.PI / 2; rim.position.y = 0.26;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.01, 6, 20, Math.PI), band); handle.position.y = 0.26;
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.15, 18), new THREE.MeshStandardMaterial({ color: 0x6fb8d4, roughness: 0.2 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.2;
    bucket.add(body, base, rim, handle, water); bucket.traverse(o => { if (o.isMesh) o.castShadow = true; }); bucket.visible = false; S.add(bucket); }
  const wayLit = new THREE.Group(); wayLit.visible = false; S.add(wayLit);
  { const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, 16, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xf0c969, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 8; const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.85, 40), new THREE.MeshBasicMaterial({ color: 0xf0c969, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05;
    wayLit.add(beam, ring); wayLit.position.set(stone[0], stoneY, stone[1]); }
  const glow = new THREE.PointLight('#ffd890', 0, 12); glow.position.set(stone[0], stoneY + 1, stone[1]); S.add(glow);

  const wrist = () => { const w = walking && ctx.walker && ctx.walker(); return w && w.X && w.X.F && w.X.F.bones.wristR; };
  const v3 = new THREE.Vector3();
  let state = 'entry', carrying = false, spoke = new Set(), queue = [], line = null, lineUntil = 0, after = null, scanN = 0, endAt = 0;
  const now = () => performance.now();
  const speak = (k, text, ms, then) => { line = { k, text }; lineUntil = now() + ms; after = then || null; say(text, 'An Elder speaks'); };
  const setHint = t => { hint.textContent = t || ''; hint.hidden = !t; };

  // ---- the guided climb: the great court up to the crown, one waymark at a time (his note on tw-build-look-1) ----
  S.traverse(o => { if (o.userData.routeBadge) o.visible = false; }); // the builder's tour's numbered badges
  const G = GREAT.G; G.updateWorldMatrix(true, false);
  const gw = (lx, lz) => { const v = G.localToWorld(new THREE.Vector3(lx, 0, lz)); return [v.x, v.z]; };
  const nl = PILGRIM.landings.length, R0 = ROAD[ROAD_START];
  const STOPS = (() => { const P = {
    bell: gw(...GREAT.bell), stair: gw(...GREAT.stairFoot), landing: CREST_STAIR[2], gate: CREST_STAIR[3 + nl],
    bridge: [(CREST_STAIR[3 + nl][0] + R0[0]) / 2, (CREST_STAIR[3 + nl][1] + R0[1]) / 2],
    road: ROAD[Math.min(ROAD.length - 1, ROAD_START + 70)].slice(0, 2), crown: C.at(C.rWall) };
    return CLIMB.map(c => ({ ...c, at: P[c.key], r: c.key === 'bell' ? 3.6 : c.key === 'bridge' || c.key === 'road' ? 4.5 : 3.2 })); })();
  const courtStart = gw(0, 21);
  let cur = -1; // index of the stop the player is walking to; -1 before the climb starts
  const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'tw-skip'; skip.textContent = 'Skip to the hall'; skip.hidden = true;
  for (const ev of ['pointerdown', 'pointerup', 'keydown', 'wheel']) skip.addEventListener(ev, e => e.stopPropagation());
  document.body.appendChild(skip);
  const aim = i => { cur = i; const t = STOPS[i]; wayLit.visible = true; wayLit.position.set(t.at[0], groundAt(t.at[0], t.at[1]), t.at[1]); setHint(t.hint); skip.hidden = false; };
  const placeAt = (x, z, to) => place(x, z, to[0] - x, to[1] - z, 6.5, 3.4);
  const startClimb = () => { state = 'climb'; card.hidden = true; aim(0); };
  const toHall = () => { cur = -1; skip.hidden = true; wayLit.visible = false; placeSummit(); state = 'entry'; setHint(''); entry(); };
  // goStop(key): land the player at that stop as if they had walked to it; 'crown' lands at the court before the founder's hall
  const goStop = key => {
    const i = CLIMB.findIndex(c => c.key === key); if (i < 0) return false;
    if (key === 'crown') { toHall(); return true; }
    const at = key === 'bell' ? courtStart : STOPS[i].at;
    state = 'climb'; card.hidden = true; placeAt(at[0], at[1], STOPS[i + 1].at);
    aim(i + 1); return true;
  };
  skip.addEventListener('click', () => toHall());
  const intro = () => { state = 'intro'; show(`<p>${esc(climbIntro(want))}</p><div class="tw-row"><button type="button" class="go" data-tw="climb">Start the climb</button></div>`, 'The start of the climb'); const g = card.querySelector('.go'); g && g.focus({ preventScroll: true }); };
  { const [bx, bz] = gw(GREAT.bell[0] + 1.9, GREAT.bell[1] + 1.2); const m = students[0]; if (m) stand(m, bx, bz, courtStart[0] - bx, courtStart[1] - bz); }
  placeAt(courtStart[0], courtStart[1], STOPS[0].at);
  // wayfarers (his B on tw-build-look-2): a student beside each of four stops, to talk to for more about the sect; built after the page is live
  (async () => {
    const keys = Object.keys(WAYFARERS);
    const got = await Promise.all(keys.map(async (k, n) => {
      try {
        const i = CLIMB.findIndex(c => c.key === k), [x, z] = STOPS[i].at, to = STOPS[i + 1].at, dx = to[0] - x, dz = to[1] - z, L = Math.hypot(dx, dz) || 1;
        // 2.4 m to the side of the way; take the side whose ground is nearer the stop's own height, so nobody stands over the edge
        const g0 = groundAt(x, z), cand = [1, -1].map(sg => [x - sg * dz / L * 2.4, z + sg * dx / L * 2.4]).sort((a, b) => Math.abs(groundAt(...a) - g0) - Math.abs(groundAt(...b) - g0))[0];
        const m = await wayfarer(n); stand(m, cand[0], cand[1], x - cand[0], z - cand[1]);
        return { key: k, m, height: (m.F && m.F.stature) || 1.7, info: WAYFARERS[k] };
      } catch (e) { console.warn('wayfarer', k, e); return null; }
    }));
    const list = got.filter(Boolean);
    if (list.length) api.wayfarers = talk({ S, A, cam, hooks, people: list, reach: 7, far: 10, busy: () => state !== 'climb' });
  })();

  const entry = () => { show(`<p>${esc(entryLine(want))}</p><div class="tw-row"><button type="button" class="go" data-tw="walkin">Walk in</button></div>`, 'Arriving at the sect'); const g = card.querySelector('.go'); g && g.focus({ preventScroll: true }); };
  card.addEventListener('click', e => {
    const b = e.target.closest('[data-tw]'); if (!b) return; const k = b.dataset.tw;
    if (k === 'climb') startClimb();
    else if (k === 'walkin') { card.hidden = true; state = 'elders'; setHint("Walk into the founder's hall."); }
    else if (k === 'sense') { const p = b.getAttribute('aria-pressed') === 'true'; b.setAttribute('aria-pressed', String(!p)); }
    else if (k === 'scan') { scanN = card.querySelectorAll('[data-tw="sense"][aria-pressed="true"]').length; state = 'stone'; glow.intensity = 30; pulse = now(); speak('stone', stoneLine(scanN), 5000, () => { state = 'team'; show(`<p>${esc(TEAM)}</p><div class="tw-row"><button type="button" class="go" data-tw="onward">Go on</button></div>`, 'Your team'); }); }
    else if (k === 'onward') endCard();
    else if (k === 'again') location.href = '/between/walk';
    else if (k === 'stay') { card.hidden = true; state = 'free'; setHint(''); if (ELD.shaman && !api.talk) { api.doubt = doubtQuest({ S, A, cam, hooks, at, wrist }); api.talk = talk({ S, A, cam, hooks, people: [{ key: 'shaman', m: ELD.shaman, height: 1.78 }], onGo: () => api.doubt.start(), busy: () => api.doubt.busy() }); api.doubt.restore(); } }
  });
  let pulse = 0;
  function endCard() {
    state = 'end'; setHint('');
    show(`<b>You are an Initiate</b><p>${esc(endLine(want))}</p><div class="tw-row"><button type="button" class="go" data-tw="again">Walk it again</button><button type="button" data-tw="stay">Stay a while</button></div>`, 'The end of the walk');
  }
  function scanCard() {
    show(`<b>The heart stone</b><p>Stand with your team and notice your body. Tap each one you feel right now.</p><div class="tw-row">${SENSATIONS.map(s => `<button type="button" data-tw="sense" aria-pressed="false">${s}</button>`).join('')}</div><div class="tw-row"><button type="button" class="go" data-tw="scan">Touch the stone</button></div>`, 'The four-sensation scan');
  }

  function tick() {
    const t = now(), px = A.position.x, pz = A.position.z;
    if (glow.intensity > 0) glow.intensity = Math.max(0, 30 * (1 - (t - pulse) / 3500));
    if (carrying) { const w = wrist(); if (w) { w.getWorldPosition(v3); bucket.position.set(v3.x, v3.y - 0.3, v3.z); } else bucket.position.set(px + 0.45, A.position.y + 0.5, pz); }
    wayLit.children[1] && (wayLit.children[1].scale.setScalar(1 + 0.12 * Math.sin(t / 300)));
    // the speaker's pip
    if (line && ELD[line.k]) { v3.set(ELD[line.k].h.position.x, ELD[line.k].h.position.y + 2.0, ELD[line.k].h.position.z).project(cam); pip.hidden = v3.z > 1; pip.style.left = (v3.x * 0.5 + 0.5) * innerWidth + 'px'; pip.style.top = (-v3.y * 0.5 + 0.5) * innerHeight + 'px'; } else pip.hidden = true;
    if (line && t > lineUntil) { const a = after; line = null; after = null; if (state === 'elders' || state === 'readback' || state === 'climb') card.hidden = true; if (a) a(); }
    if (state === 'climb' && cur >= 0) {
      const t = STOPS[cur];
      if (Math.hypot(px - t.at[0], pz - t.at[1]) < t.r) {
        if (t.key === 'crown') { toHall(); }
        else { const said = t.said; wayLit.visible = false; aim(cur + 1); speak('guide', said, 4200); }
      }
    } else if (state === 'elders') {
      const [qx, qy] = toPlan(px, pz);
      if (qy < 21) setHint('');
      if (!line) {
        // the nearest Elder not yet heard, once the player is inside the hall and within 10 m
        let best = null, bd = 10;
        for (const k of Object.keys(LINES)) { if (spoke.has(k) || !ELD[k]) continue; const d = Math.hypot(ELD[k].h.position.x - px, ELD[k].h.position.z - pz); if (d < bd && qy < 20.5) { bd = d; best = k; } }
        if (best) { spoke.add(best); speak(best, LINES[best], 3800); }
        else if (spoke.size === Object.keys(LINES).length && Math.hypot(px - DISC[0], pz - DISC[1]) < 4.6 && ELD.shaman) {
          state = 'readback'; speak('shaman', readBack(want), 7000, () => { state = 'chore'; carrying = true; bucket.visible = true; wayLit.visible = true;
            // two students leave the court for the stone
            const [a, b] = [students[1], students[5]]; const front = [at(ALTAR.r - 0.9, -1.5), at(ALTAR.r - 0.9, 1.5)];
            [a, b].forEach((m, i) => { if (m) stand(m, front[i][0], front[i][1], stone[0] - front[i][0], stone[1] - front[i][1]); if (m) m.h.position.y = stoneY + 0.02; });
            setHint('Carry the bucket to the heart stone, behind the hall.'); });
        }
      }
    } else if (state === 'chore') {
      if (Math.hypot(px - stone[0], pz - stone[1]) < 2.4 && A.position.y > stoneY - 0.8) {
        carrying = false; const [bx, bz] = at(ALTAR.r + 1.3, 0.5); bucket.position.set(bx, groundAt(bx, bz), bz); wayLit.visible = false;
        state = 'scan'; setHint(''); scanCard();
      }
    }
  }
  hooks.push(tick);
  const api = {};
  Object.assign(api, { state: () => state, goStop, climb: () => ({ cur, stops: STOPS }), spoke: () => [...spoke], want, stone, stoneY, at, plan, toPlan, tick, ELD, students, bucket, DISC });
  window.heaven.trainee = api;
  if (!goStop(startStop)) intro();
  return api;
}
