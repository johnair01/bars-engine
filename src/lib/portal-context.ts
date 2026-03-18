/**
 * Portal context — contextualize I Ching hexagrams for campaign portals.
 * Applies allyship domain + Kotter stage to produce flavor for each portal.
 * Path hints are hexagram-specific and voiced by the GM face governing changing lines.
 * @see .specify/specs/portal-path-hint-gm-interview/
 */

import { getStageAction } from '@/lib/kotter'
import type { AllyshipDomain } from '@/lib/kotter'
import { getStagePhraseWarm } from '@/lib/domain-context'
import { getHexagramStructure } from '@/lib/iching-struct'
import { KOTTER_STAGES } from '@/lib/kotter'
import type { GameMasterFace } from '@/lib/quest-grammar/types'

const DOMAIN_LABELS: Record<AllyshipDomain, string> = {
  GATHERING_RESOURCES: 'Gathering Resources',
  SKILLFUL_ORGANIZING: 'Skillful Organizing',
  RAISE_AWARENESS: 'Raise Awareness',
  DIRECT_ACTION: 'Direct Action',
}

/** Line 1 (bottom) = Shaman, 2 = Challenger, 3 = Regent, 4 = Architect, 5 = Diplomat, 6 = Sage */
const LINE_TO_FACE: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']

/** Face-specific path hint templates — warm, conversational, old-friend voice. */
const FACE_PATH_HINT_TEMPLATES: Record<GameMasterFace, string> = {
  shaman:
    'The threshold calls—something beneath the surface is ready to surface. Come with curiosity; you might just find where you belong.',
  challenger:
    "Hey friend, this is your moment to shine. Step in with confidence, and let's see how you turn this into a win.",
  regent:
    'This one helps you see the lay of the land. Bring a question; leave with clarity.',
  architect:
    'Think of it like a fun home project: you start with a sketch, then one surprising insight changes everything. Come with a plan; leave with an inspired twist.',
  diplomat:
    'This hexagram weaves—the line that shifts is the one that connects. Come with care; leave with a fuller heart.',
  sage:
    'This reading brings it all together. Come with openness; leave with flow.',
}

export type PortalContext = {
  flavor: string
  stageAction: string
  stageName: string
  domainLabel: string
  pathHint: string
  resolutionHint?: string
  primaryFace?: GameMasterFace
}

/**
 * Extract hexagram essence (punchy, ~50 chars) for path hint.
 */
function hexagramEssence(name: string, tone: string | null, text: string | null): string {
  if (text?.trim()) {
    const first = text.split(/[※❊\n.]/)[0]?.trim()
    if (first && first.length > 10) {
      return first.length > 55 ? `${first.slice(0, 52)}…` : first
    }
  }
  return tone ? `${name}: ${tone}` : name
}

/**
 * Contextualize a hexagram for a campaign portal.
 * When changingLines and primaryFace are provided, path hint is face-voiced and hexagram-specific.
 */
export function contextualizeHexagramForPortal(
  hexagramId: number,
  allyshipDomain: AllyshipDomain,
  kotterStage: number,
  hexagramName: string,
  hexagramTone?: string | null,
  hexagramText?: string | null,
  changingLines?: number[],
  primaryFace?: GameMasterFace
): PortalContext {
  const stage = Math.max(1, Math.min(8, Math.round(kotterStage))) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  const stageInfo = KOTTER_STAGES[stage]
  const stageAction = getStageAction(stage, allyshipDomain)
  const domainLabel = DOMAIN_LABELS[allyshipDomain]

  const structure = getHexagramStructure(hexagramId)
  const trigramNote = `${structure.upper} over ${structure.lower}`

  const flavor = hexagramTone
    ? `${hexagramName}: ${hexagramTone}`
    : `${hexagramName} — ${trigramNote}`

  const stagePhraseWarm = getStagePhraseWarm(stage, allyshipDomain)
  let pathHint: string
  if (primaryFace && changingLines && changingLines.length > 0) {
    const essence = hexagramEssence(hexagramName, hexagramTone ?? null, hexagramText ?? null)
    const template = FACE_PATH_HINT_TEMPLATES[primaryFace]
    pathHint = `${essence}. In this moment, ${stagePhraseWarm}. ${template}`
  } else {
    pathHint = `In this moment, ${stagePhraseWarm}. This reading suggests a path.`
  }

  return {
    flavor,
    stageAction,
    stageName: stageInfo?.name ?? `Stage ${stage}`,
    domainLabel,
    pathHint,
    resolutionHint: stageInfo?.emoji
      ? `${stageInfo.emoji} ${stageInfo.name} — ${stageAction}`
      : undefined,
    primaryFace,
  }
}

/** Get the face governing a line (1–6). */
export function getFaceForLine(lineNumber: number): GameMasterFace {
  return LINE_TO_FACE[Math.max(0, Math.min(5, lineNumber - 1))] ?? 'sage'
}
