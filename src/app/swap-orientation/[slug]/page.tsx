import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import {
  buildClothingSwapEndingCtas,
  buildClothingSwapEventInviteStory,
} from '@/lib/clothing-swap-event-invite-story'
import { db } from '@/lib/db'
import { parseSwapEventIntakeJson } from '@/lib/swap-event-intake'
import { swapOrientationInitialPassageId } from '@/lib/swap-orientation-branch'
import { EventInviteStoryReader } from '@/components/event-invite/EventInviteStoryReader'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const inst = await db.instance.findUnique({
    where: { slug },
    select: { name: true, swapEventIntake: true },
  })
  if (!inst?.swapEventIntake) {
    return { title: 'Swap orientation' }
  }
  return {
    title: `${inst.name} · Clothing swap orientation · BARS`,
    description: 'Short orientation for the clothing swap fundraiser sub-campaign.',
  }
}

export default async function SwapOrientationPage({ params }: Props) {
  const { slug } = await params

  const inst = await db.instance.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      swapEventIntake: true,
      stripeOneTimeUrl: true,
      patreonUrl: true,
      venmoUrl: true,
      paypalUrl: true,
      cashappUrl: true,
    },
  })

  if (!inst?.swapEventIntake) {
    notFound()
  }

  const parsed = parseSwapEventIntakeJson(inst.swapEventIntake)
  const intake = parsed.ok ? parsed.data : {}

  const story = buildClothingSwapEventInviteStory(inst.name, intake, {
    slug: inst.slug,
    stripeOneTimeUrl: inst.stripeOneTimeUrl,
    patreonUrl: inst.patreonUrl,
    venmoUrl: inst.venmoUrl,
    paypalUrl: inst.paypalUrl,
    cashappUrl: inst.cashappUrl,
  })

  const player = await getCurrentPlayer()
  const initialPassageId = swapOrientationInitialPassageId(
    player ? { inviteId: player.inviteId, onboardingComplete: player.onboardingComplete } : null
  )

  const endingCtas = buildClothingSwapEndingCtas(intake, {
    slug: inst.slug,
    stripeOneTimeUrl: inst.stripeOneTimeUrl,
    patreonUrl: inst.patreonUrl,
    venmoUrl: inst.venmoUrl,
    paypalUrl: inst.paypalUrl,
    cashappUrl: inst.cashappUrl,
  })

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 flex flex-col items-center">
      <div className="w-full max-w-xl mb-8">
        <Link href="/event" className="text-xs text-zinc-600 hover:text-zinc-400 transition">
          ← Campaign / events
        </Link>
      </div>
      <div className="w-full max-w-xl">
        <EventInviteStoryReader
          barTitle={`${inst.name} · clothing swap`}
          barDescription="Orientation before RSVP and the live swap. Returning players get a short path."
          story={story}
          initialPassageId={initialPassageId}
          footerNote="No full game account required to read this page or use light RSVP."
          endingCtas={endingCtas}
        />
      </div>
    </div>
  )
}
