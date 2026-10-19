import http from 'node:http';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
// Browser checks for perceptual shadow in the WAVE room (Six-faces-council council/callsheets/perceptual-shadow.md): the two
// signals that raise it (Witness's "I know it's here, but I can't feel it", and a charge that did not come down), naming one of
// the four shadows, each shadow hiding the creature its own way by its polarity, the practice that thins it, numbness's link
// to the numbness texture, polarity read beside size and brightness on Allow, the run record, and a spirit that walks out
// still veiled. Build first with `npm run build:ontology-game`, then run it as cave-test.mjs is run:
//   OAG_PUBLIC=/path/to/bars-engine/public OAG_SHOTS=/some/dir node shadow-test.mjs
const PUB = process.env.OAG_PUBLIC || new URL('../../../public', import.meta.url).pathname;
const SHOTS = process.env.OAG_SHOTS || '.';
const NM = new URL('./node_modules/', import.meta.url).pathname;
const files = {
  '/ontology-game/cave/': ['cave/index.html', 'text/html'],
  '/ontology-game/cave/cave-kit.glb': ['cave/cave-kit.glb', 'model/gltf-binary'],
  '/ontology-game/cave/spots.json': ['cave/spots.json', 'application/json'],
  '/ontology-game/cave/textures/wet_stone.jpg': ['cave/textures/wet_stone.jpg', 'image/jpeg'],
  '/ontology-game/cave/textures/dry_stone.jpg': ['cave/textures/dry_stone.jpg', 'image/jpeg'],
  '/ontology-game/cave/textures/crystal_vein.jpg': ['cave/textures/crystal_vein.jpg', 'image/jpeg'],
  '/ontology-game/figure.glb': ['figure.glb', 'model/gltf-binary'],
  '/ontology-game/cave/player/walker.glb': ['cave/player/walker.glb', 'model/gltf-binary'], // the player's own figure (bake_daemons.py --walker)
};
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/api/council/wave-runs') { res.writeHead(401); res.end('{}'); return; }
  const f = files[url];
  if (!f) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': f[1] }); res.end(readFileSync(PUB + '/ontology-game/' + f[0]));
}).listen(4573);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
await ctx.route('https://cdnjs.cloudflare.com/**', (r) => r.fulfill({ body: readFileSync(NM + 'three/build/three.min.js'), contentType: 'application/javascript' }));
const errors = [];
let passes = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (c) passes++; else { fails++; process.exitCode = 1; } };
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/401|Unauthorized/.test(m.text())) errors.push('console: ' + m.text()); });
const B = 'http://localhost:4573';
const sees = (sel) => page.locator(sel).first().isVisible();
const C = (fn, a) => page.evaluate(fn, a);
const ch = () => C(() => window.__oagCave.room.charge());
const phase = () => C(() => window.__oagCave.room.state.phase);
const run = () => C(() => window.__oagCave.room.run());
const settle = () => page.waitForTimeout(700);
// Answers the open daemon's question set (daemons/questions.js) to its end: a boss question gets the given pick, the rest words.
const answerSet = async (boss) => {
  const seen = [];
  while (await C(() => !!window.__oagCave.room.state.active[0].asking)) {
    const step = await page.locator('[data-room-ask-step]').count() ? await page.locator('[data-room-ask-step]').textContent() : '';
    seen.push(step);
    if (await page.locator('[data-room-ask-boss]').count()) await page.locator(`[data-room-ask-boss="${boss}"]`).click();
    else await page.locator('[data-room-ask-line]').fill('answer ' + seen.length);
    await page.locator('[data-room-ask-done]').click();
  }
  return seen;
};

