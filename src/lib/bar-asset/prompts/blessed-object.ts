/**
 * Blessed Object Prompt Template — BAR Asset Pipeline
 * Sprint: sprint/bar-asset-pipeline-001
 *
 * Natural language prompt for generating dungeon room descriptions
 * from blessed object content.
 */

import type { AuthoredContent } from '../translator'

export const SYSTEM_PROMPT = `You are a dungeon room designer for a tabletop RPG. Given a blessed object and its description, generate a richly detailed room description.`

export function buildUserPrompt(content: AuthoredContent): string {
  return `Describe a dungeon room built around this blessed object:

Title: ${content.title}
Description: ${content.description}

Respond with a JSON object with these exact fields:
{
  "name": "Room name",
  "description": "2-3 sentence vivid room description",
  "mood": "one-word mood",
  "exits": [
    { "direction": "north", "leadsTo": "corridor_1", "barrier": "iron door" }
  ],
  "props": [
    { "name": "Altar", "description": "Stone altar with ritual markings" }
  ]
}`
}
