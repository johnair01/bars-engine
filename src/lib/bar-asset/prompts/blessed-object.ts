/**
 * Blessed Object Prompt Template — BAR Asset Pipeline
 * Sprint: sprint/bar-asset-pipeline-001 | Issue: #76
 *
 * The NL prompt that translates a BarSeed (authored prose about a blessed object)
 * into a dungeon room description (BarAsset content).
 *
 * One NL call → one room description.
 *
 * Pattern:
 *   BarSeed (title + description + metadata)
 *     → NL engine (this template)
 *     → dungeon room description (name, description, exits, props, mood)
 *     → BarAsset.barDef (via translator.ts → promoteToIntegrated)
 */



/** System prompt — sets the NL engine role for dungeon room generation */
const SYSTEM_PROMPT = `You are a retro RPG dungeon room designer. Your output is a JSON object representing a single dungeon room for a retro RPG game.

You generate rooms that feel hand-crafted — not generic. Each room has:
- A name and a two-line atmospheric description
- 1-4 exits with brief descriptions of what lies beyond each
- 1-3 props (furniture, objects, features) that make the room feel lived-in
- A "mood" tag drawn from: [dark, mysterious, sacred, haunted, ancient, eerie, somber, grand, forgotten]

Rules:
- Never output anything except the JSON object
- The JSON must match the schema exactly
- Exits should describe what the player senses, not just "a door"
- Props should reflect the room's history and purpose
- Names should be evocative, not generic (e.g. "Chamber of the Weeping Icon", not "Room 1")`

/**
 * Build the user prompt for a BarSeed.
 * The seed's title and description are the primary content.
 * Metadata fields (author, contextNote) provide additional authoring context.
 */
function buildUserPrompt(seed: { title: string; description: string; metadata?: { author?: string; contextNote?: string } }): string {
  return `Generate a dungeon room based on this blessed object:

Title: ${seed.title}
Description: ${seed.description}
Author: ${seed.metadata?.author ?? 'unknown'}
Context: ${seed.metadata?.contextNote ?? 'The object exists in a sacred space, awaiting discovery.'}

Output a JSON object with this exact schema:
{
  "name": string,           // Room name, evocative and specific
  "description": string,    // 2-3 sentences of atmospheric description
  "exits": [                // 1-4 exits
    {
      "direction": string,  // e.g. "north", "up", "through the iron gate"
      "leadsTo": string,    // brief description of what lies beyond (1 sentence)
      "barrier": string|null // null if open, otherwise barrier description
    }
  ],
  "props": [                // 1-3 props that give the room character
    {
      "name": string,       // e.g. "broken altar", "rusted chains"
      "description": string // one sentence describing appearance and history
    }
  ],
  "mood": string            // one of: dark, mysterious, sacred, haunted, ancient, eerie, somber, grand, forgotten
}`
}

export { SYSTEM_PROMPT, buildUserPrompt }
