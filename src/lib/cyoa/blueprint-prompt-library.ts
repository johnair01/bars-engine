/**
 * Deterministic prompt lines keyed by blueprint / move / face — extends over time.
 * BAR titles/descriptions can be composed from these without AI.
 */
export const BLUEPRINT_PROMPT_SNIPPETS: Record<string, readonly string[]> = {
  move_wakeUp: ['What became visible that was hidden before?', 'Who can help you see the next step?'],
  move_cleanUp: ['What charge are you ready to metabolize?', 'What would unblock flow right now?'],
  move_growUp: ['What capacity are you growing next?', 'Which skill line matters for this campaign?'],
  move_showUp: ['What is the smallest honest action you can take?', 'Where will you show up this week?'],
  face_shaman: ['What mythic threshold are you standing on?', 'What wants to be witnessed without naming?'],
  face_challenger: ['What are you willing to test or contest?', 'Where does friction sharpen you?'],
  face_regent: ['What structure would serve the whole?', 'What order wants to be restored?'],
  face_architect: ['What leverage point unlocks the most downstream?', 'What systemic gap is costing the most?'],
  face_diplomat: ['Who else is affected by this moment?', 'What is the relational field asking for?'],
  face_sage: ['What is the meta-pattern here?', 'What would integrate all the parts into a coherent whole?'],
  // Combined face×move keys — used by portal emit nodes
  face_shaman_move_wakeUp: ['What became visible when you stepped in?', 'What threshold did you just cross?'],
  face_shaman_move_cleanUp: ['What ancestral or recurring pattern is active right now?', 'What wants to be composted, not carried?'],
  face_shaman_move_showUp: ['What is the offering you are bringing?', 'What ritual act would make this real?'],
  face_challenger_move_wakeUp: ['What truth are you willing to name right now?', 'What are others looking away from that you can see?'],
  face_challenger_move_cleanUp: ['What are you avoiding naming? Say it plainly.', 'What is actually in the way?'],
  face_challenger_move_showUp: ['What is the specific, real action you are committing to?', 'What would it mean to stop hedging here?'],
  face_regent_move_wakeUp: ["What is the lay of the land?", "What's actually available to you in this structure?"],
  face_regent_move_cleanUp: ['What structure or accountability is missing?', 'What role boundary has been crossed or blurred?'],
  face_regent_move_showUp: ['What does your role require of you here?', 'What responsibility are you fulfilling by showing up?'],
  face_architect_move_wakeUp: ['What leverage point do you see?', 'What one thing would unlock many things?'],
  face_architect_move_cleanUp: ['What is the structural cause of this friction?', 'What would a clean design fix?'],
  face_architect_move_showUp: ['What does this action unlock downstream?', 'Name the commitment and its systemic consequence.'],
  face_diplomat_move_wakeUp: ['Who or what is asking for your attention in this moment?', 'What is the relational field showing you?'],
  face_diplomat_move_cleanUp: ['What is the relational cost of this block?', 'Who else is affected by what is stuck?'],
  face_diplomat_move_showUp: ['Who is affected by whether you show up?', 'Name the commitment in terms of the people it serves.'],
  face_sage_move_wakeUp: ['What is the meta-pattern?', 'What is this moment an instance of?'],
  face_sage_move_cleanUp: ['What is completing and what is emerging?', 'What do you need to metabolize to move forward?'],
  face_sage_move_showUp: ['What is the commitment that integrates your current understanding?', 'What becomes possible because of it?'],
  default: ['What matters most in this beat?', 'What would make this choice real?'],
}

export function promptsForBlueprintKey(blueprintKey: string | undefined): readonly string[] {
  if (!blueprintKey) return BLUEPRINT_PROMPT_SNIPPETS.default
  return BLUEPRINT_PROMPT_SNIPPETS[blueprintKey] ?? BLUEPRINT_PROMPT_SNIPPETS.default
}
