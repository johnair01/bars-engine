/**
 * Deterministic threshold encounter templates — used when AI generation is unavailable.
 *
 * Keyed by (channel, sceneType). Each combination has multiple variants so the
 * player can "refresh" and get a different scene without an API call.
 *
 * Structure: Start → (2 choices) → Friction_A / Friction_B → Invitation → Artifact
 * The player makes meaningful choices that shape the encounter's tone.
 */

import type { EmotionChannel } from '@/lib/alchemy/types'
import type { SceneType } from '@/lib/growth-scene/types'

export interface EncounterTemplate {
  title: string
  twee: string
  storyData: string
}

type TemplateKey = `${EmotionChannel}:${SceneType}`

function sd(vector: string, sceneType: SceneType, from: string, to: string): string {
  return JSON.stringify({
    template_type: 'threshold_encounter',
    emotional_vector: vector,
    wuxing_routing: { scene_type: sceneType, from_channel: from, to_channel: to },
    phase_map: { situation: { beats: 1 }, friction: { beats: 2 }, invitation: { beats: 1 }, artifact: { beats: 1 } },
    declared_artifacts: [{ type: 'bar_candidate', summary: 'Reflection from this encounter' }],
  })
}

function t(
  storyData: string,
  start: string,
  cA: string, cB: string,
  fA: string, fB: string,
  dA: string, dB: string,
  invite: string,
  artifact: string,
): { twee: string; storyData: string } {
  return {
    storyData,
    twee: `:: StoryData
${storyData}

:: Start
${start}

[[${cA}->Friction_A]]
[[${cB}->Friction_B]]

:: Friction_A
${fA}

[[${dA}->Invitation]]
[[Step back and look again->Invitation]]

:: Friction_B
${fB}

[[${dB}->Invitation]]
[[Step back and look again->Invitation]]

:: Invitation
${invite}

[[Name what I found->Artifact]]

:: Artifact
${artifact}`,
  }
}

