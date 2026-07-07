import { describe, it, expect } from 'vitest'

import {
  EMOTIONAL_ALCHEMY_TOOLS,
  HARD_GUARDS,
  SPIRIT_STEPS,
  EMOTION_TO_ELEMENT,
  getToolById,
  getToolBySlug,
  ratingAtLeast,
  toolsForSubmove,
  toolsForChannel,
  toolForShape,
  type BlockerShape,
  type EmotionChannel,
  type SatisfactionSpirit,
  type ToolRating,
  type WaveLens,
} from '../index'
import { CANONICAL_TECHNIQUES } from '@/lib/technique-library/canonical'
import { DEFAULT_FIRST_AID_TOOLS } from '@/lib/emotional-first-aid'
import { CAPABILITIES } from '@/lib/allyship-deck/move-library'

const TOOL_IDS = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11'] as const

// ── Canon drift fixtures ────────────────────────────────────────────────────
// Independent transcription of docs/EMOTIONAL_ALCHEMY_TOOL_TAXONOMY.md (v1.1)
// compact matrices 1–3. If registry.ts and this block disagree, one of them
// drifted from the doc — fix the doc first, then both (a rating edit is a
// canon change, per Atlas §4.1).

type R = ToolRating
const s: R = 'strong'
const m: R = 'medium'
const w: R = 'weak'
const n: R = 'not_recommended'

/** Matrix 1: Tool × WAVE submove — [wake, open, clean, grow, show]. */
const MATRIX_WAVE: Record<string, [R, R, R, R, R]> = {
  T01: [s, m, s, s, m],
  T02: [s, s, s, m, w],
  T03: [s, m, m, s, m],
  T04: [m, w, s, s, m],
  T05: [s, m, m, s, m],
  T06: [m, w, m, s, s],
  T07: [m, s, m, m, w],
  T08: [m, w, w, m, s],
  T09: [m, s, w, m, m],
  T10: [w, s, m, m, s],
  T11: [w, m, w, s, m],
}

/** Matrix 2: Tool × move role — [metabolize, translate, transcend]. */
const MATRIX_ROLE: Record<string, [R, R, R]> = {
  T01: [s, s, m],
  T02: [s, m, s],
  T03: [m, m, m],
  T04: [s, m, m],
  T05: [m, s, w],
  T06: [w, m, m],
  T07: [m, w, w],
  T08: [w, m, m],
  T09: [w, m, s],
  T10: [m, m, s],
  T11: [w, m, s],
}

/** Matrix 3: Tool × emotion channel — [anger, sadness, fear, joy, neutrality]. */
const MATRIX_CHANNEL: Record<string, [R, R, R, R, R]> = {
  T01: [s, s, s, m, m],
  T02: [m, s, s, m, s],
  T03: [m, s, m, m, s],
  T04: [s, m, s, w, m],
  T05: [s, w, s, w, s],
  T06: [s, w, s, w, s],
  T07: [s, w, s, w, s],
  T08: [s, w, m, m, s],
  T09: [w, w, m, s, s],
  T10: [m, s, w, s, m],
  T11: [w, n, m, s, m],
}

const WAVE_ORDER: WaveLens[] = ['wake_up', 'open_up', 'clean_up', 'grow_up', 'show_up']
const CHANNEL_ORDER: EmotionChannel[] = ['anger', 'sadness', 'fear', 'joy', 'neutrality']
const SPIRITS: SatisfactionSpirit[] = ['peace', 'triumph', 'poignance', 'bliss', 'wonder']

/** Atlas §4.1 shape map. */
const SHAPE_MAP: Record<BlockerShape, string[]> = {
  interpersonal_live: ['T06'],
  imagined_other: ['T01'],
  two_voices: ['T01'],
  belief_sentence: ['T04'],
  many_items: ['T05'],
  win_wont_land: ['T09'],
  practice_edge: ['T11'],
  unclear_heavy_body: ['T02'],
  ready_to_act: ['T08'],
}

