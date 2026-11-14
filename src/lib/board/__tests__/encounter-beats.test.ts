import { describe, expect, it } from 'vitest'
import {
  BEATS, BEAT_DEFS, MAX_OPEN_BUDS, beatDone, budTest, deckOf, encounterErrors, encounterFromIntake, letGoIsDone, openBud,
  setBudDown, triangulatePlan, type Encounter, type Intake,
} from '@/lib/board/encounter-beats'
import { validateSave } from '@/lib/board/save'

// A made-up intake. No player's real answers belong in a test.
const intake: Intake = {
  q1: 'a small garden show in the spring',
  q2: 'settled and proud',
  q3: 'busy and scattered',
  q4: 'like running for a bus',
  q5: 'that people come for the plants, not for me',
  q6: ['no one will come', 'I will run out of money', 'the plants will die', 'I am not a real gardener'],
}

describe('the eight beats', () => {
  it('keep his names and story order, the intake filling the first half', () => {
    expect(BEATS.map(k => BEAT_DEFS[k].label)).toEqual([
      'Backstory', 'Desire', 'The wall', 'Epiphany', 'The plan', 'Episodic conflicts', 'Transformation', 'Achievement'])
    expect(BEATS.filter(k => BEAT_DEFS[k].half === 'intake')).toEqual(['backstory', 'desire', 'wall', 'epiphany'])
    expect(BEAT_DEFS.wall.fills).toEqual(['q6'])
    expect(BEAT_DEFS.epiphany.fills).toEqual(['q5'])
    expect(BEAT_DEFS.plan.fills).toEqual([])
  })
})

describe('the plan card', () => {
  it('draws Q1, Q5 and Q6 together, one drafted step per reservation', () => {
    const p = triangulatePlan('garden', intake)
    expect(p.goal).toBe(intake.q1)
    expect(p.truth).toBe(intake.q5)
    expect(p.steered).toBe(false)
    expect(p.steps.map(s => s.reservation)).toEqual(intake.q6)
    expect(p.steps[0].budId).toBe('garden--bud-1')
    expect(p.steps[0].draft).toContain('no one will come')
    expect(p.steps[0].draft).toContain(intake.q5!)
  })

  it('still drafts a step when Q5 was skipped', () => {
    const p = triangulatePlan('g', { q6: ['x'] })
    expect(p.steps[0].draft).not.toContain('""')
  })
})

describe('buds', () => {
  it('open no more than three and leave the rest unplayed, each naming its encounter', () => {
    const e = encounterFromIntake('garden', 'The garden show', intake)
    expect(e.buds).toHaveLength(4)
    expect(e.buds.filter(b => b.state === 'open')).toHaveLength(MAX_OPEN_BUDS)
    expect(e.buds[3].state).toBe('unplayed')
    expect(e.buds.every(b => b.budOf === 'garden')).toBe(true)
    expect(openBud(e.buds, e.buds[3].id)).toEqual({ error: expect.stringContaining('3 buds are open') })
    const swapped = openBud(setBudDown(e.buds, e.buds[0].id), e.buds[3].id)
    expect(Array.isArray(swapped) && swapped.filter(b => b.state === 'open').map(b => b.id))
      .toEqual(['garden--bud-2', 'garden--bud-3', 'garden--bud-4'])
  })

  it('keep Q5 asked of a reservation apart from the encounter\'s own Q5', () => {
    const e = encounterFromIntake('garden', 'The garden show', intake)
    expect(e.buds[0].epiphany).toBeUndefined()
    expect(e.intake.q5).toBe(intake.q5)
  })
})

describe('the deck', () => {
  it('puts the plan on top of a done intake, the rest underneath, and a small deck per open bud', () => {
    const e = encounterFromIntake('garden', 'The garden show', intake)
    const d = deckOf(e)
    expect(d.spirit.top?.beat).toBe('plan')
    expect(d.spirit.under.map(c => c.beat)).toEqual(['conflicts', 'transformation', 'achievement'])
    expect(d.spirit.done.map(c => c.beat)).toEqual(['backstory', 'desire', 'wall', 'epiphany'])
    expect(d.buds).toHaveLength(3)
    expect(d.buds[0].top?.beat).toBe('epiphany')
    expect(d.buds[0].left).toBe(2)
  })

  it('moves a bud to its step, then off the top once the player steers it', () => {
    const e = encounterFromIntake('garden', 'The garden show', intake)
    e.buds[0] = { ...e.buds[0], epiphany: 'a few friends would come' }
    expect(deckOf(e).buds[0].top?.beat).toBe('step')
    e.buds[0] = { ...e.buds[0], step: 'ask three friends', steered: false }
    expect(deckOf(e).buds[0].top?.beat).toBe('step')
    e.buds[0] = { ...e.buds[0], steered: true }
    expect(deckOf(e).buds[0].top).toBeNull()
  })
})

describe('achievement', () => {
  const base = (): Encounter => ({ ...encounterFromIntake('g', 'G', intake) })

  it('counts a let-go only with own words, compost and a return date (Regent)', () => {
    expect(letGoIsDone({ words: 'I am setting this down for now', composted: true, returnOn: '2027-05-01' })).toBe(true)
    expect(letGoIsDone({ words: 'I am setting this down', composted: false, returnOn: '2027-05-01' })).toBe(false)
    expect(letGoIsDone({ words: '', composted: true, returnOn: '2027-05-01' })).toBe(false)
    expect(letGoIsDone({ words: 'done', composted: true })).toBe(false)
    const e = base()
    e.achievement = { held: true }
    expect(beatDone(e, 'achievement')).toBe(true)
  })
})

describe('Challenger\'s test', () => {
  it('passes when at least half the reservations bud a step the player would take within a week', () => {
    const e = encounterFromIntake('g', 'G', intake)
    expect(budTest(e, { 'g--bud-1': true, 'g--bud-2': true })).toEqual({ total: 4, yes: 2, pass: true })
    expect(budTest(e, { 'g--bud-1': true })).toEqual({ total: 4, yes: 1, pass: false })
    expect(budTest(encounterFromIntake('n', 'N', {}), {}).pass).toBe(false)
  })
})

describe('saving an encounter with a battle', () => {
  const save = (data: Record<string, unknown>) =>
    validateSave({ board: 'council', collection: 'battles', docId: 'garden', mode: 'set', data: { id: 'garden', name: 'The garden show', rounds: [], ...data } })

  it('accepts a sound encounter and a battle without one', () => {
    expect(save({}).ok).toBe(true)
    expect(save({ encounter: encounterFromIntake('garden', 'The garden show', intake) }).ok).toBe(true)
  })

  it('refuses four open buds, a bud with no budOf, and a let-go with no return date', () => {
    const e = encounterFromIntake('garden', 'The garden show', intake)
    expect(encounterErrors({ ...e, buds: e.buds.map(b => ({ ...b, state: 'open' })) })).toContain('no more than 3 buds are open')
    expect(encounterErrors({ ...e, buds: [{ ...e.buds[0], budOf: undefined }] }))
      .toContain('every bud names the encounter it grew from in budOf')
    const r = save({ encounter: { ...e, achievement: { letGo: { words: 'later', composted: true } } } })
    expect(r.ok).toBe(false)
    expect(save({ budOf: '' }).ok).toBe(false)
  })
})
