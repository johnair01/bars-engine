/**
 * MTGOA public organization state.
 *
 * Week 2 asks a reader to look at the campaign that is actually running. That
 * only works if the page can tell them the truth about it, so this module is the
 * single source for what the campaign publicly says about itself: what is
 * happening, what a local team is, and what is currently being asked.
 *
 * **Everything here must be a fact the campaign owner has approved.** The whole
 * point of the panel is that a reader can trust it, and one invented vacancy
 * costs that for every other line on the page.
 *
 * Current state: the approved facts are an open decision in the Week 2 spec
 * (`MTGOA_COURSE_WEEK_2_AND_ORGANIZATION_SURFACES_SPEC_2026-08-21.md`, "Open
 * decisions" 1 and 2). So nothing is marked `open`, there are no CTAs, and the
 * panel says plainly that there is no current contribution route and points the
 * reader at the personal lane. That is the state the spec requires when nothing
 * has been approved: "It never creates a fictional campaign vacancy."
 *
 * To publish real state, fill these in and flip the relevant `status`. The
 * publication rules the spec sets, enforced by tests in `__tests__`:
 *
 *   - Every public state page shows `updatedAt` and `nextReviewAt`.
 *   - `planned` or `closed` explains the boundary and carries no action CTA.
 *   - `open` requires a real action route, a responsible owner, a scope, a time
 *     shape, and terms.
 *   - No private people, recipient lists, course reflections, unverified
 *     promises, stock counts, or financial details.
 *   - Legal nonprofit status lives at `/nonprofit` and is never paraphrased here.
 */

export type Availability = 'open' | 'waitlist' | 'planned' | 'closed'

export type MtgoaWorkstream = {
  id: string
  title: string
  whyItMatters: string
  status: Availability
  ownerLabel: string
  nextUsefulAction?: string
  href?: string
}

export type MtgoaParticipationPath = {
  id: string
  title: string
  forWhom: string
  ask: string
  timeShape: string
  decisionRights: string
  boundaries: string[]
  status: Availability
  href?: string
}

export type MtgoaOrganizationState = {
  updatedAt: string
  nextReviewAt: string
  campaignSummary: string
  currentTruths: string[]
  notCurrentlyTrue: string[]
  activeWorkstreams: MtgoaWorkstream[]
  participationPaths: MtgoaParticipationPath[]
  localTeams: {
    status: Availability
    definition: string
    whatTheyDo: string[]
    whatTheyDoNotDo: string[]
    startingRequirements: string[]
    contactPath?: string
  }
  recognition: {
    status: Availability
    summary: string
    eligibleActions: string[]
    notRequired: string[]
    termsHref?: string
  }
  relatedSurfaces: Array<{ label: string; href: string; why: string }>
}

export const MTGOA_ORGANIZATION_STATE: MtgoaOrganizationState = {
  updatedAt: '2026-08-21',
  nextReviewAt: '2026-09-21',

  campaignSummary:
    'One book, and readers who hand it to people who may find it useful. That is the whole of the campaign right now.',

  currentTruths: [
    'The book is published and available.',
    'The Allyship Deck is available.',
    'The first five days of this course are live, and a reader can walk them alone.',
    'Days 6–10 exist as a practice you can do for your own work, whether or not anyone else is involved.',
  ],

  /**
   * The honest half. A reader deciding whether to organize deserves to know
   * what is absent as plainly as what exists.
   */
  notCurrentlyTrue: [
    'Volunteer, ambassador and street-team roles are all closed right now.',
    'Local teams are still a plan. The first one starts when it starts.',
    'Rewards and recognition are undecided, so nothing is on offer — free copies included.',
    'Whatever you organize this week is yours, for your own work.',
  ],

  // Nothing is published as an active workstream until the campaign owner
  // approves the specific facts. An empty list renders as "nothing to show yet",
  // which is true, rather than as a page with an invented opportunity on it.
  activeWorkstreams: [],

  participationPaths: [],

  localTeams: {
    status: 'planned',
    definition:
      'A local team would be a small, voluntary, locally rooted group helping the book reach people who may benefit from it.',
    whatTheyDo: [
      'Put the book in front of people who would find it useful.',
      'Host a conversation that people opt into.',
      'Keep their own rhythm, at their own scale.',
    ],
    whatTheyDoNotDo: [
      'Carry a sales quota.',
      'Recruit friends into obligation.',
      'Speak for the author or the organization.',
    ],
    startingRequirements: [
      'A named purpose the group agrees on.',
      'A real next action with an owner, which can be one person.',
      'Terms that let anyone decline any part of it.',
    ],
  },

  recognition: {
    status: 'planned',
    summary:
      'Some campaign actions may one day be supported with copies of the book, where that support is actually available. The terms for that are undecided, so nothing is on offer today.',
    eligibleActions: [],
    notRequired: [
      'Disclosing a private recommendation.',
      'Hitting a sales or conversion target.',
      'Sharing anything you wrote in this course.',
    ],
  },

  relatedSurfaces: [
    { label: 'Read the campaign state', href: '/wiki/mastering-allyship/campaign-state', why: 'The longer version of this panel.' },
    { label: 'Nonprofit status', href: '/nonprofit', why: 'The legal disclosures live there and only there.' },
    { label: 'Support', href: '/support', why: 'Personal support, kept separate from anything in this course.' },
  ],
}

/** Whether any route into the campaign is actually open to a reader today. */
export function hasOpenParticipation(state: MtgoaOrganizationState = MTGOA_ORGANIZATION_STATE): boolean {
  return (
    state.participationPaths.some((path) => path.status === 'open') ||
    state.localTeams.status === 'open'
  )
}

/**
 * What the "What is already happening" panel says when nothing is open. The spec
 * requires this exact move: say so, and send the reader to the personal lane.
 */
export const NO_OPEN_PARTICIPATION_NOTE =
  'Every contribution route is closed right now, so this week is yours to use on your own work. Organizing your own allyship practice is a complete way to do Week 2.'
