/**
 * Example IntakeTemplate seed — 3 GM-authored questions with hidden SD routing.
 *
 * This seed demonstrates the full intake question schema:
 *   • Player-visible fields: passage `text`, choice `text`
 *   • Hidden fields: choice `routing.sdWeights`, choice `routing.moveWeights`
 *   • Face labels are NEVER present in player-visible text
 *   • Terminal passage has NO gmFace or moveType labels — routing is computed
 *
 * ─────────────────────────────────────────────────────────────────────────
 * QUESTION DESIGN RATIONALE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Q1 "What matters most right now?" — discriminates belonging/order/strategy/relational
 *   A → shaman (tribal ritual/belonging)
 *   B → regent (order, rules, expectations)
 *   C → architect (strategy, impact)
 *   D → diplomat (relational field, inclusion)
 *
 * Q2 "When something is stuck, your first instinct is…" — discriminates shaman/challenger/regent/sage
 *   A → shaman (ritual patience, waiting for signs)
 *   B → challenger (force through, push harder)
 *   C → regent (process review, fix the system)
 *   D → sage (zoom out, find the meta-pattern)
 *
 * Q3 "What does real growth feel like to you?" — discriminates thresholds/skill/belonging/responsibility
 *   A → shaman + challenger (threshold crossing)
 *   B → architect (capability growth)
 *   C → diplomat + shaman (collective belonging)
 *   D → regent + architect (earned responsibility)
 *
 * Move type discrimination:
 *   wakeUp   = awareness, threshold, noticing
 *   cleanUp  = repair, amends, process-fix
 *   growUp   = development, expanding capacity
 *   showUp   = presence, commitment, showing up for others
 *
 * ─────────────────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────
 *   import { EXAMPLE_INTAKE_TEMPLATE } from '@/lib/cyoa-intake/seed'
 *   // Seed an Adventure.playbookTemplate:
 *   JSON.stringify(EXAMPLE_INTAKE_TEMPLATE)
 *
 * See: src/lib/cyoa-intake/types.ts for the full IntakeTemplate schema.
 * See: src/lib/cyoa-intake/resolveRouting.ts for how routing is computed.
 */

import type { IntakeTemplate } from './types'

