/**
 * The page-building intake for a hosted campaign: the questions a campaign owner
 * answers so a GoFundMe and a Patreon page can be written from them, by her or by
 * Wendell. Each step carries the platform's own best-practice tip and a STUCK?
 * button (WAVE, 3-2-1, or book time with Wendell); a press is recorded with the
 * step and the time and emails Wendell, so he can reach out before she stalls.
 *
 * Tips come from GoFundMe's and Patreon's own creator guides (sources below,
 * gathered 2026-10-21). Their numbers are the platforms' marketing data.
 *
 * Pure: no database, no request state. Answers live beside the campaign's fields
 * in `AppConfig.theme[hostedCampaigns][slug].intake`.
 */

import type { HostedCampaignFields } from './campaigns'

export type IntakePlatform = 'gofundme' | 'patreon'

export interface IntakeQuestion {
  key: string
  ask: string
  long?: boolean
}

export interface IntakeStep {
  id: string
  platform: IntakePlatform
  title: string
  /** The platform's best-practice tip for this step. */
  why: string
  questions: IntakeQuestion[]
}

export const PLATFORMS: ReadonlyArray<{ key: IntakePlatform; name: string; blurb: string }> = [
  { key: 'gofundme', name: 'GoFundMe', blurb: 'One fundraiser for a named need, with a goal and a story.' },
  { key: 'patreon', name: 'Patreon', blurb: 'A monthly membership: people pay to keep your work going.' },
]

const q = (key: string, ask: string, long = false): IntakeQuestion => ({ key, ask, long })

