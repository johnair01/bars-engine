import assert from 'node:assert/strict'
import { carriedGarden, homeWrite, invitedView, itemFor, lanternLit, mayWrite, merge, MOVES, parsePath, plantedGarden, plantedHome, roomSummary, type Doc, type Who } from '@/lib/between/rules'

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

/* ---------- rooms, the homeroom, looks, invitations (br-* positions) ---------- */
const room = (extra: Doc = {}): Doc => spark({ phase: 'between', members: { [A]: {}, [B]: {} }, ...extra })
const G = { table: 'garden' } as const

function testHomeIsOnePersons() {
  const h = plantedHome(A, 5)
  assert.equal(h.kind, 'home'); assert.equal(h.phase, 'home'); assert.deepEqual(Object.keys(h.members as Doc), [A])
  assert.equal(mayWrite(invited(B), h, G, 'update', { joinRequest: { uid: B } }, h).ok, false, 'nobody asks to join a homeroom')
  assert.equal(mayWrite(stranger(B), h, { table: 'items', id: 'i1' }, 'set', { by: B }, null).ok, false)
  assert.equal(mayWrite(member(A), h, G, 'update', { members: { [B]: {} } }, h).ok, false)
  assert.equal(mayWrite(member(A), h, G, 'update', { phase: 'between' }, h).ok, false)
  assert.equal(mayWrite(member(A), h, G, 'update', { invitations: { i1: { by: A, kind: 'sit' } } }, h).ok, false)
  assert.equal(mayWrite(member(A), h, G, 'update', { kind: 'room' }, h).ok, false, 'a homeroom stays a homeroom')
  assert.equal(mayWrite(member(A), h, G, 'update', { style: 'moonlit', lastTendedAt: 9 }, h).ok, true)
  assert.equal(mayWrite(member(A), h, { table: 'items', id: 'i1' }, 'set', { by: A, kind: 'checkin' }, null).ok, true)
  assert.equal(mayWrite(member(B), h, { table: 'items', id: 'i1' }, 'update', { text: 'x' }, { by: A }).ok, false, 'items from anyone else are refused')
}

function testRoomIsAlwaysARoom() {
  const g = plantedGarden(A, { setup: { who: 'Ari' }, kind: 'home', looks: { [A]: 'a.average.light.afro.black.coat.violet', [B]: 'b.round.black.page.red.dress.saffron' }, invitations: { x: { by: B } } })!
  assert.equal(g.kind, 'room', 'a planted garden cannot pose as a homeroom')
  assert.deepEqual(g.looks, { [A]: 'a.average.light.afro.black.coat.violet' }, 'only your own look comes in with it')
  assert.deepEqual(g.invitations, {}); assert.equal(g.style, 'dusk-hollow')
  assert.equal(mayWrite(member(A), room(), G, 'update', { kind: 'home' }, room()).ok, false)
}

