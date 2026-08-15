import type { OfferKey } from '@/lib/launch/offers'

export type LaunchFunnelStageKey =
  | 'chapter_one_lead'
  | 'book_purchase'
  | 'deck_upsell'
  | 'dojo_offer'
  | 'one_to_one_offer'
  | 'bars_engine_practice'

export type LaunchFunnelAssetKind = 'route' | 'offer' | 'emailTemplate' | 'manual'

export type LaunchFunnelAsset = {
  kind: LaunchFunnelAssetKind
  label: string
  href?: string
  offerKey?: OfferKey
  path?: string
}

export type LaunchFunnelStage = {
  key: LaunchFunnelStageKey
  title: string
  promise: string
  primaryCta: {
    label: string
    href: string
    offerKey?: OfferKey
  }
  requiredAssets: LaunchFunnelAsset[]
  sourceNotes: string[]
}

export type LaunchFunnelSourceNote = {
  path: string
  hash: string
}

export type LaunchFunnelManifest = {
  slug: 'mastering-allyship-launch'
  title: string
  sourceNotes: LaunchFunnelSourceNote[]
  stages: LaunchFunnelStage[]
}

export const MASTERING_ALLYSHIP_SOURCE_NOTES = {
  projectHub:
    'The Library/04 Quests/Campaigns and Projects/Mastering the Game of Allyship Book Launch/Mastering the Game of Allyship Book Launch.md',
  funnelStrategy:
    'The Library/04 Quests/Campaigns and Projects/Mastering the Game of Allyship Book Launch/Launch Funnel and Asset Strategy.md',
  dojoSpec:
    'The Library/04 Quests/Campaigns and Projects/Mastering the Game of Allyship Book Launch/Allyship Dojo/Allyship Dojo Specification v0.1.md',
} as const

const ALL_SOURCE_NOTES = Object.values(MASTERING_ALLYSHIP_SOURCE_NOTES)

export const MASTERING_ALLYSHIP_FUNNEL: LaunchFunnelManifest = {
  slug: 'mastering-allyship-launch',
  title: 'Mastering the Game of Allyship Launch Funnel',
  sourceNotes: [
    {
      path: MASTERING_ALLYSHIP_SOURCE_NOTES.projectHub,
      hash: '6ff4483e6f2c5f6b2e2048e87cacae4d917128d60cca02d546c8cfeb615d8caf',
    },
    {
      path: MASTERING_ALLYSHIP_SOURCE_NOTES.funnelStrategy,
      hash: '584475eed7cd2ab11256d2452d59deb893fb5aad4daa94506ab8a300bf5e22a8',
    },
    {
      path: MASTERING_ALLYSHIP_SOURCE_NOTES.dojoSpec,
      hash: '98e9c5c7357191397bd9b31845ed9c1a88b7b21590b2659a5bee9c2621e30065',
    },
  ],
  stages: [
    {
      key: 'chapter_one_lead',
      title: 'Free Chapter 1',
      promise:
        'Start the book for free and discover why allyship is a learnable practice, not a fixed identity.',
      primaryCta: {
        label: 'Send me Chapter 1',
        href: '/mastering-allyship/chapter-1',
      },
      requiredAssets: [
        { kind: 'route', label: 'Chapter 1 opt-in page', href: '/mastering-allyship/chapter-1' },
        {
          kind: 'emailTemplate',
          label: 'Chapter One delivery email',
          path: 'src/lib/email/templates/ChapterOneEmail.tsx',
        },
      ],
      sourceNotes: ALL_SOURCE_NOTES,
    },
    {
      key: 'book_purchase',
      title: 'Book Purchase',
      promise:
        'Buy the full book to get the map for practicing allyship as a game of real-world moves.',
      primaryCta: {
        label: 'Buy the book',
        href: '/launch',
        offerKey: 'book-digital',
      },
      requiredAssets: [
        { kind: 'route', label: 'Launch offer page', href: '/launch' },
        { kind: 'offer', label: 'Digital book offer', offerKey: 'book-digital' },
      ],
      sourceNotes: ALL_SOURCE_NOTES,
    },
    {
      key: 'deck_upsell',
      title: '$22 Allyship Deck Upsell',
      promise:
        'Add the Allyship Deck so the book turns into one concrete move you can practice today.',
      primaryCta: {
        label: 'Add the Allyship Deck',
        href: '/deck/sales',
        offerKey: 'deck-digital',
      },
      requiredAssets: [
        { kind: 'route', label: 'Deck sales page', href: '/deck/sales' },
        { kind: 'offer', label: '$22 digital deck offer', offerKey: 'deck-digital' },
      ],
      sourceNotes: ALL_SOURCE_NOTES,
    },
    {
      key: 'dojo_offer',
      title: 'Allyship Dojo',
      promise:
        'Join a weekly practice community where each session gives you one move to try in a real relationship.',
      primaryCta: {
        label: 'Join the Dojo',
        href: '/mastering-allyship/dojo',
      },
      requiredAssets: [
        { kind: 'route', label: 'Dojo offer page', href: '/mastering-allyship/dojo' },
        { kind: 'route', label: 'Dojo home API', href: '/api/dojo/home' },
      ],
      sourceNotes: ALL_SOURCE_NOTES,
    },
    {
      key: 'one_to_one_offer',
      title: '1:1 Work With Wendell',
      promise:
        'Work directly with Wendell to turn a real conversation, project, or relationship into a practice plan.',
      primaryCta: {
        label: 'Explore 1:1 work',
        href: '/mastering-allyship/one-to-one',
      },
      requiredAssets: [
        { kind: 'route', label: '1:1 work offer page', href: '/mastering-allyship/one-to-one' },
      ],
      sourceNotes: ALL_SOURCE_NOTES,
    },
    {
      key: 'bars_engine_practice',
      title: 'BARs Engine Practice',
      promise:
        'Capture real-world action as BARs so practice continues after the book, deck, Dojo, or 1:1 session.',
      primaryCta: {
        label: 'Practice in BARs Engine',
        href: '/vault',
      },
      requiredAssets: [
        { kind: 'route', label: 'Vault practice surface', href: '/vault' },
        { kind: 'manual', label: 'BAR capture prompts from Dojo sessions' },
      ],
      sourceNotes: ALL_SOURCE_NOTES,
    },
  ],
}

export function stageForKey(key: LaunchFunnelStageKey): LaunchFunnelStage {
  const stage = MASTERING_ALLYSHIP_FUNNEL.stages.find((candidate) => candidate.key === key)
  if (!stage) throw new Error(`Unknown launch funnel stage: ${key}`)
  return stage
}
