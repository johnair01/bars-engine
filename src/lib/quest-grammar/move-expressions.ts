/**
 * Move Expressions — companion data to move-engine.ts
 *
 * Each canonical move has:
 * - secondRegisterName: a 2-5 word compression phrase that fires a felt sense before
 *   the player consciously processes the description. Bootstrap from game world lore;
 *   to be refined by the cultural substrate pipeline as community BARs accumulate.
 * - internal: I-register expression — what this move feels like in the body/psyche
 * - interpersonal: We-register expression — how it reads in relationship
 * - systemic: Its-register expression — what it produces in a room or community
 *
 * Inspired by Hearts Blazing's triple-context card design.
 * See: .specify/specs/deck-card-move-grammar/HEARTS_BLAZING_REVIEW.md
 * See: .specify/specs/deck-card-move-grammar/CARD_STYLE_GUIDE.md
 *
 * NOTE: secondRegisterNames are marked as bootstrap. They should be replaced
 * by the cultural substrate distillation pipeline as exemplary player BARs accumulate.
 * Control moves (wood_earth through water_fire) are highest priority for corpus refinement.
 */

export interface MoveExpression {
  /** 2-5 word compression phrase — fires felt sense before conscious processing. Bootstrap. */
  secondRegisterName: string
  /** I-register: internal/somatic experience when this move is live */
  internal: string
  /** We-register: interpersonal/relational read — what changes between people */
  interpersonal: string
  /** Its-register: systemic/community-visible impact — what an observer can name */
  systemic: string
}

