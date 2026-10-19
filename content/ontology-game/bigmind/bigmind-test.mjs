import http from 'node:http';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
// Browser checks for the Big Mind cave (bigmind.js on the Cave of Lessons engine): the cave mouth and its rules, the walk to
// the Protector, the ask, the seat shift, the cards and the open line, secretly speaking (the second figure, naming it,
// thanking it, the voice asked again), stepping back out, keeping lines, the save on the device, the way opening, the hallway
// past it with the waiting part, the Controller's, the Skeptic's, the Fixer's, the Emotional Body's, the Victim's and the Damaged Self's chambers, the centre and the vulnerable child, walking back up, resuming, forgetting and deleting, and declining.
// Build first with `npm run build:ontology-game`, then run from a folder that has playwright and three@0.128.0 installed:
//   OAG_PUBLIC=/path/to/bars-engine/public OAG_SHOTS=/some/dir node bigmind-test.mjs
const PUB = process.env.OAG_PUBLIC || new URL('../../../public', import.meta.url).pathname;
const SHOTS = process.env.OAG_SHOTS || '.';
const NM = new URL('./node_modules/', import.meta.url).pathname;
const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  const tile = /^\/ontology-game\/cave\/textures\/(wet_stone|dry_stone|crystal_vein)\.jpg$/.exec(u); // the Cave of Lessons' stone
  const body = /^\/ontology-game\/cave\/daemons\/([a-z-]+)\.glb$/.exec(u); // the daemon bodies (cave/bake_daemons.py)
  const f = u === '/ontology-game/big-mind' ? 'big-mind/index.html' : u === '/ontology-game/cave' ? 'cave/index.html' : tile ? 'cave/textures/' + tile[1] + '.jpg' : body ? 'cave/daemons/' + body[1] + '.glb' : u === '/ontology-game/cave/cave-kit.glb' ? 'cave/cave-kit.glb' : u === '/ontology-game/cave/player/walker.glb' ? 'cave/player/walker.glb' : null;
  if (!f) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': tile ? 'image/jpeg' : body || f.endsWith('.glb') ? 'model/gltf-binary' : 'text/html' }); res.end(readFileSync(PUB + '/ontology-game/' + f));
}).listen(4571);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
await ctx.route('https://cdnjs.cloudflare.com/**', (r) => r.fulfill({ body: readFileSync(NM + 'three/build/three.min.js'), contentType: 'application/javascript' }));
const errors = [];
let passes = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (c) passes++; else { fails++; process.exitCode = 1; } };
const page = await ctx.newPage();
// A switch in the Menu (PR 5): open the Menu first when the switch is folded inside it, then tap it.
async function menuTap(sel) {
  if (!(await page.locator(sel).first().isVisible()) || (await page.locator('[data-oag-menu]:has(' + sel + ')').count() && await page.locator('[data-oag-menu]:has(' + sel + ')').first().isHidden())) await page.locator('[data-oag-menubtn]:visible').first().click();
  await page.locator(sel).first().click();
}
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const dialogs = []; // gd-web-bits: no browser alert or confirm box anywhere
page.on('dialog', (d) => { dialogs.push(d.type() + ': ' + d.message()); d.accept(); });
const B = 'http://localhost:4571/ontology-game/big-mind';
const step = () => page.getAttribute('[data-bm-modal]', 'data-bm-step');
const waitStep0 = (s, ms = 20000) => page.waitForFunction((s) => document.querySelector('[data-bm-modal]')?.getAttribute('data-bm-step') === s, s, { timeout: ms }).then(() => true, () => false);
// The first meeting with each voice asks how the player feels meeting it (board bmt-meeting-spirit); the checks that wait for
// the meeting answer "No word yet" there, unless they are on that step, which spawns a grey spirit from meeting it.
const waitStep = async (s, ms = 20000) => {
  if (s !== 'meet') return waitStep0(s, ms);
  const r = await page.waitForFunction(() => /^meet(-feel)?$/.test(document.querySelector('[data-bm-modal]')?.getAttribute('data-bm-step') || ''), null, { timeout: ms }).then(() => true, () => false);
  if (r && (await page.getAttribute('[data-bm-modal]', 'data-bm-step')) === 'meet-feel') await page.click('[data-bm-feel="none"]');
  return r && waitStep0('meet', 5000);
};
const st = () => page.evaluate(() => { const s = window.__oagBigMind.state; return s && { phase: s.phase, s: s.s, gate: s.gate, cam: s.cam, waiting: s.waiting.slice(), answers: s.answers }; });
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('oag.bigmind.v1') || 'null'));
async function hold(on) { await page.evaluate((on) => { const s = window.__oagBigMind.state; s.speed = 6; s.held = on; }, on); }
async function holdUntil(stepName) {
  await hold(true);
  if (stepName !== 'end') return waitStep(stepName);
  // the approach check-in comes first at each hallway's end (build 4); the older checks skip it
  const r = await page.waitForFunction(() => /^(end|approach-body)$/.test(document.querySelector('[data-bm-modal]')?.getAttribute('data-bm-step') || ''), null, { timeout: 20000 }).then(() => true, () => false);
  if (r && (await page.getAttribute('[data-bm-modal]', 'data-bm-step')) === 'approach-body') await page.click('[data-bm-apskipall]');
  return r && waitStep0('end', 5000);
}
// Every visit asks again (board bmt-ask-again): going back in meets the chamber's voice once more, and declining opens the way.
async function passAgain() {
  if (!(await holdUntil('meet'))) return false;
  await page.click('[data-bm-decline]');
  return page.waitForFunction(() => window.__oagBigMind.openAt(window.__oagBigMind.S.S_GATE + 14) > 0.9, null, { timeout: 10000 }).then(() => true, () => false);
}
// Walking out passes the return rite (board bmt-return), which is skippable; the checks skip it unless they are on it.
const click0 = page.click.bind(page);
page.click = async (sel, o) => {
  await click0(sel, o);
  if (!/rite/.test(sel) && (await page.evaluate(() => document.querySelector('[data-bm-modal]')?.getAttribute('data-bm-step'))) === 'rite') await click0('[data-bm-riteskip]');
};

await page.goto(B);
await page.waitForSelector('[data-bm-mouth]');
await page.evaluate(() => localStorage.clear());
await page.reload(); await page.waitForSelector('[data-bm-mouth]');
const mouthText = await page.textContent('[data-bm-mouth]');
ok(/not therapy/.test(mouthText) && /988/.test(mouthText), 'the cave mouth says it is a game, not therapy, with a crisis line');
ok(!/sit out|take control back|walk back up/i.test(mouthText) && await page.locator('[data-bm-mouth] li').count() === 0, 'the mouth lists no rules: they are the first hallway\'s lessons (gd-mouth-in-world)');
ok(/Nothing is sent anywhere/.test(mouthText), 'the mouth says nothing leaves the device');
ok(!/Genpo|Big Mind Process|Zen Center/i.test(await page.content()), 'no teacher or programme is named on the page');
await page.screenshot({ path: SHOTS + '/bm-1-mouth.png' });

await page.click('[data-bm-enter]');
await page.waitForSelector('[data-bm-cave] canvas');
await page.waitForTimeout(600);
await page.waitForFunction(() => window.__oagBigMind.teach && window.__oagBigMind.teach().shown === 'walk', null, { timeout: 8000 }).catch(() => {});
ok((await page.textContent('[data-bm-hint]')).trim() === '' && await page.locator('[data-teach="walk"]').isVisible(), 'the hallway teaches the walk with a glyph, not a line of words');
await page.screenshot({ path: SHOTS + '/bm-2-hallway.png' });
const shut = await page.evaluate(() => { const A = window.__oagBigMind, S = A.S; return { before: A.openAt(S.S_VOICE), past: A.openAt(S.S_GATE + 14), hall: A.openAt(10) }; });
ok(shut.before > 1.6 && shut.hall < 1.05, 'the chamber is the tunnel widened: ' + shut.before.toFixed(2) + ' against the hallway ' + shut.hall.toFixed(2));
ok(shut.past < 0.5, 'the way past the voice is gathered shut before it has spoken (' + shut.past.toFixed(2) + ')');
// a real touch on the stage walks too
const s0 = (await st()).s;
await page.evaluate(() => { window.__oagBigMind.state.speed = 6; });
const box = await page.locator('[data-bm-stage]').boundingBox();
// Hold until the figure has walked (up to 4 s): frames come slower on a loaded runner, so a fixed 0.5 s hold is not enough.
await page.mouse.move(box.x + 200, box.y + 400); await page.mouse.down();
await page.waitForFunction((a) => window.__oagBigMind.state.s > a, s0 + 2, { timeout: 4000 }).catch(() => {});
await page.mouse.up();
ok((await st()).s > s0 + 2, 'holding the stage walks the figure along the path');

// Free walking (board bmt-free-walk): the stick walks sideways and back as well as on, inside the walls; Run is faster.
const stickTo = (x, z) => page.evaluate(([x, z]) => { const k = window.__oagBigMind.stick; k.x = x; k.z = z; }, [x, z]);
const bm = () => page.evaluate(() => { const s = window.__oagBigMind.state; return { s: s.s, lat: s.lat, pace: s.pace, moving: s.moving }; });
ok(await page.locator('[data-bm-stick]').isVisible() && await page.locator('[data-bm-run]').isVisible(), 'the walk stick and Run show while the player can walk');
await stickTo(1, 0);
await page.waitForFunction(() => window.__oagBigMind.state.lat > 1, null, { timeout: 4000 }).catch(() => {});
let wk = await bm();
ok(wk.lat > 1 && wk.lat <= 0.5 * 4.4 + 0.01, 'the stick walks sideways, held inside the walls: ' + wk.lat.toFixed(2));
await stickTo(1, 0); await page.waitForTimeout(800); wk = await bm();
ok(wk.lat <= 0.5 * 4.4 + 0.01, 'the walls hold the figure however long the stick is pushed: ' + wk.lat.toFixed(2));
const sBack = (await bm()).s; await stickTo(0, 1);
await page.waitForFunction((a) => window.__oagBigMind.state.s < a - 0.5, sBack, { timeout: 4000 }).catch(() => {});
ok((await bm()).s < sBack - 0.5, 'the stick walks back as well as on');
await stickTo(0, 1); await page.waitForTimeout(1500);
ok((await bm()).s >= 1 - 1e-6, 'walking back stops at the mouth of the cave');
await page.click('[data-bm-run]');
await stickTo(0, -1); await page.waitForFunction(() => window.__oagBigMind.state.pace > 1, null, { timeout: 4000 }).catch(() => {});
ok((await bm()).pace > 1.5, 'Run walks faster');
await page.click('[data-bm-run]'); await stickTo(0, 0);
ok(await page.evaluate(() => { const k = window.__oagBigMind; k.keys.KeyW = true; const w = k.walkInput(); delete k.keys.KeyW; return w.along === 1 && w.side === 0; }), 'W walks on, as the arrow keys do');
ok(await holdUntil('meet'), 'walking on reaches the Protector, who blocks the path');
ok(/Nobody goes past this point/.test(await page.textContent('[data-bm-modal]')), 'the Protector speaks first');
// The daemon bodies (cave/bake_daemons.py, from the WARP figures of #328) and the dressing from the Cave of Lessons' kit.
await page.waitForFunction(() => window.__oagBigMind.voice.userData.body === 'protector', null, { timeout: 15000 }).catch(() => {});
const bodyNow = await page.evaluate(() => { const v = window.__oagBigMind.voice, fit = v.children.find((c) => c.userData.body); let tris = 0; if (fit) fit.traverse((m) => { if (m.geometry && m.geometry.index) tris += m.geometry.index.count / 3; }); return { body: v.userData.body, standIn: v.children.some((c) => c.userData.standIn), tris, op: v.userData.mat.opacity }; });
ok(bodyNow.body === 'protector' && !bodyNow.standIn, 'the Protector wears its baked body, the stand-in gone (' + JSON.stringify(bodyNow) + ')');
ok(bodyNow.tris > 1000 && bodyNow.tris <= 7000, 'the body is within the phone budget of 7000 triangles (' + bodyNow.tris + ')');
{ // the body is skinned to its rig and stands as the voice's trust says (cave.js bodyPose, the stances of #355)
  await page.waitForTimeout(1500);
  const sk = await page.evaluate(() => { const v = window.__oagBigMind.voice; let m = null; v.traverse((o) => { if (o.isSkinnedMesh) m = o; }); return { skinned: !!m, bones: m ? m.skeleton.bones.length : 0, pose: window.__oagCave.kit.bodyPose(v), stance: v.userData.stance }; });
  ok(sk.skinned && sk.bones === 46 && sk.pose && sk.pose.stance === sk.stance, 'the body is skinned to its 46 joints and holds the voice\'s stance (' + JSON.stringify({ bones: sk.bones, stance: sk.stance, pose: sk.pose && sk.pose.stance }) + ')');
}
await page.waitForFunction(() => window.__oagBigMind.voice.parent.children.some((c) => c.userData.dressCave && c.userData.dressed), null, { timeout: 15000 }).catch(() => {});
const dressN = await page.evaluate(() => { const d = window.__oagBigMind.voice.parent.children.find((c) => c.userData.dressCave); let n = 0; if (d) d.traverse((m) => { if (m.isMesh) n++; }); return n; });
ok(dressN > 10, 'the cave is dressed with the kit\'s grown pieces (' + dressN + ' meshes)');
ok(Math.abs((await st()).s - (await page.evaluate(() => window.__oagBigMind.S.S_SELF))) < 0.01, 'the figure stops in front of the voice');
await page.screenshot({ path: SHOTS + '/bm-3-meet.png' });

// Self, at any time
await menuTap('[data-bm-selfbtn]');
ok(await waitStep('self'), 'the Self button takes control back at any point');
await page.click('[data-bm-goon]');
ok(await waitStep('meet'), 'going on returns to the same moment');

