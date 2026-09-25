import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BUILD_LOG_POSTS,
  buildLogState,
  daysInWords,
  WEEKLY_GRACE_DAYS,
} from '@/lib/build-log/posts'

export const metadata: Metadata = {
  title: 'The build log',
  description:
    'Building this in public, one post a week. The page reads its own posting history, and when the cadence lapses it says so and stops asking you to subscribe.',
}

/**
 * Same convention as the other checkout links: absent renders an honest state
 * rather than a dead button.
 */
const PATREON_URL = process.env.NEXT_PUBLIC_PATREON_URL ?? ''

/**
 * @page /build-log
 * @entity CAMPAIGN
 * @description Build-in-public, the surface the handoff calls "/workshop → Patreon".
 *   **It is NOT at /workshop**: that route already belongs to the Allyship Workshop
 *   (consent practice, the five-beat delivery) and the Promise Forge links to it twice,
 *   so taking the name would have broken a live feature.
 *
 *   The handoff's condition — one post a week minimum or do not launch it — is enforced
 *   rather than promised. The page reads BUILD_LOG_POSTS, and when the cadence lapses it
 *   says how long it has been and **withholds the subscribe button**. A page cannot sell
 *   a weekly promise it is visibly not keeping.
 * @permissions public
 * @relationships src/lib/build-log/posts.ts, NEXT_PUBLIC_PATREON_URL, /support
 * @dimensions WHO:supporter, WHAT:build log, WHERE:build-log, ENERGY:show_up
 * @example /build-log
 * @agentDiscoverable true
 */
export default function BuildLogPage() {
  // Server-rendered, so "today" is the deploy/request date rather than the
  // reader's clock. Date-only, which is all the cadence rule needs.
  const todayIso = new Date().toISOString().slice(0, 10)
  const state = buildLogState(BUILD_LOG_POSTS, todayIso)

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400">
            Build in public
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">The build log.</h1>
          <p className="text-base leading-relaxed text-[#a09e98]">
            One post a week about what actually got built, what broke, and what it cost.
            Working notes rather than announcements, which means some weeks the honest post
            is that a week went nowhere.
          </p>
        </header>

        {/* The rule, stated before any ask, and enforced below rather than promised. */}
        <section className="rounded-2xl border border-zinc-700 bg-black/40 p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            The rule this page holds itself to
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            One post a week, or the subscription comes down. This page counts the days since
            the last post itself. Past {daysInWords(WEEKLY_GRACE_DAYS)} it stops calling the
            cadence weekly and stops asking you to pay for one, without waiting for me to
            admit it.
          </p>
        </section>

        {state.kind === 'unstarted' && (
          <section className="rounded-2xl border border-amber-600/50 bg-amber-950/25 p-6">
            <h2 className="text-lg font-bold">It has not started yet</h2>
            <p className="mt-3 text-sm leading-relaxed text-amber-100/90">
              No posts, so there is nothing to subscribe to and no button here to press. The
              first post is what starts it, and until one exists this page is a description of
              an intention rather than a product.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-amber-100/80">
              The tour, the press run and the car are live now and could use hands.{' '}
              <Link href="/support" className="underline underline-offset-4">
                Those are on the support page
              </Link>
              .
            </p>
          </section>
        )}

        {state.kind === 'lapsed' && (
          <section className="rounded-2xl border border-amber-600/50 bg-amber-950/25 p-6">
            <h2 className="text-lg font-bold">The cadence lapsed</h2>
            <p className="mt-3 text-sm leading-relaxed text-amber-100/90">
              The last post went up {daysInWords(state.daysSinceLast)} days ago, which is past
              the promise. The subscribe button is gone until a new post brings it back, and
              this paragraph wrote itself the day the count crossed the line.
            </p>
          </section>
        )}

        {state.kind === 'holding' && (
          <section className="rounded-2xl border border-emerald-700/50 bg-emerald-950/20 p-6">
            <h2 className="text-lg font-bold">Subscribe on Patreon</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              The last post went up {daysInWords(state.daysSinceLast)} days ago, and there are{' '}
              {state.postCount} in the log. Cancel whenever you want, and nobody will write to
              ask why.
            </p>
            {PATREON_URL ? (
              <a
                href={PATREON_URL}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 font-bold text-white transition-colors hover:bg-emerald-500"
              >
                Join on Patreon →
              </a>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                The Patreon link is not wired up yet. Write to{' '}
                <a
                  href="mailto:wendell@masteringallyship.com?subject=Build%20log"
                  className="underline underline-offset-4"
                >
                  wendell@masteringallyship.com
                </a>{' '}
                and I will send it.
              </p>
            )}
          </section>
        )}

        {state.kind !== 'unstarted' && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold">The log</h2>
            {BUILD_LOG_POSTS.map((post) => (
              <article
                key={`${post.date}-${post.title}`}
                className="rounded-2xl border border-zinc-800 bg-black/30 p-5"
              >
                <p className="font-mono text-xs tabular-nums text-zinc-600">{post.date}</p>
                <h3 className="mt-1 text-base font-bold text-white">
                  {post.href ? (
                    <a href={post.href} className="underline underline-offset-4">
                      {post.title}
                    </a>
                  ) : (
                    post.title
                  )}
                </h3>
                {post.summary && (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{post.summary}</p>
                )}
              </article>
            ))}
          </section>
        )}

        <p className="text-sm leading-relaxed text-zinc-500">
          Paying here buys you the working notes and nothing else. It does not buy access to
          me, a place in a cohort, or a say in what gets built.{' '}
          <Link href="/mastering-allyship/one-to-one" className="text-zinc-300 underline underline-offset-4">
            The first of those has its own page and its own price
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
