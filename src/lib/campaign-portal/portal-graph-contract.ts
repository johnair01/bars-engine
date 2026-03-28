/**
 * SCL portal adventure — graph invariants for Phase B (site-signal-card-club-chs-portal-bar-journey).
 * Keep in sync with `scripts/seed-campaign-portal-adventure.ts` (`npm run test:scl-portal` guards drift).
 */

export const SCL_PORTAL_START_NODE_IDS = [
  'Portal_1',
  'Portal_2',
  'Portal_3',
  'Portal_4',
  'Portal_5',
  'Portal_6',
  'Portal_7',
  'Portal_8',
] as const

/** Four moves on portal entry (FR-B1). */
export const SCL_PORTAL_ENTRY_TARGETS = [
  'GM_FacePick_wakeUp',
  'GM_FacePick_cleanUp',
  'GM_FacePick_growUp',
  'GM_FacePick_showUp',
] as const

export const SCL_GM_FACE_ORDER = [
  'shaman',
  'challenger',
  'regent',
  'architect',
  'diplomat',
  'sage',
] as const

export const SCL_GATHER_NODES = ['Gather_Wake', 'Gather_Clean', 'Gather_Show'] as const

export const SCL_EMIT_NODES = ['WakeUp_Emit', 'CleanUp_Emit', 'ShowUp_Emit'] as const

export const SCL_POST_WAKE_NODE = 'PostWake_Library'

export const SCL_HUB_RETURN_NODE = 'Hub_Return'

/** After Wake BAR — library + honest residency CTAs (FR-B2, FR-B5). */
export const SCL_POST_WAKE_CHOICE_TARGETS = [
  'redirect:/library',
  'redirect:/campaign/board',
  'redirect:/event',
  'redirect:/event/donate/wizard',
  SCL_HUB_RETURN_NODE,
] as const

export const SCL_WAKE_GATHER_NEXT = 'WakeUp_Emit'

export type PortalChoice = { text: string; targetId: string; setFace?: string }

export function assertPortalEntryMatchesContract(choices: PortalChoice[]): void {
  if (choices.length !== SCL_PORTAL_ENTRY_TARGETS.length) {
    throw new Error(
      `Portal entry: expected ${SCL_PORTAL_ENTRY_TARGETS.length} choices, got ${choices.length}`,
    )
  }
  for (let i = 0; i < choices.length; i++) {
    const exp = SCL_PORTAL_ENTRY_TARGETS[i]
    const got = choices[i]?.targetId
    if (got !== exp) {
      throw new Error(`Portal entry choice ${i}: expected targetId ${exp}, got ${got}`)
    }
  }
}

export function assertFacePickHasSixFaces(choices: PortalChoice[]): void {
  if (choices.length !== SCL_GM_FACE_ORDER.length) {
    throw new Error(`Face pick: expected ${SCL_GM_FACE_ORDER.length} choices, got ${choices.length}`)
  }
  const faces = new Set<string>()
  for (const c of choices) {
    if (!c.setFace || !SCL_GM_FACE_ORDER.includes(c.setFace as (typeof SCL_GM_FACE_ORDER)[number])) {
      throw new Error(`Face pick: invalid or missing setFace on choice "${c.text}"`)
    }
    faces.add(c.setFace)
  }
  if (faces.size !== SCL_GM_FACE_ORDER.length) {
    throw new Error('Face pick: duplicate or incomplete setFace coverage')
  }
}

export function assertPostWakeChoices(choices: PortalChoice[]): void {
  const targets = choices.map((c) => c.targetId)
  for (const exp of SCL_POST_WAKE_CHOICE_TARGETS) {
    if (!targets.includes(exp)) {
      throw new Error(`PostWake_Library: missing choice targetId ${exp}`)
    }
  }
}

const FACE_CHOICE_LABEL: Record<(typeof SCL_GM_FACE_ORDER)[number], string> = {
  shaman: 'Shaman — witness & depth',
  challenger: 'Challenger — edge & truth',
  regent: 'Regent — order & roles',
  architect: 'Architect — systems & leverage',
  diplomat: 'Diplomat — relationship & bridge',
  sage: 'Sage — pattern & integration',
}

/** Canonical portal entry choices (seed + tests). */
export function buildPortalEntryChoices(): PortalChoice[] {
  return [
    { text: 'Wake Up — See what\'s emerging', targetId: 'GM_FacePick_wakeUp' },
    { text: 'Clean Up — Tend to what blocks you', targetId: 'GM_FacePick_cleanUp' },
    { text: 'Grow Up — Study at a school', targetId: 'GM_FacePick_growUp' },
    { text: 'Show Up — Make a commitment', targetId: 'GM_FacePick_showUp' },
  ]
}

/** Six GM faces → same target (gather stub, emit, or `schools`). */
export function buildFacePickChoices(gatherOrSchoolsTarget: string): PortalChoice[] {
  return SCL_GM_FACE_ORDER.map((setFace) => ({
    text: FACE_CHOICE_LABEL[setFace],
    targetId: gatherOrSchoolsTarget,
    setFace,
  }))
}

export function buildPostWakeChoices(): PortalChoice[] {
  return [
    { text: 'Open the quest library', targetId: 'redirect:/library' },
    { text: 'Featured field (campaign board)', targetId: 'redirect:/campaign/board' },
    { text: 'Residency events', targetId: 'redirect:/event' },
    { text: 'Contribute (donate wizard)', targetId: 'redirect:/event/donate/wizard' },
    { text: 'Continue to hub return', targetId: SCL_HUB_RETURN_NODE },
  ]
}
