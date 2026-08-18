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
import {
  getAllyContentOverrides,
  isCurrentPlayerAdmin,
} from '@/lib/ally-campaign/content-server'
import {
  inviteExists,
  inviteOverrideKey,
  isTestSlug,
  listInvites,
  resolveAllyContent,
  testSlugTarget,
} from '@/lib/ally-campaign/content-overrides'
import { ALLIES, resolveInvite } from '@/lib/ally-campaign/allies'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  // Metadata uses the authored default rather than a database read — a title is
  // not worth a query, and the name rarely differs.
  const invite = resolveInvite(testSlugTarget(slug))
  return {
    // The browser tab is the one place a dry run could be mistaken for the real
    // link once several are open at once.
    title: isTestSlug(slug)
      ? `[TEST] Allyship — for ${invite.displayName}`
      : `Mastering the Game of Allyship — for ${invite.displayName}`,
    description:
      'The honest version: what is being built, what it costs, what is needed, and how it pays for itself. About fifteen minutes.',
    // Personal warm invites should never be indexed or shared onward.
    robots: { index: false, follow: false },
  }
}

export default async function AllyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [overrides, isAdmin] = await Promise.all([
    getAllyContentOverrides(),
    isCurrentPlayerAdmin(),
  ])

  // `/ally/test-mom` rehearses the real `mom` letter and persists nothing.
  const testMode = isTestSlug(slug)
  const contentSlug = testSlugTarget(slug)

  const content = resolveAllyContent(contentSlug, overrides)
  const key = inviteOverrideKey(contentSlug, overrides)
  // Created invites live only in the database; authored ones have a file entry.
  const isCreated = inviteExists(contentSlug, overrides) && !ALLIES[key]

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
            inviteKey={key}
            invite={content.invite}
            myths={content.myths}
            understanding={content.understanding}
            workstreams={content.workstreams}
            invites={listInvites(overrides)}
            isCreated={isCreated}
          />
        )}
        <AllyFunnel
          invite={content.invite}
          myths={content.myths}
          understanding={content.understanding}
          workstreams={content.workstreams}
          testMode={testMode}
          testTargetLabel={testMode ? content.invite.displayName : undefined}
        />
      </div>
    </main>
  )
}