function testStyleIsAnAskWithTwo() {
  // his note on br-style-is-the-place (2026-10-23): both players consent to a style change
  const g = room()
  assert.equal(mayWrite(member(B), g, G, 'update', { style: 'ember-rain' }, g).ok, false, 'with two in the room, no change without a yes')
  assert.equal(mayWrite(member(B), g, G, 'update', { style: '<b>' }, g).ok, false)
  const ask = { by: B, style: 'ember-rain', at: 5 }
  assert.equal(mayWrite(member(B), g, G, 'update', { styleAsk: ask }, g).ok, true, 'B asks')
  assert.equal(mayWrite(member(B), g, G, 'update', { styleAsk: { ...ask, by: A } }, g).ok, false, 'only in your own name')
  assert.equal(mayWrite(member(B), g, G, 'update', { styleAsk: { ...ask, note: 'x' } }, g).ok, false)
  assert.equal(mayWrite(member(B), g, G, 'update', { styleAsk: ask, style: 'ember-rain' }, g).ok, false, 'asking does not change it')
  const asked = room({ styleAsk: ask })
  assert.equal(mayWrite(member(B), asked, G, 'update', { style: 'ember-rain', styleAsk: null }, asked).ok, false, 'the asker cannot answer their own ask')
  assert.equal(mayWrite(member(A), asked, G, 'update', { style: 'ember-rain', styleAsk: null }, asked).ok, true, 'the other says yes')
  assert.equal(mayWrite(member(A), asked, G, 'update', { style: 'moonlit', styleAsk: null }, asked).ok, false, 'yes is to the style asked for')
  assert.equal(mayWrite(member(A), asked, G, 'update', { style: 'ember-rain' }, asked).ok, false, 'a yes clears the ask')
  assert.equal(mayWrite(member(A), asked, G, 'update', { styleAsk: null }, asked).ok, true, 'not now')
  assert.equal(mayWrite(member(B), asked, G, 'update', { styleAsk: null }, asked).ok, true, 'taking it back')
  assert.equal(mayWrite(member(A), spark(), G, 'update', { style: 'moonlit' }, spark()).ok, true, 'a spark with one person changes at once')
  const h = plantedHome(A)
  assert.equal(mayWrite(member(A), h, G, 'update', { style: 'moonlit' }, h).ok, true, 'the homeroom changes at once')
  assert.equal(mayWrite(member(A), h, G, 'update', { styleAsk: { by: A, style: 'moonlit', at: 1 } }, h).ok, false)
  assert.deepEqual(roomSummary(A, 'gX', asked, []).styleAsk, { style: 'ember-rain', at: 5 }, 'the summary shows their ask to me')
  assert.equal(roomSummary(B, 'gX', asked, []).styleAsk, null, 'not my own ask')
}

function testLooksOwnKey() {
  const g = room(), look = 'c.slender.umber.sweep.blue.jacket.violet'
  assert.equal(mayWrite(member(B), g, G, 'update', { looks: { [B]: look } }, g).ok, true)
  assert.equal(mayWrite(member(B), g, G, 'update', { looks: { [A]: look } }, g).ok, false, 'only your own look')
  assert.equal(mayWrite(member(B), g, G, 'update', { looks: { [B]: 'data:image/png;base64,xx' } }, g).ok, false, 'a look is choices, never a photo')
  assert.equal(mayWrite(member(B), g, G, 'update', { looks: { [B]: null } }, g).ok, true)
}

function testInvitations() {
  const g = room(), sit = { by: A, kind: 'sit', when: 100, note: 'tea at the hearth?', at: 50, answer: null }
  assert.equal(mayWrite(member(A), g, G, 'update', { invitations: { s1: sit } }, g).ok, true)
  assert.equal(mayWrite(member(A), g, G, 'update', { invitations: { s1: { ...sit, by: B } } }, g).ok, false, 'in your own name')
  assert.equal(mayWrite(member(A), g, G, 'update', { invitations: { s1: { ...sit, answer: 'yes' } } }, g).ok, false, 'no answering your own')
  assert.equal(mayWrite(member(A), g, G, 'update', { invitations: { s1: { ...sit, note: 'x'.repeat(281) } } }, g).ok, false)
  assert.equal(mayWrite(member(A), g, G, 'update', { invitations: { s1: { ...sit, kind: 'join' } } }, g).ok, false)
  assert.equal(mayWrite(member(A), spark(), G, 'update', { invitations: { s1: sit } }, spark()).ok, false, 'a spark has nobody to invite to sit')
  const sent = room({ invitations: { s1: sit } })
  assert.equal(mayWrite(member(B), sent, G, 'update', { invitations: { s1: { answer: 'yes', answeredAt: 60 } } }, sent).ok, true)
  assert.equal(mayWrite(member(B), sent, G, 'update', { invitations: { s1: { answer: 'maybe' } } }, sent).ok, false)
  assert.equal(mayWrite(member(B), sent, G, 'update', { invitations: { s1: { note: 'changed' } } }, sent).ok, false, 'the invitation stays theirs')
  assert.equal(mayWrite(member(B), sent, G, 'update', { invitations: { s1: null } }, sent).ok, false)
  assert.equal(mayWrite(member(A), sent, G, 'update', { invitations: { s1: { when: 200 } } }, sent).ok, true)
  assert.equal(mayWrite(member(A), sent, G, 'update', { invitations: { s1: null } }, sent).ok, true, 'who sent it takes it back')
}

