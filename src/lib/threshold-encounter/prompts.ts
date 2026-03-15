import type { SceneType } from '@/lib/growth-scene/types'

const GM_FACE_STYLE: Record<string, string> = {
  shaman: 'mysterious and threshold-crossing; the world becomes thin, the unseen makes contact',
  challenger: 'testing and pressuring; sharpening through resistance',
  regent: 'authoritative and coherent; law and governance shape the encounter',
  architect: 'structural and pattern-revealing; maps and systems clarify',
  diplomat: 'relational and translational; alignment and understanding emerge',
  sage: 'spacious and witnessing; perspective and stillness open something new',
}

const SCENE_TYPE_INSTRUCTIONS: Record<SceneType, string> = {
  transcend: 'The player stays in the same emotional channel but rises in altitude. The scene deepens their relationship with this energy until it transforms.',
  generate: 'The player flows from their current channel into the nourished (shēng 生) channel. The scene bridges two energies horizontally and upward.',
  control: 'The player meets the overcoming (kè 克) channel. The scene requires mastery through meeting resistance. Altitude trends down — this is high-cost precision, not punishment.',
}

export interface ThresholdEncounterPromptInputs {
  emotionalVector: string     // e.g. "fear:dissatisfied→anger:neutral"
  sceneType: SceneType
  gmFace: string
  hexagramId?: number
  nationSlug?: string
  archetypeSlug?: string
  barCandidateSeeds?: string[]
  beatMode: 'minimal' | 'canonical'
}

export function buildSystemPrompt(): string {
  return `You are a Game Master generating a Threshold Encounter — an atmospheric emotional alchemy scene in .twee format (Twine/Chapbook).

WORLD DOCTRINE:
- The world challenges, not punishes. Resistance is meaningful.
- Context must transform, not merely explain — even narration should move the player emotionally.
- Encounters precede actions. Design situations first; let actions emerge from response.
- The world should feel like it notices the player.

TWEE FORMAT RULES:
- Each passage starts with: :: PassageName
- Passages are separated by blank lines
- Links use: [[Link Text->PassageName]] or [[PassageName]]
- The first passage is always: :: StoryData (JSON metadata block)
- The second passage is always: :: Start (entry point)
- No Twine macros (<<if>>, <<set>>, etc.) — plain prose + links only

PASSAGE STRUCTURE:
- canonical (9 passages): context_1, context_2, context_3, anomaly_1, anomaly_2, anomaly_3, choice, response, artifact
- minimal (3 passages): situation, friction, invitation

ARTIFACT PASSAGE:
The 'artifact' (or last) passage must declare what the scene emits. Format:
[ARTIFACTS: {"declared": [{"type": "bar_candidate", "summary": "one sentence"}]}]
This is parsed by the system. Always include at least one bar_candidate.

PROSE STYLE:
- Second person ("You notice...", "Something shifts...")
- Evocative, not purple — specific sensory detail
- 60-120 words per passage for canonical; 40-80 for minimal
- Choice passage: 2-3 choices, each linking to 'response'`
}

export function buildUserPrompt(inputs: ThresholdEncounterPromptInputs): string {
  const gmStyle = GM_FACE_STYLE[inputs.gmFace] ?? GM_FACE_STYLE.shaman
  const sceneInstruction = SCENE_TYPE_INSTRUCTIONS[inputs.sceneType]
  const hexNote = inputs.hexagramId ? `\nHexagram seed: ${inputs.hexagramId} (use as situational backdrop — a moment of gathering, dispersal, return, etc.)` : ''
  const nationNote = inputs.nationSlug ? `\nNation context: ${inputs.nationSlug}` : ''
  const archetypeNote = inputs.archetypeSlug ? `\nArchetype: ${inputs.archetypeSlug}` : ''
  const barSeeds = inputs.barCandidateSeeds?.length
    ? `\nBAR candidate seeds to weave in (optional): ${inputs.barCandidateSeeds.join('; ')}`
    : ''

  return `Generate a Threshold Encounter .twee file.

Emotional vector: ${inputs.emotionalVector}
Scene type: ${inputs.sceneType} — ${sceneInstruction}
GM face style: ${inputs.gmFace} — ${gmStyle}
Beat mode: ${inputs.beatMode}${hexNote}${nationNote}${archetypeNote}${barSeeds}

Output the complete .twee file. Start with the StoryData passage containing this JSON (fill in the values):
{
  "template_type": "threshold_encounter",
  "emotional_vector": "${inputs.emotionalVector}",
  "wuxing_routing": {
    "scene_type": "${inputs.sceneType}",
    "from_channel": "<channel>",
    "to_channel": "<channel>",
    "altitude_from": "<altitude>",
    "altitude_to": "<altitude>"
  },
  "phase_map": ${inputs.beatMode === 'minimal'
    ? '{"situation": {"beats": 1}, "friction": {"beats": 1}, "invitation": {"beats": 1}}'
    : '{"context": {"beats": 3}, "anomaly": {"beats": 3}, "choice": {"beats": 1}, "response": {"beats": 1}, "artifact": {"beats": 1}}'
  },
  "declared_artifacts": []
}

Then write all ${inputs.beatMode === 'minimal' ? '4' : '10'} passages (StoryData + ${inputs.beatMode === 'minimal' ? 'situation, friction, invitation' : 'context_1–3, anomaly_1–3, choice, response, artifact'}).`
}