export const INTAKE_STEPS: IntakeStep[] = [
  // ── GoFundMe ──────────────────────────────────────────────────────────────
  {
    id: 'gf_basics', platform: 'gofundme', title: 'Basics',
    why: 'Strangers rarely give to strangers. The page has to say right away who you are and who benefits. Gifts to a person or a business are not tax-deductible, so say so plainly.',
    questions: [
      q('gf_beneficiary', 'Who benefits from this fundraiser: you, Balancing Act Coaching, or the clients your sliding scale serves?', true),
      q('gf_category', 'Which category fits best: Business, Community, or Education?'),
      q('gf_location', 'Where are you based (city and state)?'),
      q('gf_payee', 'Who receives the funds, and into whose bank account?'),
    ],
  },
  {
    id: 'gf_goal', platform: 'gofundme', title: 'Goal',
    why: 'Start smaller and raise the goal later: people give more when they can see their gift make a difference. Set it a little above the real need to cover per-donation fees.',
    questions: [
      q('gf_goal_amount', 'What is the smallest amount that would make a real difference?'),
      q('gf_goal_breakdown', 'What does that amount pay for, line by line? (For example: 10 sliding-scale sessions at $100, a certification, tools.)', true),
      q('gf_goal_stretch', 'Is there a second goal you would raise it to once you reach the first?'),
      q('gf_goal_date', 'Is there a date the money is needed by?'),
    ],
  },
  {
    id: 'gf_title', platform: 'gofundme', title: 'Title',
    why: 'Clear, short and memorable. Start with an action word ("Help", "Support") and include a name and the main challenge, like "Help Annastasia keep coaching affordable".',
    questions: [
      q('gf_title_ask', 'In one phrase, what are you asking people to help make happen?'),
      q('gf_title_lead', 'Should your name, your practice, or the people you serve lead the title?'),
      q('gf_title_draft', 'Try a title (under 50 characters is best).'),
    ],
  },
  {
    id: 'gf_story', platform: 'gofundme', title: 'Story',
    why: 'Someone skimming for a few seconds should find who, what, when, where and why. Open with a personal introduction, aim for 400 words or more, and break the goal down into costs.',
    questions: [
      q('gf_story_who', 'Who are you, and how did you come to coaching?', true),
      q('gf_story_what', 'What is sliding-scale coaching, and why do you offer it?', true),
      q('gf_story_change', 'What happens if this succeeds? And what happens if it does not?', true),
      q('gf_story_spend', 'How exactly will the money be spent?', true),
      q('gf_story_now', 'Why now? What makes this urgent?', true),
    ],
  },
  {
    id: 'gf_media', platform: 'gofundme', title: 'Photo and video',
    why: 'Use a clear, bright photo of a person, not an object or text, and no stock images. A short video adds warmth.',
    questions: [
      q('gf_media_photo', 'Which recent photo of you will lead the page? (Bright, looking at the camera, ideally coaching or outdoors.) Paste a link or describe it.'),
      q('gf_media_video', 'Could you record a 30 to 60 second phone video saying why this matters? What would you say?', true),
      q('gf_media_more', 'Which 2 or 3 more photos could you add (sessions, workshops, clients who have said yes to appearing)?'),
    ],
  },
  {
    id: 'gf_launch', platform: 'gofundme', title: 'Launch plan',
    why: 'A fundraiser shared 6 to 10 times in its first 3 days is twice as likely to reach its goal, and one with co-organizers raises up to 3 times more. Write personally to your closest people before you post publicly.',
    questions: [
      q('gf_launch_first', 'Which 5 to 10 people will you message personally before going public, so the page already shows gifts?', true),
      q('gf_launch_coorg', 'Who could be a co-organizer and share it with their own people?'),
      q('gf_launch_channels', 'Where will you share it (email list, Instagram, Facebook, group chats, newsletter)?'),
      q('gf_launch_day', 'What day will you launch, and when will you send a second wave?'),
    ],
  },
  {
    id: 'gf_updates', platform: 'gofundme', title: 'Updates',
    why: 'Post the first update within the first week, then weekly or at milestones (50%, 75%, the final push). Updates with photos or video can raise up to 3 times more.',
    questions: [
      q('gf_updates_progress', 'What progress could you show (a session funded, a client story shared with permission)?', true),
      q('gf_updates_milestones', 'Which milestones will you announce?'),
      q('gf_updates_who', 'Who posts updates when you are busy: you or a co-organizer?'),
    ],
  },
  {
    id: 'gf_thanks', platform: 'gofundme', title: 'Thank-yous',
    why: 'Thanking people, in public and one by one, keeps them sharing. Co-organizers can send thanks too.',
    questions: [
      q('gf_thanks_how', 'How will you thank each person who gives (a personal message, a short video, a shout-out in an update)?'),
      q('gf_thanks_gesture', 'Is there a small gesture you would like to offer, such as a group gratitude call?'),
      q('gf_thanks_report', 'Will you share a final report on how the money was used?'),
    ],
  },
  // ── Patreon ───────────────────────────────────────────────────────────────
  {
    id: 'pt_basics', platform: 'patreon', title: 'Who and what',
    why: 'Visitors decide fast, so say in one line what you make and who it is for. Patreon keeps 8% or 12% plus payment fees, depending on the plan.',
    questions: [
      q('pt_name', 'What name will the page use: Annastasia, or Balancing Act Coaching?'),
      q('pt_make', 'What will you make for members regularly (audio practices, written reflections, group calls, Q&A)?', true),
      q('pt_for', 'Who is it for, and what are they working through?', true),
      q('pt_tagline', 'What one line describes the page?'),
    ],
  },
  {
    id: 'pt_about', platform: 'patreon', title: 'About and intro video',
    why: 'Patreon suggests a short video in three parts: who you are, what you make and why, and a clear "join here". The About section says why you are launching, what members get, and why now.',
    questions: [
      q('pt_about_why', 'Why are you starting a Patreon, and how does it keep your sliding scale possible?', true),
      q('pt_about_get', 'What will members get, in plain words?', true),
      q('pt_about_now', 'Why now?'),
      q('pt_about_video', 'Could you record a 1 to 2 minute intro video ending with "join here"? What would you say?', true),
    ],
  },
  {
    id: 'pt_tiers', platform: 'patreon', title: 'Tiers',
    why: 'Patreon finds $5 a sweet spot and suggests starting with one tier. Pages with several tiers, including a higher one, earn up to 17% more. Scale a benefit by how often it comes rather than inventing new ones. Annual plans earn about 10% more.',
    questions: [
      q('pt_tier_core', 'What is the one benefit you could deliver every month without burning out?', true),
      q('pt_tier_count', 'Start with one $5 tier, or with three (for example $5, $15, $40)?'),
      q('pt_tier_high', 'What could a higher tier add (a monthly group call, priority booking, a discounted 1:1 session)?', true),
      q('pt_tier_forward', 'Could one tier be "pay it forward": it funds someone else\'s sliding-scale session?'),
      q('pt_tier_names', 'What tier names sound like you? (For example: Spotter, Net Holder, Ringmaster.)'),
    ],
  },
  {
    id: 'pt_free', platform: 'patreon', title: 'Free tier and welcome note',
    why: '80% of paying members who cancel choose to stay as free members, and free tiers grew communities about 3 times without fewer paid joins. Every new member gets your welcome note.',
    questions: [
      q('pt_free_get', 'What will free members get (public posts, a monthly reflection)?'),
      q('pt_welcome', 'What should a new member read or do first? Write the welcome note.', true),
      q('pt_welcome_video', 'Would you record a short thank-you video for the welcome note?'),
    ],
  },
  {
    id: 'pt_cadence', platform: 'patreon', title: 'Posting rhythm',
    why: 'Show up weekly, even with one post. Have 2 to 3 weeks of posts ready before launch, and schedule each week\'s posts on one set day.',
    questions: [
      q('pt_cadence_week', 'What can you realistically post each week?'),
      q('pt_cadence_day', 'Which day will you schedule posts?'),
      q('pt_cadence_first', 'What are your first 3 posts, ready before launch?', true),
    ],
  },
  {
    id: 'pt_goals', platform: 'patreon', title: 'Goal',
    why: 'A visible goal tells supporters what their membership unlocks. Tie it to something concrete.',
    questions: [
      q('pt_goal_amount', 'What monthly amount would cover your sliding-scale gap?'),
      q('pt_goal_unlocks', 'What does reaching it unlock (for example, a number of free sessions a month for people who cannot pay)?', true),
      q('pt_goal_count', 'Count the goal in members or in dollars?'),
    ],
  },
  {
    id: 'pt_launch', platform: 'patreon', title: 'Launch plan',
    why: 'People can need 5 to 10 mentions before they join, so repeat the link. A launch event and a time-limited offer (a first-month discount, founding-member perks) give a reason to join now.',
    questions: [
      q('pt_launch_first', 'Who are your first 10 to 20 likely members (past clients, workshop people, your email list)?', true),
      q('pt_launch_offer', 'Would you offer founding-member perks or a first-month discount?'),
      q('pt_launch_event', 'What launch event could you host (a free live session for members)?'),
      q('pt_launch_share', 'Where, and how often, will you share the link in the first 2 weeks?'),
    ],
  },
  {
    id: 'pt_retention', platform: 'patreon', title: 'Keeping members',
    why: 'Annual members stay at twice the rate of monthly ones. A monthly "what\'s coming" post and regular community touchpoints build anticipation, and the free tier catches people who cancel.',
    questions: [
      q('pt_ret_annual', 'Will you offer an annual plan, and at what discount?'),
      q('pt_ret_ritual', 'What monthly ritual will you keep (a preview post, a group call)?'),
      q('pt_ret_checkin', 'How will you check in with members who go quiet or cancel?'),
    ],
  },
]