const TEMPLATES: Record<TemplateKey, EncounterTemplate[]> = {

  'anger:transcend': [{
    title: 'The Ember Wall',
    ...t(sd('anger:neutral→anger:satisfied', 'transcend', 'anger', 'anger'),
      'You stand before a wall of heat. Not flame — something older. The air itself resists you, pressing back against your chest. There is a boundary here that someone drew. Maybe you.',
      'Press into the heat', 'Examine the wall from a distance',
      'The wall does not thin. But your breathing has changed — slower, deeper. The anger hasn\'t left; it has become structural. It is holding something in place that needs holding.',
      'From here, you can see the wall\'s architecture. It is not random — it was built with purpose. Every stone placed by a moment when something mattered enough to defend.',
      'Let the fire become deliberate', 'Trace the architecture further',
      'The wall remains. But now you understand it differently. Not rage — architecture. This fire is not destroying. It is forging. The anger has become precision.',
      'Something crystallized in the heat. Not a resolution — a recognition. Your anger is protecting something that matters.\n\nWhat is it?',
    ),
  }],

  'anger:generate': [{
    title: 'Kindling into Stillness',
    ...t(sd('anger:neutral→neutrality:satisfied', 'generate', 'anger', 'neutrality'),
      'The fire is real. But you have been here before — the moment after the flare, when the landscape is lit up. You can see everything. For a moment, the whole field is visible.',
      'Follow the heat upward', 'Let it settle into the ground',
      'The anger rises — and at its peak, it shows you the entire landscape. Every injustice, every frustration, every unfinished thing. All illuminated at once. It is almost too much to hold.',
      'The heat softens into warmth. The edges blur. Something wider opens: a view from a hilltop where nothing is personal and everything is clear.',
      'Hold the panoramic view', 'Breathe into the warmth',
      'Fire nourishes Earth. Anger clarifies; neutrality absorbs what it reveals. The heat passes through you and becomes groundedness. You can hold what you see without burning.',
      'The fire showed you something that you can now hold calmly. A truth that no longer needs urgency — just acknowledgment.\n\nWhat did you see?',
    ),
  }],

  'anger:control': [{
    title: 'The Forge Meets Metal',
    ...t(sd('anger:neutral→fear:dissatisfied', 'control', 'anger', 'fear'),
      'You bring the fire forward. It is decisive, clear — something that needed to be said or done. But the world does not yield. There is something harder here. An edge you did not expect.',
      'Strike harder', 'Feel the resistance',
      'The strike lands — but the sound is not destruction. It is a bell. The resistance has a frequency. Something in the world is asking for precision, not force.',
      'The resistance is not another will. It is risk. The fear arrives not as weakness but as information: the cost is real. The anger must become precise or it will shatter.',
      'Find the precise point', 'Acknowledge the cost',
      'Fire overcomes Metal — but only with skill. Anger meets fear, and if you can hold both, the result is courage. Not recklessness. Not paralysis. The narrow path between.',
      'There is a high-cost action your anger has been circling. The fear clarified what is actually at stake.\n\nWhat precise move are you being called to make?',
    ),
  }],

  'joy:transcend': [{
    title: 'The Green Cathedral',
    ...t(sd('joy:neutral→joy:satisfied', 'transcend', 'joy', 'joy'),
      'There is sunlight through leaves. Not metaphorical — you can feel the warmth on your skin, the vibrancy. Something is growing and you are part of it. The game is alive.',
      'Climb higher into the canopy', 'Dig into the roots',
      'Higher up, the light intensifies. The joy expands — not just yours, but the joy of the system itself. The game playing itself through you. Everything connected, everything moving.',
      'The roots go deep. Somewhere underneath, there is compost — old work, old grief, old effort that fed this moment. The delight is earned and it knows it.',
      'Let the vitality become structural', 'Honor what composted into this',
      'Stay in the canopy. Let the joy deepen into something structural — not happiness, but vitality. The love of the game itself. Not what you get from it, but what you give to it.',
      'Something is growing here that wants your attention. Not a task — a living thing that thrives when you tend it.\n\nWhat is it?',
    ),
  }],

  'joy:generate': [{
    title: 'Delight Kindles Fire',
    ...t(sd('joy:neutral→anger:satisfied', 'generate', 'joy', 'anger'),
      'The delight is overflowing. Something worked — a connection landed, a creative spark caught. The energy rises and rises. It wants to move, to change things, to push.',
      'Let the energy build', 'Direct it toward something specific',
      'The joy becomes fierce. Not hostile — passionate. The boundary between delight and righteous anger dissolves. You care about this enough to fight for it.',
      'You aim the energy at the thing that needs changing. The joy becomes a vector — precise, warm, unstoppable. Not anger against. Anger for.',
      'Channel the passion', 'Name what you would fight for',
      'Wood feeds Fire. Delight nourishes righteous anger — the energy to change what must change. The joy did not disappear; it became fuel.',
      'Your delight found its edge. There is something you care about enough to protect, to fight for, to change the world around.\n\nWhat does your joy want to protect?',
    ),
  }],

  'joy:control': [{
    title: 'Growth Meets Ground',
    ...t(sd('joy:neutral→neutrality:dissatisfied', 'control', 'joy', 'neutrality'),
      'Everything is blooming. Ideas, connections, possibilities — the garden of the mind is exuberant. But not everything that grows should be kept. Some of this is vine, not fruit.',
      'Prune deliberately', 'Let the garden show you what matters',
      'The pruning is hard. Each branch you cut had potential. But the ones that remain stand taller, get more light. The choice was not loss — it was investment.',
      'You step back and watch. The garden arranges itself. Some things wilt naturally. Others reach for each other. The pattern was always there beneath the exuberance.',
      'Trust the shape that remains', 'Accept what wilted',
      'Wood overcomes Earth through root-breaking growth, but Earth reminds Wood of limits. The joy must choose its shape. One thing, done with your full vitality.',
      'The garden has spoken. Not everything that blooms deserves your energy. One thing emerged as the thing that matters most right now.\n\nWhat deserves your full vitality?',
    ),
  }],

  'neutrality:transcend': [{
    title: 'The Still Center',
    ...t(sd('neutrality:neutral→neutrality:satisfied', 'transcend', 'neutrality', 'neutrality'),
      'Everything is level. No urgency, no avoidance. You are in the middle of the field and the horizon is equidistant in every direction. This is not numbness — it is panoramic awareness.',
      'Widen the view further', 'Sink deeper into the stillness',
      'The panorama expands until you can see the whole board. Every player, every move, every pattern. From here, nothing is personal. Everything is information.',
      'The stillness deepens into something almost physical. The ground holds you. The sky holds you. You are the center of something that does not need you to push it.',
      'Rest in the overview', 'Trust the ground beneath you',
      'The center is not empty. It is the place from which all moves originate. From here, you can see the whole board. Not as a strategist — as a witness.',
      'The stillness revealed something that urgency had been hiding. A truth that only appears when you stop pushing.\n\nWhat became visible?',
    ),
  }],

  'neutrality:generate': [{
    title: 'Earth Yields Metal',
    ...t(sd('neutrality:neutral→fear:satisfied', 'generate', 'neutrality', 'fear'),
      'From the steady ground of presence, something glints. Not danger — possibility. The kind that costs something. You have been still long enough to notice what others rush past.',
      'Reach for the glint', 'Wait for it to reveal itself',
      'Your hand closes around something sharp. Not painful — precise. The fear is information: this opportunity is real, and it has edges. You cannot hold it carelessly.',
      'The glint moves closer on its own. As it resolves, you feel the weight of it. This is not abstract possibility. This is a door with a cost of entry.',
      'Accept the weight', 'Name the cost clearly',
      'Earth nourishes Metal. Stillness produces clarity about risk. The fear is a compass, not a cage. It points toward what matters enough to be dangerous.',
      'The stillness delivered something sharp and real. An opportunity with edges — something worth the risk.\n\nWhat opportunity has the stillness revealed?',
    ),
  }],

  'neutrality:control': [{
    title: 'Ground Absorbs Water',
    ...t(sd('neutrality:neutral→sadness:dissatisfied', 'control', 'neutrality', 'sadness'),
      'You hold the center. The view is clear. But clarity is not painless — from here you can see what is truly distant, what is truly lost, what cannot be reached by wishing.',
      'Look at what is distant', 'Look at what is gone',
      'The distance is real. Not metaphorical — someone or something you love is far away. The neutral gaze does not make it closer. It simply lets you see the space clearly.',
      'What is gone stays gone. But you can see its outline — the shape it left. The absence has a form, like a cast of something that was here and is not.',
      'Honor the distance', 'Honor the outline',
      'Earth overcomes Water — the ground absorbs the flood. But the ground gets wet. The neutrality holds the grief without drowning in it.',
      'The stillness showed you a truth that carries grief. Not dramatic — honest. Something you needed to see clearly.\n\nWhat truth did the stillness show you?',
    ),
  }],

  'fear:transcend': [{
    title: 'The Blade\'s Edge',
    ...t(sd('fear:neutral→fear:satisfied', 'transcend', 'fear', 'fear'),
      'The risk is real. You can feel it — the narrow margin, the stakes, the way the world sharpens when something matters. Your senses are heightened. You are more alive than you were five minutes ago.',
      'Lean into the sharpness', 'Breathe through the electricity',
      'The sharpness becomes clarity. Not calm — electric. You can see the exact shape of the risk, the exact shape of the reward. They are the same shape.',
      'The breathing slows the hum to a steady frequency. This is the zone — not comfortable, not overwhelming. Performance state. The fear is fuel, not friction.',
      'Step into the performance zone', 'Hold the frequency steady',
      'Fear at its peak is excitement. Not the absence of danger — the full presence of it, met with skill. You are ready.',
      'The fear transformed into readiness. Something you were afraid to begin now feels like the obvious next step.\n\nWhat are you ready to do?',
    ),
  }],

  'fear:generate': [{
    title: 'Risk Becomes Flow',
    ...t(sd('fear:neutral→sadness:satisfied', 'generate', 'fear', 'sadness'),
      'The fear has been your companion for a while now. You know its shape. But today it softens — not into comfort, but into something deeper. A tenderness behind the vigilance.',
      'Follow the tenderness', 'Ask the fear what it guards',
      'Behind the vigilance is a softness you didn\'t expect. The fear was protecting something delicate — something you care about so deeply that the thought of losing it was unbearable.',
      'The fear answers honestly: it guards something precious. Something whose loss would be not just inconvenient but genuinely grievable. The metal dissolves into water.',
      'Let the metal dissolve', 'Hold what was guarded',
      'Metal nourishes Water. Fear, followed to its source, reveals what we love enough to protect. The tenderness is not weakness — it is the reason the fear existed.',
      'The fear was guarding something precious all along. Something you love enough to be afraid of losing.\n\nWhat is the precious thing your fear has been guarding?',
    ),
  }],

  'fear:control': [{
    title: 'Metal Cuts Wood',
    ...t(sd('fear:neutral→joy:dissatisfied', 'control', 'fear', 'joy'),
      'The caution is warranted. You can see the risk clearly — too many commitments, too much growth without pruning. The joy has been running unchecked and something will break.',
      'Make the cut', 'Identify what must stay',
      'The cut is clean. Not cruel — necessary. The commitment falls away and the remaining ones breathe. There is space now. The fear was right: less is more.',
      'You see the core — the things that survive scrutiny, that matter when the excitement fades. They are fewer than you thought. And more important.',
      'Trust the fewer, deeper things', 'Release what was only excitement',
      'Metal overcomes Wood. Precision tempers exuberance. The joy that survives this cut is real — not enthusiasm, but something you\'d choose again sober.',
      'The fear pruned the garden and what remains is real. Not exciting — important.\n\nWhat needs to be released so the important things can thrive?',
    ),
  }],

  'sadness:transcend': [{
    title: 'The Deep Pool',
    ...t(sd('sadness:neutral→sadness:satisfied', 'transcend', 'sadness', 'sadness'),
      'The weight is real. Something is far away or changed or gone. You are not pretending otherwise. The water is deep here and you can see all the way to the bottom.',
      'Dive deeper', 'Float at the surface',
      'At the bottom there is something unexpected: clarity. The grief has settled like sediment and what remains is perfectly still. You can see everything that was, exactly as it was.',
      'Floating, you feel the water hold you. The sadness carries you instead of pulling you down. There is a gentleness here that you did not expect from grief.',
      'Let the clarity speak', 'Accept being carried',
      'Poignance is sadness at its summit. Not grief — recognition. The beauty of things precisely because they change. You are not losing. You are seeing clearly.',
      'The deep water showed you something clearly — something beautiful precisely because it changes.\n\nWhat do you see now that you could not before?',
    ),
  }],

  'sadness:generate': [{
    title: 'Water Feeds Wood',
    ...t(sd('sadness:neutral→joy:satisfied', 'generate', 'sadness', 'joy'),
      'The loss has been composting. Not quickly — grief moves at its own pace. But today something green pushes through. A shoot, unexpected, from the exact place where something was buried.',
      'Tend the new growth', 'Sit with the surprise',
      'The shoot is tender. You shelter it with your hands. It has the quality of things that cost something to arrive — stronger than ordinary growth because it fed on real loss.',
      'The surprise is the point. You did not expect life here. The grief did not promise a gift. And yet — something green, something new, something undeniably alive.',
      'Water the shoot', 'Name what composted into this',
      'Water nourishes Wood. Grief feeds the next season of vitality. The joy that emerges from sadness is the truest kind — earned, rooted, unbreakable.',
      'Something is growing from the place of loss. Not a replacement — something new. Something that could only exist because of what came before.\n\nWhat is growing from what you lost?',
    ),
  }],

  'sadness:control': [{
    title: 'Water Quenches Fire',
    ...t(sd('sadness:neutral→anger:dissatisfied', 'control', 'sadness', 'anger'),
      'The grief is here. And inside it — buried, denied — there is fire. Something was not just lost; it was taken. Or allowed. Or abandoned. The sadness has an edge it has been hiding.',
      'Follow the edge', 'Let the fire surface',
      'The edge leads to a specific moment. A choice someone made. A door someone closed. The grief is not abstract — it has a cause, and the cause has a face.',
      'The fire surfaces in waves. Not clean — tangled with tears. But real. Something in you refuses to only grieve. Something wants the world to be different than it is.',
      'Let the anger speak', 'Hold grief and fire together',
      'Water overcomes Fire — but sometimes fire needs to burn first. Sadness meets the anger underneath. They are not enemies. They are two responses to the same love.',
      'The grief found its fire. Not rage — refusal. Something in you will not accept what happened quietly.\n\nWhat does your grief refuse to accept?',
    ),
  }],
}

/**
 * Pick a deterministic template for the given channel + sceneType.
 * Uses a seed (default: current minute) to vary which variant is returned.
 */
export function pickTemplate(
  channel: EmotionChannel,
  sceneType: SceneType,
  seed?: number,
): EncounterTemplate {
  const key: TemplateKey = `${channel}:${sceneType}`
  const variants = TEMPLATES[key]
  if (!variants || variants.length === 0) {
    return TEMPLATES['neutrality:transcend'][0]
  }
  const s = seed ?? Math.floor(Date.now() / 60_000)
  return variants[s % variants.length]
}
