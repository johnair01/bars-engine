import assert from 'node:assert/strict'
import { merge, mayWrite, plantedGarden, pouchWrite, type Doc, type Who } from '@/lib/between/rules'
import { chapter1Hand, HOLLOW_CARD, keepsakeFor, openLetters, settle, viewGarden } from '@/lib/between/shared-pick'
import { HAND, LINES, NOOK, ORDER, encounterState, storyName } from '../../../../public/between/encounter-lines.js'

// Letters from the nook (Six-faces-council hollow-interface rounds 3 and 4): the rule the server holds. Each player sends
// one card as a letter, sealed until both are in; each presses one step, sealed until the try's steps are in; the server
// keeps the overcome obstacle as a story; a card goes once a chapter.
const A = 'playerA', B = 'playerB'
const member = (playerId: string): Who => ({ playerId, member: true, invited: false })
const lone = (): Doc => plantedGarden(A, { setup: { who: 'Ari', kind: 'Friendship' } }, 1)!
const two = (letters?: Doc): Doc => ({ ...lone(), members: { [A]: { joinedAt: 1 }, [B]: { joinedAt: 2 } }, phase: 'between', ...(letters ? { letters } : {}) })
const write = (who: string, g: Doc, letters: Doc) => mayWrite(member(who), g, { table: 'garden' }, 'update', { letters }, g)
const status = (v: ReturnType<typeof write>) => (v.ok ? 200 : v.status)
/** What the server does on a write it allows: merge, then settle. */
function apply(who: string, g: Doc, partial: Doc): Doc {
  const v = write(who, g, partial)
  assert.ok(v.ok, `${who}'s write was refused: ${v.ok ? '' : v.error}`)
  const next = merge(g, { letters: partial })
  return { ...next, letters: settle(next.letters as Doc, 5) }
}
const send = (who: string, enc: string, card: string) => ({ [enc]: { sent: { [who]: { card, at: 1 } } } })
const step = (who: string, enc: string, n: number, i: number) => ({ [enc]: { tries: { [String(n)]: { [who]: { i, at: 2 } } } } })

function testTheLines() {
  assert.deepEqual(chapter1Hand(null), HAND, 'the lines are written for the hand the garden deals')
  for (const c of HAND) assert.equal(NOOK[c].length, 3, `${c} has three nook lines`)
  let parts = 0, steps = 0
  for (const e of ORDER) for (const c of HAND) {
    const l = LINES[e][c]
    assert.ok(l && l.part && l.line && l.phrase, `${e} ${c} has a part, a line and a phrase`)
    assert.equal(l.steps.length, 3); parts++; steps += 3
    assert.ok(l.steps.some(s => s[2]) && l.steps.some(s => !s[2]), `${e} ${c}: a step answers and one shows what it missed`)
    for (const s of l.steps) assert.ok(!/—/.test(s[0] + s[1]), 'no em-dashes on a card')
  }
  assert.equal(parts, 14); assert.equal(steps, 42)
  assert.equal(storyName('a6', ['WAKE-DA-REGENT', 'WAKE-DA-DIPLOMAT']), 'The two on the path, the knock at Pip\'s door.')
  assert.equal(keepsakeFor('shaman'), 'WAKE-DA-SHAMAN')
  assert.equal(new Set(chapter1Hand('challenger')).size, 7)
}

function testAloneAndHome() {
  assert.equal(openLetters(lone()), null, 'one member: no letters (sp-alone-keeps-the-hand)')
  assert.equal(status(write(A, lone(), openLetters(two())!)), 400)
  assert.equal(status(write(A, { ...two(), kind: 'home' }, openLetters(two())!)), 400, 'a homeroom holds no letters')
  assert.equal(status(mayWrite(member(A), two(), { table: 'garden' }, 'update', { pick: {} }, two())), 400, 'the shared draft is gone')
}

function testOpen() {
  const f = openLetters(two())!
  assert.deepEqual(f.order, [A, B], 'the one who started the garden first')
  assert.equal(status(write(B, two(), f)), 200, 'either of the two may open the letters')
  assert.equal(status(write(A, two(), { ...f, stories: { a6: { name: 'x' } } })), 400, 'they open with nothing in them')
}

