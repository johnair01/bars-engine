import type { ReactNode } from 'react'
import Link from 'next/link'

import type {
  MtgoaOrganizationState,
  MtgoaParticipationPath,
  MtgoaWorkstream,
} from '@/lib/mtgoa-course/organization-state'

function RouteLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const style = className ?? 'inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-500 px-5 text-sm font-bold text-black transition-colors hover:bg-amber-400'
  return href.startsWith('http') ? <a href={href} className={style}>{children}</a> : <Link href={href} className={style}>{children}</Link>
}

function CampaignCard({ workstream }: { workstream: MtgoaWorkstream }) {
  return (
    <article className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/35 via-[#15110c] to-black/35 p-6 shadow-[0_20px_52px_-32px_rgba(245,158,11,.7)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-300">{workstream.status === 'open' ? 'Open now' : workstream.status}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">{workstream.ownerLabel}</p>
      </div>
      <h2 className="mt-3 text-3xl font-bold text-white">{workstream.title}</h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">{workstream.whyItMatters}</p>
      {workstream.nextUsefulAction ? <p className="mt-4 border-l-2 border-amber-400/70 pl-4 text-sm leading-6 text-amber-100/90">{workstream.nextUsefulAction}</p> : null}
    </article>
  )
}

function ParticipationCard({ path }: { path: MtgoaParticipationPath }) {
  return (
    <article className="flex flex-col rounded-2xl border border-zinc-800 bg-black/30 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">{path.status}</p>
      <h3 className="mt-2 text-xl font-bold text-white">{path.title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{path.forWhom}</p>
      <p className="mt-4 flex-1 text-sm leading-6 text-zinc-300">{path.ask}</p>
      <p className="mt-4 border-l border-zinc-700 pl-3 text-xs leading-5 text-zinc-500">{path.timeShape}</p>
      {path.href ? <RouteLink href={path.href} className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-amber-200 underline decoration-amber-500 underline-offset-4 hover:text-amber-100">See this route →</RouteLink> : null}
    </article>
  )
}

export function OrganizationLanding({ state }: { state: MtgoaOrganizationState }) {
  const bookPurchase = state.relatedSurfaces.find((surface) => surface.label === 'Buy the digital book')

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-16">
        <header className="max-w-3xl space-y-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400">Mastering the Game of Allyship</p>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">A place to practice allyship with other people making something real.</h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-300">The book, the Deck, BARS, and the campaigns around them are ways to build a reliable, renewable supply of skillful allies. You can look around, take one piece of work, bring an offer, or use the same practice in your own life.</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <RouteLink href="#book-launch">Explore the Book Launch →</RouteLink>
            {bookPurchase ? <RouteLink href={bookPurchase.href} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 px-5 text-sm font-bold text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white">Buy the book →</RouteLink> : null}
          </div>
        </header>

        <section id="book-launch" aria-labelledby="campaigns-heading" className="space-y-5 scroll-mt-6">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">Campaign map</p><h2 id="campaigns-heading" className="mt-2 text-3xl font-bold text-white">What is in motion</h2></div>
          {state.activeWorkstreams.map((workstream) => <CampaignCard key={workstream.id} workstream={workstream} />)}
          <p className="max-w-3xl text-sm leading-6 text-zinc-500">Book Tour, Speaking + Conferences, and Job Hunt will appear here when each has a public brief, an active steward, and a real route into the work.</p>
        </section>

        <section aria-labelledby="ways-in-heading" className="space-y-5">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">Ways into the work</p><h2 id="ways-in-heading" className="mt-2 text-3xl font-bold text-white">Choose a contribution you can stand behind.</h2><p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400">These are distinct routes. A purchase, a handoff, and an introduction ask different things of a person and remain separate.</p></div>
          <div className="grid gap-4 md:grid-cols-3">{state.participationPaths.map((path) => <ParticipationCard key={path.id} path={path} />)}</div>
        </section>

        <section aria-labelledby="offer-heading" className="rounded-2xl border border-emerald-700/40 bg-emerald-950/15 p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-300">Bring an offer</p>
          <h2 id="offer-heading" className="mt-2 text-3xl font-bold text-white">You may have something useful that is not on this board.</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300">A relationship, a room, a skill, a resource, or an idea can arrive before the exact task exists. The Book Tour Help route is the current place to offer a concrete connection or capacity. It asks for contact only when you choose to give it.</p>
          <RouteLink href="/mastering-allyship/book-tour/help" className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-emerald-200 underline decoration-emerald-500 underline-offset-4 hover:text-emerald-100">Bring a Book Tour offer →</RouteLink>
        </section>

        <section aria-labelledby="stewardship-heading" className="grid gap-6 border-y border-zinc-800 py-10 md:grid-cols-[1.2fr_.8fr]">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">How the work is held</p><h2 id="stewardship-heading" className="mt-2 text-3xl font-bold text-white">A purpose, a steward, and work that needs a home.</h2><p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">Wendell holds the Book Launch’s operational center today. As the work grows, people can take on clear stewardship scopes. The point is not a permanent hierarchy; it is that a person can see who holds the next decision and where to bring a useful tension.</p></div>
          <div className="rounded-xl border border-zinc-800 bg-black/30 p-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">Current steward</p><p className="mt-2 text-xl font-bold text-white">Wendell</p><p className="mt-3 text-sm leading-6 text-zinc-400">Campaign direction, current routes, and follow-up on offers.</p><RouteLink href="/mastering-allyship/book-tour/help" className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-amber-200 underline decoration-amber-500 underline-offset-4 hover:text-amber-100">Offer capacity or a connection →</RouteLink></div>
        </section>

        <section aria-labelledby="related-heading" className="space-y-5">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">Elsewhere in the field</p><h2 id="related-heading" className="mt-2 text-3xl font-bold text-white">Useful places to start.</h2></div>
          <div className="grid gap-3 sm:grid-cols-2">{state.relatedSurfaces.map((surface) => <RouteLink key={surface.href} href={surface.href} className="block rounded-xl border border-zinc-800 bg-black/25 p-5 transition-colors hover:border-zinc-600"><span className="block text-base font-bold text-zinc-100">{surface.label} →</span><span className="mt-2 block text-sm leading-6 text-zinc-500">{surface.why}</span></RouteLink>)}</div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">Last updated {state.updatedAt} · Campaign Steward review by {state.nextReviewAt}</p>
        </section>
      </div>
    </main>
  )
}