export const EXAMPLE_INTAKE_TEMPLATE: IntakeTemplate = {
  version: 1,
  startNodeId: 'start',
  passages: [
    // ── Question 1 ────────────────────────────────────────────────────────
    {
      nodeId: 'start',
      text: "Before we begin — what feels most important to you right now?",
      isTerminal: false,
      choices: [
        {
          text: "Finding my place and a real sense of belonging",
          targetId: 'q2',
          choiceKey: 'start_a',
          routing: {
            // shaman: tribal/ritual/belonging (Purple) — strongest signal
            // diplomat: also relational, but belonging is more foundational than care
            sdWeights: { shaman: 1.0, diplomat: 0.3 },
            // wakeUp: this is about crossing the threshold into the group
            moveWeights: { wakeUp: 0.8, growUp: 0.2 },
          },
        },
        {
          text: "Getting clear on what's expected and how things work here",
          targetId: 'q2',
          choiceKey: 'start_b',
          routing: {
            // regent: order, rules, roles (Amber) — clear authority/structure seeker
            // architect: some strategic overlay, but rule-seeking is primary
            sdWeights: { regent: 1.0, architect: 0.2 },
            // cleanUp: want to understand and repair/align with existing structure
            // growUp: also some developmental intent
            moveWeights: { cleanUp: 0.5, growUp: 0.5 },
          },
        },
        {
          text: "Mapping the strategy and figuring out where I can have the most impact",
          targetId: 'q2',
          choiceKey: 'start_c',
          routing: {
            // architect: rational/strategic/achievement (Orange) — clearest signal
            // sage: slight integral flavor from "where I can have the most impact"
            sdWeights: { architect: 1.0, sage: 0.2 },
            // growUp: capability expansion, leverage
            // showUp: impact orientation
            moveWeights: { growUp: 0.7, showUp: 0.3 },
          },
        },
        {
          text: "Making sure everyone's voice is heard and no one is left out",
          targetId: 'q2',
          choiceKey: 'start_d',
          routing: {
            // diplomat: pluralistic/care/inclusion (Green) — canonical Green signal
            // sage: slight integral overlay from systems-level inclusion framing
            sdWeights: { diplomat: 1.0, sage: 0.2 },
            // showUp: showing up for others / holding space
            // cleanUp: minor — repairing exclusion
            moveWeights: { showUp: 0.7, cleanUp: 0.3 },
          },
        },
      ],
    },

    // ── Question 2 ────────────────────────────────────────────────────────
    {
      nodeId: 'q2',
      text: "When something feels stuck or blocked, what's your first instinct?",
      isTerminal: false,
      choices: [
        {
          text: "Sit with it — wait for the right moment to reveal itself",
          targetId: 'q3',
          choiceKey: 'q2_a',
          routing: {
            // shaman: ritual patience, trust in timing, liminal waiting
            // sage: slight — wise waiting can also be integral/systemic
            sdWeights: { shaman: 0.8, sage: 0.3 },
            // wakeUp: heightened awareness while waiting; threshold approach
            moveWeights: { wakeUp: 1.0 },
          },
        },
        {
          text: "Push through — more energy, more force, keep moving",
          targetId: 'q3',
          choiceKey: 'q2_b',
          routing: {
            // challenger: power, action, pushing harder (Red)
            sdWeights: { challenger: 1.0 },
            // showUp: full presence and force
            // cleanUp: some — clearing the blockage
            moveWeights: { showUp: 0.6, cleanUp: 0.4 },
          },
        },
        {
          text: "Review the process — find where it broke down and fix it",
          targetId: 'q3',
          choiceKey: 'q2_c',
          routing: {
            // regent: rules/process orientation — fix what's broken in the system (Amber)
            // architect: methodical, optimization-adjacent
            sdWeights: { regent: 0.7, architect: 0.4 },
            // cleanUp: repairing the broken process
            // growUp: small developmental signal from "find and fix"
            moveWeights: { cleanUp: 0.8, growUp: 0.2 },
          },
        },
        {
          text: "Zoom out — look for the deeper pattern behind the blockage",
          targetId: 'q3',
          choiceKey: 'q2_d',
          routing: {
            // sage: integral/systemic meta-view (Yellow/Teal) — strongest signal
            // architect: some — systems thinking also present at Orange
            sdWeights: { sage: 0.9, architect: 0.3 },
            // growUp: expanding perspective and developmental horizon
            // wakeUp: noticing what was previously invisible
            moveWeights: { growUp: 0.6, wakeUp: 0.4 },
          },
        },
      ],
    },

    // ── Question 3 ────────────────────────────────────────────────────────
    {
      nodeId: 'q3',
      text: "What does real growth feel like to you?",
      isTerminal: false,
      choices: [
        {
          text: "Crossing a threshold — there's a clear before and after",
          targetId: 'end',
          choiceKey: 'q3_a',
          routing: {
            // shaman: threshold crossing is archetypal ritual transition (Purple)
            // challenger: the heroic "before and after" arc (Red)
            sdWeights: { shaman: 0.7, challenger: 0.4 },
            // wakeUp: threshold = awakening / new awareness
            // growUp: developmental movement across the threshold
            moveWeights: { wakeUp: 0.8, growUp: 0.2 },
          },
        },
        {
          text: "Getting noticeably better at something that genuinely matters",
          targetId: 'end',
          choiceKey: 'q3_b',
          routing: {
            // architect: skill/achievement/optimization (Orange) — strongest signal
            // challenger: slight — "getting better" has a competitive/edge flavor
            sdWeights: { architect: 0.9, challenger: 0.2 },
            // growUp: capability expansion is the canonical growUp move
            moveWeights: { growUp: 1.0 },
          },
        },
        {
          text: "Being part of something bigger than myself",
          targetId: 'end',
          choiceKey: 'q3_c',
          routing: {
            // diplomat: relational, collective, care-network belonging (Green)
            // shaman: "part of something bigger" also has tribal/mythic resonance
            sdWeights: { diplomat: 0.8, shaman: 0.3 },
            // showUp: showing up for the collective
            // cleanUp: some — giving back, being of service
            moveWeights: { showUp: 0.8, cleanUp: 0.2 },
          },
        },
        {
          text: "Earning the right to take care of something or someone",
          targetId: 'end',
          choiceKey: 'q3_d',
          routing: {
            // regent: responsibility, earned authority, stewardship (Amber)
            // architect: slight — strategic stewardship, earned trust
            sdWeights: { regent: 0.7, architect: 0.3 },
            // cleanUp: owning responsibility — repairing and maintaining
            // showUp: showing up to fulfill the earned role
            moveWeights: { cleanUp: 0.5, showUp: 0.5 },
          },
        },
      ],
    },

    // ── Terminal Passage ──────────────────────────────────────────────────
    // NOTE: No gmFace or moveType field here — routing is purely computed
    // from the accumulated sdWeights in the player's choice log above.
    {
      nodeId: 'end',
      text: "You're ready. Your path ahead is taking shape — step through.",
      isTerminal: true,
      choices: [],
    },
  ],
}

