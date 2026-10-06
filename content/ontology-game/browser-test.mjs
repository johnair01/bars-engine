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
const holdBelief = async (pg, channel, face) => {
  if (channel) await pg.locator(`[data-demo-key="channel-${channel}"]`).click();
  await pg.locator(`[data-demo-key="face-${face}"]`).click();
  await pg.getByText('Yes, this is true', { exact: true }).click();
  await pg.getByText('Ready to notice', { exact: true }).click();
};

await page.goto(B + '/ontology-game');
await page.getByText('Ontology Alchemy Game').first().waitFor();
ok(await page.getByRole('button', { name: 'Begin with W.A.V.E.' }).count() === 1, 'entry offers Begin with W.A.V.E.');
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
await page2.getByText('Begin Practice with W.A.V.E.').waitFor();
ok(await page2.getByRole('button', { name: 'Begin with W.A.V.E.' }).count() === 0, '/wave link: single WAVE begin button');
await page2.getByText('Begin Practice with W.A.V.E.').click();
ok(await page2.getByText('Opening practice — W.A.V.E.').count() === 1, '/wave link opens with W.A.V.E.');

// Random mode: switch link
const page3 = await ctx.newPage();
await page3.addInitScript(() => { window.__forcePracticeId = 'grounding'; });
await page3.goto(B + '/ontology-game');
await page3.getByRole('button', { name: 'Begin Practice' }).click();
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
await page4.screenshot({ path: (process.env.OAG_SHOTS || '.') + '/shot-map.png', fullPage: true });

// Falsification test 1: block on Accept, block on Welcome inside it, return to each.
const p5 = await ctx.newPage();
p5.on('pageerror', e => errors.push('pageerror5: ' + e.message));
await p5.goto(B + '/ontology-game/wave');
await p5.getByText('Begin Practice with W.A.V.E.').click();
await waveFrom(p5, 'welcome', 'release');
await scan(p5, 'my chest', 'tension');
await holdBelief(p5, 'Anger', 'Amber');
await p5.locator('[data-demo-key="open-choice-wave"]').click();
await waveTo(p5, 'accept');
const outer = await gs(p5);
await p5.locator('[data-wave-step="accept"] [data-wave-block]').click();
let st = await gs(p5);
ok(st.phase === 'phase-wave-block' && st.blockDepth === 1, 'block on Accept opens the block screen');
ok(await p5.locator('[data-block-frame="self-sabotage"]').count() === 1, 'block screen offers the self-sabotage frame');
await p5.locator('[data-block-work]').click();
ok((await p5.locator('#block-trail').textContent()).includes('back to Accept'), 'trail bar shows the way back to Accept');
await p5.screenshot({ path: (process.env.OAG_SHOTS || '.') + '/shot-block.png', fullPage: true });
await p5.locator('[data-wave-step="welcome"] [data-wave-block]').click();
st = await gs(p5);
ok(st.blockDepth === 2 && JSON.stringify(st.blockSteps) === '["accept","welcome"]', 'block on Welcome nests inside');
await p5.locator('[data-block-skip-frame]').click();
ok(await p5.locator('[data-block-frame="plain"]').count() === 1, 'frame can be skipped');
await p5.locator('[data-block-work]').click();
await waveFrom(p5, 'welcome', 'release');
await scan(p5, 'my belly', 'numbness');
await holdBelief(p5, 'Fear', 'Orange');
await p5.locator('[data-demo-key="open-choice-breaths"]').click();
await p5.locator('[data-demo-key="open-active-breaths-done"]').click();
await p5.getByText('Yes, something shifted', { exact: true }).click();
await p5.locator('[data-demo-key="state-confirm-neutral"]').click();
st = await gs(p5);
ok(st.phase === 'phase1' && st.waveStep === 'welcome' && st.blockDepth === 1 && st.selectedChannel === null,
  'inner block returns to Welcome inside the first block work');
await waveFrom(p5, 'welcome', 'release');
await scan(p5, 'my throat', 'constriction');
await holdBelief(p5, 'Sadness', 'Teal');
await p5.locator('[data-demo-key="open-choice-breaths"]').click();
await p5.locator('[data-demo-key="open-active-breaths-done"]').click();
await p5.getByText('Yes, something shifted', { exact: true }).click();
await p5.locator('[data-demo-key="state-confirm-satisfied"]').click();
st = await gs(p5);
ok(st.phase === 'phase-open-active' && st.openTechnique === 'wave' && st.blockDepth === 0, 'outer block returns to the open W.A.V.E.');
ok(await p5.locator('[data-wave-step="accept"]').count() === 1, 'lands back on Accept');
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
const belief = outer.userBelief;
const stored = await p5.evaluate(() => Object.keys(localStorage).map(k => localStorage.getItem(k)).join('\n'));
ok(belief && !stored.includes(belief), 'belief text never stored');
ok((await p5.locator('svg.route-map').textContent()).includes(belief.split(' ')[0]), 'belief drawn under the map');
await p5.screenshot({ path: (process.env.OAG_SHOTS || '.') + '/shot-map-blocks.png', fullPage: true });

// Depth reflection at three nested blocks.
const p6 = await ctx.newPage();
await p6.goto(B + '/ontology-game/wave');
await p6.getByText('Begin Practice with W.A.V.E.').click();
for (let d = 1; d <= 3; d++) {
  await p6.locator('[data-wave-step="welcome"] [data-wave-block]').click();
  ok((await p6.locator('[data-block-depth-reflection]').count()) === (d === 3 ? 1 : 0), 'depth reflection only at three (depth ' + d + ')');
  if (d < 3) await p6.locator('[data-block-work]').click();
}
await p6.locator('[data-block-back]').first().click();
ok((await gs(p6)).blockDepth === 2, 'go back from the block screen returns one level');

ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
await browser.close(); server.close();
