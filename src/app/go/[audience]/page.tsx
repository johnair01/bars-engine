import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GO_AUDIENCES, getGoAudience } from '@/lib/go/audiences'

export function generateStaticParams() {
  return GO_AUDIENCES.map((a) => ({ audience: a.slug }))
}

export async function generateMetadata(props: {
  params: Promise<{ audience: string }>
}): Promise<Metadata> {
  const { audience } = await props.params
  const found = getGoAudience(audience)
  if (!found) return { title: 'Not found' }
  return {
    title: `${found.oneThing} — Mastering the Game of Allyship`,
    description: found.problem,
    // These are handed out one to one. They are not search surfaces, and a
    // half-personalized page ranking for somebody else's query helps nobody.
    robots: { index: false, follow: false },
  }
}

/**
 * @page /go/:audience
 * @entity CAMPAIGN
 * @description One page, one audience, one ask — the handoff's T8 format. Renders the
 *   skeleton in order: their problem in their words, the one thing this gives them, the
 *   proof that lands for them specifically, then a single button. **No navigation, no
 *   footer, no second offer** — Chrome strips its chrome and the GoAudience type allows
 *   exactly one `ask`, so a second call to action is a type error rather than a late-night
 *   judgment call. Handed out one to one, so `noindex`.
 * @permissions public
 * @params audience:string (one of GO_AUDIENCES; unknown slugs 404)
 * @relationships src/lib/go/audiences.ts, /speaking, /podcasts, /succession,
 *   /mastering-allyship/book-tour/help
 * @dimensions WHO:prospect, WHAT:funnel, WHERE:go, ENERGY:invite
 * @example /go/bookstore
 * @agentDiscoverable true
 */
export default async function GoAudiencePage(props: {
  params: Promise<{ audience: string }>
}) {
  const { audience } = await props.params
  const found = getGoAudience(audience)
  if (!found) notFound()

  return (
    <main className="flex min-h-screen items-center bg-[#0a0908] px-4 py-16 text-[#e8e6e0] sm:px-6">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <p className="text-sm leading-relaxed text-zinc-500">{found.problem}</p>

        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{found.oneThing}</h1>

        <p className="text-base leading-relaxed text-[#a09e98]">{found.proof}</p>

        {found.caveat && (
          <p className="border-l-2 border-amber-600/60 pl-4 text-sm leading-relaxed text-amber-100/80">
            {found.caveat}
          </p>
        )}

        {/* One ask. One button. Nothing under it. */}
        <div className="space-y-3 pt-2">
          <Link
            href={found.ask.href}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-500 px-7 text-base font-bold text-black transition-colors hover:bg-amber-400"
          >
            {found.ask.label} →
          </Link>
          <p className="text-sm leading-relaxed text-zinc-500">{found.ask.afterward}</p>
        </div>
      </div>
    </main>
  )
}
