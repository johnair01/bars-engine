// The tool box at the gate and the satchel ring (council looks farm-toolbox-look-2 and farm-toolbox-dir-look-2, answered A on
// 2026-11-22: "build the box and ring in the 3D farm"). The box is a wooden chest in the scene that shows nothing until it is
// opened; it holds every tool and seed, 24 places, in a Tools tab and a Seeds tab. The satchel is the ring round the player's
// hand: six places that follow her, holding what she picked from the box. Seeds are the pouch's seeds (the same pouch the nook's
// satchel keeps); the satchel only names the ones carried. Rules stay in src/lib/between/farm.ts; this file draws and picks.
const BOX = 24, MAX = 6;
const TOOLS = [
  { key: 'tool:hoe', name: 'Hoe', line: 'Breaks a bed into rows. Costs 5 mana.' },
  { key: 'tool:watering-can', name: 'Watering can', line: 'Waters a planted bed. Costs 1 mana.' },
  { key: 'tool:trowel', name: 'Trowel', line: 'Kneel and plant a seed in a tilled bed.' },
  { key: 'tool:sickle', name: 'Sickle', line: 'Clears the weeds from a bed. Costs 1 mana.' },
  { key: 'tool:gloves', name: 'Gloves', line: 'Pick what is full.' },
];
const WAX = ['#b3321f', '#7a4ab0', '#e0a63a', '#3f8a5a', '#d2602f'];
const hue = id => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return WAX[h % WAX.length]; };
const ICON = {
  'tool:hoe': '<rect x="14.6" y="3" width="2.8" height="22" rx="1.4" fill="#a8744a"/><path d="M9 23.5h14l-1.6 4H10.6z" fill="#8f98a0"/>',
  'tool:watering-can': '<rect x="7" y="12" width="14" height="12" rx="3" fill="#4f95c9"/><path d="M21 15l6-5v4l-6 5z" fill="#4f95c9"/><path d="M9 12c0-6 10-6 10 0" fill="none" stroke="#2f6a9b" stroke-width="2.2"/><rect x="6" y="21" width="16" height="2" fill="#2f6a9b"/>',
  'tool:trowel': '<path d="M16 5c5 5 5 13 0 19-5-6-5-14 0-19z" fill="#9aa3a8" transform="rotate(35 16 16) translate(2 -2)"/><rect x="6" y="22" width="9" height="3.4" rx="1.7" fill="#a8744a" transform="rotate(-35 10 24)"/>',
  'tool:sickle': '<path d="M8 25C7 12 15 5 25 8 17 9 13 16 14 25z" fill="#9aa3a8"/><rect x="9" y="22" width="3.4" height="7" rx="1.7" fill="#a8744a"/>',
  'tool:gloves': '<path d="M9 28V15l-2-4 3-1 2 3V6h3v8l1-9h3v9l1-7h3v10l3-3 2 2-5 9v5z" fill="#d6a45c" stroke="#a8743a" stroke-width="1"/>',
};
const iconSvg = (key, color) => key.startsWith('seed:')
  ? `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="4" width="18" height="24" rx="2.5" fill="#fff6d8" stroke="#a8743a" stroke-width="1.6"/><circle cx="16" cy="13" r="4.2" fill="${color}"/><path d="M16 26v-5m0 0c-3 0-4-2-4-3.5 3 0 4 1.2 4 3.5zm0 0c3 0 4-2 4-3.5-3 0-4 1.2-4 3.5z" fill="none" stroke="#3f8a5a" stroke-width="1.5"/></svg>`
  : `<svg viewBox="0 0 32 32" aria-hidden="true">${ICON[key] || ''}</svg>`;

