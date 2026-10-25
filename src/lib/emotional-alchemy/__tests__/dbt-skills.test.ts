import { describe, it, expect } from 'vitest'

import { DBT_SKILLS, dbtSkillsForTool, getDbtSkillById } from '../dbt-skills'
import { EMOTIONAL_ALCHEMY_TOOLS } from '../registry'

describe('DBT skill inventory', () => {
  it('has unique ids and slugs', () => {
    expect(new Set(DBT_SKILLS.map((s) => s.id)).size).toBe(DBT_SKILLS.length)
    expect(new Set(DBT_SKILLS.map((s) => s.slug)).size).toBe(DBT_SKILLS.length)
  })

  it('extends only tools that exist in the registry', () => {
    const ids = new Set(EMOTIONAL_ALCHEMY_TOOLS.map((t) => t.id))
    for (const s of DBT_SKILLS) expect(ids.has(s.extendsToolId)).toBe(true)
    for (const s of DBT_SKILLS) for (const p of s.preferAnotherToolWhen) expect(ids.has(p.toolId)).toBe(true)
  })

  it('keeps cold-water and intense-exercise steps out (tw-tipp-trim)', () => {
    const steps = DBT_SKILLS.flatMap((s) => s.steps).join(' ').toLowerCase()
    expect(steps).not.toMatch(/\b(cold|ice|sprint|intense|exercise)\b/)
  })

  it('leaves player-facing names unset until the term pass is answered', () => {
    for (const s of DBT_SKILLS) expect(s.playerFacingName).toBeNull()
  })

  it('aims inquiry skills at a daemon line, never the Player', () => {
    for (const id of ['D03', 'D04']) expect(getDbtSkillById(id)?.aimedAt).toBe('daemon_line')
  })

  it('only distress practices are safety exits', () => {
    for (const s of DBT_SKILLS) expect(s.safetyExit).toBe(s.module === 'distress_tolerance')
  })

  it('finds skills by tool', () => {
    expect(dbtSkillsForTool('T07').map((s) => s.id)).toEqual(['D01', 'D02'])
  })

  it('is unreviewed until the clinician read is recorded', () => {
    for (const s of DBT_SKILLS) expect(s.clinicianReview).toBe(false)
  })
})
