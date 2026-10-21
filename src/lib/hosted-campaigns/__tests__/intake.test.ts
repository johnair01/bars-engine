import { describe, it, expect } from 'vitest'
import { HOSTED_CAMPAIGNS_KEY, parseHostedStore, resolveHosted } from '../campaigns'
import { INTAKE_STEPS, appendStuck, buildDraft, cleanAnswers, emptyIntake, parseIntake, stepsFor } from '../intake'

describe('campaign intake', () => {
  it('has unique step ids and question keys, with steps on both platforms', () => {
    const steps = INTAKE_STEPS.map((s) => s.id)
    const keys = INTAKE_STEPS.flatMap((s) => s.questions.map((q) => q.key))
    expect(new Set(steps).size).toBe(steps.length)
    expect(new Set(keys).size).toBe(keys.length)
    expect(stepsFor('gofundme').length).toBeGreaterThan(5)
    expect(stepsFor('patreon').length).toBeGreaterThan(5)
  })

  it('keeps only known answers and drops junk stuck events', () => {
    expect(cleanAnswers({ gf_goal_amount: ' $3,000 ', nope: 'x', pt_name: 4 })).toEqual({ gf_goal_amount: '$3,000' })
    const intake = parseIntake({
      answers: { gf_title_draft: 'Help Annastasia' },
      stuck: [{ id: 'a', stepId: 'gf_story', choice: 'wave', at: '2026-10-21T00:00:00Z' }, { id: 'b', choice: 'nap' }],
    })
    expect(intake.stuck).toHaveLength(1)
    expect(appendStuck(intake, { id: 'c', stepId: 'pt_tiers', choice: 'book', at: 'x' }).stuck).toHaveLength(2)
  })

  it('survives a fields save: the intake is kept when the store is read back', () => {
    const theme = JSON.stringify({
      [HOSTED_CAMPAIGNS_KEY]: { annastasia: { fields: { story: 'Hi' }, editToken: 't', intake: { answers: { pt_name: 'Balancing Act' }, stuck: [] } } },
    })
    const store = parseHostedStore(theme)
    expect(store.annastasia.intake?.answers.pt_name).toBe('Balancing Act')
  })

  it('builds drafts that show brackets for missing answers and use her fields', () => {
    const fields = resolveHosted('annastasia', {})!.fields
    const gf = buildDraft('gofundme', { gf_title_draft: 'Help Annastasia keep coaching affordable' }, fields)
    expect(gf[0]).toEqual({ heading: 'Title', body: 'Help Annastasia keep coaching affordable' })
    expect(gf.find((s) => s.heading === 'Goal')?.body).toContain('[Goal amount]')
    const pt = buildDraft('patreon', emptyIntake().answers, fields)
    expect(pt[0].body).toContain('Balancing Act Coaching')
  })
})
