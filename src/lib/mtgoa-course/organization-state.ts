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
 * The Campaign Steward owns these facts. An `open` route has been checked against
 * a real page or purchase link; a future campaign, partner, reward, or team stays
 * absent until it can meet that same standard.
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
  secondaryHref?: string
  secondaryLabel?: string
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
  updatedAt: '2026-08-22',
  nextReviewAt: '2026-08-29',

  campaignSummary:
    'The book is out. Wendell is showing up daily with small games, Kickstarter backers have been updated, and the Book Launch is trying to put 500 copies in people’s hands.',

  currentTruths: [
    'The digital book is published and available now.',
    'The Allyship Deck is available.',
    'Days 1–10 of the course are live, and a reader can use them for the Book Launch or their own allyship work.',
    'Wendell is the Campaign Steward today. More stewards can be onboarded as the work needs them.',
  ],

  /**
   * The honest half. A reader deciding whether to organize deserves to know
   * what is absent as plainly as what exists.
   */
  notCurrentlyTrue: [
    'There is no public ambassador program or generic volunteer pool.',
    'No local team is open for people to join yet.',
    'No reward, referral credit, or free-copy promise is attached to the routes below.',
    'A book handoff does not make someone a member or obligate them to keep promoting the book.',
  ],

  activeWorkstreams: [{
    id: 'book-launch',
    title: 'Book Launch',
    whyItMatters: 'The book reaches people through specific relationships, organizations, rooms, and conversations—not through a generic audience.',
    status: 'open',
    ownerLabel: 'Campaign Steward: Wendell',
    nextUsefulAction: 'Choose one route you can stand behind, or use the same practice in your own allyship life.',
    href: '/organization',
  }],

  participationPaths: [
    {
      id: 'five-copy-handoff', title: 'Help five people get a copy',
      forWhom: 'Someone who can name a person or room that may genuinely use the book.',
      ask: 'Make one consentful handoff at a time. You can repeat the practice until five people have a copy.',
      timeShape: 'One person or room at a time; the reader sets the rhythm.',
      decisionRights: 'You decide who is a fit, what you offer, and when to stop. Their choice remains theirs.',
      boundaries: ['Do not turn a relationship into a sales channel.', 'Do not pursue silence or ask for purchase proof.', 'Use the same move in your own allyship life if no book handoff fits.'],
      status: 'open', href: '/mastering-allyship/show-up',
    },
    {
      id: 'organization-introduction', title: 'Put the book in front of an organization or community you know',
      forWhom: 'Someone with a relevant organization, community, venue, or collaborator in mind.',
      ask: 'Offer one introduction or Book Tour lead through the current help route.',
      timeShape: 'One introduction or lead; follow-up is handled by the Book Tour team.',
      decisionRights: 'You decide whether the relationship is appropriate. The team decides whether and how to follow up.',
      boundaries: ['Do not share another person’s contact details without permission.', 'The form is an offer to help, not a confirmed event or partnership.'],
      status: 'open', href: '/mastering-allyship/book-tour/help',
    },
    {
      id: 'podcast-capacity', title: 'Offer podcast capacity',
      forWhom: 'Someone who wants to be a guest, a host or producer, or a person who can make an appropriate introduction.',
      ask: 'Offer yourself as a guest, or invite Wendell onto a podcast that is a genuine fit.',
      timeShape: 'One email, then a conversation if it is useful.',
      decisionRights: 'You decide what you can offer. Wendell decides whether and how to follow up.',
      boundaries: ['An offer is not a booking.', 'Do not offer a show or producer relationship you cannot actually connect.'],
      status: 'open', href: 'mailto:wendell@masteringallyship.com?subject=Podcast%20guest%20offer',
      secondaryHref: '/podcasts', secondaryLabel: 'Host or produce a show? Invite Wendell →',
    },
    {
      id: 'buy-book', title: 'Get a copy into your own hands',
      forWhom: 'Someone who has not bought the book yet, or wants a copy before offering it onward.',
      ask: 'Buy a copy. A purchase is a complete commerce choice, separate from joining the campaign.',
      timeShape: 'One copy.',
      decisionRights: 'You decide whether the book is useful to you and whether now is the time.',
      boundaries: ['Buying the book does not enroll you in anything.', 'No follow-up contribution is required.'],
      status: 'open', href: 'https://wendellbritt.gumroad.com/l/MTGOAbook',
    },
  ],

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
    { label: 'Buy the digital book', href: 'https://wendellbritt.gumroad.com/l/MTGOAbook', why: 'A book purchase is a separate commerce action, not campaign membership.' },
    { label: 'Practice the book handoff', href: '/mastering-allyship/show-up', why: 'The Day 5 Show Up check helps a reader prepare one useful, consentful handoff.' },
    { label: 'Help the Book Tour', href: '/mastering-allyship/book-tour/help', why: 'Offer a venue, introduction, production help, resource lead, or promotion support.' },
    { label: 'Podcast conversations', href: '/podcasts', why: 'Invite Wendell onto a show, or offer yourself as a guest by email.' },
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