export const INTAKE_SOURCES = [
  'https://www.gofundme.com/c/fundraising-tips',
  'https://www.gofundme.com/c/blog/campaign-story',
  'https://support.gofundme.com/hc/en-us/articles/23373616730011-Tips-for-receiving-your-first-donations',
  'https://support.gofundme.com/hc/en-us/articles/13163352843931-Four-key-actions-for-your-GoFundMe-fundraiser',
  'https://www.gofundme.com/c/fundraising-tips/update',
  'https://support.patreon.com/hc/en-us/articles/203913559-How-to-set-up-paid-tiers-and-benefits',
  'https://creatorhub.patreon.com/articles/how-to-structure-your-membership-and-price-your-benefits',
  'https://support.patreon.com/hc/en-us/articles/115002958403-Launch-Checklist-Everything-You-Need-to-Know-Before-You-Hit-Publish',
  'https://support.patreon.com/hc/en-us/articles/16433886029325-How-free-memberships-can-help-grow-your-community',
  'https://support.patreon.com/hc/en-us/articles/360041721372-Annual-memberships-creator-overview',
] as const

export function stepsFor(platform: IntakePlatform): IntakeStep[] {
  return INTAKE_STEPS.filter((s) => s.platform === platform)
}

export function getStep(id: string): IntakeStep | null {
  return INTAKE_STEPS.find((s) => s.id === id) ?? null
}

const QUESTION_KEYS = new Set(INTAKE_STEPS.flatMap((s) => s.questions.map((x) => x.key)))

// ── STUCK? ──────────────────────────────────────────────────────────────────

export type StuckChoice = 'wave' | 'r321' | 'book'

export const STUCK_CHOICES: ReadonlyArray<{ key: StuckChoice; label: string; blurb: string }> = [
  { key: 'wave', label: 'WAVE', blurb: 'Wake Up, Clean Up, Grow Up, Show Up: four short prompts to find the next move.' },
  { key: 'r321', label: '3-2-1', blurb: 'Face it, talk to it, be it: meet whatever is in the way.' },
  { key: 'book', label: 'Book time with Wendell', blurb: 'Work through this step together.' },
]

