import { describe, expect, it } from 'vitest'
import { interpret, intensity, readAll, QUESTIONS, STOCK, FROM_GRAMMAR, type Question } from '../interpret'
import { UNPACKING_QUESTIONS } from '../../quest-grammar/unpacking-constants'
import { KEEPS } from '../engine'

/* the goal the first table is dealt from (public/lantern/table/table.js DIRECTOR_GOAL) */
const DIRECTOR_GOAL = 'Send the TDT director application'

describe('the plate asks the six Unpacking Questions in the quest grammar\'s words', () => {
  it('engraves q1 to q6 as UNPACKING_QUESTIONS labels them', () => {
    expect(QUESTIONS).toEqual(UNPACKING_QUESTIONS.map(u => u.label))
    expect(QUESTIONS).toHaveLength(6)
  })
  it('maps the quest grammar channels on the lantern five', () => {
    expect(FROM_GRAMMAR).toEqual({ Anger: 'fire', Joy: 'wood', Sadness: 'water', Fear: 'metal', Neutrality: 'earth' })
  })
})

describe('q1: the goal and its kind of work', () => {
  it('stamps the TDT director application as Direct Action', () => {
    const r = interpret(1, DIRECTOR_GOAL)
    expect(r.goal).toBe(DIRECTOR_GOAL)
    expect(r.kind).toBe('Direct Action')
    expect(r.heard).toEqual(['send'])
    expect(r.line).toBe("I heard 'send', so the plate stamps your goal as Direct Action.")
  })
  it('trims the goal and keeps it to 80 characters', () => {
    const r = interpret(1, `   Raise   the money ${'x'.repeat(100)}`)
    expect(r.goal!.startsWith('Raise the money')).toBe(true)
    expect(r.goal!.length).toBeLessThanOrEqual(80)
    expect(r.kind).toBe('Gather Resource')
  })
  it('still lands a goal with no kind of work in it', () => {
    const r = interpret(1, 'the quiet garden')
    expect(r.goal).toBe('the quiet garden')
    expect(r.kind).toBeUndefined()
    expect(r.heard).toEqual([])
    expect(r.line).toMatch(/no kind of work/)
  })
  it('stock answers lead with the director goal', () => {
    expect(STOCK[1][0]).toBe(DIRECTOR_GOAL)
  })
})

describe('q2: the ring turns to the channels the words name', () => {
  it('hears proud and free as Fire and Wood', () => {
    const r = interpret(2, 'I will feel proud and free')
    expect(r.want).toEqual(['fire', 'wood'])
    expect(r.line).toBe("I heard 'proud' and 'free', so the ring turns to Triumph and Bliss.")
  })
  it('reads the quest grammar compiler\'s own words (triumphant, poignant)', () => {
    expect(interpret(2, 'triumphant').want).toEqual(['fire'])
    expect(interpret(2, 'poignant').want).toEqual(['water'])
  })
})

describe('q3: the lantern\'s flame', () => {
  it('Stalled, Flowing and Neutral', () => {
    expect(interpret(3, "I'm stuck and nothing moves").life).toBe('Stalled')
    expect(interpret(3, 'Things are moving well, good momentum').life).toBe('Flowing')
    expect(interpret(3, "It's fine, the same as usual").life).toBe('Neutral')
  })
})

describe('q4: the lever and its weight', () => {
  it('hears stuck and scared, and swings to Metal', () => {
    const r = interpret(4, 'I feel stuck and scared')
    expect(r.now).toEqual({ ch: 'metal', n: 2 })
    expect(r.line).toBe("I heard 'stuck' and 'scared', so the lever swings to Metal with a middle weight.")
  })
  it('intensifiers drop the weight further', () => {
    expect(interpret(4, "I'm really scared").now).toEqual({ ch: 'metal', n: 3 })
    expect(interpret(4, 'so totally angry!').now).toEqual({ ch: 'fire', n: 3 })
  })
  it('softeners lighten it', () => {
    expect(interpret(4, 'a bit sad').now).toEqual({ ch: 'water', n: 1 })
    expect(interpret(4, 'kind of numb').now).toEqual({ ch: 'earth', n: 1 })
  })
  it('intensity stays between 1 and 3', () => {
    expect(intensity('very very really so totally!!!').n).toBe(3)
    expect(intensity('a bit kind of slightly').n).toBe(1)
    expect(intensity('sad').n).toBe(2)
  })
  it('a word inside another word is not heard (mad is not made)', () => {
    expect(interpret(4, 'I made it').now).toBeUndefined()
  })
})

