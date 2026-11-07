// The cultivation characters sitting (cultivated character, first slice, 2026-11-07). Ported from the council's gate
// round (Six-faces-council council/callsheets/stills/2026-11-06-cultivated-character-gate/make/gate.html): the sit,
// the drape of the skirt over the thighs, the qi glow below the navel, and the jian. The gate house and the place are
// not here; the page supplies the seat (a stone top at y = 0 + seatTop, returned) and the light.
// makeSitter({ who, outfit, layer }) -> { holder, setLayer(n, dt), update(dt), seatTop, glowAt, jian, dispose }.
// The figure is built at the holder's origin, facing +z of its own frame is wherever the body faces (F.fr.f); the page
// turns the holder to face its camera. Build the sitter before moving the holder: the drape is computed in place.
import * as THREE from "three";
import * as M from "./make/mix.js";
import * as FG from "./make/figure.js";
import { BODIES } from "./walker.js";
import { glowChange } from "./glow.js";

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wp = b => b.getWorldPosition(V());
let REG = null;
const sm = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b);

function glowTexture() {
  const cv = document.createElement("canvas"); cv.width = cv.height = 256; const cx = cv.getContext("2d");
  const rg = cx.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, "rgba(255,250,232,1)"); rg.addColorStop(0.18, "rgba(255,226,150,0.85)");
  rg.addColorStop(0.5, "rgba(255,190,90,0.28)"); rg.addColorStop(1, "rgba(255,170,60,0)");
  cx.fillStyle = rg; cx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makeJian() {
  const J0 = new THREE.Group();
  const lac = new THREE.MeshStandardMaterial({ color: 0x2a211d, roughness: 0.45 }), brass = new THREE.MeshStandardMaterial({ color: 0xa88a4e, roughness: 0.4, metalness: 0.7 }),
    grip = new THREE.MeshStandardMaterial({ color: 0x3c2a22, roughness: 0.8 }), cord = new THREE.MeshStandardMaterial({ color: 0x9a3b2c, roughness: 0.9 });
  const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.022, 0.74, 14), lac); sc.scale.z = 0.45; sc.position.y = -0.37; J0.add(sc);
  for (const [yy, hh] of [[-0.02, 0.05], [-0.25, 0.025], [-0.72, 0.05]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, hh, 14), brass); b.scale.z = 0.5; b.position.y = yy; J0.add(b); }
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.022, 0.03), brass); guard.position.y = 0.012; J0.add(guard);
  const gr = new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.016, 0.17, 12), grip); gr.position.y = 0.11; J0.add(gr);
  const pm = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), brass); pm.scale.set(1, 0.7, 0.6); pm.position.y = 0.205; J0.add(pm);
  for (let i = 0; i < 7; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.002, 0.11, 4), cord); t.position.set((i - 3) * 0.004, 0.26, 0.002 * (i % 2)); J0.add(t); }
  return J0;
}

