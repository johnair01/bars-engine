/**
 * Superpower × orientation translation matrix (campaign Phase 1, FR2).
 * Spec: .specify/specs/mobility-quest-superpower-campaign/spec.md
 * Source: the addendum (Internal/External polarity) + the six Strategy Guides
 *         + the Coach Strategy Guide. Authored data — deterministic, no AI.
 *
 * Each cell = the superpower-lens question for that orientation + the artifact
 * the resulting quest should produce. `internal` = self-allyship (MoveAspect
 * inner); `external` = world-facing allyship (MoveAspect outer).
 */
import type { Superpower, SuperpowerOrientation } from './types'

export interface TranslationCell {
  prompt: string
  suggestedArtifact: string
}

export const SUPERPOWER_TRANSLATION: Record<
  Superpower,
  Record<SuperpowerOrientation, TranslationCell>
> = {
  connector: {
    internal: {
      prompt: 'What inner parts, desires, fears, or commitments need to be connected?',
      suggestedArtifact: 'parts map, inner dialogue, values bridge, self-trust note',
    },
    external: {
      prompt: 'Who needs to be connected?',
      suggestedArtifact: 'introduction, contact list, warm handoff, relationship map',
    },
  },
  storyteller: {
    internal: {
      prompt: 'What story am I telling myself about this quest?',
      suggestedArtifact: 'a reframed self-narrative; one new sentence to live by',
    },
    external: {
      prompt: 'What story would help others care?',
      suggestedArtifact: 'a post, a pitch, or a reframed narrative for the cause',
    },
  },
  strategist: {
    internal: {
      prompt: 'Where is my energy leaking, and what inner strategy would preserve capacity?',
      suggestedArtifact: 'an energy audit, a boundary, a personal plan',
    },
    external: {
      prompt: 'Where is the leverage in the world?',
      suggestedArtifact: 'a leverage map, a roadmap, a sequenced plan',
    },
  },
  disruptor: {
    internal: {
      prompt: 'What inner rule, shame spell, or false obligation needs to be challenged?',
      suggestedArtifact: 'a named limiting belief + a permission slip to break it',
    },
    external: {
      prompt: 'What external assumption, norm, or bottleneck needs to be challenged?',
      suggestedArtifact: 'the bottleneck named plainly + a precise disruption',
    },
  },
  alchemist: {
    internal: {
      prompt: 'What emotion needs to be metabolized before I can show up?',
      suggestedArtifact: 'a 3-2-1 entry; an emotion named and shifted',
    },
    external: {
      prompt: 'What relational tension or emotional friction needs to be transformed?',
      suggestedArtifact: 'a held space, a ritual, a reframed conflict',
    },
  },
  escape_artist: {
    internal: {
      prompt: 'What failing inner system or attachment must I walk away from?',
      suggestedArtifact: 'a named cage; a clean inner exit; what to carry forward',
    },
    external: {
      prompt: 'Where is the misalignment, and who needs guiding out of a failing system?',
      suggestedArtifact: 'an exit plan, a safe-landing map, an honest off-ramp',
    },
  },
  coach: {
    internal: {
      prompt: "What level have I outgrown, and what's the next honest step to leave it?",
      suggestedArtifact: 'the next honest step; the old story to retire',
    },
    external: {
      prompt: 'Who am I calling up — helping abandon an outgrown level and its story?',
      suggestedArtifact: 'a calling-up message; a next-step nudge; an accountability check',
    },
  },
}
