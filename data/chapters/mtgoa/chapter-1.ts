/**
 * MTGOA Chapter 1: The Call to Play
 *
 * Reference implementation for the chapter-spoke template.
 * Spoke 0 of the MTGOA Book/Game hub — "Answer the Call".
 *
 * Kotter Stage 1 / Archetype: Thunder / Domain: RAISE_AWARENESS
 * Predicted feelings: Poignance, Excitement
 *
 * This file is the authoritative content source for the chapter.
 * The seed script reads it and calls registerChapterSpoke() to persist it.
 *
 * Authors copying this for chapters 2–12:
 *   1. Copy this file to data/chapters/mtgoa/chapter-N.ts
 *   2. Change chapterRef, title, shortTitle, description, barCreationMoments, npcDialogueOverrides
 *   3. Run: npx tsx scripts/seed-chapter-spoke.ts mtgoa-chapter-N
 *
 * See: .specify/specs/chapter-spoke-template/spec.md
 */

import { createChapterSpoke } from '@/lib/chapter-spoke/factory'
import type { ChapterDefinition } from '@/lib/chapter-spoke/types'

export const chapter1: ChapterDefinition = createChapterSpoke({
  chapterRef: 'mtgoa-chapter-1',
  bookRef: 'mtgoa-book',
  orgRef: 'mtgoa-org',
  parentCampaignRef: 'bruised-banana',

  title: 'Chapter 1: The Call to Play',
  shortTitle: 'The Call to Play',
  emoji: '📞',
  version: 'v1',
  description:
    'You have already heard it — the faint signal, the ache that says "this could be better." ' +
    'Chapter 1 is about naming that signal, stepping across the threshold, and making your first move ' +
    'as a player in the game of allyship. This chapter sets everything that follows.',

  rooms: [
    {
      slug: 'mtgoa-chapter-1-clearing',
      name: 'Chapter 1 — The Threshold',
      layout: 'octagon',
      size: { width: 20, height: 20 },
      ambientPalette: 'twilight',
      anchors: [
        // Six face NPCs at compass positions — chapter 1 speaks with all 6
        { type: 'face_npc', tileX: 10, tileY: 4,  config: { face: 'shaman',     campaignRef: 'mtgoa-chapter-1', spokeIndex: 0 } },
        { type: 'face_npc', tileX: 16, tileY: 7,  config: { face: 'challenger', campaignRef: 'mtgoa-chapter-1', spokeIndex: 0 } },
        { type: 'face_npc', tileX: 16, tileY: 13, config: { face: 'architect',  campaignRef: 'mtgoa-chapter-1', spokeIndex: 0 } },
        { type: 'face_npc', tileX: 10, tileY: 16, config: { face: 'diplomat',   campaignRef: 'mtgoa-chapter-1', spokeIndex: 0 } },
        { type: 'face_npc', tileX: 4,  tileY: 13, config: { face: 'regent',     campaignRef: 'mtgoa-chapter-1', spokeIndex: 0 } },
        { type: 'face_npc', tileX: 4,  tileY: 7,  config: { face: 'sage',       campaignRef: 'mtgoa-chapter-1', spokeIndex: 0 } },
        // BAR creation moment at center
        {
          type: 'bar_moment',
          tileX: 10,
          tileY: 10,
          config: { barMomentId: 'mtgoa-chapter-1-bar-moment-1', label: 'Name the Call' },
        },
        // Wiki callout — orientation
        {
          type: 'wiki_callout',
          tileX: 13,
          tileY: 10,
          config: {
            label: 'What is Allyship?',
            linkPath: '/wiki/mtgoa-organization',
            contextNote: 'Read this if you want the larger frame before making your move.',
          },
        },
        // Exit south — back to MTGOA book hub clearing
        {
          type: 'exit_threshold',
          tileX: 10,
          tileY: 18,
          config: {
            label: 'Return to Book Hub',
            targetInstanceSlug: 'mastering-allyship',
            targetRoomSlug: 'mtgoa-clearing',
          },
        },
      ],
    },
  ],

  entrySpoke: {
    roomSlug: 'mtgoa-chapter-1-clearing',
    tileX: 10,
    tileY: 3,
  },

  exitConditions: [
    {
      type: 'create_bar',
      message:
        'You have answered the call. Your BAR has been added to your hand — ' +
        'it is the record of the first move you chose to make.',
    },
  ],

  barCreationMoments: [
    {
      id: 'mtgoa-chapter-1-bar-moment-1',
      triggerAnchorId: 'mtgoa-chapter-1-bar-moment-1',
      promptText:
        'What signal brought you to this work — and what is the ONE move you are willing to make right now?',
      defaultMoveType: 'wakeUp',
      barTypeHint: 'player_response',
    },
  ],

  npcDialogueOverrides: [
    {
      face: 'shaman',
      greeting:
        'You felt it — the splinter under your certainty, the whisper that things could be better. ' +
        'That whisper IS the call. Walk with me through the threshold and we will name what brought you here.',
      invitation: 'What part of the call wants to be honored first?',
    },
    {
      face: 'challenger',
      greeting:
        'You came to play. Good. Most people stay in the audience. The call is real and it asks ' +
        'something specific from you — let us cut through the hesitation and find your first move.',
      invitation: 'What is the move you have been avoiding making?',
    },
    {
      face: 'sage',
      greeting:
        '... you are here. That itself is the practice. Many hear the call and never enter the room. ' +
        'Let us look at the whole shape of why this moment found you.',
      invitation: 'What pattern brought you to this threshold?',
    },
    {
      face: 'regent',
      greeting:
        'Before a player can show up reliably, they need to understand the terms of the game. ' +
        'The call is real — but it is also a contract. Walk with me and we will name what you are committing to.',
      invitation: 'What is the commitment that would make this real for you?',
    },
    {
      face: 'architect',
      greeting:
        'Every game begins with an intake. You are at the threshold. Walk with me and we will map the call ' +
        'clearly — what it is asking for, what resources you have, and what first move builds toward the rest.',
      invitation: 'What design decision would you make right now about how you play this game?',
    },
    {
      face: 'diplomat',
      greeting:
        'Something in you already cares about this. I can feel it. The call to allyship is a call ' +
        'toward others — and it asks that you first be honest about where you stand. Walk with me.',
      invitation: 'What relationship does this call want you to tend first?',
    },
  ],

  milestone: {
    milestoneRef: 'mtgoa-chapter-1-milestone',
    title: 'Players answer the Call to Play',
    description:
      'At least one player creates a BAR in Chapter 1 — naming the signal that brought them ' +
      'to allyship work and the first move they are willing to make.',
    rollupTo: {
      parentMilestoneRef: 'mtgoa-book-progress',
      weight: 1 / 8,
    },
    completionCriteria: {
      minBarsRequired: 1,
    },
  },

  visualStyle: {
    paletteOverride: 'twilight',
    ambientHint: 'threshold-crossing',
  },

  wikiCallouts: [
    {
      triggerAnchorId: 'mtgoa-chapter-1-wiki-1',
      linkText: 'What is Allyship?',
      linkPath: '/wiki/mtgoa-organization',
      contextNote:
        'Read this if you want the larger frame before making your move. ' +
        'Chapter 1 works without it, but it helps you see where you are in the book.',
    },
  ],
})