// Opens the room on its own (as the body map does), calm so the door answers at once, and walks in to Witness.
const openRoom = async (o) => {
  await page.goto(B + '/ontology-game/cave/');
  await C(() => localStorage.setItem('oag.tutorial.v1', '["walk","look","tap","rug","doors"]')); // the Arrival's lessons are cave-test's
  await C((opts) => { window.__left = null; window.__oagCave.openRoom(opts).then((r) => { window.__left = r; }); }, o || { from: 'body' });
  await page.locator('[data-room-welcome]').waitFor({ timeout: 30000 });
  await page.locator('[data-room-calm]').click();
  await C(() => window.__oagCave.room.speed(4));
};
const welcomeIn = async () => { await page.locator('[data-room-welcome]').click(); await page.waitForFunction(() => ['witness', 'shadow', 'flood'].includes(window.__oagCave.room.state.phase), null, { timeout: 30000 }); };
const witnessToFork = async (name, element) => {
  if (!(await page.locator('[data-room-texture][aria-pressed="true"]').count())) await page.locator('[data-room-texture="tension"]').click();
  await page.locator('[data-room-next]').click();
  await page.locator('[data-room-name]').fill(name);
  await page.locator(`[data-room-element="${element}"]`).click();
  await page.locator('[data-room-next]').click();
  for (let i = 0; i < 4; i++) await page.locator('[data-room-next]').first().click(); // allow, accept, appreciate, validate
};

// ---- the first signal: aware of it, and can't perceive it ------------------------------------------------------------------
await openRoom();
await welcomeIn();
await settle();
const clear = await ch();
ok((await phase()) === 'witness' && clear.polarity === 0 && clear.veil === 0, 'a creature comes in clear: polarity 0, no veil');
ok(await sees('[data-room-cant-feel]') && (await page.locator('[data-room-cant-feel]').textContent()) === "I know it's here, but I can't feel it", "Witness offers \"I know it's here, but I can't feel it\"");
await page.locator('[data-room-cant-feel]').click();
let c = await ch();
ok((await phase()) === 'shadow' && c.polarity === 6 && c.signals.join() === 'aware', 'saying so raises the shadow: polarity 6, from the aware signal');
const kinds = await page.locator('[data-room-shadow]').evaluateAll((bs) => bs.map((b) => b.getAttribute('data-room-shadow')));
ok(kinds.join() === 'forgetting,distracting,dissociating,numbness,unknown', 'the player names one of the four shadows, or says they can\'t tell');
ok(!(await sees('[data-room-shadow-numb]')), 'with no numb texture, the numbness note does not show');
await page.locator('[data-room-shadow="forgetting"]').click();
ok((await phase()) === 'unveil' && (await page.locator('[data-room-practice-ask]').textContent()).includes('three times'), 'Forgetting\'s practice: say its name out loud, slowly, three times');
await page.locator('[data-room-shrink]').click(); // look at the room
await settle();
c = await ch();
ok(c.veil > 0.2 && c.opacity < clear.opacity * 0.6, `polarity hides it: a veil (${c.veil.toFixed(2)}) and its body faint (${c.opacity.toFixed(2)} from ${clear.opacity.toFixed(2)})`);
await page.screenshot({ path: SHOTS + '/shadow-forgetting.png' });
await page.locator('[data-room-pane]').click();
await page.locator('[data-room-practice]').click();
ok((await ch()).polarity === 3 && (await page.locator('[data-room-polarity-read]').textContent()).includes('Hidden 3 of 10, by forgetting'), 'each practice thins it by 3');
await page.locator('[data-room-practice]').click();
ok((await ch()).polarity === 0 && await sees('[data-room-unveiled]'), 'twice, and it is in plain sight');
await page.locator('[data-room-next]').click();
await settle();
c = await ch();
ok((await phase()) === 'witness' && c.veil === 0 && Math.abs(c.opacity - clear.opacity) < 0.05, 'back at Witness, unveiled: no veil, its body as it came in');
const r1 = (await run()).rounds[0];
ok(r1.shadow && r1.shadow.kind === 'forgetting' && r1.shadow.start === 6 && r1.shadow.polarity === 0 && r1.shadow.practices === 2 && r1.shadow.signals.join() === 'aware', 'the run records the shadow: its kind, where it started, where it is, the practices and the signal');