describe('registry shape', () => {
  it('contains exactly T01–T11 in order, with unique ids and slugs', () => {
    expect(EMOTIONAL_ALCHEMY_TOOLS.map((t) => t.id)).toEqual([...TOOL_IDS])
    const slugs = EMOTIONAL_ALCHEMY_TOOLS.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every tool is structurally complete', () => {
    for (const tool of EMOTIONAL_ALCHEMY_TOOLS) {
      expect(tool.protocol.steps.length, tool.id).toBeGreaterThanOrEqual(3)
      expect(tool.outputFields.length, tool.id).toBeGreaterThan(0)
      expect(tool.completionCriteria.length, tool.id).toBeGreaterThan(0)
      expect(tool.whenNotToUse.length, tool.id).toBeGreaterThan(0)
      expect(tool.barReflection.length, tool.id).toBeGreaterThan(0)
      expect(tool.coreMechanic.length, tool.id).toBeGreaterThan(0)
      expect(tool.misuse.length, tool.id).toBeGreaterThan(0)
      expect(tool.timebox.minMinutes, tool.id).toBeGreaterThan(0)
      expect(tool.timebox.maxMinutes, tool.id).toBeGreaterThanOrEqual(tool.timebox.minMinutes)
      if (tool.timebox.quickMinutes !== undefined) {
        expect(tool.timebox.quickMinutes, tool.id).toBeLessThanOrEqual(tool.timebox.maxMinutes)
      }
      for (const spirit of SPIRITS) {
        expect(tool.spiritNotes[spirit]?.length, `${tool.id} spiritNotes.${spirit}`).toBeGreaterThan(0)
      }
    }
  })
})

describe('canon drift — taxonomy compact matrices', () => {
  it('waveRatings match Compact Matrix 1', () => {
    for (const tool of EMOTIONAL_ALCHEMY_TOOLS) {
      const expected = MATRIX_WAVE[tool.id]
      WAVE_ORDER.forEach((lens, i) => {
        expect(tool.waveRatings[lens], `${tool.id} wave ${lens}`).toBe(expected[i])
      })
    }
  })

  it('moveRoleRatings match Compact Matrix 2', () => {
    for (const tool of EMOTIONAL_ALCHEMY_TOOLS) {
      const [metabolize, translate, transcend] = MATRIX_ROLE[tool.id]
      expect(tool.moveRoleRatings.metabolize, `${tool.id} metabolize`).toBe(metabolize)
      expect(tool.moveRoleRatings.translate, `${tool.id} translate`).toBe(translate)
      expect(tool.moveRoleRatings.transcend, `${tool.id} transcend`).toBe(transcend)
    }
  })

  it('channelRatings match Compact Matrix 3', () => {
    for (const tool of EMOTIONAL_ALCHEMY_TOOLS) {
      const expected = MATRIX_CHANNEL[tool.id]
      CHANNEL_ORDER.forEach((channel, i) => {
        expect(tool.channelRatings[channel], `${tool.id} channel ${channel}`).toBe(expected[i])
      })
    }
  })
})

