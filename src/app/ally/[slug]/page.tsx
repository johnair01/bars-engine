/**
 * @route /ally/[slug]
 * @entity CAMPAIGN
 * @description The warm ally CYOA — a named, personal walk through the Mastering
 *   Allyship framework that ends with the reader holding a specific, scoped piece
 *   of the campaign. `/ally/mom` is the first one. Public, no auth, no AI.
 * @permissions public
 * @dimensions WHO:a person who loves the founder, WHAT:allyship onboarding + scoped ask,
 *   WHERE:mobility-quest campaign tree, ENERGY:open_up
 *
 * Accountless by design (see `src/actions/ally-campaign.ts`): everything the reader
 * does lands on the steward dashboard without a bars-engine account ever existing.
 *
 * Content lives in `@/lib/ally-campaign/*` — this file is a shell.
 * Spec lineage: campaign-lead-forge, mobility-quest-superpower-campaign.
 */
import type { Metadata } from 'next'
import { AllyFunnel } from './AllyFunnel'
import { resolveInvite, ALLY_SLUGS } from '@/lib/ally-campaign/allies'

export const dynamic = 'force-static'

/** Pre-render the named invites; anything else renders on demand. */
export function generateStaticParams() {
  return ALLY_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const invite = resolveInvite(slug)
  return {
    title: `Mastering the Game of Allyship — for ${invite.displayName}`,
    description:
      'The honest version: what is being built, what it costs, what is needed, and how it pays for itself. About fifteen minutes.',
    // Personal warm invites should never be indexed or shared onward.
    robots: { index: false, follow: false },
  }
}

export default async function AllyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const invite = resolveInvite(slug)

  return (
    <main
      className="flex min-h-screen justify-center"
      style={{
        background: 'radial-gradient(125% 85% at 50% -10%, #17121c 0%, var(--bars-bg-base) 62%)',
        fontFamily: 'var(--bars-font-body)',
      }}
    >
      <div className="flex w-full max-w-[620px] flex-col px-5 pb-20 pt-8">
        <AllyFunnel invite={invite} />
      </div>
    </main>
  )
}
