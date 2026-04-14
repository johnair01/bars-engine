/**
 * Factory helpers for creating ChapterDefinitions with sane defaults.
 *
 * Usage:
 *   const chapter1 = createChapterSpoke({
 *     chapterRef: 'mtgoa-chapter-1',
 *     bookRef: 'mtgoa-book',
 *     orgRef: 'mtgoa-org',
 *     title: 'Chapter 1: The Call to Play',
 *     shortTitle: 'Call to Play',
 *     description: '...',
 *   })
 *
 * See: .specify/specs/chapter-spoke-template/spec.md
 */

import type {
  ChapterDefinition,
  ChapterRoomDefinition,
  ChapterAnchor,
} from './types'

/**
 * Default octagon clearing room with standard NPC positions.
 * Face NPCs are placed at the cardinal/intercardinal compass points.
 */
export function defaultChapterClearing(chapterRef: string): ChapterRoomDefinition {
  return {
    slug: `${chapterRef}-clearing`,
    name: 'Chapter Clearing',
    layout: 'octagon',
    size: { width: 20, height: 20 },
    ambientPalette: 'twilight',
    anchors: [
      // Exit anchor at south
      {
        type: 'exit_threshold',
        tileX: 10,
        tileY: 18,
        config: { label: 'Return to book hub' },
      },
      // Bar creation moment at center
      {
        type: 'bar_moment',
        tileX: 10,
        tileY: 10,
        config: { barMomentId: `${chapterRef}-bar-moment-1` },
      },
    ],
  }
}

/**
 * Default exit anchor pointing back to the book hub.
 */
export function defaultExitAnchor(bookHubSlug: string): ChapterAnchor {
  return {
    type: 'exit_threshold',
    tileX: 10,
    tileY: 18,
    config: {
      targetInstanceSlug: bookHubSlug,
      targetRoomSlug: `${bookHubSlug}-clearing`,
      label: 'Return to hub',
    },
  }
}

type CreateChapterInput = Partial<ChapterDefinition> & {
  chapterRef: string
  bookRef: string
  orgRef: string
  title: string
  shortTitle: string
  description: string
  version?: string
}

/**
 * Factory: creates a ChapterDefinition with sane defaults.
 * Override any field in the input to customise the chapter.
 */
export function createChapterSpoke(input: CreateChapterInput): ChapterDefinition {
  const { chapterRef, bookRef, orgRef, title, shortTitle, description } = input
  const version = input.version ?? 'v1'

  return {
    chapterRef,
    bookRef,
    orgRef,
    parentCampaignRef: input.parentCampaignRef,
    title,
    shortTitle,
    emoji: input.emoji,
    version,
    description,

    rooms: input.rooms ?? [defaultChapterClearing(chapterRef)],
    entrySpoke: input.entrySpoke ?? {
      roomSlug: `${chapterRef}-clearing`,
      tileX: 10,
      tileY: 4,
    },
    exitConditions: input.exitConditions ?? [
      {
        type: 'create_bar',
        message: `You have completed ${shortTitle}. Your BAR has been added to your hand.`,
      },
    ],

    narrativePassages: input.narrativePassages ?? [],
    npcDialogueOverrides: input.npcDialogueOverrides ?? [],
    barCreationMoments: input.barCreationMoments ?? [
      {
        id: `${chapterRef}-bar-moment-1`,
        triggerAnchorId: `${chapterRef}-bar-moment-1`,
        promptText: `What insight does ${shortTitle} awaken in you?`,
        defaultMoveType: 'wakeUp',
      },
    ],

    milestone: input.milestone ?? {
      milestoneRef: `${chapterRef}-milestone`,
      title: `Players complete ${shortTitle}`,
      description: `At least one player creates a BAR in ${title}.`,
      rollupTo: {
        parentMilestoneRef: `${bookRef}-progress`,
        weight: 1 / 8, // default: 8 chapters share the book milestone equally
      },
      completionCriteria: {
        minBarsRequired: 1,
      },
    },

    visualStyle: input.visualStyle,
    wikiCallouts: input.wikiCallouts,
  }
}
