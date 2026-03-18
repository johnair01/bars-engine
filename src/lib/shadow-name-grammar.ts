/**
 * Deterministic 6-face shadow name grammar for 321 Shadow Work.
 * Zero tokens at suggest time — hash + lookup only.
 * Same input always yields same name.
 *
 * Faces map to the 6 Game Master sects:
 *   0 Shaman   — mystery, divination, threshold
 *   1 Challenger — action, edge, drive
 *   2 Regent   — order, structure, steadiness
 *   3 Architect — strategy, blueprint, design
 *   4 Diplomat  — connection, translation, harmony
 *   5 Sage      — integration, paradox, wholeness
 */

// ---------------------------------------------------------------------------
// Vocab config (v2 — 8 roles × 8 descriptors per face, 3 patterns)
// ---------------------------------------------------------------------------

export const SHADOW_NAME_VOCAB = {
  version: '2',
  faces: [
    {
      id: 'shaman',
      roles: ['Oracle', 'Keeper', 'Guardian', 'Seer', 'Witness', 'Diviner', 'Wanderer', 'Threshold'],
      descriptors: ['Mythic', 'Earthbound', 'Ritual', 'Hidden', 'Liminal', 'Sacred', 'Ancient', 'Veiled'],
    },
    {
      id: 'challenger',
      roles: ['Dodger', 'Walker', 'Edge', 'Blade', 'Hunter', 'Striker', 'Maverick', 'Rebel'],
      descriptors: ['Deft', 'Bold', 'Penetrating', 'Relentless', 'Fierce', 'Reckless', 'Unyielding', 'Sharp'],
    },
    {
      id: 'regent',
      roles: ['Steward', 'Keeper', 'Sentinel', 'Order', 'Warden', 'Anchor', 'Foundation', 'Pillar'],
      descriptors: ['Structured', 'Disciplined', 'Calm', 'Steady', 'Immovable', 'Measured', 'Clear', 'Bound'],
    },
    {
      id: 'architect',
      roles: ['Blueprint', 'Builder', 'Strategist', 'Designer', 'Planner', 'Engineer', 'Visionary', 'Mapper'],
      descriptors: ['Precise', 'Clever', 'Systematic', 'Deliberate', 'Calculated', 'Exacting', 'Methodical', 'Lucid'],
    },
    {
      id: 'diplomat',
      roles: ['Connector', 'Weaver', 'Bridge', 'Mediator', 'Emissary', 'Translator', 'Liaison', 'Harmonizer'],
      descriptors: ['Quirky', 'Gentle', 'Subtle', 'Fluid', 'Adaptive', 'Resonant', 'Open', 'Tender'],
    },
    {
      id: 'sage',
      roles: ['Trickster', 'Integrator', 'Mountain', 'Sage', 'Elder', 'Mirror', 'Paradox', 'Spiral'],
      descriptors: ['Wise', 'Emergent', 'Whole', 'Layered', 'Integrated', 'Timeless', 'Vast', 'Still'],
    },
  ],
  /** Grammar patterns. {D} = descriptor, {R} = role. */
  patterns: [
    'The {D} {R}',
    '{D} {R}',
    'The {R} of {D}',
  ],
} as const

// ---------------------------------------------------------------------------
// Hash + derivation
// ---------------------------------------------------------------------------

/** djb2 hash — deterministic, same across JS and Python ports. */
function hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i)
  }
  return h >>> 0
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Derive a deterministic evocative name from 321 charge + mask shape.
 * Hash bits: [0–7] face, [8–15] role, [16–23] descriptor, [24–31] pattern
 */
export function deriveShadowName(chargeDescription: string, maskShape: string): string {
  const combined = normalize(chargeDescription + ' ' + maskShape)
  if (!combined) return 'The Unnamed Presence'

  const h = hash(combined)
  const faces = SHADOW_NAME_VOCAB.faces
  const patterns = SHADOW_NAME_VOCAB.patterns

  const face = faces[h % faces.length]
  const role = face.roles[(h >>> 8) % face.roles.length]
  const descriptor = face.descriptors[(h >>> 16) % face.descriptors.length]
  const pattern = patterns[(h >>> 24) % patterns.length]

  return pattern.replace('{D}', descriptor).replace('{R}', role)
}
