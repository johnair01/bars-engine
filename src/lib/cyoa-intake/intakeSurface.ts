/**
 * CYOA intake types + move-type resolution — imported by client and server.
 * (Kept out of `actions/cyoa-intake.ts` because Next.js "use server" modules may only export async functions.)
 */

import { INTAKE_MOVE_TYPES, type IntakeMoveType } from './types'

export type { IntakeMoveType }
export { INTAKE_MOVE_TYPES }

export const MOVE_TYPE_META: Record<IntakeMoveType, { label: string; description: string }> = {
  wakeUp: {
    label: 'Wake Up',
    description: 'Choice-based awareness; seeing what is really happening',
  },
  cleanUp: {
    label: 'Clean Up',
    description: 'Taking responsibility; repairing what has been broken',
  },
  growUp: {
    label: 'Grow Up',
    description: 'Developmental maturation; expanding beyond current limits',
  },
  showUp: {
    label: 'Show Up',
    description: 'Action-based presence; bringing yourself fully into the moment',
  },
}

export type IntakeChoice = {
  text: string
  targetId: string
  choiceKey?: string
  moveType?: IntakeMoveType
}

export type IntakePassage = {
  nodeId: string
  text: string
  choices: IntakeChoice[]
  moveType?: IntakeMoveType
}

export type IntakeAdventureData = {
  id: string
  title: string
  description: string | null
  startNodeId: string | null
  passages: IntakePassage[]
  campaignRef: string | null
}

export type IntakePlaybookData = {
  id: string
  playerId: string
  adventureId: string | null
  playbookRole: string | null
  playerAnswers: string | null
  completedAt: Date | null
  shareToken: string
  createdAt: Date
}

export type IntakeCheckInData = {
  id: string
  channel: string
  altitude: string
  stucknessRating: number
  sceneTypeChosen: string | null
} | null

export type IntakeChoiceLogEntry = {
  nodeId: string
  choiceText: string
  targetId: string
  choiceKey?: string
  moveType?: IntakeMoveType
}

export type IntakeCheckInAnswers = {
  stucknessRating: number
  channel: string
  altitude: string
}

export type IntakeProgressPayload = {
  currentPassageId: string
  passageHistory: string[]
  choiceLog: IntakeChoiceLogEntry[]
  checkIn?: IntakeCheckInAnswers
  resolvedMoveType?: IntakeMoveType
}

export type IntakePageData = {
  adventure: IntakeAdventureData
  playbook: IntakePlaybookData
  todayCheckIn: IntakeCheckInData
  playerId: string
  /** CampaignPortal id from URL or auto-resolved from campaignRef; required by completeIntakeSession. */
  portalId: string | null
}

export type CompleteIntakeSessionInput = {
  portalId: string
  playbookId: string
  adventureId: string
  choiceLog: IntakeChoiceLogEntry[]
  passages: IntakePassage[]
  terminalNodeId?: string
  checkIn: IntakeCheckInAnswers
}

export type CompleteIntakeSessionSuccess = {
  success: true
  playbookId: string
  spokeSessionId: string
  checkInId: string
}

export type CompleteIntakeSessionResult =
  | CompleteIntakeSessionSuccess
  | { error: string }

/**
 * Resolve the player's intake moveType from their choice log and passage map.
 */
export function resolveIntakeMoveType(
  choiceLog: IntakeChoiceLogEntry[],
  passages: IntakePassage[],
  terminalNodeId?: string,
): IntakeMoveType | null {
  for (let i = choiceLog.length - 1; i >= 0; i--) {
    const entry = choiceLog[i]
    if (entry?.moveType && (INTAKE_MOVE_TYPES as readonly string[]).includes(entry.moveType)) {
      return entry.moveType
    }
  }

  if (terminalNodeId) {
    const terminal = passages.find((p) => p.nodeId === terminalNodeId)
    if (terminal?.moveType) return terminal.moveType
  }

  return null
}
