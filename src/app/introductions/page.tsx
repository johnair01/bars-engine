import type { Metadata } from 'next'
import Link from 'next/link'
import { IntroductionForm } from './IntroductionForm'
import { CORRIDOR, RECALL_PROMPTS } from '@/lib/tour-leads/corridor'

export const metadata: Metadata = {
  title: 'Name one place — the book tour',
  description:
    'The tour runs the I-5 corridor between Eugene and Bellingham. Name one shop, hall, org or show worth a stop. Somewhere rather than someone.',
}

const ANCHORS = CORRIDOR.filter((c) => c.tier === 'anchor')
const REACH = CORRIDOR.filter((c) => c.tier === 'reach')

/**
 * @page /introductions
 * @entity CAMPAIGN
 * @description The crowdsourced lead board — Appendix B's Gather Resources campaign,
 *   *The Introduction*, run as a real mechanic rather than described. Readers, backers
 *   and the email list each name one place along the I-5 corridor, and the pile becomes
 *   the Dream 100.
 *
 *   **It asks for a place, never a person's contact details.** A submitter cannot hand
 *   over somebody else's address here, because that person has not agreed to be handed
 *   over; `canIntroduce` records the warm path instead and leaves the introduction with
 *   the one person in the exchange who consented to be in it. Same rule /campaigns pins
 *   above its four doors: the capture is posted, the person is not.
 * @permissions public
 * @relationships TourIntroduction, /campaigns, /mastering-allyship/book-tour/help,
 *   src/lib/tour-leads/corridor.ts, Kit tag source:introductions
 * @dimensions WHO:supporter, WHAT:lead, WHERE:introductions, ENERGY:gather_resources
 * @example /introductions
 * @agentDiscoverable true
 */
export default function IntroductionsPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <section className="space-y-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-400">
            Gather Resources · The Introduction
          </p>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
            Name one place.
          </h1>

          <div className="space-y-4 text-base leading-8 text-zinc-300">
            <p>
              The tour runs the line between Eugene and Bellingham. I know a fraction of what
              is on it, and between you all you know most of the rest. One name from each of
              you builds a map I could not build alone, which is the entire argument of the
              chapter this campaign comes from.
            </p>
            <p>
              Naming a place is a Gather Resources rep. It costs you a minute and moves
              something I cannot move by working harder.
            </p>
          </div>

          {/* The rule, before the form rather than under it. */}
          <aside className="rounded-2xl border border-amber-600/40 bg-amber-950/20 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
              What this asks for, and what it will not
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-100/90">
              A place: a shop, a hall, an organization, a show. Not somebody&apos;s email
              address, and not their number. Nobody gets handed over by a third party here.
              If you know a person there, tick the box and the introduction stays yours to
              make.
            </p>
          </aside>

          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              The line
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              <span className="font-bold text-white">
                {ANCHORS.map((c) => c.name).join(' · ')}
              </span>{' '}
              are the anchors. {REACH.map((c) => c.name).join(', ')} are on the same road and
              worth a stop when a real invitation appears there.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold">If nothing comes to mind</h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              That is normal. &ldquo;Who do you know in Seattle&rdquo; returns a blank for
              almost everybody. These land better, because memory answers questions about
              events and goes silent on questions about categories. Read them until one
              catches.
            </p>
            <ul className="space-y-2">
              {RECALL_PROMPTS.map((prompt) => (
                <li key={prompt} className="flex gap-3 text-sm leading-relaxed text-zinc-400">
                  <span aria-hidden className="text-emerald-500/70">
                    ◆
                  </span>
                  {prompt}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm leading-relaxed text-zinc-500">
            Wanting to help run a stop rather than name one?{' '}
            <Link
              href="/mastering-allyship/book-tour/help"
              className="text-zinc-300 underline underline-offset-4"
            >
              That is the other door
            </Link>
            .
          </p>
        </section>

        <IntroductionForm />
      </div>
    </main>
  )
}
