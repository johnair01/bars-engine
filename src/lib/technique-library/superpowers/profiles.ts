/**
 * Superpower profiles — the per-superpower vocabulary the deck generator composes
 * 60 cards from (5 moves × 6 levels × 2 aspects).
 * Spec: .specify/specs/superpower-move-decks/spec.md
 *
 * Each profile is the orienting material (gift + shadow) plus a verb/object phrase
 * for each BasicMove, in an inner (self-defense) and outer (help-others) form.
 * The generator (grid.ts) crosses these with the six levels (Shaman→Sage).
 * This is the curation surface: refine a superpower by editing its rows here, or
 * override individual cells later (mirrors the base deck's AUTHORED pattern).
 */

import type { Superpower, BasicMove } from '../vocabulary'

export interface SuperpowerRow {
  /** Imperative verb for this move in this superpower's voice. */
  verb: string
  /** Self-directed object phrase (inner aspect). */
  inner: string
  /** For-others object phrase (outer aspect). */
  outer: string
}

export interface SuperpowerProfile {
  key: Superpower
  label: string
  /** Full descriptive gift (for display). */
  gift: string
  /** Short phrase used in composed essences. */
  giftShort: string
  /** The overuse shadow (used as each card's shadow-check line). */
  shadow: string
  rows: Record<BasicMove, SuperpowerRow>
}

export const SUPERPOWER_PROFILES: Record<Superpower, SuperpowerProfile> = {
  strategist: {
    key: 'strategist',
    label: 'The Strategist',
    gift: 'Clarity in complexity — the cartographer who finds pattern, bottleneck, and sequence.',
    giftShort: 'clarity in complexity',
    shadow: 'the Detached Planner — mapping instead of acting.',
    rows: {
      wake_up: { verb: 'See', inner: 'your own overwhelm honestly', outer: 'the real shape of the problem' },
      open_up: { verb: 'Take in', inner: 'the discomfort of not yet knowing', outer: 'the messy data others avoid' },
      clean_up: { verb: 'Cut', inner: 'the noise in your own head', outer: 'the problem down to its leverage' },
      grow_up: { verb: 'Sharpen', inner: 'your read of patterns', outer: 'the team’s shared map' },
      show_up: { verb: 'Name', inner: 'your next right step', outer: 'the path so others can walk it' },
    },
  },
  connector: {
    key: 'connector',
    label: 'The Connector',
    gift: 'Relational gravity — the pull that brings people into each other’s orbit.',
    giftShort: 'relational gravity',
    shadow: 'the Overextended Hub — everything routing through you.',
    rows: {
      wake_up: { verb: 'Notice', inner: 'your own pull toward people', outer: 'the threads already in the room' },
      open_up: { verb: 'Receive', inner: 'the room without absorbing it', outer: 'what each person is reaching for' },
      clean_up: { verb: 'Clear', inner: 'your need to be the hub', outer: 'the static between people' },
      grow_up: { verb: 'Widen', inner: 'your capacity to hold ties', outer: 'the circle of who belongs' },
      show_up: { verb: 'Make', inner: 'one tie you will tend', outer: 'the introduction that matters' },
    },
  },
  escape_artist: {
    key: 'escape_artist',
    label: 'The Escape Artist',
    gift: 'Honoring the wisdom of fear — finding the exit, the trapdoor, the well-timed retreat.',
    giftShort: 'the wisdom of fear',
    shadow: 'the Perpetual Vanisher — leaving before it’s time.',
    rows: {
      wake_up: { verb: 'Notice', inner: 'what your fear is protecting', outer: 'the trap closing on someone' },
      open_up: { verb: 'Feel', inner: 'the fear without obeying it', outer: 'another’s need to get out' },
      clean_up: { verb: 'Sort', inner: 'wise retreat from mere flight', outer: 'the false exit from the real one' },
      grow_up: { verb: 'Build', inner: 'your tolerance for staying', outer: 'more ways out than one' },
      show_up: { verb: 'Open', inner: 'the exit you actually need', outer: 'a door for someone else' },
    },
  },
  disruptor: {
    key: 'disruptor',
    label: 'The Disruptor',
    gift: 'Interruption — breaking stagnation and protecting integrity over harmony.',
    giftShort: 'clean interruption',
    shadow: 'the Demolisher — rupture with no repair.',
    rows: {
      wake_up: { verb: 'Notice', inner: 'your own urge to break things', outer: 'the stagnation no one names' },
      open_up: { verb: 'Feel', inner: 'the anger as information', outer: 'the cost the pattern is hiding' },
      clean_up: { verb: 'Forge', inner: 'the heat into a clean aim', outer: 'rupture pointed toward repair' },
      grow_up: { verb: 'Temper', inner: 'your timing and aim', outer: 'the group’s tolerance for change' },
      show_up: { verb: 'Break', inner: 'your own complicity', outer: 'the pattern, then repair it' },
    },
  },
  alchemist: {
    key: 'alchemist',
    label: 'The Alchemist',
    gift: 'Turning heavy, messy emotion into fuel.',
    giftShort: 'emotional transmutation',
    shadow: 'the Sponge — absorbing what isn’t yours (or the Detached Observer who won’t feel at all).',
    rows: {
      wake_up: { verb: 'Notice', inner: 'the charge in your body', outer: 'the emotion running the room' },
      open_up: { verb: 'Welcome', inner: 'the feeling without drowning', outer: 'what others cannot yet hold' },
      clean_up: { verb: 'Transmute', inner: 'your own stuck charge', outer: 'the field’s stuck emotion' },
      grow_up: { verb: 'Strengthen', inner: 'your filtration — “is this mine?”', outer: 'the group’s capacity to feel' },
      show_up: { verb: 'Channel', inner: 'the fuel into one act', outer: 'the charge into shared momentum' },
    },
  },
  storyteller: {
    key: 'storyteller',
    label: 'The Storyteller',
    gift: 'Poignance — weaving loss into meaning and grief into belonging.',
    giftShort: 'poignance — loss into meaning',
    shadow: 'the Performer — spectacle over truth.',
    rows: {
      wake_up: { verb: 'Notice', inner: 'the story you are already telling', outer: 'the meaning trying to surface' },
      open_up: { verb: 'Feel', inner: 'the grief beneath the story', outer: 'what this loss means to others' },
      clean_up: { verb: 'Find', inner: 'your own true meaning first', outer: 'the thread from loss to belonging' },
      grow_up: { verb: 'Deepen', inner: 'your honesty over performance', outer: 'the shared story’s roots' },
      show_up: { verb: 'Name', inner: 'what this means to you', outer: 'what this means, for the room' },
    },
  },
  coach: {
    key: 'coach',
    label: 'The Coach',
    gift: "Calling people up — reminding them of the power they've forgotten and the level they've outgrown.",
    giftShort: 'calling people up',
    shadow: 'the Taskmaster — dragging instead of calling up, creating dependence.',
    rows: {
      wake_up: { verb: 'Notice', inner: "the level you've outgrown", outer: "the power they've forgotten they have" },
      open_up: { verb: 'Receive', inner: 'your own resistance to being called up', outer: 'what they are capable of, not just what they are doing' },
      clean_up: { verb: 'Clear', inner: 'the story keeping you on a dead level', outer: 'the story that keeps them small' },
      grow_up: { verb: 'Build', inner: 'your capacity to call up without dragging', outer: 'their next level, at their pace' },
      show_up: { verb: 'Call', inner: 'yourself up to the next level', outer: 'them up — name the level and the why' },
    },
  },
}
