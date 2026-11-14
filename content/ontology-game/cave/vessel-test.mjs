// Checks for the inner vessel's model (vessel.js): the Architect's V1 to V7 from pass inner-vessel1, rewritten for iv-kind-chosen
// and for Wendell's board answers of 19 October 2026 (fuel, places from the ship, the bonus, allies making parts).
// Plain node, no browser: node content/ontology-game/cave/vessel-test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const V = createRequire(import.meta.url)('./vessel.js');

let n = 0;
function t(name, fn) { fn(); n++; console.log('ok', name); }
const AT = '2026-10-19T12:00:00.000Z';
const strip = (p) => { const { id, look, emberId, lineage, ...rest } = p; return rest; };

t('V1 intensity changes only the look', () => {
  let v = V.blank(AT);
  const a = V.mintEmber(v, { source: '321', element: 'fire', intensity: 2 }, AT); v = a.vessel;
  const b = V.mintEmber(v, { source: '321', element: 'fire', intensity: 9 }, AT); v = b.vessel;
  const pa = V.form(v, a.ember.id, 'keel', AT); const pb = V.form(pa.vessel, b.ember.id, 'keel', AT);
  assert.deepEqual(strip(pa.part), strip(pb.part));
  assert.notEqual(pa.part.look, pb.part.look);
  assert.equal(pa.vessel.fuel, pb.vessel.fuel);
});

t('V2 the sample ship flies; without a Helm and a Sail it cannot', () => {
  const v = V.blank(AT);
  assert.equal(V.canLaunch(v), true);
  const r = V.rest(v, 'sample-sail');
  assert.equal(V.canLaunch(r.vessel), false);
  assert.equal(V.canReach(r.vessel, 'hall'), false);
});

t('V3/V4 any route can become any kind (iv-kind-chosen)', () => {
  for (const source of ['wave', '321', 'preset', 'symbol', 'fiction', 'ally']) for (const kind of V.KINDS) {
    const m = V.mintEmber(V.blank(AT), { source, element: 'water' }, AT);
    const f = V.form(m.vessel, m.ember.id, kind, AT);
    assert.equal(f.ok, true); assert.equal(f.part.kind, kind); assert.equal(f.part.element, 'water');
  }
  const m = V.mintEmber(V.blank(AT), { source: 'wave' }, AT);
  assert.equal(V.form(m.vessel, m.ember.id, 'cannon', AT).ok, false);
});

t('V5 an occupied cell refuses a fit; fitting takes one fuel', () => {
  const m = V.mintEmber(V.blank(AT), { source: 'wave' }, AT), f = V.form(m.vessel, m.ember.id, 'hold', AT);
  assert.equal(V.fit(f.vessel, f.part.id, 1).why, 'occupied');
  const ok = V.fit(f.vessel, f.part.id, 4); assert.equal(ok.ok, true);
  assert.equal(ok.vessel.fuel, V.FUEL.start - V.FUEL.fit);
  let dry = f.vessel; dry.fuel = 0;
  assert.equal(V.fit(dry, f.part.id, 4).why, 'fuel');
});

t('V6 the stored ship holds no text but the player\'s own label, and no intensity', () => {
  const m = V.mintEmber(V.blank(AT), { source: '321', element: 'fire', intensity: 8, label: 'mine', about: 'secret words' }, AT);
  const s = JSON.stringify(m.vessel);
  assert.ok(!s.includes('secret words')); assert.ok(!s.includes('intensity'));
});

t('V7 places are reached from the ship; a visit mines fuel and completes nothing', () => {
  let v = V.blank(AT); v.fuel = 0;
  assert.equal(V.canReach(v, 'hall'), true);
  assert.equal(V.canReach(v, 'bigmind'), true);
  const r = V.visited(v, 'hall', [], AT);
  assert.equal(r.mined, 2); assert.equal(r.vessel.places.hall, 'visited');
  assert.ok(!('quests' in r.vessel));
  assert.equal(V.chart(v, 'wood').why, 'unbuilt'); // element lands come after the Chapter 1 demo
});

t('fuel: the tank has a cap; spirits aboard raise it and power the ship', () => {
  let v = V.blank(AT);
  v = V.visited(v, 'hall', [], AT).vessel; v = V.visited(v, 'bigmind', [], AT).vessel;
  assert.equal(v.fuel, V.FUEL.cap);
  const sp = [{ stage: 'hologram' }, { stage: 'gas' }];
  assert.equal(V.capOf(v, sp), V.FUEL.cap + 2);
  const p = V.spiritsPower(v, sp, AT); assert.equal(p.gained, 2); assert.equal(p.vessel.fuel, V.FUEL.cap + 2);
});

t('the 321 bonus carries over as fuel (iv-no-bonus, overruled)', () => {
  let v = V.blank(AT); v.fuel = 0;
  assert.equal(V.mintEmber(v, { source: '321', bonus: true }, AT).vessel.fuel, V.FUEL.bonus);
  assert.equal(V.mintEmber(v, { source: '321' }, AT).vessel.fuel, 0);
});

t('an ally daemon makes one part; the daemon is never the part', () => {
  let r = V.allyMakes(V.blank(AT), 'protector', AT);
  assert.equal(r.ember.source, 'ally'); assert.equal(r.ember.daemon, 'protector');
  assert.equal(V.allyMakes(r.vessel, 'protector', AT).ember, null);
  const f = V.form(r.vessel, r.ember.id, 'lens', AT);
  assert.equal(f.part.lineage.daemon, 'protector'); assert.equal(f.part.kind, 'lens');
});

t('nothing decays: the record has no clocks to drain it', () => {
  const v = V.blank(AT);
  assert.ok(!JSON.stringify(v).match(/decay|expires|lastTended/));
});

t('rest and compost are ends; a sample part cannot be composted', () => {
  const m = V.mintEmber(V.blank(AT), { source: 'wave' }, AT), f = V.form(m.vessel, m.ember.id, 'hold', AT);
  const c = V.compost(V.fit(f.vessel, f.part.id, 4).vessel, f.part.id);
  assert.equal(c.ok, true); assert.equal(c.vessel.fuel, V.FUEL.start);
  assert.equal(V.compost(f.vessel, 'sample-helm').ok, false);
});

console.log(`${n} vessel checks passed`);
