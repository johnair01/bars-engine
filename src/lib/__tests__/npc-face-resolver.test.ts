/**
 * Tests for NPC Face Resolver — portraysFace + effectiveFace runtime computation
 *
 * Verifies:
 *   - Non-Sage NPCs: effectiveFace === portraysFace (fixed)
 *   - Sage NPCs: effectiveFace computed from scene context
 *   - Validation: invalid portraysFace values → null
 *   - Batch operations: filter and resolve arrays of NPCs
 */

import { describe, it, expect } from 'vitest'
import {
  resolveEffectiveFace,
  resolveEffectiveFaces,
  filterNpcsByEffectiveFace,
  isSageNpc,
  isValidGameMasterFace,
  parsePortraysFace,
  type NpcFaceInput,
  type SageSceneContext,
} from '../npc-face-resolver'
import type { EmotionalVector, GameMasterFace } from '../quest-grammar/types'

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeNpc(portraysFace: string | null, archetypalRole = 'guardian'): NpcFaceInput {
  return { portraysFace, archetypalRole }
}

function makeEmotionalVector(channelFrom: string, channelTo: string): EmotionalVector {
  return {
    channelFrom: channelFrom as EmotionalVector['channelFrom'],
    altitudeFrom: 'neutral',
    channelTo: channelTo as EmotionalVector['channelTo'],
    altitudeTo: 'neutral',
  }
}

// ─── Validation ────────────────────────────────────────────────────────────

describe('isValidGameMasterFace', () => {
  it('accepts all 6 valid faces', () => {
    expect(isValidGameMasterFace('shaman')).toBe(true)
    expect(isValidGameMasterFace('challenger')).toBe(true)
    expect(isValidGameMasterFace('regent')).toBe(true)
    expect(isValidGameMasterFace('architect')).toBe(true)
    expect(isValidGameMasterFace('diplomat')).toBe(true)
    expect(isValidGameMasterFace('sage')).toBe(true)
  })

  it('rejects invalid values', () => {
    expect(isValidGameMasterFace('invalid')).toBe(false)
    expect(isValidGameMasterFace(null)).toBe(false)
    expect(isValidGameMasterFace(undefined)).toBe(false)
    expect(isValidGameMasterFace('')).toBe(false)
  })
})

describe('parsePortraysFace', () => {
  it('returns typed GameMasterFace for valid input', () => {
    expect(parsePortraysFace('shaman')).toBe('shaman')
    expect(parsePortraysFace('sage')).toBe('sage')
  })

  it('returns null for invalid input', () => {
    expect(parsePortraysFace('bogus')).toBeNull()
    expect(parsePortraysFace(null)).toBeNull()
    expect(parsePortraysFace(undefined)).toBeNull()
  })
})

// ─── Sage Detection ────────────────────────────────────────────────────────

describe('isSageNpc', () => {
  it('returns true for portraysFace=sage', () => {
    expect(isSageNpc(makeNpc('sage'))).toBe(true)
  })

  it('returns false for non-sage faces', () => {
    expect(isSageNpc(makeNpc('shaman'))).toBe(false)
    expect(isSageNpc(makeNpc('regent'))).toBe(false)
  })

  it('returns false for null portraysFace', () => {
    expect(isSageNpc(makeNpc(null))).toBe(false)
  })
})

// ─── Non-Sage Resolution ──────────────────────────────────────────────────

describe('resolveEffectiveFace — non-Sage NPCs', () => {
  it('returns portraysFace as effectiveFace for shaman', () => {
    const result = resolveEffectiveFace(makeNpc('shaman'))
    expect(result.portraysFace).toBe('shaman')
    expect(result.effectiveFace).toBe('shaman')
    expect(result.isRuntimeComputed).toBe(false)
  })

  it('returns portraysFace as effectiveFace for all non-sage faces', () => {
    const faces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat']
    for (const face of faces) {
      const result = resolveEffectiveFace(makeNpc(face))
      expect(result.portraysFace).toBe(face)
      expect(result.effectiveFace).toBe(face)
      expect(result.isRuntimeComputed).toBe(false)
    }
  })

  it('returns null effectiveFace for null portraysFace', () => {
    const result = resolveEffectiveFace(makeNpc(null))
    expect(result.portraysFace).toBeNull()
    expect(result.effectiveFace).toBeNull()
    expect(result.isRuntimeComputed).toBe(false)
  })

  it('ignores scene context for non-Sage NPCs', () => {
    const context: SageSceneContext = {
      emotionalVector: makeEmotionalVector('Fear', 'Joy'),
      spokeFace: 'architect',
    }
    const result = resolveEffectiveFace(makeNpc('regent'), context)
    expect(result.effectiveFace).toBe('regent')
    expect(result.isRuntimeComputed).toBe(false)
  })
})

// ─── Sage Resolution ──────────────────────────────────────────────────────