export async function makeSitter({ who = "f", outfit = "C1", layer = 1, jian = true, thighC = 0.10, thighR = 0.15, glowUp = 0.55, jianTurn = -1.42 } = {}) {
  if (!REG) REG = await fetch(new URL("./make/parts.json", import.meta.url)).then(r => r.json());
  const X = await M.build({ ...BODIES[who], direction: outfit[0], outfit }, REG);
  const F = X.F, { f, l } = F.fr, up = V(0, 1, 0), dn = V(0, -1, 0), k = F.stature / 1.75, r = l.clone().negate();
  const holder = new THREE.Group(); holder.add(F.root);
  F.root.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; } });
  holder.updateMatrixWorld(true);

  // before the sit: each garment part's points at the stand (the fit pose), and the hip axis there
  const hipMid = () => wp(F.bones.hipL).add(wp(F.bones.hipR)).multiplyScalar(0.5);
  const H0 = hipMid(), KNEE0 = 0.5 * (wp(F.bones.kneeL).y + wp(F.bones.kneeR).y);
  const STAND = new Map(); for (const pt of X.parts) STAND.set(pt, Float32Array.from(M.partWorld(pt)));

  // the sit: on a step, thighs level, shins down, feet on the ground; hands cupped over the lower belly
  FG.resetPose(F);
  for (const [s, sg] of [["L", 1], ["R", -1]]) {
    FG.aim(F, "hip" + s, "knee" + s, V().addScaledVector(f, 0.97).addScaledVector(dn, 0.05).addScaledVector(l, sg * 0.10));
    FG.aim(F, "knee" + s, "ankle" + s, V().addScaledVector(dn, 1).addScaledVector(f, 0.10).addScaledVector(l, sg * 0.02));
    FG.aim(F, "shoulder" + s, "elbow" + s, V().addScaledVector(dn, 1).addScaledVector(f, 0.22).addScaledVector(l, sg * 0.16));
  }
  FG.aim(F, "neck", "head", V().addScaledVector(up, 1).addScaledVector(f, 0.12));
  F.root.updateMatrixWorld(true);
  const P = F.mesh.geometry.attributes.position, v = V(); let lo = 1e9, seat = 1e9, frontBelly = -1e9;
  const skinAll = fn => { for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); F.mesh.applyBoneTransform(i, v); v.applyMatrix4(F.mesh.matrixWorld); fn(i, v); } };
  skinAll((i, v) => { lo = Math.min(lo, v.y); if (F.boneName[F.dom[i]] === "hips") seat = Math.min(seat, v.y); });
  F.root.position.y -= lo - 0.004; F.root.updateMatrixWorld(true); seat -= lo - 0.004;

  // the glow: the lower dantian, about three finger widths below the navel, just in front of the robe
  const hips = wp(F.bones.hips), sp1 = wp(F.bones.spine01), Hs = hipMid();
  const gy = Math.max(hips.y + glowUp * (sp1.y - hips.y), Hs.y + (thighR + 0.05) * k);
  skinAll((i, v) => { const d = v.clone().sub(hips); if (Math.abs(v.y - gy) < 0.03 && Math.abs(d.dot(l)) < 0.05) frontBelly = Math.max(frontBelly, d.dot(f)); });
  const glowAt = hips.clone().setY(gy).addScaledVector(f, frontBelly + 0.05 * k);
  for (const [s, sg] of [["L", 1], ["R", -1]]) {
    const tgt = glowAt.clone().addScaledVector(l, sg * 0.045 * k).addScaledVector(f, -0.01 * k).addScaledVector(dn, 0.03 * k);
    const e = wp(F.bones["elbow" + s]); FG.aim(F, "elbow" + s, "wrist" + s, tgt.sub(e));
  }
  F.root.updateMatrixWorld(true); F.mesh.skeleton.update();

  // the drape: the skirt below the hip axis is a rigid shell skinned to the thighs, which folds into a hoop when they
  // come level. Each point below the axis is placed from where it hung at the stand (see the gate round's comments).
  const H1 = hipMid(), kneeMid = wp(F.bones.kneeL).add(wp(F.bones.kneeR)).multiplyScalar(0.5), tdir = kneeMid.clone().sub(H1), L = tdir.length(); tdir.normalize();
  const seatTop = seat + 0.006, hs = H1.y - seatTop;
  const q = V(), fr = V(), bk = V(), sk = V();
  const DRAPE = /^(robe|outer$|sash-tail|whisk-hair|cape)/;
  let draped = 0;
  for (const pt of X.parts) {
    if (!DRAPE.test(pt.name)) continue;
    const S0 = STAND.get(pt), S1 = M.partWorld(pt), W = new Float32Array(S1.length);
    for (let i = 0; i < S1.length / 3; i++) {
      q.set(S0[i * 3], S0[i * 3 + 1], S0[i * 3 + 2]).sub(H0); const d = -q.y, a = q.dot(f), b = q.dot(l);
      sk.set(S1[i * 3], S1[i * 3 + 1], S1[i * 3 + 2]);
      const below = sm(-0.02 * k, 0.06 * k, d); if (below <= 0) { W.set([sk.x, sk.y, sk.z], i * 3); continue; }
      const tc = thighC * k, R = thighR * k, c = Math.abs(b) - tc, ac = Math.abs(c), dd = Math.max(d, 0);
      let lift, bs, fall = 0;
      if (ac <= R) { lift = Math.sqrt(R * R - ac * ac); bs = b; }
      else if (c > 0) { lift = 0; bs = Math.sign(b) * (tc + R); fall = c - R; }
      else { lift = 0; bs = 0; }
      lift = Math.max(lift, 0.06 * k) + 0.12 * Math.max(a - 0.12 * k, 0);
      if (dd <= L) fr.copy(H1).addScaledVector(l, bs).addScaledVector(tdir, dd).addScaledVector(up.clone().addScaledVector(tdir, -up.dot(tdir)).normalize(), lift);
      else { const e = dd - L, rho = Math.max(0.04 * k, lift), th = Math.min(e / rho, Math.PI / 2), n = up.clone().addScaledVector(tdir, -up.dot(tdir)).normalize();
        fr.copy(H1).addScaledVector(l, bs).addScaledVector(tdir, L).addScaledVector(n, rho * Math.cos(th)).addScaledVector(tdir, rho * Math.sin(th)).addScaledVector(dn, Math.max(0, e - rho * Math.PI / 2)); }
      fr.addScaledVector(dn, fall);
      bk.copy(H1).addScaledVector(l, bs).addScaledVector(f, a).addScaledVector(dn, Math.min(dd, hs)).addScaledVector(f, -0.35 * Math.max(0, dd - hs));
      fr.lerp(bk, 1 - sm(-0.07 * k, 0.05 * k, a));
      const fwd = fr.clone().sub(H1).dot(f); if (fwd < 0.20 * k && fr.y < seatTop + 0.004) fr.y = seatTop + 0.004;
      sk.lerp(fr, below); W.set([sk.x, sk.y, sk.z], i * 3); draped++;
    }
    pt.settled = W;
  }
  M.legsInMotion(X, false);
  // the trousers' thighs are under the robe at the stand; seated, the robe lies over them: the part the robe covered
  // at the stand is not drawn, and never the shins
  let hemY = 1e9; for (const pt of X.parts) if (/^(robe|outer)$/.test(pt.name)) { const S0 = STAND.get(pt); for (let i = 1; i < S0.length; i += 3) hemY = Math.min(hemY, S0[i]); }
  const cut = Math.max(hemY, KNEE0) + 0.10 * k;
  for (const pt of X.parts) {
    if (!/^trousers/.test(pt.name)) continue;
    const S0 = STAND.get(pt), I = pt.geo.index.array, keep = [];
    for (let t = 0; t < I.length; t += 3) if (!(S0[I[t] * 3 + 1] > cut && S0[I[t + 1] * 3 + 1] > cut && S0[I[t + 2] * 3 + 1] > cut)) keep.push(I[t], I[t + 1], I[t + 2]);
    pt.geo.setIndex(keep);
  }
  // drawn as unskinned copies of each settled part, every attribute kept (the painted shells read their own)
  const drapedMeshes = [];
  for (const pt of X.parts) {
    const W = pt.settled; if (!W) continue;
    const g = pt.geo.clone(); g.setAttribute("position", new THREE.BufferAttribute(W, 3)); g.deleteAttribute("skinIndex"); g.deleteAttribute("skinWeight"); g.computeVertexNormals();
    const a = new THREE.Mesh(g, pt.mesh.material), b = new THREE.Mesh(g, pt.back.material); a.frustumCulled = b.frustumCulled = false; b.visible = pt.back.visible;
    holder.add(a, b); drapedMeshes.push(g); pt.mesh.visible = pt.back.visible = false;
  }

  // the glow: a halo, a bright core and a small warm light, all sized by the layer
  const gt = glowTexture(), gc = new THREE.Color("#ffd88a");
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, color: gc, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, color: gc, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
  halo.renderOrder = core.renderOrder = 10; // the widest sleeves hang over the belly: the glow shows through the cloth as light
  halo.position.copy(glowAt); core.position.copy(glowAt).addScaledVector(f, 0.01);
  const light = new THREE.PointLight(gc, 0, 0.9 * k, 2); light.position.copy(glowAt).addScaledVector(f, 0.05);
  holder.add(halo, core, light);

  // the jian lies on the step at her right side, hilt toward the front, angled back and out
  let jianObj = null;
  if (jian) {
    jianObj = makeJian(); jianObj.scale.setScalar(k);
    const jAt = hips.clone().setY(seatTop + 0.013 * k).addScaledVector(r, 0.46 * k).addScaledVector(f, 0.06 * k);
    const jd = f.clone().multiplyScalar(Math.cos(jianTurn)).addScaledVector(r, Math.sin(jianTurn));
    jianObj.position.copy(jAt); jianObj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(jd.clone().cross(up).normalize(), jd, up.clone()));
    holder.add(jianObj);
  }

  // layer state: setLayer eases the glow to the new brightness; a layer that opens sends one pulse that fades out
  let cur = 0, target = 0, pulse = 0, prevLayer = null, time = 0;
  const apply = (b, p) => {
    const G = b + 0.25 * p;
    halo.material.opacity = Math.min(1, 0.35 + 0.6 * G); halo.scale.setScalar((0.12 + 0.2 * G) * k);
    core.material.opacity = Math.min(1, 0.4 + 0.55 * G); core.scale.setScalar((0.04 + 0.05 * G) * k);
    light.intensity = 1.4 * G;
  };
  const setLayer = (n, instant = false) => {
    const c = glowChange(prevLayer, n); prevLayer = n; target = c.brightness; if (c.pulse) pulse = 1;
    if (instant) { cur = target; apply(cur, pulse); }
  };
  setLayer(layer, true);
  return {
    holder, X, who, outfit, seatTop, glowAt, jian: jianObj, draped,
    setLayer,
    // dt in seconds; eases the glow, breathes it slowly, fades a pulse
    update(dt) {
      time += dt; cur += (target - cur) * Math.min(1, dt * 3); pulse = Math.max(0, pulse - dt * 0.8);
      apply(cur * (1 + 0.04 * Math.sin(time * 1.6)), pulse);
    },
    dispose() { holder.removeFromParent(); for (const g of drapedMeshes) g.dispose(); gt.dispose(); jianObj?.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); M.dispose(X); },
  };
}
