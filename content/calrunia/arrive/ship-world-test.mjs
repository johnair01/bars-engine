// Checks for the living ship's world (ship-world.js). Plain node: node content/calrunia/arrive/ship-world-test.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const W = createRequire(import.meta.url)('./ship-world.js');
const fixture = JSON.parse(readFileSync(new URL('../../../fixtures/passport/valid/chapter1-sprout.json', import.meta.url), 'utf8'));
let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('ok', name); };

const blankShip = { v: 1, fuel: 3, embers: [], parts: [] };
const ember = (i, source = 'wave', element = 'fire') => ({ id: 'em' + i, source, element, look: 0.5, state: 'loose', at: '2026-10-24T00:00:00.000Z', label: 'knot ' + i });

ok('Chapter 1 arrives small and low-lit, with its one spirit leading and its two cards', () => {
  const w = W.worldOf(fixture, blankShip);
  assert.ok(w.energy > 0.15 && w.energy < 0.4, 'energy ' + w.energy);
  assert.ok(w.islandR < 10);
  assert.equal(w.spirits.length, 1); assert.equal(w.spirits[0].lead, true); assert.equal(w.spirits[0].element, 'water');
  assert.equal(w.cards.length, 2); assert.equal(w.chambers.length, 0); assert.equal(w.motes, 2);
});

ok('more inner energy grows the island and its light, never past the cap', () => {
  let last = -1;
  for (const fuel of [0, 3, 6, 12, 40, 400]) {
    const w = W.worldOf(fixture, { ...blankShip, fuel });
    assert.ok(w.islandR > last); last = w.islandR;
    assert.ok(w.energy < 1 && w.islandR <= W.ISLAND.max && w.light <= 1);
  }
});

ok('each ember from inner work grows a chamber; the sample does not', () => {
  const v = { ...blankShip, embers: [ember(1), ember(2, '321', 'water'), ember(3, 'sample')] };
  const w = W.worldOf(fixture, v);
  assert.deepEqual(w.chambers.map((c) => c.id), ['em1', 'em2']);
  assert.equal(w.chambers[1].glow, W.glowOf('water'));
});

ok('the loadout spirit leads; spirits and chambers are capped; stage sets size', () => {
  const spirits = Array.from({ length: 12 }, (_, i) => ({ ...fixture.spirits[0], id: 's' + i, loadout: i === 5, sittings: i }));
  const embers = Array.from({ length: 12 }, (_, i) => ember(i));
  const w = W.worldOf({ ...fixture, spirits }, { ...blankShip, embers });
  assert.equal(w.spirits[0].id, 's5'); assert.equal(w.spirits.filter((s) => s.lead).length, 1);
  assert.equal(w.spirits.length, W.MAX_SPIRITS); assert.equal(w.chambers.length, W.MAX_CHAMBERS);
  const big = w.spirits.find((s) => s.stage === 'creature'), small = w.spirits.find((s) => s.stage === 'gas');
  assert.ok(big.size > small.size);
});

ok('nothing in the world is a count meant for the screen', () => {
  const w = W.worldOf(fixture, blankShip);
  assert.ok(!('vibeulons' in w) && !('fuel' in w) && !('qi' in w));
});

ok('no ship record yet: the passport embers still grow chambers', () => {
  const w = W.worldOf({ ...fixture, embers: [ember(1)] }, null);
  assert.equal(w.chambers.length, 1);
});

console.log(n + ' ship world checks passed');
