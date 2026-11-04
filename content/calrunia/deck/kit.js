// The trade deck's kit: renderer, scene, camera and the small helpers every part draws with. Taken from the living ship
// Still B's own scene (Six-faces-council council/callsheets/stills/2026-10-25-ship-v1/make/still-b-scene.js, lines 10-36),
// changed only to fill the window and to let each part build into its own group (`into`), so a part can be lifted out
// whole and reused. three.js 0.160 as in the Between and /calrunia/arrive.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const canvas = document.getElementById("deck-scene");
const PR = 0.5; // half-res pixels, upscaled crisp, as Still B
let seed = 11;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const R = (a, b) => a + (b - a) * rnd();
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(PR);
renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xd9a9b8, 14, 95);
const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.1, 3000);
let into = scene; // the group the part being built draws into
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0, ...o });
const glow = (color, i = 2.5) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: i, flatShading: true });
function jitter(geo, a) { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { p.setXYZ(i, p.getX(i) + R(-a, a), p.getY(i) + R(-a, a), p.getZ(i) + R(-a, a)); } geo.computeVertexNormals(); return geo; }
function add(geo, m, x, y, z, o = {}) { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); if (o.rx) mesh.rotation.x = o.rx; if (o.ry) mesh.rotation.y = o.ry; if (o.rz) mesh.rotation.z = o.rz; if (o.s) mesh.scale.set(...o.s); mesh.castShadow = !o.noShadow; mesh.receiveShadow = true; (o.parent || into).add(mesh); return mesh; }

// soft halo sprite texture
const haloTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
function halo(color, x, y, z, s, op = 0.8, parent = into) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sp.position.set(x, y, z); sp.scale.set(s, s, 1); parent.add(sp); return sp; }

// A part is one named piece of the deck with its source, built into its own group, with an update for the live state.
const PARTS = [];
function PART(id, name, from, build) {
  const group = new THREE.Group(); group.name = id; scene.add(group);
  into = group; const api = build(group) || {}; into = scene;
  PARTS.push({ id, name, from, group, update: api.update || null, hit: api.hit || null });
}
