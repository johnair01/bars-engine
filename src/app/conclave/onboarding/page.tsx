import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { buildOnboardingUrl, isSafeAppPath, resolvePostOnboardingRedirect } from '@/lib/safe-return-to'

/**
 * @page /conclave/onboarding
 * @entity SYSTEM
 * @description Onboarding controller that finds player's orientation quest and launches Twine/Adventure player
 * @permissions authenticated
 * @searchParams reset:string ('true' to reset, optional)
 * @searchParams ritual:string ('true' for ritual mode, optional)
 * @searchParams returnTo:string (optional) — after orientation completes, redirect here (same-origin path)
 * @relationships PLAYER (orientation progress), QUEST (orientation threads), ADVENTURE (Twine stories)
 * @dimensions WHO:player, WHAT:onboarding redirect, WHERE:conclave, ENERGY:orientation_quest
 * @example /conclave/onboarding?reset=true&ritual=true&returnTo=%2Fcampaign%2Fhub%3Fref%3Dbruised-banana
 * @agentDiscoverable false
 *
 * Onboarding Controller
 *
 * Finds the player's current orientation quest and launches it in the full-screen
 * Twine or Adventure player.
 *
 * @deprecated For new campaigns, use dashboard-first flow. Set AppConfig.postSignupRedirect
 * to 'dashboard' so signups land on / instead. This page was the onboarding for "Party"
 * (a specific campaign). Kept for backward compatibility when postSignupRedirect === 'conclave'.
 * See .specify/specs/dashboard-orientation-flow/spec.md
 */
export default async function OnboardingController(props: {
  searchParams: Promise<{ reset?: string; ritual?: string; returnTo?: string }>
}) {
  const searchParams = await props.searchParams
  const isReset = searchParams.reset === 'true'
  const isRitual = searchParams.ritual === 'true'
  const rawReturnTo = typeof searchParams.returnTo === 'string' ? searchParams.returnTo.trim() : undefined
  const persistedReturnTo = rawReturnTo && isSafeAppPath(rawReturnTo) ? rawReturnTo : undefined

  const player = await getCurrentPlayer()
  if (!player) {
    const loginBack = buildOnboardingUrl({
      returnTo: persistedReturnTo,
      ritual: isRitual,
      reset: isReset,
    })
    redirect(`/login?returnTo=${encodeURIComponent(loginBack)}`)
  }

  // Admins with nation+archetype skip onboarding
  if (player.nationId && player.archetypeId) {
    redirect(resolvePostOnboardingRedirect(persistedReturnTo, '/?ritualComplete=true'))
  }

  // Find orientation threads for this player (including completed ones for re-entry)
  const progress = await db.threadProgress.findFirst({
    where: {
      playerId: player.id,
      thread: { threadType: 'orientation' },
    },
    include: {
      thread: {
        include: {
          quests: {
            orderBy: { position: 'asc' },
            include: { quest: true },
          },
        },
      },
    },
  })

  // If no onboarding thread found, assign one for re-entry / safety
  if (!progress) {
    const { assignOrientationThreads } = await import('@/actions/quest-thread')
    await assignOrientationThreads(player.id)

    // Refresh to get the progress record
    redirect(buildOnboardingUrl({ returnTo: persistedReturnTo, ritual: isRitual }))
  }

  // NARRATIVE RE-ENTRY: If user is at the end or finished, OR they explicitly asked for a reset,
  // handle the redirection or reset.
  const isFinished = progress.completedAt || progress.currentPosition > progress.thread.quests.length

  if (isReset) {
    await db.threadProgress.update({
      where: { id: progress.id },
      data: { currentPosition: 1, completedAt: null },
    })

    // Redirect back without the reset param to avoid loops
    redirect(buildOnboardingUrl({ returnTo: persistedReturnTo, ritual: isRitual }))
  }

  if (isFinished) {
    // User is done with the orientation thread. Land on returnTo or dashboard.
    redirect(resolvePostOnboardingRedirect(persistedReturnTo, '/?ritualComplete=true'))
  }

  // Find the current quest in the thread
  const currentThreadQuest = progress.thread.quests.find((q) => q.position === progress.currentPosition)

  if (!currentThreadQuest) {
    // Fallback: reset if somehow stuck
    await db.threadProgress.update({
      where: { id: progress.id },
      data: { currentPosition: 1, completedAt: null },
    })
    redirect(buildOnboardingUrl({ returnTo: persistedReturnTo, ritual: isRitual }))
  }

  const quest = currentThreadQuest.quest

  const returnToQuery =
    persistedReturnTo != null ? `&returnTo=${encodeURIComponent(persistedReturnTo)}` : ''
  const ritualParam = isRitual ? '&ritual=true' : ''

  // If quest has a Twine story, go to the full-screen player
  if (quest.twineStoryId) {
    redirect(
      `/adventures/${quest.twineStoryId}/play?questId=${quest.id}&threadId=${progress.threadId}${ritualParam ? ritualParam : ''}${returnToQuery}`,
    )
  }

  // If thread has an Adventure (e.g. from .twee import), play via Passage-based flow
  if (progress.thread.adventureId) {
    redirect(
      `/adventure/${progress.thread.adventureId}/play?questId=${quest.id}&threadId=${progress.threadId}${ritualParam ? ritualParam : ''}${returnToQuery}`,
    )
  }

  // Otherwise, redirect to the dashboard where the quest will show up in their list
  redirect('/?focusQuest=' + quest.id)
}
