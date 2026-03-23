/**
 * Admin Campaign Deck CYOA — deterministic intake → deck card specs.
 * Same `DeckIntakeV1` always materializes the same 8 starter cards (hexagrams 1–8).
 * @see .specify/specs/world-map-campaign-deck-portals/
 */

import { ALLYSHIP_DOMAINS } from '@/lib/campaign-subcampaigns'

export const DECK_INTAKE_VERSION = 1 as const

/** Primary campaign thrust (allyship domain–aligned). */
export type CampaignIntent =
  | 'GATHERING_RESOURCES'
  | 'RAISE_AWARENESS'
  | 'DIRECT_ACTION'
  | 'SKILLFUL_ORGANIZING'
  | 'MIXED'

export type UrgencyTone = 'soft' | 'sharp' | 'ceremonial'

/** Must match clamp in `@/lib/campaign-deck-quests` (OWNER_GOAL_LINE_MAX_LEN). */
const OWNER_GOAL_LINE_MAX_LEN = 280

export interface DeckIntakeV1 {
  v: typeof DECK_INTAKE_VERSION
  campaignIntent: CampaignIntent
  urgencyTone: UrgencyTone
  /** When true, hexagram 8 card is tagged for donation / show-up resource path (Gather Resources). */
  includeDonationSpoke: boolean
  /** Optional line woven into every “Raise the urgency” quest body (campaign owner voice). */
  ownerGoalLine?: string
  /** ISO timestamp when intake was committed (set server-side on apply). */
  appliedAt?: string
}

/** One row → one `CampaignDeckCard` upsert (hexagram 1–8 starter pool). */
export interface DeckCardMaterialSpec {
  hexagramId: number
  theme: string
  domain: string | null
}

const DOMAIN_CYCLE = [...ALLYSHIP_DOMAINS]

/** Short portal titles aligned with seed script `campaign-portal` flavor (hexagrams 1–8). */
const HEX_TITLE: Record<number, string> = {
  1: 'The Creative — beginnings',
  2: 'The Receptive — ground',
  3: 'Difficulty at the Beginning',
  4: 'Youthful Folly — learning',
  5: 'Waiting — right timing',
  6: 'Conflict — clarity',
  7: 'The Army — collective strength',
  8: 'Holding Together — alliance',
}

function toneSuffix(tone: UrgencyTone): string {
  switch (tone) {
    case 'soft':
      return ' · gentle urgency'
    case 'sharp':
      return ' · clear urgency'
    case 'ceremonial':
      return ' · ritual pace'
  }
}

function domainForSlot(intent: CampaignIntent, slotIndex: number): string | null {
  if (intent === 'MIXED') {
    return DOMAIN_CYCLE[slotIndex % DOMAIN_CYCLE.length] ?? null
  }
  return intent
}

/**
 * Materialize 8 deck cards (hexagrams 1–8) from a completed intake.
 * Deterministic: no randomness.
 */
export function materializeDeckFromIntake(intake: DeckIntakeV1): DeckCardMaterialSpec[] {
  const out: DeckCardMaterialSpec[] = []
  const suffix = toneSuffix(intake.urgencyTone)

  for (let h = 1; h <= 8; h++) {
    const slotIndex = h - 1
    let theme = `${HEX_TITLE[h] ?? `Hexagram ${h}`}${suffix}`
    let domain = domainForSlot(intake.campaignIntent, slotIndex)

    if (intake.includeDonationSpoke && h === 8) {
      theme = `Show up — gather resources & donations (${HEX_TITLE[8]})${suffix}`
      domain = 'GATHERING_RESOURCES'
    }

    out.push({ hexagramId: h, theme, domain })
  }

  return out
}

export function serializeDeckIntake(intake: DeckIntakeV1): string {
  return JSON.stringify(intake, null, 2)
}

export function parseDeckIntakeV1(raw: unknown): DeckIntakeV1 | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.v !== DECK_INTAKE_VERSION) return null
  const campaignIntent = o.campaignIntent as CampaignIntent
  const urgencyTone = o.urgencyTone as UrgencyTone
  const validIntent: CampaignIntent[] = [
    'GATHERING_RESOURCES',
    'RAISE_AWARENESS',
    'DIRECT_ACTION',
    'SKILLFUL_ORGANIZING',
    'MIXED',
  ]
  const validTone: UrgencyTone[] = ['soft', 'sharp', 'ceremonial']
  if (!validIntent.includes(campaignIntent)) return null
  if (!validTone.includes(urgencyTone)) return null
  if (typeof o.includeDonationSpoke !== 'boolean') return null
  let ownerGoalLine: string | undefined
  if (o.ownerGoalLine !== undefined && o.ownerGoalLine !== null) {
    if (typeof o.ownerGoalLine !== 'string') return null
    const t = o.ownerGoalLine.trim()
    if (t)
      ownerGoalLine =
        t.length > OWNER_GOAL_LINE_MAX_LEN ? t.slice(0, OWNER_GOAL_LINE_MAX_LEN) : t
  }
  return {
    v: DECK_INTAKE_VERSION,
    campaignIntent,
    urgencyTone,
    includeDonationSpoke: o.includeDonationSpoke,
    ownerGoalLine,
    appliedAt: typeof o.appliedAt === 'string' ? o.appliedAt : undefined,
  }
}

/** CYOA node ids for the admin wizard (finite graph). */
export type DeckWizardStepId =
  | 'welcome'
  | 'intent'
  | 'tone'
  | 'donation'
  | 'owner_goal'
  | 'review'
  | 'import'

