import { describe, expect, it } from 'vitest'
import { DBT_SKILLS } from '../dbt-skills'
import { EMOTIONAL_ALCHEMY_TOOLS, HARD_GUARDS } from '../registry'

const DBT_NAMES = /\b(TIPP|DEAR MAN|GIVE|FAST|Wise Mind)\b/

describe('DBT skill inventory', () => {
  it('has unique ids and slugs, none colliding with T01–T11', () => {
    const ids = DBT_SKILLS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(DBT_SKILLS.map((s) => s.slug)).size).toBe(ids.length)
    for (const id of ids) expect(EMOTIONAL_ALCHEMY_TOOLS.some((t) => t.id === id)).toBe(false)
  })

  it('stays out of the T01–T11 tool pool the composer reads', () => {
    expect(EMOTIONAL_ALCHEMY_TOOLS).toHaveLength(11)
  })

  it('keeps DBT names in lineage only, never in player-facing names', () => {
    for (const s of DBT_SKILLS) {
      expect(s.genericName, s.id).not.toMatch(DBT_NAMES)
      expect(s.barsName, s.id).not.toMatch(DBT_NAMES)
      expect(s.lineage, s.id).toMatch(/DBT/)
      expect(s.adaptedFrom.length, s.id).toBeGreaterThan(0)
    }
  })

  it('fills every field the tool shape needs and resolves references', () => {
    const toolIds = new Set(EMOTIONAL_ALCHEMY_TOOLS.map((t) => t.id))
    const PLAYER_SLOTS = new Set(['recipient', 'date', 'time'])
    for (const s of DBT_SKILLS) {
      expect(s.protocol.steps.length, s.id).toBeGreaterThanOrEqual(3)
      expect(s.whenNotToUse.length, s.id).toBeGreaterThan(0)
      expect(toolIds.has(s.extendsToolId), s.id).toBe(true)
      for (const p of s.preferAnotherToolWhen) expect(toolIds.has(p.toolId), `${s.id} → ${p.toolId}`).toBe(true)
      for (const g of s.hardGuardIds) expect(HARD_GUARDS[g], `${s.id} → ${g}`).toBeDefined()
      for (const t of [s.showUpTemplates.internal, s.showUpTemplates.external]) {
        for (const m of t.matchAll(/\[([a-z_]+)\]/g)) {
          expect(s.outputFields.includes(m[1]) || PLAYER_SLOTS.has(m[1]), `${s.id} [${m[1]}]`).toBe(true)
        }
      }
    }
  })

  it('trims TIPP to paced breathing and paired relaxation (tw-tipp-trim)', () => {
    const text = JSON.stringify(DBT_SKILLS.find((s) => s.id === 'DBT01')!.protocol).toLowerCase()
    expect(text).not.toMatch(/cold|ice|water|exercise|sprint/)
  })
})
