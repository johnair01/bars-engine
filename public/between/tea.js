/* The cup by the fire, slice 1 of between-tea-1 (the solo cup): the kettle stands on a flat stone at the hearth and the cup
   rides the right forearm of whoever is sat there, so a pour is a code-made pose over the sit the same way the sit is a
   code-made pose over the walk (stance.js). The numbers are tea-pose.js, which the probe reads without a browser.
   No qi, no shelf and no music yet: the free cup the pass's definition of done asks for, so a person who has worked through
   nothing can still sit down and pour.
   bt-tea-needs-a-spot: both shells' placements are full and roomWrite refuses a fixed spot, so the kettle is drawn here at the
   fire. bt-cup-is-the-figure: the cup is parented to the forearm and marked noPaint, so the paint pass leaves it to the
   figure's own light (a cup lit by the room alone reads as a dark shape). */
import { teaAt, ARM, KETTLE, CUP, TOTAL } from "./tea-pose.js";

const IRON = 0x332f2c, STONE = 0x6a645c, CLAY = 0xd8c8ae, AMBER = 0xd9a24a;

/* One room's kettle and cup. place(seat) moves the kettle to a seat; attach(body) puts the cup in that figure's hand. */
export function buildTea({ THREE, scene, seat, groundY = () => 0 }) {
  const qe = new THREE.Quaternion(), eu = new THREE.Euler(), up = new THREE.Vector3(0, 1, 0);
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
  cup.visible = false; g.add(cup);

  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 1, 6, 1, true),
    new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.7, depthWrite: false }));
  stream.visible = false; scene.add(stream);

  let seatNow = seat, attached = null, t0 = null, down = null;
  const fwd = new THREE.Vector3(), left = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), dir = new THREE.Vector3();

  /* The kettle stands where the probe says a seated arm reaches: KETTLE.lip over the seat's top, and the stone makes up
     whatever the ground leaves of that height. */
  function place(s) {
    if (!s) return;
    seatNow = s;
    fwd.set(Math.sin(s.yaw), 0, Math.cos(s.yaw)); left.set(fwd.z, 0, -fwd.x);   // the figure's facing, and its left
    const kx = s.x + fwd.x * KETTLE.lip.z + left.x * KETTLE.lip.x;
    const kz = s.z + fwd.z * KETTLE.lip.z + left.z * KETTLE.lip.x;
    const gy = groundY(kx, kz), lipY = s.top + KETTLE.lip.y, stoneH = Math.max(0.04, lipY - gy - KETTLE.height);
    base.position.set(kx, gy, kz);
    base.rotation.y = Math.atan2(s.x - kx, s.z - kz);       // the spout turns toward whoever sits
    stone.scale.y = stoneH; stone.position.y = stoneH / 2;
    pot.position.y = stoneH;
    if (down) { down.position.set(kx, gy + stoneH + 0.02, kz); down.visible = true; }
  }

  function attach(body3d) {
    const bone = body3d && body3d.holder ? body3d.holder.getObjectByName("elbowR") : null;
    if (!bone) return false;
    attached = body3d; bone.add(cup);
    cup.position.set(0.015, -ARM.fore * 0.8, 0.03);          // down the forearm, a little forward of it
    cup.rotation.set(0, 0, 0); cup.visible = true;
    return true;
  }
  function detach() { if (cup.parent) cup.parent.remove(cup); attached = null; cup.visible = false; stream.visible = false; }
  /* The cup goes down on the stone, where it was poured, and stays there until it is taken up again. */
  function setDown() {
    detach();
    if (!down) { down = cup; g.add(cup); }
    place(seatNow);
  }

  function tick(t) {
    if (t0 == null) return null;
    const s = teaAt(t - t0);
    cup.rotation.x = s.tilt;
    const S = attached && attached.holder.getObjectByName("shoulderR"), E = attached && attached.holder.getObjectByName("elbowR");
    if (S) S.quaternion.multiply(qe.setFromEuler(eu.set(s.arm.sx, 0, s.arm.sz, "XYZ")));   // after pose(), so it sits on the sit
    if (E) E.quaternion.multiply(qe.setFromEuler(eu.set(s.arm.ex, 0, 0, "XYZ")));
    if (s.stream && cup.parent) {
      lipAt.getWorldPosition(a); cup.getWorldPosition(b);
      dir.subVectors(a, b); const len = dir.length();
      if (len > 1e-4) {
        stream.visible = true; stream.position.copy(b).addScaledVector(dir, 0.5);
        stream.quaternion.setFromUnitVectors(up, dir.normalize()); stream.scale.y = len;
      }
    } else stream.visible = false;
    if (s.done) { t0 = null; setDown(); }
    return s;
  }

  place(seat);
  return {
    group: g, cup, kettle: base,
    place, attach, detach,
    pour(t) { if (t0 != null) return false; t0 = t; stream.visible = false; return true; },
    stop() { t0 = null; setDown(); },
    running: () => t0 != null,
    tick,
    total: TOTAL,
  };
}
