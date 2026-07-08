import type { Metadata } from 'next'
import Link from 'next/link'
import { chapterOnePreviewReady, type HubAudience } from '@/lib/kickstarter-hub/content'

/**
 * @route GET /kickstarter/chapter-1
 * @page /kickstarter/chapter-1
 * @entity CAMPAIGN
 * @description Chapter 1 preview surface for the Kickstarter hub (SPEC v2 §6).
 *   The hub's "what's next" branch always routes here. Until the excerpt lands it
 *   renders an honest coming-soon holding state (§5) with a real link on to
 *   /launch — a link the reader chooses, NOT a redirect. When the excerpt is
 *   authored, replace the ComingSoon block below with it and flip
 *   NEXT_PUBLIC_HUB_CHAPTER1_READY=true so the hub upgrades in lockstep.
 * @permissions public
 * @query audience — "warm" (default) | "public"
 * @example /kickstarter/chapter-1
 * @agentDiscoverable true
 */

export const metadata: Metadata = {
  title: 'Mastering the Game of Allyship — Chapter 1',
  description:
    'The opening chapter of Mastering the Game of Allyship — landing here very soon.',
}

function normalizeAudience(v?: string): HubAudience {
  return v === 'public' ? 'public' : 'warm'
}

export default async function ChapterOnePage({
  searchParams,
}: {
  searchParams: Promise<{ audience?: string }>
}) {
  const { audience: rawAudience } = await searchParams
  const audience = normalizeAudience(rawAudience)
  const hubHref = audience === 'public' ? '/kickstarter?audience=public' : '/kickstarter'

  // The excerpt isn't wired yet — render the coming-soon fallback. When the real
  // Chapter 1 content is added, gate it on `ready` here.
  const ready = chapterOnePreviewReady()

  const body =
    audience === 'warm'
      ? "the actual opening of the book you backed — not a status update, the real thing. it's in final polish and lands right here in the next day or two. this page will upgrade itself the moment it's ready; nothing to do but check back."
      : "the actual opening of the book — in final polish, landing right here in the next day or two. this page upgrades itself the moment it's ready."

  return (
    <main className="ks-hub flex justify-center">
      <div className="flex w-full max-w-[620px] flex-col gap-5 px-5 pb-16 pt-8">
        {/* Breadcrumb back to the hub — no redirect, the reader chooses. */}
        <nav className="ks-rise">
          <Link
            href={hubHref}
            className="text-[12px]"
            style={{
              fontFamily: 'var(--bars-font-mono)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--bars-text-secondary)',
            }}
          >
            ← back to your next step
          </Link>
        </nav>

        <section
          className="ks-card ks-card--holding ks-rise p-6 sm:p-7"
          data-accent="coral"
          aria-label="chapter 1 — coming soon"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="ks-eyebrow">05 · what’s next</span>
            <span className="ks-pill ks-pill--soon">coming soon</span>
          </div>

          <h1
            className="mt-2 text-[26px] font-bold lowercase sm:text-[30px]"
            style={{
              fontFamily: 'var(--bars-font-display)',
              letterSpacing: '-0.02em',
              lineHeight: 1.08,
              color: 'var(--bars-text-primary)',
              textWrap: 'balance',
            }}
          >
            read chapter 1
          </h1>

          <p
            className="mt-3 max-w-[54ch] text-[14px]"
            style={{
              fontFamily: 'var(--bars-font-body)',
              lineHeight: 1.6,
              color: 'var(--bars-text-secondary)',
            }}
          >
            {body}
          </p>

          <p
            className="mt-4 rounded-[10px] border border-dashed p-3 text-[13px]"
            style={{
              borderColor: 'var(--bars-line-dashed)',
              fontFamily: 'var(--bars-font-body)',
              lineHeight: 1.55,
              color: 'var(--bars-text-muted)',
            }}
          >
            coming very soon — the excerpt is in final polish. we’d rather show you the real thing
            than a placeholder{ready ? ', and it’s nearly here' : ''}.
          </p>

          {/* A real link on to /launch — the reader's choice, not a redirect. */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link className="ks-cta" href="/launch">
              {audience === 'warm' ? 'see everything you backed' : 'see the whole thing'} →
            </Link>
            <Link className="ks-cta ks-cta--ghost" href={hubHref}>
              back to the hub
            </Link>
          </div>

          <p
            className="mt-3 text-[12px]"
            style={{ fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-muted)' }}
          >
            the book, the deck, and the game all live on the launch page — while you wait for the
            excerpt.
          </p>
        </section>
      </div>
    </main>
  )
}