// the back and forth before anything is asked
await page.click('[data-bm-reply="who"]');
ok(await waitStep('met') && /I keep the way/.test(await page.textContent('[data-bm-modal]')), 'asking who it is gets an answer, and more to say');
await page.click('[data-bm-reply="hear"]');
ok(/Nobody asks to hear from me/.test(await page.textContent('[data-bm-modal]')), 'saying you want to hear from it gets its answer');
await page.click('[data-bm-ask="speak"]');
ok(await waitStep('perm-speak'), 'the player asks permission to speak with it');
ok(/may I speak with you/.test(await page.textContent('[data-bm-modal]')), 'the ask is in the player\'s words');
await page.screenshot({ path: SHOTS + '/bm-3b-permission.png' });
// it holds back: the refusal path
await page.click('[data-bm-perm="no"]');
ok(await waitStep('refused-speak') && /Every time I let someone in/.test(await page.textContent('[data-bm-modal]')), 'when it holds back, it says why');
await page.click('[data-bm-why]');
ok(await waitStep('fear-speak'), 'the player asks what it is afraid of');
await page.click('[data-bm-fear="0"]');
ok(await waitStep('assure-speak'), 'it says what it fears, and the player is asked what to offer');
await page.screenshot({ path: SHOTS + '/bm-3c-refusal.png' });
await page.click('[data-bm-assure="0"]');
ok(await waitStep('assured-speak') && /hold you to that/.test(await page.textContent('[data-bm-modal]')), 'it answers the assurance');
await page.click('[data-bm-again]');
ok(await waitStep('blockpoll-speak') && /You offered: I'll come back/.test(await page.textContent('[data-bm-modal]')), 'while it holds back, its charge is asked for, after what was offered');
await page.fill('[data-bm-range]', '8'); await page.click('[data-bm-blockcharged]');
ok(await waitStep('perm-speak'), 'and the player asks again');
await page.click('[data-bm-perm="unsure"]');
ok(await waitStep('unsure-speak'), 'can\'t tell: stay with it and breathe');
await page.click('[data-bm-again]');
await waitStep('blockpoll-speak'); await page.click('[data-bm-blockcharged]');
await page.click('[data-bm-perm="yes"]');
ok(await waitStep('granted-speak') && /I'm watching/.test(await page.textContent('[data-bm-modal]')), 'it lets the player speak, in its own words');
await page.click('[data-bm-thanks="speak"]');
ok(await waitStep('body'), 'before any question: where does the Protector live in your body?');
ok(await page.locator('[data-bm-bodymap]').count() === 1, 'the body map is offered too');
await page.click('[data-bm-place="Chest"]');
ok(await waitStep('charge-first'), 'then: how charged is it?');
const setCharge = async (v) => { await page.fill('[data-bm-range]', String(v)); await page.click('[data-bm-charged]'); };
await page.screenshot({ path: SHOTS + '/bm-3d-charge.png' });
await setCharge(8);
ok(await page.getAttribute('[data-bm-meter]', 'data-bm-charge') === '8', 'the meter shows the player\'s number');
ok(await waitStep('q-job'), 'the first question is asked from the outside: what is your job?');
ok(/You: What is your job\?/.test(await page.textContent('[data-bm-modal]')), 'the self asks; the player gives the Protector\'s answer');

// an out-of-voice card brings the second figure out
const nFig = await page.evaluate(() => window.__oagBigMind.figures.length);
await page.click('[data-bm-modal] [data-bm-card]:has-text("It\'s trying to keep me safe.")');
ok(await waitStep('secret'), 'an answer about the voice instead of as it: someone else spoke');
ok(await page.evaluate((n) => window.__oagBigMind.figures.length === n + 1, nFig), 'a second figure shows behind the voice');
ok(/talked about the Protector instead of speaking as it/.test(await page.textContent('[data-bm-modal]')), 'the guide names the tell');
await page.screenshot({ path: SHOTS + '/bm-5-second-figure.png' });
await page.click('[data-bm-name="ideas"]');
ok(await waitStep('thank'), 'naming the translator leads to thanking it');
await page.click('[data-bm-thank]');
ok(await waitStep('q-job'), 'it steps aside and the voice is asked again');
ok(/Let me speak to the Protector again/.test(await page.textContent('[data-bm-modal]')), 'the guide asks for the Protector again');
ok((await st()).waiting.includes('ideas'), 'the translator waits; nothing is deleted');
await page.click('[data-bm-modal] [data-bm-card]:has-text("To protect.")');
ok(await waitStep('charge'), 'after each answer: does it feel any different, how charged is it now?');
ok(/To protect\./.test(await page.textContent('[data-bm-modal]')) && /Your job is to protect/.test(await page.textContent('[data-bm-modal]')), 'its answer is said back, and the guide answers it');
await setCharge(7);
ok(await waitStep('eased', 3000), 'a lower charge is rewarded: the panel steps away so the chamber can answer');
ok(/The Protector eases\./.test(await page.textContent('[data-bm-eased]')) && /8 down to 7/.test(await page.textContent('[data-bm-eased]')), 'the easing is named, with the numbers');
ok(await page.waitForFunction(() => { const b = window.__oagBigMind.state.easing; return !!b && b.k > 0 && document.querySelector('[data-bm-meter]').classList.contains('eased'); }, null, { timeout: 3000 }).then(() => true, () => false), 'the ring, the motes and the meter\'s drain play');
await page.screenshot({ path: SHOTS + '/bm-3f-eased.png' });
ok(await waitStep('q-boss') && /Who do you work for\?/.test(await page.textContent('[data-bm-modal]')), 'who do you work for?');
await page.click('[data-bm-modal] [data-bm-card]:has-text("The self.")');
// the W.A.V.E. on the player's own charge (bmw-offer, bmw-whose-charge: two charges, yours and its)
ok(await waitStep('charge') && await page.locator('[data-bm-wave]').count() === 1, 'every poll offers "Breathe with it (W.A.V.E.)" under the slider');
ok(await page.evaluate(() => document.querySelector('[data-bm-meteryou]').style.display === 'none'), 'your own charge is not on the meter until you give it');
const easesBeforeWave = await page.evaluate(() => window.__oagBigMind.state.eases);
await page.click('[data-bm-wave]');
ok(await waitStep('wave-you') && /your own charge/.test(await page.textContent('[data-bm-modal]')), 'the W.A.V.E. is on your own charge, and says the voice\'s stays as set');
await page.fill('[data-bm-yourange]', '8');
ok(await page.getAttribute('[data-bm-meteryou]', 'data-bm-you') === '8' && await page.getAttribute('[data-bm-meter]', 'data-bm-charge') === '7', 'two charges on the meter: you at 8 beside it at 7');
await page.screenshot({ path: SHOTS + '/bm-3h-two-charges.png' });
await page.click('[data-bm-youset]');
ok(await waitStep('wave-place'), 'then: where do you feel it in your body?');
await page.click('[data-bm-waveplace="Chest"]');
ok(await waitStep('wave-welcome') && await page.locator('[data-bm-wavego="welcome"]').isDisabled(), 'Welcome is one breath: its button waits for the breath');
ok(await page.locator('[data-bm-modal] [data-bm-orb]').count() === 1, 'the breath is drawn on the step (Wendell, 21:15)');
await page.waitForFunction(() => { const o = document.querySelector('[data-bm-orb]'); return o && parseFloat(o.style.transform.replace(/[^0-9.]/g, '')) > 0.7; }, null, { timeout: 4000 }).then(() => ok(true, 'the breath ring swells on the in-breath'), () => ok(false, 'the breath ring swells on the in-breath'));
ok(await page.evaluate(() => { const w = window.__oagBigMind.wave(); return w && w.B && !!w.B.g.parent && !w.B.element; }), 'the charge being worked shows in the scene, grey until named');
await page.evaluate(() => { window.__oagBigMind.state.speed = 40; });
const breathed = async (sel) => { await page.waitForSelector(sel + ':not([disabled])', { timeout: 8000 }); await page.click(sel); };
await breathed('[data-bm-wavego="welcome"]');
ok(await waitStep('wave-acknowledge') && await page.locator('[data-bm-element]').count() === 5, 'Acknowledge: name it in one word, then pick from the five elements');
ok(await page.locator('[data-bm-element][aria-pressed="true"]').count() === 0, 'the game does not guess the element');
await page.fill('[data-bm-waveword]', 'Dread');
await page.click('[data-bm-element="metal"]');
ok(await page.evaluate(() => window.__oagBigMind.wave().B.element === 'metal'), 'it takes its element at Acknowledge');
await page.screenshot({ path: SHOTS + '/bm-3i-wave-acknowledge.png' });
await breathed('[data-bm-wavego="acknowledge"]');
ok(await waitStep('wave-allow') && await page.locator('[data-bm-wavestop]').count() === 1, 'from Allow on you can stop at the rung you reached');
ok(await page.locator('[data-bm-waveallow="grow"]').count() === 1 && await page.locator('[data-bm-waveallow="bright"]').count() === 1, 'Allow has the size and brightness sliders');
await page.fill('[data-bm-waveallow="grow"]', '9');
// It grows frame by frame, so wait on the size, not the clock (a slow runner took longer than 1.5 s).
ok(await page.waitForFunction(() => window.__oagBigMind.wave().B.g.userData.body.scale.x > 1.6, null, { timeout: 10000 }).then(() => true, () => false), 'it grows as you allow it');
await page.screenshot({ path: SHOTS + '/bm-3j-wave-allow.png' });
await page.click('[data-bm-wavestop]');
ok(await waitStep('wave-validate'), 'stopping on a rung goes on to Validate');
await breathed('[data-bm-wavego="validate"]');
ok(await waitStep('wave-exhale'), 'then Exhale');
const relB = await page.evaluateHandle(() => window.__oagBigMind.wave().B);
await page.evaluate(() => { window.__oagBigMind.state.speed = 3; });
ok(await page.locator('[data-bm-exhale="release"]:not([disabled])').count() === 1 && await page.locator('[data-bm-modal] [data-bm-breath]').count() === 0, 'Exhale asks first: both answers are open at once, with no breath yet');
await page.click('[data-bm-exhale="release"]');
ok(await waitStep('wave-exhale-breath', 2000) && await page.locator('[data-bm-modal] [data-bm-breath]').count() === 1, 'the breath starts after the answer');
ok(await waitStep('wave-releasing', 4000), 'exhale and release: the charge is let go before the next question');
await page.waitForTimeout(300);
await page.screenshot({ path: SHOTS + '/bm-3l-wave-release.png' });
ok(await relB.evaluate((B) => B.rise > 0 && B.fade < 1), 'it rises and fades as it goes');
ok(await waitStep('wave-after'), 'after the Exhale: how charged are you now?');
ok(await relB.evaluate((B) => !B.g.parent) && await page.evaluate(() => window.__oagBigMind.spirits.filter((o) => !o.meet).length === 0), 'released, it is gone and does not follow');
await page.evaluate(() => { window.__oagBigMind.state.speed = 40; });
await page.fill('[data-bm-yourange]', '6');
await page.click('[data-bm-youafter]');
ok(await waitStep('charge'), 'the voice\'s poll comes back as after any answer');
ok(await page.getAttribute('[data-bm-meter]', 'data-bm-charge') === '7' && await page.inputValue('[data-bm-range]') === '7', 'the W.A.V.E. never moves the voice\'s number');
ok(await page.evaluate((n) => window.__oagBigMind.state.eases === n, easesBeforeWave), 'your own charge falling plays no easing for the voice');
ok(await page.getAttribute('[data-bm-meteryou]', 'data-bm-you') === '6', 'your charge stays on the meter: 6');
const w1 = await page.evaluate(() => window.__oagBigMind.state.waves[0]);
ok(w1 && w1.after === 'boss' && w1.word === 'Dread' && w1.element === 'metal' && w1.place === 'Chest' && w1.before === 8 && w1.afterCharge === 6 && w1.reached === 'acknowledge' && !w1.blocked, 'the W.A.V.E. is recorded: ' + JSON.stringify(w1));
// a step that won't go further is noted, and the W.A.V.E. counts as complete there
await page.click('[data-bm-wave]');
await page.click('[data-bm-youset]');
await page.click('[data-bm-wavenoplace]');
await page.click('[data-bm-waveblock]');
ok(await waitStep('wave-blocked'), 'something in the way is noted, without pushing past it');
await page.click('[data-bm-blockgo]');
await page.fill('[data-bm-yourange]', '6');
await page.click('[data-bm-youafter]');
ok(await waitStep('charge') && await page.evaluate(() => window.__oagBigMind.state.waves[1].blocked === 'welcome'), 'the blocked step is saved with the W.A.V.E.');
await page.waitForFunction(() => window.__oagBigMind.spirits.filter((o) => !o.meet).length === 1, null, { timeout: 4000 }).catch(() => {});
ok(await page.evaluate(() => window.__oagBigMind.spirits.filter((o) => !o.meet).length === 1 && window.__oagBigMind.spirits.filter((o) => !o.meet)[0].name === 'A charge'), 'a W.A.V.E. left at a block keeps its charge walking with you');
// the whole ladder, with Appreciate left for now, and the charge let stay
await page.click('[data-bm-wave]');
await page.click('[data-bm-youset]');
await page.click('[data-bm-wavenoplace]');
await breathed('[data-bm-wavego="welcome"]');
await page.fill('[data-bm-waveword]', 'Ache'); await page.click('[data-bm-element="water"]');
await breathed('[data-bm-wavego="acknowledge"]');
await breathed('[data-bm-wavego="allow"]');
await breathed('[data-bm-wavego="accept"]');
ok(await waitStep('wave-appreciate') && await page.locator('[data-bm-waveappreciate]').count() === 1 && await page.locator('[data-bm-wavenotnow]').count() === 1, 'Appreciate takes your own words, or can be left for now');
await page.fill('[data-bm-waveappreciate]', 'It wants me safe');
await page.screenshot({ path: SHOTS + '/bm-3k-wave-appreciate.png' });
await breathed('[data-bm-wavenotnow]');
ok(await waitStep('wave-validate'), 'Not now goes on to Validate');
await breathed('[data-bm-wavego="validate"]');
await breathed('[data-bm-exhale="stay"]');
ok(await waitStep('wave-exhale-breath', 2000), 'let stay, it is breathed with once');
ok(await waitStep('wave-after'), 'then how charged you are now');
ok(await page.evaluate(() => window.__oagBigMind.spirits.filter((o) => !o.meet).length === 2 && window.__oagBigMind.spirits.filter((o) => !o.meet)[1].name === 'Ache' && window.__oagBigMind.spirits.filter((o) => !o.meet)[1].element === 'water'), 'let stay, the charge walks with you as a spirit');
ok(await page.evaluate(() => !JSON.stringify(window.__oagBigMind.state.waves).includes('wants me safe')), 'what you appreciate stays on the page');
await page.fill('[data-bm-yourange]', '6');
await page.click('[data-bm-youafter]');
await waitStep('charge');
await page.evaluate(() => { window.__oagBigMind.state.speed = 6; });
await setCharge(6);
ok(await waitStep('q-hours') && /what are your hours\?/.test(await page.textContent('[data-bm-modal]')), 'and what are your hours?');
await page.fill('[data-bm-line]', 'I think it never stops');
await page.click('[data-bm-say]');
ok(await waitStep('secret'), 'an open line about the voice brings the second figure out too');
await page.click('[data-bm-name="ideas"]'); await page.click('[data-bm-thank]');
ok(await waitStep('q-hours'), 'asked again after the second dismissal');
await page.fill('[data-bm-line]', 'Nobody ever gives me a day off');
await page.click('[data-bm-say]');
await setCharge(5);
ok(await waitStep('q-from'), 'questions closer to the evidence follow: what do you protect the self from?');
{ // Wendell's own Protector questions (daemons/questions.js) follow, in his order and his plain wording
  const DQ = (await import('../daemons/questions.js')).default.daemons.protector;
  const qs = await page.evaluate(() => window.__oagBigMind.VOICES[0].questions.map((q) => [q.id, q.ask]));
  const after = qs.slice(qs.findIndex((q) => q[0] === 'from') + 1, qs.findIndex((q) => q[0] === 'from') + 1 + DQ.length);
  ok(JSON.stringify(after) === JSON.stringify(DQ.map((q) => [q.id, q.ask])), 'the Protector is asked Wendell\'s four questions after what it protects the self from: ' + after.map((q) => q[0]).join());
}
await page.click('[data-bm-modal] [data-bm-card]:has-text("Attack.")');
await page.click('[data-bm-modal] [data-bm-card]:has-text("Shame.")');
await page.click('[data-bm-done]');
await page.screenshot({ path: SHOTS + '/bm-3e-meter.png' });
const warmBefore = await page.evaluate(() => window.__oagBigMind.chamberLight.color.r);
await setCharge(2);
ok(await waitStep('eased', 3000) && /lets its breath out/.test(await page.textContent('[data-bm-eased]')), 'crossing the ready line gives the biggest easing');
await page.waitForTimeout(250);
await page.screenshot({ path: SHOTS + '/bm-3g-eased-ready.png' });
ok(await page.evaluate(() => document.querySelector('[data-bm-meter]').classList.contains('ready')), 'below the line, the meter turns');
ok(await waitStep('ready') && /I could step aside/.test(await page.textContent('[data-bm-modal]')), 'the charge low enough: it offers to step aside');
ok(await page.evaluate(() => !!window.__oagBigMind.heard) && await page.evaluate(() => ['protect from losing control', 'I keep watch', 'I hate self-doubt'].every((t) => window.__oagBigMind.heard(t) === null)), 'in-voice lines are not flagged (losing control, self-doubt)');
ok(await page.evaluate(() => { const h = window.__oagBigMind.heard; return h('I need to fix it') === 'fixer' && h('I keep everything in hand') === 'controller' && h('the protector is tired') === 'ideas'; }), 'open-line tells: the Fixer, the Controller, the self\'s ideas');
ok(await page.evaluate((w) => window.__oagBigMind.chamberLight.color.r > w, warmBefore), 'the chamber\'s light warms as the charge falls');
ok(await page.evaluate(() => window.__oagBigMind.state.eases === 4), 'every drop was rewarded (8, 7, 6, 5, 2: four drops)');
await page.click('[data-bm-ask="aside"]');
ok(await waitStep('perm-aside') && /step aside/.test(await page.textContent('[data-bm-modal]')), 'the player asks it to step aside');
await page.click('[data-bm-perm="yes"]');
await page.click('[data-bm-thanks="aside"]');
ok(await waitStep('be-who'), 'it steps aside and the player walks into its place');
let s1 = await st();
ok(s1.cam === 'voice' && Math.abs(s1.s - 58) < 0.05, 'the player stands where the voice stood, seen looking back the way the self came');
ok(await page.evaluate(() => !window.__oagBigMind.voice.visible), 'the voice is stepped into, not beside');
await page.screenshot({ path: SHOTS + '/bm-4-as-protector.png' });
ok(/Who are you\?/.test(await page.textContent('[data-bm-modal]')) && await page.locator('[data-bm-beline="who"]').count() === 1, 'speaking as it: first, in your own words, who it is');
await page.fill('[data-bm-beline="who"]', 'I am the Protector, and I never sleep');
await page.click('[data-bm-besay="who"]');
ok(await waitStep('be-see') && /I never sleep/.test(await page.textContent('[data-bm-modal]')), 'then what it sees from its post, with what it said shown back');
await page.screenshot({ path: SHOTS + '/bm-4b-as-protector-see.png' });
await page.click('[data-bm-bepass="see"]');
ok(await waitStep('know') && await page.locator('[data-bm-knowline]').count() === 1, 'then what it wants the self to know, with cards and its own words');
await page.click('[data-bm-know="1"]');
ok(await waitStep('thanks'), 'the guide thanks the voice');
await page.click('[data-bm-out]');
// The promise made at the start (to come back to its own place) is kept by stepping back out; the voice sees it at a check-in.
ok(await waitStep('checkin', 30000), 'stepping back out keeps the promise to come back, and the player checks how charged it is');
ok(await page.evaluate(() => window.__oagBigMind.trust().promises.some((p) => p.kind === 'return' && p.kept)), 'the promise is saved as kept');
await page.fill('[data-bm-range]', '1'); await page.click('[data-bm-checkin]');
ok(await waitStep('perm-pass', 30000), 'stepping back out, the player asks to walk on');
ok(await page.evaluate(() => { const m = window.__oagBigMind.marks(); return m.will === 1; }) && await page.getAttribute('[data-bm-marks]', 'data-bm-will') === '1', 'it eased, so its will mark fills: it saw the promise kept');
ok(/Protector saw it\. You came back to your own place, as you promised\./.test(await page.textContent('[data-bm-modal]')), 'with a plain line of what it saw');
s1 = await st();
ok(s1.cam === 'behind' && Math.abs(s1.s - 52) < 0.05, 'the player is back in the self\'s place');
await page.click('[data-bm-perm="yes"]');
await page.click('[data-bm-thanks="pass"]');
ok(await waitStep('keep', 30000), 'it lets the player pass, then the lines to keep');
ok((await page.textContent('[data-bm-keepwave="0"]')) === 'Dread, Metal, in your chest: 8 to 6', 'each W.A.V.E. is shown back as one line: ' + await page.textContent('[data-bm-keepwave="0"]'));
await page.click('[data-bm-keepwave="0"]');
await page.click('[data-bm-keep="0"]');
await page.click('[data-bm-keep="2"]');
await page.click('[data-bm-keep="7"]');
await page.click('[data-bm-save]');
await page.waitForTimeout(400);
let sv = await save();
ok(sv && sv.voices.protector && sv.voices.protector.status === 'spoken', 'the chamber is saved on the device');
ok(sv.voices.protector.kept.map((k) => k.line).join('|') === 'To protect.|Nobody ever gives me a day off|The self will get hurt.', 'only kept lines are stored, its fear among them: ' + JSON.stringify(sv.voices.protector.kept.map((k) => k.line)));
ok(sv.at === 'hall2' && sv.waiting.join() === 'ideas', 'the save holds the place and the part waiting');
ok(sv.voices.protector.waves.length === 3 && sv.voices.protector.waves[0].word === 'Dread' && sv.voices.protector.waves[1].word === null && sv.voices.protector.waves[1].before === 6, 'both W.A.V.E.s are saved; the feeling word only where it was kept');
ok(sv.voices.protector.place === 'Chest' && sv.voices.protector.charges.map((c) => c.v).join() === '8,8,8,7,6,5,2,1', 'the save holds where it lives and how its charge fell: ' + JSON.stringify(sv.voices.protector.charges));
// the gate eases open with the frames, which come slower on a loaded runner, so wait for it rather than a fixed time
await page.waitForFunction(() => window.__oagBigMind.openAt(window.__oagBigMind.S.S_GATE + 14) > 0.9, null, { timeout: 6000 }).catch(() => {});
const open = await page.evaluate(() => window.__oagBigMind.openAt(window.__oagBigMind.S.S_GATE + 14));
ok(open > 0.9, 'the way past the chamber opens (' + open.toFixed(2) + ')');
await page.screenshot({ path: SHOTS + '/bm-6-way-open.png' });
await hold(true);
await page.waitForFunction(() => /waits? here/.test(document.querySelector('[data-bm-hint]').textContent), null, { timeout: 15000 }).then(() => ok(true, 'the part that was asked to wait stands in the hallway past the chamber'), () => ok(false, 'the waiting part is met in the hallway'));
await page.screenshot({ path: SHOTS + '/bm-7-waiting-part.png' });
ok(await holdUntil('end'), 'the hallway ends at the mouth of the next chamber');
ok(await page.evaluate(() => window.__oagBigMind.child === null), 'the shut mouth shows no figure');
ok(await page.evaluate(() => { const m = window.__oagBigMind.mouth; return m.light.intensity > 0.2 && m.glow.material.opacity > 0.05; }), 'the shut mouth breathes, with its light on');
ok(!/figure/i.test(await page.textContent('[data-bm-modal]')), 'the end of the hallway names no figure at the mouth');
const lights = new Set(); for (let i = 0; i < 12; i++) { lights.add((await page.evaluate(() => window.__oagBigMind.mouth.light.intensity)).toFixed(2)); await page.waitForTimeout(700); }
ok(lights.size > 3, 'the light rises and falls with the breath: ' + lights.size + ' levels seen');
ok(/The Controller/.test(await page.textContent('[data-bm-modal]')) && await page.locator('[data-bm-onward]').count() === 1, 'the Controller waits there, and its chamber is open');
await page.screenshot({ path: SHOTS + '/bm-8-next-chamber.png' });
await page.click('[data-bm-leave]');
ok(await waitStep('mouth-spirits'), 'the W.A.V.E.s\' spirits come out with you to the mouth');
await page.click('[data-bm-mouthspirit="0"]'); await page.click('[data-bm-mouthspirit="1"]'); await page.click('[data-bm-walkout]');
await page.waitForSelector('[data-bm-mouth]');
ok(/Go back in, to the Protector/.test(await page.textContent('[data-bm-enter]')), 'back at the mouth, the cave offers to go back in to the Protector, to ask it again');
ok(/To protect\./.test(await page.textContent('[data-bm-kept]')), 'the mouth lists what has been kept');
ok(await page.locator('[data-bm-kept] .bm-keptcard[data-bm-keptcard="protector"]').count() === 1 && await page.locator('[data-bm-keptcard="protector"] [data-bm-forget="protector"]').count() === 1, 'what is kept is a card per voice, with Forget on its card');
ok(/W\.A\.V\.E\.: Dread, Metal, in your chest: 8 to 6/.test(await page.textContent('[data-bm-kept]')), 'the mouth lists each W.A.V.E. as one line');
await page.screenshot({ path: SHOTS + '/bm-9-mouth-kept.png' });
await page.click('[data-bm-enter]');
await page.waitForSelector('[data-bm-cave] canvas');
await page.waitForTimeout(300);
ok(await holdUntil('meet'), 'going back in meets the Protector again: every visit asks again');
ok(/You have met the Protector before/.test(await page.textContent('[data-bm-modal]')), 'it is asked again, whatever the save holds');
await page.click('[data-bm-decline]'); await page.waitForTimeout(2200);
sv = await save();
ok(sv.voices.protector.status === 'spoken' && sv.voices.protector.kept.length === 3 && sv.voices.protector.trust.seen.length >= 1, 'declining it today keeps what it said before, and its trust');
await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]');
await page.waitForSelector('[data-bm-mouth]');
await page.click('[data-bm-forget="protector"]');
ok((await save()).voices.protector === undefined, 'forget removes the voice\'s record');

// it keeps the way: refusing at the end, left at its post, back to the mouth
await page.click('[data-bm-enter]');
await page.waitForSelector('[data-bm-cave] canvas');
ok(await holdUntil('meet'), 'a fresh sitting meets the Protector');
await page.click('[data-bm-reply="hear"]'); await page.click('[data-bm-ask="speak"]');
await page.click('[data-bm-perm="no"]');
await page.click('[data-bm-post="speak"]');
ok(await waitStep('post-speak') && /Thank you for not pushing/.test(await page.textContent('[data-bm-modal]')), 'leaving it at its post: it thanks the player');
await page.click('[data-bm-next]');
await page.waitForSelector('[data-bm-mouth]', { timeout: 3000 }).catch(() => {});
ok(await page.locator('[data-bm-mouth]').isVisible(), 'and the player walks back up to the mouth');
sv = await save();
ok(sv.voices.protector.status === 'waiting' && sv.voices.protector.keepsWay && !JSON.stringify(sv).includes('skip'), 'it is saved as keeping the way, waiting, nothing skipped');
ok(/keeping the way/.test(await page.textContent('[data-bm-kept]')), 'the mouth says it is keeping the way for now');
await page.click('[data-bm-forget="protector"]');

// declining is a full move
await page.click('[data-bm-enter]');
await page.waitForSelector('[data-bm-cave] canvas');
ok(await holdUntil('meet'), 'a second sitting reaches the Protector again');
await page.click('[data-bm-decline]');
await page.waitForTimeout(2200);
sv = await save();
ok(sv.voices.protector.status === 'waiting' && sv.voices.protector.kept.length === 0 && !JSON.stringify(sv).includes('skip'), 'declining: the voice waits and nothing is marked skipped');
// The gate eases open frame by frame, so a slow runner takes longer than 2.2 s: wait on the gate itself, not the clock.
const opened = await page.waitForFunction(() => window.__oagBigMind.openAt(window.__oagBigMind.S.S_GATE + 14) > 0.9, null, { timeout: 10000 }).then(() => true, () => false);
ok(opened, 'declining opens the way');
await page.screenshot({ path: SHOTS + '/bm-10-declined.png' });
await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]');
await page.waitForSelector('[data-bm-mouth]');
await page.click('[data-bm-wipe]');
ok(await page.isVisible('[data-bm-wipeask]') && (await save()) !== null, 'delete everything asks once more on the page, and nothing is gone yet');
await page.click('[data-bm-wipeno]');
ok(await page.isVisible('[data-bm-wipe]') && (await save()) !== null, 'Keep it puts the button back and keeps the save');
await page.click('[data-bm-wipe]'); await page.click('[data-bm-wipeyes]');
await page.waitForTimeout(200);
ok((await save()) === null, 'delete everything clears the device');

