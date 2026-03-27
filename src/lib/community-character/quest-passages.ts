/**
 * Community Character Quest — passage definitions.
 *
 * 7 questions that elicit who belongs in a campaign owner's community.
 * Each question has 3 choices; each choice contributes prompt template IDs to the corpus.
 *
 * The `questionText` and `subtext` functions receive a PassageContext so the
 * framing can be tuned to the owner's nation + archetype register.
 *
 * Currently ships with full framing for Virelune × Bold Heart.
 * All other combinations fall back to the generic register — add entries to
 * ARCHETYPE_FRAMINGS / NATION_INTROS as the community grows.
 */
import type { QuestPassage, PassageContext } from './types'

// ─── Per-archetype framing overrides ─────────────────────────────────────────
// Key: archetypeKey. Return the opening address for each passage.
// Generic fallback used when no match.

type FramingFn = (ctx: PassageContext) => string

const ARCHETYPE_INTROS: Partial<Record<string, FramingFn>> = {
  'bold-heart': (ctx) =>
    ctx.nationKey === 'virelune'
      ? 'You move toward what matters. Your invitations carry that current.'
      : 'Your courage opens doors others hesitate at.',
  'devoted-guardian': () =>
    'You protect what you love. Your invitations are acts of care.',
  'joyful-connector': () =>
    'Community is your element. Your invitations are the thing you were built for.',
  'subtle-influence': () =>
    'You shape the room without announcing yourself. Your invitations are precise.',
  'truth-seer': () =>
    'You see who people actually are. Your invitations go to the real person, not the persona.',
}

function getArchetypeIntro(ctx: PassageContext): string {
  return ARCHETYPE_INTROS[ctx.archetypeKey]?.(ctx) ?? 'Your community knows who belongs here.'
}

// ─── Passage definitions ──────────────────────────────────────────────────────

