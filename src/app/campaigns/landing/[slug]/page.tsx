import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCampaignLandingData } from '@/actions/campaign-landing'
import { getDomainLabel } from '@/lib/allyship-domains'

export default async function CampaignLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ invite?: string }>
}) {
  const { slug } = await params
  const { invite: inviteToken } = await searchParams

  const data = await getCampaignLandingData(slug, inviteToken ?? null)

  if (!data) notFound()

  const { instance, inviter, firstQuestCta } = data
  const campaignRef = instance.campaignRef ?? instance.slug
  const domainLabel = getDomainLabel(instance.primaryCampaignDomain ?? instance.allyshipDomain)

  const ctaHref = firstQuestCta.questId
    ? `/adventure/hub/${firstQuestCta.questId}?ref=${encodeURIComponent(campaignRef)}`
    : `/campaign/lobby?ref=${encodeURIComponent(campaignRef)}`

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">{instance.name}</h1>
            {domainLabel && (
              <p className="text-sm text-purple-400 uppercase tracking-wider">{domainLabel}</p>
            )}
            {instance.targetDescription && (
              <p className="text-zinc-400 text-sm leading-relaxed">{instance.targetDescription}</p>
            )}
          </header>

          {inviter && (
            <p className="text-zinc-500 text-sm">
              <span className="text-zinc-400">{inviter.name}</span> invited you
            </p>
          )}

          <Link
            href={ctaHref}
            className="block w-full text-center py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
          >
            {firstQuestCta.label}
          </Link>
        </div>

        <p className="mt-4 text-center">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-400">
            ← Dashboard
          </Link>
        </p>
      </div>
    </div>
  )
}
