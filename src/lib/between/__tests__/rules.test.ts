import assert from 'node:assert/strict'
import { carriedGarden, invitedView, itemFor, lanternLit, mayWrite, merge, MOVES, parsePath, plantedGarden, type Doc, type Who } from '@/lib/between/rules'

const A = 'playerA', B = 'playerB', C = 'playerC'
const member = (playerId: string): Who => ({ playerId, member: true, invited: false })
const invited = (playerId: string): Who => ({ playerId, member: false, invited: true })
const stranger = (playerId: string): Who => ({ playerId, member: false, invited: false })
const spark = (extra: Doc = {}): Doc => ({ ...plantedGarden(A, { setup: { who: 'Ari', kind: 'Friendship', hopes: 'private hope' } }, 1)!, ...extra })

function testPaths() {
  assert.deepEqual(parsePath('garden/main'), { table: 'garden' })
  assert.deepEqual(parsePath('items/ilmn-ab12'), { table: 'items', id: 'ilmn-ab12' })
  assert.deepEqual(parsePath('shown/' + A), { table: 'shown', playerId: A })
  assert.deepEqual(parsePath(`data/users/${A}/spark`), { table: 'privates', playerId: A, key: 'spark' })
  assert.deepEqual(parsePath(`data/users/${A}/pouch`), { table: 'privates', playerId: A, key: 'pouch' })
  for (const bad of ['garden/other', 'items', 'items/a/b', 'data/users/x/notes', '../x', 'items/a b', 7])
    assert.equal(parsePath(bad), null, String(bad))
}

function testMergeMatchesThePage() {
  const a = { history: { h1: { act: 'planted' } }, yes: { [A]: true }, pending: { act: 'retire' } }
  const m = merge(a, { history: { h2: { act: 'proposed' } }, pending: null, status: 'proposed' })
  assert.deepEqual(Object.keys(m.history as Doc), ['h1', 'h2'])
  assert.equal(m.pending, null)
  assert.equal(m.status, 'proposed')
  assert.deepEqual(a.history, { h1: { act: 'planted' } }, 'merge leaves the old document alone')
}

function testStrangersAndInvitees() {
  const g = spark()
  assert.equal(mayWrite(stranger(C), g, { table: 'garden' }, 'update', { joinRequest: { uid: C } }, g).ok, false)
  assert.equal(mayWrite(invited(B), g, { table: 'garden' }, 'update', { joinRequest: { uid: B, at: 2 } }, g).ok, true)
  assert.equal(mayWrite(invited(B), g, { table: 'garden' }, 'update', { joinRequest: { uid: C } }, g).ok, false, 'asks only for themself')
  assert.equal(mayWrite(invited(B), g, { table: 'garden' }, 'update', { joinRequest: { uid: B }, phase: 'between' }, g).ok, false)
  assert.equal(mayWrite(invited(B), g, { table: 'items', id: 'i1' }, 'set', { by: B }, null).ok, false)
  const asked = spark({ joinRequest: { uid: B } })
  assert.equal(mayWrite(invited(B), asked, { table: 'garden' }, 'update', { joinRequest: null }, asked).ok, true)
  assert.equal(mayWrite(invited(C), asked, { table: 'garden' }, 'update', { joinRequest: null }, asked).ok, false)
  assert.equal(mayWrite(invited(C), asked, { table: 'garden' }, 'update', { joinRequest: { uid: C } }, asked).ok, false)
  const between = spark({ phase: 'between', members: { [A]: {}, [B]: {} } })
  assert.equal(mayWrite(invited(C), between, { table: 'garden' }, 'update', { joinRequest: { uid: C } }, between).ok, false)
}

function testWelcome() {
  const asked = spark({ joinRequest: { uid: B } })
  const welcome = { members: { [B]: { joinedAt: 3 } }, joinRequest: null, phase: 'between' }
  assert.equal(mayWrite(member(A), asked, { table: 'garden' }, 'update', welcome, asked).ok, true)
  assert.equal(mayWrite(member(A), spark(), { table: 'garden' }, 'update', welcome, spark()).ok, false, 'only who asked')
  assert.equal(mayWrite(member(A), asked, { table: 'garden' }, 'update', { members: { [C]: {} } }, asked).ok, false)
  assert.equal(mayWrite(member(A), asked, { table: 'garden' }, 'update', { startedBy: B }, asked).ok, false)
  assert.equal(mayWrite(member(A), asked, { table: 'garden' }, 'set', asked, asked).ok, false)
}

