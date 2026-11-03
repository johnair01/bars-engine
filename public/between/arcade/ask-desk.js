/* The ask cabinet's own place (council spec .specify/specs/infinite-arcade-hall/, FR-008, task T009): through The Ask's
   screen, a writing desk in pink mist, one sheet on it and a brass lever, as the cabinet's attract screen shows it.

   The player writes down who they are asking and what for (both optional, kept on this device only), goes and asks
   outside the arcade in their own way, and pulls the lever to say the ask is sent. The desk sends nothing and stores the
   ask nowhere but the player's own record (hall.js keeps it with the waiting ticket). The page (./arcade.js) owns the
   walk-free camera and the cards; this file draws the room and the lever. */
import * as THREE from "three";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (hex, o = {}) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.8, ...o });

export const DESK = { stand: V(0, 0, 0.62), look: V(0, 0.95, -0.1) };

export function buildDesk(scene) {
  scene.background = new THREE.Color(0xe7a3c0);
  scene.fog = new THREE.FogExp2(0xefc0d4, 0.12);
  // the mist room: a soft dome from pale pink overhead to plum underfoot
  const dome = new THREE.Mesh(new THREE.SphereGeometry(30, 24, 12), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uA: { value: new THREE.Color(0xf6d5e2) }, uB: { value: new THREE.Color(0x7a3d63) } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "varying vec3 vP; uniform vec3 uA, uB; void main(){ gl_FragColor = vec4(mix(uB, uA, smoothstep(-0.35, 0.4, vP.y)), 1.0); }" }));
  dome.renderOrder = -2; scene.add(dome);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(8, 40), std(0x8a4a72, { roughness: 1 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // the desk, the sheet, the inkpot and the lever
  const wood = std(0x4a2440, { roughness: 0.6 }), brass = std(0xe9b560, { roughness: 0.3, metalness: 0.6 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.62), wood); top.position.set(0, 0.76, -0.1); scene.add(top);
  for (const [x, z] of [[-0.58, -0.36], [0.58, -0.36], [-0.58, 0.16], [0.58, 0.16]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.74, 0.06), wood); l.position.set(x, 0.37, z); scene.add(l); }
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0xfff6ee, roughness: 0.9 }));
  sheet.rotation.set(-Math.PI / 2, 0, 0.08); sheet.position.set(-0.08, 0.787, -0.08); scene.add(sheet);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.07, 12), std(0x1c1424, { roughness: 0.3 })); pot.position.set(-0.42, 0.82, -0.2); scene.add(pot);
  const lever = new THREE.Group(); lever.position.set(0.5, 0.79, -0.15); scene.add(lever);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.04, 16), brass); lever.add(base);
  const arm = new THREE.Group(); arm.position.y = 0.02; lever.add(arm);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), brass); rod.position.y = 0.15; arm.add(rod);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 14, 10), std(0xf6cf7a, { roughness: 0.25, metalness: 0.5, emissive: 0x6a4a10, emissiveIntensity: 0.4 })); knob.position.y = 0.31; arm.add(knob);
  arm.rotation.x = -0.5;
  // light: the mist's own glow and one warm lamp over the desk
  scene.add(new THREE.HemisphereLight(0xffe4ee, 0x6a2f55, 2.2));
  const lamp = new THREE.PointLight(0xffd6a0, 6, 5, 1.6); lamp.position.set(0.2, 2.0, 0.4); scene.add(lamp);
  const key = new THREE.DirectionalLight(0xfff0f4, 1.2); key.position.set(-2, 4, 3); scene.add(key);
  // papers drifting up out of the mist, as the attract screen draws one flying off
  const papers = [];
  for (let i = 0; i < 7; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.16), new THREE.MeshBasicMaterial({ color: 0xfffaf4, transparent: true, opacity: 0.6, side: THREE.DoubleSide, fog: true }));
    p.position.set(-3 + i, 1 + (i % 3) * 0.7, -2.5 - (i % 2)); p.userData.ph = i * 1.3; scene.add(p); papers.push(p); }
  let pull = 0, want = 0;
  return {
    pullLever() { want = 1; },
    frame(dt, T, still) {
      pull += (want - pull) * Math.min(1, dt * 6); arm.rotation.x = -0.5 + pull * 1.0;
      if (!still) for (const p of papers) { p.position.y += dt * 0.08; p.rotation.y += dt * 0.3; p.rotation.z = Math.sin(T + p.userData.ph) * 0.4; if (p.position.y > 3.4) p.position.y = 0.6; }
    },
  };
}
