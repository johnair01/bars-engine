import type { AllyshipDomain } from '@/lib/the-crossing-support-moves'

export type TheCrossingGateContent = {
  domain: AllyshipDomain
  blurb: string
}

export type TheCrossingPageContent = {
  chrome: {
    label: string
    awakenLink: string
  }
  hero: {
    parentLabel: string
    title: string
    subtitle: string
    body: string
    primaryCta: string
    secondaryCta: string
  }
  howToPlay: string[]
  paths: {
    title: string
    gates: TheCrossingGateContent[]
  }
  unsure: {
    body: string
    cta: string
    href: string
  }
  deck: {
    blurb: string
  }
  awaken: {
    body: string
    href: string
    cta: string
  }
  footer: string
}

export const THE_CROSSING_PAGE_DEFAULT_CONTENT: TheCrossingPageContent = {
  chrome: {
    label: 'The Crossing',
    awakenLink: 'Book-launch weekend →',
  },
  hero: {
    parentLabel: '◇ Part of the Allyship Launch · Barn Raising',
    title: 'The Crossing',
    subtitle: 'Wendell needs a reliable car to keep showing up.',
    body: 'Every kind of help moves this forward. Choose the path that fits what you can actually offer.',
    primaryCta: 'Choose Your Move →',
    secondaryCta: 'Read the full story',
  },
  howToPlay: [
    'Pick the path that fits your real capacity.',
    'Each path gives you one small, concrete move.',
    'Your move becomes a BAR the campaign can follow up on.',
  ],
  paths: {
    title: 'Choose a path',
    gates: [
      {
        domain: 'GATHERING_RESOURCES',
        blurb: 'Bring what the campaign needs into reach — cars, money, people.',
      },
      {
        domain: 'SKILLFUL_ORGANIZING',
        blurb: 'Use what you know to make a good decision happen faster.',
      },
      {
        domain: 'RAISE_AWARENESS',
        blurb: 'Extend the ask past Wendell’s immediate reach.',
      },
      {
        domain: 'DIRECT_ACTION',
        blurb: 'Keep the person — and the momentum — in motion.',
      },
    ],
  },
  unsure: {
    body: 'Not sure this is your role?',
    cta: 'Take the Superpower Quiz →',
    href: '/superpower',
  },
  deck: {
    blurb:
      'Every path here is one move from the 120-move Allyship Deck. Get the whole deck and you carry a move for every moment — not just this campaign.',
  },
  awaken: {
    body:
      'Here for the book launch? The July 17–19 gatherings live on /awaken.',
    href: '/awaken',
    cta: '→',
  },
  footer:
    'An early BARS Engine experience in the wild: care becomes a role, a role becomes a move, and a move becomes evidence the campaign can follow up on.',
}

const DOMAIN_ORDER: AllyshipDomain[] = [
  'GATHERING_RESOURCES',
  'SKILLFUL_ORGANIZING',
  'RAISE_AWARENESS',
  'DIRECT_ACTION',
]

function textOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function listOrDefault(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback
  const items = value.filter((item): item is string => typeof item === 'string' && !!item.trim())
  return items.length ? items.map((item) => item.trim()) : fallback
}

export function normalizeTheCrossingPageContent(input: unknown): TheCrossingPageContent {
  const raw = (input && typeof input === 'object' ? input : {}) as Partial<TheCrossingPageContent>
  const defaults = THE_CROSSING_PAGE_DEFAULT_CONTENT

  return {
    chrome: {
      label: textOrDefault(raw.chrome?.label, defaults.chrome.label),
      awakenLink: textOrDefault(raw.chrome?.awakenLink, defaults.chrome.awakenLink),
    },
    hero: {
      parentLabel: textOrDefault(raw.hero?.parentLabel, defaults.hero.parentLabel),
      title: textOrDefault(raw.hero?.title, defaults.hero.title),
      subtitle: textOrDefault(raw.hero?.subtitle, defaults.hero.subtitle),
      body: textOrDefault(raw.hero?.body, defaults.hero.body),
      primaryCta: textOrDefault(raw.hero?.primaryCta, defaults.hero.primaryCta),
      secondaryCta: textOrDefault(raw.hero?.secondaryCta, defaults.hero.secondaryCta),
    },
    howToPlay: listOrDefault(raw.howToPlay, defaults.howToPlay),
    paths: {
      title: textOrDefault(raw.paths?.title, defaults.paths.title),
      gates: DOMAIN_ORDER.map((domain) => {
        const fallback = defaults.paths.gates.find((gate) => gate.domain === domain)!
        const gate = raw.paths?.gates?.find((item) => item?.domain === domain)
        return {
          domain,
          blurb: textOrDefault(gate?.blurb, fallback.blurb),
        }
      }),
    },
    unsure: {
      body: textOrDefault(raw.unsure?.body, defaults.unsure.body),
      cta: textOrDefault(raw.unsure?.cta, defaults.unsure.cta),
      href: textOrDefault(raw.unsure?.href, defaults.unsure.href),
    },
    deck: {
      blurb: textOrDefault(raw.deck?.blurb, defaults.deck.blurb),
    },
    awaken: {
      body: textOrDefault(raw.awaken?.body, defaults.awaken.body),
      href: textOrDefault(raw.awaken?.href, defaults.awaken.href),
      cta: textOrDefault(raw.awaken?.cta, defaults.awaken.cta),
    },
    footer: textOrDefault(raw.footer, defaults.footer),
  }
}

export function parseTheCrossingPageTheme(theme: string | null | undefined): TheCrossingPageContent {
  try {
    const parsed = theme ? (JSON.parse(theme) as { theCrossingPage?: unknown }) : {}
    return normalizeTheCrossingPageContent(parsed.theCrossingPage)
  } catch {
    return THE_CROSSING_PAGE_DEFAULT_CONTENT
  }
}
