import assert from 'node:assert/strict'
import { mayWrite, plantedGarden, pouchWrite, type Doc, type Who } from '@/lib/between/rules'
import { chapter1Hand, HOLLOW_CARD, keepsakeFor, nextTurn, openPick, pickLog, takeTurn, WRITTEN } from '@/lib/between/shared-pick'

// The shared pick (Six-faces-council ch1-shared-pick, FR-001 to FR-006): the turn rule the server holds.
const A = 'playerA', B = 'playerB'
const member = (playerId: string): Who => ({ playerId, member: true, invited: false })
const lone = (): Doc => plantedGarden(A, { setup: { who: 'Ari', kind: 'Friendship' } }, 1)!
const two = (pick?: Doc): Doc => ({ ...lone(), members: { [A]: { joinedAt: 1 }, [B]: { joinedAt: 2 } }, phase: 'between', ...(pick ? { pick } : {}) })
const write = (who: string, g: Doc, pick: Doc | null) => mayWrite(member(who), g, { table: 'garden' }, 'update', { pick }, g)
const status = (v: ReturnType<typeof write>) => (v.ok ? 200 : v.status)

function testTheHand() {
  const h = chapter1Hand('regent')
  assert.equal(h.length, 7)
  assert.equal(new Set(h).size, 7)
  assert.ok(h.includes(WRITTEN['a6-whole']) && h.includes(WRITTEN['a6-hunters']) && h.includes(HOLLOW_CARD))
  assert.equal(keepsakeFor('regent'), 'WAKE-RA-REGENT')
  assert.equal(keepsakeFor('shaman'), 'WAKE-DA-SHAMAN', 'Shaman\'s Raise Awareness card is already dealt at A4')
  assert.equal(keepsakeFor('challenger'), 'WAKE-DA-CHALLENGER', 'Challenger\'s is dealt at A8')
  assert.equal(new Set(chapter1Hand('shaman')).size, 7)
  assert.equal(new Set(chapter1Hand('challenger')).size, 7)
}

function testAloneKeepsTheHand() {
  assert.equal(openPick(lone()), null, 'one member: no pool (FR-005)')
  const fresh = openPick(two())!
  assert.equal(status(write(A, lone(), fresh)), 400, 'a garden of one cannot open a pool')
}

function testOpenerFirst() {
  const p = openPick(two())!
  assert.deepEqual(p.order, [A, B])
  assert.equal(p.turn, A)
  assert.equal(status(write(B, two(), p)), 200, 'either of them opens it, and the opener picks first')
  assert.equal(status(write(A, two(), { ...p, turn: B })), 400, 'the partner cannot be put first at A6')
}

function testTurnsAndTaken() {
  let p = openPick(two())!
  assert.equal(status(write(B, two(p), takeTurn(p, B, { lift: WRITTEN['a6-whole'] }))), 409, 'not their turn')
  const p1 = takeTurn(p, A, { lift: WRITTEN['a6-whole'] }, 10)
  assert.equal(status(write(A, two(p), p1)), 200)
  assert.equal((p1.pool as string[]).length, 6)
  assert.equal(p1.turn, B)
  assert.equal(p1.moment, 'a6-hunters')
  assert.equal(status(write(B, two(p1), takeTurn(p1, B, { lift: WRITTEN['a6-whole'] }))), 409, 'a lifted card is gone for both')
  const sneaky = { ...takeTurn(p1, B, { lift: WRITTEN['a6-hunters'] }), pool: p1.pool }
  assert.equal(status(write(B, two(p1), sneaky)), 400, 'a lifted card leaves the pool')
  const double = takeTurn(takeTurn(p1, B, { lift: WRITTEN['a6-hunters'] }), B, { pass: true })
  assert.equal(status(write(B, two(p1), double)), 400, 'one turn at a time')
  // A pass is always a valid turn and hands the turn on.
  const p2 = takeTurn(p1, B, { pass: true }, 20)
  assert.equal(status(write(B, two(p1), p2)), 200)
  assert.deepEqual(p2.pool, p1.pool)
  p = p2
  assert.equal(p.moment, 'a8-hollow')
  assert.equal(p.turn, B, 'the order reverses at the hollow: the partner first (FR-003)')
}

function testTheHollow() {
  let p = takeTurn(takeTurn(openPick(two())!, A, { lift: 'WAKE-GR-SAGE' }), B, { lift: WRITTEN['a6-hunters'] })
  assert.equal(status(write(A, two(p), takeTurn(p, A, { pass: true }))), 409, 'at A8 the opener waits')
  const own = takeTurn(p, B, { own: true }, 30)
  assert.equal(status(write(B, two(p), own)), 200)
  assert.deepEqual(Object.keys((own.own as Doc[])[0]).sort(), ['at', 'by', 'moment'], 'the hollow card is never written as a pick')
  assert.equal(Object.keys(own.taken as Doc).includes(HOLLOW_CARD), false)
  assert.deepEqual(own.pool, p.pool, 'lifting one\'s own hollow card leaves the pool as it was')
  p = own
  assert.equal(p.turn, A)
  const last = takeTurn(p, A, { own: true }, 40)
  assert.equal(status(write(A, two(p), last)), 200)
  assert.deepEqual(nextTurn(last), { moment: 'done', turn: null })
  assert.equal(status(write(A, two(last), takeTurn(last, A, { pass: true }))), 409, 'the pick is over')
  assert.equal(status(write(A, two(p), null)), 409, 'a pick under way is not cleared')
  assert.equal(status(write(B, two(last), null)), 200, 'a finished pick can be cleared to play again')
  // Only the hollow has a card of one's own.
  const early = openPick(two())!
  assert.equal(status(write(A, two(early), takeTurn(early, A, { own: true }))), 400)
  // The pouch keeps it privately.
  assert.equal(pouchWrite({ hollow: { card: HOLLOW_CARD, at: 1 } }).ok, true)
  assert.equal(pouchWrite({ hollow: { card: 'WAKE-DA-REGENT', at: 1 } }).ok, false)
}

function testTheLog() {
  let p = openPick(two())!
  p = takeTurn(p, A, { lift: WRITTEN['a6-whole'] })
  p = takeTurn(p, B, { lift: 'WAKE-GR-SHAMAN' })
  p = takeTurn(p, B, { own: true })
  p = takeTurn(p, A, { pass: true })
  const mine = pickLog(p, A)
  assert.equal(mine.length, 4)
  assert.deepEqual(mine.map(r => [r.by, r.moment, r.card, r.fit]), [
    [A, 'a6-whole', WRITTEN['a6-whole'], true],
    [B, 'a6-hunters', 'WAKE-GR-SHAMAN', false],
    [B, 'a8-hollow', null, true],
    [A, 'a8-hollow', null, false],
  ])
  assert.equal(pickLog(p, B)[2].card, HOLLOW_CARD, 'your own hollow card is in your own log')
}

function testHomeroom() {
  const home = { ...two(), kind: 'home' }
  assert.equal(status(write(A, home, openPick(two())!)), 400)
}

for (const t of [testTheHand, testAloneKeepsTheHand, testOpenerFirst, testTurnsAndTaken, testTheHollow, testTheLog, testHomeroom]) t()
console.log('shared pick: all checks passed')