function testHomePrivateDoc() {
  const h = plantedHome(A), path = parsePath(`data/users/${A}/home`)!
  assert.deepEqual(path, { table: 'privates', playerId: A, key: 'home' })
  const doc = { look: 'a.average.light.afro.black.coat.violet', goals: { g1: { text: 'Say the hard thing kindly', room: 'gardenX', at: 1 } }, checkins: { c1: { feel: 'water', line: 'tired', at: 2 } }, lastCheckin: 2 }
  assert.equal(mayWrite(member(A), h, path, 'set', doc, null).ok, true)
  assert.equal(mayWrite(member(B), h, path, 'set', doc, null).ok, false)
  assert.equal(mayWrite(member(A), room(), path, 'set', doc, null).ok, false, 'the look and hopes live in the homeroom')
  assert.equal(homeWrite({ ...doc, score: 3 }).ok, false)
  assert.equal(homeWrite({ goals: { g1: { text: '' } } }).ok, false)
  assert.equal(homeWrite({ checkins: { c1: { feel: 'joy', at: 1 } } }).ok, false, 'one of the five feelings')
  assert.equal(mayWrite(member(A), h, path, 'update', { goals: { g1: null } }, doc).ok, true)
  // part 4: a check-in walks the seven steps of the W.A.V.E. and leaves an ember
  assert.equal(homeWrite({ checkins: { c2: { feel: 'fire', at: 3, wave: 7 } } }).ok, true)
  for (const wave of [8, -1, 2.5, '7']) assert.equal(homeWrite({ checkins: { c2: { feel: 'fire', at: 3, wave } } } as Doc).ok, false, 'wave ' + wave)
  const e = { feel: 'water', at: 4, given: null }
  assert.equal(homeWrite({ embers: { e1: e } }).ok, true)
  assert.equal(mayWrite(member(A), h, path, 'update', { embers: { e1: e } }, doc).ok, true)
  assert.equal(homeWrite({ embers: { e1: { ...e, given: { spirit: 'slmn-ab12', room: 'gardenX', at: 5 } } } }).ok, true, 'given to a spirit in a room')
  assert.equal(homeWrite({ embers: { e1: { ...e, given: { spirit: 'slmn-ab12', room: null, at: 5 } } } }).ok, true, 'or in the homeroom')
  assert.equal(homeWrite({ embers: { e1: { ...e, given: { stone: 'ilmn-cd34', room: 'gardenX', at: 5 } } } }).ok, true, 'or left on a stone')
  assert.equal(homeWrite({ embers: { e1: null } }).ok, true)
  for (const bad of [{ ...e, feel: 'joy' }, { ...e, at: 'now' }, { ...e, text: 'what it was about' }, { ...e, glow: 3 },
    { ...e, given: { room: 'gardenX', at: 5 } }, { ...e, given: { spirit: 'a b', room: null, at: 5 } }, { ...e, given: { spirit: 's1', stone: 'i1', room: null, at: 5 } },
    { ...e, given: { spirit: 's1', room: '../x', at: 5 } }, { ...e, given: { spirit: 's1', room: null } }, { ...e, given: 's1' }])
    assert.equal(homeWrite({ embers: { e1: bad } } as Doc).ok, false, JSON.stringify(bad))
}

