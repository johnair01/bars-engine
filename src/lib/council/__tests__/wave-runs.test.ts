/**
 * Run: npx tsx src/lib/council/__tests__/wave-runs.test.ts
 *
 * WAVE room runs from the Council Board: what the cave page may send.
 */

import { checkWaveRun, isNewer, WAVE_RUN_MAX_BYTES } from '@/lib/council/wave-runs'

let fails = 0
function ok(cond: boolean, msg: string) {
  console.log((cond ? 'PASS ' : 'FAIL ') + msg)
  if (!cond) fails++
}

const record = {
  engine: 'wave-room', version: 1, savedAt: '2026-10-14T21:30:00.000Z', stage: 'end', status: 'resolved',
  task: 'Tap the Vein, skipped 2 days running', rounds: [{ name: 'dread' }], resolution: { kind: 'now', text: 'open the page' },
  charge: { before: 7, after: 3 },
}
const good = checkWaveRun({ ref: 'tap-the-vein--mg8x2k1q', record })
ok(good.ok && good.run.ref === 'tap-the-vein--mg8x2k1q', 'a board run is taken')
ok(good.ok && good.run.savedAt.toISOString() === record.savedAt, 'its savedAt is read')
ok(!checkWaveRun(null).ok, 'no body is refused')
ok(!checkWaveRun({ ref: 'Tap The Vein', record }).ok, 'a ref with spaces or capitals is refused')
ok(!checkWaveRun({ ref: '../x', record }).ok, 'a ref with a path is refused')
ok(!checkWaveRun({ ref: 'x', record: { ...record, engine: 'board-wave' } }).ok, 'another engine is refused')
ok(!checkWaveRun({ ref: 'x', record: { ...record, savedAt: 'soon' } }).ok, 'a savedAt that is not a time is refused')
ok(!checkWaveRun({ ref: 'x', record: [record] }).ok, 'a list is refused')
ok(!checkWaveRun({ ref: 'x', record: { ...record, pad: 'a'.repeat(WAVE_RUN_MAX_BYTES) } }).ok, 'an oversized record is refused')
ok(isNewer(new Date('2026-10-14T21:31:00Z'), new Date('2026-10-14T21:30:00Z')), 'a later save replaces the stored one')
ok(!isNewer(new Date('2026-10-14T21:29:00Z'), new Date('2026-10-14T21:30:00Z')), 'an earlier save does not')
ok(isNewer(new Date('2026-10-14T21:29:00Z'), null), 'the first save is stored')

if (fails) { console.error(`${fails} failed`); process.exit(1) }
console.log('all passed')