export interface DeckWizardChoice {
  label: string
  /** Mutator run before transitioning to `next`. */
  patch: Partial<Pick<DeckIntakeV1, 'campaignIntent' | 'urgencyTone' | 'includeDonationSpoke'>>
  next: DeckWizardStepId
}

export interface DeckWizardNode {
  id: DeckWizardStepId
  title: string
  body: string
  choices: DeckWizardChoice[]
}

export const DECK_WIZARD_NODES: DeckWizardNode[] = [
  {
    id: 'welcome',
    title: 'The deck asks what you are building',
    body: `You are about to shape the **campaign deck** — the pool the world map draws from each period.

This is the same rhythm players know from CYOA: one beat at a time, choices that commit you to a direction. Nothing is random here; the same answers always produce the same eight starter cards (hexagrams 1–8).

When you finish, you will get **draft** cards you can activate, then run a **period draw** on the deck page.`,
    choices: [
      { label: 'Begin →', patch: {}, next: 'intent' },
      { label: 'Import JSON intake…', patch: {}, next: 'import' },
    ],
  },
  {
    id: 'intent',
    title: 'What is the campaign mainly asking of people?',
    body: 'Pick the allyship domain that best matches the owner’s intent. **Mixed** cycles domains across the eight portals so no single lane dominates.',
    choices: [
      {
        label: 'Gather resources — money, materials, volunteers',
        patch: { campaignIntent: 'GATHERING_RESOURCES' },
        next: 'tone',
      },
      {
        label: 'Raise awareness — stories, visibility, education',
        patch: { campaignIntent: 'RAISE_AWARENESS' },
        next: 'tone',
      },
      {
        label: 'Direct action — shows up in the world with risk',
        patch: { campaignIntent: 'DIRECT_ACTION' },
        next: 'tone',
      },
      {
        label: 'Skillful organizing — systems, roles, logistics',
        patch: { campaignIntent: 'SKILLFUL_ORGANIZING' },
        next: 'tone',
      },
      { label: 'Mixed — all four domains in rotation', patch: { campaignIntent: 'MIXED' }, next: 'tone' },
    ],
  },
  {
    id: 'tone',
    title: 'How should urgency feel?',
    body: 'This only adjusts the **theme** copy on each card — not mechanics. Choose the voice that fits the campaign owner.',
    choices: [
      { label: 'Soft — invitational, low heat', patch: { urgencyTone: 'soft' }, next: 'donation' },
      { label: 'Sharp — direct, mobilizing', patch: { urgencyTone: 'sharp' }, next: 'donation' },
      {
        label: 'Ceremonial — slow, witnessed, ritual',
        patch: { urgencyTone: 'ceremonial' },
        next: 'donation',
      },
    ],
  },
  {
    id: 'donation',
    title: 'A spoke for donations?',
    body: `For **gather resources** campaigns, you usually want at least one portal that can route to **donation / show up** paths (e.g. Bruised Banana).

If you say yes, hexagram **8** is reserved for that lane with domain **GATHERING_RESOURCES**.`,
    choices: [
      { label: 'Yes — include a donation / resource-mobilization spoke', patch: { includeDonationSpoke: true }, next: 'owner_goal' },
      { label: 'No — keep all eight cards generic to intent', patch: { includeDonationSpoke: false }, next: 'owner_goal' },
    ],
  },
  {
    id: 'owner_goal',
    title: 'What should every urgency quest remember?',
    body: `Optional: one sentence from the **campaign owner** — it will be appended to each of the eight “Raise the urgency” quests. Skip if you want template-only copy.

Max **${OWNER_GOAL_LINE_MAX_LEN}** characters.`,
    choices: [],
  },
  {
    id: 'review',
    title: 'You have chosen a shape',
    body: '', // filled client-side from draft intake
    choices: [{ label: '← Go back', patch: {}, next: 'intent' }],
  },
  {
    id: 'import',
    title: 'Paste DeckIntakeV1 JSON',
    body: `Paste a JSON object exported from a previous run (\`v\`, \`campaignIntent\`, \`urgencyTone\`, \`includeDonationSpoke\`, optional \`ownerGoalLine\`).`,
    choices: [{ label: '← Back', patch: {}, next: 'welcome' }],
  },
]

export function getWizardNode(id: DeckWizardStepId): DeckWizardNode | undefined {
  return DECK_WIZARD_NODES.find((n) => n.id === id)
}

export function defaultDraftIntake(): Pick<
  DeckIntakeV1,
  'campaignIntent' | 'urgencyTone' | 'includeDonationSpoke'
> {
  return {
    campaignIntent: 'GATHERING_RESOURCES',
    urgencyTone: 'soft',
    includeDonationSpoke: true,
  }
}

export function finalizeIntake(draft: {
  campaignIntent: CampaignIntent
  urgencyTone: UrgencyTone
  includeDonationSpoke: boolean
  ownerGoalLine?: string | null
}): DeckIntakeV1 {
  const raw = draft.ownerGoalLine?.trim()
  const ownerGoalLine =
    raw && raw.length > 0
      ? raw.length > OWNER_GOAL_LINE_MAX_LEN
        ? raw.slice(0, OWNER_GOAL_LINE_MAX_LEN)
        : raw
      : undefined
  return {
    v: DECK_INTAKE_VERSION,
    campaignIntent: draft.campaignIntent,
    urgencyTone: draft.urgencyTone,
    includeDonationSpoke: draft.includeDonationSpoke,
    ...(ownerGoalLine ? { ownerGoalLine } : {}),
  }
}
