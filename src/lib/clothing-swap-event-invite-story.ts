import type { EventInviteStory } from '@/lib/event-invite-story/schema'
import type { SwapEventIntakePayload } from '@/lib/swap-event-intake'

export const CSHE_EVENT_INVITE_BAR_ID = 'cshe-clothing-swap-invite-v1'

/** Passage ids — must match server branch in `swapOrientationInitialPassageId`. */
export const SWAP_ORIENT_PASSAGES = {
  intro: 'intro',
  newA: 'new_a',
  newB: 'new_b',
  newEnd: 'new_end',
  returningEnd: 'returning_end',
} as const

export type SwapInstanceUrls = {
  slug: string
  partifulUrl?: string
  stripeOneTimeUrl?: string | null
  patreonUrl?: string | null
  venmoUrl?: string | null
  paypalUrl?: string | null
  cashappUrl?: string | null
}

function pickDonateUrl(u: SwapInstanceUrls): string | null {
  const candidates = [
    u.stripeOneTimeUrl,
    u.patreonUrl,
    u.venmoUrl,
    u.paypalUrl,
    u.cashappUrl,
  ]
  for (const c of candidates) {
    if (c && String(c).trim()) return String(c).trim()
  }
  return null
}

/**
 * Public orientation CYOA for a clothing-swap sub-campaign instance.
 * Anonymous users start at `intro` and self-select; logged-in “returning” players
 * jump to `returning_end` (see `swapOrientationInitialPassageId`).
 */
export function buildClothingSwapEventInviteStory(
  instanceName: string,
  intake: SwapEventIntakePayload,
  urls: SwapInstanceUrls
): EventInviteStory {
  const title = (intake.narrativeTitle?.trim() || instanceName).trim()
  const partiful = intake.partifulUrl?.trim()
  const orientationPath = `/swap-orientation/${urls.slug}`
  const rsvpPath = `/swap-rsvp/${urls.slug}`

  const hybridBits: string[] = []
  if (intake.hybridIrl !== false) hybridBits.push('**in person**')
  if (intake.hybridVirtual !== false) hybridBits.push('**online**')
  const hybridLine =
    hybridBits.length > 0
      ? `This swap runs ${hybridBits.join(' and ')} — one shared gallery for everyone.`
      : 'This swap uses one shared gallery for everyone.'

  return {
    id: `cshe-orient-${urls.slug}`,
    start: SWAP_ORIENT_PASSAGES.intro,
    passages: [
      {
        id: SWAP_ORIENT_PASSAGES.intro,
        text:
          `## ${title}\n\n` +
          `${hybridLine}\n\n` +
          '**BARs** are short playable “moves” you can write or take. **Vibeulons** are in-app energy used for bidding and appreciations — you will see more once you join the full game.\n\n' +
          `**RSVP:** Partiful stays the source of truth when your host shared a link; you can also leave a **light RSVP** on BARS (${rsvpPath}) without full onboarding.\n\n` +
          'Pick the path that fits:',
        choices: [
          { label: 'I am new to BARS or want the longer intro', next: SWAP_ORIENT_PASSAGES.newA },
          { label: 'I have played before — short path', next: SWAP_ORIENT_PASSAGES.returningEnd },
        ],
      },
      {
        id: SWAP_ORIENT_PASSAGES.newA,
        text:
          '### Moves you might feel\n\n' +
          '- **Wake Up** — notice what you are bringing (clothes, nerves, curiosity).\n' +
          '- **Clean Up** — list items with a photo and honest copy; no judgment floor.\n' +
          '- **Grow Up** — learn the tools as you go.\n' +
          '- **Show Up** — bid, trade, donate, or cheer at event time.\n\n' +
          'You do not need mastery before you RSVP.',
        choices: [{ label: 'Continue', next: SWAP_ORIENT_PASSAGES.newB }],
      },
      {
        id: SWAP_ORIENT_PASSAGES.newB,
        text:
          '### Swap + fundraiser (high level)\n\n' +
          '- Listings are **BAR-backed** (photo + story + metadata).\n' +
          '- **One clock** closes bidding for the whole event.\n' +
          '- You can bid **vibeulons** or attach a **BAR offer**; the seller may **accept** a BAR offer before close — otherwise the **high vibeulon** wins.\n\n' +
          (partiful
            ? `**Partiful (RSVP / logistics):** ${partiful}\n\n`
            : 'Your host will share **Partiful** (or similar) for RSVP and logistics.\n\n') +
          `When you are ready, use **RSVP (light)** on BARS: \`${rsvpPath}\` — or sign in later if the host sends a **join game** invite.`,
        choices: [{ label: 'Finish', next: SWAP_ORIENT_PASSAGES.newEnd }],
      },
      {
        id: SWAP_ORIENT_PASSAGES.newEnd,
        text:
          '### You are oriented\n\n' +
          'Save this page. At event time, open the campaign from your host’s links or the hub.',
        ending: {
          role: 'Guest / new player',
          description:
            'RSVP on Partiful when you have it; optional light RSVP on BARS skips full onboarding. Hosts can invite you into the full game afterward.',
        },
      },
      {
        id: SWAP_ORIENT_PASSAGES.returningEnd,
        text:
          `### Welcome back\n\n` +
          `**${title}** — you know the drill: listings, gallery, bids, BAR offers, donate windows.\n\n` +
          (partiful ? `**Partiful:** ${partiful}\n\n` : '') +
          `**Light RSVP (no full onboarding):** \`${rsvpPath}\`\n\n` +
          `Replay the long intro any time: \`${orientationPath}\``,
        ending: {
          role: 'Returning player',
          description: 'Short path — jump to RSVP, donate, or campaign landing when the host shares links.',
        },
      },
    ],
  }
}

export type EventInviteCta = { href: string; label: string; className: string }

const CTA_PRIMARY = 'bg-amber-600/90 hover:bg-amber-500 text-white'
const CTA_SECONDARY = 'bg-purple-600 hover:bg-purple-500 text-white'
const CTA_OUTLINE = 'border border-zinc-600 hover:border-zinc-500 text-zinc-200'

/** Dynamic CTAs after story ending — Partiful + donate + hub + wiki. */
export function buildClothingSwapEndingCtas(
  intake: SwapEventIntakePayload,
  urls: SwapInstanceUrls
): EventInviteCta[] {
  const out: EventInviteCta[] = []
  const partiful = intake.partifulUrl?.trim()
  if (partiful) {
    out.push({
      href: partiful,
      label: 'RSVP / logistics (Partiful) →',
      className: CTA_PRIMARY,
    })
  }
  const donate = pickDonateUrl(urls)
  if (donate) {
    out.push({
      href: donate,
      label: 'Support / donate →',
      className: CTA_SECONDARY,
    })
  }
  out.push(
    {
      href: `/campaigns/landing/${urls.slug}`,
      label: 'Campaign landing →',
      className: CTA_OUTLINE,
    },
    {
      href: `/swap-rsvp/${urls.slug}`,
      label: 'Light RSVP (email) →',
      className: CTA_OUTLINE,
    },
    {
      href: `/swap/${urls.slug}/gallery`,
      label: 'Swap gallery (listings) →',
      className: CTA_OUTLINE,
    },
    { href: '/event', label: 'Campaign & events →', className: CTA_OUTLINE },
    {
      href: '/wiki/campaign/bruised-banana',
      label: 'Bruised Banana wiki →',
      className: CTA_OUTLINE,
    },
    { href: '/wiki', label: 'BARS wiki →', className: CTA_OUTLINE },
    { href: '/conclave', label: 'Join / sign in →', className: CTA_OUTLINE }
  )
  return out
}
