import http from 'node:http';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
// Browser checks for the site build of the Ontology Alchemy Game, including the council's two
// falsification tests (6FACE_PASS1_2026-10-06.md). Build first with `npm run build:ontology-game`,
// then copy this file into a folder that has playwright, react@18.2.0 and react-dom@18.2.0
// installed and run it there:
//   OAG_PUBLIC=/path/to/bars-engine/public node browser-test.mjs
// React is served from that folder's copies because the test browser may not reach cdnjs.
const PUB = process.env.OAG_PUBLIC || new URL('../../public', import.meta.url).pathname;
const NM = new URL('./node_modules/', import.meta.url).pathname;
const server = http.createServer((req, res) => {
  const p = req.url.split('?')[0];
  if (p === '/ontology-game' || p === '/ontology-game/wave' || p === '/ontology-game/index.html') {
    res.writeHead(200, { 'content-type': 'text/html' }); res.end(readFileSync(PUB + '/ontology-game/index.html')); return;
  }
  res.writeHead(404); res.end();
}).listen(4567);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
await ctx.addInitScript(() => { window.__breathScale = 0.01; });
await ctx.route('https://cdnjs.cloudflare.com/**', (route) => {
  const u = route.request().url();
  const f = u.includes('react-dom') ? NM + 'react-dom/umd/react-dom.production.min.js' : NM + 'react/umd/react.production.min.js';
  route.fulfill({ body: readFileSync(f), contentType: 'application/javascript' });
});
const errors = [];
const page = await ctx.newPage();
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) process.exitCode = 1; };
const B = 'http://localhost:4567';
const clickText = (t) => page.getByText(t, { exact: true }).first().click();
const STEPS = ['welcome', 'acknowledge', 'allow', 'accept', 'appreciate', 'validate'];
const waveFrom = async (pg, from, exhale = 'release') => {
  for (const id of STEPS.slice(STEPS.indexOf(from))) await pg.locator(`[data-wave-step="${id}"] [data-wave-continue]`).click();
  await pg.locator(`[data-wave-exhale="${exhale}"]`).click();
};
const waveTo = async (pg, to) => {
  for (const id of STEPS.slice(0, STEPS.indexOf(to))) await pg.locator(`[data-wave-step="${id}"] [data-wave-continue]`).click();
  await pg.locator(`[data-wave-step="${to}"]`).waitFor();
};
const gs = (pg) => pg.evaluate(() => JSON.parse(JSON.stringify(window.__gameState)));
const scan = async (pg, where, tex) => {
  await pg.getByPlaceholder("e.g., 'my throat', 'my solar plexus', 'behind my sternum'").fill(where);
  await pg.locator('select').selectOption(tex);
  await pg.getByText('This is it', { exact: true }).first().click();
};
const fillJob = async (pg) => {
  for (const el of await pg.locator('[data-channel-job]').all()) await el.fill('it is doing its job');
};
// Block work in the sketch's four steps (6FACE_PASS3_2026-10-07): sensation is the scan before
// this; then element and its EA practice, the daemon and its job, the six game masters' gate, Release.
const workBlock = async (pg, channel, face, daemon = 'protector') => {
  await pg.locator(`[data-demo-key="channel-${channel}"]`).click();
  await fillJob(pg);
  await pg.locator('[data-block-practice]').click();
  await pg.locator('[data-open-up-done]').click();
  await pg.locator('[data-clean-up-done]').click();
  await pg.locator(`[data-daemon="${daemon}"]`).click();
  await pg.locator('[data-daemon-aside="yes"]').click();
  await pg.locator('[data-daemon-continue]').click();
  await pg.locator(`[data-demo-key="face-${face}"]`).click();
  await pg.getByText('Yes, this is true', { exact: true }).click();
  await pg.getByText('Ready to notice', { exact: true }).click();
  await pg.getByText('Yes, something shifted', { exact: true }).click();
  await pg.locator('[data-block-release]').click();
};
const holdBelief = async (pg, channel, face) => {
  if (channel) await pg.locator(`[data-demo-key="channel-${channel}"]`).click();
  await fillJob(pg);
  await pg.locator(`[data-demo-key="face-${face}"]`).click();
  await pg.getByText('Yes, this is true', { exact: true }).click();
  await pg.getByText('Ready to notice', { exact: true }).click();
};