/** The prompts each practice shows. Short on purpose: this is a nudge, not a session. */
export const STUCK_PROMPTS: Record<Exclude<StuckChoice, 'book'>, ReadonlyArray<{ key: string; label: string }>> = {
  wave: [
    { key: 'wake', label: 'Wake Up: what is actually happening when you sit down to this step?' },
    { key: 'clean', label: 'Clean Up: what feeling comes up, and what is it protecting?' },
    { key: 'grow', label: 'Grow Up: how would the steadiest version of you see this step?' },
    { key: 'show', label: 'Show Up: what is the smallest next move you could make in ten minutes?' },
  ],
  r321: [
    { key: 'face', label: 'Face it (3rd person): there is something in the way. When I look at it, I see…' },
    { key: 'talk', label: 'Talk to it (2nd person): what do you want? What are you afraid would happen?' },
    { key: 'be', label: 'Be it (1st person): I am the part that stops this step, and I want you to know…' },
  ],
}

/** Where "Book time with Wendell" goes. His pay-what-feels-right Calendly. */
export const BOOK_WENDELL_URL = 'https://calendly.com/wendell-britt/pay-what-feels-right'

export interface StuckEvent {
  id: string
  stepId: string
  choice: StuckChoice
  at: string
  /** What she wrote, only when she chose to send it to Wendell. */
  shared?: string
}

export interface HostedIntake {
  answers: Record<string, string>
  stuck: StuckEvent[]
}

const MAX_ANSWER = 4000
const MAX_STUCK = 200

export function emptyIntake(): HostedIntake {
  return { answers: {}, stuck: [] }
}

/** Keep only known question keys, as trimmed, capped strings. */
export function cleanAnswers(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!QUESTION_KEYS.has(k) || typeof v !== 'string') continue
    out[k] = v.replace(/\r\n/g, '\n').trim().slice(0, MAX_ANSWER)
  }
  return out
}

function isChoice(v: unknown): v is StuckChoice {
  return v === 'wave' || v === 'r321' || v === 'book'
}

export function parseIntake(raw: unknown): HostedIntake {
  if (!raw || typeof raw !== 'object') return emptyIntake()
  const r = raw as Record<string, unknown>
  const stuck: StuckEvent[] = []
  if (Array.isArray(r.stuck)) {
    for (const e of r.stuck) {
      if (!e || typeof e !== 'object') continue
      const x = e as Record<string, unknown>
      if (typeof x.id !== 'string' || typeof x.stepId !== 'string' || !isChoice(x.choice) || typeof x.at !== 'string') continue
      stuck.push({ id: x.id, stepId: x.stepId, choice: x.choice, at: x.at, ...(typeof x.shared === 'string' ? { shared: x.shared } : {}) })
    }
  }
  return { answers: cleanAnswers(r.answers), stuck: stuck.slice(-MAX_STUCK) }
}

export function appendStuck(intake: HostedIntake, event: StuckEvent): HostedIntake {
  return { ...intake, stuck: [...intake.stuck, event].slice(-MAX_STUCK) }
}

/** How many of a step's questions have an answer. */
export function stepProgress(step: IntakeStep, answers: Record<string, string>): { done: number; total: number } {
  return { done: step.questions.filter((x) => answers[x.key]?.trim()).length, total: step.questions.length }
}

// ── drafts ──────────────────────────────────────────────────────────────────

/**
 * A copy-ready draft for one platform, built only from her answers and her
 * campaign fields: section headings in the order the platform's form asks for
 * them, with a gold-prompt line wherever an answer is missing. No model writes
 * it, so it works with or without AI.
 */
