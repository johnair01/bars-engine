/**
 * Archetype Influence Overlay v1 — Canonical profiles
 * Spec: .specify/specs/archetype-influence-overlay/spec.md
 */

import type { ArchetypeInfluenceProfile } from './types'

export const ARCHETYPE_PROFILES: ArchetypeInfluenceProfile[] = [
  {
    archetype_id: 'bold-heart',
    archetype_name: 'The Bold Heart',
    trigram: 'Heaven',
    inner_expression: 'Clarity of vision; sees the move before making it.',
    outer_expression: 'Acts without announcing; momentum is the communication.',
    developmental_spectrum: {
      young_forming: 'Acts before reading the room; mistakes speed for precision.',
      developed_full: 'Acts with earned creative conviction that others can trust.',
    },
    hexagram_position: {
      when_upper: 'Visible initiative and creative force expressing outward.',
      when_lower: 'Inner certainty, authorship, and refusal to wait for permission driving beneath.',
    },
    natural_opposition: {
      trigram: 'Earth',
      archetype_name: 'The Devoted Guardian',
    },
    agency_pattern: ['initiative', 'creative leadership', 'courageous beginning'],
    action_style: ['initiate a bold action'],
    reflection_style: ['reflect on the new path created'],
    integration_style: ['reflect on the new path created'],
    prompt_modifiers: ['What courageous step could open a new path here?'],
    quest_style_modifiers: ['leadership quests', 'first-move actions', 'initiative challenges'],
  },
  {
    archetype_id: 'danger-walker',
    archetype_name: 'The Danger Walker',
    trigram: 'Water',
    inner_expression: 'Sits with depth and complexity without needing to resolve it.',
    outer_expression: 'Moves through chaos; adapts form to the obstacle.',
    developmental_spectrum: {
      young_forming: 'Seeks danger for its own sake; mistakes chaos for depth.',
      developed_full: 'Goes deep because depth is where the answer is, then returns with what was found.',
    },
    hexagram_position: {
      when_upper: 'Visible uncertainty, risk, and movement through conditions that cannot be controlled.',
      when_lower: 'Depth, complexity, and the need to enter the unknown driving beneath.',
    },
    natural_opposition: {
      trigram: 'Fire',
      archetype_name: 'The Truth Seer',
    },
    agency_pattern: ['risk navigation', 'adaptation', 'depth exploration'],
    action_style: ['navigate a small controlled risk'],
    reflection_style: ['reflect on what the risk revealed'],
    integration_style: ['reflect on what the risk revealed'],
    prompt_modifiers: ['What small risk could safely reveal something new?'],
    quest_style_modifiers: ['risk navigation quests', 'fear exploration', 'uncertainty challenges'],
  },
  {
    archetype_id: 'truth-seer',
    archetype_name: 'The Truth Seer',
    trigram: 'Fire',
    inner_expression: 'Sees what is actually true in the situation before speaking it.',
    outer_expression: 'Illuminates; what was hidden becomes visible to the room.',
    developmental_spectrum: {
      young_forming: 'Truth without tact; illumination becomes exposure.',
      developed_full: 'Sees clearly and chooses what to illuminate and when.',
    },
    hexagram_position: {
      when_upper: 'Visible illumination, clarity, exposure, and discernment.',
      when_lower: 'The truth-motive beneath another expression.',
    },
    natural_opposition: {
      trigram: 'Water',
      archetype_name: 'The Danger Walker',
    },
    agency_pattern: ['illumination', 'clarity', 'truth revelation'],
    action_style: ['reveal or speak a truth'],
    reflection_style: ['record the clarity that emerged'],
    integration_style: ['record the clarity that emerged'],
    prompt_modifiers: ['What truth is asking to be illuminated?'],
    quest_style_modifiers: ['truth speaking quests', 'insight quests', 'clarity exercises'],
  },
  {
    archetype_id: 'still-point',
    archetype_name: 'The Still Point',
    trigram: 'Mountain',
    inner_expression: 'Enters genuine stillness; boundary begins as internal discernment.',
    outer_expression: 'Holds position in the world; refuses what should be refused.',
    developmental_spectrum: {
      young_forming: 'Frozen, not still; refusal comes from fear rather than discernment.',
      developed_full: 'Chooses stillness and holds position from genuine knowing.',
    },
    hexagram_position: {
      when_upper: 'Visible restraint, pause, boundary, and the authority to stop.',
      when_lower: 'Inner stillness and discernment about what must not move yet driving beneath.',
    },
    natural_opposition: {
      trigram: 'Lake',
      archetype_name: 'The Joyful Connector',
    },
    agency_pattern: ['stillness', 'boundaries', 'stability'],
    action_style: ['pause or hold a boundary'],
    reflection_style: ['observe what became clear through stillness'],
    integration_style: ['observe what became clear through stillness'],
    prompt_modifiers: ['What happens if you pause instead of reacting?'],
    quest_style_modifiers: ['meditative quests', 'boundary practice', 'grounding challenges'],
  },
  {
    archetype_id: 'subtle-influence',
    archetype_name: 'The Subtle Influence',
    trigram: 'Wind',
    inner_expression: 'Identifies the crack in the system and knows which direction to push.',
    outer_expression: 'Applies persistent gradual pressure; change accumulates invisibly.',
    developmental_spectrum: {
      young_forming: 'Invisible to the point of ineffectiveness; subtlety becomes avoidance.',
      developed_full: 'Persistent directional pressure that accumulates into transformation.',
    },
    hexagram_position: {
      when_upper: 'Visible subtlety, suggestion, pattern, and small pressures that become hard to ignore.',
      when_lower: 'Long directional pressure and persistent influence driving beneath.',
    },
    natural_opposition: {
      trigram: 'Thunder',
      archetype_name: 'The Decisive Storm',
    },
    agency_pattern: ['gradual change', 'persistent shaping', 'system influence'],
    action_style: ['attempt a small influence'],
    reflection_style: ['observe what shifted'],
    integration_style: ['observe what shifted'],
    prompt_modifiers: ['What small influence could begin shifting this system?'],
    quest_style_modifiers: ['habit changes', 'gentle persuasion', 'system nudges'],
  },
  {
    archetype_id: 'devoted-guardian',
    archetype_name: 'The Devoted Guardian',
    trigram: 'Earth',
    inner_expression: "Holds and processes others' needs internally before responding.",
    outer_expression: 'Grounding presence; support is enacted rather than explained.',
    developmental_spectrum: {
      young_forming: "Self-erases in service; holding space becomes absorbing others' reality.",
      developed_full: 'Devoted without dissolving; support is sustainable because it has boundaries.',
    },
    hexagram_position: {
      when_upper: 'Visible care, support, welcome, continuity, and conditions that let others act.',
      when_lower: 'The need to hold, receive, and stabilize driving beneath another expression.',
    },
    natural_opposition: {
      trigram: 'Heaven',
      archetype_name: 'The Bold Heart',
    },
    agency_pattern: ['support', 'stewardship', 'stability creation'],
    action_style: ['provide support or build structure'],
    reflection_style: ['reflect on what stability enabled'],
    integration_style: ['reflect on what stability enabled'],
    prompt_modifiers: ['What support could help this situation grow?'],
    quest_style_modifiers: ['care quests', 'stewardship challenges', 'resource building'],
  },
  {
    archetype_id: 'decisive-storm',
    archetype_name: 'The Decisive Storm',
    trigram: 'Thunder',
    inner_expression: 'Feels the charge building and knows when the moment is arriving.',
    outer_expression: 'Strikes; the system reorganizes around the action.',
    developmental_spectrum: {
      young_forming: 'Strikes before the moment has arrived; confuses urgency with timing.',
      developed_full: 'Perfect timing; disruption is surgical because the ground was ready.',
    },
    hexagram_position: {
      when_upper: 'Visible breakthrough, sudden change, interruption, and felt arrival of the moment.',
      when_lower: 'Stored charge and impulse toward decisive reorganization driving beneath.',
    },
    natural_opposition: {
      trigram: 'Wind',
      archetype_name: 'The Subtle Influence',
    },
    agency_pattern: ['sudden action', 'pattern disruption', 'breakthrough'],
    action_style: ['take a bold disruptive action'],
    reflection_style: ['observe the change triggered'],
    integration_style: ['observe the change triggered'],
    prompt_modifiers: ['What bold action would break this pattern?'],
    quest_style_modifiers: ['breakthrough quests', 'pattern disruption', 'shock actions'],
  },
  {
    archetype_id: 'joyful-connector',
    archetype_name: 'The Joyful Connector',
    trigram: 'Lake',
    inner_expression: 'Receives and reflects beauty; inner delight comes before sharing.',
    outer_expression: 'Opens exchange; joy becomes contagious through contact.',
    developmental_spectrum: {
      young_forming: 'Openness without boundary; delight becomes performance.',
      developed_full: 'Authentic exchange; joy is self-sustaining and connection deepens.',
    },
    hexagram_position: {
      when_upper: 'Visible invitation, exchange, delight, openness, and relational possibility.',
      when_lower: 'Relational appetite and desire for meaningful exchange driving beneath.',
    },
    natural_opposition: {
      trigram: 'Mountain',
      archetype_name: 'The Still Point',
    },
    agency_pattern: ['joy', 'connection', 'shared experience'],
    action_style: ['invite or create shared experience'],
    reflection_style: ['reflect on how connection changed the situation'],
    integration_style: ['reflect on how connection changed the situation'],
    prompt_modifiers: ['Who could share this experience with you?'],
    quest_style_modifiers: ['collaboration quests', 'social experiments', 'celebration quests'],
  },
]
