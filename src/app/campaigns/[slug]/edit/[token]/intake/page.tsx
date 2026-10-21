/**
 * @route /campaigns/[slug]/edit/[token]/intake
 * @entity CAMPAIGN
 * @description The campaign owner's GoFundMe and Patreon intake: one step at a
 *   time, each with the platform's best-practice tip and a STUCK? button (WAVE,
 *   3-2-1, or book time with Wendell) that emails Wendell. Ends in a copy-ready
 *   draft of each page. `?platform=gofundme|patreon&step=<id>` opens a step;
 *   `&view=draft` opens the draft.
 * @permissions holder of the campaign's edit link (or the preview token on a preview)
 * @dimensions WHO:the campaign's owner, WHAT:fundraising page intake,
 *   WHERE:hosted campaign, ENERGY:show_up
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveHosted, tokenMatches } from '@/lib/hosted-campaigns/campaigns'
import { getHostedStore } from '@/lib/hosted-campaigns/server'
import { emptyIntake, getStep, type IntakePlatform } from '@/lib/hosted-campaigns/intake'
import { isIntakePreview } from '@/lib/hosted-campaigns/preview'
import { IntakeFlow } from './IntakeFlow'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Build your GoFundMe and Patreon pages',
  robots: { index: false, follow: false },
}

export default async function HostedIntakePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; token: string }>
  searchParams: Promise<{ platform?: string; step?: string; view?: string }>
}) {
  const { slug, token } = await params
  const sp = await searchParams
  const demo = isIntakePreview(token)
  const store = demo ? {} : await getHostedStore()
  const campaign = resolveHosted(slug, store)
  if (!campaign) notFound()
  if (!demo && !tokenMatches(store[campaign.slug]?.editToken, token)) notFound()

  const step = sp.step ? getStep(sp.step) : null
  const platform: IntakePlatform = step?.platform ?? (sp.platform === 'patreon' ? 'patreon' : 'gofundme')

  return (
    <main className="flex min-h-screen justify-center" style={{ background: 'var(--bars-bg-base)', fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-primary)' }}>
      <div className="flex w-full max-w-[680px] flex-col gap-6 px-5 pb-24 pt-10">
        <IntakeFlow
          slug={campaign.slug}
          token={token}
          demo={demo}
          fields={campaign.fields}
          initialAnswers={(store[campaign.slug]?.intake ?? emptyIntake()).answers}
          initialPlatform={platform}
          initialStepId={step?.id ?? null}
          initialDraft={sp.view === 'draft'}
        />
      </div>
    </main>
  )
}