export function buildDraft(
  platform: IntakePlatform,
  answers: Record<string, string>,
  fields: HostedCampaignFields,
): { heading: string; body: string }[] {
  const a = (k: string) => answers[k]?.trim() ?? ''
  const or = (k: string, missing: string) => a(k) || `[${missing}]`
  const join = (...parts: string[]) => parts.filter(Boolean).join('\n\n')
  const name = fields.name || 'Annastasia'

  if (platform === 'gofundme') {
    return [
      { heading: 'Title', body: or('gf_title_draft', 'Your title: Help + name + the challenge') },
      { heading: 'Goal', body: join(or('gf_goal_amount', 'Goal amount'), a('gf_goal_stretch') && `Next goal once reached: ${a('gf_goal_stretch')}`, a('gf_goal_date') && `Needed by: ${a('gf_goal_date')}`) },
      { heading: 'Category and location', body: join(or('gf_category', 'Category'), or('gf_location', 'City and state')) },
      {
        heading: 'Story',
        body: join(
          or('gf_story_who', `Who ${name} is and how she came to coaching`) ,
          a('gf_story_what') || fields.story,
          or('gf_story_change', 'What changes if this succeeds'),
          a('gf_story_now'),
          a('gf_goal_breakdown') ? `Where the money goes:\n${a('gf_goal_breakdown')}` : or('gf_story_spend', 'How the money will be spent'),
          a('gf_beneficiary') && `Who this supports: ${a('gf_beneficiary')}`,
          'Gifts here are personal support and are not tax-deductible.',
        ),
      },
      { heading: 'Cover photo and video', body: join(or('gf_media_photo', 'Lead photo'), a('gf_media_video') && `Video script:\n${a('gf_media_video')}`, a('gf_media_more') && `More photos: ${a('gf_media_more')}`) },
      { heading: 'Funds go to', body: or('gf_payee', 'Who receives the funds') },
      {
        heading: 'Launch checklist (not on the page)',
        body: join(
          `First, personally: ${or('gf_launch_first', '5 to 10 people')}`,
          a('gf_launch_coorg') && `Co-organizer: ${a('gf_launch_coorg')}`,
          `Share on: ${or('gf_launch_channels', 'channels')}`,
          `Launch: ${or('gf_launch_day', 'launch day and second wave')}`,
          'Aim: shared 6 to 10 times in the first 3 days.',
          a('gf_updates_milestones') && `Updates at: ${a('gf_updates_milestones')}`,
          a('gf_updates_progress') && `First update idea: ${a('gf_updates_progress')}`,
          a('gf_thanks_how') && `Thank-yous: ${a('gf_thanks_how')}`,
          a('gf_thanks_gesture'),
          a('gf_thanks_report') && `Final report: ${a('gf_thanks_report')}`,
        ),
      },
    ]
  }

  return [
    { heading: 'Page name and tagline', body: join(a('pt_name') || fields.practice || name, a('pt_tagline') || fields.tagline) },
    {
      heading: 'About',
      body: join(
        a('pt_for') || fields.hook,
        or('pt_about_why', 'Why you are starting a Patreon'),
        a('pt_about_get') ? `What members get: ${a('pt_about_get')}` : or('pt_make', 'What you make for members'),
        a('pt_about_now'),
      ),
    },
    { heading: 'Intro video script', body: or('pt_about_video', 'Who you are, what you make and why, then "join here"') },
    {
      heading: 'Tiers',
      body: join(
        `Free: ${or('pt_free_get', 'what free members get')}`,
        `Core: ${or('pt_tier_core', 'the one monthly benefit')} (${a('pt_tier_count') || 'start at $5'})`,
        a('pt_tier_high') && `Higher: ${a('pt_tier_high')}`,
        a('pt_tier_forward') && `Pay it forward: ${a('pt_tier_forward')}`,
        a('pt_tier_names') && `Names: ${a('pt_tier_names')}`,
        a('pt_ret_annual') && `Annual plan: ${a('pt_ret_annual')}`,
      ),
    },
    { heading: 'Welcome note', body: join(or('pt_welcome', 'Your welcome note'), a('pt_welcome_video') && `Video: ${a('pt_welcome_video')}`) },
    { heading: 'Goal', body: join(or('pt_goal_amount', 'Monthly goal'), a('pt_goal_unlocks') && `Unlocks: ${a('pt_goal_unlocks')}`, a('pt_goal_count') && `Counted in: ${a('pt_goal_count')}`) },
    {
      heading: 'Launch checklist (not on the page)',
      body: join(
        `Posts each week: ${or('pt_cadence_week', 'what you post')}, scheduled on ${or('pt_cadence_day', 'a set day')}`,
        `Ready before launch: ${or('pt_cadence_first', 'first 3 posts')}`,
        `First members: ${or('pt_launch_first', '10 to 20 people')}`,
        a('pt_launch_offer') && `Offer: ${a('pt_launch_offer')}`,
        a('pt_launch_event') && `Launch event: ${a('pt_launch_event')}`,
        `Sharing: ${or('pt_launch_share', 'where and how often')} (people often need 5 to 10 mentions)`,
        a('pt_ret_ritual') && `Monthly ritual: ${a('pt_ret_ritual')}`,
        a('pt_ret_checkin') && `Check-ins: ${a('pt_ret_checkin')}`,
      ),
    },
  ]
}