const CSS = `
#ring{position:fixed;inset:0;z-index:22;pointer-events:none}
#ring[hidden]{display:none}
.rslot{position:absolute;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;padding:0;border:2px solid #b98f5e;background:#f6ecd2;display:grid;place-items:center;pointer-events:auto;min-height:0;box-shadow:0 2px 6px rgba(40,25,10,.35)}
.rslot svg{width:30px;height:30px}
.rslot.empty{background:rgba(246,236,210,.22);border:2px dashed rgba(246,236,210,.55);box-shadow:none;pointer-events:none}
.rslot.held{border-color:#f0b43c;box-shadow:0 0 0 3px rgba(240,180,60,.55),0 2px 8px rgba(40,25,10,.4)}
.rcap,.rhint{position:absolute;transform:translateX(-50%);background:rgba(42,51,47,.82);color:#f3ece2;border-radius:14px;padding:5px 11px;font:.82rem 'Atkinson Hyperlegible',sans-serif;white-space:nowrap;pointer-events:none}
.rhint{pointer-events:auto;min-height:0;border:0;font-weight:700}
#box{position:fixed;z-index:40;left:0;right:0;bottom:0;display:grid;gap:10px;justify-items:center;padding:0 10px calc(10px + env(safe-area-inset-bottom,0px));pointer-events:none}
#box[hidden]{display:none}
#box>*{pointer-events:auto;width:min(96vw,460px);box-sizing:border-box}
.bstrip{background:#f3e6c8;border:3px solid #a8743a;border-radius:16px;padding:8px 12px 10px;color:#3a2412;font:.82rem 'Marcellus',serif;position:fixed;top:calc(64px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%)}
.bstrip .srow{display:flex;gap:8px;margin-top:6px}
.bstrip .rslot,.bgrid .rslot{position:static;margin:0;flex:0 0 auto}
.bpanel{background:#e7cf9d;border:3px solid #8a5a38;border-radius:16px 16px 12px 12px;padding:0 10px 10px;color:#3a2412;position:relative}
.btabs{display:flex;gap:6px;margin:0 6px;transform:translateY(-12px)}
.btab{min-height:40px;border-radius:12px 12px 0 0;border:3px solid #8a5a38;border-bottom:0;background:#8a5a38;color:#f3e6c8;font:700 .95rem 'Atkinson Hyperlegible',sans-serif;padding:0 16px;position:relative}
.btab[aria-selected=true]{background:#f3e6c8;color:#3a2412}
.btab .dot{position:absolute;top:6px;right:5px;width:9px;height:9px;border-radius:50%;background:#d2432c}
.bin{background:#f3e6c8;border-radius:10px;padding:10px;margin-top:-8px}
.bhead{display:flex;justify-content:space-between;align-items:baseline;margin:0 2px 8px}
.bhead h2{margin:0;font:400 1.25rem 'Marcellus',serif}.bhead span{font-size:.82rem;opacity:.8}
.bgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}
.bcell{aspect-ratio:1;border-radius:10px;border:2px solid #d3bd8e;background:#ead9b0;display:grid;place-items:center;align-content:center;gap:1px;padding:2px;min-height:0;color:#3a2412;font:.62rem/1.1 'Atkinson Hyperlegible',sans-serif;text-align:center}
.bcell svg{width:30px;height:30px}.bcell.empty{border-style:solid;border-color:#e0cfa4;background:#e8d8b0;opacity:.7}
.bcell.pick{border-color:#e0a02a;box-shadow:0 0 0 2px #f0b43c}.bcell.out{opacity:.5}
.bfoot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px;min-height:48px}
.bfoot p{margin:0;font-size:.88rem}.bfoot b{display:block;font-size:.95rem}
#box button.go{background:#4e9a3c;border:1px solid #2f6f26;color:#fff;border-radius:12px;min-height:44px;padding:0 16px;font:700 .95rem 'Atkinson Hyperlegible',sans-serif;box-shadow:0 3px 0 #2f6f26}
#box button.go:disabled{opacity:.45}
#box button.shut{position:absolute;top:-16px;right:12px;min-height:36px;border-radius:12px;background:#8a5a38;border:2px solid #f3e6c8;color:#f3e6c8;font:700 .8rem 'Atkinson Hyperlegible',sans-serif;padding:0 12px}
.bcell:focus-visible,.rslot:focus-visible,.btab:focus-visible,#box button:focus-visible,.rhint:focus-visible{outline:3px solid #2a6df4;outline-offset:2px}
@media (prefers-reduced-motion:no-preference){.rslot{transition:box-shadow .2s,border-color .2s}}
`;

