/**
 * npc-from-321 T006 — the state of a part's three-step quest, kept on `Daemon.innerWorkDigest.part`.
 * Pure: reads and updates the JSON, nothing else. Steps: life, land, checkin (the check-in opens after the other two).
 */
export const PART_STEPS = ['life', 'land'] as const
export type PartStep = (typeof PART_STEPS)[number]

export type PartState = {
  questId?: string
  steps: Partial<Record<PartStep, boolean>>
  met?: { vibulonId?: string; whatWasDone: string; at: string }
}

export function readPart(digest: unknown): PartState {
  const raw = (digest && typeof digest === 'object' ? (digest as { part?: unknown }).part : null) as Partial<PartState> | null
  return {
    questId: typeof raw?.questId === 'string' ? raw.questId : undefined,
    steps: { life: raw?.steps?.life === true, land: raw?.steps?.land === true },
    met: raw?.met && typeof raw.met === 'object' ? raw.met : undefined,
  }
}

export function withPart(digest: unknown, part: PartState): Record<string, unknown> {
  const base = digest && typeof digest === 'object' ? (digest as Record<string, unknown>) : {}
  return { ...base, part }
}

export function bothStepsDone(part: PartState): boolean {
  return part.steps.life === true && part.steps.land === true
}

/** The one line the coin carries: the part's story name and what the player did. */
export function coinTitle(partName: string, whatWasDone: string): string {
  return `${partName}: ${whatWasDone}`.slice(0, 200)
}