function testSealedUntilBoth() {
  let g = two(openLetters(two())!)
  g = apply(A, g, send(A, 'a6', 'WAKE-DA-REGENT'))
  const seen = viewGarden(g, B).letters as Doc
  assert.deepEqual(((seen.a6 as Doc).sent as Doc)[A], { sealed: true, at: 1 }, 'the partner sees a sealed letter, not the card')
  assert.equal(((((viewGarden(g, A).letters as Doc).a6 as Doc).sent as Doc)[A] as Doc).card, 'WAKE-DA-REGENT', 'the sender sees their own')
  assert.equal(status(write(A, g, send(A, 'a6', 'WAKE-GR-SAGE'))), 409, 'one letter per player per encounter')
  assert.equal(status(write(A, g, step(A, 'a6', 1, 0))), 409, 'no step before both letters are in')
  assert.equal(status(write(B, g, send(B, 'a6', 'NOT-A-CARD'))), 400)
  assert.equal(status(write(B, g, send(A, 'a6', 'WAKE-GR-SAGE'))), 403, 'nobody sends the other\'s letter')
  g = apply(B, g, send(B, 'a6', 'WAKE-DA-DIPLOMAT'))
  const open = viewGarden(g, B).letters as Doc
  assert.equal((((open.a6 as Doc).sent as Doc)[A] as Doc).card, 'WAKE-DA-REGENT', 'both in: the server opens them together')
  return g
}

function testStepsAndStory(g: Doc) {
  // A answers (stand on the path); B misses (brings the hunters to the door), so Pip's door still stands
  g = apply(A, g, step(A, 'a6', 1, 0))
  assert.deepEqual((((((viewGarden(g, B).letters as Doc).a6 as Doc).tries as Doc)['1'] as Doc)[A]), { sealed: true, at: 2 }, 'a step is sealed until the try is in')
  assert.equal(status(write(A, g, step(A, 'a6', 1, 2))), 400, 'one step per player per try')
  g = apply(B, g, step(B, 'a6', 1, 2))
  let st = encounterState(g.letters, 'a6')
  assert.deepEqual(st.given, [A]); assert.equal(st.try, 2); assert.deepEqual(st.need, [B], 'only the part still standing steps again')
  assert.equal(status(write(A, g, step(A, 'a6', 2, 0))), 409, 'your part has given')
  assert.ok(!(g.letters as Doc).stories || !((g.letters as Doc).stories as Doc).a6, 'no story yet')
  g = apply(B, g, step(B, 'a6', 2, 0))
  st = encounterState(g.letters, 'a6')
  assert.ok(st.overcome)
  assert.deepEqual(((g.letters as Doc).stories as Doc).a6, { name: 'The two on the path, the knock at Pip\'s door.', cards: ['WAKE-DA-REGENT', 'WAKE-DA-DIPLOMAT'], at: 5 }, 'the server keeps the story')
  assert.equal(status(write(A, g, { stories: { a8: { name: 'mine', cards: [], at: 1 } } })), 400, 'the page never writes a story')
  return g
}

function testOnceAChapter(g: Doc) {
  assert.equal(status(write(A, g, send(A, 'a8', 'WAKE-DA-REGENT'))), 409, 'a card sent at A6 stays in the Between (hi3-card-goes-once)')
  assert.equal(status(write(A, g, send(A, 'a6', 'WAKE-GR-SAGE'))), 409, 'A6 is overcome; the letters are at A8')
  g = apply(A, g, send(A, 'a8', 'WAKE-RA-CHALLENGER'))
  g = apply(B, g, send(B, 'a8', 'WAKE-DA-REGENT'))
  g = apply(B, g, step(B, 'a8', 1, 1)); g = apply(A, g, step(A, 'a8', 1, 0))
  assert.equal(((g.letters as Doc).stories as Doc & { a8: Doc }).a8.name, 'The grin at the name, the one fight kept.')
  assert.equal(status(write(A, g, send(A, 'a8', 'WAKE-GR-SAGE'))), 409, 'the chapter is over')
}

function testHollowCardStaysOwn() {
  assert.ok(pouchWrite({ hollow: { card: HOLLOW_CARD, at: 1 } }).ok)
  assert.ok(!pouchWrite({ hollow: { card: 'WAKE-GR-SAGE', at: 1 } }).ok)
}

testTheLines(); testAloneAndHome(); testOpen()
testOnceAChapter(testStepsAndStory(testSealedUntilBoth()))
testHollowCardStaysOwn()
console.log('letters: all checks passed')
