// A one-file 3D page for looking at the skinned daemon bodies in each trust stance (bigmind.js STANCES, bars-engine #355)
// and at the Controller's Integrate action (#351). It runs cave.js itself, with the baked bodies carried inside the page, so
// what it shows is what the cave draws. Three.js r128 comes from cdnjs, as the cave's own page loads it.
//   node content/ontology-game/cave/body_viewer.mjs OUT.html
import { readFileSync, writeFileSync } from 'node:fs';

const here = new URL('./', import.meta.url).pathname;
const IDS = ['protector', 'controller', 'skeptic', 'fixer', 'victim', 'damaged-self', 'emotional-body', 'player'];
const bodies = Object.fromEntries(IDS.map((d) => [d, readFileSync(here + 'daemons/' + d + '.glb').toString('base64')]));
const cave = readFileSync(here + 'cave.js', 'utf8').replace(/<\/script/gi, '<\\/script');
const STANCES = ['held', 'guarded', 'testing', 'softening', 'trusting', 'willing', 'hurt', 'repaired'];
const SAYS = {
  held: 'the held movement as baked, breathing',
  guarded: 'met, and nothing seen yet: charged halfway, weight back',
  testing: "it says what it hasn't seen: charged, chin up, a half step forward",
  softening: 'one thing seen: halfway to its honored form',
  trusting: 'all three seen: nearly honored, turned a little open',
  willing: 'willing to step aside: honored, a half turn toward the wall, a hand toward the way on',
  hurt: 'a broken promise not yet owned: fully charged, a shoulder turned away',
  repaired: 'a fall owned and repaired: honored, facing the player, arriving slowly',
};

