import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { MoveGenerator } from '@/components/bars/MoveGenerator'
import type { MoveCard } from '@/components/bars/MoveGenerator'

export default async function MoveGeneratorPage(props: {
  searchParams: Promise<{ campaign?: string; domain?: string }>
}) {
  const [player, searchParams] = await Promise.all([
    getCurrentPlayer(),
    props.searchParams,
  ])
  if (!player) redirect('/login')

  const campaign = searchParams.campaign ?? ''
  const domain   = searchParams.domain ?? ''

  const handSlots = await db.handSlot.findMany({
    where: { playerId: player.id, barId: { not: null } },
    orderBy: { slotIndex: 'asc' },
    include: {
      bar: {
        select: { id: true, title: true, nation: true, moveType: true, description: true },
      },
    },
  })

  const FEELINGS: Record<string, string> = {
    fire: 'Anger', water: 'Sadness', metal: 'Fear',
    earth: 'Apathy', wood: 'Restlessness',
  }

  // Family lookup from known move titles
  const TITLE_TO_FAMILY: Record<string, string> = {
    'Cut the deal that drains you':'Clean Break','Reach out to the ally you miss':'Reconnect','Line up one anchor client':'Anchor',"Claim a resource you've ignored":'Untapped Asset','Build the offer you keep avoiding':'The Offer',
    "Say the thing you've bitten back":'Provocation','Tell the story only you can tell':'Story Seed',"Map the idea so it can't be misread":'Framework','Surface the pattern you stopped noticing':'Insight','Start the conversation you keep postponing':'Opening',
    'Take the first irreversible step':'Threshold','Finish the piece you abandoned':'Breakthrough','Make the plan that ends the dread':'The Plan','Commit out loud to one thing':'Commitment','Ship the smallest real version':'First Step',
    "Set the boundary that's overdue":'Boundary','Repair the agreement that frayed':'Repair','Build the system that holds it':'The System','Name the role no one owns':'The Role','Design the ritual that keeps rhythm':'Ritual',
    'Make one rough thing and show it':'Rough Cut','Begin before you feel ready':'Threshold','Do the smallest rep today':'First Rep','Claim your place out loud':'The Claim','Let one person feel its impact':'One True Fan','Receive one thing without earning it':'Receiving',
  }

  const cards: MoveCard[] = handSlots
    .filter(s => s.bar)
    .map(s => {
      const bar = s.bar!
      const el = bar.nation ?? null
      return {
        id: bar.id,
        title: bar.title,
        el,
        faceKey: bar.moveType ?? null,
        family: TITLE_TO_FAMILY[bar.title] ?? '',
        chargeLabel: el ? (FEELINGS[el] ?? el.charAt(0).toUpperCase() + el.slice(1)) : 'Charge',
      }
    })

  if (cards.length === 0) redirect('/')

  return <MoveGenerator cards={cards} campaign={campaign} domain={domain} />
}
