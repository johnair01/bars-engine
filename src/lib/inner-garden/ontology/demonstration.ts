/**
 * Inner Garden — The Demonstration Bar (per-thread; why completing a step grants capacity).
 *
 * Spec: .specify/specs/inner-garden-blocker-route-hand/spec.md
 *
 * You cannot read your way to a card. Two teeth, per demonstrated step:
 *  1. EVIDENCE OF THE RIGHT KIND — constrained by the step's role (metabolize → traced
 *     practice; translate → reflection; transcend → artifact/action). Grounded in
 *     charge-metabolism FR2 ("Recommendation Is Not Completion").
 *  2. MOVEMENT — the charge actually moved forward (pre → post, at least to neutral).
 *     Falling short is "data, not failure" — no card yet.
 *
 * Neutral suffices to resolve a thread; reaching the spirit is optional depth. The
 * Integration Check ("did this actually metabolize?") is FOUNDATIONAL (ships in the
 * starting slot) to avoid the earn-it-to-earn-it regress.
 *
 * Pure functions. No I/O, no render.
 */
import {
  CHANNEL_SPIRIT,
  earnCapacity,
  roleForStep,
  type Altitude,
  type CapacityKey,
  type ChannelThread,
  type EmotionChannel,
  type MoveRole,
} from './gate-confrontation'

export const INTEGRATION_CHECK_IS_FOUNDATIONAL = true

/** The four ways charge is actually metabolized (charge-metabolism FR2). */
export type EvidenceKind = 'traced_practice' | 'reflection' | 'artifact' | 'action'

/** Which evidence kinds legitimately demonstrate a step of a given role (the teeth). */
export const ROLE_EVIDENCE: Record<MoveRole, EvidenceKind[]> = {
  metabolize: ['traced_practice'],
  translate: ['reflection'],
  transcend: ['artifact', 'action'],
}

const ALT_RANK: Record<Altitude, number> = { dissatisfied: 0, neutral: 1, satisfied: 2 }

/** One demonstrated step on one thread's channel. */
export interface ThreadDemonstration {
  channel: EmotionChannel
  evidenceKind: EvidenceKind
  /** The artifact / action record / practice trace / reflection — must be non-empty. */
  evidenceRef: string
  preAltitude: Altitude
  postAltitude: Altitude
  /** For a cross-channel translate, the channel translated INTO. */
  postChannel?: EmotionChannel
}

export interface IntegrationResult {
  passed: boolean
  reasons: string[]
  /** The capacity earned if the step passed (else undefined). */
  earnedKey?: CapacityKey
}

/** The altitude-preserving capacity key a demonstrated step earns. */
function stepCapacity(demo: ThreadDemonstration): { key: CapacityKey; role: MoveRole } {
  const role = roleForStep(demo.channel, demo.preAltitude, demo.postAltitude, demo.postChannel)
  if (role === 'metabolize') return { key: `metabolize:${demo.channel}`, role }
  if (role === 'translate') {
    const into = demo.postChannel ?? demo.channel
    return { key: `translate:${demo.channel}->${into}`, role }
  }
  const channel = demo.postChannel ?? demo.channel
  return { key: `transcend:${channel}->${CHANNEL_SPIRIT[channel]}`, role }
}

/** The Integration Check — verify a demonstration against the thread it claims to advance. */
export function runIntegrationCheck(thread: ChannelThread, demo: ThreadDemonstration): IntegrationResult {
  const reasons: string[] = []

  if (demo.channel !== thread.channel) {
    reasons.push(`demonstrated ${demo.channel} but this thread is on ${thread.channel}`)
  }
  if (demo.preAltitude !== thread.presentAltitude) {
    reasons.push('the practice did not start from this thread’s state')
  }
  if (!demo.evidenceRef.trim()) {
    reasons.push('no evidence — a recommendation is not completion')
  }

  const step = stepCapacity(demo)
  if (!ROLE_EVIDENCE[step.role].includes(demo.evidenceKind)) {
    reasons.push(
      `a ${step.role} step cannot be demonstrated by a ${demo.evidenceKind}; ` +
        `it needs ${ROLE_EVIDENCE[step.role].join(' or ')}`,
    )
  }

  const movedForward =
    ALT_RANK[demo.postAltitude] > ALT_RANK[demo.preAltitude] ||
    (demo.postChannel != null && demo.postChannel !== demo.channel)
  if (!movedForward) {
    reasons.push(
      `did not move past ${demo.preAltitude} — movement short of the edge is data, not failure`,
    )
  }

  return reasons.length === 0
    ? { passed: true, reasons, earnedKey: step.key }
    : { passed: false, reasons }
}

export interface ThreadCompletion {
  granted: boolean
  result: IntegrationResult
  owned: Set<CapacityKey>
}

/** Attempt to complete a thread step; grants the capacity ONLY if the Integration Check passes. */
export function completeThread(
  thread: ChannelThread,
  demo: ThreadDemonstration,
  owned: ReadonlySet<CapacityKey>,
): ThreadCompletion {
  const result = runIntegrationCheck(thread, demo)
  if (!result.passed || !result.earnedKey) {
    return { granted: false, result, owned: new Set(owned) }
  }
  return { granted: true, result, owned: earnCapacity(owned, result.earnedKey) }
}
