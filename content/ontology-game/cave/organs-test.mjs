// Checks for the one organ state (organs.js) and the basin's words (basin.js, B3: the desk grep as a test).
// Plain node, no browser: node content/ontology-game/cave/organs-test.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const O = require('./organs.js');

let n = 0;
function t(name, fn) { fn(); n++; console.log('ok', name); }
const AT = '2026-10-27T12:00:00.000Z';
const NO_FIELDS = /^(capacity|level|count|max|xp|decay|fill|amount)$/i;
function keysDeep(x, out = []) { if (x && typeof x === 'object') for (const k of Object.keys(x)) { out.push(k); keysDeep(x[k], out); } return out; }

t('the shape holds a floor, never an amount (mao-access-not-fill, mab-floor-sets-reach)', () => {
  let s = O.blank();
  assert.deepEqual(s, { v: 1, seats: {} });
  s = O.raise(s, { channel: 'fear', floor: 3, source: 'the WAVE room' }, AT);
  assert.deepEqual(Object.keys(s.seats.brow).sort(), ['arrivedAt', 'channel', 'floor', 'source']);
  assert.equal(keysDeep(s).filter((k) => NO_FIELDS.test(k)).length, 0);
  assert.equal(keysDeep(O).filter((k) => NO_FIELDS.test(k)).length, 0, 'the module exports no such field either');
});

t('the floor only rises', () => {
  let s = O.raise(O.blank(), { channel: 'fear', floor: 2, source: 'the WAVE room' }, AT);
  assert.equal(s.seats.brow.floor, 2);
  const lower = O.raise(s, { channel: 'fear', floor: 1, source: 'the WAVE room' }, '2026-10-28T00:00:00.000Z');
  assert.equal(lower, s, 'a lower floor returns the same state');
  const up = O.raise(s, { channel: 'Fear', floor: 3, source: 'the WAVE room' }, '2026-10-28T00:00:00.000Z');
  assert.equal(up.seats.brow.floor, 3);
  assert.equal(s.seats.brow.floor, 2, 'raise does not change the state it was given');
  assert.equal(O.raise(up, { channel: 'fear', floor: 9 }, AT).seats.brow.floor, 3, 'nothing past the third floor');
});

t('the same act again changes nothing (mab-arrival-not-status)', () => {
  const s = O.raise(O.blank(), { channel: 'fear', floor: 1, source: 'the WAVE room' }, AT);
  const again = O.raise(s, { channel: 'fear', floor: 1, source: 'the WAVE room' }, '2026-10-29T00:00:00.000Z');
  assert.equal(again, s);
  assert.equal(again.seats.brow.arrivedAt, AT);
});

t('only the brow is charged in the demo (mao-first-organ-brow)', () => {
  const s = O.blank();
  for (const channel of ['sadness', 'joy', 'anger', 'neutrality', 'Anger', '', 'metal', null]) assert.equal(O.raise(s, { channel, floor: 3, source: 'x' }, AT), s, String(channel));
  assert.equal(O.raise(s, { channel: 'fear', floor: 0 }, AT), s, 'floor 0 is no arrival');
});

t('runOf per floor, derived, nothing else stored', () => {
  assert.equal(O.runOf(O.blank(), 'brow'), 0);
  for (const f of [1, 2, 3]) assert.equal(O.runOf(O.raise(O.blank(), { channel: 'fear', floor: f }, AT), 'brow'), f);
  assert.equal(O.runOf(O.raise(O.blank(), { channel: 'fear', floor: 3 }, AT), 'crown'), 0, 'the crown answers the brow; it holds no floor of its own');
  assert.equal(O.nextOf('brow'), 'crown', 'the second floor lights the path to the next seat on the cycle');
});

t('floors from the WAVE room sit (io-three-dantians)', () => {
  assert.equal(O.floorFromCredit({}), 0);
  assert.equal(O.floorFromCredit({ welcome: true, witness: true }), 1);
  assert.equal(O.floorFromCredit({ witness: true, acknowledge: true, allow: true, accept: true }), 2);
  assert.equal(O.floorFromCredit({ witness: true, accept: true, validate: true }), 3);
});