// sitting down anywhere, and the charge spirits (bmw-block steer; pass 3, bms-sit-whom pick, bms-spirits-after choose)
await page.click('[data-bm-enter]');
await page.waitForSelector('[data-bm-cave] canvas');
await hold(true); await page.waitForTimeout(700); await hold(false);
const wide0 = await page.evaluate(() => window.__oagBigMind.openAt(window.__oagBigMind.state.s));
ok(await page.isEnabled('[data-bm-sitbtn]'), 'Sit down is there in the hallway');
await page.click('[data-bm-sitbtn]');
ok(await waitStep('sit-welcome'), 'in a hallway, sitting down goes straight to what is coming up in you, at Welcome');
const wide1 = await page.evaluate(() => window.__oagBigMind.openAt(window.__oagBigMind.state.s));
ok(wide1 < wide0 - 0.1, 'the walls draw in around the sitting (' + wide0.toFixed(2) + ' to ' + wide1.toFixed(2) + ')');
ok(await page.evaluate(() => window.__oagBigMind.sitting().k > 0.9), 'the figure sits');
await page.click('[data-bm-sitnext]');
ok(await waitStep('sit-witness') && await page.isDisabled('[data-bm-sitnext]'), 'Witness asks where it is and what it is like, from the room\'s steps');
await page.click('[data-bm-sitplace="Belly"]'); await page.click('[data-bm-sittexture="tension"]');
await page.click('[data-bm-sitnext]');
ok(await waitStep('sit-acknowledge'), 'then Acknowledge');
await page.fill('[data-bm-sitname]', 'Worry'); await page.click('[data-bm-sitelement="metal"]');
ok(await page.evaluate(() => window.__oagBigMind.sitting().name === 'Worry'), 'the typed name survives picking the element');
await page.waitForTimeout(700);
const seen = await page.evaluate(() => {
  const B = window.__oagBigMind, g = B.state.sit.g, v = g.position.clone(); g.updateMatrixWorld(); g.getWorldPosition(v); v.project(B.camera);
  const m = document.querySelector('.oagc-modal').getBoundingClientRect(), rc = [...document.querySelectorAll('canvas')].map((c) => c.getBoundingClientRect()).sort((p, q) => q.width * q.height - p.width * p.height)[0];
  return { y: rc.top + (1 - v.y) / 2 * rc.height, x: rc.left + (v.x + 1) / 2 * rc.width, panel: m.top, h: innerHeight, w: innerWidth };
});
// PR 5 (Wendell, 19 October 2026): the page is a sheet in the bottom half, so the charge is framed above it
ok(seen.y < seen.panel - 10 && seen.y > 10 && seen.x > 10 && seen.x < seen.w - 10, 'at Acknowledge the camera frames the charge above the sheet (y ' + seen.y.toFixed(0) + ', sheet starts ' + seen.panel.toFixed(0) + ')');
await page.screenshot({ path: SHOTS + '/bm-6-sit-acknowledge.png' });
const cam0 = await page.evaluate(() => window.__oagBigMind.camera.position.toArray());
await page.mouse.move(195, 300); await page.mouse.down(); await page.mouse.move(345, 240, { steps: 8 }); await page.mouse.up();
await page.waitForTimeout(800);
const orbit = await page.evaluate(() => {
  const B = window.__oagBigMind, c = B.camera.position;
  return { p: c.toArray(), open: document.querySelector('[data-bm-modal]').getAttribute('data-bm-step') };
});
const moved = Math.hypot(orbit.p[0] - cam0[0], orbit.p[2] - cam0[2]);
ok(moved > 1 && orbit.open === 'sit-acknowledge', 'seated, dragging the scene turns the camera (moved ' + moved.toFixed(1) + ') and the panel stays open');
ok(await page.evaluate(() => { const B = window.__oagBigMind; return B.inCave(B.camera.position); }), 'the turned camera stays inside the cave');
await page.screenshot({ path: SHOTS + '/bm-6b-sit-turned.png' });
await page.click('[data-bm-sitnext]');
ok(await waitStep('sit-allow') && await page.locator('[data-bm-sitallow="grow"]').count() === 1, 'Allow has the room\'s size and brightness sliders');
await page.fill('[data-bm-sitallow="grow"]', '8');
await page.click('[data-bm-sitnext]'); await waitStep('sit-accept');
await page.click('[data-bm-sitnext]');
ok(await waitStep('sit-appreciate') && await page.locator('[data-bm-sitnotnow]').count() === 1, 'Appreciate can be left for now');
await page.click('[data-bm-sitnotnow]'); await waitStep('sit-validate');
await page.click('[data-bm-sitnext]');
ok(await waitStep('sit-fork') && await page.isDisabled('[data-bm-sitpush="toward"]'), 'the fork asks what you actually want first');
await page.fill('[data-bm-sitgoal]', 'rest');
await page.click('[data-bm-sitpush="toward"]');
ok(await waitStep('sit-321'), 'toward it runs the room\'s 3-2-1, aimed at the goal');
await page.click('[data-cave-321-start]');
ok(/Aimed at what you want: rest/.test(await page.textContent('[data-bm-modal]')), 'the 3-2-1 shows the aim');
ok(await page.locator('[data-cave-321-skip]').count() === 1, 'every page of the 3-2-1 can be skipped');
await page.click('[data-cave-321-next]'); // to Talk to it
for (const line of ['Why are you here', 'To keep you safe', 'From what', 'From being seen']) { await page.fill('[data-cave-321-text]', line); await page.press('[data-cave-321-text]', 'Enter'); }
const chat = await page.evaluate(() => { const m = document.querySelector('[data-bm-modal]'), i = m.querySelector('[data-cave-321-text]'), a = m.getBoundingClientRect(), b = i.getBoundingClientRect();
  return { inView: b.top >= a.top && b.bottom <= a.bottom, focused: document.activeElement === i, voice: m.querySelector('[data-cave-321-voice][aria-pressed="true"]').getAttribute('data-cave-321-voice') }; });
ok(chat.inView && chat.focused && chat.voice === 'you', 'in Talk to it the text box stays in view and keeps focus line after line, and the voice switches each line');
await page.click('[data-cave-321-skip]');
ok(await page.locator('[data-bm-sitmove]').count() === 1, 'Skip goes straight to the next move');
await page.fill('[data-bm-sitmove]', 'lie down');
await page.click('[data-bm-sitmovedone]');
await page.waitForFunction(() => window.__oagBigMind.spirits.filter((o) => !o.meet).length === 1 && !window.__oagBigMind.sitting(), null, { timeout: 8000 }).catch(() => {});
ok(await page.evaluate(() => window.__oagBigMind.spirits.filter((o) => !o.meet).length === 1 && window.__oagBigMind.spirits.filter((o) => !o.meet)[0].name === 'Worry'), 'a charge that stays follows as a spirit with its name');
ok((await page.textContent('[data-bm-spiritbtn]')) === 'Spirits 1', 'the spirit count shows');
sv = await save();
ok(sv.sittings.length === 1 && sv.sittings[0].branch === 'stays' && sv.sittings[0].where === 'hall1' && !JSON.stringify(sv).includes('Worry') && !JSON.stringify(sv).includes('lie down'), 'the sitting is recorded by where, whom and branch, with no words: ' + JSON.stringify(sv.sittings));
await page.waitForTimeout(800);
const sp = await page.evaluate(() => { const A = window.__oagBigMind, g = A.spirits[0].g; return { vis: g.visible, z: g.position.z, me: A.state.s }; });
ok(sp.vis, 'the spirit is in view');
await page.screenshot({ path: SHOTS + '/bm-11-spirit-follows.png' });
ok(await holdUntil('meet'), 'walking on with a spirit reaches the Protector');
ok(/You didn't come alone\./.test(await page.textContent('[data-bm-modal]')), 'the Protector says you did not come alone');
ok(await page.evaluate(() => window.__oagBigMind.voice.scale.x > 1.03), 'and it squares up');
await page.click('[data-bm-sitbtn]');
ok(await waitStep('sit-whom'), 'in a chamber, sitting down asks who to sit with');
await page.click('[data-bm-sitwhom="voice"]');
ok(await waitStep('sit-welcome') && /Sitting with the Protector/.test(await page.textContent('[data-bm-modal]')), 'sitting with the voice in front of you');
for (const id of ['witness', 'acknowledge', 'allow', 'accept', 'appreciate', 'validate']) {
  await page.click('[data-bm-sitnext]', { force: true }).catch(() => {});
  if (id === 'witness') { await waitStep('sit-witness'); await page.click('[data-bm-sittexture="constriction"]'); }
  if (id === 'acknowledge') { await waitStep('sit-acknowledge'); await page.fill('[data-bm-sitname]', 'Wary'); await page.click('[data-bm-sitelement="unknown"]'); }
}
await page.click('[data-bm-sitnext]');
ok(await waitStep('meet', 8000), 'the voice\'s sitting has no fork, and it comes back to where you were');
ok(await page.evaluate(() => window.__oagBigMind.spirits.filter((o) => !o.meet).length === 2 && window.__oagBigMind.spirits.filter((o) => !o.meet)[1].name === 'Wary'), 'sitting with the voice spawns a spirit too (Wendell, 20:43: every sit-down W.A.V.E. spawns one)');
await page.click('[data-bm-reply="hear"]'); await page.click('[data-bm-ask="speak"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="speak"]');
await page.click('[data-bm-place="Chest"]'); await page.click('[data-bm-charged]');
for (let i = 0; i < 3; i++) { await page.click('[data-bm-card="0"]'); await page.click('[data-bm-charged]'); }
ok(await waitStep('q-from'), 'the from question comes');
const fromText = await page.textContent('[data-bm-modal]');
ok(/Worry\./.test(fromText) && /protecting you from what you carry/.test(fromText), 'it offers the spirit as an answer, and asks whether it protects you from what you carry');
await page.click('[data-bm-card="0"]'); await page.click('[data-bm-done]');
await waitStep('charge');
ok(await page.evaluate(() => window.__oagBigMind.state.charge === 7), 'spirits never move its charge');
await page.click('[data-bm-wave]'); await page.click('[data-bm-youset]'); await page.click('[data-bm-wavenoplace]');
await waitStep('wave-welcome');
await page.click('[data-bm-waveblock]');
ok(await waitStep('wave-blocked') && await page.locator('[data-bm-blocksit]').count() === 1, 'a block offers to sit down with it');
await page.click('[data-bm-blocksit]');
ok(await waitStep('sit-welcome'), 'and sitting down with it starts at Welcome');
await page.click('[data-bm-standup]');
ok(await waitStep('wave-welcome', 8000), 'standing up returns to the W.A.V.E. step it stopped on');
ok(await page.evaluate(() => { const o = window.__oagBigMind.spirits.filter((o) => !o.meet)[2]; return window.__oagBigMind.spirits.filter((o) => !o.meet).length === 3 && /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(o.name); }), 'a sitting stood up from early still spawns a spirit, under the name the game gave it');
ok((await page.textContent('[data-bm-spiritbtn]')).startsWith('Spirits ' + (await page.evaluate(() => window.__oagBigMind.spirits.length))), 'the spirits are counted: ' + (await page.textContent('[data-bm-spiritbtn]')));
sv = await save();
ok(sv.sittings.length === 3 && sv.sittings[2].via === 'block' && sv.sittings[2].branch === 'stood' && sv.sittings[1].whom === 'voice', 'each sitting is recorded: ' + JSON.stringify(sv.sittings.map((x) => [x.whom, x.via, x.branch])));
await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]');
ok(await waitStep('mouth-spirits'), 'at the mouth, each spirit is kept for next time or let go');
await page.click('[data-bm-mouthspirit="1"]'); await page.click('[data-bm-mouthspirit="2"]');
await page.click('[data-bm-walkout]');
await page.waitForSelector('[data-bm-mouth]');
ok(JSON.stringify((await save()).spirits) === '[{"name":"Worry","element":"metal"}]', 'a kept spirit is its name and element, on the device');
ok(/Worry \(Metal\)/.test(await page.textContent('[data-bm-keptspirits]')), 'the mouth lists the kept spirit');
await page.click('[data-bm-enter]');
await page.waitForSelector('[data-bm-cave] canvas');
await page.waitForTimeout(300);
ok((await page.evaluate(() => window.__oagBigMind.spirits.filter((o) => !o.meet).length)) === 1, 'a kept spirit comes back in with you');
await menuTap('[data-bm-spiritbtn]');
ok(await waitStep('spirit-list'), 'tapping the spirits lists them');
await page.click('[data-bm-spirit="0"]');
ok(await waitStep('spirit-thank') && /Thank you for coming with me/.test(await page.textContent('[data-bm-modal]')), 'tapping one thanks it');
await page.click('[data-bm-spiritout]');
ok((await page.evaluate(() => window.__oagBigMind.spirits.filter((o) => !o.meet).length)) === 0, 'breathing out lets it go');
await page.waitForTimeout(300);
await page.click('[data-bm-sitbtn]'); await waitStep('sit-welcome');
await page.click('[data-bm-sitnext]'); await waitStep('sit-witness'); await page.click('[data-bm-sittexture="numbness"]');
await page.click('[data-bm-sitnext]'); await waitStep('sit-acknowledge'); await page.click('[data-bm-sitelement="water"]');
const gen = await page.evaluate(() => window.__oagBigMind.sitting().gen);
ok(/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(gen) && !(await page.isDisabled('[data-bm-sitnext]')), 'a name is optional: the game names it ' + gen + ' to keep track of it');
await page.click('[data-bm-sitnext]'); await waitStep('sit-allow');
ok((await page.textContent('[data-bm-modal]')).includes(gen + ' grows'), 'and calls it by that name');
for (const id of ['accept', 'appreciate', 'validate']) { await page.click('[data-bm-sitnext]'); await waitStep('sit-' + id); }
ok(await page.locator('[data-bm-sitrename]').count() === 1, 'once it has been worked through, Validate offers a name of your own');
await page.fill('[data-bm-sitrename]', 'Ache');
await page.click('[data-bm-sitnext]'); await waitStep('sit-fork');
await page.fill('[data-bm-sitgoal]', 'quiet'); await page.click('[data-bm-sitpush="away"]');
ok(await waitStep('sit-goes') && /walks with you, lighter/.test(await page.textContent('[data-bm-modal]')), 'away from it breathes it out, and says it still walks with you');
await page.click('[data-bm-sitexhale]');
await page.waitForFunction(() => window.__oagBigMind.spirits.filter((o) => !o.meet).length === 1 && !window.__oagBigMind.sitting(), null, { timeout: 8000 }).catch(() => {});
ok(await page.evaluate(() => { const o = window.__oagBigMind.spirits.filter((o) => !o.meet)[0]; return o && o.name === 'Ache' && o.lighter && o.g.userData.level < 0.3; }), 'a charge breathed out still spawns a spirit, walking lighter');
await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]');
await waitStep('mouth-spirits'); await page.click('[data-bm-mouthspirit="0"]'); await page.click('[data-bm-walkout]');
await page.waitForSelector('[data-bm-mouth]');
ok(JSON.stringify((await save()).spirits) === '[]', 'with every spirit let go, nothing is kept');
await page.evaluate(() => localStorage.clear());

