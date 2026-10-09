import type { Metadata } from 'next'

import { STATIONS } from '@/lib/coaching/coaching-map'
import type { StationId } from '@/lib/coaching/coaching-map'

export const metadata: Metadata = {
  metadataBase: new URL('https://masteringallyship.com'),
  title: 'The five moves | Coaching with Wendell Britt',
  description: 'Wake Up, Open Up, Clean Up, Grow Up and Show Up: what each move means, and where it shows up on the walk.',
}

/**
 * What each move means, and what it is on the walk into the forest and in coaching
 * (Wendell on cf-paths, 2026-10-09: "Waking up to what their problems is, opening up to
 * the belief there is a solution for it (and that I have the solution) Cleaning up and
 * blockers that would stop them from moving forward- Growing up and Showing up ARE the
 * coaching itself"). The words are Claude's drafts from that steer (position
 * cf-moves-page); Wendell can rewrite any of them. Each move links to the site's own
 * Check for it.
 */
const MEANING: Record<StationId, { means: string; walk: string; check: string }> = {
  wake: {
    means:
      'Before anything changes, you see it. Wake Up is noticing what is here: where it sits in your body, what it is like, and what keeps happening.',
    walk: 'On the walk, this is finding where you feel it, or saying in your own words what you want help with.',
    check: '/wake-up',
  },
  open: {
    means:
      'Every feeling has a job. Open Up is letting the feeling tell you what it is pointing at, and opening to the idea that what you are stuck on can be worked.',
    walk: 'On the walk, this is the loudest feeling and its job, or the short tour of how I work.',
    check: '/open-up',
  },
  clean: {
    means:
      'Something stops you moving, usually a belief or a part of you with a reason of its own. Clean Up is facing what has charge on it until that energy is yours to use.',
    walk: 'On the walk, this is the belief that holds you back and the part of your life it lives in.',
    check: '/clean-up',
  },
  grow: {
    means:
      'Grow Up is turning what you found into a practice, at the level it needs: from what you feel in your body to the whole system you live in.',
    walk: 'On the walk, this is choosing the kind of help you need. In coaching, it is the work we do together.',
    check: '/grow-up',
  },
  show: {
    means: 'Show Up is making the move that has to be yours, out in your life.',
    walk: 'On the walk, this is sitting down with me. In coaching, it is everything after.',
    check: '/show-up',
  },
}

/**
 * @page /coaching/moves
 * @entity CAMPAIGN
 * @description The five moves explained, one section per move with an anchor (#wake, #open,
 *   #clean, #grow, #show). The move names above each screen of the /coaching walk link here
 *   (content/coaching-game/6FACE_PASS3_2026-10-09.md, position cf-moves-walk).
 * @permissions public
 * @relationships /coaching, /wake-up, /open-up, /clean-up, /grow-up, /show-up, src/lib/coaching/coaching-map.ts
 * @dimensions WHO:client, WHAT:offer, WHERE:coaching, ENERGY:wake_up
 * @example /coaching/moves#clean
 * @agentDiscoverable true
 */
export default function MovesPage() {
  return (
    <main className="min-h-screen bg-[#040a07] px-4 py-12 text-emerald-50 sm:px-6">
      <div className="mx-auto max-w-xl space-y-10">
        <header className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-200/70">
            Coaching with Wendell Britt
          </p>
          <h1 className="text-3xl font-semibold leading-snug">The five moves</h1>
          <p className="text-base leading-relaxed text-emerald-100/80">
            The walk into the forest follows five moves. Here is what each one means.
          </p>
        </header>

        {STATIONS.map((s) => {
          const m = MEANING[s.id]
          return (
            <section
              key={s.id}
              id={s.id}
              className="scroll-mt-20 space-y-3 rounded-2xl border border-emerald-200/15 bg-black/40 p-5 target:border-amber-200/60"
            >
              <h2 className="text-xl font-semibold text-amber-100">{s.move}</h2>
              <p className="text-base leading-relaxed text-emerald-50/90">{m.means}</p>
              <p className="text-sm leading-relaxed text-emerald-100/70">{m.walk}</p>
              <a href={m.check} className="inline-block text-sm text-amber-100/90 underline underline-offset-4">
                Try the {s.move} Check
              </a>
            </section>
          )
        })}

        <p className="text-center">
          <a href="/coaching" className="text-sm text-emerald-100/70 underline underline-offset-4 hover:text-emerald-50">
            Back to the forest
          </a>
        </p>
      </div>
    </main>
  )
}
