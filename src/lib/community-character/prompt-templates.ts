/**
 * Community Character prompt template library.
 *
 * 21 prompts across 7 community types × 3 each.
 * These are the "who to bring" texts that appear on invite bingo squares.
 * Written in the voice of the Bruised Banana community — warm, specific, alive.
 *
 * Tags determine which prompts get selected for a given event.
 */
import type { PromptTemplate } from './types'

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // ─── MULTIPLIER (3) ────────────────────────────────────────────────────────
  // Spreads the invite; their yes brings other yeses.
  {
    id: 'multiplier-early-yes',
    text: 'Someone who says yes before they know the details',
    communityType: 'multiplier',
    relationalRole: 'multiplier',
    stretchLevel: 1,
    moveTypes: ['wakeUp', 'showUp'],
    eventTypes: ['dance', 'gathering', 'fundraiser', 'any'],
  },
  {
    id: 'multiplier-connector',
    text: 'Someone who introduces two people before the first hour is over',
    communityType: 'multiplier',
    relationalRole: 'multiplier',
    stretchLevel: 1,
    moveTypes: ['showUp', 'wakeUp'],
    eventTypes: ['gathering', 'dance', 'scheming', 'any'],
  },
  {
    id: 'multiplier-spreader',
    text: 'Someone who texts three friends right after saying yes',
    communityType: 'multiplier',
    relationalRole: 'multiplier',
    stretchLevel: 1,
    moveTypes: ['wakeUp'],
    eventTypes: ['dance', 'fundraiser', 'gathering', 'any'],
  },

  // ─── ANCHOR (3) ────────────────────────────────────────────────────────────
  // Holds the room; makes new people feel safe.
  {
    id: 'anchor-history-keeper',
    text: "Someone who knows what you've been building and why",
    communityType: 'anchor',
    relationalRole: 'anchor',
    stretchLevel: 1,
    moveTypes: ['showUp', 'cleanUp'],
    eventTypes: ['gathering', 'scheming', 'workshop', 'fundraiser', 'any'],
  },
  {
    id: 'anchor-welcomer',
    text: 'Someone who makes newcomers feel like they belong immediately',
    communityType: 'anchor',
    relationalRole: 'anchor',
    stretchLevel: 1,
    moveTypes: ['showUp'],
    eventTypes: ['dance', 'gathering', 'workshop', 'any'],
  },
  {
    id: 'anchor-steadier',
    text: "Someone whose calm makes bold moves feel safer",
    communityType: 'anchor',
    relationalRole: 'anchor',
    stretchLevel: 1,
    moveTypes: ['cleanUp', 'growUp'],
    eventTypes: ['scheming', 'workshop', 'gathering', 'any'],
  },

  // ─── NEWCOMER (3) ──────────────────────────────────────────────────────────
  // Needs a door — curious but hasn't crossed over yet.
  {
    id: 'newcomer-adjacent',
    text: "Someone from a neighboring world who hasn't crossed over yet",
    communityType: 'newcomer',
    relationalRole: 'newcomer',
    stretchLevel: 2,
    moveTypes: ['wakeUp'],
    eventTypes: ['dance', 'gathering', 'fundraiser', 'any'],
  },
  {
    id: 'newcomer-curious',
    text: "Someone who's been asking about this but hasn't taken the step",
    communityType: 'newcomer',
    relationalRole: 'newcomer',
    stretchLevel: 2,
    moveTypes: ['wakeUp', 'cleanUp'],
    eventTypes: ['dance', 'gathering', 'workshop', 'any'],
  },
  {
    id: 'newcomer-returning',
    text: "Someone who almost came before — this time the timing is right",
    communityType: 'newcomer',
    relationalRole: 'newcomer',
    stretchLevel: 2,
    moveTypes: ['wakeUp'],
    eventTypes: ['dance', 'gathering', 'any'],
  },

  // ─── BRIDGE (3) ────────────────────────────────────────────────────────────
  // Connects worlds; knows people you don't.
  {
    id: 'bridge-different-network',
    text: "Someone who knows people you don't",
    communityType: 'bridge',
    relationalRole: 'bridge',
    stretchLevel: 2,
    moveTypes: ['wakeUp', 'showUp'],
    eventTypes: ['gathering', 'fundraiser', 'scheming', 'any'],
  },
  {
    id: 'bridge-cross-community',
    text: 'Someone who moves between different communities naturally',
    communityType: 'bridge',
    relationalRole: 'bridge',
    stretchLevel: 2,
    moveTypes: ['showUp'],
    eventTypes: ['gathering', 'dance', 'fundraiser', 'any'],
  },
  {
    id: 'bridge-translator',
    text: "Someone who can explain what you're doing to people outside your circle",
    communityType: 'bridge',
    relationalRole: 'bridge',
    stretchLevel: 2,
    moveTypes: ['showUp', 'growUp'],
    eventTypes: ['fundraiser', 'workshop', 'gathering', 'any'],
  },

  // ─── WILDCARD (3) ──────────────────────────────────────────────────────────
  // Surprising fit; wouldn't obviously come but belongs here.
  {
    id: 'wildcard-unexpected-fit',
    text: "Someone whose presence would surprise everyone — in exactly the right way",
    communityType: 'wildcard',
    relationalRole: 'wildcard',
    stretchLevel: 2,
    moveTypes: ['wakeUp', 'showUp'],
    eventTypes: ['dance', 'gathering', 'any'],
  },
  {
    id: 'wildcard-skeptic',
    text: "Someone whose skepticism would be converted by actually being there",
    communityType: 'wildcard',
    relationalRole: 'wildcard',
    stretchLevel: 3,
    moveTypes: ['cleanUp', 'growUp'],
    eventTypes: ['gathering', 'workshop', 'scheming', 'any'],
  },
  {
    id: 'wildcard-outsider',
    text: "Someone from a completely different world who would immediately get it",
    communityType: 'wildcard',
    relationalRole: 'wildcard',
    stretchLevel: 2,
    moveTypes: ['wakeUp'],
    eventTypes: ['dance', 'gathering', 'fundraiser', 'any'],
  },

  // ─── STRETCH (3) ───────────────────────────────────────────────────────────
  // Hardest invite; most transformative if they show up.
  {
    id: 'stretch-reconnection',
    text: "Someone you've been meaning to reach out to — this is the reason",
    communityType: 'stretch',
    relationalRole: 'bridge',
    stretchLevel: 3,
    moveTypes: ['cleanUp', 'showUp'],
    eventTypes: ['dance', 'gathering', 'fundraiser', 'any'],
  },
  {
    id: 'stretch-admiration',
    text: "Someone whose work you admire but haven't approached yet",
    communityType: 'stretch',
    relationalRole: 'bridge',
    stretchLevel: 3,
    moveTypes: ['growUp', 'showUp'],
    eventTypes: ['scheming', 'workshop', 'fundraiser', 'any'],
  },
  {
    id: 'stretch-edge',
    text: "Someone who intimidates you a little but belongs here",
    communityType: 'stretch',
    relationalRole: 'wildcard',
    stretchLevel: 3,
    moveTypes: ['growUp', 'wakeUp'],
    eventTypes: ['dance', 'gathering', 'any'],
  },

  // ─── COLLABORATOR (3) ──────────────────────────────────────────────────────
  // Builds with you; turns conversations into plans. Weighted toward scheming/workshop.
  {
    id: 'collaborator-builder',
    text: "Someone who's building something adjacent to what you're doing",
    communityType: 'collaborator',
    relationalRole: 'bridge',
    stretchLevel: 2,
    moveTypes: ['growUp', 'showUp'],
    eventTypes: ['scheming', 'workshop', 'fundraiser'],
  },
  {
    id: 'collaborator-momentum',
    text: 'Someone who turns conversations into plans',
    communityType: 'collaborator',
    relationalRole: 'multiplier',
    stretchLevel: 2,
    moveTypes: ['growUp', 'wakeUp'],
    eventTypes: ['scheming', 'workshop'],
  },
  {
    id: 'collaborator-resource',
    text: 'Someone who knows how to make things actually happen',
    communityType: 'collaborator',
    relationalRole: 'anchor',
    stretchLevel: 2,
    moveTypes: ['cleanUp', 'growUp'],
    eventTypes: ['scheming', 'workshop', 'fundraiser'],
  },
]

const BY_ID: Record<string, PromptTemplate> = Object.fromEntries(
  PROMPT_TEMPLATES.map((p) => [p.id, p]),
)

export function getPromptTemplate(id: string): PromptTemplate | undefined {
  return BY_ID[id]
}

export function getPromptTemplates(ids: string[]): PromptTemplate[] {
  return ids.flatMap((id) => {
    const t = BY_ID[id]
    return t ? [t] : []
  })
}
