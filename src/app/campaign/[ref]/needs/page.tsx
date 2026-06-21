import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getCurrentPlayer } from '@/lib/auth'
import { listMilestoneNeedsForPlayer } from '@/actions/milestone-needs'
import { buildNeedView, SP_ABBR, type NeedLike } from '@/lib/superpowers/card-view'
import { SUPERPOWERS, SUPERPOWER_DEFS, type Superpower } from '@/lib/superpowers/types'
import { MilestoneNeeds, type MNItem, type MNBar } from '@/components/superpowers/MilestoneNeeds'
import type { MoveCard } from '@/lib/allyship-deck/types'

/**
 * @page /campaign/[ref]/needs
 * @entity SYSTEM
 * @description Tiered superpower-matched milestone needs (Mobility Quest). Browse
 *   open; sign in to claim. `?lens=<superpower>` previews a given lens.
 * @permissions public (browse); claim/complete require sign-in
 */
type Props = { params: Promise<{ ref: string }>; searchParams: Promise<{ lens?: string }> }

async function loadDeck(): Promise<Map<string, MoveCard>> {
  const raw = await readFile(path.join(process.cwd(), 'public/allyship-deck/allyship-deck.json'), 'utf8')
  const parsed = JSON.parse(raw) as MoveCard[] | { cards: MoveCard[] }
  const cards = Array.isArray(parsed) ? parsed : parsed.cards
  return new Map(cards.filter((c) => c.kind === 'move').map((c) => [c.id, c]))
}

export default async function CampaignNeedsPage({ params, searchParams }: Props) {
  const { ref } = await params
  const { lens: lensParam } = await searchParams
  const campaignRef = decodeURIComponent(ref).trim()

  const player = await getCurrentPlayer()
  const signedIn = !!player

  // Resolve lens: ?lens override → action resolves from membership otherwise.
  const lens: Superpower = SUPERPOWERS.includes(lensParam as Superpower) ? (lensParam as Superpower) : 'connector'

  const [deck, result] = await Promise.all([
    loadDeck(),
    listMilestoneNeedsForPlayer({ campaignRef, superpower: lens }),
  ])

  const lensLabel = SUPERPOWER_DEFS[lens].label
  const lensAbbr = SP_ABBR[lens]

  const blurb =
    'Gathering resources for an accessible vehicle — so the book tour can actually reach the people it’s for.'

  if (!result.ok) {
    return (
      <MilestoneNeeds
        campaignTitle="Mobility Quest"
        campaignBlurb={blurb}
        lensLabel={lensLabel}
        lensAbbr={lensAbbr}
        signedIn={signedIn}
        dataState="empty"
        matched={[]}
        open={[]}
        summary={{ external: [], internal: [] }}
      />
    )
  }

  const toItem = (need: NeedLike): MNItem | null => {
    const deckCard = deck.get(need.cardId)
    if (!deckCard) return null
    const view = buildNeedView(deckCard, need, { mine: !!player && need.claimedByPlayerId === player.id, signedIn })
    return { ...view, unit: need.unit, value: need.value }
  }

  const matched = result.tiered.filter((t) => t.tier === 'matched').map((t) => toItem(t.need)).filter((x): x is MNItem => x !== null)
  const open = result.tiered.filter((t) => t.tier === 'open').map((t) => toItem(t.need)).filter((x): x is MNItem => x !== null)
  const summary = result.summary as { external: MNBar[]; internal: MNBar[] }

  const dataState = matched.length === 0 && open.length === 0 ? 'empty' : 'populated'

  return (
    <MilestoneNeeds
      campaignTitle="Mobility Quest"
      campaignBlurb={blurb}
      lensLabel={lensLabel}
      lensAbbr={lensAbbr}
      signedIn={signedIn}
      dataState={dataState}
      matched={matched}
      open={open}
      summary={summary}
    />
  )
}