export const COMMUNITY_CHARACTER_PASSAGES: QuestPassage[] = [
  // ── 1. The Aliveness Question ──────────────────────────────────────────────
  {
    id: 'q-aliveness',
    communityType: 'multiplier',
    questionText: (ctx) => {
      if (ctx.archetypeKey === 'bold-heart' && ctx.nationKey === 'virelune') {
        return 'Who in your world says yes before they know the details — and the room gets better when they arrive?'
      }
      return 'Who shows up and the energy shifts? Who brings the current that makes things feel alive?'
    },
    subtext: (ctx) => getArchetypeIntro(ctx),
    choices: [
      {
        id: 'q-aliveness-a',
        label: 'Someone who moves fast and brings energy',
        promptIds: ['multiplier-early-yes'],
      },
      {
        id: 'q-aliveness-b',
        label: 'Someone who makes people feel seen the moment they arrive',
        promptIds: ['anchor-welcomer', 'multiplier-connector'],
      },
      {
        id: 'q-aliveness-c',
        label: 'Someone who always has a new person with them',
        promptIds: ['multiplier-spreader', 'bridge-different-network'],
      },
    ],
  },

  // ── 2. The Newcomer Question ───────────────────────────────────────────────
  {
    id: 'q-newcomer',
    communityType: 'newcomer',
    questionText: (ctx) => {
      if (ctx.archetypeKey === 'bold-heart') {
        return "Bold Hearts know the value of a well-timed invitation. Who has been circling the edges of what you're building?"
      }
      return "Who has been curious about what you're doing but hasn't found the door yet?"
    },
    choices: [
      {
        id: 'q-newcomer-a',
        label: 'Someone from a neighboring world — same orbit, different circle',
        promptIds: ['newcomer-adjacent'],
      },
      {
        id: 'q-newcomer-b',
        label: "Someone who's been asking questions but hasn't taken the step",
        promptIds: ['newcomer-curious'],
      },
      {
        id: 'q-newcomer-c',
        label: "Someone who almost came before — the timing wasn't right",
        promptIds: ['newcomer-returning'],
      },
    ],
  },

  // ── 3. The Anchor Question ─────────────────────────────────────────────────
  {
    id: 'q-anchor',
    communityType: 'anchor',
    questionText: (ctx) => {
      if (ctx.archetypeKey === 'bold-heart' && ctx.nationKey === 'virelune') {
        return 'Every bold move needs people who hold the room when things get uncertain. Who are yours?'
      }
      return 'Who keeps the room steady? Who makes it safe enough for others to be themselves?'
    },
    choices: [
      {
        id: 'q-anchor-a',
        label: "Someone who knows the history of what you're building",
        promptIds: ['anchor-history-keeper'],
      },
      {
        id: 'q-anchor-b',
        label: 'Someone who makes newcomers feel immediately included',
        promptIds: ['anchor-welcomer'],
      },
      {
        id: 'q-anchor-c',
        label: "Someone whose calm presence makes bold moves feel possible",
        promptIds: ['anchor-steadier'],
      },
    ],
  },

  // ── 4. The Bridge Question ─────────────────────────────────────────────────
  {
    id: 'q-bridge',
    communityType: 'bridge',
    questionText: () =>
      "Who moves between worlds? Who knows people you don't — and could bring them in?",
    choices: [
      {
        id: 'q-bridge-a',
        label: "Someone who knows people in circles you don't move in",
        promptIds: ['bridge-different-network'],
      },
      {
        id: 'q-bridge-b',
        label: 'Someone who belongs to multiple communities naturally',
        promptIds: ['bridge-cross-community'],
      },
      {
        id: 'q-bridge-c',
        label: "Someone who can translate what you're doing for people outside your world",
        promptIds: ['bridge-translator'],
      },
    ],
  },

  // ── 5. The Wildcard Question ───────────────────────────────────────────────
  {
    id: 'q-wildcard',
    communityType: 'wildcard',
    questionText: (ctx) => {
      if (ctx.archetypeKey === 'bold-heart') {
        return "Bold Hearts attract unexpected people. Who would surprise everyone by being perfect here?"
      }
      return 'Who would surprise the room — in the best way? Who belongs here but you wouldn\'t have predicted it?'
    },
    choices: [
      {
        id: 'q-wildcard-a',
        label: "Someone whose presence would genuinely surprise you — in the best way",
        promptIds: ['wildcard-unexpected-fit'],
      },
      {
        id: 'q-wildcard-b',
        label: "Someone whose skepticism would dissolve by actually being there",
        promptIds: ['wildcard-skeptic'],
      },
      {
        id: 'q-wildcard-c',
        label: "Someone from a completely different world who would immediately get it",
        promptIds: ['wildcard-outsider'],
      },
    ],
  },

  // ── 6. The Collaborator / Event-type Question ─────────────────────────────
  {
    id: 'q-collaborator',
    communityType: 'collaborator',
    questionText: () =>
      "Who builds with you? Who turns a conversation into something real?",
    subtext: () =>
      'This shapes which prompts appear when events are scheming or workshop flavored.',
    choices: [
      {
        id: 'q-collaborator-a',
        label: "Someone who's building something adjacent to what you're doing",
        promptIds: ['collaborator-builder', 'bridge-different-network'],
      },
      {
        id: 'q-collaborator-b',
        label: 'Someone who turns every conversation into a plan',
        promptIds: ['collaborator-momentum'],
      },
      {
        id: 'q-collaborator-c',
        label: 'Someone who knows how to make things actually happen',
        promptIds: ['collaborator-resource', 'anchor-steadier'],
      },
    ],
  },

  // ── 7. The Stretch Question ────────────────────────────────────────────────
  {
    id: 'q-stretch',
    communityType: 'stretch',
    questionText: (ctx) => {
      if (ctx.archetypeKey === 'bold-heart') {
        return 'The boldest invitations go to people you least expect to say yes. Who would you need to really reach for?'
      }
      return "Who would require real courage to invite? Who would transform the room if they came?"
    },
    choices: [
      {
        id: 'q-stretch-a',
        label: "Someone you've been meaning to reconnect with — this is the reason",
        promptIds: ['stretch-reconnection'],
      },
      {
        id: 'q-stretch-b',
        label: "Someone whose work you admire but haven't approached",
        promptIds: ['stretch-admiration'],
      },
      {
        id: 'q-stretch-c',
        label: "Someone who intimidates you a little but absolutely belongs here",
        promptIds: ['stretch-edge'],
      },
    ],
  },
]

/** Mirror passage — shown after all 7 questions to reflect the corpus back. */
export const MIRROR_PASSAGE_TITLE = 'Here is who you are building this for'
export const MIRROR_PASSAGE_SUBTEXT =
  'These prompts will appear on every invite bingo card generated for your campaign events. You can revisit and update this at any time from your campaign hub.'
