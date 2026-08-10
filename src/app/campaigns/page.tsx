import type { Metadata } from 'next'
import Link from 'next/link'
import { domainGemVar } from '@/lib/allyship-domains'
import {
  CAMPAIGN_CHOOSING_QUOTE,
  CAMPAIGN_HOUSE_RULES,
  CAMPAIGN_UNLOCK,
  TWENTY_ONE_DAY_CAMPAIGNS,
} from '@/lib/campaigns/twenty-one-day'

/**
 * @page /campaigns
 * @entity CAMPAIGN
 * @description The four doors — Appendix B's 21-day campaigns, one card each. There was
 *   no index under /campaigns (only landing/[slug]), so the four had nowhere to live.
 *   Direct Action's object is open by design: Week 1 names it, and its menu lists the
 *   non-launch options first and in the majority, because a menu of one teaches nothing.
 *   Both house rules are pinned above the cards rather than surfaced after entry.
 * @permissions public
 * @relationships /campaigns/landing/[slug], /mastering-allyship/book-tour/help,
 *   /campaign/the-crossing, src/lib/campaigns/twenty-one-day.ts
 * @dimensions WHO:player, WHAT:campaign index, WHERE:campaigns, ENERGY:choose
 * @example /campaigns
 * @agentDiscoverable true
 */

export const metadata: Metadata = {
  title: 'The four campaigns — Mastering the Game of Allyship',
  description:
    'Appendix B’s four 21-day campaigns: Skillful Organizing, Gather Resources, Raise Awareness, Direct Action. Three weeks each, one object, one capture.',
}

export default function CampaignsIndexPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400">
            Appendix B sent you here
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Four doors.</h1>
          <blockquote className="border-l-2 border-amber-600/60 pl-4 text-base italic leading-relaxed text-[#a09e98]">
            {CAMPAIGN_CHOOSING_QUOTE}
          </blockquote>
          <p className="text-sm leading-relaxed text-zinc-400">
            Each runs twenty-one days: one move a week, against one object, ending in a
            capture you post. {CAMPAIGN_UNLOCK}
          </p>
        </header>

        {/* Pinned before anyone enters, not surfaced afterward. */}
        <section className="space-y-3 rounded-2xl border border-zinc-700 bg-black/40 p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Two rules, before you pick
          </h2>
          {CAMPAIGN_HOUSE_RULES.map((rule) => (
            <div key={rule.title}>
              <h3 className="text-base font-bold text-white">{rule.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{rule.detail}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {TWENTY_ONE_DAY_CAMPAIGNS.map((campaign) => (
            <article
              key={campaign.domain}
              className="flex flex-col rounded-2xl border border-zinc-800 bg-black/30 p-6"
              style={{ borderTopColor: domainGemVar(campaign.domain), borderTopWidth: 3 }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: domainGemVar(campaign.domain) }}
              >
                {campaign.label}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white">{campaign.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                {campaign.blurb}
              </p>

              <ol className="mt-4 space-y-2">
                {campaign.weeks.map((week) => (
                  <li key={week.n} className="flex gap-3 text-sm text-zinc-300">
                    <span className="font-mono text-xs tabular-nums text-zinc-600">
                      W{week.n}
                    </span>
                    <span className="leading-relaxed">{week.move}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-4 rounded-xl border border-zinc-800 bg-black/40 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  The object
                </p>
                {campaign.object.kind === 'named' ? (
                  <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                    {campaign.object.object}
                  </p>
                ) : (
                  <>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                      {campaign.object.prompt}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {campaign.object.menu.map((item) => (
                        <li key={item.label} className="text-sm leading-relaxed text-zinc-400">
                          <span aria-hidden className="mr-2 text-zinc-600">
                            ·
                          </span>
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-emerald-700/40 bg-emerald-950/20 p-6">
          <h2 className="text-lg font-bold">Fund a Copy</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Pay for a book that goes to somebody who cannot buy one, with a real named
            person on the other end rather than a category. It closes a Gather Resources
            campaign at week three the way the book describes: the copy is somewhere it is
            wanted, and it runs without you.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            This is a purchase and not a donation, and the organization it will eventually
            belong to does not legally exist yet. Until it does, a funded copy is a book
            bought and sent, handled by a person.{' '}
            <Link href="/nonprofit" className="text-zinc-300 underline underline-offset-4">
              The organization&apos;s actual state is on its own page
            </Link>
            .
          </p>
          <Link
            href="/campaign/the-crossing"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 font-bold text-white transition-colors hover:bg-emerald-500"
          >
            Fund a copy through The Crossing →
          </Link>
        </section>

        <p className="text-sm leading-relaxed text-zinc-500">
          Running one against the book tour?{' '}
          <Link
            href="/mastering-allyship/book-tour/help"
            className="text-zinc-300 underline underline-offset-4"
          >
            Pick how you want to help and it enters the matching campaign
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