// ---- numbness, twice: the texture and the shadow; going on veiled; a veiled spirit -------------------------------------
await openRoom();
await welcomeIn();
await page.locator('[data-room-texture="numbness"]').click();
await page.locator('[data-room-cant-feel]').click();
ok(await sees('[data-room-shadow-numb]'), 'with the numb texture, the shadow page names the overlap');
ok((await page.locator('[data-room-shadow]').first().getAttribute('data-room-shadow')) === 'numbness', 'and puts Numbness first');
await page.locator('[data-room-shadow="numbness"]').click();
ok(await page.locator('[data-room-practice]').isDisabled() && await sees('[data-room-practice-line]'), 'Numbness\'s practice asks where feeling starts again, before Done');
await page.locator('[data-room-shrink]').click(); await settle();
c = await ch();
ok(c.shadow === 'numbness' && c.veil > 0.35, `the numbness shadow wraps it in a thicker grey fog (${c.veil.toFixed(2)})`);
await page.screenshot({ path: SHOTS + '/shadow-numbness.png' });
await page.locator('[data-room-pane]').click();
// shadow spirits (Wendell, 14 October 2026): what's in the way of it clearing, and the daemons' questions
await page.locator('[data-room-shadow-spirit]').click();
const asks = await page.locator('[data-room-ask]').evaluateAll((bs) => bs.map((b) => b.getAttribute('data-room-ask')));
ok((await phase()) === 'asks' && asks.join() === 'protector,controller,skeptic,fixer,emotional-body,victim,damaged-self,player', "asking what's in the way of it clearing offers the eight questions, one for each daemon and the Player");
await settle();
c = await ch();
ok(c.shade && c.shade.visible && c.shade.color === 0x4a3a5c, 'a shadow spirit appears beside it: the same body, in the shadow\'s colour');
await page.locator('[data-room-ask="player"]').click();
ok((await page.locator('[data-room-ask-q]').textContent()).includes('hide and seek') && await page.locator('[data-room-ask-done]').isDisabled(), "the Player's question waits for what the shadow spirit says");
ok((await page.locator('[data-room-ask-step]').textContent()) === 'What are you learning?', "picking the Player opens its own question set (daemons/questions.js), a question at a time");
await page.locator('[data-room-ask-line]').fill('it likes being found only by the right person');
await page.locator('[data-room-ask-done]').click();
ok((await page.locator('[data-room-ask-step]').textContent()).includes('How are you growing?') && (await ch()).polarity === 6, 'one answer moves to the next question; the shadow holds until the set is done');
const playerSteps = await answerSet();
c = await ch();
ok(playerSteps.length === 5 && c.polarity === 3 && c.asks.length === 1 && c.asks[0].daemon === 'player' && c.asks[0].answers.length === 6 && c.asks[0].answer === 'it likes being found only by the right person' && (await page.locator('[data-room-ask="player"]').getAttribute('aria-pressed')) === 'true', 'an answered set thins the shadow by 3, once, and every answer is kept');
await page.screenshot({ path: SHOTS + '/shadow-spirit.png' });
await page.locator('[data-room-ask-leave]').click();
await page.locator('[data-room-veiled]').click();
ok((await phase()) === 'witness' && (await ch()).polarity === 3 && (await page.locator('[data-room-cant-feel]').textContent()) === 'Work with what hides it', 'the player can go on with it hidden; Witness keeps a way back to the practice');
await page.locator('[data-room-next]').click();
await page.locator('[data-room-name]').fill('the blank');
await page.locator('[data-room-element="Sadness"]').click();
await page.locator('[data-room-next]').click();
ok((await phase()) === 'allow' && (await page.locator('[data-room-polarity]').getAttribute('data-room-polarity')) === '3' && (await page.locator('[data-room-polarity]').textContent()).includes('3 of 10, numbness'), 'Allow reads polarity beside size and brightness');
ok((await page.locator('input[data-room-polarity]').count()) === 0 && (await page.locator('[data-room-allow-slider]').count()) === 2, 'polarity is a reading, not a slider: only the shadow raises it');
for (let i = 0; i < 4; i++) await page.locator('[data-room-next]').first().click();
await page.locator('[data-room-goal]').fill('to feel my hands again');
await page.locator('[data-room-push="away"]').click();
await page.locator('[data-room-exhale]').click();
await page.locator('[data-room-gone]').waitFor({ timeout: 30000 });
await page.locator('[data-room-next]').click();
await page.locator('[data-room-checkin="left"]').click();
ok(!(await sees('[data-room-not-down]')), 'a charge with no reading does not raise the second signal');
await page.locator('[data-room-again="no"]').click();
await page.locator('[data-room-leave]').click();
await page.waitForFunction(() => window.__left, null, { timeout: 15000 });
const left = await C(() => window.__left);
ok(left.spirits.length === 2 && left.spirits[0].polarity === 3, 'it leaves as a spirit still veiled, carrying its polarity');
ok(left.spirits[1].hex === 0x4a3a5c && left.spirits[1].shadow === 'numbness' && left.spirits[1].name === 'Numbness of the blank', 'its shadow spirit walks out beside it, a spirit in the shadow\'s colour');
ok(left.spirits[1].element === null && !left.spirits[1].revealed, 'while its shadow stands, the shadow spirit has no element, so it cannot be dissolved yet');

