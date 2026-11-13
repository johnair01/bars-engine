import { describe, expect, it } from 'vitest'
import { sortBar, WORK_TYPES, DEFAULT_RULE } from '../sort'

describe('sortBar', () => {
  it('names one of the eight work types, and the rule that chose it', () => {
    expect(WORK_TYPES).toHaveLength(8)
    const r = sortBar({ title: 'Renew my insurance', description: 'call the agent' })
    expect(r).toEqual({ type: 'personal_ops', rule: 'ops-words' })
  })
  it('a stored merged spec wins over words', () => {
    expect(sortBar({ title: 'Renew insurance', description: '', hasMergedSpec: true }).type).toBe('build_from_spec')
  })
  it('an idea with no mark becomes a spec first', () => {
    expect(sortBar({ title: 'Overwhelm at all this technology', description: 'it makes me sad' })).toEqual(DEFAULT_RULE)
  })
  it('is deterministic', () => {
    const i = { title: 'Turn the sway down', description: 'too fast' }
    expect(sortBar(i)).toEqual(sortBar(i))
    expect(sortBar(i).type).toBe('recipe_knob')
  })
})
