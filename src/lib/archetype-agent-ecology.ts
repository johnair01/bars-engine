/**
 * Archetype Agent Ecology v0 (GI)
 *
 * Bridges the Archetype system to the agent-mind model.
 * Agents are deterministic (rule-based) — no LLM required.
 */

import type { AgentEmotionalState, CreateAgentInput } from '@/lib/agent-mind/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ArchetypeAgentProfile {
  archetypeId: string
  archetypeName: string
  nationName: string
  /** Game Master face derived from primaryWaveStage */
  face: 'shaman' | 'regent' | 'challenger' | 'architect' | 'diplomat' | 'sage'
  /** Seeded goal from archetype.showUp */
  goal: string
  /** Seeded narrative lock from archetype.shadowSignposts (first line) */
  narrativeLock: string
  emotionalState: AgentEmotionalState
  /** Primary allyship domain for BAR proposals */
  allyshipDomain: string
}

// ---------------------------------------------------------------------------
// Mappings
// ---------------------------------------------------------------------------

/**
 * Map archetype primaryWaveStage → starting emotional state.
 * Reflects the shadow side of each stage.
 */
export function waveStageToEmotionalState(
  waveStage: string | null | undefined
): AgentEmotionalState {
  switch (waveStage) {
    case 'wakeUp':   return 'fear'
    case 'cleanUp':  return 'anger'
    case 'growUp':   return 'sadness'
    case 'showUp':   return 'joy'
    default:         return 'neutrality'
  }
}

/**
 * Map archetype primaryWaveStage → Game Master face.
 * wakeUp = shaman (archetypal opening), cleanUp = challenger (boundary),
 * growUp = architect (building), showUp = sage (integration).
 */
export function waveStageToFace(
  waveStage: string | null | undefined
): ArchetypeAgentProfile['face'] {
  switch (waveStage) {
    case 'wakeUp':   return 'shaman'
    case 'cleanUp':  return 'challenger'
    case 'growUp':   return 'architect'
    case 'showUp':   return 'sage'
    default:         return 'diplomat'
  }
}

/**
 * Map primaryWaveStage → allyship domain for BAR proposals.
 */
export function waveStageToAllyshipDomain(waveStage: string | null | undefined): string {
  switch (waveStage) {
    case 'wakeUp':   return 'RAISE_AWARENESS'
    case 'cleanUp':  return 'SKILLFUL_ORGANIZING'
    case 'growUp':   return 'GATHERING_RESOURCES'
    case 'showUp':   return 'DIRECT_ACTION'
    default:         return 'GATHERING_RESOURCES'
  }
}

// ---------------------------------------------------------------------------
// Persona builder
// ---------------------------------------------------------------------------

interface ArchetypeRow {
  id: string
  name: string
  showUp: string | null
  shadowSignposts: string | null
  primaryWaveStage: string | null
}

/**
 * Build an `ArchetypeAgentProfile` from a DB archetype row.
 * Goal = archetype.showUp (the aspiration).
 * Narrative lock = first line of shadowSignposts (the stuck state).
 */
export function buildAgentPersonaFromArchetype(
  archetype: ArchetypeRow,
  nationName: string
): ArchetypeAgentProfile {
  const goal = archetype.showUp?.trim() || `Embody the ${archetype.name} path fully.`

  const firstShadowLine = archetype.shadowSignposts
    ?.split(/\n|\./)
    .map((l) => l.trim())
    .find((l) => l.length > 8)

  const narrativeLock =
    firstShadowLine || `Something blocks full expression of ${archetype.name}.`

  return {
    archetypeId: archetype.id,
    archetypeName: archetype.name,
    nationName,
    face: waveStageToFace(archetype.primaryWaveStage),
    goal,
    narrativeLock,
    emotionalState: waveStageToEmotionalState(archetype.primaryWaveStage),
    allyshipDomain: waveStageToAllyshipDomain(archetype.primaryWaveStage),
  }
}

/**
 * Convert an ArchetypeAgentProfile into a CreateAgentInput for agent-mind.
 */
export function profileToAgentInput(
  profile: ArchetypeAgentProfile,
  agentId: string
): CreateAgentInput {
  return {
    agent_id: agentId,
    nation: profile.nationName,
    archetype: profile.archetypeName,
    goal: profile.goal,
    narrative_lock: profile.narrativeLock,
    emotional_state: profile.emotionalState,
    energy: 0.5,
  }
}
