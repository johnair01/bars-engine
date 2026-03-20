/**
 * Narrative lock generation from triggers — FO Phase 3 (heuristic)
 */

import type { AgentMindState, NarrativeTrigger } from './types'

export function generateNarrativeLock(agent: AgentMindState, trigger: NarrativeTrigger): string {
  switch (trigger) {
    case 'goal_conflict':
      return `I'm torn: ${agent.goal} conflicts with what others expect of me.`
    case 'low_energy':
      return `I'm depleted — even thinking about ${agent.goal} feels like too much.`
    case 'failed_experiment':
      return `That last step didn't land. Maybe I'm not cut out for ${agent.goal}.`
    case 'social_interaction':
      return `After that conversation, I'm questioning how I show up for ${agent.goal}.`
    default:
      return agent.narrative_lock
  }
}