// ---- the second signal: the charge would not come down -------------------------------------------------------------------
await openRoom();
await welcomeIn();
await witnessToFork('the knot', 'Fear');
await page.locator('[data-room-goal]').fill('to speak up at the meeting');
await page.locator('[data-room-push="toward"]').click();
await page.locator('[data-cave-321-skip]').click();
await C(() => { const t = window.__oagCave.room.state.active[0].t321; t.before = 5; t.after = 6; }); // the reading after is no lower
await page.locator('[data-room-move]').fill('write the first sentence');
await page.locator('[data-room-move-done]').click();
await page.locator('[data-room-kept]').waitFor({ timeout: 15000 });
await page.locator('[data-room-next]').click();
await page.locator('[data-room-checkin="stayed"]').click();
ok(await sees('[data-room-not-down]') && (await page.locator('[data-room-not-down]').textContent()).includes('6 of 10 after, from 5 before'), 'a round whose charge did not come down says so at its end');
await page.locator('[data-room-look-again]').click();
ok((await page.locator('[data-room-prompt] + p').textContent()).includes('The part of the knot that stayed hidden'), 'the hidden part of it comes to the door');
await welcomeIn();
c = await ch();
ok((await phase()) === 'shadow' && c.polarity === 4 && c.signals.join() === 'not-down' && c.hiddenOf === 'the knot', 'it comes in already shadowed: polarity 4 from the second signal, and names its shadow first');
await page.locator('[data-room-shadow="distracting"]').click();
ok(await page.locator('[data-room-practice]').isDisabled(), 'Distracting\'s practice asks what pulled the player away');
await page.locator('[data-room-practice-line]').fill('my phone');
await page.locator('[data-room-practice]').click();
ok((await ch()).polarity === 1, 'one practice: 4 down to 1');
await page.locator('[data-room-shrink]').click(); await settle();
const xs = []; for (let i = 0; i < 4; i++) { xs.push(await C(() => window.__oagCave.room.state.active[0].fig.userData.body.position.x)); await page.waitForTimeout(250); }
ok(Math.max(...xs) - Math.min(...xs) > 0.01, 'Distracting makes it drift aside');
const rs = (await run()).rounds;
ok(rs[0].reading && rs[0].reading.before === 5 && rs[0].reading.after === 6 && rs[1].hiddenOf === 'the knot' && rs[1].shadow.kind === 'distracting' && rs[1].shadow.signals.join() === 'not-down', 'the run keeps the readings and the hidden part\'s shadow');