await page.goto(B + '/ontology-game');
await page.getByText('Ontology Alchemy Game').first().waitFor();
ok(await page.getByRole('button', { name: 'Begin with W.A.V.E.' }).count() === 1 && await page.getByRole('button', { name: 'Begin Practice' }).count() === 0,
  'every cycle begins with W.A.V.E. (oag-main-order)');
ok(await page.locator('.debug-toggle').count() === 0, 'debug toggle hidden on site');
ok(await page.getByText('Interactive Walkthrough').count() === 0, 'claude.ai walkthrough links hidden on site');
await page.screenshot({ path: (process.env.OAG_SHOTS || '.') + '/shot-entry.png', fullPage: true });

await page.getByRole('button', { name: 'Begin with W.A.V.E.' }).click();
ok(await page.getByText('Opening practice — W.A.V.E.').count() === 1, 'phase 1 opens with W.A.V.E.');
ok(await page.locator('.breath-pacer').count() === 1, 'each W.A.V.E. step paces one breath');
await waveFrom(page, 'welcome', 'release');
await page.getByPlaceholder("e.g., 'my throat', 'my solar plexus', 'behind my sternum'").fill('my chest');
await page.locator('select').selectOption('tension');
await clickText('This is it');
await page.locator('[data-demo-key="channel-Anger"]').click();
ok(await page.locator('[data-faces-primer]').count() === 1 && /Order/.test(await page.locator('[data-demo-key="face-Amber"]').textContent()),
  'first face pick opens with the primer and plain labels');
ok(/obstacles to be overcome/.test(await page.locator('[data-channel-job-section="Anger"]').textContent()), 'Anger asks how it is doing its job');
await page.locator('[data-demo-key="face-Amber"]').click({ force: true });
ok((await gs(page)).phase === 'phase3', 'a face cannot be picked before the job is answered');
await page.locator('[data-channel-job="0"]').fill('my boss keeps moving the deadline');
await page.locator('[data-demo-key="face-Amber"]').click();
await clickText('Yes, this is true');
await clickText('Ready to notice');
const firstOpen = await page.locator('.options-grid .option-card strong').first().textContent();
ok(firstOpen === 'W.A.V.E.', 'Open Up picker lists W.A.V.E. first');
await page.locator('[data-demo-key="open-choice-wave"]').click();
await waveFrom(page, 'welcome', 'stay');
await clickText('Yes, something shifted');
await page.locator('[data-demo-key="state-confirm-satisfied"]').click();
await clickText("No, that's all of it");
ok(await page.getByText('Where next?').count() === 1, 'reached phase 6');
// Flow forward keeps WAVE as opener
await page.locator('[data-demo-key="phase6-flow-forward"]').click();
ok(await page.getByText('Opening practice — W.A.V.E.').count() === 1, 'flow-forward scan keeps W.A.V.E.');
await waveFrom(page, 'welcome', 'stay');
await clickText('Nothing here');
await page.getByText('Also share this cycle with your coach').click();
await clickText('Complete This Cycle');
ok(await page.getByText('When you share, you get a code to send your coach.', { exact: false }).count() === 1, 'share screen explains the code');
await clickText('Share this cycle');
const ta = page.locator('textarea[readonly]');
await ta.waitFor();
const code = await ta.inputValue();
ok(code.startsWith('OAG1.'), 'coach code shown after sharing (' + code.length + ' chars)');
await page.screenshot({ path: (process.env.OAG_SHOTS || '.') + '/shot-done.png', fullPage: true });

