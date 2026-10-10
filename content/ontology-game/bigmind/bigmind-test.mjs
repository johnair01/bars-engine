import http from 'node:http';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
// Browser checks for the Big Mind cave (bigmind.js on the Cave of Lessons engine): the cave mouth and its rules, the walk to
// the Protector, the ask, the seat shift, the cards and the open line, secretly speaking (the second figure, naming it,
// thanking it, the voice asked again), stepping back out, keeping lines, the save on the device, the way opening, the hallway
// past it with the waiting part, the next chamber shut, walking back up, resuming, forgetting and deleting, and declining.
// Build first with `npm run build:ontology-game`, then run from a folder that has playwright and three@0.128.0 installed:
//   OAG_PUBLIC=/path/to/bars-engine/public OAG_SHOTS=/some/dir node bigmind-test.mjs
const PUB = process.env.OAG_PUBLIC || new URL('../../../public', import.meta.url).pathname;
const SHOTS = process.env.OAG_SHOTS || '.';
const NM = new URL('./node_modules/', import.meta.url).pathname;
const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  const f = u === '/ontology-game/big-mind' ? 'big-mind/index.html' : u === '/ontology-game/cave' ? 'cave/index.html' : null;
  if (!f) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': 'text/html' }); res.end(readFileSync(PUB + '/ontology-game/' + f));
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
await page.mouse.move(box.x + 200, box.y + 400); await page.mouse.down(); await page.waitForTimeout(500); await page.mouse.up();
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
ok(await waitStep('perm-speak'), 'and the player asks again');
await page.click('[data-bm-perm="unsure"]');
ok(await waitStep('unsure-speak'), 'can\'t tell: stay with it and breathe');
await page.click('[data-bm-again]');
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
ok(await waitStep('q-boss') && /Who do you work for\?/.test(await page.textContent('[data-bm-modal]')), 'who do you work for?');
await page.click('[data-bm-modal] [data-bm-card]:has-text("The self.")');
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
await page.click('[data-bm-modal] [data-bm-card]:has-text("Attack.")');
await page.click('[data-bm-modal] [data-bm-card]:has-text("Shame.")');
await page.click('[data-bm-done]');
await page.screenshot({ path: SHOTS + '/bm-3e-meter.png' });
await setCharge(2);
ok(await page.evaluate(() => document.querySelector('[data-bm-meter]').classList.contains('ready')), 'below the line, the meter turns');
ok(await waitStep('ready') && /I could step aside/.test(await page.textContent('[data-bm-modal]')), 'the charge low enough: it offers to step aside');
ok(await page.evaluate(() => !!window.__oagBigMind.heard) && await page.evaluate(() => ['protect from losing control', 'I keep watch', 'I hate self-doubt'].every((t) => window.__oagBigMind.heard(t) === null)), 'in-voice lines are not flagged (losing control, self-doubt)');
ok(await page.evaluate(() => { const h = window.__oagBigMind.heard; return h('I need to fix it') === 'fixer' && h('I keep everything in hand') === 'controller' && h('the protector is tired') === 'ideas'; }), 'open-line tells: the Fixer, the Controller, the self\'s ideas');
await page.click('[data-bm-ask="aside"]');
ok(await waitStep('perm-aside') && /step aside/.test(await page.textContent('[data-bm-modal]')), 'the player asks it to step aside');
await page.click('[data-bm-perm="yes"]');
await page.click('[data-bm-thanks="aside"]');
ok(await waitStep('know'), 'it steps aside and the player walks into its place');
let s1 = await st();
ok(s1.cam === 'voice' && Math.abs(s1.s - 58) < 0.05, 'the player stands where the voice stood, seen looking back the way the self came');
ok(await page.evaluate(() => !window.__oagBigMind.voice.visible), 'the voice is stepped into, not beside');
await page.screenshot({ path: SHOTS + '/bm-4-as-protector.png' });
await page.click('[data-bm-know="1"]');
ok(await waitStep('thanks'), 'the guide thanks the voice');
await page.click('[data-bm-out]');
ok(await waitStep('perm-pass', 30000), 'stepping back out, the player asks to walk on');
s1 = await st();
ok(s1.cam === 'behind' && Math.abs(s1.s - 52) < 0.05, 'the player is back in the self\'s place');
await page.click('[data-bm-perm="yes"]');
await page.click('[data-bm-thanks="pass"]');
ok(await waitStep('keep', 30000), 'it lets the player pass, then the lines to keep');
await page.click('[data-bm-keep="0"]');
await page.click('[data-bm-keep="2"]');
await page.click('[data-bm-keep="6"]');
await page.click('[data-bm-save]');
await page.waitForTimeout(400);
let sv = await save();
ok(sv && sv.voices.protector && sv.voices.protector.status === 'spoken', 'the chamber is saved on the device');
ok(sv.voices.protector.kept.map((k) => k.line).join('|') === 'To protect.|Nobody ever gives me a day off|The self will get hurt.', 'only kept lines are stored, its fear among them: ' + JSON.stringify(sv.voices.protector.kept.map((k) => k.line)));
ok(sv.at === 'hall2' && sv.waiting.join() === 'ideas', 'the save holds the place and the part waiting');
ok(sv.voices.protector.place === 'Chest' && sv.voices.protector.charges.map((c) => c.v).join() === '8,7,6,5,2', 'the save holds where it lives and how its charge fell: ' + JSON.stringify(sv.voices.protector.charges));
await page.waitForTimeout(1500);
const open = await page.evaluate(() => window.__oagBigMind.openAt(window.__oagBigMind.S.S_GATE + 14));
ok(open > 0.9, 'the way past the chamber opens (' + open.toFixed(2) + ')');
await page.screenshot({ path: SHOTS + '/bm-6-way-open.png' });
await hold(true);
await page.waitForFunction(() => /waits? here/.test(document.querySelector('[data-bm-hint]').textContent), null, { timeout: 15000 }).then(() => ok(true, 'the part that was asked to wait stands in the hallway past the chamber'), () => ok(false, 'the waiting part is met in the hallway'));
await page.screenshot({ path: SHOTS + '/bm-7-waiting-part.png' });
ok(await holdUntil('end'), 'the hallway ends at the next chamber, shut for now');
ok(/next build/.test(await page.textContent('[data-bm-modal]')), 'the next chamber says it opens in the next build');
await page.screenshot({ path: SHOTS + '/bm-8-next-chamber.png' });
await page.click('[data-bm-leave]');
await page.waitForSelector('[data-bm-mouth]');
ok(/past the Protector/.test(await page.textContent('[data-bm-enter]')), 'back at the mouth, the cave offers to go back in past the Protector');
ok(/To protect\./.test(await page.textContent('[data-bm-kept]')), 'the mouth lists what has been kept');
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
ok((await page.evaluate(() => window.__oagBigMind.openAt(window.__oagBigMind.S.S_GATE + 14))) > 0.9, 'declining opens the way');
await page.screenshot({ path: SHOTS + '/bm-10-declined.png' });
await page.click('[data-bm-selfbtn]'); await page.click('[data-bm-leave]');
await page.waitForSelector('[data-bm-mouth]');
await page.click('[data-bm-wipe]');
await page.waitForTimeout(200);
ok((await save()) === null, 'delete everything clears the device');

// the Cave of Lessons still opens on its own page
const p2 = await ctx.newPage();
p2.on('pageerror', (e) => errors.push('cave pageerror: ' + e.message));
await p2.goto('http://localhost:4571/ontology-game/cave');
ok(await p2.waitForSelector('[data-cave-home]', { timeout: 5000 }).then(() => true, () => false), 'the Cave of Lessons still opens its doorway');
ok(await p2.evaluate(() => !!window.__oagCave.kit.buildTube), 'the shared engine is exported for the fork');
ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join('; ') : ''));
console.log(passes + ' passed, ' + fails + ' failed');
await browser.close(); server.close();