// ---- the board's charge would not come down ------------------------------------------------------------------------------
await page.goto('about:blank'); // a hash alone would not reload the page
await page.goto(B + '/ontology-game/cave/#wave=board&charge=' + encodeURIComponent('Tap the Vein') + '&skips=2&ref=tap-the-vein--shadow&date=2026-10-14');
await page.locator('[data-room="board"]').waitFor({ timeout: 30000 });
await page.locator('[data-room-calm]').click(); await C(() => window.__oagCave.room.speed(4));
await page.locator('[data-room-heat-before="5"]').click();
await welcomeIn();
await witnessToFork('the dread', 'Fear');
await page.locator('[data-room-goal]').fill('to write');
await page.locator('[data-room-push="away"]').click();
await page.locator('[data-room-exhale]').click();
await page.locator('[data-room-gone]').waitFor({ timeout: 30000 });
await page.locator('[data-room-next]').click();
await page.locator('[data-room-checkin="left"]').click();
await page.locator('[data-room-again="no"]').click();
ok(!(await sees('[data-room-not-down]')), 'at the end, before the charge left is given, nothing is said');
await page.locator('[data-room-heat-after="5"]').click();
ok(await sees('[data-room-not-down]') && (await page.locator('[data-room-not-down]').textContent()).includes('5 of 10 left, from 5'), 'the board\'s charge left no lower than before offers to look again');
await page.locator('[data-room-look-again]').click();
await welcomeIn();
ok((await phase()) === 'shadow' && (await ch()).polarity === 4, 'and its hidden part comes in shadowed');

// ---- the other pole: flooding (ps-polarity-poles, his answer "two") --------------------------------------------------------
await openRoom();
await welcomeIn();
await settle();
const calm0 = await ch();
ok(await sees('[data-room-too-much]') && (await page.locator('[data-room-too-much]').textContent()) === "It's too much to be with", "Witness also offers \"It's too much to be with\"");
await page.locator('[data-room-too-much]').click();
c = await ch();
ok((await phase()) === 'flood' && c.polarity === -6 && c.signals.join() === 'too-much', 'saying so floods it: polarity -6, the other pole');
ok((await page.locator('[data-room-polarity-read]').textContent()).includes('Flooding 6 of 10') && (await page.locator('[data-room-practice-ask]').textContent()).includes('Breathe out for longer'), 'the flooding page reads its level and gives the first practice that turns it down');
await page.locator('[data-room-shrink]').click(); await page.waitForTimeout(1500);
c = await ch();
ok(c.scale > calm0.scale * 1.4 && c.glow > 0.5 && c.veil > 0.1, `flooding grows it past its size (×${(c.scale / calm0.scale).toFixed(2)}), blazes its aura (${c.glow.toFixed(2)}) and glares in its colour`);
await page.screenshot({ path: SHOTS + '/shadow-flooding.png' });
await page.locator('[data-room-pane]').click();
await page.locator('[data-room-practice]').click();
ok((await ch()).polarity === -3 && (await page.locator('[data-room-practice-ask]').textContent()).includes("isn't it"), 'each practice turns it down by 3, and the next practice follows');
await page.locator('[data-room-veiled]').click();
ok((await phase()) === 'witness' && (await page.locator('[data-room-too-much]').textContent()) === 'Turn it down' && !(await sees('[data-room-cant-feel]')), 'going on while it floods, Witness keeps "Turn it down" and does not offer the hidden pole');
await page.locator('[data-room-texture="strength"]').click();
await page.locator('[data-room-next]').click();
await page.locator('[data-room-name]').fill('the surge');
await page.locator('[data-room-element="Anger"]').click();
await page.locator('[data-room-next]').click();
ok((await page.locator('[data-room-polarity]').textContent()) === 'Flooding 3 of 10' && (await page.locator('[data-room-polarity]').getAttribute('data-room-polarity')) === '-3', 'Allow reads the flooding pole beside size and brightness');
for (let i = 0; i < 4; i++) await page.locator('[data-room-next]').first().click();
await page.locator('[data-room-goal]').fill('to say no calmly');
await page.locator('[data-room-push="toward"]').click();
await page.locator('[data-cave-321-skip]').click();
await C(() => { const t = window.__oagCave.room.state.active[0].t321; t.before = 9; t.after = 9; }); // stuck at the top
await page.locator('[data-room-move]').fill('say it in one line');
await page.locator('[data-room-move-done]').click();
await page.locator('[data-room-kept]').waitFor({ timeout: 15000 });
await page.locator('[data-room-next]').click();
await page.locator('[data-room-checkin="stayed"]').click();
ok((await page.locator('[data-room-not-down]').getAttribute('data-room-not-down')) === 'flood' && (await page.locator('[data-room-look-again]').textContent()) === 'Look again at what floods it', 'a charge stuck at 9 or more points the second signal at flooding, not hiding');
const fr = (await run()).rounds[0];
ok(fr.shadow.pole === 'flooding' && fr.shadow.kind === null && fr.shadow.polarity === -3 && fr.shadow.start === -6, 'the run records the flooding pole, where it started and where it is');
await page.locator('[data-room-look-again]').click();
await welcomeIn();
await page.waitForFunction(() => window.__oagCave.room.state.phase === 'flood', null, { timeout: 30000 });
ok((await ch()).polarity === -7, 'its part comes in flooding: the -3 it carried and 4 more');

