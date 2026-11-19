/**
 * Satisfied sentences and names for the ontology game's BAR claim. A frozen copy of
 * `stems[channel][altitude].satisfied` in content/ontology-game/game.jsx, so the server never
 * trusts a sentence the client sends. Regenerate only when the game's stems change.
 */
export const CLAIM_CHANNELS = ['anger', 'fear', 'sadness', 'joy', 'neutrality'] as const
export const CLAIM_ALTITUDES = ['magenta', 'red', 'amber', 'orange', 'green', 'teal'] as const
export type ClaimChannel = (typeof CLAIM_CHANNELS)[number]
export type ClaimAltitude = (typeof CLAIM_ALTITUDES)[number]

export const SATISFIED_NAMES: Record<ClaimChannel, string> = {
  'anger': 'Triumph',
  'fear': 'Wonder',
  'sadness': 'Poignance',
  'joy': 'Bliss',
  'neutrality': 'Peace'
}

export const SATISFIED_SENTENCES: Record<ClaimChannel, Record<ClaimAltitude, string>> = {
  "anger": {
    "magenta": "Presence blazes back open between us, and I move toward it, not against it.",
    "red": "I chose to move, and my force is doing exactly what I asked of it.",
    "amber": "The right order is restored, or I've rightly broken with the law that no longer deserves my loyalty.",
    "orange": "I see the mechanism now, and the heat cools into a plan that actually works.",
    "green": "The voice is in the room now, and the whole conversation is better for it.",
    "teal": "I see how I fit into the larger unfolding, and I move with it instead of bracing against it."
  },
  "sadness": {
    "magenta": "The presence comes back into reach, and I'm with what I love again.",
    "red": "I rebuild what's true about my power from what actually held, not from the image that broke.",
    "amber": "I've found my right relation to the group again, or I've knowingly chosen to stand apart from it.",
    "orange": "My values come into focus, and what I do finally matches what I actually care about.",
    "green": "I feel seen in what I care about, and I can see how everyone else holds it too.",
    "teal": "I see how this loss is teaching the whole system something it needed to learn."
  },
  "joy": {
    "magenta": "Aliveness floods back between us, and the boundary between me and what I love goes thin.",
    "red": "My force is live and animated again, and I feel my own capacity moving.",
    "amber": "I'm fully alive, and the order I answer to holds anyway — it was never actually against me.",
    "orange": "I understand what lets me be fully alive, and now I know how to get back here on purpose.",
    "green": "All of me is in the room now, seen and wanted, not just tolerated.",
    "teal": "I see exactly how my aliveness serves the larger pattern, and it stops feeling like a cost."
  },
  "fear": {
    "magenta": "The rupture holds without breaking me, and wonder opens up where the threat was.",
    "red": "I have the power to hold this boundary, even without needing to force anything through it.",
    "amber": "The sacred boundary holds, and I'm not the only one holding it up.",
    "orange": "I understand the limits of my own method, and that understanding is itself the ground I needed.",
    "green": "All the wisdom in the room is present and weighted rightly, and nothing had to be silenced to get there.",
    "teal": "I see that what refuses to integrate was already whole, and my need to integrate it was the only thing missing."
  },
  "neutrality": {
    "magenta": "I'm separate and held at the same time, and the ground has presence again.",
    "red": "My force is still mine, held in reserve, ready for the next real thing without needing to prove it now.",
    "amber": "I'm the ballast holding what's true, and I can trust that the order will carry what needs carrying.",
    "orange": "I'm the mirror the system uses to see itself, and the detached view is its own kind of peace.",
    "green": "I'm holding plural truths at once without collapsing any of them, and that container itself is alive.",
    "teal": "I see how the whole system is learning through exactly this, and the stillness turns out to be part of it."
  }
}
