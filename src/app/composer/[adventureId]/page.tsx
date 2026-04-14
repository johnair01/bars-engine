/**
 * Composer Page — Server component for the CYOA Build Composer.
 *
 * Fetches all player context data server-side (build history, daily check-in,
 * hub state, checkpoint, GM overrides) and passes it to the ComposerContainer
 * client component.
 *
 * URL: /composer/[adventureId]?instanceId=...&spokeIndex=...&ctaFace=...
 *
 * The server component handles:
 *   - Authentication (redirects to / if not logged in)
 *   - Data fetching via getPlayerComposerContext server action
 *   - Error rendering
 *   - Passing serializable props to the client container
 *
 * @see src/actions/composer-context.ts — server action for data assembly
 * @see src/components/composer/ComposerContainer.tsx — client container
 */

import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getPlayerComposerContext } from '@/actions/composer-context'
import { ComposerContainer } from '@/components/composer/ComposerContainer'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import { GAME_MASTER_FACES } from '@/lib/quest-grammar/types'

interface ComposerPageProps {
  params: Promise<{ adventureId: string }>
  searchParams: Promise<{
    instanceId?: string
    spokeIndex?: string
    ctaFace?: string
  }>
}

export default async function ComposerPage({
  params,
  searchParams,
}: ComposerPageProps) {
  const player = await getCurrentPlayer()
  if (!player) redirect('/')

  const { adventureId } = await params
  const { instanceId, spokeIndex: spokeIndexStr, ctaFace } = await searchParams

  // Validate required params
  if (!instanceId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <p className="text-zinc-400">Missing campaign instance.</p>
          <p className="text-xs text-zinc-600">
            The composer requires an instanceId parameter.
          </p>
        </div>
      </div>
    )
  }

  const spokeIndex = spokeIndexStr ? parseInt(spokeIndexStr, 10) : 0
  const validSpokeIndex = Number.isFinite(spokeIndex) && spokeIndex >= 0 && spokeIndex <= 7
    ? spokeIndex
    : 0

  // Validate ctaFace if provided
  const validCtaFace: GameMasterFace | null =
    ctaFace && GAME_MASTER_FACES.includes(ctaFace as GameMasterFace)
      ? (ctaFace as GameMasterFace)
      : null

  // Fetch all player context data
  const result = await getPlayerComposerContext(
    adventureId,
    instanceId,
    validSpokeIndex,
    validCtaFace,
  )

  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <p className="text-zinc-400">Unable to load composer.</p>
          <p className="text-xs text-zinc-600">{result.error}</p>
        </div>
      </div>
    )
  }

  const { data } = result

  return (
    <main className="px-4 py-8 max-w-4xl mx-auto">
      <ComposerContainer
        playerContext={data.playerContext}
        completedBuilds={data.completedBuilds}
        templateCatalog={data.templateCatalog}
        adventureId={data.adventureId}
        campaignRef={data.campaignRef}
        spokeIndex={data.spokeIndex}
      />
    </main>
  )
}