describe('q5: the toggles', () => {
  it('flips the channels named true, and keeps the words with them', () => {
    const r = interpret(5, "There's an obstacle, and I'd have to fear being judged")
    expect(r.truth).toEqual(['fire', 'metal'])
    expect(r.truthCtx).toEqual({ fire: "There's an obstacle, and I'd have to fear being judged", metal: "There's an obstacle, and I'd have to fear being judged" })
  })
  it('keeps unmatched words with the feeling of q4', () => {
    const r = interpret(5, 'blue sky', { now: { water: 2 } })
    expect(r.truth).toBeUndefined()
    expect(r.truthCtx).toEqual({ water: 'blue sky' })
    expect(r.line).toMatch(/^I heard nothing I know in that/)
    expect(r.line).toMatch(/by hand/)
  })
})

describe('q6: the reservations and their collars', () => {
  it('names two keeps with different channels and strengths, clause by clause', () => {
    const r = interpret(6, "I'm not ready and I'm scared. I'm really angry that I'm not good enough!")
    expect(r.keeps).toEqual([
      { i: 5, tags: { metal: 2 } },
      { i: 0, tags: { fire: 3 } },
    ])
    expect(KEEPS[5].b).toBe('Not ready')
    expect(r.line).toBe("I heard 'not ready', 'scared', 'really', 'angry' and 'not good enough', so two stones rise: Not ready in Metal at the belly and Not good enough in Fire at the shoulder.")
  })
  it('a keep named with no feeling rises in fog', () => {
    const r = interpret(6, "I don't belong there")
    expect(r.keeps).toEqual([{ i: 2, tags: {} }])
    expect(r.line).toMatch(/Don't belong in fog/)
  })
  it('a softener sets the collar at the foot', () => {
    expect(interpret(6, "It won't matter to anyone, and that is a bit sad.").keeps).toEqual([{ i: 4, tags: { water: 1 } }])
  })
})

describe('no match, and every stock answer', () => {
  it('unmatched text says nothing was heard and the hand can set it', () => {
    for (const q of [2, 3, 4, 6] as Question[]) {
      const r = interpret(q, 'xyzzy plover')
      expect(r.heard).toEqual([])
      expect(r.line).toMatch(/^I heard no/)
      expect(r.line).toMatch(/by hand/)
    }
  })
  it('an empty answer changes nothing', () => {
    const r = interpret(4, '   ')
    expect(r.now).toBeUndefined()
    expect(r.line).toMatch(/waits for your words/)
  })
  it('each question has three stock answers, and every one is heard', () => {
    for (const q of [1, 2, 3, 4, 5, 6] as Question[]) {
      expect(STOCK[q]).toHaveLength(3)
      for (const s of STOCK[q]) expect(interpret(q, s).heard.length).toBeGreaterThan(0)
    }
  })
  it('lines are complete sentences with no word ending in -ization', () => {
    for (const q of [1, 2, 3, 4, 5, 6] as Question[]) for (const s of [...STOCK[q], 'xyzzy']) {
      const { line } = interpret(q, s)
      expect(line).toMatch(/^[A-Z].*\.$/)
      expect(line).not.toMatch(/ization\b/i)
    }
  })
})

describe('readAll: one text pencils all six answers', () => {
  it('a dissatisfied sentence with two shadow voices', () => {
    const r = readAll("I'm scared I'm not ready, and so anxious that I'm not good enough.")
    expect(r.state).toBe('dissatisfied')
    expect(r.channel).toBe('metal')
    expect(r.shadowVoices).toEqual(['Not ready', 'Not good enough'])
    expect(r.answers.q4.now).toEqual({ ch: 'metal', n: 3 })
    expect(r.heard).toEqual(expect.arrayContaining(['scared', 'not ready', 'anxious', 'not good enough']))
  })
  it('a satisfied sentence', () => {
    const r = readAll('I felt proud and free when the show went out')
    expect(r.state).toBe('satisfied')
    expect(r.answers.q2.want).toEqual(['fire', 'wood'])
    expect(r.shadowVoices).toEqual([])
  })
  it('a neutral sentence that names nothing', () => {
    const r = readAll('The meeting is on Tuesday at noon')
    expect(r.state).toBe('neutral')
    expect(r.channel).toBeNull()
    expect(r.shadowVoices).toEqual([])
    expect(r.heard).toEqual([])
    expect(r.answers.q1.goal).toBe('The meeting is on Tuesday at noon')
  })
})