// ---- a shadow spirit fully revealed shows its element (Wendell, board read 14 October 2026) -----------------------------------
await openRoom();
await welcomeIn();
await page.locator('[data-room-cant-feel]').click();
await page.locator('[data-room-shadow="forgetting"]').click();
await page.locator('[data-room-shadow-spirit]').click();
await page.locator('[data-room-ask="skeptic"]').click();
await answerSet('controller');
c = await ch();
ok(c.polarity === 3 && c.asks[0].boss === 'controller' && (await page.locator('[data-room-ask-chain]').getAttribute('data-room-ask-chain')) === 'controller' && (await page.locator('[data-room-ask-chain-line]').textContent()) === 'The Skeptic works for the Controller.', 'the Skeptic says it works for the Controller, and the room offers the Controller next');
await page.locator('[data-room-ask-chain]').click();
const ctrlSteps = await answerSet('protector');
ok(ctrlSteps.includes('The Controller: How are you protecting the physical body by controlling?'), "the Controller's follow-up changes with the boss it names");
ok((await ch()).polarity === 0 && await sees('[data-room-shade-reveal]') && (await page.locator('[data-room-ask]').count()) === 0, 'two answered sets clear the shadow, and the fully revealed shadow spirit asks for its element');
await page.locator('[data-room-shade-element="Anger"]').click();
c = await ch();
ok(c.shade.element === 'Anger' && (await run()).rounds[0].shadow.shadeElement === 'Anger', 'the player names its element, and the run keeps it');
await page.locator('[data-room-ask-leave]').click();
await witnessToFork('the slip', 'Sadness');
await page.locator('[data-room-goal]').fill('to remember it');
await page.locator('[data-room-push="away"]').click();
await page.locator('[data-room-exhale]').click();
await page.locator('[data-room-gone]').waitFor({ timeout: 30000 });
await page.locator('[data-room-next]').click();
await page.locator('[data-room-checkin="left"]').click();
await page.locator('[data-room-again="no"]').click();
await page.locator('[data-room-leave]').click();
await page.waitForFunction(() => window.__left, null, { timeout: 15000 });
const shown = (await C(() => window.__left)).spirits[1];
ok(shown.element === 'Anger' && shown.revealed && shown.polarity === 0 && shown.hex === 0x954d43, 'it walks out revealed with its element, its colour halfway from the shadow\'s to Anger\'s, so it can be dissolved');

ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
console.log(`${passes} passed, ${fails} failed`);
await browser.close();
server.close();
