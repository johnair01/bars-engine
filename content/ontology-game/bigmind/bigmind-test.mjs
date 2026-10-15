import http from 'node:http';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
// Browser checks for the Big Mind cave (bigmind.js on the Cave of Lessons engine): the cave mouth and its rules, the walk to
// the Protector, the ask, the seat shift, the cards and the open line, secretly speaking (the second figure, naming it,
// thanking it, the voice asked again), stepping back out, keeping lines, the save on the device, the way opening, the hallway
// past it with the waiting part, the Controller's and the Skeptic's chambers, the next chamber shut, walking back up, resuming, forgetting and deleting, and declining.
// Build first with `npm run build:ontology-game`, then run from a folder that has playwright and three@0.128.0 installed:
//   OAG_PUBLIC=/path/to/bars-engine/public OAG_SHOTS=/some/dir node bigmind-test.mjs
const PUB = process.env.OAG_PUBLIC || new URL('../../../public', import.meta.url).pathname;
const SHOTS = process.env.OAG_SHOTS || '.';
const NM = new URL('./node_modules/', import.meta.url).pathname;
const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  const tile = /^\/ontology-game\/cave\/textures\/(wet_stone|dry_stone|crystal_vein)\.jpg$/.exec(u); // the Cave of Lessons' stone
  const f = u === '/ontology-game/big-mind' ? 'big-mind/index.html' : u === '/ontology-game/cave' ? 'cave/index.html' : tile ? 'cave/textures/' + tile[1] + '.jpg' : null;
  if (!f) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': tile ? 'image/jpeg' : 'text/html' }); res.end(readFileSync(PUB + '/ontology-game/' + f));
}).listen(4571);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
await ctx.route('https://cdnjs.cloudflare.com/**', (r) => r.fulfill({ body: readFileSync(NM + 'three/build/three.min.js'), contentType: 'application/javascript' }));
const errors = [];
let passes = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (c) passes++; else { fails++; process.exitCode = 1; } };
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('dialog', (d) => d.accept());
const B = 'http://localhost:4571/ontology-game/big-mind';
const step = () => page.getAttribute('[data-bm-modal]', 'data-bm-step');
const waitStep = (s, ms = 20000) => page.waitForFunction((s) => document.querySelector('[data-bm-modal]')?.getAttribute('data-bm-step') === s, s, { timeout: ms }).then(() => true, () => false);
const st = () => page.evaluate(() => { const s = window.__oagBigMind.state; return s && { phase: s.phase, s: s.s, gate: s.gate, cam: s.cam, waiting: s.waiting.slice(), answers: s.answers }; });
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('oag.bigmind.v1') || 'null'));
async function hold(on) { await page.evaluate((on) => { const s = window.__oagBigMind.state; s.speed = 6; s.held = on; }, on); }
async function holdUntil(stepName) { await hold(true); const r = await waitStep(stepName); return r; }

await page.goto(B);
await page.waitForSelector('[data-bm-mouth]');
await page.evaluate(() => localStorage.clear());
await page.reload(); await page.waitForSelector('[data-bm-mouth]');
const mouthText = await page.textContent('[data-bm-mouth]');
ok(/not therapy/.test(mouthText) && /988/.test(mouthText), 'the cave mouth says it is a game, not therapy, with a crisis line');
ok(/sit out/i.test(mouthText) && /take control back/i.test(mouthText) && /walk back up/i.test(mouthText), 'the mouth gives the three rules: sit out, take control back, walk back up');
ok(/Nothing is sent anywhere/.test(mouthText), 'the mouth says nothing leaves the device');
ok(!/Genpo|Big Mind Process|Zen Center/i.test(await page.content()), 'no teacher or programme is named on the page');
await page.screenshot({ path: SHOTS + '/bm-1-mouth.png' });

await page.click('[data-bm-enter]');
await page.waitForSelector('[data-bm-cave] canvas');
await page.waitForTimeout(600);
ok(/Hold anywhere to walk/.test(await page.textContent('[data-bm-hint]')), 'the hallway says how to walk');
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

ok(await holdUntil('meet'), 'walking on reaches the Protector, who blocks the path');
ok(/Nobody goes past this point/.test(await page.textContent('[data-bm-modal]')), 'the Protector speaks first');
ok(Math.abs((await st()).s - (await page.evaluate(() => window.__oagBigMind.S.S_SELF))) < 0.01, 'the figure stops in front of the voice');
await page.screenshot({ path: SHOTS + '/bm-3-meet.png' });

