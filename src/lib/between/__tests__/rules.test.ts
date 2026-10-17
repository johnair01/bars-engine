import assert from 'node:assert/strict'
import { carriedGarden, invitedView, mayWrite, merge, parsePath, plantedGarden, type Doc, type Who } from '@/lib/between/rules'

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

testPaths()
testMergeMatchesThePage()
testStrangersAndInvitees()
testWelcome()
testOwnership()
testInvitedViewHidesHopes()
testCarry()
console.log('between rules: all passed')
