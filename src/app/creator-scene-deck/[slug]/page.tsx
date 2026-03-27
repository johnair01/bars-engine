import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { SCENE_ATLAS_DISPLAY_NAME, SCENE_ATLAS_TAGLINE } from '@/lib/creator-scene-grid-deck/branding'
import { loadSceneGridDeckView } from '@/lib/creator-scene-grid-deck/load-deck-view'
import { loadPromptDeckPlaySnapshot } from '@/lib/prompt-deck/load-play-snapshot'
import { SceneDeckClient } from '@/components/creator-scene-deck/SceneDeckClient'

/**
 * @page /creator-scene-deck/:slug
 * @entity CAMPAIGN
 * @description Scene Atlas creator lab - grid deck for building story scenes by polarity
 * @permissions authenticated, game_account_ready
 * @params slug:string (path, required) - Instance slug
 * @relationships loads scene grid deck for CAMPAIGN instance, displays polarity-sorted cards
 * @energyCost 0 (creator tooling, no game state change)
 * @dimensions WHO:playerId, WHAT:CAMPAIGN, WHERE:creator_lab, ENERGY:creative, PERSONAL_THROUGHPUT:create
 * @example /creator-scene-deck/bruised-banana
 * @agentDiscoverable false
 */
export default async function CreatorSceneDeckSlugPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const player = await getCurrentPlayer()
  if (!player) {
    redirect('/conclave/guided')
  }
  if (!isGameAccountReady(player)) {
    redirect('/conclave/guided')
  }

  const view = await loadSceneGridDeckView(player.id, slug)
  if (!view.ok) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4 text-zinc-300">
        <h1 className="text-2xl font-bold text-white">Scene grid deck</h1>
        <p>No deck found for instance <code className="text-amber-400">{slug}</code>.</p>
        <p className="text-sm text-zinc-400">
          Run{' '}
          <code className="text-zinc-200 bg-zinc-800 px-1 rounded">npm run seed:creator-scene-deck</code> after
          <code className="text-zinc-200 bg-zinc-800 px-1 rounded"> DATABASE_URL</code> is set.
        </p>
        <Link href="/wiki/grid-deck" className="text-amber-400 hover:text-amber-300 text-sm">
          Wiki: {SCENE_ATLAS_DISPLAY_NAME}
        </Link>
      </div>
    )
  }

  const playSnapshot = await loadPromptDeckPlaySnapshot(player.id, view.deckId, view.cardsBySuit)

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Creator lab</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{SCENE_ATLAS_DISPLAY_NAME}</h1>
        <p className="text-sm text-zinc-300 max-w-2xl">{SCENE_ATLAS_TAGLINE}</p>
        <p className="text-sm text-zinc-400">
          Instance <code className="text-zinc-200 bg-zinc-800/80 px-1 rounded">{slug}</code>
        </p>
      </header>

      <SceneDeckClient
        instanceId={view.instance.id}
        instanceSlug={view.instance.slug}
        instanceName={view.instance.name}
        deckId={view.deckId}
        polarities={view.polarities}
        cardsBySuit={view.cardsBySuit}
        orderedSuits={view.orderedSuits}
        filledCount={view.filledCount}
        dailySceneAtlas={view.dailySceneAtlas}
        playSnapshot={playSnapshot}
      />

      <footer className="pt-6 border-t border-zinc-800/80 text-xs text-zinc-500 space-y-2">
        <p>
          UI built against the{' '}
          <Link href="/wiki/ui-style-guide" className="text-amber-500/90 hover:text-amber-400">
            UI Style Guide
          </Link>
          {' '}
          (modals, progressive disclosure). Copy:{' '}
          <Link href="/wiki/voice-style-guide" className="text-amber-500/90 hover:text-amber-400">
            Voice Style Guide
          </Link>
          .
        </p>
        <p>
          <Link href="/wiki/grid-deck" className="text-amber-500/90 hover:text-amber-400">
            Wiki: {SCENE_ATLAS_DISPLAY_NAME}
          </Link>
        </p>
      </footer>
    </div>
  )
}
