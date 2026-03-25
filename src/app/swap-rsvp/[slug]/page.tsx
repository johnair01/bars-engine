import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { SwapRsvpForm } from './SwapRsvpForm'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const inst = await db.instance.findUnique({
    where: { slug },
    select: { name: true, swapEventIntake: true },
  })
  if (!inst?.swapEventIntake) {
    return { title: 'Swap RSVP' }
  }
  return {
    title: `${inst.name} · Light RSVP · BARS`,
    description: 'RSVP without full game onboarding (Partiful remains canonical when provided by hosts).',
  }
}

export default async function SwapRsvpPage({ params }: Props) {
  const { slug } = await params

  const inst = await db.instance.findUnique({
    where: { slug },
    select: { name: true, slug: true, swapEventIntake: true },
  })

  if (!inst?.swapEventIntake) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 flex flex-col items-center">
      <div className="w-full max-w-md mb-8 space-y-2">
        <Link href="/event" className="text-xs text-zinc-600 hover:text-zinc-400 transition block">
          ← Campaign / events
        </Link>
        <Link href={`/swap-orientation/${slug}`} className="text-xs text-zinc-600 hover:text-zinc-400 transition block">
          ← Orientation CYOA
        </Link>
      </div>
      <div className="w-full max-w-md space-y-6">
        <header className="text-center space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-amber-500/90">Clothing swap · light RSVP</p>
          <h1 className="text-2xl font-bold text-white">{inst.name}</h1>
          <p className="text-sm text-zinc-500">
            Skip full onboarding — we only store email (and optional notes) for organizers.
          </p>
        </header>
        <SwapRsvpForm slug={slug} instanceName={inst.name} />
      </div>
    </div>
  )
}
