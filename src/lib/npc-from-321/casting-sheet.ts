/**
 * npc-from-321 T005 — the casting sheet the Admin fills when raising a finished 3-2-1 part.
 * Pure: a blank or unrecognised field stays blank (nothing is invented) and every filled field names its source.
 * `build` and `gender` are what the villager casting join (six-faces-council `castVillager`) reads; the builds
 * match its parts.json `builds`.
 */
export const CASTING_BUILDS = ['slight', 'average', 'broad', 'heavy', 'elder', 'child'] as const
export type CastingBuild = (typeof CASTING_BUILDS)[number]

export const CASTING_GENDERS = ['m', 'f'] as const
export type CastingGender = (typeof CASTING_GENDERS)[number]

export const CASTING_SOURCES = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'finalShadowName', 'creator'] as const
export type CastingSource = (typeof CASTING_SOURCES)[number]

export const CASTING_FIELDS = ['integralLevel', 'enneagram', 'gender', 'build', 'nationId', 'classId', 'storyName'] as const
export type CastingField = (typeof CASTING_FIELDS)[number]

export type CastingSheet = {
  integralLevel?: string
  enneagram?: string
  gender?: string
  build?: string
  nationId?: string
  classId?: string
  storyName?: string
  sources?: Partial<Record<CastingField, string>>
}

export type NormalizedCastingSheet = {
  fields: Partial<Record<CastingField, string>>
  sources: Partial<Record<CastingField, CastingSource>>
  blank: CastingField[]
}

const GENDER_WORDS: Record<string, CastingGender> = {
  m: 'm', male: 'm', man: 'm', boy: 'm', f: 'f', female: 'f', woman: 'f', girl: 'f',
}

const norm = (s: unknown) => (typeof s === 'string' ? s.trim() : '')

export function normalizeCastingSheet(sheet: CastingSheet | null | undefined): NormalizedCastingSheet {
  const s = sheet ?? {}
  const fields: Partial<Record<CastingField, string>> = {}
  const g = GENDER_WORDS[norm(s.gender).toLowerCase()]
  if (g) fields.gender = g
  const b = norm(s.build).toLowerCase()
  if ((CASTING_BUILDS as readonly string[]).includes(b)) fields.build = b
  for (const f of ['integralLevel', 'enneagram', 'nationId', 'classId', 'storyName'] as const) {
    const v = norm(s[f])
    if (v) fields[f] = v
  }
  const sources: Partial<Record<CastingField, CastingSource>> = {}
  for (const f of Object.keys(fields) as CastingField[]) {
    const src = s.sources?.[f]
    sources[f] = (CASTING_SOURCES as readonly string[]).includes(src ?? '') ? (src as CastingSource) : 'creator'
  }
  return { fields, sources, blank: CASTING_FIELDS.filter((f) => !(f in fields)) }
}