await page.reload();
await page.getByText('Ontology Alchemy Game').first().waitFor();
ok(await page.getByText(/Welcome back\. You've completed 1 cycle/).count() === 1, 'welcome-back after reload');
ok(await page.locator('.wuxing-node.lit').count() === 1, 'wuxing wheel lights Anger');
await page.getByText('Coach? View a shared summary').click();
await page.getByPlaceholder('Paste the code here').fill(code);
await clickText('View Summary');
await page.getByText(/cycle shared/).waitFor();
ok(await page.getByText(/Anger \(Amber\)/).count() >= 1, 'coach view decodes the code');
await page.screenshot({ path: (process.env.OAG_SHOTS || '.') + '/shot-coach.png', fullPage: true });

// fresh context: /wave link
const page2 = await ctx.newPage();
page2.on('pageerror', e => errors.push('pageerror2: ' + e.message));
await page2.goto(B + '/ontology-game/wave');
await page2.getByRole('button', { name: 'Begin with W.A.V.E.' }).waitFor();
ok(await page2.getByRole('button', { name: 'Begin with W.A.V.E.' }).count() === 1, '/wave link: single WAVE begin button');
await page2.getByRole('button', { name: 'Begin with W.A.V.E.' }).click();
ok(await page2.getByText('Opening practice — W.A.V.E.').count() === 1, '/wave link opens with W.A.V.E.');

// Random mode: switch link
const page3 = await ctx.newPage();
await page3.addInitScript(() => { window.__forcePracticeId = 'grounding'; });
await page3.goto(B + '/ontology-game');
await page3.getByRole('button', { name: 'Begin with W.A.V.E.' }).click();
ok(await page3.getByText('Opening practice — 5-4-3-2-1 Grounding').count() === 1, 'random roll still works (forced grounding)');
await page3.getByText('Use W.A.V.E. instead').click();
ok(await page3.getByText('Opening practice — W.A.V.E.').count() === 1, 'switch link swaps to W.A.V.E.');

// Demo full run via skip
const page4 = await ctx.newPage();
page4.on('pageerror', e => errors.push('pageerror4: ' + e.message));
await page4.goto(B + '/ontology-game');
await page4.getByText('Try a guided demo first').click();
for (let i = 0; i < 60; i++) {
  if (await page4.getByText('Demo complete').count()) break;
  await page4.getByText('Skip this step').click();
  await page4.waitForTimeout(30);
}
ok(await page4.getByText('Demo complete').count() === 1, 'guided demo runs to the end');
ok(await page4.getByText('Cycle Complete').count() === 1, 'demo lands on Cycle Complete');

// Falsification test 2 (6FACE_PASS1_2026-10-06): the map after the guided demo.
ok(await page4.locator('[data-route-map]').count() === 1, 'map leads Cycle Complete');
const stopsAttr = await page4.locator('svg.route-map').getAttribute('data-map-stops');
ok(stopsAttr === 'Anger,Fear,Sadness,Joy', 'map stops in demo order (' + stopsAttr + ')');
ok(/Its job here: “Getting it wrong in front of everyone; Close: the meeting is tomorrow”/.test(await page4.locator('[data-route-list]').textContent()),
  'route list carries how each channel did its job');
ok(await page4.locator('path[data-map-move="ke"][data-from="Anger"][data-to="Fear"]').count() === 1, 'map draws Tempering Anger to Fear dashed');
ok(await page4.locator('path[data-map-move="sheng"][data-from="Fear"][data-to="Sadness"]').count() === 1, 'map draws Flow Forward Fear to Sadness solid');
ok(await page4.locator('[data-map-deeper="Joy"]').count() === 1, 'map rings Go Deeper on Joy');
const items = await page4.locator('[data-route-list] > li').allTextContents();
ok(items.length === 4 && items[0].startsWith('Anger') && /Tempered toward Fear/.test(items[0]) && items[3].startsWith('Joy'),
  'route list names first channel, the move out, and the last channel: ' + JSON.stringify(items));
const dl = page4.waitForEvent('download');
await page4.locator('[data-save-map]').click();
const download = await dl;
ok(download.suggestedFilename() === 'ontology-game-map.png', 'map saves as a PNG');
// Falsification test 4 (6FACE_PASS2_2026-10-06): the trip ends where it began.
ok(await page4.locator('[data-trailhead-return]').count() === 1, 'Cycle Complete opens with the way back to the start');
await page4.locator('[data-trailhead-answer="same"]').click();
ok(await page4.locator('[data-map-trailhead="same"]').count() === 1, 'the answer shows on the map as a flag');
await page4.screenshot({ path: (process.env.OAG_SHOTS || '.') + '/shot-map.png', fullPage: true });

// Falsification test 1: block on Accept, block on Welcome inside it, return to each.
const p5 = await ctx.newPage();
p5.on('pageerror', e => errors.push('pageerror5: ' + e.message));
await p5.goto(B + '/ontology-game/wave');
await p5.getByRole('button', { name: 'Begin with W.A.V.E.' }).click();
ok(await p5.locator('[data-start-words]').count() === 0, 'the first W.A.V.E. opens up before asking what to work on (oag-wave-first)');
await waveTo(p5, 'appreciate');
await p5.locator('[data-appreciate-input]').fill('it kept me careful');
await waveFrom(p5, 'appreciate', 'release');
ok(await p5.locator('[data-dig-in]').count() === 1, 'after the first W.A.V.E. the player digs into what to work on');
await p5.locator('[data-start-words]').fill('the call with my sister');
await scan(p5, 'my chest', 'tension');
await holdBelief(p5, 'Anger', 'Amber');
await p5.locator('[data-demo-key="open-choice-wave"]').click();
await waveTo(p5, 'accept');
const outer = await gs(p5);
await p5.locator('[data-wave-step="accept"] [data-wave-block]').click();
let st = await gs(p5);
ok(st.phase === 'phase-wave-block' && st.blockDepth === 1, 'block on Accept opens the block screen');
ok(await p5.locator('[data-block-frame="self-sabotage"]').count() === 1, 'block screen offers the self-sabotage frame');
ok(/Accept with tension in my chest \(Anger\)/.test(await p5.locator('[data-block-what]').textContent()), 'block screen names exactly what was blocked');
await p5.locator('[data-block-words]').fill("I can't accept it");
await p5.locator('[data-size-slider="before"]').fill('7');
await p5.locator('[data-block-work]').click();
ok((await p5.locator('#trail-start').textContent()).includes('my chest') && (await p5.locator('#trail-start').textContent()).includes('the call with my sister'),
  'trail names where the trip started');
ok((await p5.locator('#block-trail').textContent()).includes('back to Accept'), 'trail bar shows the way back to Accept');
await p5.screenshot({ path: (process.env.OAG_SHOTS || '.') + '/shot-block.png', fullPage: true });
await p5.locator('[data-wave-step="welcome"] [data-wave-block]').click();
st = await gs(p5);
ok(st.blockDepth === 2 && JSON.stringify(st.blockSteps) === '["accept","welcome"]', 'block on Welcome nests inside');
await p5.locator('[data-block-skip-frame]').click();
ok(await p5.locator('[data-block-frame="plain"]').count() === 1, 'frame can be skipped');
await p5.locator('[data-block-work]').click();
// Falsification test 3 (6FACE_PASS2_2026-10-06): two blocks deep, the page still says where the trip began.
const deep = await p5.locator('#oag-trail').textContent();
ok(deep.includes('my chest') && deep.includes('the call with my sister') && deep.includes('back to Welcome, then to Accept'),
  'two blocks deep, the trail names the start and the way back: ' + deep);
ok(await p5.evaluate(() => { const l = document.getElementById('pause-link'); if (!l) return false; const r = l.getBoundingClientRect();
  return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === l; }), 'pause link stays visible under the trail');
await waveFrom(p5, 'welcome', 'release');
await scan(p5, 'my belly', 'numbness');
await workBlock(p5, 'Fear', 'Orange', 'skeptic');
st = await gs(p5);
ok(st.phase === 'phase1' && st.waveStep === 'welcome' && st.blockDepth === 1 && st.selectedChannel === null,
  'inner block returns to Welcome inside the first block work');
await waveFrom(p5, 'welcome', 'release');
await scan(p5, 'my throat', 'constriction');
await workBlock(p5, 'Sadness', 'Teal');
st = await gs(p5);
ok(st.phase === 'phase-open-active' && st.openTechnique === 'wave' && st.blockDepth === 0, 'outer block returns to the open W.A.V.E.');
ok(await p5.locator('[data-wave-step="accept"]').count() === 1, 'lands back on Accept');
ok((await p5.locator('[data-block-came-back="accept"]').textContent()).includes("I can't accept it"), 'Accept shows what was in the way');
await p5.locator('[data-size-slider="after"]').fill('3');
ok(st.selectedChannel === outer.selectedChannel && st.selectedFace === outer.selectedFace && st.selectedChannel === 'Anger'
  && st.incomingState === outer.incomingState && st.resolvedThreads.length === 0,
  'outer channel, face and charge unchanged (' + st.selectedChannel + ' / ' + st.selectedFace + ')');
const beliefAfter = await p5.evaluate(() => document.querySelector('[data-wave-step]') && window.__gameState.phase);
ok(await p5.locator('#block-trail').count() === 0, 'trail bar gone after the last return');
await p5.locator('[data-wave-step="accept"] [data-wave-stop]').click();
st = await gs(p5);
ok(st.openWaveLevel === 'allow' && (await p5.locator('[data-wave-step="validate"]').count()) === 1, 'stopping at a rung completes the ladder from Validate');
await waveFrom(p5, 'validate', 'stay');
await p5.getByText('Yes, something shifted', { exact: true }).click();
await p5.locator('[data-demo-key="state-confirm-satisfied"]').click();
await p5.getByText("No, that's all of it", { exact: true }).click();
await p5.getByText('Complete This Cycle', { exact: true }).click();
ok(await p5.locator('[data-map-block]').count() === 2, 'map draws a loop for each block (' + await p5.locator('[data-map-block]').count() + ')');
await p5.locator('[data-trailhead-answer="shifted"]').click();
ok(await p5.locator('[data-map-trailhead="shifted"]').count() === 1, 'trailhead flag shows the answer');
const notes = await p5.locator('[data-route-notes] > li').allTextContents();
// Falsification test 5: size before and after, an unmoved slider shows nothing, words kept on screen.
ok(notes.some(n => n === "Accept was blocked by “I can't accept it”. Its size went from 7 to 3.")
  && notes.some(n => n === 'Welcome was blocked.') && notes.some(n => n.includes('it kept me careful')),
  'route notes carry the block words, sizes and appreciation: ' + JSON.stringify(notes));
const belief = outer.userBelief;
const stored = await p5.evaluate(() => Object.keys(localStorage).map(k => localStorage.getItem(k)).join('\n'));
ok(belief && !stored.includes(belief), 'belief text never stored');
ok(!stored.includes("accept it") && !stored.includes('my sister') && !stored.includes('kept me careful'), 'block words, start words and appreciation never stored');
ok((await p5.locator('svg.route-map').textContent()).includes(belief.split(' ')[0]), 'belief drawn under the map');
await p5.screenshot({ path: (process.env.OAG_SHOTS || '.') + '/shot-map-blocks.png', fullPage: true });

// Depth reflection at three nested blocks.
const p6 = await ctx.newPage();
await p6.goto(B + '/ontology-game/wave');
await p6.getByRole('button', { name: 'Begin with W.A.V.E.' }).click();
for (let d = 1; d <= 3; d++) {
  await p6.locator('[data-wave-step="welcome"] [data-wave-block]').click();
  ok((await p6.locator('[data-block-depth-reflection]').count()) === (d === 3 ? 1 : 0), 'depth reflection only at three (depth ' + d + ')');
  if (d < 3) await p6.locator('[data-block-work]').click();
}
await p6.locator('[data-block-back]').first().click();
ok((await gs(p6)).blockDepth === 2, 'go back from the block screen returns one level');

// At real breath speed, "Skip the breath" shows the step's continue button at once.
const pSkip = await ctx.newPage();
pSkip.on('pageerror', e => errors.push('pageerrorSkip: ' + e.message));
await pSkip.addInitScript(() => { window.__breathScale = 1; });
await pSkip.goto(B + '/ontology-game');
await pSkip.getByRole('button', { name: 'Begin with W.A.V.E.' }).click();
ok(await pSkip.locator('[data-wave-continue]').count() === 0 && await pSkip.locator('[data-breath-skip]').count() === 1,
  'a real-speed breath hides continue and offers "Skip the breath"');
await pSkip.locator('[data-breath-skip]').click();
ok(await pSkip.locator('[data-wave-continue]').count() === 1 && await pSkip.locator('[data-breath-skip]').count() === 0,
  'skipping the breath shows continue at once');
await pSkip.locator('[data-wave-continue]').click();
ok(await pSkip.locator('[data-breath-skip]').count() === 1, 'the next step paces its own breath and can be skipped too');

// Council pass 3 (6FACE_PASS3_2026-10-07): block work runs in the order of Wendell's sketch.
const p7 = await ctx.newPage();
p7.on('pageerror', e => errors.push('pageerror7: ' + e.message));
p7.on('dialog', d => d.accept());
await p7.goto(B + '/ontology-game/wave');
await p7.getByRole('button', { name: 'Begin with W.A.V.E.' }).click();
await p7.locator('[data-wave-step="welcome"] [data-wave-block]').click();
ok((await p7.locator('[data-block-steps-preview] li').count()) === 4, 'block screen lists the four steps');
ok(!(await gs(p7)).recordOn, 'the record starts switched off');
await p7.locator('[data-record-switch]').check();
await p7.locator('[data-block-words]').fill('I do not want to feel this');
await p7.locator('[data-block-work]').click();
await waveFrom(p7, 'welcome', 'release');
st = await gs(p7);
ok(st.phase === 'phase1' && st.blockStep === 'sensation', 'step 1 is the blocker sensation (' + st.blockStep + ')');
await scan(p7, 'my jaw', 'tension');
await p7.locator('[data-demo-key="channel-Anger"]').click();
st = await gs(p7);
ok(st.phase === 'block-element' && st.blockStep === 'element', 'step 2 is the blocker element');
ok(await p7.locator('[data-demo-key^="face-"]').count() === 0, 'no face is offered before the daemon');
ok(await p7.locator('[data-block-practice]').isDisabled(), 'the EA practice waits for the element\'s job');
await fillJob(p7);
await p7.locator('[data-block-practice]').click();
st = await gs(p7);
ok(st.phase === 'block-open-up' && st.blockStep === 'element', 'the EA practice is the element\'s own Open Up screen');
ok(await p7.locator('[data-wave-step]').count() === 0 && await p7.locator('[data-demo-key^="open-choice-"]').count() === 0,
  'no W.A.V.E. or practice picker after the element\'s job (oag-ea-practice)');
ok(await p7.locator('[data-open-up-steps="happy-apples"] li').count() === 3, 'opening up is Happy Apples, for any channel');
ok(await p7.locator('[data-open-up-work-block]').count() === 0, 'no block to work until one is marked');
await p7.locator('[data-open-up-mark="not-allowed"]').check();
// A marked block opens a block of its own, and its Release comes back to opening up.
await p7.locator('[data-open-up-work-block]').click();
st = await gs(p7);
ok(st.phase === 'phase-wave-block' && st.blockDepth === 2, 'a marked block on opening up is worked as a block inside the block');
await p7.locator('[data-block-work]').click();
await waveFrom(p7, 'welcome', 'release');
await scan(p7, 'my chest', 'constriction');
await workBlock(p7, 'Fear', 'Amber', 'controller');
st = await gs(p7);
ok(st.phase === 'block-open-up' && st.blockDepth === 1
  && st.blockWork.openUpMarks.includes('not-allowed') && (await p7.locator('[data-block-came-back="open-up"]').count()) === 1,
  'Release comes back to opening up, with the tool and the mark kept');
await p7.locator('[data-open-up-done]').click();
st = await gs(p7);
ok(st.phase === 'block-clean-up' && st.blockStep === 'element' && await p7.locator('[data-clean-up-steps="fire-burn"] li').count() === 3,
  'then Anger\'s clean up move, Fire burning it away (oag-open-up-tools, overruled)');
await p7.locator('[data-clean-up-done]').click();
st = await gs(p7);
ok(st.phase === 'block-daemon' && st.blockStep === 'daemon' && st.blockWork.practice === 'fire-burn', 'the clean up leads to step 3, the daemon');
ok(await p7.locator('[data-daemon]').count() === 8, 'seven daemons and "not sure" are offered');
await p7.screenshot({ path: (process.env.OAG_SHOTS || '.') + '/shot-daemon.png', fullPage: true });
await p7.locator('[data-daemon="protector"]').click();
ok((await p7.locator('[data-daemon-job]').textContent()).includes('To protect') && (await p7.locator('[data-daemon-for]').textContent()).includes('You, the Player')
  && await p7.locator('[data-daemon-interview] input').count() === 0, 'the game tells the daemon\'s job and who it works for (oag-daemon-step)');
ok(await p7.locator('[data-daemon-continue]').isDisabled(), 'the gate waits for whether it will step aside');
await p7.locator('[data-daemon-aside="not-yet"]').click();
await p7.locator('[data-daemon-continue]').click();
st = await gs(p7);
ok(st.phase === 'phase3' && st.blockStep === 'gate' && /GAME MASTERS' GATE/.test(await p7.locator('.phase-marker').first().textContent()),
  'step 4 is the six game masters\' gate');
ok(await p7.locator('[data-channel-job-section]').count() === 0, 'the gate does not ask the element\'s job again');
await p7.locator('[data-demo-key="face-Red"]').click();
await p7.getByText('No, generate my own', { exact: true }).click();
await p7.locator('textarea').fill('I can say no and still be safe');
await p7.getByText("I've written it", { exact: true }).click();
await p7.getByText('Ready to notice', { exact: true }).click();
ok((await gs(p7)).phase === 'phase5-result', 'holding at the gate goes straight to the check, with no second practice');
// A belief that won't shift: dig deeper until the block releases (oag-main-order).
await p7.getByText("No, it's still the same", { exact: true }).click();
await p7.locator('[data-dig-deeper]').click();
st = await gs(p7);
ok(st.phase === 'phase-wave-block' && st.blockDepth === 2, 'a belief that won\'t shift digs deeper into a block of its own');
await p7.locator('[data-block-work]').click();
await waveFrom(p7, 'welcome', 'release');
await scan(p7, 'my throat', 'constriction');
await workBlock(p7, 'Sadness', 'Green', 'victim');
st = await gs(p7);
ok(st.phase === 'phase7' && st.blockDepth === 1 && (await p7.locator('[data-block-came-back="gate"]').count()) === 1, 'the deeper block releases back to the gate');
await p7.getByText('Try again with this', { exact: true }).click();
await p7.getByText('Ready to notice', { exact: true }).click();
await p7.getByText('Yes, something shifted', { exact: true }).click();
ok((await gs(p7)).phase === 'block-release', 'a shift goes to Release');
await p7.locator('[data-block-release]').click();
st = await gs(p7);
ok(st.blockDepth === 0 && st.waveStep === 'welcome' && (await p7.locator('[data-block-came-back="welcome"]').count()) === 1,
  'Release returns to the original block, Welcome');
const recAll = await p7.evaluate(() => JSON.parse(localStorage.getItem('oag:record') || '[]'));
const rec = recAll.filter(e => e.step === 'welcome');
ok(recAll.length === 3 && rec.length === 1 && rec[0].daemon === 'protector' && rec[0].element === 'Anger' && rec[0].face === 'Red'
  && rec[0].belief === 'I can say no and still be safe' && rec[0].stepAside === 'not-yet' && rec[0].outcome === 'shifted'
  && rec[0].practice === 'fire-burn' && rec[0].openUpMarks.includes('not-allowed'),
  'the record keeps the charge, its Open Up tool and marks, its daemon, the gate and the belief: ' + JSON.stringify(rec[0] || null));
// The sketch's outer loop: Exhale, then restart until unblocked.
await waveTo(p7, 'validate');
await p7.locator('[data-wave-step="validate"] [data-wave-continue]').click();
await p7.locator('[data-wave-restart]').click();
st = await gs(p7);
ok(st.waveStep === 'welcome' && st.route.some(e => e.kind === 'wave-restart'), 'Exhale offers a restart, which goes back to Welcome');
await p7.goto(B + '/ontology-game');
await p7.locator('[data-record-open]').click();
const recText = await p7.locator('[data-record-entry="block"]').first().textContent();
ok(await p7.locator('[data-record-entry="block"]').count() === 3 && recText.includes('The Protector') && recText.includes('I can say no and still be safe')
  && recText.includes('Cleaned up with: Burn it away (Fire)') && recText.includes("I'm not allowed to feel this"),
  'Your record shows the block, how it opened up, what was in the way, and its belief');
await p7.screenshot({ path: (process.env.OAG_SHOTS || '.') + '/shot-record.png', fullPage: true });
await p7.locator('[data-record-erase]').click();
ok(await p7.evaluate(() => localStorage.getItem('oag:record')) === null, 'Erase my record removes it from the device');

ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
await browser.close(); server.close();