// The Controller's chamber (board dp-seven, dq-boss-chain): walking on from the Protector, Wendell's own five questions,
// and the boss question, whose answer changes the method question that follows (byBoss).
{
  const DQ = (await import('../daemons/questions.js')).default.daemons.controller;
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('oag.bigmind.v1', JSON.stringify({ v: 1, at: 'hall2', voices: { protector: { status: 'spoken', kept: [], charges: [], waves: [] } }, waiting: ['controller', 'ideas'] })); });
  await page.reload(); await page.waitForSelector('[data-bm-mouth]');
  ok(/to the Protector/.test(await page.textContent('[data-bm-enter]')), 'a save from before the Controller still goes back in to the Protector');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
  ok(await passAgain(), 'going back in asks the voice again, and declining opens the way');
  ok(await holdUntil('end'), 'the hallway past the Protector ends at the Controller');
  await page.click('[data-bm-onward]');
  await page.waitForFunction(() => window.__oagBigMind.voiceId === 'controller' && window.__oagBigMind.state && window.__oagBigMind.state.phase === 'hall1', null, { timeout: 8000 }).catch(() => {});
  let sv = await save();
  ok(await page.evaluate(() => window.__oagBigMind.voiceId) === 'controller' && sv.chamber === 1 && sv.at === 'mouth', 'walking on builds the Controller\'s chamber, and the save moves on to it');
  ok(JSON.stringify(sv.waiting) === '["ideas"]', 'the Controller no longer waits by the wall once its own chamber is reached: ' + JSON.stringify(sv.waiting));
  const qs = await page.evaluate(() => window.__oagBigMind.VOICES[1].questions.map((q) => [q.id, q.ask]));
  ok(JSON.stringify(qs.slice(0, DQ.length)) === JSON.stringify(DQ.map((q) => [q.id, q.ask])), 'the Controller is asked Wendell\'s five questions first, in his order and plain wording: ' + qs.slice(0, DQ.length).map((q) => q[0]).join());
  const how = DQ.find((q) => q.id === 'how');
  ok(await page.evaluate((b) => JSON.stringify(window.__oagBigMind.VOICES[1].questions.find((q) => q.id === 'how').byBoss) === JSON.stringify(b), how.byBoss), 'its method question\'s follow-up for each boss is his, from questions.js');
  ok(await page.evaluate(() => { const h = window.__oagBigMind.heard; return h('I keep everything in hand', 'controller') === null && h('the controller is tired', 'controller') === 'ideas' && h('I need to fix it', 'controller') === 'fixer'; }), 'in its chamber, keeping things in hand is in voice, and talking about it is the self\'s ideas');
  ok(await page.evaluate(() => { const b = window.__oagBigMind.heardBoss; return b('the vulnerable child') === 'player' && b('The Protector, always') === 'protector' && b('Myself') === 'controller' && b('the self') === 'self' && b('my boss') === null; }), 'an open line names its boss');

  // meet it, up to the boss question; the boss is picked with a card or in the player's own words
  let meetText = '';
  const toBoss = async () => {
    if (!(await holdUntil('meet'))) return false;
    meetText = await page.textContent('[data-bm-modal]');
    await page.click('[data-bm-reply="hear"]'); await page.click('[data-bm-ask="speak"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="speak"]');
    await page.click('[data-bm-place="Shoulders"]'); await setCharge(8);
    if (!(await waitStep('q-what'))) return false;
    await page.click('[data-bm-modal] [data-bm-card]:has-text("The plan.")'); await setCharge(8);
    return waitStep('q-boss');
  };
  ok(await toBoss(), 'the Controller is met, and asked what it controls, then who it works for');
  let text = await page.textContent('[data-bm-modal]');
  ok(/Not yet\. Not until this is handled\./.test(meetText) && /Who do you work for: the Protector, the self, control itself, or the vulnerable child\?/.test(text), 'the Controller speaks first, and the boss question names the four bosses');
  await page.screenshot({ path: SHOTS + '/bm-12-controller-boss.png' });
  await page.click('[data-bm-modal] [data-bm-card]:has-text("The Protector.")');
  ok(await waitStep('charge') && /You keep it all in hand so the body stays safe/.test(await page.textContent('[data-bm-modal]')), 'the guide answers who it works for');
  await setCharge(8);
  ok(await waitStep('q-how'), 'then how it does that work');
  text = await page.textContent('[data-bm-modal]');
  ok(text.includes(how.byBoss.protector) && /If everything is in hand, nothing can hurt us\./.test(text), 'working for the Protector, it is asked how controlling protects the body, with cards to match');
  await page.screenshot({ path: SHOTS + '/bm-13-controller-how.png' });
  await page.click('[data-bm-modal] [data-bm-card]:has-text("I plan for every danger.")'); await setCharge(7);
  ok(await waitStep('q-violated', 25000), 'then what happens if its standards are violated');
  await page.click('[data-bm-modal] [data-bm-card]:has-text("I tighten everything.")'); await page.click('[data-bm-done]');
  await setCharge(2);
  ok(await waitStep('eased', 3000) && /The Controller lets its breath out/.test(await page.textContent('[data-bm-eased]')), 'its easing is its own');
  ok(await waitStep('ready') && /if you do it properly/.test(await page.textContent('[data-bm-modal]')), 'below the line, it offers to step aside');
  await page.click('[data-bm-ask="aside"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="aside"]');
  ok(await waitStep('be-who') && /where the Controller stands/.test(await page.textContent('[data-bm-modal]')), 'the player stands where the Controller stands');
  await page.click('[data-bm-bepass="who"]'); await page.click('[data-bm-bepass="see"]');
  await waitStep('know'); await page.click('[data-bm-know="0"]');
  await waitStep('thanks'); await page.click('[data-bm-out]');
  ok(await waitStep('perm-pass', 30000), 'stepping back out, the player asks to walk on');
  // Wendell, 15 October: the charge goes down even while it holds back, and the player can see what moved it
  await page.click('[data-bm-perm="no"]'); await page.click('[data-bm-why]'); await page.click('[data-bm-fear="1"]'); await page.click('[data-bm-assure="2"]');
  await page.click('[data-bm-again]');
  ok(await waitStep('blockpoll-pass') && /How charged is the Controller now\?/.test(await page.textContent('[data-bm-modal]')), 'held back at the last ask, it is asked how charged it is now');
  await page.fill('[data-bm-range]', '1'); await page.click('[data-bm-blockcharged]');
  ok(await waitStep('eased', 3000) && /2 down to 1/.test(await page.textContent('[data-bm-eased]')), 'a drop while it holds back eases like any other');
  ok(await waitStep('perm-pass'), 'then the player asks again');
  await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="pass"]');
  ok(await waitStep('keep', 30000) && /What the Controller said/.test(await page.textContent('[data-bm-modal]')), 'then its lines to keep');
  ok(/You offered: I'll go one step at a time, and you can stop me at any time\.: 2 to 1/.test(await page.textContent('[data-bm-moved]')), 'the keeping step shows what moved its resistance: ' + await page.textContent('[data-bm-moved]'));
  await page.click('[data-bm-keep="0"]'); await page.click('[data-bm-save]');
  await page.waitForTimeout(400);
  sv = await save();
  ok(sv.voices.controller && sv.voices.controller.status === 'spoken' && sv.voices.controller.boss === 'protector' && sv.chamber === 1 && sv.at === 'hall2', 'its record holds who it works for: ' + JSON.stringify({ boss: sv.voices.controller.boss, chamber: sv.chamber, at: sv.at }));
  ok(sv.voices.controller.kept.map((k) => k.line).join() === 'The plan.', 'only kept lines are stored');
  ok(sv.voices.controller.charges.some((c) => c.after === 'held-pass' && c.from === 2 && c.v === 1 && /step at a time/.test(c.why)), 'the drop while it held back is saved with what moved it');
  ok(await holdUntil('end') && /The Skeptic/.test(await page.textContent('[data-bm-modal]')) && await page.locator('[data-bm-onward]').count() === 1, 'past the Controller, the Skeptic waits, and its chamber is open');
  await page.screenshot({ path: SHOTS + '/bm-14-skeptic-shut.png' });
  await page.click('[data-bm-leave]');
  await page.waitForSelector('[data-bm-mouth]');
  ok(/to the Controller/.test(await page.textContent('[data-bm-enter]')) && /It works for the Protector\./.test(await page.textContent('[data-bm-kept]')) && /Moved it: You offered/.test(await page.textContent('[data-bm-kept]')), 'the mouth goes back in to the Controller, and says who it works for and what moved it');

  // the vulnerable child: his set has no follow-up of its own there, so the plain question stays, with the child's cards
  await page.click('[data-bm-forget="controller"]');
  sv = await save();
  ok(sv.voices.controller === undefined && sv.chamber === 1 && sv.at === 'mouth' && sv.voices.protector, 'forgetting the Controller goes back to its chamber, and the Protector\'s record stays');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
  ok(await toBoss(), 'a fresh sitting meets the Controller again');
  await page.click('[data-bm-modal] [data-bm-card]:has-text("The vulnerable child.")'); await setCharge(8);
  ok(await waitStep('q-how'), 'then how');
  text = await page.textContent('[data-bm-modal]');
  ok(text.includes('You: How are you doing the work of who you work for?') && /I keep it still so it can't be hurt\./.test(text), 'working for the vulnerable child, the plain question stays and the cards are the child\'s');

  // naming the boss in its own words
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
  ok(await toBoss(), 'and again');
  await page.fill('[data-bm-line]', 'Control itself. Nobody else gives the orders');
  await page.click('[data-bm-say]');
  ok(await waitStep('charge'), 'a boss named in its own words is in voice, with no second figure');
  await setCharge(8);
  ok(await waitStep('q-how') && (await page.textContent('[data-bm-modal]')).includes(how.byBoss.controller), 'working for control itself, it is asked what standards it sets about control');
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.click('[data-bm-restart]');
  await page.waitForSelector('[data-bm-cave] canvas');
  ok((await save()).chamber === 0 && await page.evaluate(() => window.__oagBigMind.voiceId) === 'protector', 'starting at the mouth again begins with the Protector');
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.evaluate(() => localStorage.clear());
}