function testOwnership() {
  const g = spark({ phase: 'between', members: { [A]: {}, [B]: {} } })
  assert.equal(mayWrite(member(B), g, { table: 'items', id: 'i1' }, 'set', { by: B }, null).ok, true)
  assert.equal(mayWrite(member(B), g, { table: 'items', id: 'i1' }, 'set', { by: A }, null).ok, false)
  assert.equal(mayWrite(member(B), g, { table: 'items', id: 'i1' }, 'update', { status: 'agreed' }, { by: A }).ok, true, 'both tend items')
  assert.equal(mayWrite(member(B), g, { table: 'spirits', id: 's1' }, 'update', { stay: {} }, { owner: A }).ok, false, 'a spirit stays its owner\'s')
  assert.equal(mayWrite(member(A), g, { table: 'daemons', id: 'd1' }, 'delete', null, { owner: A }).ok, true)
  assert.equal(mayWrite(member(B), g, { table: 'shown', playerId: A }, 'set', { between: '' }, null).ok, false, 'pictures shown only by their owner')
  assert.equal(mayWrite(member(B), g, { table: 'privates', playerId: A, key: 'garden' }, 'set', {}, null).ok, false)
  assert.equal(mayWrite(member(A), g, { table: 'privates', playerId: A, key: 'garden' }, 'set', {}, null).ok, true)
}

function testInvitedViewHidesHopes() {
  const v = invitedView(spark())
  assert.equal((v.setup as Doc).who, 'Ari')
  assert.equal('hopes' in (v.setup as Doc), false)
}

function testCarry() {
  const art: Doc = { v: 1, phase: 'spark', startedBy: 'u_artifact', startedAt: 5, lastTendedAt: 6, members: { u_artifact: { joinedAt: 5 } },
    setup: { who: 'Ari', kind: 'Romance or flirting', hopes: 'h' }, joinRequest: null, ending: null }
  const g = carriedGarden(A, art, 'artifact:x')!
  assert.equal(g.startedBy, A)
  assert.deepEqual(Object.keys(g.members as Doc), [A])
  assert.equal(g.startedAt, 5)
  assert.equal(g.lastTendedAt, 6)
  assert.equal(g.carriedFrom, 'artifact:x')
  assert.equal(carriedGarden(A, { ...art, phase: 'between' }, 'x'), null)
}

function testSealedWordsStayOnTheServer() {
  // cc-seal-fix-first (architect T8): B's poll holds none of A's sealed words until B opens it.
  const charge: Doc = { kind: 'charge', text: 'what I worked through', by: A, sealed: true, opened: {}, status: 'offered',
    history: { h1: { by: A, act: 'offered a charge', text: 'what I worked through' }, h2: { by: B, act: 'let it pass', text: 'mine' } } }
  const toB = itemFor(B, charge)
  assert.equal(toB.text, '')
  assert.ok(!JSON.stringify(toB).includes('worked through'), 'no copy of the words anywhere in what B gets')
  assert.equal((toB.history as Doc).h2 && ((toB.history as Doc).h2 as Doc).text, 'mine', 'B keeps their own words')
  assert.equal(itemFor(A, charge), charge, 'the maker sees their own')
  assert.equal(itemFor(B, { ...charge, opened: { [B]: true } }).text, 'what I worked through', 'opened, it reads')
  assert.equal(itemFor(B, { ...charge, sealed: false }).text, 'what I worked through', 'unsealed offerings read as before')
  assert.equal(charge.text, 'what I worked through', 'the stored item is left alone')
}

/* The hearth (council pass crafting-charge1): architect tests T1, T2, T3, T7, T9. */
const between = () => spark({ phase: 'between', members: { [A]: {}, [B]: {} } })
const pouch = (id: string) => ({ table: 'privates', playerId: id, key: 'pouch' }) as const
const ember = (extra: Doc = {}): Doc => ({ move: 'fire_metal', feel: 'fire', glow: 4, state: 'held', at: 5, lantern: null, ...extra })
const lantern = (extra: Doc = {}): Doc => ({ kind: 'lantern', by: A, hue: '#e8a', element: null, pos: { x: 1, z: 2 }, yes: {}, status: 'offered', at: 6,
  history: { h1: { act: 'made', by: A, at: 6 } }, ...extra })

function testEmberTakesTheMovesElement() { // T1
  const g = between(), w = (e: Doc) => mayWrite(member(A), g, pouch(A), 'update', { embers: { e1: e } }, null).ok
  assert.equal(Object.keys(MOVES).length, 15)
  assert.deepEqual(MOVES.fire_metal, { name: 'Temper Action', from: 'fire', to: 'metal' })
  assert.deepEqual(MOVES.water_transcend.from, MOVES.water_transcend.to, 'a transcend move stays in its element')
  assert.equal(w(ember()), true)
  assert.equal(w(ember({ feel: 'water' })), false, 'a move from another feeling is refused')
  assert.equal(w(ember({ move: 'shout' })), false, 'one of the fifteen moves')
  assert.equal(w(ember({ glow: null, feel: null })), true, 'glow and feeling may go unsaid')
  assert.equal(w(ember({ glow: 9 })), false)
  assert.equal(w(ember({ state: 'spent' })), false, 'an ember is never used up')
  assert.equal(mayWrite(member(B), g, pouch(A), 'update', { embers: { e1: ember() } }, null).ok, false, 'the other person\'s pouch')
}

