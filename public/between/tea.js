/* The cup by the fire, slice 1 of between-tea-1 (the solo cup): the kettle stands on a flat stone at the hearth and the cup
   sits in the right hand of whoever is sat there, so a pour is a code-made pose over the sit the same way the sit is a
   code-made pose over the walk (stance.js). The numbers are tea-pose.js, which the probes read without a browser.
   No qi, no shelf and no music yet: the free cup the pass's definition of done asks for, so a person who has worked through
   nothing can still sit down and pour.
   bt-tea-needs-a-spot: both shells' placements are full and roomWrite refuses a fixed spot, so the kettle is drawn here at the
   fire, from the moment the room is built, with the cup on its stone. bt-cup-is-the-figure: the cup is parented to the right
   wrist and marked noPaint, so the paint pass leaves it to the figure's own light (a cup lit by the room alone reads as a dark
   shape). Look tea-look-2 (his note 2026-10-29, "Cup isn't showing up in players hands"): the cup rides the hand, upright,
   and stays held in the lap after the pour until you stand, when it goes back on the stone. */
import { teaAt, sipAt, HAND, KETTLE, CUP, TOTAL } from "./tea-pose.js";

const IRON = 0x332f2c, STONE = 0x6a645c, CLAY = 0xd8c8ae, AMBER = 0xd9a24a;

/* One room's kettle and cup. place(seat) moves the kettle to a seat; attach(body) puts the cup in that figure's hand. */
export function buildTea({ THREE, scene, seat, groundY = () => 0 }) {
  const up = new THREE.Vector3(0, 1, 0);
  const g = new THREE.Group(); scene.add(g);
  const iron = new THREE.MeshStandardMaterial({ color: IRON, roughness: 0.55, metalness: 0.35 });
  const rock = new THREE.MeshStandardMaterial({ color: STONE, roughness: 0.95 });
  const clay = new THREE.MeshStandardMaterial({ color: CLAY, roughness: 0.6 });

  const base = new THREE.Group(); g.add(base);            // the stone, the pot and its spout, in the kettle's own frame
  const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 1, 9), rock); base.add(stone);
  const pot = new THREE.Group(); base.add(pot);
  const body = new THREE.Mesh(new THREE.SphereGeometry(KETTLE.body, 14, 10), iron); body.scale.y = 0.82; body.position.y = 0.075; pot.add(body);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.02, 12), iron); lid.position.y = 0.16; pot.add(lid);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.024, 0.13, 8), iron);
  spout.position.set(-0.075, 0.14, 0.02); spout.rotation.z = 0.9; pot.add(spout);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.009, 6, 12, Math.PI), iron);
  handle.position.set(0.02, 0.17, 0); handle.rotation.set(0, 0, 0); pot.add(handle);
  const lipAt = new THREE.Object3D(); lipAt.position.set(-0.13, 0.19, 0.02); pot.add(lipAt);   // where the tea comes out

  const cup = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(CUP.r, CUP.r * 0.78, CUP.h, 14), clay); cup.add(bowl);
  const ear = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 10), clay); ear.position.set(CUP.r * 0.9, 0.004, 0); ear.rotation.y = Math.PI / 2; cup.add(ear);
  cup.traverse(o => { o.userData.noPaint = true; });
  g.add(cup);

  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 1, 6, 1, true),
    new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.7, depthWrite: false }));
  stream.visible = false; scene.add(stream);

  let seatNow = seat, attached = null, t0 = null, mode = "pour", held = false, stoneH = 0.04;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), dir = new THREE.Vector3(), ws = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0);
  const qp = new THREE.Quaternion(), qt = new THREE.Quaternion(), eu = new THREE.Euler();

  /* The kettle stands where the probe says a seated arm reaches: KETTLE.lip over the seat's top, and the stone makes up
     whatever the ground leaves of that height. */
  function place(s) {
    if (!s) return;
    seatNow = s;
    const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw), lx = fz, lz = -fx;   // the figure's facing, and its left
    const kx = s.x + fx * KETTLE.lip.z + lx * KETTLE.lip.x;
    const kz = s.z + fz * KETTLE.lip.z + lz * KETTLE.lip.x;
    const gy = groundY(kx, kz), lipY = s.top + KETTLE.lip.y;
    stoneH = Math.max(0.04, lipY - gy - KETTLE.height);
    base.position.set(kx, gy, kz);
    base.rotation.y = Math.atan2(s.x - kx, s.z - kz);       // the spout turns toward whoever sits
    stone.scale.y = stoneH; stone.position.y = stoneH / 2;
    pot.position.y = stoneH;
    if (!attached) putDown();
  }
  /* The cup on the stone, beside the pot on the side toward the seat, until a hand takes it up. */
  function putDown() {
    if (cup.parent !== g) g.add(cup);
    base.updateMatrix();
    cup.position.set(0.12, stoneH + CUP.h / 2, 0.08).applyMatrix4(base.matrix);
    cup.quaternion.identity(); cup.scale.setScalar(1); cup.visible = true;
  }

  /* Into the right hand: HAND past the wrist joint, along the hand. A figure without a wrist bone keeps it at the elbow's end. */
  function attach(body3d) {
    const o = body3d && body3d.holder;
    const wrist = o && o.getObjectByName("wristR"), bone = wrist || (o && o.getObjectByName("elbowR"));
    if (!bone) return false;
    attached = body3d; bone.add(cup);
    cup.position.set(0, wrist ? HAND : 0.3, 0);
    cup.visible = true;
    return true;
  }
  function detach() { attached = null; held = false; t0 = null; stream.visible = false; putDown(); }

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
  function tick(t) {
    if (!attached) return null;
    let s;
    if (t0 != null) { s = (mode === "sip" ? sipAt : teaAt)(t - t0); if (s.done) { t0 = null; held = true; } }
    else s = teaAt(TOTAL + 1);
    const S = attached.holder.getObjectByName("shoulderR"), E = attached.holder.getObjectByName("elbowR");
    if (S) S.quaternion.multiply(qt.setFromEuler(eu.set(s.arm.sx, s.arm.sy || 0, s.arm.sz, "XYZ")));   // after pose(), so it sits on the sit
    if (E) E.quaternion.multiply(qt.setFromEuler(eu.set(s.arm.ex, 0, 0, "XYZ")));
    orient(s.tilt);
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

  place(seat);
  return {
    group: g, cup, kettle: base,
    place, attach, detach,
    pour(t) { if (t0 != null || held) return false; t0 = t; mode = "pour"; stream.visible = false; return true; },
    sip(t) { if (t0 != null || !held) return false; t0 = t; mode = "sip"; return true; },
    stop() { detach(); },
    running: () => t0 != null,
    holding: () => !!attached,
    tick,
    total: TOTAL,
  };
}