// Self, at any time
await page.click('[data-bm-selfbtn]');
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
await breathed('[data-bm-exhale="release"]');
ok(await waitStep('wave-releasing', 2000), 'exhale and release: the charge is let go before the next question');
await page.waitForTimeout(300);
await page.screenshot({ path: SHOTS + '/bm-3l-wave-release.png' });
ok(await relB.evaluate((B) => B.rise > 0 && B.fade < 1), 'it rises and fades as it goes');
ok(await waitStep('wave-after'), 'after the Exhale: how charged are you now?');
ok(await relB.evaluate((B) => !B.g.parent) && await page.evaluate(() => window.__oagBigMind.spirits.length === 0), 'released, it is gone and does not follow');
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
await page.waitForFunction(() => window.__oagBigMind.spirits.length === 1, null, { timeout: 4000 }).catch(() => {});
ok(await page.evaluate(() => window.__oagBigMind.spirits.length === 1 && window.__oagBigMind.spirits[0].name === 'A charge'), 'a W.A.V.E. left at a block keeps its charge walking with you');
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
ok(await waitStep('wave-after'), 'then how charged you are now');
ok(await page.evaluate(() => window.__oagBigMind.spirits.length === 2 && window.__oagBigMind.spirits[1].name === 'Ache' && window.__oagBigMind.spirits[1].element === 'water'), 'let stay, the charge walks with you as a spirit');
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
ok(await waitStep('perm-pass', 30000), 'stepping back out, the player asks to walk on');
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
ok(sv.voices.protector.place === 'Chest' && sv.voices.protector.charges.map((c) => c.v).join() === '8,8,8,7,6,5,2', 'the save holds where it lives and how its charge fell: ' + JSON.stringify(sv.voices.protector.charges));
await page.waitForTimeout(1500);
const open = await page.evaluate(() => window.__oagBigMind.openAt(window.__oagBigMind.S.S_GATE + 14));
ok(open > 0.9, 'the way past the chamber opens (' + open.toFixed(2) + ')');
await page.screenshot({ path: SHOTS + '/bm-6-way-open.png' });
await hold(true);
await page.waitForFunction(() => /waits? here/.test(document.querySelector('[data-bm-hint]').textContent), null, { timeout: 15000 }).then(() => ok(true, 'the part that was asked to wait stands in the hallway past the chamber'), () => ok(false, 'the waiting part is met in the hallway'));
await page.screenshot({ path: SHOTS + '/bm-7-waiting-part.png' });
ok(await holdUntil('end'), 'the hallway ends at the mouth of the next chamber');
ok(/The Controller/.test(await page.textContent('[data-bm-modal]')) && await page.locator('[data-bm-onward]').count() === 1, 'the Controller waits there, and its chamber is open');
await page.screenshot({ path: SHOTS + '/bm-8-next-chamber.png' });
await page.click('[data-bm-leave]');
ok(await waitStep('mouth-spirits'), 'the W.A.V.E.s\' spirits come out with you to the mouth');
await page.click('[data-bm-mouthspirit="0"]'); await page.click('[data-bm-mouthspirit="1"]'); await page.click('[data-bm-walkout]');
await page.waitForSelector('[data-bm-mouth]');
ok(/past the Protector/.test(await page.textContent('[data-bm-enter]')), 'back at the mouth, the cave offers to go back in past the Protector');
ok(/To protect\./.test(await page.textContent('[data-bm-kept]')), 'the mouth lists what has been kept');
ok(/W\.A\.V\.E\.: Dread, Metal, in your chest: 8 to 6/.test(await page.textContent('[data-bm-kept]')), 'the mouth lists each W.A.V.E. as one line');
await page.screenshot({ path: SHOTS + '/bm-9-mouth-kept.png' });
await page.click('[data-bm-enter]');
await page.waitForSelector('[data-bm-cave] canvas');
await page.waitForTimeout(300);
s1 = await st();
ok(s1.phase === 'hall2' && s1.gate > 0.99 && s1.s > 61, 'resuming starts past the Protector with the way open');
await page.click('[data-bm-selfbtn]'); await page.click('[data-bm-leave]');
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
await page.click('[data-bm-selfbtn]'); await page.click('[data-bm-leave]');
await page.waitForSelector('[data-bm-mouth]');
await page.click('[data-bm-wipe]');
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
  const m = document.querySelector('.oagc-modal').getBoundingClientRect();
  return { y: (1 - v.y) / 2 * innerHeight, x: (v.x + 1) / 2 * innerWidth, panel: m.bottom, h: innerHeight, w: innerWidth };
});
ok(seen.y > seen.panel + 10 && seen.y < seen.h - 10 && seen.x > 10 && seen.x < seen.w - 10, 'at Acknowledge the camera frames the charge below the panel (y ' + seen.y.toFixed(0) + ', panel ends ' + seen.panel.toFixed(0) + ')');
await page.screenshot({ path: SHOTS + '/bm-6-sit-acknowledge.png' });
const cam0 = await page.evaluate(() => window.__oagBigMind.camera.position.toArray());
await page.mouse.move(195, 760); await page.mouse.down(); await page.mouse.move(345, 700, { steps: 8 }); await page.mouse.up();
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
await page.waitForFunction(() => window.__oagBigMind.spirits.length === 1 && !window.__oagBigMind.sitting(), null, { timeout: 8000 }).catch(() => {});
ok(await page.evaluate(() => window.__oagBigMind.spirits.length === 1 && window.__oagBigMind.spirits[0].name === 'Worry'), 'a charge that stays follows as a spirit with its name');
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
ok(await page.evaluate(() => window.__oagBigMind.spirits.length === 2 && window.__oagBigMind.spirits[1].name === 'Wary'), 'sitting with the voice spawns a spirit too (Wendell, 20:43: every sit-down W.A.V.E. spawns one)');
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
ok(await page.evaluate(() => { const o = window.__oagBigMind.spirits[2]; return window.__oagBigMind.spirits.length === 3 && /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(o.name); }), 'a sitting stood up from early still spawns a spirit, under the name the game gave it');
ok((await page.textContent('[data-bm-spiritbtn]')) === 'Spirits 3', 'three spirits are counted');
sv = await save();
ok(sv.sittings.length === 3 && sv.sittings[2].via === 'block' && sv.sittings[2].branch === 'stood' && sv.sittings[1].whom === 'voice', 'each sitting is recorded: ' + JSON.stringify(sv.sittings.map((x) => [x.whom, x.via, x.branch])));
await page.click('[data-bm-selfbtn]'); await page.click('[data-bm-leave]');
ok(await waitStep('mouth-spirits'), 'at the mouth, each spirit is kept for next time or let go');
await page.click('[data-bm-mouthspirit="1"]'); await page.click('[data-bm-mouthspirit="2"]');
await page.click('[data-bm-walkout]');
await page.waitForSelector('[data-bm-mouth]');
ok(JSON.stringify((await save()).spirits) === '[{"name":"Worry","element":"metal"}]', 'a kept spirit is its name and element, on the device');
ok(/Worry \(Metal\)/.test(await page.textContent('[data-bm-keptspirits]')), 'the mouth lists the kept spirit');
await page.click('[data-bm-enter]');
await page.waitForSelector('[data-bm-cave] canvas');
await page.waitForTimeout(300);
ok((await page.evaluate(() => window.__oagBigMind.spirits.length)) === 1, 'a kept spirit comes back in with you');
await page.click('[data-bm-spiritbtn]');
ok(await waitStep('spirit-list'), 'tapping the spirits lists them');
await page.click('[data-bm-spirit="0"]');
ok(await waitStep('spirit-thank') && /Thank you for coming with me/.test(await page.textContent('[data-bm-modal]')), 'tapping one thanks it');
await page.click('[data-bm-spiritout]');
ok((await page.evaluate(() => window.__oagBigMind.spirits.length)) === 0, 'breathing out lets it go');
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
await page.waitForFunction(() => window.__oagBigMind.spirits.length === 1 && !window.__oagBigMind.sitting(), null, { timeout: 8000 }).catch(() => {});
ok(await page.evaluate(() => { const o = window.__oagBigMind.spirits[0]; return o && o.name === 'Ache' && o.lighter && o.g.userData.level < 0.3; }), 'a charge breathed out still spawns a spirit, walking lighter');
await page.click('[data-bm-selfbtn]'); await page.click('[data-bm-leave]');
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
  ok(/past the Protector/.test(await page.textContent('[data-bm-enter]')), 'a save from before the Controller still resumes past the Protector');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
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
  ok(/past the Controller/.test(await page.textContent('[data-bm-enter]')) && /It works for the Protector\./.test(await page.textContent('[data-bm-kept]')) && /Moved it: You offered/.test(await page.textContent('[data-bm-kept]')), 'the mouth goes back in past the Controller, and says who it works for and what moved it');

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
  await page.click('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
  ok(await toBoss(), 'and again');
  await page.fill('[data-bm-line]', 'Control itself. Nobody else gives the orders');
  await page.click('[data-bm-say]');
  ok(await waitStep('charge'), 'a boss named in its own words is in voice, with no second figure');
  await setCharge(8);
  ok(await waitStep('q-how') && (await page.textContent('[data-bm-modal]')).includes(how.byBoss.controller), 'working for control itself, it is asked what standards it sets about control');
  await page.click('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.click('[data-bm-restart]');
  await page.waitForSelector('[data-bm-cave] canvas');
  ok((await save()).chamber === 0 && await page.evaluate(() => window.__oagBigMind.voiceId) === 'protector', 'starting at the mouth again begins with the Protector');
  await page.click('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.evaluate(() => localStorage.clear());
}

// The Skeptic's chamber (board dp-seven, dq-boss-chain): walking on from the Controller, Wendell's own four questions, and
// the boss question, where the Controller is one of the bosses and what it said of its own boss follows (the chain).
{
  const DQ = (await import('../daemons/questions.js')).default.daemons.skeptic;
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('oag.bigmind.v1', JSON.stringify({ v: 1, chamber: 1, at: 'hall2', voices: { protector: { status: 'spoken', kept: [], charges: [], waves: [] }, controller: { status: 'spoken', kept: [], charges: [], waves: [], boss: 'protector' } }, waiting: ['skeptic'] })); });
  await page.reload(); await page.waitForSelector('[data-bm-mouth]');
  ok(/past the Controller/.test(await page.textContent('[data-bm-enter]')), 'a save past the Controller resumes there');
  await page.click('[data-bm-enter]'); await page.waitForSelector('[data-bm-cave] canvas');
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
  await page.click('[data-bm-perm="yes"]'); await page.click('[data-bm-thanks="pass"]');
  ok(await waitStep('keep', 30000) && /What the Skeptic said/.test(await page.textContent('[data-bm-modal]')), 'then its lines to keep');
  await page.click('[data-bm-keep="0"]'); await page.click('[data-bm-save]');
  await page.waitForTimeout(400);
  sv = await save();
  ok(sv.voices.skeptic && sv.voices.skeptic.status === 'spoken' && sv.voices.skeptic.boss === 'controller' && sv.chamber === 2 && sv.at === 'hall2' && sv.voices.controller.boss === 'protector', 'its record holds who it works for, and the Controller\'s stays: ' + JSON.stringify({ boss: sv.voices.skeptic.boss, chamber: sv.chamber, at: sv.at }));
  ok(await holdUntil('end') && /The Fixer/.test(await page.textContent('[data-bm-modal]')) && /next build/.test(await page.textContent('[data-bm-modal]')), 'past the Skeptic, the Fixer waits at a chamber still shut');
  await page.screenshot({ path: SHOTS + '/bm-17-fixer-shut.png' });
  await page.click('[data-bm-leave]');
  await page.waitForSelector('[data-bm-mouth]');
  const kept = await page.textContent('[data-bm-kept]');
  ok(/past the Skeptic/.test(await page.textContent('[data-bm-enter]')) && /It works for the Controller\./.test(kept) && /It works for the Protector\./.test(kept), 'the mouth goes back in past the Skeptic, and says who each works for');

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
  await page.click('[data-bm-selfbtn]'); await page.click('[data-bm-leave]'); await page.waitForSelector('[data-bm-mouth]');
  await page.evaluate(() => localStorage.clear());
}

// the Cave of Lessons still opens on its own page
const p2 = await ctx.newPage();
p2.on('pageerror', (e) => errors.push('cave pageerror: ' + e.message));
await p2.goto('http://localhost:4571/ontology-game/cave');
ok(await p2.waitForSelector('[data-cave-home]', { timeout: 5000 }).then(() => true, () => false), 'the Cave of Lessons still opens its doorway');
ok(await p2.evaluate(() => !!window.__oagCave.kit.buildTube), 'the shared engine is exported for the fork');
ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join('; ') : ''));
console.log(passes + ' passed, ' + fails + ' failed');
await browser.close(); server.close();
