import { describe, expect, it } from 'vitest'
// Friendcraft onboarding slice 1 (Six-faces-council spec .specify/specs/friendcraft-deck): a friend's own deck, written in
// their book. The invariants: the mirror's hope never reaches the deck, a blank card is not drawn, cost follows depth only,
// and no digit is on a goal page.
import { applyCopy, cleanCopy, DEFAULT_COPY, BLANK_GOAL, COPY, COST, DEPTHS, HINTS, cardsOf, deckLeaves, mirrorHope, newGoal, pageWords, wordCard } from '../../../../public/between/friendcraft/deck.js'
import { leavesOf, openAt, pagesOf } from '../../../../public/between/iching/book.js'
import { deckWrite, mayWrite, parsePath, plantedHome, type Doc, type Who } from '@/lib/between/rules'

const me = 'playerA'
const member: Who = { playerId: me, member: true, invited: false }
const homeGarden = plantedHome(me, 1)
const deckOf = (extra: Doc = {}): Doc => ({ goals: { g1: { text: 'Someone who texts back', at: 5, cards: { light: { words: 'Ask me about my day', at: 6 } } } }, ...extra })

describe('deck.js', () => {
  it('reads cost from depth only: none, one, two', () => {
    expect(DEPTHS).toEqual(['light', 'middle', 'deep'])
    expect(COST).toEqual({ light: 0, middle: 1, deep: 2 })
    const g = wordCard(wordCard(wordCard(newGoal('A friend who stays', 1)!, 'light', 'a', 2), 'middle', 'b', 3), 'deep', 'c', 4)
    expect(cardsOf(g).map(c => [c.depth, c.cost])).toEqual([['light', 0], ['middle', 1], ['deep', 2]])
  })

  it('does not draw a blank card, and clearing a card takes it out of the list', () => {
    let g = newGoal('A friend who stays', 1)!
    expect(cardsOf(g)).toEqual([])
    g = wordCard(g, 'middle', '   ', 2)
    expect(cardsOf(g)).toEqual([])
    g = wordCard(g, 'middle', 'Sit with me a while', 3)
    expect(cardsOf(g).map(c => c.depth)).toEqual(['middle'])
    g = wordCard(g, 'middle', '', 4)
    expect(cardsOf(g)).toEqual([])
    expect(deckWrite({ goals: { g1: g as unknown as Doc } }).ok).toBe(true)
  })

  it('takes no goal without words', () => {
    expect(newGoal('  ', 1)).toBeNull()
    expect(newGoal('x'.repeat(300), 1)!.text.length).toBe(140)
  })

  it('never lets the mirror hope into the deck: it is read from the homeroom for display and the deck holds only what is written', () => {
    const home = { goals: { a: { text: 'old hope', room: null, at: 1 }, b: { text: 'I hope to be seen', room: null, at: 9 }, c: { text: 'for Bob', room: 'r1', at: 12 } } }
    expect(mirrorHope(home)).toBe('I hope to be seen')
    expect(mirrorHope({})).toBe('')
    const deck = { goals: { g1: newGoal('Someone who texts back', 20) } }
    expect(JSON.stringify(deck)).not.toContain('I hope to be seen')
    expect(deckLeaves(deck).map(l => l.name)).toEqual(['Someone who texts back'])
    // nothing in deck.js takes the homeroom into a goal: newGoal and wordCard take only the player's typed words
    expect(newGoal.length).toBe(2)
    expect(wordCard.length).toBe(4)
  })

  it('shows no digit on a goal page, blank or written', () => {
    const g = wordCard(newGoal('Someone who texts back', 1)!, 'deep', 'Stay when it is hard', 2)
    for (const words of [pageWords(null), pageWords(g), pageWords(g, { saved: true })]) expect(words.join(' ')).not.toMatch(/\d/)
    for (const t of [...Object.values(COPY), ...Object.values(HINTS)]) expect(t).not.toMatch(/\d/)
  })

  it('names the three lines the keep list said A to', () => {
    expect(COPY.ask).toBe('What do you want from a friend?')
    expect(COPY.anyone).toBe('Anyone you sit with can draw these.')
    expect([COPY.add, COPY.another]).toEqual(['Add these to my deck', 'Write another'])
  })
})