t('the edges are the move table\'s sheng cycle through the seat table, plus five spokes to the heart', () => {
  const mt = JSON.parse(readFileSync(new URL('../../../src/lib/quest-grammar/move-table.json', import.meta.url), 'utf8'));
  const want = Object.entries(mt.cycles.sheng).map(([a, b]) => O.seatOf(a) + '>' + O.seatOf(b)).sort();
  const cycle = O.EDGES.filter((e) => e.kind === 'cycle').map((e) => e.from + '>' + e.to).sort();
  assert.deepEqual(cycle, want);
  assert.ok(want.every((e) => !e.includes('null')), 'every channel of the move table has a seat');
  const spokes = O.EDGES.filter((e) => e.kind === 'spoke');
  assert.deepEqual(spokes.map((e) => e.from).sort(), ['brow', 'crown', 'dantian', 'solar', 'throat']);
  assert.ok(spokes.every((e) => e.to === 'heart'));
  assert.equal(O.EDGES.length, 10);
  assert.equal(O.channelOf('heart'), null);
});

t('the store: a preview sets and clears, a raise writes, every read survives a broken store', () => {
  const mem = {}; globalThis.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
  try {
    assert.equal(O.store.preview('brow', 2, AT).seats.brow.source, 'a preview link');
    assert.equal(O.runOf(O.store.get(), 'brow'), 2);
    O.store.raise({ channel: 'fear', floor: 1, source: 'the WAVE room' });
    assert.equal(O.runOf(O.store.get(), 'brow'), 2, 'a lower sitting leaves the stored floor');
    O.store.preview('brow', 0);
    assert.equal(O.store.get().seats.brow, undefined);
    mem[O.KEY] = '{not json';
    assert.deepEqual(O.store.get(), O.blank());
    globalThis.localStorage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    assert.deepEqual(O.store.get(), O.blank());
    assert.doesNotThrow(() => O.store.raise({ channel: 'fear', floor: 3 }));
  } finally { delete globalThis.localStorage; }
});

// ---- B3, the desk grep: every word the basin can put on the page -------------------------------------------------------------
// All player copy lives in basin.js's WORDS table; any other string that reaches the page (a text: or textContent literal) is
// checked too. Case-insensitive, word-boundaried.
export const STOP = ['level', 'levels', 'capacity', 'full', 'empty', 'locked', 'lock', 'shut', 'unavailable', 'closed', 'progress', 'charge', 'charges',
  'liver', 'kidney', 'kidneys', 'lung', 'lungs', 'spleen', 'heart', 'dantian', 'meridian', 'meridians', 'chakra', 'chakras', 'organ', 'organs',
  'metal', 'wood', 'fire', 'earth'];
// "water" is a landscape word in the basin's copy (still water, the low spring's water), so the element is caught by its
// capital: Water, as the element is written.
export function stopHits(s) {
  const hits = [];
  if (/\d/.test(s)) hits.push('a digit');
  if (/%/.test(s)) hits.push('%');
  for (const w of STOP) if (new RegExp('\\b' + w + '\\b', 'i').test(s)) hits.push(w);
  if (/\bWater\b/.test(s)) hits.push('Water (the element)');
  return hits;
}
t('B3: the basin\'s words carry no digit, no gauge or lock word, and no organ or system name', () => {
  const src = readFileSync(new URL('./basin.js', import.meta.url), 'utf8');
  globalThis.window = {}; globalThis.document = undefined;
  try { new Function('window', src)(globalThis.window); } catch (e) { /* the page part needs a browser; WORDS is set before it runs */ }
  const W = globalThis.window.__oagBasin && globalThis.window.__oagBasin.WORDS;
  assert.ok(W, 'basin.js exposes its WORDS table');
  const all = [];
  (function walk(x) { if (typeof x === 'string') all.push(x); else if (x && typeof x === 'object') Object.values(x).forEach(walk); })(W);
  // any literal handed to the page outside the table
  for (const m of src.matchAll(/(?:text|textContent|"aria-label")\s*[:=]\s*"([^"]*)"/g)) all.push(m[1]);
  assert.ok(all.length >= 12);
  const bad = all.map((s) => [s, stopHits(s)]).filter(([, h]) => h.length);
  assert.deepEqual(bad, []);
  // the checker itself catches what it is for
  for (const s of ['The heart.', 'Level 2', 'It is locked', 'Metal', 'full', '50%', 'The Wood land', 'Water']) assert.ok(stopHits(s).length, s);
  delete globalThis.window;
});

console.log(`${n} checks passed`);