describe('resolveEffectiveFace — Sage NPCs', () => {
  it('returns null effectiveFace when no context', () => {
    const result = resolveEffectiveFace(makeNpc('sage'))
    expect(result.portraysFace).toBe('sage')
    expect(result.effectiveFace).toBeNull()
    expect(result.isRuntimeComputed).toBe(true)
  })

  it('returns null effectiveFace with empty context', () => {
    const result = resolveEffectiveFace(makeNpc('sage'), {})
    expect(result.effectiveFace).toBeNull()
    expect(result.isRuntimeComputed).toBe(true)
  })

  it('resolves from emotional vector — Fear → shaman', () => {
    const result = resolveEffectiveFace(makeNpc('sage'), {
      emotionalVector: makeEmotionalVector('Fear', 'Joy'),
    })
    expect(result.effectiveFace).toBe('shaman')
    expect(result.isRuntimeComputed).toBe(true)
  })

  it('resolves from emotional vector — Anger → challenger', () => {
    const result = resolveEffectiveFace(makeNpc('sage'), {
      emotionalVector: makeEmotionalVector('Anger', 'Neutrality'),
    })
    expect(result.effectiveFace).toBe('challenger')
    expect(result.isRuntimeComputed).toBe(true)
  })

  it('resolves from emotional vector — Joy → architect', () => {
    const result = resolveEffectiveFace(makeNpc('sage'), {
      emotionalVector: makeEmotionalVector('Joy', 'Joy'),
    })
    expect(result.effectiveFace).toBe('architect')
    expect(result.isRuntimeComputed).toBe(true)
  })

  it('falls back to spoke face when no emotional vector', () => {
    const result = resolveEffectiveFace(makeNpc('sage'), {
      spokeFace: 'architect',
    })
    expect(result.effectiveFace).toBe('architect')
  })

  it('does not mirror sage spoke face (avoids circular)', () => {
    const result = resolveEffectiveFace(makeNpc('sage'), {
      spokeFace: 'sage',
    })
    expect(result.effectiveFace).toBeNull()
  })

  it('falls back to least-explored face', () => {
    const result = resolveEffectiveFace(makeNpc('sage'), {
      exploredFaces: ['shaman', 'challenger', 'regent', 'architect'],
    })
    expect(result.effectiveFace).toBe('diplomat')
  })

  it('emotional vector takes priority over spoke face', () => {
    const result = resolveEffectiveFace(makeNpc('sage'), {
      emotionalVector: makeEmotionalVector('Sadness', 'Joy'),
      spokeFace: 'architect',
    })
    expect(result.effectiveFace).toBe('diplomat')
  })

  it('prefers unexplored affine face when both emotional vector and explored faces present', () => {
    const result = resolveEffectiveFace(makeNpc('sage'), {
      emotionalVector: makeEmotionalVector('Fear', 'Joy'),
      exploredFaces: ['shaman'],
    })
    expect(result.effectiveFace).toBe('diplomat')
  })
})

// ─── Batch Resolution ──────────────────────────────────────────────────────

describe('resolveEffectiveFaces', () => {
  it('resolves all NPCs in batch', () => {
    const npcs = [makeNpc('shaman'), makeNpc('sage'), makeNpc(null)]
    const results = resolveEffectiveFaces(npcs, {
      emotionalVector: makeEmotionalVector('Anger', 'Neutrality'),
    })
    expect(results).toHaveLength(3)
    expect(results[0]!.effectiveFace).toBe('shaman')
    expect(results[1]!.effectiveFace).toBe('challenger')
    expect(results[2]!.effectiveFace).toBeNull()
  })
})

describe('filterNpcsByEffectiveFace', () => {
  const npcs = [
    makeNpc('shaman'),
    makeNpc('challenger'),
    makeNpc('sage'),
    makeNpc(null),
    makeNpc('regent'),
  ]

  it('filters by target faces (non-Sage)', () => {
    const filtered = filterNpcsByEffectiveFace(npcs, ['shaman', 'regent'])
    expect(filtered).toHaveLength(2)
    expect(filtered[0]!.portraysFace).toBe('shaman')
    expect(filtered[1]!.portraysFace).toBe('regent')
  })

  it('includes Sage NPC when resolved face matches target', () => {
    const filtered = filterNpcsByEffectiveFace(
      npcs,
      ['challenger'],
      { emotionalVector: makeEmotionalVector('Anger', 'Joy') },
    )
    expect(filtered).toHaveLength(2)
  })

  it('excludes unresolved by default', () => {
    const filtered = filterNpcsByEffectiveFace(npcs, ['shaman'])
    expect(filtered).toHaveLength(1)
  })

  it('includes unresolved when requested', () => {
    const filtered = filterNpcsByEffectiveFace(npcs, ['shaman'], undefined, true)
    expect(filtered).toHaveLength(3)
  })
})