export const MOVE_EXPRESSIONS: Record<string, MoveExpression> = {

  // ── Transcend moves (Energy +2) ─────────────────────────────────────────

  metal_transcend: {
    secondRegisterName: 'Walk the Cutting Edge',
    internal:
      'The fear is still in your chest and you are moving anyway. Not because it left — because you stopped waiting for it to. The next step reveals itself in the act of taking it.',
    interpersonal:
      'Something shifts in how others hold you in the room. They felt you hesitate, and then they felt you go. What you stepped through, they can now step through too.',
    systemic:
      'The thing that was blocking forward motion has been passed. The path behind you is now legible as a path. Others can see it was crossable because you crossed it.',
  },

  water_transcend: {
    secondRegisterName: 'The Tide Knows Its Shore',
    internal:
      'The grief stops being something to get through and becomes proof of what mattered. You feel the loss fully — and underneath it, intact, is the thing you were actually mourning for.',
    interpersonal:
      'You stop managing how the sadness lands on others. When you let it be what it is, the people around you can finally grieve alongside you instead of trying to fix you.',
    systemic:
      'What was obscured by loss becomes visible again — the value underneath the wound. The community can name what it was actually protecting all along.',
  },

  wood_transcend: {
    secondRegisterName: 'Root Before You Reach',
    internal:
      'The aliveness you felt stops being a mood and becomes a direction. You are not just enjoying this — you are choosing it, tending it, willing to be changed by it over time.',
    interpersonal:
      'Others feel the difference between your excitement and your commitment. You are not performing energy — you are offering rootedness. The room becomes more willing to grow because you are growing for real.',
    systemic:
      'A pattern that was intermittent becomes structural. The vitality you brought is now woven into how the work moves, not dependent on any single moment of inspiration.',
  },

  fire_transcend: {
    secondRegisterName: 'The Boundary Holds',
    internal:
      'The anger that has been burning finds its target precisely. Not explosion — precision. You feel the boundary leave your body as a declaration, and the heat behind it becomes clarity.',
    interpersonal:
      'What you name as unacceptable, lands. The people in the room receive the boundary not as attack but as truth — because you delivered it with full intention and nothing extra.',
    systemic:
      'Something that was being repeatedly crossed is no longer crossable in the same way. The room reorganizes around the line you drew. The culture has a new reference point it did not have before.',
  },

  earth_transcend: {
    secondRegisterName: 'Become the Floor',
    internal:
      'You stop reaching for the next thing to add. The steadiness you feel is not detachment — it is full presence without agenda. You become the thing in the room that is not moving.',
    interpersonal:
      'Others feel themselves orienting toward you without knowing why. You are not directing them — you are simply stable enough that the field around you stops spinning. People find their footing.',
    systemic:
      'The confusion that was circulating settles. Not because anyone solved the problem — because a reference point became available. The system finds its level the way water finds its level.',
  },

  // ── Generative moves — shēng cycle (Energy +1) ──────────────────────────

  wood_fire: {
    secondRegisterName: 'Say It Out Loud',
    internal:
      'Something that has been building in you for weeks finds your mouth. Your chest opens slightly — not relief exactly, but the particular aliveness of having let the private thing become real. You are committed now. It lands differently than when it was only yours.',
    interpersonal:
      'The people in the room hear you differently than they heard you before you said it. Something that was potential between you becomes a thread they can pull on. They know what to offer now.',
    systemic:
      "A direction appears in the space where there was only movement. The group's scattered energy finds a temporary north. Not because a plan was announced — because someone let the wood catch.",
  },

  fire_earth: {
    secondRegisterName: 'Let It Land',
    internal:
      'The doing is over and you are still. Not empty — receiving. You turn the experience over slowly, the way you might press something into soil. Something is changing from event into knowledge. You feel the difference between what you knew before and what you carry now.',
    interpersonal:
      'You stop performing the breakthrough and start living from it. The people around you notice you are no longer talking about what happened — you are different in the way you move through the conversation.',
    systemic:
      'What was produced by the activation does not dissipate. It is folded into how the group operates, how decisions get made, what gets taken for granted now. The heat has become ground.',
  },

  earth_metal: {
    secondRegisterName: 'Name What Is Load-Bearing',
    internal:
      'You say the thing that has weight and feel the weight transfer — out of your body and into the room. Not lighter exactly. More honest. You have been holding this; now you are holding it in the open, which is a different kind of holding.',
    interpersonal:
      "The conversation changes register. What was warm and circling becomes precise. No one is defensive — but everyone is more awake. The relationship just learned something about itself it already knew but had not named.",
    systemic:
      'The unspoken organizing principle of the room surfaces. Decisions that were slow become possible because everyone can now see what was actually at stake in them. The structure has not changed — it has become legible.',
  },

  metal_water: {
    secondRegisterName: 'Cut to What Matters',
    internal:
      'The sharp thing you found in the distillation does not stay sharp — it opens. Something you thought was a conclusion turns out to be a threshold. You do not know more than you did; you know differently. The clarity has a bottom now.',
    interpersonal:
      'You stop explaining what you found and start wondering together what it means. The precision that was clean and a little cold becomes something you both lean into. The conversation drops a register and something true becomes available.',
    systemic:
      "The insight that emerged from the group's discernment becomes part of how the group understands itself — not as a rule but as a story it carries about what matters here. The cut has found what it was always cutting toward.",
  },

  water_wood: {
    secondRegisterName: 'The Grief Fed Something',
    internal:
      'You notice you are leaning forward again. The depth has not gone anywhere — but it is behind you now, not underneath you. Something in you that was still is beginning to organize itself into direction. Not urgency. Readiness.',
    interpersonal:
      'The people who stayed with you through the quiet recognize something has shifted. You are present in a new way — not returned to who you were before, but oriented again. The depth is in you now; it is not where you are stuck.',
    systemic:
      'The group that held space through dormancy or difficulty finds itself with energy to spend. Not because the hard thing resolved — because the meaning that came from it became root structure. Something can grow from here.',
  },

  // ── Control moves — kè cycle (Energy -1, high-cost precision) ───────────
  // NOTE: These are NOT negative moves. -1 energy = deliberate cost to prevent larger loss.
  // Priority targets for cultural substrate corpus refinement.

  wood_earth: {
    secondRegisterName: 'Tend the Ground You Have',
    internal:
      'There is a moment when you feel the aliveness in you running ahead of what can hold it. You choose to stop extending and start rooting — not because the energy is wrong, but because you recognize that scatter and vitality feel identical from the inside until one of them collapses.',
    interpersonal:
      'Others notice you stop adding to the pile. You begin asking what is actually here before reaching for what could be next. The conversation gets slower and more load-bearing. Something that was diffuse becomes something people can stand on.',
    systemic:
      "The group's enthusiasm finds a container. What was a spreading charge becomes a shared foundation. The room does not lose the momentum — it converts it into something with edges, something that can be built from.",
  },

  fire_metal: {
    secondRegisterName: 'Cool Before You Cut',
    internal:
      'The heat is still in you — you are not cooling off, you are turning the heat toward something honest. You look directly at what your action produced, not what you hoped it would. The assessment does not deflate you. It sharpens you into something you could not have been before the risk.',
    interpersonal:
      'You return to the people involved and name what you actually see — not the version that protects the original impulse. This reads as accountability that does not collapse into apology. The relationship gets more precise because you got more precise.',
    systemic:
      'The pattern that was introduced by the bold action gets evaluated before it calcifies. What is worth keeping becomes clearer. The community does not have to carry the cost of unexamined momentum — the discernment was done by the person who had the most accurate information.',
  },

  earth_water: {
    secondRegisterName: 'Soften the Wall a Little',
    internal:
      'Something in you has been held in shape for a long time. You notice the holding is costing more than the structure is giving. You do not dissolve — you allow the current to move through what has been sealed. What was protected by rigidity begins to be protected by something more permeable and more true.',
    interpersonal:
      'The people around you feel you become available in a way that your groundedness had been preventing. It is not that you were absent — you were load-bearing in a way that left no room for what is actually moving in the room. The structure does not disappear; it becomes something people can feel as well as stand on.',
    systemic:
      "Information that had been stopped by settled certainty begins to flow again. The community's meaning-making gets fed by what was underneath the stability. What was useful as structure becomes useful as channel — the two functions were never in opposition.",
  },

  metal_wood: {
    secondRegisterName: 'Fear Has a Direction Now',
    internal:
      'The tangle of possible directions has become its own kind of paralysis — not for lack of energy but for too much of it going too many ways. The cut is not painful. It is clarifying. One direction becomes visible not because the others were wrong but because this one was always where the growth was actually reaching.',
    interpersonal:
      'Others see you stop hedging. Not because the fear is gone — because you found something underneath it worth moving toward. The decisiveness does not foreclose the relationship; it gives people something to accompany. Fear managed alone is isolating. Fear converted in front of others becomes an invitation.',
    systemic:
      "The group's tangled possibility-space gets pruned into something with direction. What was energy spent in all directions becomes movement with a vector. The community does not lose the options that were cut — it gains the momentum that the tangle was preventing.",
  },

  water_fire: {
    secondRegisterName: 'Sadness With a Spine',
    internal:
      'The grief does not need to be managed before it is useful — it needs to be fully met. When you stop trying to move past it and let it land completely, something underneath it becomes legible: what you are grieving mattered enough to protect what remains. The fire that rises is not hot the same way rage is hot. It knows what it is for.',
    interpersonal:
      'The people in the room feel something shift from diffuse sadness into named care. You are not performing recovery — you are showing what the loss actually meant by protecting what it was in service of. The boundary lands differently when others can feel the grief underneath it. It does not close them out. It tells them what is worth standing with.',
    systemic:
      'The community sees grief converted into something that holds a line — not from hardness but from the precision that only comes from genuine loss. What was at risk of becoming ambient sorrow or deferred rage finds its most useful form. The system does not lose the grief. It learns what the grief was always trying to protect.',
  },
}

/** Quick lookup helper */
export function getMoveExpression(moveId: string): MoveExpression | undefined {
  return MOVE_EXPRESSIONS[moveId]
}
