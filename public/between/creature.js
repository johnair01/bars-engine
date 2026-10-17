/* The Between as a creature, from Wendell's concept views (round 2, 2026-10-17): round and fluffy, scaled in leaves that
   fade from teal to plum, a sleepy smile and a sprout on top. It sleeps when nobody is near, opens its eyes and turns
   toward whoever comes close, bounces when an offering flies in, and glows between two people sitting with it.
   Its states keep their round-1 meanings: a spark is small and plum only; charged is restless; allied is leafier and
   flowers; stale is grey and dim, and never dies. */
import * as THREE from "three";
import { mergeStatic } from "./hollow.js";

const TEAL = new THREE.Color(0x36c9c6), PLUM = new THREE.Color(0xa64cc0), GREY = new THREE.Color(0x8d857b);
const R = 0.5; // body radius before growth

export function createCreature() {
  const group = new THREE.Group();      // placed in the room; turns to face
  const bodyG = new THREE.Group();      // squash and stretch, breathing
  group.add(bodyG);

  // a soft glowing core shows between the leaves
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x5a8a80, emissive: 0x8fe0c8, emissiveIntensity: 0.6, roughness: 0.6 });
  const core = new THREE.Mesh(new THREE.SphereGeometry(R * 0.93, 28, 20), coreMat);
  bodyG.add(core);

  // the leaf scales: pointed leaves laid over the sphere, tips down, like feathers
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0.07); leafShape.quadraticCurveTo(0.065, 0.02, 0, -0.1); leafShape.quadraticCurveTo(-0.065, 0.02, 0, 0.07);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 4);
  { const p = leafGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -(x * x) * 6 + (y + 0.1) * 0.25); } leafGeo.computeVertexNormals(); }
  const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.55, side: THREE.DoubleSide });
  const glowU = { value: 0.55 };
  leafMat.onBeforeCompile = sh => {
    sh.uniforms.uGlow = glowU;
    sh.fragmentShader = "uniform float uGlow;\n" + sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\n totalEmissiveRadiance += vColor.rgb * uGlow;\n#endif");
  };
  const N = 340;
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, N);
  const base = []; // each leaf's rest pose
  const o = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N; i++) {
    const y = 1 - (i + 0.5) / N * 2, rr = Math.sqrt(1 - y * y), a = i * 2.39996323;
    const n = new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr);
    const face = n.z > 0.8 && Math.abs(n.y) < 0.38 && Math.abs(n.x) < 0.42; // keep the face clear
    // rest orientation: facing out, tips down along the meridian
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    const tang = new THREE.Vector3().crossVectors(up, n); if (tang.lengthSq() < 1e-4) tang.set(1, 0, 0);
    const meridian = new THREE.Vector3().crossVectors(n, tang.normalize());
    const ly = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const roll = Math.atan2(new THREE.Vector3().crossVectors(ly, meridian).dot(n), ly.dot(meridian));
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
    base.push({ n, q, face, ph: Math.random() * 6 });
  }
  leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  bodyG.add(leaves);
  const leafColor = new THREE.Color();
  function paintLeaves(mode) {
    for (let i = 0; i < N; i++) {
      const b = base[i];
      if (mode === "spark") leafColor.copy(PLUM).offsetHSL(0, 0, (b.n.y) * 0.06);
      else leafColor.copy(TEAL).lerpHSL(PLUM, THREE.MathUtils.smoothstep(b.n.x, -0.5, 0.5)).offsetHSL(0, 0, b.n.y * 0.05 + (b.ph - 3) * 0.006);
      if (mode === "stale") leafColor.lerp(GREY, 0.75);
      leaves.setColorAt(i, leafColor);
    }
    leaves.instanceColor.needsUpdate = true;
  }

  // the face: closed eyes are little downward arcs, open eyes dark beads with a glint; a small smile
  const ink = new THREE.MeshBasicMaterial({ color: 0x2a1a22 });
  const face = new THREE.Group(); face.position.set(0, 0.02, R * 0.9); bodyG.add(face);
  const arc = new THREE.TorusGeometry(0.06, 0.012, 6, 14, Math.PI);
  const closedL = new THREE.Mesh(arc, ink), closedR = new THREE.Mesh(arc, ink);
  closedL.position.set(-0.13, 0.06, 0.03); closedR.position.set(0.13, 0.06, 0.03); closedL.rotation.z = closedR.rotation.z = Math.PI; // ‿ shapes
  const openGeo = new THREE.SphereGeometry(0.05, 12, 10);
  const openL = new THREE.Mesh(openGeo, ink), openR = new THREE.Mesh(openGeo, ink);
  openL.position.set(-0.13, 0.06, 0.02); openR.position.set(0.13, 0.06, 0.02); openL.scale.z = openR.scale.z = 0.5;
  const glint = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const e of [openL, openR]) { const g = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), glint); g.position.set(0.016, 0.018, 0.04); e.add(g); }
  const happyGeo = new THREE.TorusGeometry(0.055, 0.012, 6, 14, Math.PI); // ^ ^ when delighted
  const happyL = new THREE.Mesh(happyGeo, ink), happyR = new THREE.Mesh(happyGeo, ink);
  happyL.position.copy(closedL.position); happyR.position.copy(closedR.position);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.011, 6, 14, Math.PI), ink); smile.position.set(0, -0.06, 0.035); smile.rotation.z = Math.PI;
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xff9ec0, transparent: true, opacity: 0.45 });
  const blushL = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), blushMat), blushR = blushL.clone();
  blushL.position.set(-0.22, -0.02, 0.0); blushR.position.set(0.22, -0.02, 0.0); blushL.rotation.y = -0.4; blushR.rotation.y = 0.4;
  face.add(closedL, closedR, openL, openR, happyL, happyR, smile, blushL, blushR);
  // the face sits on the sphere's front; a pale patch behind it so the features read
  const facePatch = new THREE.Mesh(new THREE.SphereGeometry(R * 0.95, 20, 14, Math.PI * 0.37, Math.PI * 0.26, Math.PI * 0.37, Math.PI * 0.26), new THREE.MeshStandardMaterial({ color: 0xd8f7ec, emissive: 0xb8f0dc, emissiveIntensity: 0.55, roughness: 0.8 }));
  facePatch.rotation.y = -Math.PI / 2; bodyG.add(facePatch);

  // the sprout, and flowers for when it is allied
  const sproutMat = new THREE.MeshStandardMaterial({ color: 0x7fd07a, emissive: 0x4fa84a, emissiveIntensity: 0.5, roughness: 0.6, side: THREE.DoubleSide });
  const sprout = new THREE.Group(); sprout.position.y = R * 0.95; bodyG.add(sprout);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.16, 6), sproutMat); stem.position.y = 0.08; sprout.add(stem);
  const sLeafShape = new THREE.Shape(); sLeafShape.moveTo(0, 0); sLeafShape.quadraticCurveTo(0.07, 0.05, 0.15, 0); sLeafShape.quadraticCurveTo(0.07, -0.04, 0, 0);
  const sLeafGeo = new THREE.ShapeGeometry(sLeafShape, 4);
  const sl = new THREE.Mesh(sLeafGeo, sproutMat), sr = new THREE.Mesh(sLeafGeo, sproutMat);
  sl.position.y = sr.position.y = 0.15; sl.rotation.set(0, 0, 0.55); sr.rotation.set(0, Math.PI, 0.55); sprout.add(sl, sr);
  const flowers = new THREE.Group(); bodyG.add(flowers);
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xf6b2dc, emissive: 0xe080c0, emissiveIntensity: 0.6, roughness: 0.5 });
  for (let k = 0; k < 4; k++) {
    const f = new THREE.Group(); const a = k / 4 * Math.PI * 2 + 0.5, el = 0.55;
    f.position.set(Math.cos(a) * Math.cos(el) * R, Math.sin(el) * R, Math.sin(a) * Math.cos(el) * R); f.lookAt(f.position.clone().multiplyScalar(2));
    for (let p = 0; p < 5; p++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), petalMat); const pa = p / 5 * Math.PI * 2; m.position.set(Math.cos(pa) * 0.03, Math.sin(pa) * 0.03, 0.01); m.scale.z = 0.4; f.add(m); }
    flowers.add(f);
  }
  mergeStatic(flowers);

  // little "z"s rise while it sleeps
  const zMat = new THREE.SpriteMaterial({ map: zTexture(), transparent: true, depthWrite: false });
  const zs = [0, 1, 2].map(i => { const s = new THREE.Sprite(zMat.clone()); s.scale.setScalar(0.14); group.add(s); return s; });

  // a soft blob of shade beneath
  const shade = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false }));
  shade.rotation.x = -Math.PI / 2; shade.position.y = 0.012; group.add(shade);

  let mode = null, yaw = 0, awake = 0, wakeAt = -9, bounceAt = -9, blinkAt = 2, delightUntil = -9;
  const st = { phase: "spark", state: "steadied", stale: false, sat: 3, target: null, together: false };

  function update(t, dt, s) {
    Object.assign(st, s);
    const m = st.stale ? "stale" : st.phase === "spark" ? "spark" : "between";
    if (m !== mode) { mode = m; paintLeaves(m); }
    const grow = (st.phase === "spark" ? 0.55 : 0.82 + st.sat * 0.025);
    const breath = (t % 10) < 4 ? Math.sin((t % 10) / 4 * Math.PI / 2) : Math.cos(((t % 10) - 4) / 6 * Math.PI / 2); // 4 s in, 6 s out
    // waking and sleeping: awake eases toward 1 when someone is near (and it is not stale)
    const wantAwake = st.target && !st.stale ? 1 : 0;
    if (wantAwake && awake < 0.5 && t - wakeAt > 3) wakeAt = t;
    awake += (wantAwake - awake) * Math.min(1, dt * (wantAwake ? 3 : 0.8));
    // turn toward whoever came close, or drift back to face the room
    let want = 0;
    if (st.target) want = Math.atan2(st.target.x - group.position.x, st.target.z - group.position.z);
    let d = want - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += d * Math.min(1, dt * (st.target ? 2.5 : 0.5));
    group.rotation.y = yaw;
    // squash and stretch: the waking hop, the bounce when fed, breathing underneath
    const hop = Math.max(0, 1 - (t - wakeAt) / 0.6), bnc = Math.max(0, 1 - (t - bounceAt) / 0.9);
    const jump = Math.abs(Math.sin((t - bounceAt) * 10)) * bnc * 0.22 + Math.sin(Math.min(1, (t - wakeAt) / 0.6) * Math.PI) * hop * 0.1;
    const squash = 1 + Math.sin((t - bounceAt) * 20) * bnc * 0.08;
    const jitter = st.state === "charged" && !st.stale ? 0.025 : 0;
    const k = grow * (1 + 0.035 * breath * (awake > 0.5 ? 1 : 1.6));
    bodyG.scale.set(k / Math.sqrt(squash), k * squash, k / Math.sqrt(squash));
    bodyG.position.set((Math.random() - 0.5) * jitter, R * k + jump, (Math.random() - 0.5) * jitter);
    bodyG.rotation.z = st.target ? 0 : Math.sin(t * 0.4) * 0.04 * (1 - awake); // a slow sway while asleep
    // leaves: rest flat, ruffle when charged, lift and spread when allied
    const ruff = st.state === "charged" && !st.stale ? 0.5 : 0.08, spread = st.state === "allied" ? 0.25 : 0.12;
    for (let i = 0; i < N; i++) {
      const b = base[i];
      if (b.face) { o.scale.setScalar(0); o.updateMatrix(); leaves.setMatrixAt(i, o.matrix); continue; }
      o.position.copy(b.n).multiplyScalar(R * 0.96);
      o.quaternion.copy(b.q);
      o.rotateX(-(spread + Math.sin(t * (st.state === "charged" ? 9 : 1.2) + b.ph) * ruff * 0.3));
      o.scale.setScalar(1.4 + (st.state === "allied" ? 0.15 : 0));
      o.updateMatrix(); leaves.setMatrixAt(i, o.matrix);
    }
    leaves.instanceMatrix.needsUpdate = true;
    // glow: brighter while two people sit with it, dim when stale
    const together = st.together && !st.stale ? 1 : 0;
    glowU.value = st.stale ? 0.06 : 0.32 + 0.14 * breath + 0.45 * together;
    coreMat.emissiveIntensity = st.stale ? 0.1 : 0.45 + 0.2 * breath + 0.7 * together;
    coreMat.emissive.setHex(st.phase === "spark" ? 0xf0c8f0 : 0xbff0dd);
    // eyes: closed asleep, open awake with blinks, ^ ^ when delighted
    if (t > blinkAt) blinkAt = t + 2.5 + Math.random() * 3;
    const blinking = blinkAt - t < 0.12;
    const delighted = t < delightUntil;
    const open = awake > 0.5 && !blinking && !delighted && !st.stale;
    openL.visible = openR.visible = open;
    openL.scale.y = openR.scale.y = st.state === "charged" ? 0.55 : 1;
    happyL.visible = happyR.visible = delighted;
    closedL.visible = closedR.visible = !open && !delighted;
    blushL.visible = blushR.visible = !st.stale;
    // sprout and flowers
    sprout.scale.setScalar(st.phase === "spark" ? 0.7 : st.state === "allied" ? 1.5 : 1.1);
    sprout.rotation.z = Math.sin(t * 1.3) * 0.12;
    flowers.visible = st.state === "allied" && !st.stale && st.phase !== "spark";
    // sleeping z's
    zs.forEach((z, i) => {
      const u = ((t * 0.35 + i / 3) % 1);
      z.visible = awake < 0.3;
      z.position.set(0.22 + u * 0.18, R * 2 * grow + 0.05 + u * 0.4, 0.1);
      z.material.opacity = Math.sin(u * Math.PI) * (st.stale ? 0.4 : 0.85);
      z.scale.setScalar(0.06 + u * 0.07);
    });
  }
  return {
    group, update,
    bounce(t) { bounceAt = t; delightUntil = t + 1.4; },
    get awake() { return awake; },
  };
}

function zTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d"); x.fillStyle = "#f4ecff"; x.font = "bold 52px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("z", 32, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
