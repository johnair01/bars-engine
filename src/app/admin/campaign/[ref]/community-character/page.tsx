import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { AdminPageHeader } from '@/app/admin/components/AdminPageHeader'
import { CommunityCharacterWizard } from '@/components/campaign/CommunityCharacterWizard'
import { getCommunityCharacterCorpus } from '@/actions/community-character'
import { getElementForNationKey } from '@/lib/ui/nation-element'
import type { ElementKey } from '@/lib/ui/card-tokens'

export default async function CommunityCharacterPage({
  params,
}: {
  params: Promise<{ ref: string }>
}) {
  const { ref } = await params
  const campaignRef = decodeURIComponent(ref)

  const [player, instance] = await Promise.all([
    getCurrentPlayer(),
    db.instance.findFirst({
      where: { OR: [{ campaignRef }, { slug: campaignRef }] },
      select: { id: true, name: true, slug: true },
    }),
  ])

  if (!instance) notFound()

  const existingCorpus = await getCommunityCharacterCorpus(instance.id)

  // Resolve archetype + nation from the current player (campaign owner doing onboarding)
  const archetypeKey = player?.archetype?.name
    ? player.archetype.name
        .toLowerCase()
        .replace(/^the\s+/, '')
        .replace(/\s+/g, '-')
    : 'bold-heart'
  const archetypeLabel = player?.archetype?.name ?? 'Bold Heart'
  const nationKey = player?.nation?.name?.toLowerCase() ?? 'virelune'
  const element: ElementKey = getElementForNationKey(nationKey) ?? 'wood'

  return (
    <div className="space-y-6 max-w-xl">
      <AdminPageHeader
        title="Community Character"
        description={`Author the invite prompt corpus for ${instance.name}`}
        action={
          <Link
            href={`/admin/campaign/${encodeURIComponent(campaignRef)}/author`}
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            ← Campaign hub
          </Link>
        }
      />

      <p className="text-sm text-zinc-400 leading-relaxed">
        Answer 7 questions about who belongs in your community. Your answers generate the
        invite prompts that appear on every bingo card created for events in this campaign.
        No writing required — your choices do the work.
      </p>

      {existingCorpus && (
        <div className="rounded-lg border border-zinc-700/40 bg-zinc-900/40 px-4 py-3 text-xs text-zinc-400 leading-relaxed">
          Corpus authored{' '}
          <span className="text-zinc-300">
            {new Date(existingCorpus.questCompletedAt).toLocaleDateString()}
          </span>{' '}
          as {existingCorpus.archetypeKey} · {existingCorpus.nationKey}. Completing the quest
          again replaces it.
        </div>
      )}

      <CommunityCharacterWizard
        instanceId={instance.id}
        archetypeKey={archetypeKey}
        archetypeLabel={archetypeLabel}
        nationKey={nationKey}
        element={element}
        existingCorpus={existingCorpus}
      />
    </div>
  )
}