export function createKit(ctx) {
  const { THREE, scene, camera, avatar, toon, mesh, PAL, V, FZ, GATE_W, $, esc } = ctx;
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

  // ---------- the chest in the scene: wood and brass, like the fence and the gate ----------
  const CH = V(-(GATE_W / 2 + 0.05), 0, FZ + 1.3);
  const chest = new THREE.Group(); chest.name = 'toolbox'; chest.position.copy(CH); chest.rotation.y = 0.3; chest.scale.setScalar(0.85); scene.add(chest);
  const BRASS = '#c9a24a', body = new THREE.Group(), lid = new THREE.Group(); chest.add(body, lid);
  const W = 0.92, D = 0.56, H = 0.44;
  const tag = o => { o.userData.kit = 'chest'; return o; };
  const put = (o, x, y, z) => { o.position.set(x, y, z); return o; };
  body.add(tag(put(mesh(new THREE.BoxGeometry(W, H, D), toon(PAL.wood)), 0, H / 2, 0)));
  for (const x of [-0.3, 0.3]) body.add(tag(put(mesh(new THREE.BoxGeometry(0.07, H + 0.012, D + 0.014), toon(BRASS), false), x, H / 2, 0)));
  for (let k = 0; k < 2; k++) body.add(tag(put(mesh(new THREE.BoxGeometry(W + 0.01, 0.015, D + 0.01), toon(PAL.woodDark), false), 0, 0.14 + k * 0.14, 0)));
  lid.position.set(0, H, -D / 2);   // hinged along the back edge
  const arch = tag(mesh(new THREE.CylinderGeometry(D / 2, D / 2, W, 16, 1, false, 0, Math.PI), toon(PAL.wood))); arch.rotation.z = Math.PI / 2; arch.position.set(0, 0, D / 2);   // a half cylinder along x, its round side up
  lid.add(arch);
  for (const x of [-0.3, 0.3]) { const b = tag(mesh(new THREE.CylinderGeometry(D / 2 + 0.012, D / 2 + 0.012, 0.07, 16, 1, false, 0, Math.PI), toon(BRASS), false)); b.rotation.z = Math.PI / 2; b.position.set(x, 0, D / 2); lid.add(b); }
  const clasp = tag(mesh(new THREE.BoxGeometry(0.1, 0.12, 0.04), toon(BRASS), false)); clasp.position.set(0, H - 0.1, D / 2 + 0.01); body.add(clasp);
  const glowInside = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.01, D - 0.1), new THREE.MeshBasicMaterial({ color: '#6b4a2a' })); glowInside.position.set(0, H - 0.02, 0); body.add(glowInside);
  let lidT = 0, lidWant = 0; const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- state ----------
  let seeds = [], open = false, tab = 'tools', pick = null, held = null;
  const farm = () => ctx.getFarm();
  const carried = () => ctx.satchelOf(farm()).filter(k => !k.startsWith('seed:') || seeds.some(s => 'seed:' + s.id === k));
  const items = {
    tools: () => TOOLS,
    seeds: () => seeds.map(s => ({ key: 'seed:' + s.id, name: s.label, line: 'A sealed packet. Plant it in a tilled bed.', color: hue(s.id) })),
  };
  const find = key => key && (TOOLS.find(t => t.key === key) || items.seeds().find(s => s.key === key));
  async function save(ids) { const j = await ctx.api({ act: 'satchel', ids }); if (!j) return false; render(); return true; }

  // ---------- DOM ----------
  const ring = document.createElement('div'); ring.id = 'ring'; ring.setAttribute('role', 'group'); ring.setAttribute('aria-label', 'Your satchel'); document.body.appendChild(ring);
  const boxEl = document.createElement('div'); boxEl.id = 'box'; boxEl.hidden = true; document.body.appendChild(boxEl);
  const cap = document.createElement('div'); cap.className = 'rcap'; ring.appendChild(cap);
  const hint = document.createElement('button'); hint.type = 'button'; hint.className = 'rhint'; hint.textContent = 'Toolbox · tap to open'; hint.onclick = () => openBox(); ring.appendChild(hint);
  const slotBtns = Array.from({ length: MAX }, () => { const b = document.createElement('button'); b.type = 'button'; b.className = 'rslot empty'; ring.appendChild(b); return b; });

  function holdLine(it) { if (!it) return 'Satchel · ' + carried().length + ' of ' + MAX + ', follows you'; return it.key.startsWith('seed:') ? `${it.name} · tap a tilled bed to plant` : `${it.name} · ${it.line}`; }
  function render() {
    const ids = carried(); if (held && !ids.includes(held)) held = null;
    slotBtns.forEach((b, n) => { const it = find(ids[n]);
      b.className = 'rslot' + (it ? '' : ' empty') + (it && it.key === held ? ' held' : ''); b.innerHTML = it ? iconSvg(it.key, it.color) : '';
      b.setAttribute('aria-label', it ? `${it.name}${it.key === held ? ', held' : ''}` : 'Empty place'); b.setAttribute('aria-pressed', it && it.key === held ? 'true' : 'false'); b.disabled = !it;
      b.onclick = () => { if (!it) return; held = held === it.key ? null : it.key; render(); }; });
    cap.textContent = holdLine(find(held));
    hint.hidden = open;
    if (open) renderBox(ids);
    boxEl.hidden = !open; ring.hidden = false;
  }
  function renderBox(ids) {
    const list = items[tab](), have = ids.length, inKey = k => ids.includes(k), p = find(pick), newSeeds = seeds.some(s => !inKey('seed:' + s.id));
    const cell = (it, n) => it ? `<button type="button" class="bcell${it.key === pick ? ' pick' : ''}${inKey(it.key) ? ' out' : ''}" data-k="${esc(it.key)}" aria-label="${esc(it.name)}${inKey(it.key) ? ', in your satchel' : ''}">${iconSvg(it.key, it.color)}<span>${esc(it.name)}</span></button>` : `<div class="bcell empty" aria-hidden="true"></div>`;
    const cells = Array.from({ length: BOX }, (_, n) => cell(list[n], n)).join('');
    const strip = ids.map(k => { const it = find(k); return `<button type="button" class="rslot" data-out="${esc(k)}" aria-label="Put ${esc(it.name)} back in the box">${iconSvg(k, it.color)}</button>`; }).join('') + Array.from({ length: MAX - ids.length }, () => '<span class="rslot empty"></span>').join('');
    const foot = !p ? `<p><b>${tab === 'tools' ? 'Pick a tool' : seeds.length ? 'Pick a seed' : 'No seeds yet'}</b>${tab === 'seeds' && !seeds.length ? 'A seed arrives as a sealed parcel at the post by the gate.' : 'It tells you what it does here.'}</p>`
      : `<p><b>${esc(p.name)}</b>${esc(p.line)}</p>`;
    const act = !p ? '' : inKey(p.key) ? `<button type="button" class="go" id="kit-back">Put it back</button>` : `<button type="button" class="go" id="kit-take" ${have >= MAX ? 'disabled' : ''}>Take it out</button>`;
    boxEl.innerHTML = `<div class="bstrip" role="group" aria-label="Your satchel"><span>Your satchel · ${have} of ${MAX} (it holds fewer than the box)</span><div class="srow">${strip}</div></div>
<div class="bpanel"><div class="btabs" role="tablist"><button type="button" class="btab" role="tab" id="t-tools" aria-selected="${tab === 'tools'}">Tools</button><button type="button" class="btab" role="tab" id="t-seeds" aria-selected="${tab === 'seeds'}">Seeds${newSeeds ? '<i class="dot" title="Seeds waiting"></i>' : ''}</button></div>
<button type="button" class="shut" id="kit-shut">Close the box</button>
<div class="bin" role="tabpanel"><div class="bhead"><h2>Toolbox</h2><span>${list.length} of ${BOX} places</span></div><div class="bgrid">${cells}</div>
<div class="bfoot">${foot}${act}</div>${have >= MAX && p && !inKey(p.key) ? '<p style="margin:6px 2px 0;font-size:.82rem">The satchel holds 6. Put one back first.</p>' : ''}</div></div>`;
    $('t-tools').onclick = () => { tab = 'tools'; pick = null; render(); }; $('t-seeds').onclick = () => { tab = 'seeds'; pick = null; render(); };
    $('kit-shut').onclick = closeBox;
    for (const b of boxEl.querySelectorAll('[data-k]')) b.onclick = () => { pick = pick === b.dataset.k ? null : b.dataset.k; render(); };
    for (const b of boxEl.querySelectorAll('[data-out]')) b.onclick = () => save(carried().filter(k => k !== b.dataset.out));
    const take = $('kit-take'); if (take) take.onclick = async () => { const k = pick; if (await save([...carried(), k])) { held = k; ctx.say(`${find(k).name} is in your satchel.`, 2500); render(); } };
    const back = $('kit-back'); if (back) back.onclick = () => save(carried().filter(k => k !== pick));
  }
  function openBox() { if (open) return; open = true; lidWant = 1; ctx.routeNear(V(CH.x + 0.5, 0, CH.z + 1.0), V(CH.x, 0, CH.z)); render(); }
  function closeBox() { open = false; pick = null; lidWant = 0; render(); }

  // ---------- the ring follows the player: placed from her screen position each frame ----------
  const P = V();
  function frame(dt, hidden) {
    lidT += (lidWant - lidT) * (reduce ? 1 : Math.min(1, dt * 7)); lid.rotation.x = -lidT * 1.75;
    ring.style.visibility = hidden ? 'hidden' : 'visible'; if (hidden) return;
    const w = innerWidth, h = innerHeight, at = (x, y, z) => { P.set(x, y, z).project(camera); return [(P.x * 0.5 + 0.5) * w, (-P.y * 0.5 + 0.5) * h]; };
    const [cx, cy] = at(avatar.position.x, 1.05, avatar.position.z), R = Math.max(46, Math.min(66, h * 0.085));
    slotBtns.forEach((b, n) => { const a = -Math.PI / 2 + (n / MAX) * Math.PI * 2; b.style.display = open ? 'none' : ''; b.style.left = cx + Math.cos(a) * R + 'px'; b.style.top = cy + Math.sin(a) * R + 'px'; });
    cap.style.display = open ? 'none' : ''; cap.style.left = cx + 'px'; cap.style.top = cy + R + 36 + 'px';
    hint.style.display = Math.hypot(avatar.position.x - CH.x, avatar.position.z - CH.z) < 1.7 ? 'none' : ''; const [hx, hy] = at(CH.x, 0.1, CH.z); hint.style.left = Math.max(84, Math.min(w - 84, hx)) + 'px'; hint.style.top = hy + 26 + 'px';
  }
  render();
  return {
    chestHit: obj => { for (let o = obj; o; o = o.parent) if (o.userData && o.userData.kit === 'chest') return true; return false; },
    chest, open: openBox, close: closeBox, frame,
    isOpen: () => open,
    setSeeds: list => { seeds = list || []; if (pick && !find(pick)) pick = null; render(); },
    refresh: render,
    heldSeed: () => (held && held.startsWith('seed:') ? held.slice(5) : null),
    heldKey: () => held,
    seedGone: id => { if (held === 'seed:' + id) held = null; save(carried().filter(k => k !== 'seed:' + id)); },
    ringPoints: () => slotBtns.map(b => [b.style.left, b.style.top]),
  };
}
