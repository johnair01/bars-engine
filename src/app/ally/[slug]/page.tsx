/**
 * @route /ally/[slug]
 * @entity CAMPAIGN
 * @description The warm ally CYOA — a named, personal walk through the Mastering
 *   Allyship framework that ends with the reader holding a specific, scoped piece
 *   of the campaign. `/ally/mom` is the first one. Public, no auth, no AI.
 * @permissions public (admins additionally see an inline content editor)
 * @dimensions WHO:a person who loves the founder, WHAT:allyship onboarding + scoped ask,
 *   WHERE:mobility-quest campaign tree, ENERGY:open_up
 *
 * Accountless by design (see `src/actions/ally-campaign.ts`): everything the reader
 * does lands on the steward dashboard without a bars-engine account ever existing.
 *
 * Rendered dynamically rather than statically: the prose is admin-editable at
 * runtime (`content-overrides.ts`), and the editor is gated on the viewer's role,
 * so both the copy and the chrome depend on request state. Traffic here is
 * family-scale; correctness beats a cached render.
 *
 * Content defaults live in `@/lib/ally-campaign/*` — this file is a shell.
 * Spec lineage: campaign-lead-forge, mobility-quest-superpower-campaign,
 * admin-editable-launch-page (the override pattern).
 */
import type { Metadata } from 'next'
import { AllyFunnel } from './AllyFunnel'
import { AllyContentEditor } from './AllyContentEditor'
import { getAllyContent, isCurrentPlayerAdmin } from '@/lib/ally-campaign/content-server'
import { inviteOverrideKey } from '@/lib/ally-campaign/content-overrides'
import { resolveInvite } from '@/lib/ally-campaign/allies'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  // Metadata uses the authored default rather than a database read — a title is
  // not worth a query, and the name rarely differs.
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
  const [content, isAdmin] = await Promise.all([getAllyContent(slug), isCurrentPlayerAdmin()])

  return (
    <main
      className="flex min-h-screen justify-center"
      style={{
        background: 'radial-gradient(125% 85% at 50% -10%, #17121c 0%, var(--bars-bg-base) 62%)',
        fontFamily: 'var(--bars-font-body)',
      }}
    >
      <div className="flex w-full max-w-[620px] flex-col gap-6 px-5 pb-20 pt-8">
        {/* Absent from the DOM entirely for a visitor — not merely hidden. */}
        {isAdmin && (
          <AllyContentEditor
            inviteKey={inviteOverrideKey(slug)}
            invite={content.invite}
            myths={content.myths}
            understanding={content.understanding}
            workstreams={content.workstreams}
          />
        )}
        <AllyFunnel
          invite={content.invite}
          myths={content.myths}
          understanding={content.understanding}
          workstreams={content.workstreams}
        />
      </div>
    </main>
  )
}