describe('hard guards (Atlas §4)', () => {
  it('declares all seven guards', () => {
    expect(Object.keys(HARD_GUARDS).sort()).toEqual(
      [
        'action_on_grief_block',
        'clean_line_readiness',
        'external_gate',
        'grief_inquiry_block',
        'hot_charge',
        'joy_tool_block',
        'no_gamified_risk',
      ].sort()
    )
  })

  it('assigns tool-specific guards; pipeline guards stay global', () => {
    expect(getToolById('T04')!.hardGuardIds).toContain('grief_inquiry_block')
    expect(getToolById('T06')!.hardGuardIds).toContain('clean_line_readiness')
    expect(getToolById('T08')!.hardGuardIds).toContain('action_on_grief_block')
    expect(getToolById('T09')!.hardGuardIds).toContain('joy_tool_block')
    expect(getToolById('T11')!.hardGuardIds).toEqual(expect.arrayContaining(['joy_tool_block', 'no_gamified_risk']))
    // T07 is the hot-charge remedy, never guarded itself.
    expect(getToolById('T07')!.hardGuardIds).toEqual([])
    // hot_charge and external_gate are pipeline rules — assigned to no tool.
    for (const tool of EMOTIONAL_ALCHEMY_TOOLS) {
      expect(tool.hardGuardIds, tool.id).not.toContain('hot_charge')
      expect(tool.hardGuardIds, tool.id).not.toContain('external_gate')
    }
  })

  it('every referenced guard id exists', () => {
    for (const tool of EMOTIONAL_ALCHEMY_TOOLS) {
      for (const id of tool.hardGuardIds) {
        expect(HARD_GUARDS[id], `${tool.id} → ${id}`).toBeDefined()
      }
    }
  })
})

describe('show up templates (Atlas §5.2) — deterministic slot resolution', () => {
  const PLAYER_SLOTS = new Set(['recipient', 'date', 'time'])

  it('every [slot] resolves to an output field or a player-supplied slot', () => {
    for (const tool of EMOTIONAL_ALCHEMY_TOOLS) {
      for (const template of [tool.showUpTemplates.internal, tool.showUpTemplates.external]) {
        const slots = [...template.matchAll(/\[([a-z_]+)\]/g)].map((match) => match[1])
        for (const slot of slots) {
          const resolves = tool.outputFields.includes(slot) || PLAYER_SLOTS.has(slot)
          expect(resolves, `${tool.id} template slot [${slot}] must resolve`).toBe(true)
        }
      }
    }
  })

  it('external templates that name a recipient also carry a date-like slot', () => {
    for (const tool of EMOTIONAL_ALCHEMY_TOOLS) {
      const external = tool.showUpTemplates.external
      if (external.includes('[recipient]')) {
        expect(
          /\[(date|time|rep_one_date)\]/.test(external),
          `${tool.id} external template names a recipient but no date/time`
        ).toBe(true)
      }
    }
  })
})

describe('registry reconciliation (Practice Atlas gap G4)', () => {
  const techniqueIds = new Set(CANONICAL_TECHNIQUES.map((t) => t.id))
  const firstAidKeys = new Set(DEFAULT_FIRST_AID_TOOLS.map((t) => t.key))

  it('every mapped technique id exists in CANONICAL_TECHNIQUES', () => {
    for (const tool of EMOTIONAL_ALCHEMY_TOOLS) {
      for (const id of tool.mappings.techniqueIds) {
        expect(techniqueIds.has(id), `${tool.id} → technique ${id}`).toBe(true)
      }
    }
  })

  it('every mapped first-aid key exists in DEFAULT_FIRST_AID_TOOLS', () => {
    for (const tool of EMOTIONAL_ALCHEMY_TOOLS) {
      for (const key of tool.mappings.firstAidKeys) {
        expect(firstAidKeys.has(key), `${tool.id} → first-aid ${key}`).toBe(true)
      }
    }
  })

  it('anchor mappings hold (taxonomy mapping table)', () => {
    expect(getToolById('T01')!.mappings.techniqueIds).toContain('tech-3-2-1')
    expect(getToolById('T01')!.mappings.firstAidKeys).toContain('shadow-321')
    expect(getToolById('T06')!.mappings.firstAidKeys).toContain('boundary-shield')
    expect(getToolById('T07')!.mappings.techniqueIds).toContain('tech-grounding')
    expect(getToolById('T08')!.mappings.firstAidKeys).toContain('command-bridge')
    expect(getToolById('T09')!.mappings.techniqueIds).toContain('tech-happy-apples')
  })

  it('preferAnotherToolWhen references resolve inside the registry', () => {
    for (const tool of EMOTIONAL_ALCHEMY_TOOLS) {
      for (const pref of tool.preferAnotherToolWhen) {
        expect(getToolById(pref.toolId), `${tool.id} → prefer ${pref.toolId}`).toBeDefined()
        expect(pref.toolId).not.toBe(tool.id)
      }
    }
  })
})