const html = `<title>Daemon Trust Stances</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* layout: the eight bodies in a ring on a cave floor fill the screen; one strip of controls sits under them */
:root { --bg: #ecebe6; --panel: #f7f6f2; --fg: #24232e; --muted: #5d5a6a; --line: #cfccc2; --accent: #44407a; --on-accent: #f7f6f2;
  --display: "Cormorant Garamond", Georgia, serif; --body: "Source Sans 3", system-ui, sans-serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #16151c; --panel: #201f29; --fg: #e9e5da; --muted: #a8a3b4; --line: #3a3847; --accent: #a9a2e8; --on-accent: #16151c; color-scheme: dark } }
:root[data-theme="dark"] { --bg: #16151c; --panel: #201f29; --fg: #e9e5da; --muted: #a8a3b4; --line: #3a3847; --accent: #a9a2e8; --on-accent: #16151c; color-scheme: dark }
html, body { height: 100%; }
body { background: var(--bg); color: var(--fg); font-family: var(--body); display: flex; flex-direction: column; }
#stage { flex: 1; min-height: 0; position: relative; touch-action: none; }
#stage canvas { display: block; width: 100%; height: 100%; }
#bar { background: var(--panel); border-top: 1px solid var(--line); padding-block: 10px 12px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 8px; }
h1 { font-family: var(--display); font-weight: 600; font-size: 1.35rem; margin: 0; text-wrap: balance; }
.row { display: flex; flex-wrap: wrap; gap: 6px; }
button { font: inherit; font-size: 0.9rem; border: 1px solid var(--line); background: transparent; color: var(--fg); border-radius: 999px; padding: 5px 12px; cursor: pointer; }
button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
#says { color: var(--muted); margin: 0; font-size: 0.92rem; min-height: 1.3em; }
.lbl { font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); align-self: center; margin-right: 4px; }
</style>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Source+Sans+3:wght@400;600&display=swap">
<div id="stage"></div>
<div id="bar">
  <h1>The seven voices and the Player, skinned</h1>
  <div class="row" id="stances"><span class="lbl">Stance</span></div>
  <p id="says"></p>
  <div class="row" id="who"><span class="lbl">Look at</span></div>
  <div class="row"><button id="integrate" type="button">Let go</button></div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
window.__oagCaveNoStart = true; window.__oagCaveBase = "bodies/";
var BODIES = ${JSON.stringify(bodies)};
var realFetch = window.fetch;
window.fetch = function (u) {
  var m = /^bodies\\/daemons\\/([a-z-]+)\\.glb$/.exec(String(u));
  if (!m || !BODIES[m[1]]) return realFetch.apply(this, arguments);
  var s = atob(BODIES[m[1]]), b = new Uint8Array(s.length);
  for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return Promise.resolve(new Response(b.buffer, { status: 200 }));
};
</script>
<script>${cave}</script>
<script>
(function () {
  var K = window.__oagCave.kit, IDS = ${JSON.stringify(IDS)}, STANCES = ${JSON.stringify(STANCES)}, SAYS = ${JSON.stringify(SAYS)};
  var stage = document.getElementById("stage"), renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); stage.appendChild(renderer.domElement);
  var scene = new THREE.Scene(); scene.background = new THREE.Color(0x2a2730); var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x3a3546, 0.9));
  var sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(3, 6, 5); scene.add(sun);
  var floor = new THREE.Mesh(new THREE.CircleGeometry(7, 48), new THREE.MeshStandardMaterial({ color: 0x5a5560, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  var PLAYER = ["player", "The Player", "", 0xc9c0dc, null];
  var figs = IDS.map(function (id, n) {
    var d = id === "player" ? PLAYER : K.DAEMONS.filter(function (x) { return x[0] === id; })[0];
    var g = K.buildDaemon(THREE, d, 1.75 / 0.695);
    var a = -Math.PI * 0.42 + Math.PI * 0.84 * n / (IDS.length - 1), r = 4.2;
    g.position.set(Math.sin(a) * r, 0, -Math.cos(a) * r + 2.6); g.rotation.y = -a; // each faces the centre, where the player stands
    scene.add(g); return { id: id, name: d[1], g: g };
  });
  var focus = null, yaw = 0, pitch = 0.18, dist = 7.5, stance = "held";
  function place() {
    var t = focus ? focus.g.position : new THREE.Vector3(0, 0, 0.6), D = focus ? 3.4 : dist;
    var base = focus ? focus.g.rotation.y : 0;
    camera.position.set(t.x + Math.sin(base + yaw) * Math.cos(pitch) * D, 0.95 + Math.sin(pitch) * D, t.z + Math.cos(base + yaw) * Math.cos(pitch) * D);
    camera.lookAt(t.x, focus ? 0.9 : 0.8, t.z);
  }
  function btn(row, label, on) { var b = document.createElement("button"); b.type = "button"; b.textContent = label; b.onclick = on; document.getElementById(row).appendChild(b); return b; }
  var sb = STANCES.map(function (s) { return btn("stances", s, function () { setStance(s); }); });
  function setStance(s) { stance = s; figs.forEach(function (f) { f.g.userData.stance = s === "held" ? undefined : s; });
    sb.forEach(function (b) { b.setAttribute("aria-pressed", b.textContent === s); }); document.getElementById("says").textContent = SAYS[s]; }
  var wb = [btn("who", "All eight", function () { look(null); })].concat(figs.map(function (f) { return btn("who", f.name.replace(/^The /, ""), function () { look(f); }); }));
  function look(f) { focus = f; yaw = 0; figs.forEach(function (x) { x.g.visible = !f || x === f; }); wb.forEach(function (b, i) { b.setAttribute("aria-pressed", i === 0 ? !f : figs[i - 1] === f); }); place(); }
  // Let go: each one shown plays its Integrate action from its held shape and ends honored (stance repaired holds it there)
  document.getElementById("integrate").onclick = function () {
    figs.forEach(function (f) { if (f.g.visible && f.g.userData.rig) { f.g.userData.rig.playing = -1; f.g.userData.stance = undefined; } });
    sb.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    document.getElementById("says").textContent = "letting go: the held movement completes into its honored form";
    setTimeout(function () { figs.forEach(function (f) { if (f.g.visible && K.integrateBody(f.g)) f.g.userData.stance = "repaired"; }); }, 600);
  };
  var drag = null;
  stage.addEventListener("pointerdown", function (e) { drag = [e.clientX, e.clientY]; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener("pointermove", function (e) { if (!drag) return; yaw -= (e.clientX - drag[0]) * 0.008; pitch = Math.max(-0.1, Math.min(1.2, pitch + (e.clientY - drag[1]) * 0.006)); drag = [e.clientX, e.clientY]; place(); });
  stage.addEventListener("pointerup", function () { drag = null; });
  stage.addEventListener("wheel", function (e) { e.preventDefault(); dist = Math.max(3, Math.min(14, dist * (1 + e.deltaY * 0.001))); place(); }, { passive: false });
  function size() { var w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); }
  addEventListener("resize", size); size(); setStance("held"); look(null);
  window.__viewer = { figs: figs, setStance: setStance, look: look, K: K, turn: function (y) { yaw = y; place(); } };
  (function loop() { renderer.render(scene, camera); requestAnimationFrame(loop); })();
})();
</script>
`;
writeFileSync(process.argv[2] || 'daemon-stances.html', html);
console.log('wrote', process.argv[2] || 'daemon-stances.html', Math.round(html.length / 1024) + ' KB');