// ---------------------------------------------------------------------------
// Routing discrimination matrix (documentation / test reference)
// ---------------------------------------------------------------------------

/**
 * Expected face routing for archetypal choice sequences.
 * Used as test expectations in __tests__/resolveRouting.test.ts.
 *
 * All-A path: shaman signals (1.0 + 0.8 + 0.7 = 2.5) → gmFace: 'shaman'
 * All-B path: regent (1.0 + 0) + challenger (1.0) + architect (0.9) — need totals
 *   start_b: {regent:1.0, architect:0.2}
 *   q2_b:   {challenger:1.0}
 *   q3_b:   {architect:0.9, challenger:0.2}
 *   Totals: regent:1.0, architect:1.1, challenger:1.2 → gmFace: 'challenger'
 *
 * All-C path:
 *   start_c: {architect:1.0, sage:0.2}
 *   q2_c:   {regent:0.7, architect:0.4}
 *   q3_c:   {diplomat:0.8, shaman:0.3}
 *   Totals: architect:1.4, sage:0.2, regent:0.7, diplomat:0.8, shaman:0.3 → gmFace: 'architect'
 *
 * All-D path:
 *   start_d: {diplomat:1.0, sage:0.2}
 *   q2_d:   {sage:0.9, architect:0.3}
 *   q3_d:   {regent:0.7, architect:0.3}
 *   Totals: diplomat:1.0, sage:1.1, architect:0.6, regent:0.7 → gmFace: 'sage'
 *
 * Mixed diplomat+sage path (start_d, q2_d, q3_c):
 *   start_d: {diplomat:1.0, sage:0.2}
 *   q2_d:   {sage:0.9, architect:0.3}
 *   q3_c:   {diplomat:0.8, shaman:0.3}
 *   Totals: diplomat:1.8, sage:1.1, architect:0.3, shaman:0.3 → gmFace: 'diplomat'
 */
export const ROUTING_DISCRIMINATION_EXAMPLES = {
  allA: {
    choices: ['start_a', 'q2_a', 'q3_a'],
    expectedGmFace: 'shaman' as const,
    expectedMoveType: 'wakeUp' as const,
  },
  allB: {
    choices: ['start_b', 'q2_b', 'q3_b'],
    expectedGmFace: 'challenger' as const,
    expectedMoveType: 'growUp' as const, // q3_b gives growUp:1.0
  },
  allC: {
    choices: ['start_c', 'q2_c', 'q3_c'],
    expectedGmFace: 'architect' as const,
    expectedMoveType: 'showUp' as const, // showUp accumulates: 0.3+0 + 0.8 = 1.1 vs growUp: 0.7+0.2+0 = 0.9
  },
  allD: {
    choices: ['start_d', 'q2_d', 'q3_d'],
    expectedGmFace: 'sage' as const,
    expectedMoveType: 'showUp' as const, // showUp: 0.7+0+0.5 = 1.2 vs growUp: 0+0.6+0 = 0.6 vs cleanUp: 0.3+0+0.5 = 0.8
  },
  diplomatPath: {
    choices: ['start_d', 'q2_d', 'q3_c'],
    expectedGmFace: 'diplomat' as const,
    expectedMoveType: 'showUp' as const,
  },
} as const