describe('emotion → element bridge — no drift vs CAPABILITIES', () => {
  const DISSATISFIED_TO_EMOTION: Record<string, EmotionChannel> = {
    Anger: 'anger',
    Sadness: 'sadness',
    Fear: 'fear',
    'Joy (stuck)': 'joy',
    Neutrality: 'neutrality',
  }

  it('maps every emotion to the element its capability declares', () => {
    expect(CAPABILITIES.length).toBe(5)
    for (const cap of CAPABILITIES) {
      const emotion = DISSATISFIED_TO_EMOTION[cap.dissatisfied]
      expect(emotion, `unmapped dissatisfied label ${cap.dissatisfied}`).toBeDefined()
      expect(EMOTION_TO_ELEMENT[emotion], `emotion ${emotion}`).toBe(cap.channel)
    }
  })
})

describe('shape map (Atlas §4.1)', () => {
  it('covers all nine shapes with the Atlas-assigned tools', () => {
    for (const [shape, expectedIds] of Object.entries(SHAPE_MAP) as [BlockerShape, string[]][]) {
      expect(
        toolForShape(shape).map((t) => t.id),
        `shape ${shape}`
      ).toEqual(expectedIds)
    }
  })
})

describe('accessors', () => {
  it('getToolById / getToolBySlug round-trip', () => {
    for (const tool of EMOTIONAL_ALCHEMY_TOOLS) {
      expect(getToolById(tool.id)).toBe(tool)
      expect(getToolBySlug(tool.slug)).toBe(tool)
    }
    expect(getToolById('T99')).toBeUndefined()
  })

  it('ratingAtLeast orders not_recommended < weak < medium < strong', () => {
    expect(ratingAtLeast('strong', 'medium')).toBe(true)
    expect(ratingAtLeast('medium', 'medium')).toBe(true)
    expect(ratingAtLeast('weak', 'medium')).toBe(false)
    expect(ratingAtLeast('not_recommended', 'weak')).toBe(false)
  })

  it('toolsForSubmove reproduces the composer candidate sets (Atlas §4.1 step 3)', () => {
    expect(toolsForSubmove('clean_up').map((t) => t.id)).toEqual(['T01', 'T02', 'T04'])
    expect(toolsForSubmove('show_up').map((t) => t.id)).toEqual(['T06', 'T08', 'T10'])
    expect(toolsForSubmove('open_up').map((t) => t.id)).toEqual(['T02', 'T07', 'T09', 'T10'])
    // medium admission widens the pool (Atlas §4.1 step 3 fallback)
    expect(toolsForSubmove('show_up', 'medium').map((t) => t.id)).toEqual([
      'T01', 'T03', 'T04', 'T05', 'T06', 'T08', 'T09', 'T10', 'T11',
    ])
  })

  it('toolsForChannel reads Matrix 3 (sadness strong column = T01, T02, T03, T10)', () => {
    expect(toolsForChannel('sadness').map((t) => t.id)).toEqual(['T01', 'T02', 'T03', 'T10'])
    expect(toolsForChannel('anger').map((t) => t.id)).toEqual(['T01', 'T04', 'T05', 'T06', 'T07', 'T08'])
  })
})

describe('spirit steps (Atlas §5.3)', () => {
  it('ships exactly five fill-in-the-blank steps', () => {
    expect(Object.keys(SPIRIT_STEPS).sort()).toEqual([...SPIRITS].sort())
    for (const spirit of SPIRITS) {
      expect(SPIRIT_STEPS[spirit]).toContain('___')
    }
  })
})