describe('the book with a deck', () => {
  const rooms = [{ id: 'r1', phase: 'between', person: 'bob', who: 'Bob' }]
  const home = { pages: { pa: { name: 'Mara', room: null, at: 2 } }, casts: {} }

  it('puts goal pages first, oldest first, then one blank goal leaf, then the person pages', () => {
    const deck = { goals: { g2: { text: 'Second', at: 9, cards: {} }, g1: { text: 'First', at: 3, cards: {} } } }
    const L = pagesOf(rooms, home, null, deck)
    expect(L.map(l => [l.kind, l.name])).toEqual([['goal', 'First'], ['goal', 'Second'], ['goalblank', ''], ['self', 'Yourself'], ['them', 'Bob'], ['named', 'Mara'], ['blank', '']])
  })

  it('an empty deck still has the blank goal leaf first; no deck leaves the book as built', () => {
    expect(pagesOf(rooms, home, null, {})[0]).toMatchObject({ kind: 'goalblank', key: BLANK_GOAL.key })
    expect(pagesOf(rooms, home).map(l => l.kind)).toEqual(['self', 'them', 'named', 'blank'])
  })

  it('has no goal pages inside a hollow', () => {
    expect(pagesOf(rooms, home, 'r1', { goals: { g1: { text: 'First', at: 1 } } }).map(l => l.kind)).toEqual(['self', 'them'])
    expect(leavesOf([], home, { blank: false, deck: {} })).toEqual([])
  })

  it('opens at the blank goal leaf with bookAt "goal", and at a goal page by its id', () => {
    const deck = { goals: { g1: { text: 'First', at: 3 } } }
    const L = pagesOf(rooms, home, null, deck)
    expect(L[openAt(L, { bookAt: 'goal' })].kind).toBe('goalblank')
    expect(L[openAt(L, { bookAt: 'g1' })].name).toBe('First')
  })
})

describe('deckWrite and the rules around the deck', () => {
  it('parses the deck path and keeps it in the homeroom, written only by its owner', () => {
    expect(parsePath(`data/users/${me}/deck`)).toEqual({ table: 'privates', playerId: me, key: 'deck' })
    const t = { table: 'privates', playerId: me, key: 'deck' } as const
    expect(mayWrite(member, homeGarden, t, 'update', deckOf(), null).ok).toBe(true)
    expect(mayWrite(member, { ...homeGarden, kind: 'between' }, t, 'update', deckOf(), null).ok).toBe(false)
    expect(mayWrite({ playerId: 'playerB', member: true, invited: false }, homeGarden, t, 'update', deckOf(), null).ok).toBe(false)
  })

  it('takes goals with up to three cards and nothing else', () => {
    expect(deckWrite(deckOf()).ok).toBe(true)
    expect(deckWrite({ goals: { g1: null } }).ok).toBe(true)
    expect(deckWrite({ goals: { g1: { text: 'x', at: 1, cards: { light: null, middle: { words: 'y', at: 2 } } } } }).ok).toBe(true)
  })

  it('refuses another key, a depth that is not one of three, a card with no words, and any count or cost field', () => {
    expect(deckWrite({ hope: 'I hope' }).ok).toBe(false)
    expect(deckWrite({ goals: { g1: { text: 'x', at: 1, cards: { shallow: { words: 'y', at: 2 } } } } }).ok).toBe(false)
    expect(deckWrite({ goals: { g1: { text: 'x', at: 1, cards: { light: { words: '  ', at: 2 } } } } }).ok).toBe(false)
    expect(deckWrite({ goals: { g1: { text: 'x', at: 1, cards: { light: {} } } } }).ok).toBe(false)
    expect(deckWrite({ goals: { g1: { text: 'x', at: 1, cost: 1 } } }).ok).toBe(false)
    expect(deckWrite({ goals: { g1: { text: 'x', at: 1, cards: { deep: { words: 'y', at: 2, cost: 2 } } } } }).ok).toBe(false)
    expect(deckWrite({ goals: { g1: { text: 'x', at: 1, count: 3 } } }).ok).toBe(false)
    expect(deckWrite({ goals: { g1: { text: '', at: 1 } } }).ok).toBe(false)
    expect(deckWrite({ goals: { g1: { text: 'x'.repeat(141), at: 1 } } }).ok).toBe(false)
    expect(deckWrite({ goals: { goal: { text: 'x', at: 1 } } }).ok).toBe(false)
  })

  it('lets the homeroom open at the blank goal leaf', () => {
    const t = { table: 'privates', playerId: me, key: 'home' } as const
    expect(mayWrite(member, homeGarden, t, 'update', { bookAt: 'goal' }, {}).ok).toBe(true)
  })
})

describe('admin-edited default text', () => {
  it('keeps only known one-line edits with no digit or markup', () => {
    expect(cleanCopy({ ask: '  What do you hope   a friend will do? ', add: 'Keep 3', another: '<b>x</b>', nope: 'x', anyone: 5, takeOut: 'x'.repeat(201) })).toEqual({ ask: 'What do you hope a friend will do?' })
    expect(cleanCopy({ ask: DEFAULT_COPY.ask, 'hint.deep': '' })).toEqual({})
    expect(cleanCopy(null)).toEqual({})
    expect(cleanCopy([1])).toEqual({})
  })
  it('puts an edit over the built-in text and restores it when cleared', () => {
    const built = { ask: COPY.ask, deep: HINTS.deep }
    applyCopy({ ask: 'What do you hope a friend will do?', 'hint.deep': 'Write what you tell only old friends.' })
    expect(COPY.ask).toBe('What do you hope a friend will do?')
    expect(HINTS.deep).toBe('Write what you tell only old friends.')
    expect(COPY.add).toBe(DEFAULT_COPY.add)
    applyCopy({})
    expect({ ask: COPY.ask, deep: HINTS.deep }).toEqual(built)
  })
})
