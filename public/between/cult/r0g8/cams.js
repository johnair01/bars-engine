// Shared camera presets for round 0b (used by the before and after stages and by checks.js).
import * as THREE from 'three';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const wp = b => b.getWorldPosition(V());

// view -> perspective camera. C carries Fr (fwd, left, hips, neck) and F (bones).
export function camFor(view, C, W, H) {
  const f = C.Fr.fwd, l = C.Fr.left, B = C.F.bones;
  const mix = (a, b) => f.clone().multiplyScalar(a).addScaledVector(l, b).normalize();
  let tgt, dir, dist, lift, fov = 22;
  switch (view) {
    case 'front': tgt = V(0, 0.88, 0); dir = f.clone(); dist = 5.2; lift = 0.25; break;
    case 'back': tgt = V(0, 0.88, 0); dir = f.clone().negate(); dist = 5.2; lift = 0.25; break;
    case 'side': tgt = V(0, 0.88, 0); dir = l.clone(); dist = 5.2; lift = 0.25; break;
    case 'sit': tgt = V(0, 0.68, 0); dir = mix(0.8, 0.6); dist = 4.6; lift = 0.55; break;
    case 'q': tgt = V(0, 0.9, 0); dir = mix(0.8, 0.6); dist = 5.6; lift = 0.25; break;
    // r0g7: back quarters, behind each shoulder, a little below it, to look up into the back armpit (AD r0g5 blocker)
    case 'qBR': tgt = V(0, 0.9, 0); dir = mix(-0.8, -0.6); dist = 5.6; lift = 0.0; break;
    case 'qBL': tgt = V(0, 0.9, 0); dir = mix(-0.8, 0.6); dist = 5.6; lift = 0.0; break;
    // close-ups on the wearer's left shoulder
    case 'shF': tgt = wp(B.shoulderL).addScaledVector(l, -0.06).add(V(0, -0.03, 0)); dir = mix(0.9, 0.45); dist = 1.55; lift = 0.08; break;
    case 'shQB': tgt = wp(B.shoulderL).addScaledVector(l, -0.06).add(V(0, -0.03, 0)); dir = mix(-0.75, 0.66); dist = 1.55; lift = 0.12; break;
    case 'seamArm': tgt = wp(B.shoulderL).add(V(0, -0.07, 0)); dir = mix(0.5, 0.87); dist = 1.25; lift = -0.05; break;
    case 'seamCollar': tgt = wp(B.neck).add(V(0, -0.08, 0)); dir = mix(0.93, 0.36); dist = 1.15; lift = 0.14; break;
    case 'seamBelt': tgt = V(C.Fr.hips.x, C.Fr.hips.y + 0.03, C.Fr.hips.z); dir = mix(0.45, 0.89); dist = 1.6; lift = 0.06; break;
    // 0g part 2: close on the wearer's left forearm and hand (elbow twist, palm, thumb)
    case 'handS': tgt = wp(B.elbowL).lerp(wp(B.wristL), 0.6); dir = l.clone(); dist = 1.3; lift = 0.0; break;
    case 'handF': tgt = wp(B.elbowL).lerp(wp(B.wristL), 0.6); dir = mix(0.95, 0.3); dist = 1.3; lift = 0.0; break;
    case 'legQ': tgt = V(0, 0.5, 0); dir = mix(0.8, 0.6); dist = 3.2; lift = 0.1; break;
    case 'legS': tgt = V(0, 0.5, 0); dir = l.clone(); dist = 3.2; lift = 0.1; break;
    case 'headF': tgt = wp(B.head).add(V(0, 0.08, 0)); dir = f.clone(); dist = 1.6; lift = 0.0; break;
    case 'headS': tgt = wp(B.head).add(V(0, 0.08, 0)); dir = mix(0.3, 0.95); dist = 1.6; lift = 0.0; break;
    default: throw new Error('view ' + view);
  }
  const cam = new THREE.PerspectiveCamera(fov, W / H, 0.05, 50);
  cam.position.copy(tgt).addScaledVector(dir, dist).add(V(0, lift, 0)); cam.lookAt(tgt); cam.updateMatrixWorld(true);
  return cam;
}

// soft light from several sides: no single hard key
export function lights(scene) {
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x6b6378, 1.25));
  const add = (c, i, p) => { const lt = new THREE.DirectionalLight(c, i); lt.position.set(...p); scene.add(lt); };
  add(0xffe6c4, 1.0, [1.5, 2.6, 2.4]); add(0xd8e4ff, 0.7, [-2.4, 1.6, 1.2]); add(0xffd8b0, 0.75, [0.4, 2.2, -2.6]); add(0xe8e0ff, 0.45, [2.6, 1.2, -1.0]); add(0xffffff, 0.25, [0, -1, 2]);
  const sh = document.createElement('canvas'); sh.width = sh.height = 128; const x = sh.getContext('2d'); const g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(40,30,40,0.38)'); g.addColorStop(1, 'rgba(40,30,40,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false })); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.002; scene.add(disc);
}

// the same arm-raise for before and after: wearer's left arm out ~60 deg from hanging, right arm down
export const RAISE = { arm: [0.866, -0.5, 0.06], fore: [0.8, -0.42, 0.42] };