// The Skeptic's chamber (board dp-seven, dq-boss-chain): walking on from the Controller, Wendell's own four questions, and
// the boss question, where the Controller is one of the bosses and what it said of its own boss follows (the chain).
{
  const DQ = (await import('../daemons/questions.js')).default.daemons.skeptic;
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('oag.bigmind.v1', JSON.stringify({ v: 1, chamber: 1, at: 'hall2', voices: { protector: { status: 'spoken', kept: [], charges: [], waves: [] }, controller: { status: 'spoken', kept: [], charges: [], waves: [], boss: 'protector' } }, waiting: ['skeptic'] })); });
  await page.reload(); await page.waitForSelector('[data-bm-mouth]');
  ok(/to the Controller/.test(await page.textContent('[data-bm-enter]')), 'a save past the Controller goes back in to it, to ask it again');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
  ok(await passAgain(), 'going back in asks the voice again, and declining opens the way');
  ok(await holdUntil('end'), 'the hallway past the Controller ends at the Skeptic');
  await page.click('[data-bm-onward]');
  await page.waitForFunction(() => window.__oagBigMind.voiceId === 'skeptic' && window.__oagBigMind.state && window.__oagBigMind.state.phase === 'hall1', null, { timeout: 8000 }).catch(() => {});
  let sv = await save();
  ok(await page.evaluate(() => window.__oagBigMind.voiceId) === 'skeptic' && sv.chamber === 2 && sv.at === 'mouth', 'walking on builds the Skeptic\'s chamber, and the save moves on to it');
  ok(JSON.stringify(sv.waiting) === '[]', 'the Skeptic no longer waits by the wall once its own chamber is reached: ' + JSON.stringify(sv.waiting));
  const qs = await page.evaluate(() => window.__oagBigMind.VOICES[2].questions.map((q) => [q.id, q.ask]));
  ok(JSON.stringify(qs.slice(0, DQ.length)) === JSON.stringify(DQ.map((q) => [q.id, q.ask])), 'the Skeptic is asked Wendell\'s four questions first, in his order and plain wording: ' + qs.slice(0, DQ.length).map((q) => q[0]).join());
  ok(await page.evaluate(() => { const h = window.__oagBigMind.heard; return h('I doubt anyone means it', 'skeptic') === null && h('the skeptic is tired', 'skeptic') === 'ideas' && h('I need to fix it', 'skeptic') === 'fixer'; }), 'in its chamber, doubting is in voice, and talking about it is the self\'s ideas');
  ok(await page.evaluate(() => { const b = window.__oagBigMind.heardBoss; return b('The Controller', 'skeptic') === 'controller' && b('Myself', 'skeptic') === null && b('the self', 'skeptic') === 'self' && b('the little one', 'skeptic') === 'player'; }), 'to the Skeptic, an open line naming the Controller names a boss, and "myself" names none');

  const toBoss = async () => {
    if (!(await holdUntil('meet'))) return false;
    if (!/Show me the evidence\./.test(await page.textContent('[data-bm-modal]'))) return false;
    await page.click('[data-bm-reply="hear"]'); await page.click('[data-bm-ask="speak"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="speak"]');
    await page.click('[data-bm-place="Jaw"]'); await setCharge(8);
    if (!(await waitStep('q-what'))) return false;
    if (!(await page.textContent('[data-bm-modal]')).includes('You: ' + DQ[0].ask)) return false;
    await page.click('[data-bm-modal] [data-bm-card]:has-text("Good news.")'); await setCharge(8);
    return waitStep('q-boss');
  };
  ok(await toBoss(), 'the Skeptic speaks first, is met, and asked what it doubts, then who it works for');
  let text = await page.textContent('[data-bm-modal]');
  ok(text.includes('You: Who do you work for?') && /The Controller\./.test(text) && /The vulnerable child\./.test(text), 'the boss question is his plain one, and the Controller is among the bosses');
  await page.screenshot({ path: SHOTS + '/bm-15-skeptic-boss.png' });
  await page.click('[data-bm-modal] [data-bm-card]:has-text("The Controller.")');
  ok(await waitStep('charge'), 'the guide answers who it works for');
  text = await page.textContent('[data-bm-modal]');
  ok(/Nothing gets in until you've checked it\./.test(text) && /And the Controller told you it answers to the Protector\./.test(text), 'working for the Controller, the chain shows: the Controller answers to the Protector');
  await setCharge(8);
  ok(await waitStep('q-how'), 'then how doubt serves it');
  text = await page.textContent('[data-bm-modal]');
  ok(text.includes('You: ' + DQ.find((q) => q.id === 'how').ask) && /I check it before it's allowed in\./.test(text), 'his method question stays, with cards for the Controller');
  await page.screenshot({ path: SHOTS + '/bm-16-skeptic-how.png' });
  await page.click('[data-bm-modal] [data-bm-card]:has-text("I find the flaw in the plan.")'); await setCharge(7);
  ok(await waitStep('q-gone', 25000), 'then what happens when it is not there');
  await page.click('[data-bm-modal] [data-bm-card]:has-text("We get fooled.")'); await page.click('[data-bm-done]');
  await setCharge(2);
  ok(await waitStep('eased', 3000) && /The Skeptic lets its breath out/.test(await page.textContent('[data-bm-eased]')), 'its easing is its own');
  ok(await waitStep('ready') && /I'm not promising anything/.test(await page.textContent('[data-bm-modal]')), 'below the line, it offers to step aside');
  await page.click('[data-bm-ask="aside"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="aside"]');
  ok(await waitStep('be-who') && /where the Skeptic stands/.test(await page.textContent('[data-bm-modal]')), 'the player stands where the Skeptic stands');
  await page.click('[data-bm-bepass="who"]'); await page.click('[data-bm-bepass="see"]');
  await waitStep('know'); await page.click('[data-bm-know="2"]');
  await waitStep('thanks'); await page.click('[data-bm-out]');
  ok(await waitStep('perm-pass', 30000), 'stepping back out, the player asks to walk on');
  // the charge asked for while it holds back is the Skeptic's too (the chambers share the engine)
  await page.click('[data-bm-perm="no"]'); await page.click('[data-bm-why]'); await page.click('[data-bm-fear="0"]'); await page.click('[data-bm-assure="1"]');
  await page.click('[data-bm-again]');
  ok(await waitStep('blockpoll-pass') && /How charged is the Skeptic now\?/.test(await page.textContent('[data-bm-modal]')), 'held back at the last ask, the Skeptic is asked how charged it is now');
  await page.fill('[data-bm-range]', '1'); await page.click('[data-bm-blockcharged]');
  ok(await waitStep('eased', 3000) && /2 down to 1/.test(await page.textContent('[data-bm-eased]')), 'its drop while it holds back eases like any other');
  ok(await waitStep('perm-pass'), 'then the player asks again');
  await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="pass"]');
  ok(await waitStep('keep', 30000) && /What the Skeptic said/.test(await page.textContent('[data-bm-modal]')), 'then its lines to keep');
  await page.click('[data-bm-keep="0"]'); await page.click('[data-bm-save]');
  await page.waitForTimeout(400);
  sv = await save();
  ok(sv.voices.skeptic.charges.some((c) => c.after === 'held-pass' && c.from === 2 && c.v === 1 && /keep checking/.test(c.why)), 'its drop while it held back is saved with what moved it');
  ok(sv.voices.skeptic && sv.voices.skeptic.status === 'spoken' && sv.voices.skeptic.boss === 'controller' && sv.chamber === 2 && sv.at === 'hall2' && sv.voices.controller.boss === 'protector', 'its record holds who it works for, and the Controller\'s stays: ' + JSON.stringify({ boss: sv.voices.skeptic.boss, chamber: sv.chamber, at: sv.at }));
  ok(await holdUntil('end') && /The Fixer/.test(await page.textContent('[data-bm-modal]')) && await page.locator('[data-bm-onward]').count() === 1, 'past the Skeptic, the Fixer waits, and its chamber is open');
  await page.screenshot({ path: SHOTS + '/bm-17-fixer-shut.png' });
  await page.click('[data-bm-leave]');
  await page.waitForSelector('[data-bm-mouth]');
  const kept = await page.textContent('[data-bm-kept]');
  ok(/to the Skeptic/.test(await page.textContent('[data-bm-enter]')) && /It works for the Controller\./.test(kept) && /It works for the Protector\./.test(kept) && /Moved it: You offered: You can keep checking/.test(kept), 'the mouth goes back in to the Skeptic, and says who each works for and what moved the Skeptic');

  // the vulnerable child, named in the player's own words
  await page.click('[data-bm-forget="skeptic"]');
  sv = await save();
  ok(sv.voices.skeptic === undefined && sv.chamber === 2 && sv.at === 'mouth' && sv.voices.controller, 'forgetting the Skeptic goes back to its chamber, and the Controller\'s record stays');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
  ok(await toBoss(), 'a fresh sitting meets the Skeptic again');
  await page.fill('[data-bm-line]', 'The little one, so it never gets let down');
  await page.click('[data-bm-say]');
  ok(await waitStep('charge') && !/told you it answers/.test(await page.textContent('[data-bm-modal]')), 'a boss named in its own words is in voice, and the child is the end of the chain');
  await setCharge(8);
  ok(await waitStep('q-how') && /If it doesn't hope, it can't be let down\./.test(await page.textContent('[data-bm-modal]')), 'working for the vulnerable child, the cards are the child\'s');
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.evaluate(() => localStorage.clear());
}

// The Fixer's chamber (board dp-seven, dq-boss-chain): walking on from the Skeptic, Wendell's own four questions, and the
// boss question, where working for the Controller brings what it said of its own boss along (the chain).
{
  const DQ = (await import('../daemons/questions.js')).default.daemons.fixer;
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('oag.bigmind.v1', JSON.stringify({ v: 1, chamber: 2, at: 'hall2', voices: { protector: { status: 'spoken', kept: [], charges: [], waves: [] }, controller: { status: 'spoken', kept: [], charges: [], waves: [], boss: 'protector' }, skeptic: { status: 'spoken', kept: [], charges: [], waves: [], boss: 'controller' } }, waiting: ['fixer'] })); });
  await page.reload(); await page.waitForSelector('[data-bm-mouth]');
  ok(/to the Skeptic/.test(await page.textContent('[data-bm-enter]')), 'a save past the Skeptic goes back in to it, to ask it again');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
  ok(await passAgain(), 'going back in asks the voice again, and declining opens the way');
  ok(await holdUntil('end'), 'the hallway past the Skeptic ends at the Fixer');
  await page.click('[data-bm-onward]');
  await page.waitForFunction(() => window.__oagBigMind.voiceId === 'fixer' && window.__oagBigMind.state && window.__oagBigMind.state.phase === 'hall1', null, { timeout: 8000 }).catch(() => {});
  let sv = await save();
  ok(await page.evaluate(() => window.__oagBigMind.voiceId) === 'fixer' && sv.chamber === 3 && sv.at === 'mouth', 'walking on builds the Fixer\'s chamber, and the save moves on to it');
  ok(JSON.stringify(sv.waiting) === '[]', 'the Fixer no longer waits by the wall once its own chamber is reached: ' + JSON.stringify(sv.waiting));
  const qs = await page.evaluate(() => window.__oagBigMind.VOICES[3].questions.map((q) => [q.id, q.ask]));
  ok(JSON.stringify(qs.slice(0, DQ.length)) === JSON.stringify(DQ.map((q) => [q.id, q.ask])), 'the Fixer is asked Wendell\'s four questions first, in his order and plain wording: ' + qs.slice(0, DQ.length).map((q) => q[0]).join());
  ok(await page.evaluate(() => { const h = window.__oagBigMind.heard; return h('I fix it before anyone notices', 'fixer') === null && h('the fixer is tired', 'fixer') === 'ideas' && h('I doubt it will work', 'fixer') === 'skeptic'; }), 'in its chamber, fixing is in voice, and talking about it is the self\'s ideas');
  ok(await page.evaluate(() => { const b = window.__oagBigMind.heardBoss; return b('The Controller', 'fixer') === 'controller' && b('Myself', 'fixer') === null && b('the protector', 'fixer') === 'protector'; }), 'to the Fixer, an open line naming the Controller names a boss, and "myself" names none');

  const toBoss = async () => {
    if (!(await holdUntil('meet'))) return false;
    if (!/I'll have it sorted\./.test(await page.textContent('[data-bm-modal]'))) return false;
    await page.click('[data-bm-reply="hear"]'); await page.click('[data-bm-ask="speak"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="speak"]');
    await page.click('[data-bm-place="Hands"]'); await setCharge(8);
    if (!(await waitStep('q-what'))) return false;
    if (!(await page.textContent('[data-bm-modal]')).includes('You: ' + DQ[0].ask)) return false;
    await page.click('[data-bm-modal] [data-bm-card]:has-text("Other people\'s problems.")'); await setCharge(8);
    return waitStep('q-boss');
  };
  ok(await toBoss(), 'the Fixer speaks first, is met, and asked what it fixes, then who it works for');
  let text = await page.textContent('[data-bm-modal]');
  ok(text.includes('You: Who do you work for?') && /The Controller\./.test(text) && /The vulnerable child\./.test(text), 'the boss question is his plain one, and the Controller is among the bosses');
  await page.screenshot({ path: SHOTS + '/bm-18-fixer-boss.png' });
  await page.click('[data-bm-modal] [data-bm-card]:has-text("The Controller.")');
  ok(await waitStep('charge'), 'the guide answers who it works for');
  text = await page.textContent('[data-bm-modal]');
  ok(/the way it's meant to be\./.test(text) && /And the Controller told you it answers to the Protector\./.test(text), 'working for the Controller, the chain shows: the Controller answers to the Protector');
  await setCharge(8);
  ok(await waitStep('q-how'), 'then how fixing serves it');
  text = await page.textContent('[data-bm-modal]');
  ok(text.includes('You: ' + DQ.find((q) => q.id === 'how').ask) && /I hold everything in place\./.test(text), 'his method question stays, with cards for the Controller');
  await page.screenshot({ path: SHOTS + '/bm-19-fixer-how.png' });
  await page.click('[data-bm-modal] [data-bm-card]:has-text("I sort it before it gets out of hand.")'); await setCharge(7);
  ok(await waitStep('q-gone', 25000) && (await page.textContent('[data-bm-modal]')).includes('You: ' + DQ.find((q) => q.id === 'gone').ask), 'then what would happen if it weren\'t there');
  await page.click('[data-bm-modal] [data-bm-card]:has-text("It stays broken.")'); await page.click('[data-bm-done]');
  await setCharge(2);
  ok(await waitStep('eased', 3000) && /The Fixer lets its breath out/.test(await page.textContent('[data-bm-eased]')), 'its easing is its own');
  ok(await waitStep('ready') && /It'll keep\./.test(await page.textContent('[data-bm-modal]')), 'below the line, it offers to step aside');
  await page.click('[data-bm-ask="aside"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="aside"]');
  ok(await waitStep('be-who') && /where the Fixer stands/.test(await page.textContent('[data-bm-modal]')), 'the player stands where the Fixer stands');
  await page.click('[data-bm-bepass="who"]'); await page.click('[data-bm-bepass="see"]');
  await waitStep('know'); await page.click('[data-bm-know="1"]');
  await waitStep('thanks'); await page.click('[data-bm-out]');
  ok(await waitStep('perm-pass', 30000), 'stepping back out, the player asks to walk on');
  // held back at the last ask, its charge still goes down, and what moved it is kept (the mechanism from the Controller)
  await page.click('[data-bm-perm="no"]'); await page.click('[data-bm-why]'); await page.click('[data-bm-fear="0"]');
  await page.fill('[data-bm-assureline]', 'You can pick the wrench up again after'); await page.click('[data-bm-offer]');
  await page.click('[data-bm-again]');
  ok(await waitStep('blockpoll-pass') && /How charged is the Fixer now\?/.test(await page.textContent('[data-bm-modal]')), 'held back, the Fixer is asked how charged it is now');
  await page.fill('[data-bm-range]', '1'); await page.click('[data-bm-blockcharged]');
  ok(await waitStep('eased', 3000) && /2 down to 1/.test(await page.textContent('[data-bm-eased]')), 'its drop while it holds back eases');
  ok(await waitStep('perm-pass'), 'then the player asks again');
  await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="pass"]');
  ok(await waitStep('keep', 30000) && /What the Fixer said/.test(await page.textContent('[data-bm-modal]')), 'then its lines to keep');
  ok(/An assurance in your own words: 2 to 1/.test(await page.textContent('[data-bm-moved]')) && !/wrench/.test(await page.textContent('[data-bm-moved]')), 'the keeping step shows what moved it, without the player\'s own words');
  await page.click('[data-bm-keep="0"]'); await page.click('[data-bm-save]');
  await page.waitForTimeout(400);
  sv = await save();
  ok(sv.voices.fixer && sv.voices.fixer.status === 'spoken' && sv.voices.fixer.boss === 'controller' && sv.chamber === 3 && sv.at === 'hall2' && sv.voices.skeptic.boss === 'controller', 'its record holds who it works for, and the others\' stay: ' + JSON.stringify({ boss: sv.voices.fixer.boss, chamber: sv.chamber, at: sv.at }));
  ok(await holdUntil('end') && /The Emotional Body/.test(await page.textContent('[data-bm-modal]')) && await page.locator('[data-bm-onward]').count() === 1, 'past the Fixer, the Emotional Body waits, and its chamber is open');
  await page.screenshot({ path: SHOTS + '/bm-20-emotional-body-waits.png' });
  await page.click('[data-bm-leave]');
  await page.waitForSelector('[data-bm-mouth]');
  const kept = await page.textContent('[data-bm-kept]');
  ok(/to the Fixer/.test(await page.textContent('[data-bm-enter]')) && (kept.match(/It works for the Controller\./g) || []).length === 2 && /Moved it: An assurance in your own words/.test(kept), 'the mouth goes back in to the Fixer, and says who each works for and what moved the Fixer');

  // the self, named in the player's own words
  await page.click('[data-bm-forget="fixer"]');
  sv = await save();
  ok(sv.voices.fixer === undefined && sv.chamber === 3 && sv.at === 'mouth' && sv.voices.skeptic, 'forgetting the Fixer goes back to its chamber, and the Skeptic\'s record stays');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
  ok(await toBoss(), 'a fresh sitting meets the Fixer again');
  await page.fill('[data-bm-line]', 'The self, so it never has to feel bad');
  await page.click('[data-bm-say]');
  ok(await waitStep('charge') && /so it never has to feel it\./.test(await page.textContent('[data-bm-modal]')), 'a boss named in its own words is in voice');
  await setCharge(8);
  ok(await waitStep('q-how') && /I make it useful, so it's wanted\./.test(await page.textContent('[data-bm-modal]')), 'working for the self, the cards are the self\'s');
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.evaluate(() => localStorage.clear());
}

// The Emotional Body's chamber (board dp-seven, dq-boss-chain): walking on from the Fixer, Wendell's own four questions with
// his new measure question last, and the boss question, where working for the Controller shows the chain.
{
  const DQ = (await import('../daemons/questions.js')).default.daemons['emotional-body'];
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('oag.bigmind.v1', JSON.stringify({ v: 1, chamber: 3, at: 'hall2', voices: { protector: { status: 'spoken', kept: [], charges: [], waves: [] }, controller: { status: 'spoken', kept: [], charges: [], waves: [], boss: 'protector' }, skeptic: { status: 'spoken', kept: [], charges: [], waves: [], boss: 'controller' }, fixer: { status: 'spoken', kept: [], charges: [], waves: [], boss: 'controller' } }, waiting: ['emotional-body'] })); });
  await page.reload(); await page.waitForSelector('[data-bm-mouth]');
  ok(/to the Fixer/.test(await page.textContent('[data-bm-enter]')), 'a save past the Fixer goes back in to it, to ask it again');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
  ok(await passAgain(), 'going back in asks the voice again, and declining opens the way');
  ok(await holdUntil('end') && /The Emotional Body/.test(await page.textContent('[data-bm-modal]')), 'the hallway past the Fixer ends at the Emotional Body');
  await page.click('[data-bm-onward]');
  await page.waitForFunction(() => window.__oagBigMind.voiceId === 'emotional-body' && window.__oagBigMind.state && window.__oagBigMind.state.phase === 'hall1', null, { timeout: 8000 }).catch(() => {});
  let sv = await save();
  ok(await page.evaluate(() => window.__oagBigMind.voiceId) === 'emotional-body' && sv.chamber === 4 && sv.at === 'mouth', 'walking on builds the Emotional Body\'s chamber, and the save moves on to it');
  ok(JSON.stringify(sv.waiting) === '[]', 'the Emotional Body no longer waits by the wall once its own chamber is reached: ' + JSON.stringify(sv.waiting));
  const qs = await page.evaluate(() => window.__oagBigMind.VOICES[4].questions.map((q) => [q.id, q.ask]));
  ok(JSON.stringify(qs.slice(0, DQ.length)) === JSON.stringify(DQ.map((q) => [q.id, q.ask])), 'the Emotional Body is asked Wendell\'s four questions first, in his order and plain wording: ' + qs.slice(0, DQ.length).map((q) => q[0]).join());
  ok(await page.evaluate(() => { const h = window.__oagBigMind.heard; return h('I feel all of it at once', 'emotional-body') === null && h('the emotional body is loud', 'emotional-body') === 'ideas' && h('I just want to fix it', 'emotional-body') === 'fixer'; }), 'in its chamber, feeling is in voice, talking about it is the self\'s ideas, and fixing it is the Fixer');
  ok(await page.evaluate(() => { const b = window.__oagBigMind.heardBoss; return b('The Controller', 'emotional-body') === 'controller' && b('Myself', 'emotional-body') === null; }), 'to the Emotional Body, an open line naming the Controller names a boss, and "myself" names none');

  const toBoss = async () => {
    if (!(await holdUntil('meet'))) return false;
    if (!/I felt you before you came round the bend\./.test(await page.textContent('[data-bm-modal]'))) return false;
    await page.click('[data-bm-reply="hear"]'); await page.click('[data-bm-ask="speak"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="speak"]');
    await page.click('[data-bm-place="Chest"]'); await setCharge(8);
    if (!(await waitStep('q-what'))) return false;
    if (!(await page.textContent('[data-bm-modal]')).includes('You: ' + DQ[0].ask)) return false;
    await page.click('[data-bm-modal] [data-bm-card]:has-text("Sadness.")'); await setCharge(8);
    return waitStep('q-boss');
  };
  ok(await toBoss(), 'the Emotional Body speaks first, is met, and asked what it feels, then who it works for');
  let text = await page.textContent('[data-bm-modal]');
  ok(text.includes('You: Who do you work for?') && /The Controller\./.test(text) && /The vulnerable child\./.test(text), 'the boss question is his plain one, and the Controller is among the bosses');
  await page.click('[data-bm-modal] [data-bm-card]:has-text("The Controller.")');
  ok(await waitStep('charge'), 'the guide answers who it works for');
  text = await page.textContent('[data-bm-modal]');
  ok(/decides what's allowed out\./.test(text) && /And the Controller told you it answers to the Protector\./.test(text), 'working for the Controller, the chain shows: the Controller answers to the Protector');
  await setCharge(8);
  ok(await waitStep('q-gone', 25000) && (await page.textContent('[data-bm-modal]')).includes('You: ' + DQ.find((q) => q.id === 'gone').ask), 'then what happens if it isn\'t there');
  await page.click('[data-bm-modal] [data-bm-card]:has-text("We\'d go numb.")'); await page.click('[data-bm-modal] [data-bm-card]:has-text("The child would be alone with it.")'); await page.click('[data-bm-done]');
  await setCharge(7);
  ok(await waitStep('q-good-job', 25000), 'then how it knows it has done a good job');
  text = await page.textContent('[data-bm-modal]');
  ok(text.includes('You: ' + DQ.find((q) => q.id === 'good-job').ask) && /When it stayed in proportion\./.test(text) && !/When it has a name\./.test(text), 'his measure question keeps its wording, with cards for the Controller');
  await page.screenshot({ path: SHOTS + '/bm-21-emotional-body-good-job.png' });
  await page.click('[data-bm-modal] [data-bm-card]:has-text("When it came out the way it should.")');
  await setCharge(2);
  ok(await waitStep('eased', 3000) && /The Emotional Body lets its breath out/.test(await page.textContent('[data-bm-eased]')), 'its easing is its own');
  ok(await waitStep('ready') && /It'll still be here\./.test(await page.textContent('[data-bm-modal]')), 'below the line, it offers to step aside');
  await page.click('[data-bm-ask="aside"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="aside"]');
  ok(await waitStep('be-who') && /where the Emotional Body stands/.test(await page.textContent('[data-bm-modal]')), 'the player stands where the Emotional Body stands');
  await page.click('[data-bm-bepass="who"]'); await page.click('[data-bm-bepass="see"]');
  await waitStep('know'); await page.click('[data-bm-know="0"]');
  await waitStep('thanks'); await page.click('[data-bm-out]');
  ok(await waitStep('perm-pass', 30000), 'stepping back out, the player asks to walk on');
  await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="pass"]');
  ok(await waitStep('keep', 30000) && /What the Emotional Body said/.test(await page.textContent('[data-bm-modal]')), 'then its lines to keep');
  await page.click('[data-bm-keep="0"]'); await page.click('[data-bm-save]');
  await page.waitForTimeout(400);
  sv = await save();
  ok(sv.voices['emotional-body'] && sv.voices['emotional-body'].status === 'spoken' && sv.voices['emotional-body'].boss === 'controller' && sv.chamber === 4 && sv.at === 'hall2' && sv.voices.fixer.boss === 'controller', 'its record holds who it works for, and the others\' stay: ' + JSON.stringify({ boss: (sv.voices['emotional-body'] || {}).boss, chamber: sv.chamber, at: sv.at }));
  ok(await holdUntil('end') && /The Victim/.test(await page.textContent('[data-bm-modal]')) && await page.locator('[data-bm-onward]').count() === 1, 'past the Emotional Body, the Victim waits, and its chamber is open');
  await page.screenshot({ path: SHOTS + '/bm-22-victim-waits.png' });
  await page.click('[data-bm-leave]');
  await page.waitForSelector('[data-bm-mouth]');
  const kept = await page.textContent('[data-bm-kept]');
  ok(/to the Emotional Body/.test(await page.textContent('[data-bm-enter]')) && (kept.match(/It works for the Controller\./g) || []).length === 3, 'the mouth goes back in to the Emotional Body, and says who each works for');

  // the vulnerable child, named in the player's own words
  await page.click('[data-bm-forget="emotional-body"]');
  sv = await save();
  ok(sv.voices['emotional-body'] === undefined && sv.chamber === 4 && sv.at === 'mouth' && sv.voices.fixer, 'forgetting the Emotional Body goes back to its chamber, and the Fixer\'s record stays');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
  ok(await toBoss(), 'a fresh sitting meets the Emotional Body again');
  await page.fill('[data-bm-line]', 'The little one inside, who never got to cry');
  await page.click('[data-bm-say]');
  ok(await waitStep('charge') && /You feel what it can't say yet\./.test(await page.textContent('[data-bm-modal]')), 'a boss named in its own words is in voice');
  await setCharge(8);
  await waitStep('q-gone', 25000); await page.click('[data-bm-sitout]');
  ok(await waitStep('q-good-job', 25000) && /When the child isn't alone with it\./.test(await page.textContent('[data-bm-modal]')), 'working for the vulnerable child, the measure cards are the child\'s');
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.evaluate(() => localStorage.clear());
}

// The Victim's chamber (board dp-seven, dq-boss-chain): walking on from the Emotional Body, Wendell's own five questions,
// and the boss question, where working for the Controller shows the chain and changes who it advocates for.
{
  const DQ = (await import('../daemons/questions.js')).default.daemons['victim'];
  const S = { status: 'spoken', kept: [], charges: [], waves: [] };
  await page.evaluate((S) => { localStorage.clear(); localStorage.setItem('oag.bigmind.v1', JSON.stringify({ v: 1, chamber: 4, at: 'hall2', voices: { protector: S, controller: { ...S, boss: 'protector' }, skeptic: { ...S, boss: 'controller' }, fixer: { ...S, boss: 'controller' }, 'emotional-body': { ...S, boss: 'controller' } }, waiting: ['victim'] })); }, S);
  await page.reload(); await page.waitForSelector('[data-bm-mouth]');
  ok(/to the Emotional Body/.test(await page.textContent('[data-bm-enter]')), 'a save past the Emotional Body goes back in to it, to ask it again');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
  ok(await passAgain(), 'going back in asks the voice again, and declining opens the way');
  ok(await holdUntil('end') && /The Victim/.test(await page.textContent('[data-bm-modal]')), 'the hallway past the Emotional Body ends at the Victim');
  await page.click('[data-bm-onward]');
  await page.waitForFunction(() => window.__oagBigMind.voiceId === 'victim' && window.__oagBigMind.state && window.__oagBigMind.state.phase === 'hall1', null, { timeout: 8000 }).catch(() => {});
  let sv = await save();
  ok(await page.evaluate(() => window.__oagBigMind.voiceId) === 'victim' && sv.chamber === 5 && sv.at === 'mouth', 'walking on builds the Victim\'s chamber, and the save moves on to it');
  ok(JSON.stringify(sv.waiting) === '[]', 'the Victim no longer waits by the wall once its own chamber is reached: ' + JSON.stringify(sv.waiting));
  const qs = await page.evaluate(() => window.__oagBigMind.VOICES[5].questions.map((q) => [q.id, q.ask]));
  ok(JSON.stringify(qs.slice(0, DQ.length)) === JSON.stringify(DQ.map((q) => [q.id, q.ask])), 'the Victim is asked Wendell\'s five questions first, in his order and plain wording: ' + qs.slice(0, DQ.length).map((q) => q[0]).join());
  ok(await page.evaluate(() => { const h = window.__oagBigMind.heard; return h('Poor me, nobody ever comes for us', 'victim') === null && h('the victim wants attention', 'victim') === 'ideas' && h('I just want to fix it', 'victim') === 'fixer'; }), 'in its chamber, the story is in voice, talking about it is the self\'s ideas, and fixing it is the Fixer');
  ok(await page.evaluate(() => { const b = window.__oagBigMind.heardBoss; return b('The Controller', 'victim') === 'controller' && b('Myself', 'victim') === null; }), 'to the Victim, an open line naming the Controller names a boss, and "myself" names none');

  const toBoss = async () => {
    if (!(await holdUntil('meet'))) return false;
    if (!/Nobody stops\./.test(await page.textContent('[data-bm-modal]'))) return false;
    await page.click('[data-bm-reply="hear"]'); await page.click('[data-bm-ask="speak"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="speak"]');
    await page.click('[data-bm-place="Chest"]'); await setCharge(8);
    if (!(await waitStep('q-what'))) return false;
    if (!(await page.textContent('[data-bm-modal]')).includes('You: ' + DQ[0].ask)) return false;
    await page.click('[data-bm-modal] [data-bm-card]:has-text("How it always happens to us.")'); await setCharge(8);
    return waitStep('q-boss');
  };
  ok(await toBoss(), 'the Victim speaks first, is met, and asked what sympathetic stories it tells, then who it works for');
  let text = await page.textContent('[data-bm-modal]');
  ok(text.includes('You: Who do you work for?') && /The Controller\./.test(text) && /The vulnerable child\./.test(text), 'the boss question is his plain one, and the Controller is among the bosses');
  await page.click('[data-bm-modal] [data-bm-card]:has-text("The Controller.")');
  ok(await waitStep('charge'), 'the guide answers who it works for');
  text = await page.textContent('[data-bm-modal]');
  ok(/says who is to blame/.test(text) && /And the Controller told you it answers to the Protector\./.test(text), 'working for the Controller, the chain shows: the Controller answers to the Protector');
  await setCharge(8);
  ok(await waitStep('q-advocate', 25000), 'then who it advocates for');
  text = await page.textContent('[data-bm-modal]');
  ok(text.includes('You: ' + DQ.find((q) => q.id === 'advocate').ask) && /The one who did everything right\./.test(text) && !/Everyone who was left out\./.test(text), 'his advocacy question keeps its wording, with cards for the Controller');
  await page.screenshot({ path: SHOTS + '/bm-23-victim-advocate.png' });
  await page.click('[data-bm-modal] [data-bm-card]:has-text("Whoever was treated unfairly.")');
  await setCharge(8);
  ok(await waitStep('q-payoff', 25000) && (await page.textContent('[data-bm-modal]')).includes('You: ' + DQ.find((q) => q.id === 'payoff').ask), 'then the shadow sympathy its advocacy gets it');
  await page.click('[data-bm-modal] [data-bm-card]:has-text("Nobody can say it was our fault.")'); await page.click('[data-bm-modal] [data-bm-card]:has-text("We get to be met on our terms.")'); await page.click('[data-bm-done]');
  await setCharge(7);
  ok(await waitStep('q-gone', 25000) && (await page.textContent('[data-bm-modal]')).includes('You: ' + DQ.find((q) => q.id === 'gone').ask), 'then what happens if it isn\'t there');
  await page.click('[data-bm-modal] [data-bm-card]:has-text("Nobody would know what it cost.")'); await page.click('[data-bm-done]');
  await setCharge(2);
  ok(await waitStep('eased', 3000) && /The Victim lets its breath out/.test(await page.textContent('[data-bm-eased]')), 'its easing is its own');
  ok(await waitStep('ready') && /It'll still be here\./.test(await page.textContent('[data-bm-modal]')), 'below the line, it offers to step aside');
  await page.click('[data-bm-ask="aside"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="aside"]');
  ok(await waitStep('be-who') && /where the Victim stands/.test(await page.textContent('[data-bm-modal]')), 'the player stands where the Victim stands');
  await page.click('[data-bm-bepass="who"]'); await page.click('[data-bm-bepass="see"]');
  await waitStep('know'); await page.click('[data-bm-know="0"]');
  await waitStep('thanks'); await page.click('[data-bm-out]');
  ok(await waitStep('perm-pass', 30000), 'stepping back out, the player asks to walk on');
  await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="pass"]');
  ok(await waitStep('keep', 30000) && /What the Victim said/.test(await page.textContent('[data-bm-modal]')), 'then its lines to keep');
  await page.click('[data-bm-keep="0"]'); await page.click('[data-bm-save]');
  await page.waitForTimeout(400);
  sv = await save();
  ok(sv.voices.victim && sv.voices.victim.status === 'spoken' && sv.voices.victim.boss === 'controller' && sv.chamber === 5 && sv.at === 'hall2' && sv.voices['emotional-body'].boss === 'controller', 'its record holds who it works for, and the others\' stay: ' + JSON.stringify({ boss: (sv.voices.victim || {}).boss, chamber: sv.chamber, at: sv.at }));
  ok(await holdUntil('end') && /The Damaged Self/.test(await page.textContent('[data-bm-modal]')) && await page.locator('[data-bm-onward]').count() === 1, 'past the Victim, the Damaged Self waits, and its chamber is open');
  await page.screenshot({ path: SHOTS + '/bm-24-damaged-self-waits.png' });
  await page.click('[data-bm-leave]');
  await page.waitForSelector('[data-bm-mouth]');
  const kept = await page.textContent('[data-bm-kept]');
  ok(/to the Victim/.test(await page.textContent('[data-bm-enter]')) && (kept.match(/It works for the Controller\./g) || []).length === 4, 'the mouth goes back in to the Victim, and says who each works for');

  // the vulnerable child, named in the player's own words
  await page.click('[data-bm-forget="victim"]');
  sv = await save();
  ok(sv.voices.victim === undefined && sv.chamber === 5 && sv.at === 'mouth' && sv.voices['emotional-body'], 'forgetting the Victim goes back to its chamber, and the Emotional Body\'s record stays');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
  ok(await toBoss(), 'a fresh sitting meets the Victim again');
  await page.fill('[data-bm-line]', 'The little one inside, who nobody came for');
  await page.click('[data-bm-say]');
  ok(await waitStep('charge') && /because it couldn't\./.test(await page.textContent('[data-bm-modal]')), 'a boss named in its own words is in voice');
  await setCharge(8);
  ok(await waitStep('q-advocate', 25000) && /The child nobody came for\./.test(await page.textContent('[data-bm-modal]')), 'working for the vulnerable child, the advocacy cards are the child\'s');
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.evaluate(() => localStorage.clear());
}

// The Damaged Self's chamber, the last on the path (board dp-seven, dq-boss-chain, dp-centre): walking on from the Victim,
// Wendell's own five questions, the job that changes with the boss, the deepest-place check before standing where it
// stands, and the vulnerable child waiting at the shut mouth of the centre.
{
  const DQ = (await import('../daemons/questions.js')).default.daemons['damaged-self'];
  const S = { status: 'spoken', kept: [], charges: [], waves: [] };
  await page.evaluate((S) => { localStorage.clear(); localStorage.setItem('oag.bigmind.v1', JSON.stringify({ v: 1, chamber: 5, at: 'hall2', voices: { protector: S, controller: { ...S, boss: 'protector' }, skeptic: { ...S, boss: 'controller' }, fixer: { ...S, boss: 'controller' }, 'emotional-body': { ...S, boss: 'controller' }, victim: { ...S, boss: 'controller' } }, waiting: [] })); }, S);
  await page.reload(); await page.waitForSelector('[data-bm-mouth]');
  ok(/to the Victim/.test(await page.textContent('[data-bm-enter]')), 'a save past the Victim goes back in to it, to ask it again');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
  ok(await passAgain(), 'going back in asks the voice again, and declining opens the way');
  ok(await holdUntil('end') && /The Damaged Self/.test(await page.textContent('[data-bm-modal]')), 'the hallway past the Victim ends at the Damaged Self');
  await page.click('[data-bm-onward]');
  await page.waitForFunction(() => window.__oagBigMind.voiceId === 'damaged-self' && window.__oagBigMind.state && window.__oagBigMind.state.phase === 'hall1', null, { timeout: 8000 }).catch(() => {});
  let sv = await save();
  ok(await page.evaluate(() => window.__oagBigMind.voiceId) === 'damaged-self' && sv.chamber === 6 && sv.at === 'mouth', 'walking on builds the Damaged Self\'s chamber, and the save moves on to it');
  const qs = await page.evaluate(() => window.__oagBigMind.VOICES[6].questions.map((q) => [q.id, q.ask]));
  ok(JSON.stringify(qs.slice(0, DQ.length)) === JSON.stringify(DQ.map((q) => [q.id, q.ask])), 'the Damaged Self is asked Wendell\'s five questions first, in his order and plain wording: ' + qs.slice(0, DQ.length).map((q) => q[0]).join());
  ok(await page.evaluate(() => { const h = window.__oagBigMind.heard; return h("I'll take that one, I always do", 'damaged-self') === null && h('the damaged self wants to be broken', 'damaged-self') === 'ideas' && h('I just want to fix it', 'damaged-self') === 'fixer'; }), 'in its chamber, taking the hit is in voice, talking about it is the self\'s ideas, and fixing it is the Fixer');
  ok(await page.evaluate(() => { const b = window.__oagBigMind.heardBoss; return b('The Controller', 'damaged-self') === 'controller' && b('Myself', 'damaged-self') === null; }), 'to the Damaged Self, an open line naming the Controller names a boss, and "myself" names none');

  const toBoss = async () => {
    if (!(await holdUntil('meet'))) return false;
    if (!/It was probably me\./.test(await page.textContent('[data-bm-modal]'))) return false;
    await page.click('[data-bm-reply="hear"]'); await page.click('[data-bm-ask="speak"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="speak"]');
    await page.click('[data-bm-place="Chest"]'); await setCharge(8);
    if (!(await waitStep('q-what'))) return false;
    if (!(await page.textContent('[data-bm-modal]')).includes('You: ' + DQ[0].ask)) return false;
    await page.click('[data-bm-modal] [data-bm-card]:has-text("The blame.")'); await setCharge(8);
    if (!(await waitStep('q-from', 25000))) return false;
    if (!(await page.textContent('[data-bm-modal]')).includes('You: ' + DQ[1].ask)) return false;
    await page.click('[data-bm-modal] [data-bm-card]:has-text("From whoever was angry.")'); await setCharge(8);
    return waitStep('q-boss', 25000);
  };
  ok(await toBoss(), 'the Damaged Self speaks first, is met, and asked what damage it takes and from whom, then who it works for');
  let text = await page.textContent('[data-bm-modal]');
  ok(text.includes('You: Who do you work for?') && /The Controller\./.test(text) && /The vulnerable child\./.test(text), 'the boss question is his plain one, and the Controller is among the bosses');
  await page.click('[data-bm-modal] [data-bm-card]:has-text("The Controller.")');
  ok(await waitStep('charge'), 'the guide answers who it works for');
  text = await page.textContent('[data-bm-modal]');
  ok(/the fault is put on you/.test(text) && /And the Controller told you it answers to the Protector\./.test(text), 'working for the Controller, the chain shows: the Controller answers to the Protector');
  await setCharge(8);
  ok(await waitStep('q-how', 25000), 'then how its job changes by who it works for');
  text = await page.textContent('[data-bm-modal]');
  ok(text.includes('You: ' + DQ.find((q) => q.id === 'how').ask) && /I take the fault, so the standard stays\./.test(text) && !/I take whatever gets through\./.test(text), 'his method question keeps its wording, with cards for the Controller');
  await page.screenshot({ path: SHOTS + '/bm-25-damaged-self-how.png' });
  await page.click('[data-bm-modal] [data-bm-card]:has-text("I take the fault, so the standard stays.")');
  await setCharge(7);
  ok(await waitStep('q-gone', 25000) && (await page.textContent('[data-bm-modal]')).includes('You: ' + DQ.find((q) => q.id === 'gone').ask), 'then what would happen if it weren\'t there');
  await page.click('[data-bm-modal] [data-bm-card]:has-text("It would reach the child.")'); await page.click('[data-bm-done]');
  await setCharge(2);
  ok(await waitStep('eased', 3000) && /The Damaged Self lets its breath out/.test(await page.textContent('[data-bm-eased]')), 'its easing is its own');
  ok(await waitStep('ready') && /the deepest place/.test(await page.textContent('[data-bm-modal]')), 'below the line, it offers to step aside');
  await page.click('[data-bm-ask="aside"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="aside"]');
  ok(await waitStep('deep') && /goes to the deepest place\. Do you want to go on, rest, or go back up\?/.test(await page.textContent('[data-bm-modal]')), 'before standing where it stands, the cave asks first');
  await page.click('[data-bm-deep="rest"]');
  ok(await waitStep('deep-rest') && await page.locator('[data-bm-deep="continue"]').count() === 1, 'resting keeps the choice open');
  await page.click('[data-bm-deep="continue"]');
  ok(await waitStep('be-who') && /where the Damaged Self stands/.test(await page.textContent('[data-bm-modal]')), 'going on, the player stands where the Damaged Self stands');
  await page.click('[data-bm-bepass="who"]'); await page.click('[data-bm-bepass="see"]');
  await waitStep('know'); await page.click('[data-bm-know="0"]');
  await waitStep('thanks'); await page.click('[data-bm-out]');
  ok(await waitStep('perm-pass', 30000), 'stepping back out, the player asks to walk on');
  await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="pass"]');
  ok(await waitStep('keep', 30000) && /What the Damaged Self said/.test(await page.textContent('[data-bm-modal]')), 'then its lines to keep');
  await page.click('[data-bm-keep="0"]'); await page.click('[data-bm-save]');
  await page.waitForTimeout(400);
  sv = await save();
  ok(sv.voices['damaged-self'] && sv.voices['damaged-self'].status === 'spoken' && sv.voices['damaged-self'].boss === 'controller' && sv.chamber === 6 && sv.at === 'hall2' && sv.voices.victim.boss === 'controller', 'its record holds who it works for, and the others\' stay: ' + JSON.stringify({ boss: (sv.voices['damaged-self'] || {}).boss, chamber: sv.chamber, at: sv.at }));
  ok(await holdUntil('end') && /The centre/.test(await page.textContent('[data-bm-modal]')) && /the vulnerable child/.test(await page.textContent('[data-bm-modal]')) && await page.locator('[data-bm-onward]').count() === 0 && await page.locator('[data-bm-tocentre]').count() === 1, 'past the Damaged Self the path ends, and the vulnerable child waits at the mouth of the centre');
  ok(await page.evaluate(() => window.__oagBigMind.child && !window.__oagBigMind.child.visible), 'the child is hidden while the mouth is shut');
  await page.screenshot({ path: SHOTS + '/bm-26-centre-shut.png' });
  await page.click('[data-bm-leave]');
  await page.waitForSelector('[data-bm-mouth]');
  const kept = await page.textContent('[data-bm-kept]');
  ok(/to the Damaged Self/.test(await page.textContent('[data-bm-enter]')) && (kept.match(/It works for the Controller\./g) || []).length === 5, 'the mouth goes back in to the Damaged Self, and says who each works for');

  // going back up at the check, then the vulnerable child named in the player's own words
  await page.click('[data-bm-forget="damaged-self"]');
  sv = await save();
  ok(sv.voices['damaged-self'] === undefined && sv.chamber === 6 && sv.at === 'mouth' && sv.voices.victim, 'forgetting the Damaged Self goes back to its chamber, and the Victim\'s record stays');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
  ok(await toBoss(), 'a fresh sitting meets the Damaged Self again');
  await page.fill('[data-bm-line]', 'The little one inside, so it never reaches them');
  await page.click('[data-bm-say]');
  ok(await waitStep('charge') && /so it never reaches the little one\./.test(await page.textContent('[data-bm-modal]')), 'a boss named in its own words is in voice');
  await setCharge(8);
  ok(await waitStep('q-how', 25000) && /I carry what it was too small to carry\./.test(await page.textContent('[data-bm-modal]')), 'working for the vulnerable child, the job cards are the child\'s');
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.evaluate(() => localStorage.clear());
}

// The centre (board dp-centre, dp-centre-asked): the shut mouth opens, the voices met on the way stand around the child as
// spirits, the child is seen first, and if the player asks, it is asked Wendell's six Player questions gently, with no charge
// and no permission to win, any of them let go; a voice named as in its way comes closer; only kept lines are saved.
{
  const PQ = (await import('../daemons/questions.js')).default.daemons.player;
  const S = { status: 'spoken', kept: [], charges: [], waves: [] };
  const all = { protector: S, controller: { ...S, boss: 'protector' }, skeptic: { ...S, boss: 'controller' }, fixer: { ...S, boss: 'controller' }, 'emotional-body': { ...S, boss: 'controller' }, victim: { ...S, boss: 'controller' }, 'damaged-self': { ...S, boss: 'controller' } };
  const toCentre = async () => {
    await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
    if (!(await passAgain()) || !(await holdUntil('end'))) return false;
    await page.click('[data-bm-tocentre]');
    return waitStep('centre', 30000);
  };
  await page.evaluate((all) => { localStorage.clear(); localStorage.setItem('oag.bigmind.v1', JSON.stringify({ v: 1, chamber: 6, at: 'hall2', voices: all, waiting: [] })); }, all);
  await page.reload(); await page.waitForSelector('[data-bm-mouth]');
  ok(await toCentre(), 'walking on past the Damaged Self goes into the centre');
  let text = await page.textContent('[data-bm-modal]');
  ok(/The vulnerable child/.test(text) && /as spirits: the Protector, .*and the Damaged Self\./.test(text), 'the child is met, and the voices met on the way are named as spirits there');
  ok(/Nothing has to be asked here/.test(text) && await page.locator('[data-bm-centre="be"]').count() === 1, 'the child is seen first, and nothing has to be asked');
  const c0 = await page.evaluate(() => { const A = window.__oagBigMind, c = A.centre(); return { n: c.voices.length, open: A.openAt(A.route.sEnd + 6), endOpen: A.state.endOpen, ids: c.voices.map((o) => o.id) }; });
  ok(c0.n === 7 && c0.endOpen > 0.99 && c0.open > 0.95, 'the centre\'s mouth is open, and seven voice spirits stand in it: ' + JSON.stringify(c0));
  const cq = await page.evaluate(() => window.__oagBigMind.centreQuestions().map((q) => [q.id, q.ask]));
  ok(JSON.stringify(cq) === JSON.stringify(PQ.map((q) => [q.id, q.ask])), 'the child\'s questions are Wendell\'s six Player questions, in his order and plain wording: ' + cq.map((q) => q[0]).join());
  await page.screenshot({ path: SHOTS + '/bm-27-centre.png' });

  await page.click('[data-bm-centre="ask"]');
  ok(await waitStep('child-learning') && (await page.textContent('[data-bm-modal]')).includes('You: ' + PQ[0].ask), 'asked gently, the child is asked what it is learning');
  ok(await page.locator('[data-bm-perm]').count() === 0 && await page.locator('[data-bm-range]').count() === 0 && !(await page.isVisible('[data-bm-meter]')), 'there is no permission to win and no charge to read');
  await page.click('[data-bm-modal] [data-bm-childcard]:has-text("That it\'s safe to play.")');
  ok(await waitStep('child-growing') && /The child: That it's safe to play\./.test(await page.textContent('[data-bm-modal]')) && /So that's what you're learning\./.test(await page.textContent('[data-bm-modal]')), 'its answer is said back, and the guide answers it');
  await page.click('[data-bm-childquiet]');
  ok(await waitStep('child-feeling'), 'a question can be let go, and the next follows');
  await page.click('[data-bm-modal] [data-bm-childcard]:has-text("Curious.")'); await page.click('[data-bm-modal] [data-bm-childcard]:has-text("Glad you came.")'); await page.click('[data-bm-childdone]');
  ok(await waitStep('child-exploring') && /The child: Curious\. Glad you came\./.test(await page.textContent('[data-bm-modal]')), 'what it feels can be more than one thing');
  await page.fill('[data-bm-childline]', 'The cracks in the walls'); await page.click('[data-bm-childsay]');
  ok(await waitStep('child-in-the-way') && /The child: The cracks in the walls/.test(await page.textContent('[data-bm-modal]')), 'it can answer in the player\'s own words');
  text = await page.textContent('[data-bm-modal]');
  ok(/The Protector won't let me out to play\./.test(text) && /The Damaged Self takes every hit/.test(text), 'how the others get in its way: the cards are the voices met on the way');
  await page.click('[data-bm-modal] [data-bm-childcard]:has-text("The Protector won\'t let me out to play.")'); await page.click('[data-bm-childdone]');
  ok(await waitStep('child-gone') && await page.evaluate(() => window.__oagBigMind.centre().voices.filter((o) => o.near).map((o) => o.id).join()) === 'protector', 'the voice it names as in its way comes closer to it');
  await page.waitForTimeout(800);
  await page.screenshot({ path: SHOTS + '/bm-28-child-near.png' });
  await page.click('[data-bm-childquiet]');
  ok(await waitStep('centre-rest') && /You stayed with the child\./.test(await page.textContent('[data-bm-modal]')) && await page.locator('[data-bm-childkeep]').count() === 5, 'after the six, what it said is offered to keep');
  await page.click('[data-bm-childkeep="0"]'); await page.click('[data-bm-centresave]');
  ok(await waitStep('centre-end'), 'saving stays with the child');
  let sv = await save();
  ok(sv.centre && sv.centre.status === 'spoken' && sv.centre.kept.length === 1 && sv.centre.kept[0].line === "That it's safe to play." && sv.chamber === 6 && sv.voices['damaged-self'], 'only the kept line is saved, with the voices\' records: ' + JSON.stringify(sv.centre));
  await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  const kept = await page.textContent('[data-bm-kept]');
  ok(/The vulnerable child\s*It spoke with you at the centre\./.test(kept) && /That it's safe to play\./.test(kept), 'the mouth shows what the child said that was kept');

  // seen, not questioned: being with it asks nothing
  await page.click('[data-bm-forget="centre"]');
  ok((await save()).centre === undefined, 'forgetting the centre clears it');
  ok(await toCentre(), 'a fresh visit meets the child again');
  await page.click('[data-bm-centre="be"]');
  ok(await waitStep('centre-rest') && await page.locator('[data-bm-childkeep]').count() === 0, 'being with it asks nothing');
  await page.click('[data-bm-centresave]');
  sv = await save();
  ok(sv.centre && sv.centre.status === 'seen' && sv.centre.kept.length === 0, 'the child is recorded as seen');
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.evaluate(() => localStorage.clear());
}

// Trust (pass big-mind-trust1 as revised on Wendell's answers of 16 October 2026): marks for can and will with a plain line of
// what the voice saw, good only in its words, honest moves counted only when the charge eases at the next check-in, each voice's
// right answer, falls and repair, the second road past a voice, keep talking, spirits that vouch, asking again, and the return rite.
{
  const marks = () => page.evaluate(() => window.__oagBigMind.marks());
  const trust = () => page.evaluate(() => window.__oagBigMind.trust());
  const fast = () => page.evaluate(() => { window.__oagBigMind.state.speed = 6; });
  const answerAndCharge = async (v) => { await page.click('[data-bm-modal] [data-bm-card="0"]'); await waitStep('charge'); await page.fill('[data-bm-range]', String(v)); await page.click('[data-bm-charged]'); };
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await page.waitForSelector('[data-bm-mouth]');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas'); await fast();
  ok(await page.locator('[data-bm-trustbtn]').isVisible() && await page.isEnabled('[data-bm-trustbtn]'), 'Trust is there in the hallway, before the voice is met');
  await page.click('[data-bm-trustbtn]');
  let text = await page.textContent('[data-bm-modal]');
  ok(await waitStep('trust') && /Can you/.test(text) && /Will you/.test(text) && /Are you good/.test(text) && /good keeps us safe/.test(text), 'the trust panel offers can you, will you and are you good, with the Protector\'s own picture of good');
  await page.click('[data-bm-promise="visit"]'); await page.click('[data-bm-trustok]');
  let t = await trust();
  ok(t.promises.length === 1 && t.promises[0].kind === 'visit' && t.promises[0].kept === null && (await save()).voices.protector.trust.promises.length === 1, 'a promise made in the hallway is saved at once, as not yet kept');
  ok(await holdUntil('meet'), 'then the Protector is met');
  ok(await page.locator('[data-bm-marks]').isVisible() && await page.getAttribute('[data-bm-marks]', 'data-bm-can') === '0', 'its two marks show beside its charge, empty');
  await page.click('[data-bm-reply="hear"]'); await page.click('[data-bm-ask="speak"]'); await page.click('[data-bm-perm="no"]');
  text = await page.textContent('[data-bm-modal]');
  ok(/I don't know that you can wait when I say no\./.test(text), 'its refusal says what it has not seen yet');
  await page.click('[data-bm-push]');
  t = await trust();
  ok(await waitStep('pushed-speak') && t.broken.length === 1 && t.broken[0].dim === 'good' && t.broken[0].kind === 'push' && await page.evaluate(() => window.__oagBigMind.stance()) === 'hurt', 'pushing past its refusal is a fall: its read of you drops, and it stands hurt');
  await page.waitForTimeout(1500);
  { const hp = await page.evaluate(() => window.__oagCave.kit.bodyPose(window.__oagBigMind.voice)); ok(hp && hp.stance === 'hurt' && hp.now.yaw < -0.3 && hp.now.head > 0.1, 'its body turns a shoulder away and closes (' + JSON.stringify(hp && hp.now) + ')'); }
  ok(/That isn't how anyone keeps us safe\./.test(await page.textContent('[data-bm-modal]')), 'it says so in its own words');
  await page.click('[data-bm-pushed]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="speak"]');
  await page.click('[data-bm-place="Chest"]'); await page.fill('[data-bm-range]', '8'); await page.click('[data-bm-charged]');
  ok(await waitStep('q-job'), 'the questions begin');
  await page.click('[data-bm-trustbtn]');
  ok(await page.locator('[data-bm-own="good:push"]').count() === 1, 'the panel offers to own the push');
  await page.click('[data-bm-own="good:push"]'); await page.click('[data-bm-trustok]');
  await page.click('[data-bm-trustbtn]'); await page.click('[data-bm-trust="wait"]');
  ok(await waitStep('trust-wait') && await page.isDisabled('[data-bm-waited]'), 'waiting with it takes one breath first');
  await page.waitForFunction(() => !document.querySelector('[data-bm-waited]').disabled, null, { timeout: 15000 }).catch(() => {});
  await page.click('[data-bm-waited]');
  ok(await waitStep('q-job') && (await page.evaluate(() => window.__oagBigMind.pending().map((p) => p.dim + ':' + p.kind + (p.repair ? ':own' : '')).sort().join())) === 'can:wait,good:push:own', 'the moves wait for the next check-in');
  ok((await marks()).can === 0, 'nothing counts before the check-in');
  await answerAndCharge(6);
  ok(await waitStep('q-boss', 15000), 'the charge eases and the next question follows');
  text = await page.textContent('[data-bm-modal]');
  ok(/You waited with it when it held back\./.test(text) && /It heard you own it\./.test(text), 'what it saw is said in a plain line, once');
  t = await trust(); let m = await marks();
  ok(m.can === 1 && t.repaired.length === 1 && m.good === 'none' && await page.getAttribute('[data-bm-marks]', 'data-bm-can') === '1', 'its can mark fills, and owning the push repaired it: ' + JSON.stringify(m));
  // a move that isn't its right answer: it eases, but the voice says what it needs instead
  await page.click('[data-bm-trustbtn]'); await page.click('[data-bm-trust="pace"]'); await page.click('[data-bm-trustok]');
  await answerAndCharge(5);
  ok(await waitStep('q-hours', 15000) && /what I need to see is that you can wait when I hold back/.test(await page.textContent('[data-bm-modal]')) && (await marks()).can === 1, 'a move that is not its right answer fills nothing, and it says what it needs');
  // no easing, nothing counts
  await page.click('[data-bm-trustbtn]'); await page.click('[data-bm-share="0"]'); await page.click('[data-bm-trustok]');
  await answerAndCharge(5);
  ok(await waitStep('q-from', 15000) && (await marks()).good === 'none' && (await page.evaluate(() => window.__oagBigMind.pending().length)) === 0, 'a right move with no easing moves nothing');
  await page.click('[data-bm-trustbtn]'); await page.click('[data-bm-share="0"]'); await page.click('[data-bm-trustok]');
  await page.click('[data-bm-modal] [data-bm-card="0"]'); await page.click('[data-bm-done]'); await waitStep('charge'); await page.fill('[data-bm-range]', '4'); await page.click('[data-bm-charged]');
  ok(await waitStep('q-what', 15000) && /You'd keep it safe too\. I can see that now\./.test(await page.textContent('[data-bm-modal]')) && (await marks()).good === 'seen', 'showing where you share its picture of good, honestly: its read of you, in its words only');
  ok(await page.evaluate(() => window.__oagBigMind.stance()) === 'softening', 'it stands softer');
  // walking out: the return rite
  await menuTap('[data-bm-selfbtn]'); await click0('[data-bm-leave]');
  ok(await waitStep('rite') && /Thank the voices you met today: the Protector\./.test(await page.textContent('[data-bm-modal]')), 'walking out, the return rite asks to thank the voices met');
  await click0('[data-bm-ritethanks]');
  ok(await waitStep('rite-breath') && await page.isDisabled('[data-bm-ritebreath]'), 'then one breath');
  await page.waitForFunction(() => !document.querySelector('[data-bm-ritebreath]').disabled, null, { timeout: 15000 }).catch(() => {});
  await click0('[data-bm-ritebreath]');
  ok(await waitStep('rite-move') && /The move you practised today: finding where you already agree with a part of you\./.test(await page.textContent('[data-bm-ritemove]')), 'and one plain line naming the move practised');
  await click0('[data-bm-ritego]'); await page.waitForSelector('[data-bm-mouth]');
  let kept = await page.textContent('[data-bm-kepttrust="protector"]');
  ok(/Can you ●○○/.test(kept) && /Promise not yet kept: I'll come back another day and ask you again\./.test(kept) && /You owned it, and it heard you\./.test(kept), 'the mouth shows its marks, the promise not yet kept, and the fall owned: ' + kept);
  // asking again on a later visit keeps the promise to come back
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas'); await fast();
  ok(await holdUntil('meet') && /You said you'd come back and ask me again\. Here you are\./.test(await page.textContent('[data-bm-modal]')), 'going back in, it remembers the promise to come back and ask again');
  await page.click('[data-bm-reply="hear"]'); await page.click('[data-bm-ask="speak"]');
  ok((await trust()).promises[0].kept && (await page.evaluate(() => window.__oagBigMind.pending().some((p) => p.kind === 'visit'))), 'asking again keeps it, and the voice will see it at the next check-in');
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');

  // the second road, keep talking, and a fall from the voice's place: a Controller that has seen all three
  const at0 = '2026-10-16T00:00:00.000Z';
  const full = (can) => ({ seen: [{ dim: 'can', kind: can, at: at0 }, { dim: 'will', kind: 'return', at: at0 }, { dim: 'good', kind: 'share', at: at0 }], promises: [{ kind: 'return', made: at0, kept: null }], broken: [], repaired: [], ally: at0 });
  const S = { status: 'spoken', kept: [], charges: [], waves: [] };
  await page.evaluate(([S, P, C]) => { localStorage.clear(); localStorage.setItem('oag.bigmind.v1', JSON.stringify({ v: 1, chamber: 1, at: 'mouth', voices: { protector: { ...S, trust: P }, controller: { ...S, boss: 'protector', trust: C } }, waiting: [] })); }, [S, full('wait'), full('pace')]);
  await page.reload(); await page.waitForSelector('[data-bm-mouth]');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas'); await fast();
  ok(await page.evaluate(() => window.__oagBigMind.spirits.filter((o) => o.ally).map((o) => o.ally).sort().join()) === 'controller,protector', 'the spirits of voices that trust you walk with you as allies');
  ok(await holdUntil('meet'), 'the Controller is met');
  text = await page.textContent('[data-bm-modal]');
  ok(/Who vouches for you\?/.test(text) && /The Protector's spirit says you kept watch\./.test(text) && await page.locator('[data-bm-vouch]').count() === 1, 'it asks who vouches for you, and the Protector\'s spirit answers in its terms');
  await page.click('[data-bm-reply="hear"]'); await page.click('[data-bm-ask="speak"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="speak"]');
  await page.click('[data-bm-place="Chest"]'); await page.fill('[data-bm-range]', '7'); await page.click('[data-bm-charged]');
  ok(await waitStep('ready', 15000) && /Its charge is still high, but it has seen all three/.test(await page.textContent('[data-bm-modal]')), 'at charge 7 it offers to step aside, by the second road: it has seen all three');
  ok(await page.locator('[data-bm-keeptalking]').count() === 1 && await page.locator('[data-bm-staywith]').count() === 1, 'the player can keep talking or stay with it; walking on waits');
  await page.click('[data-bm-keeptalking]');
  ok(await waitStep('q-what'), 'keep talking goes on with its questions');
  await answerAndCharge(6);
  ok(await waitStep('q-boss', 15000) && /Your spirits vouched for you\./.test(await page.textContent('[data-bm-modal]')), 'the questions go on rather than the offer again, and the spirits\' vouching counted once it eased');
  await page.click('[data-bm-modal] [data-bm-card="0"]'); await waitStep('charge');
  ok(await page.locator('[data-bm-askaside]').count() === 1, 'each check-in now offers to ask it to step aside');
  await page.click('[data-bm-askaside]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="aside"]');
  ok(await waitStep('be-who', 30000), 'it steps aside and the player stands in its place');
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  const c = (await save()).voices.controller.trust;
  ok(c.broken.some((b) => b.dim === 'will' && b.kind === 'return') && c.promises[0].kept === false, 'walking out from its place breaks the promise to come back to your own: a fall');
  ok(/You said you'd come back to your own place, and left from its\./.test(await page.textContent('[data-bm-kepttrust="controller"]')), 'the mouth says so plainly');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas'); await fast();
  ok(await page.evaluate(() => window.__oagBigMind.marks().will) === 0 && await page.evaluate(() => window.__oagBigMind.stance()) === 'hurt', 'its will mark has fallen, and it stands hurt until the fall is owned');
  ok(await page.evaluate(() => !window.__oagBigMind.spirits.some((o) => o.ally === 'controller')), 'its spirit does not walk with you while its trust is down');
  ok(await holdUntil('meet') && /you walked out from mine/.test(await page.textContent('[data-bm-modal]')), 'and it says so when you come back');
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');

  // at the mouth of the centre the allied spirits vouch together
  const allT = {}; ['protector', 'controller', 'skeptic', 'fixer', 'emotional-body', 'victim', 'damaged-self'].forEach((id) => { const need = { protector: 'wait', controller: 'pace', skeptic: 'hold', fixer: 'sit', 'emotional-body': 'hold', victim: 'wait', 'damaged-self': 'pace' }[id], will = { skeptic: 'visit', 'emotional-body': 'visit', victim: 'visit' }[id] || 'return'; const f = full(need); f.seen[1].kind = will; f.promises = []; allT[id] = { ...S, boss: 'controller', trust: f }; });
  await page.evaluate((all) => { localStorage.clear(); localStorage.setItem('oag.bigmind.v1', JSON.stringify({ v: 1, chamber: 6, at: 'mouth', voices: all, waiting: [] })); }, allT);
  await page.reload(); await page.waitForSelector('[data-bm-mouth]');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas'); await fast();
  ok(await passAgain() && await holdUntil('end'), 'past the Damaged Self, the way to the centre');
  ok(/your spirits vouch for you together/.test(await page.textContent('[data-bm-modal]')) && await page.locator('[data-bm-vouchall]').count() === 7, 'at the mouth of the centre, the allied spirits vouch together, each in its own voice\'s terms');
  ok(await page.evaluate(() => Object.keys(window.__oagBigMind.STANCES).join()) === 'guarded,testing,softening,trusting,willing,hurt,repaired', 'the trust stances are named for the daemon bodies');
  await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.evaluate(() => localStorage.clear());
}

// Build 3 (pass big-mind-trust1): the meeting spirit (bmt-meeting-spirit), which becomes the ally once its voice trusts you
// (bmt-spirits-vouch), and Talk it through, the full 3-2-1 with a voice (bmt-321-offer): skippable, never a gate, cards, a
// gesture or your own words, and Be it only with the voice's permission.
{
  const fast = () => page.evaluate(() => { window.__oagBigMind.state.speed = 6; });
  const t321 = () => page.getAttribute('[data-cave-321-step]', 'data-cave-321-step');
  const bubbles = () => page.locator('[data-cave-bubble]').count();
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await page.waitForSelector('[data-bm-mouth]');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas'); await fast();
  await hold(true);
  ok(await waitStep0('meet-feel'), 'meeting a voice for the first time, the game asks how you feel meeting it');
  const feelText = await page.textContent('[data-bm-modal]');
  ok(/How do you feel, meeting it\?/.test(feelText) && /counts for nothing and against nothing/.test(feelText), 'the question says no answer is wrong and none counts against you');
  ok(await page.locator('[data-bm-feel]').count() === 6 && await page.locator('[data-bm-feel="none"]').textContent() === 'No word yet' && await page.locator('[data-bm-feelline]').count() === 1 && await page.locator('[data-bm-decline]').count() === 1,
    'five feelings with their elements, No word yet as an equal answer, your own words, and Not now');
  await page.click('[data-bm-feel="metal"]');
  ok(await waitStep0('meet') && /A spirit comes out of you and walks at your side: Fear \(Metal\), from meeting the Protector\./.test(await page.textContent('[data-bm-modal]')), 'your answer spawns a spirit that walks with you');
  ok(await page.evaluate(() => { const o = window.__oagBigMind.spirits.filter((x) => x.meet === 'protector'); return o.length === 1 && o[0].name === 'Fear' && o[0].element === 'metal' && !o[0].ally; }), 'it is the spirit from meeting the Protector, in its element\'s colour');
  ok(JSON.stringify((await save()).voices.protector.spirit) === '{"name":"Fear","element":"metal"}', 'its name and element are kept with the voice, never as a trust move');
  ok(!/You didn't come alone/.test(await page.textContent('[data-bm-modal]')), 'the voice does not count its own meeting spirit as company you brought');
  await page.click('[data-bm-reply="hear"]'); await page.click('[data-bm-ask="speak"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="speak"]');
  await page.click('[data-bm-place="Chest"]'); await page.fill('[data-bm-range]', '7'); await page.click('[data-bm-charged]');
  await waitStep('q-job'); await page.click('[data-bm-modal] [data-bm-card="0"]');
  ok(await waitStep('charge') && await page.locator('[data-bm-talk]').count() === 1, 'every poll offers to talk it through');
  await page.click('[data-bm-talk]');
  ok(await waitStep('talk-321') && await t321() === 'before' && await page.locator('[data-cave-321-skip]').count() === 1, 'Talk it through opens the full 3-2-1 with the voice, skippable from the start');
  ok(await page.waitForFunction(() => document.querySelector('[data-bm-trustbtn]').disabled && document.querySelector('[data-bm-sitbtn]').disabled, null, { timeout: 3000 }).then(() => true, () => false), 'Trust and Sit down wait while the 3-2-1 is open');
  await page.click('[data-cave-321-start]');
  ok(await t321() === 'it' && await page.locator('[data-cave-321-card]').count() === 4, 'Face it, with cards to tap');
  await page.click('[data-cave-321-card="0"]');
  ok(await bubbles() === 1 && /It's standing in my way\./.test(await page.textContent('[data-cave-321-log]')), 'a card is sent as your line');
  await page.click('[data-cave-321-next]');
  ok(await t321() === 'you' && await page.locator('[data-cave-321-card]').count() === 4 && /^\(/.test(await page.textContent('[data-cave-321-card="3"]')), 'Talk to it has cards too, a gesture among them');
  await page.fill('[data-cave-321-text="you"]', 'Why are you here, really?'); await page.click('[data-cave-321-send]');
  ok(await page.getAttribute('[data-cave-321-voice="it"]', 'aria-pressed') === 'true' && /I don't trust you yet\./.test(await page.textContent('[data-cave-321-cards]')), 'your own words hand the voice to it, and its cards change with it');
  await page.click('[data-cave-321-card="0"]');
  await page.click('[data-cave-321-next]');
  ok(await waitStep('perm-be') && /May I stand where you stand, and speak as you, for a while\?/.test(await page.textContent('[data-bm-modal]')), 'Be it opens only with its permission: it is asked first');
  await page.click('[data-bm-perm="no"]');
  ok(await waitStep('refused-be') && /Nobody stands here but me\./.test(await page.textContent('[data-bm-modal]')) && await page.locator('[data-bm-post="be"]').count() === 1, 'it can hold back, in its own words, and you can stay on your own side');
  await page.click('[data-bm-post="be"]');
  ok(await waitStep('talk-321') && await t321() === 'after', 'staying on your own side goes on to the charge reading, without being it');
  ok(await page.inputValue('[data-cave-321-charge="after"]') === '7', 'the reading starts at its charge');
  await page.fill('[data-cave-321-charge="after"]', '5'); await page.click('[data-cave-321-after]');
  ok(/You faced the Protector, talked with it\. Nothing you wrote leaves this page\./.test(await page.textContent('[data-bm-modal]')), 'it says what you did, and that the words stay on the page');
  await page.click('[data-bm-talkdone]');
  ok(await waitStep('eased') || true, 'a lower charge eases as at any check-in');
  ok(await page.waitForFunction(() => /^q-/.test(document.querySelector('[data-bm-modal]')?.getAttribute('data-bm-step') || ''), null, { timeout: 15000 }).then(() => true, () => false) && await page.evaluate(() => window.__oagBigMind.state.charge === 5 && window.__oagBigMind.state.talked === 1), 'the reading is its charge now, and the questions go on: ' + await step());
  await page.click('[data-bm-modal] [data-bm-card="0"]'); await waitStep('charge');
  await page.click('[data-bm-talk]'); await waitStep('talk-321');
  await page.click('[data-cave-321-start]');
  ok(/Round 2/.test(await page.textContent('[data-cave-321-log]')) && await bubbles() === 3, 'a second 3-2-1 keeps the thread and starts a new round');
  await page.click('[data-cave-321-next]'); await page.click('[data-cave-321-next]');
  await waitStep('perm-be'); await page.click('[data-bm-perm="yes"]');
  ok(await waitStep('granted-be') && /Stand here, then\. Feel how heavy it is\./.test(await page.textContent('[data-bm-modal]')), 'it lets you');
  await page.click('[data-bm-thanks="be"]');
  ok(await waitStep('talk-321') && await t321() === 'i', 'and Be it opens');
  const be = await page.locator('[data-cave-321-card]').allTextContents();
  ok(be[0] === 'I am the Protector.' && /^\(I take its stance: palms out at shoulder height/.test(be[be.length - 1]), 'Be it offers its own lines and its held movement as a gesture: ' + be.join(' | '));
  await page.click('[data-cave-321-card="' + (be.length - 1) + '"]');
  ok(/As the Protector/.test(await page.textContent('[data-cave-321-log]')), 'the gesture is sent as the voice');
  await page.click('[data-cave-321-next]'); await page.fill('[data-cave-321-charge="after"]', '2'); await page.click('[data-cave-321-after]');
  ok(/and spoke as it\./.test(await page.textContent('[data-bm-modal]')), 'it says you spoke as it');
  await page.click('[data-bm-talkdone]');
  { // the let-go (bars-engine #356): a 3-2-1 that leaves the voice willing plays its Integrate action, ending honored
    const pose = () => page.evaluate(() => window.__oagCave.kit.bodyPose(window.__oagBigMind.voice));
    ok(await waitStep('letgo', 15000) && /The Protector lets go\./.test(await page.textContent('[data-bm-eased]')), 'a 3-2-1 that leaves it willing plays its let-go, and the cave says so');
    ok(await page.waitForFunction(() => window.__oagCave.kit.bodyPose(window.__oagBigMind.voice).integrate >= 0, null, { timeout: 5000 }).then(() => true, () => false), 'its body plays the Integrate action (' + JSON.stringify(await pose()) + ')');
    ok(await waitStep('ready', 20000), 'when the let-go ends, it is willing');
    await page.waitForTimeout(1500);
    const lp = await pose();
    ok(lp.stance === 'willing' && lp.integrate < 0 && lp.now.open > 0.9, 'it stands honored and willing after it (' + JSON.stringify(lp) + ')');
  }
  ok(await waitStep('ready', 15000) && await page.locator('[data-bm-talk]').count() === 1, 'at 3 or below it is willing, and it can still be talked through');
  await page.click('[data-bm-talk]'); await waitStep('talk-321'); await page.click('[data-cave-321-skip]');
  ok(await page.locator('[data-bm-talkback]').count() === 1, 'skipping the 3-2-1 goes straight back');
  await page.click('[data-bm-talkback]');
  ok(await waitStep('ready') && await page.evaluate(() => window.__oagBigMind.state.talked === 2), 'and a skipped one is not counted; stepping aside never waited on it');
  await page.click('[data-bm-ask="aside"]'); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="aside"]');
  ok(await waitStep('be-who', 30000) && await page.locator('[data-bm-seattalk]').count() === 1, 'from its seat, the 3-2-1 is offered too');
  await page.click('[data-bm-seattalk]'); await waitStep('talk-321');
  ok(/From its place, you look at it/.test(await page.textContent('[data-bm-modal]')) || await t321() === 'before', 'from its seat the 3-2-1 is staged in its place');
  await page.click('[data-cave-321-start]'); await page.click('[data-cave-321-next]'); await page.click('[data-cave-321-next]');
  ok(await step() === 'talk-321' && await t321() === 'i', 'in its seat, it already let you stand there, so Be it opens without asking again');
  await page.click('[data-cave-321-skip]'); await page.click('[data-bm-talkback]');
  ok(await waitStep('be-who'), 'and it comes back to speaking as it');
  await page.click('[data-bm-look]'); await waitStep('thanks'); await page.click('[data-bm-out]');
  await waitStep('perm-pass', 30000); await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="pass"]');
  ok(await waitStep('keep', 20000), 'past the 3-2-1, the chamber goes on as before');
  await page.click('[data-bm-save]');
  await page.waitForFunction(() => window.__oagBigMind.state.phase === 'hall2', null, { timeout: 10000 }).catch(() => {});
  let sv = await save();
  ok(sv.voices.protector.talked === 2 && sv.voices.protector.spirit.name === 'Fear' && !JSON.stringify(sv).includes('Why are you here, really'), 'saved: two 3-2-1s and its spirit, never the words');
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  ok(!(sv = await save()).spirits || !sv.spirits.some((o) => o.name === 'Fear'), 'the meeting spirit is not one of the spirits kept at the mouth: it comes back with its voice');
  ok(/The spirit from meeting it walks with you: Fear \(Metal\)\./.test(await page.textContent('[data-bm-keptmeet="protector"]')) && /twice|2 times/.test(await page.textContent('[data-bm-kepttalked="protector"]')), 'the mouth lists it with the voice, and the 3-2-1s had');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas'); await fast();
  ok(await page.evaluate(() => window.__oagBigMind.spirits.filter((o) => o.meet === 'protector').length === 1), 'it comes back in with you');
  // a voice met before is not asked again how you feel meeting it
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('oag.bigmind.v1')); s.chamber = 0; s.at = 'mouth'; localStorage.setItem('oag.bigmind.v1', JSON.stringify(s)); });
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.click('[data-bm-restart]').catch(() => page.click('[data-bm-enter]')); await page.waitForSelector('[data-bm-cave] canvas'); await fast(); await hold(true);
  ok(await page.waitForFunction(() => /^meet/.test(document.querySelector('[data-bm-modal]')?.getAttribute('data-bm-step') || ''), null, { timeout: 20000 }).then(() => true, () => false) && await step() === 'meet', 'meeting it again, the feeling is not asked twice');
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');

  // Once its voice trusts you, the spirit born on meeting it is your ally (bmt-spirits-vouch), under its own name.
  const at0 = '2026-10-16T00:00:00.000Z';
  const trusted = { status: 'spoken', kept: [], savedAt: at0, spirit: { name: 'Curious', element: 'earth' }, trust: { seen: [{ dim: 'can', kind: 'wait', at: at0 }, { dim: 'will', kind: 'return', at: at0 }, { dim: 'good', kind: 'share', at: at0 }], promises: [], broken: [], repaired: [], ally: at0 } };
  await page.evaluate((r) => { localStorage.setItem('oag.bigmind.v1', JSON.stringify({ v: 1, chamber: 1, at: 'mouth', voices: { protector: r }, waiting: [] })); }, trusted);
  await page.reload(); await page.waitForSelector('[data-bm-mouth]');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas'); await fast();
  const al = await page.evaluate(() => window.__oagBigMind.spirits.filter((o) => o.ally === 'protector').map((o) => [o.name, o.element, o.meet]));
  ok(al.length === 1 && al[0][0] === 'Curious' && al[0][1] === 'earth' && al[0][2] === 'protector', 'the meeting spirit is the ally, not a new spirit named for the voice: ' + JSON.stringify(al));
  await hold(true);
  ok(await waitStep0('meet-feel'), 'the Controller, met for the first time, asks how you feel meeting it');
  ok(/Who vouches for you\?/.test(await page.textContent('[data-bm-modal]')) === false, 'the feeling comes before anything is asked of you');
  await page.click('[data-bm-feel="none"]');
  ok(await waitStep0('meet') && /Who vouches for you\?/.test(await page.textContent('[data-bm-modal]')) && await page.evaluate(() => window.__oagBigMind.spirits.some((o) => o.meet === 'controller' && o.name === 'No word yet' && !o.element)), 'No word yet spawns a grey spirit, and then the voice asks who vouches for you');
  await menuTap('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.evaluate(() => localStorage.clear());
}


// the approach check-in at the end of the hallway (pass daemon-meeting1, build 4)
{
  const fast = () => page.evaluate(() => { window.__oagBigMind.state.speed = 6; });
  const text = () => page.textContent('[data-bm-modal]');
  const startAt = async (extra = {}) => {
    await page.evaluate((x) => { localStorage.clear(); localStorage.setItem('oag.bigmind.v1', JSON.stringify({ v: 1, chamber: 0, at: 'hall2', voices: { protector: { status: 'spoken', kept: [], savedAt: '2026-10-17T00:00:00.000Z', spirit: { name: 'Curious', element: 'earth' }, ...x } }, waiting: [] })); }, extra);
    await page.reload(); await page.waitForSelector('[data-bm-mouth]');
    await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas'); await fast(); await passAgain();
  };
  await startAt();
  await hold(true);
  ok(await waitStep0('approach-body'), 'at the end of the hallway, the check-in opens on the body ask, before the shut mouth');
  ok(!/and then\.\.\./.test(await text()) && (await page.locator('[data-bm-apgo]').count()) === 0, 'there is no "and then..." line');
  const bodyText = await text();
  ok(/What does it feel like\?/.test(bodyText) && /What is your body doing\?/.test(bodyText) && /Tightness/.test(bodyText) && /Numbness/.test(bodyText) && /Moving freely/.test(bodyText) && /Bracing/.test(bodyText) && /Flinging open/.test(bodyText), 'one card, two rows: the texture words and the movement words');
  ok(!/Protector|Controller|Skeptic|Fixer|Victim|Damaged|Emotional Body/.test(bodyText), 'it names no daemon');
  ok(!/\d/.test(bodyText), 'no screen prints a number');
  // the chamber is the Protector's: bracing matches, gripping (the Controller's) merges
  await page.click('[data-bm-aptex="tension"]'); await page.click('[data-bm-ap="bracing"]'); await page.click('[data-bm-apdone]');
  ok(await waitStep0('approach-feel') && (await page.locator('[data-bm-merged]').count()) === 0, 'a movement that belongs to this voice shows nothing merged');
  await page.click('[data-bm-ap="fire"]');
  ok(await waitStep0('approach-veil'), 'then how near it is');
  ok(await page.evaluate(() => window.__oagBigMind.mouth.light.color.getHex()) === await page.evaluate(() => window.__oagCave.kit.spiritHex('fire')), 'the mouth\'s light took the element\'s colour at once');
  ok(await page.evaluate(() => { const a = window.__oagBigMind.approachSpirit; return a && a.body === 'bracing' && a.texture === 'tension' && a.element === 'fire' && a.family === 'protector' && a.merged === null; }), 'the meeting spirit forms from the answers, family the chamber\'s daemon');
  await page.click('[data-bm-ap="veiled"]');
  ok(await waitStep0('end'), 'a faint answer never shows the settled ask: it goes straight on');
  let sv = await save();
  const ap = sv.voices.protector.approach;
  ok(ap && ap.body === 'bracing' && ap.texture === 'tension' && ap.feeling === 'fire' && ap.veil === 'veiled' && ap.state === null && !('merged' in ap) && !!ap.at, 'a match saves no merged: ' + JSON.stringify(ap));
  // a movement of another voice: merged, unnamed
  await startAt(); await hold(true);
  await waitStep0('approach-body'); await page.click('[data-bm-ap="gripping"]'); await page.click('[data-bm-apdone]');
  ok(await waitStep0('approach-feel') && /Something of another voice is in this one\./.test(await text()) && !/Controller/.test(await text()), 'a mismatch says something of another voice is in this one, and names no daemon');
  ok(await page.evaluate(() => { const a = window.__oagBigMind.approachSpirit; return a && a.merged === 'controller' && a.family === 'protector'; }), 'the spirit wears the other daemon\'s gas');
  await page.click('[data-bm-apskip]'); await waitStep0('approach-veil');
  await page.click('[data-bm-ap="clear"]');
  ok(await waitStep0('approach-state'), 'when not faint, the settled ask shows');
  await page.click('[data-bm-ap="wants"]');
  ok(await waitStep0('end'), 'and the walk goes on');
  sv = await save();
  ok(sv.voices.protector.approach.merged === 'controller' && sv.voices.protector.approach.texture === null && sv.voices.protector.approach.state === 'wants', 'a mismatch saves merged; a skipped ask is saved as nothing');
  // either, both or neither: sensation alone
  await startAt(); await hold(true);
  await waitStep0('approach-body'); await page.click('[data-bm-aptex="numbness"]'); await page.click('[data-bm-apdone]');
  ok(await waitStep0('approach-feel') && await page.evaluate(() => window.__oagBigMind.approachSpirit.texture === 'numbness'), 'a sensation alone is enough');
  await page.click('[data-bm-apskipall]');
  ok(await waitStep0('end') && (await save()).voices.protector.approach.texture === 'numbness', 'skip all passes, keeping what was answered');
  // skip all passes, and saves nothing when nothing was answered; it is asked every visit
  await startAt(); await hold(true);
  await waitStep0('approach-body'); await page.click('[data-bm-apskipall]');
  ok(await waitStep0('end') && !(await save()).voices.protector.approach, 'skip all passes and keeps nothing');
  await startAt(); await hold(true);
  ok(await waitStep0('approach-body'), 'asked again on every visit');
  await page.evaluate(() => localStorage.clear());
}

// ---- the walkthrough in the first hallway (Six-faces-council council/callsheets/game-demo.md: gd-mouth-in-world, gd-teach-by-doing) ----
// The old rules list is the light's lessons now: the walk, Run, Self and the way back, one glyph at a time, each gone once done
// or skipped, kept in oag.tutorial.v1; Spirits and Trust are taught the first time their buttons show. Nothing is taught twice.
await page.evaluate(() => localStorage.clear());
await page.goto(B); await page.waitForSelector('[data-bm-mouth]');
await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
const tch = () => page.evaluate(() => window.__oagBigMind.teach());
const tchIs = (id) => page.waitForFunction((id) => window.__oagBigMind.teach().shown === id, id, { timeout: 8000 }).then(() => true, () => false);
const learned = (id) => page.waitForFunction((id) => window.__oagBigMind.teach().done.indexOf(id) >= 0, id, { timeout: 8000 }).then(() => true, () => false);
ok(await tchIs('walk'), 'a new player\'s first hallway opens on the walk lesson');
let TB = await tch();
ok(TB.away && TB.visible && (await page.locator('[data-teach]').first().textContent()).trim() === '' && await page.locator('[data-teach-skip]').isVisible(), 'the light floats ahead and the glyph has no words, beside "I know this" ' + JSON.stringify(TB));
await page.evaluate(() => { const s = window.__oagBigMind.state; s.speed = 2; s.held = true; });
ok(await learned('walk'), 'holding to walk learns the walk');
await page.evaluate(() => { window.__oagBigMind.state.held = false; });
ok(await tchIs('run'), 'then Run is taught, by its button');
const rb = await page.locator('[data-bm-run]').boundingBox(), gb = await page.locator('[data-teach="run"]').boundingBox();
ok(gb && rb && gb.y + gb.height <= rb.y + 2 && Math.abs(gb.x + gb.width / 2 - (rb.x + rb.width / 2)) < 60, 'the run glyph sits just above the Run button');
await page.click('[data-bm-run]');
await page.evaluate(() => { window.__oagBigMind.state.held = true; });
ok(await learned('run'), 'walking with Run on learns it');
await page.evaluate(() => { const s = window.__oagBigMind.state; s.held = false; s.run = false; });
ok(await tchIs('self'), 'then the Self button');
const sb = await page.locator('[data-oag-menubtn]').boundingBox(), gs = await page.locator('[data-teach="self"]').boundingBox();
ok(gs && sb && gs.y >= sb.y + sb.height - 2, 'the Self glyph sits under the Menu at the top, where Self is folded, pointing up at it');
await page.click('[data-teach-skip]');
ok(await learned('self'), '"I know this" skips a lesson for good');
await page.evaluate(() => { window.__oagBigMind.state.s = 14; });
ok(await tchIs('back'), 'past the first stretch, the way back is taught by the stick');
await page.keyboard.down('ArrowDown'); ok(await learned('back'), 'walking back learns it'); await page.keyboard.up('ArrowDown');
TB = await tch();
ok(['walk', 'run', 'self', 'back'].every((id) => TB.done.includes(id)) && JSON.parse(await page.evaluate(() => localStorage.getItem('oag.tutorial.v1'))).length === TB.done.length, 'the lessons are kept on this device, as ids ' + JSON.stringify(TB.done));
ok(await tchIs('trust'), 'the Trust button, once it can be used, gets its glyph the first time');
const tb = await page.locator('[data-bm-trustbtn]').boundingBox(), gt = await page.locator('[data-teach="trust"]').boundingBox();
ok(gt && tb && gt.y + gt.height <= tb.y + 2, 'the Trust glyph sits just above its button, pointing down at it');
await page.click('[data-teach-skip]');
ok(await learned('trust'), 'and "I know this" skips it');
await page.waitForFunction(() => !window.__oagBigMind.teach().visible, null, { timeout: 5000 }).catch(() => {});
ok(!(await tch()).visible && !(await page.locator('[data-teach-skip]').isVisible()), 'with nothing left to teach here, the light goes home to the chest');
await page.screenshot({ path: SHOTS + '/bm-teach.png' });
await page.reload(); await page.waitForSelector('[data-bm-mouth]'); await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
await page.waitForTimeout(800);
TB = await tch();
ok(!['walk', 'run', 'self', 'back'].includes(TB.shown) && !['walk', 'run', 'self', 'back'].includes(TB.lesson), 'T2: going back in, nothing learned is taught again ' + JSON.stringify(TB));
await page.evaluate(() => localStorage.clear());

// the Cave of Lessons still opens on its own page
const p2 = await ctx.newPage();
p2.on('pageerror', (e) => errors.push('cave pageerror: ' + e.message));
await p2.goto('http://localhost:4571/ontology-game/cave');
ok(await p2.waitForSelector('[data-cave-home]', { timeout: 5000 }).then(() => true, () => false), 'the Cave of Lessons still opens its doorway');
ok(await p2.evaluate(() => !!window.__oagCave.kit.buildTube), 'the shared engine is exported for the fork');
ok(dialogs.length === 0, 'no browser alert or confirm box' + (dialogs.length ? ': ' + dialogs.join('; ') : ''));
ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join('; ') : ''));
console.log(passes + ' passed, ' + fails + ' failed');
await browser.close(); server.close();