function testNoWordsOrGlowInShare() { // T2
  const g = between(), w = (e: Doc) => mayWrite(member(A), g, pouch(A), 'update', { embers: { e1: e } }, null).ok
  assert.equal(w(ember({ text: 'what I felt' })), false, 'an ember keeps no words')
  assert.equal(mayWrite(member(A), g, pouch(A), 'set', { embers: {}, note: 'x' }, null).ok, false)
  const set = (d: Doc) => mayWrite(member(A), g, { table: 'items', id: 'l1' }, 'set', d, null).ok
  assert.equal(set(lantern()), true)
  for (const leak of [{ glow: 4 }, { intensity: 4 }, { text: 'why' }, { move: 'fire_metal' }] as Doc[])
    assert.equal(set(lantern(leak)), false, 'a shared lantern carries none of ' + Object.keys(leak)[0])
  assert.equal(set(lantern({ element: 'fire' })), true, 'its maker may show the element')
  assert.equal(set(lantern({ element: 'plasma' })), false)
  assert.equal(set(lantern({ yes: { [A]: 1 } })), false, 'a maker does not welcome their own lantern')
}

function testUnofferedChargeMakesTheSameEmber() { // T3
  // Nothing in an ember can say where the charge came from: a source field is refused like any other.
  const g = between()
  assert.equal(mayWrite(member(A), g, pouch(A), 'update', { embers: { e1: ember({ source: 'offered' }) } }, null).ok, false)
  assert.equal(mayWrite(member(A), g, pouch(A), 'update', { embers: { e1: ember({ charge: 'i123' }) } }, null).ok, false)
}

function testMakersMark() { // T7, cc-lantern-offer
  const g = between(), it = { table: 'items', id: 'l1' } as const, cur = lantern()
  assert.equal(mayWrite(member(B), g, it, 'update', { by: B }, cur).ok, false, 'the other person cannot change the maker')
  assert.equal(mayWrite(member(B), g, it, 'update', { pos: { x: 0, z: 0 } }, cur).ok, false, 'only its maker moves it')
  assert.equal(mayWrite(member(B), g, it, 'delete', null, cur).ok, false, 'only its maker takes it back')
  assert.equal(mayWrite(member(B), g, it, 'set', lantern({ by: B }), cur).ok, false, 'nor overwrites it')
  assert.equal(mayWrite(member(B), g, it, 'update', { yes: { [B]: 9 }, history: { h2: { act: 'welcomed', by: B, at: 9 } } }, cur).ok, true)
  assert.equal(mayWrite(member(B), g, it, 'update', { yes: { [A]: 9 } }, cur).ok, false, 'answers only for themself')
  assert.equal(mayWrite(member(A), g, it, 'update', { yes: { [B]: 9 } }, cur).ok, false, 'the maker cannot answer for them')
  assert.equal(mayWrite(member(A), g, it, 'update', { pos: { x: 3, z: 1 } }, cur).ok, true)
  assert.equal(mayWrite(member(A), g, it, 'delete', null, cur).ok, true, 'its maker composts it, owing nothing')
  assert.equal(mayWrite(member(B), g, { table: 'items', id: 'c1' }, 'update', { by: B }, { kind: 'charge', by: A }).ok, false, 'no item changes maker')
  assert.equal(lanternLit(cur), false, 'an offer counts for nothing yet')
  assert.equal(lanternLit(merge(cur, { yes: { [B]: 9 } })), true, 'it counts once the other says yes')
  assert.equal(lanternLit(merge(cur, { yes: { [B]: null } })), false, 'and stops if they take it back')
}

function testLogNamesActsWithoutCounts() { // T9
  const g = between(), it = { table: 'items', id: 'l1' } as const
  assert.equal(mayWrite(member(A), g, it, 'set', lantern({ history: { h1: { act: 'made', by: A, at: 6, n: 3 } } }), null).ok, false)
  assert.equal(mayWrite(member(B), g, it, 'update', { history: { h2: { act: 'welcomed', by: A, at: 9 } } }, lantern()).ok, false, 'a line in their own name')
}

testPaths()
testSealedWordsStayOnTheServer()
testMergeMatchesThePage()
testStrangersAndInvitees()
testWelcome()
testOwnership()
testInvitedViewHidesHopes()
testCarry()
testEmberTakesTheMovesElement()
testNoWordsOrGlowInShare()
testUnofferedChargeMakesTheSameEmber()
testMakersMark()
testLogNamesActsWithoutCounts()
console.log('between rules: all passed')
