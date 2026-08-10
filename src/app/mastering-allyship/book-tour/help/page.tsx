import type { Metadata } from 'next'
import Link from 'next/link'
import { BookTourHelpForm } from './BookTourHelpForm'
import { CAMPAIGN_UNLOCK } from '@/lib/campaigns/twenty-one-day'

/**
 * @page /mastering-allyship/book-tour/help
 * @entity CAMPAIGN
 * @description Book tour help intake, framed as Appendix B's 21-day campaigns rather
 *   than as a volunteer form. Same options and same routes; what changed is that the
 *   unlock is stated here, **before** anybody picks, and the confirmation names the
 *   campaign they entered along with its three weeks. An ask revealed after the fact
 *   is the defect this page was one step away from having.
 * @permissions public
 * @relationships BookTourHelpInterest, /campaigns, src/lib/campaigns/twenty-one-day.ts
 * @dimensions WHO:supporter, WHAT:campaign entry, WHERE:book-tour, ENERGY:offer
 * @example /mastering-allyship/book-tour/help
 * @agentDiscoverable true
 */

export const metadata: Metadata = {
  title: 'Help the book tour travel',
  description:
    'Pick one practical way to help Mastering the Game of Allyship travel, and enter the 21-day campaign that matches it.',
}

const qrSource =
  'https://api.qrserver.com/v1/create-qr-code/?size=320x320&format=svg&data=https%3A%2F%2Fbars-engine.vercel.app%2Fmastering-allyship%2Fbook-tour%2Fhelp'

export default function BookTourHelpPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.08fr] lg:items-start">
        <section className="space-y-6">
          <Link href="/launch" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Mastering Allyship
          </Link>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-400">
            Book Tour
          </p>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
            Help this conversation travel further than one person can carry it.
          </h1>
          <div className="space-y-4 text-base leading-8 text-zinc-300">
            <p>
              A tour stop needs a host, a producer, somebody who knows which community wants
              this, and somebody willing to say so out loud. You do not have to carry the
              whole tour. Pick one honest way you can help.
            </p>
            <p>
              Each option enters one of Appendix B&apos;s four twenty-one-day campaigns: one
              move a week, against one object, ending in a capture you post. The
              confirmation names the campaign you entered and gives you the three weeks.
            </p>
          </div>

          {/* The unlock is stated here, before the picking, rather than after it. */}
          <aside className="rounded-2xl border border-amber-600/40 bg-amber-950/20 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
              What running one unlocks
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-100/90">{CAMPAIGN_UNLOCK}</p>
            <Link
              href="/campaigns"
              className="mt-3 inline-block text-sm text-amber-200 underline underline-offset-4"
            >
              Read the four campaigns first →
            </Link>
          </aside>

          <aside className="flex max-w-sm items-center gap-4 rounded-2xl border border-zinc-800 bg-black/30 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSource}
              width="104"
              height="104"
              alt="QR code for the Book Tour help form"
              className="rounded-lg bg-white p-1"
            />
            <p className="text-sm leading-6 text-zinc-400">
              Present this QR code at an event so people can join from their phone.
            </p>
          </aside>
        </section>
        <BookTourHelpForm />
      </div>
    </main>
  )
}
