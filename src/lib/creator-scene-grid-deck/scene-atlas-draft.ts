/**
 * Scene Atlas guided CYOA draft (P2) — JSON payload stored in `SceneAtlasGuidedDraft.payload`.
 * Linear 5-step answer flow + optional review overrides before `createCustomBar` + bind.
 */

export const SCENE_ATLAS_GUIDED_DRAFT_VERSION = 1 as const
export const SCENE_ATLAS_GUIDED_TEMPLATE_KEY = 'scene-atlas-linear-v1' as const

/** Ordered step ids — 3–7 steps product range; v1 uses 5 answer nodes + review UI. */
export const SCENE_ATLAS_GUIDED_STEP_IDS = [
  'intention',
  'done_looks',
  'care_note',
  'stakeholders',
  'next_action',
] as const

export type SceneAtlasGuidedStepId = (typeof SCENE_ATLAS_GUIDED_STEP_IDS)[number]

export type SceneAtlasGuidedDraftPayload = {
  version: typeof SCENE_ATLAS_GUIDED_DRAFT_VERSION
  templateKey: typeof SCENE_ATLAS_GUIDED_TEMPLATE_KEY
  /** 1-based: answer steps 1..5; **6** = review / confirm (persisted so refresh resumes on review). */
  currentStep: number
  answers: Partial<Record<SceneAtlasGuidedStepId, string>>
  reviewTitle?: string
  reviewDescription?: string
  tagsLine?: string
}

const MAX_FIELD_LEN = 12_000
const MAX_TAGS_LEN = 500

export function emptySceneAtlasGuidedDraftPayload(): SceneAtlasGuidedDraftPayload {
  return {
    version: SCENE_ATLAS_GUIDED_DRAFT_VERSION,
    templateKey: SCENE_ATLAS_GUIDED_TEMPLATE_KEY,
    currentStep: 1,
    answers: {},
  }
}

function clampStr(s: unknown, max: number): string {
  if (typeof s !== 'string') return ''
  return s.slice(0, max)
}

/** Parse and normalize DB / client JSON; returns null if unusable. */
export function parseSceneAtlasGuidedDraftPayload(raw: unknown): SceneAtlasGuidedDraftPayload | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  if (o.version !== SCENE_ATLAS_GUIDED_DRAFT_VERSION) return null
  if (o.templateKey !== SCENE_ATLAS_GUIDED_TEMPLATE_KEY) return null
  const currentStep = typeof o.currentStep === 'number' && Number.isFinite(o.currentStep) ? Math.floor(o.currentStep) : 1
  const maxStep = SCENE_ATLAS_GUIDED_STEP_IDS.length + 1 // + review
  const step = Math.min(Math.max(currentStep, 1), maxStep)
  const answersIn = o.answers
  const answers: Partial<Record<SceneAtlasGuidedStepId, string>> = {}
  if (answersIn && typeof answersIn === 'object' && !Array.isArray(answersIn)) {
    for (const id of SCENE_ATLAS_GUIDED_STEP_IDS) {
      const v = (answersIn as Record<string, unknown>)[id]
      if (typeof v === 'string' && v.trim()) answers[id] = clampStr(v, MAX_FIELD_LEN)
    }
  }
  return {
    version: SCENE_ATLAS_GUIDED_DRAFT_VERSION,
    templateKey: SCENE_ATLAS_GUIDED_TEMPLATE_KEY,
    currentStep: step,
    answers,
    reviewTitle: typeof o.reviewTitle === 'string' ? clampStr(o.reviewTitle, 500) : undefined,
    reviewDescription:
      typeof o.reviewDescription === 'string' ? clampStr(o.reviewDescription, MAX_FIELD_LEN) : undefined,
    tagsLine: typeof o.tagsLine === 'string' ? clampStr(o.tagsLine, MAX_TAGS_LEN) : undefined,
  }
}

export function serializeSceneAtlasGuidedDraftPayload(p: SceneAtlasGuidedDraftPayload): Record<string, unknown> {
  return {
    version: p.version,
    templateKey: p.templateKey,
    currentStep: p.currentStep,
    answers: { ...p.answers },
    ...(p.reviewTitle !== undefined ? { reviewTitle: p.reviewTitle } : {}),
    ...(p.reviewDescription !== undefined ? { reviewDescription: p.reviewDescription } : {}),
    ...(p.tagsLine !== undefined ? { tagsLine: p.tagsLine } : {}),
  }
}

/** Coerce a partial client update into a valid payload (for saves). */
export function normalizeSceneAtlasGuidedDraftPayload(
  partial: Partial<SceneAtlasGuidedDraftPayload> & { answers?: Partial<Record<string, string>> }
): SceneAtlasGuidedDraftPayload {
  const base = emptySceneAtlasGuidedDraftPayload()
  const maxStep = SCENE_ATLAS_GUIDED_STEP_IDS.length + 1
  const step =
    typeof partial.currentStep === 'number' && Number.isFinite(partial.currentStep)
      ? Math.min(Math.max(Math.floor(partial.currentStep), 1), maxStep)
      : base.currentStep
  const answers: Partial<Record<SceneAtlasGuidedStepId, string>> = { ...base.answers }
  if (partial.answers && typeof partial.answers === 'object') {
    for (const id of SCENE_ATLAS_GUIDED_STEP_IDS) {
      const v = partial.answers[id]
      if (typeof v === 'string') answers[id] = clampStr(v, MAX_FIELD_LEN)
    }
  }
  return {
    ...base,
    currentStep: step,
    answers,
    reviewTitle: clampStr(partial.reviewTitle ?? '', 500) || undefined,
    reviewDescription: clampStr(partial.reviewDescription ?? '', MAX_FIELD_LEN) || undefined,
    tagsLine: clampStr(partial.tagsLine ?? '', MAX_TAGS_LEN) || undefined,
  }
}