function testRoomSummary() {
  const now = 100 * 864e5
  const g = room({ lastTendedAt: now - 6 * 864e5, style: 'moonlit',
    invitations: { s1: { by: B, kind: 'sit', when: now + 1, answer: null }, s0: { by: A, kind: 'sit', when: now - 864e5, answer: 'yes' } } })
  const items: { id: string; data: Doc }[] = [
    { id: 'ag1', data: { kind: 'agreement', status: 'proposed', by: B, yes: { [B]: true }, text: 'secret words' } },
    { id: 'ag2', data: { kind: 'agreement', status: 'proposed', by: A, yes: { [A]: true } } },
    { id: 'ag3', data: { kind: 'agreement', status: 'revisit', by: A, yes: {} } },
    { id: 'of1', data: { kind: 'charge', status: 'offered', by: B, sealed: true, text: 'sealed words' } },
    { id: 'of2', data: { kind: 'idea', status: 'offered', by: A } },
    { id: 'ln1', data: { kind: 'lantern', status: 'offered', by: B, yes: {} } },
    { id: 'ln2', data: { kind: 'lantern', status: 'offered', by: B, yes: { [A]: 5 } } },
    { id: 'pk1', data: { kind: 'agreement', status: 'agreed', by: A, pending: { act: 'retire', by: B } } },
    { id: 'old', data: { kind: 'charge', status: 'composted', by: B } },
  ]
  const s = roomSummary(A, 'gX', g, items, { now, names: { [B]: 'Bea' }, hereNow: true })
  assert.deepEqual(s.waiting.map(w => w.id + ':' + w.what).sort(), ['ag1:agreement', 'ln1:lantern', 'of1:offer', 'pk1:ask'])
  assert.deepEqual(s.revisit, ['ag3'])
  assert.deepEqual(s.invitations.map(i => i.id), ['s1'])
  assert.equal(s.lastSatTogether, now - 864e5)
  assert.equal(s.stale, true); assert.equal(s.person, B); assert.equal(s.who, 'Ari'); assert.equal(s.style, 'moonlit'); assert.equal(s.hereNow, true)
  assert.ok(!JSON.stringify(s).includes('words'), 'the summary carries no item words')
  const forB = roomSummary(B, 'gX', g, items, { now, names: { [A]: 'Alex' } })
  assert.equal(forB.who, 'Alex', 'the person who joined sees the starter\'s name')
  assert.equal(roomSummary(A, 'gS', spark({ joinRequest: { uid: C } }), [], { now }).joinWaiting, true)
}

function testFirstMinuteAndKeepsakes() { // room kit part 2: Still C's minute in the home doc, Still B's keepsakes on the shelf
  assert.equal(homeWrite({ minute: { ember: 1, mirror: null, skip: { hope: 2 } } }).ok, true, 'times done and skipped')
  assert.equal(homeWrite({ minute: { vine: 3 }, oriented: 3 }).ok, true, 'the last vine falls and the minute is done')
  for (const bad of [{ ember: 'lit' }, { words: 1 }, { skip: { vine: 1 } }, { skip: { hope: 'later' } }, { skip: 2 }, 'done'])
    assert.equal(homeWrite({ minute: bad } as Doc).ok, false, 'minute ' + JSON.stringify(bad))
  const g = room({ invitations: {
    s1: { by: B, kind: 'sit', when: 5, note: 'tea?', at: 4, answer: null },
    s2: { by: B, kind: 'sit', when: 6, note: 'walk', at: 5, answer: 'later', answeredAt: 7 },
    s3: { by: B, kind: 'sit', when: null, note: '', at: 6, answer: 'no', answeredAt: 8 },
    s4: { by: B, kind: 'sit', when: 9, note: '', at: 7, answer: 'yes', answeredAt: 8 },
    s5: { by: A, kind: 'sit', when: 9, note: '', at: 7, answer: 'no', answeredAt: 8 } } })
  const s = roomSummary(A, 'gX', g, [])
  assert.deepEqual(s.invitations, [{ id: 's1', when: 5, note: 'tea?', at: 4 }], 'a sealed scroll waits with its note')
  assert.deepEqual(s.keepsakes.map(k => k.id + ':' + k.answer), ['s2:later', 's3:no'], 'another time and no stay as keepsakes; a yes and my own do not')
  assert.equal(s.personStarted, false, 'A started the room')
  assert.equal(roomSummary(B, 'gX', g, []).personStarted, true, 'for B, the person (A) started it')
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
testHomeIsOnePersons()
testRoomIsAlwaysARoom()
testStyleIsAnAskWithTwo()
testLooksOwnKey()
testInvitations()
testHomePrivateDoc()
testRoomSummary()
testFirstMinuteAndKeepsakes()
console.log('between rules: all passed')
