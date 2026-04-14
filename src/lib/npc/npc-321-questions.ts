/**
 * NPC-Voiced 321 Question Banks — sharply delineated per NPC.
 *
 * Each NPC has distinct questions for the 3-2-1 shadow dialogue phases.
 * The questions reflect the NPC's personality, nation element, and developmental lens.
 *
 * Used by: NpcRitual321 component (embedded in adventure runner at ritual_321 passages)
 */

export interface Npc321Questions {
  /** Opening framing before the 321 begins */
  framing: string
  /** "It..." phase — observe externally */
  it: {
    instruction: string
    placeholder: string
  }
  /** "You..." phase — address directly */
  you: {
    instruction: string
    placeholder: string
  }
  /** "I..." phase — own as self */
  i: {
    instruction: string
    placeholder: string
  }
}

/**
 * Per-NPC question banks. Each NPC voices the 321 differently based on
 * their personality, element, and developmental lens.
 */
export const NPC_321_QUESTIONS: Record<string, Npc321Questions> = {
  // ── Ignis (Challenger / Fire) ── Direct, confrontational, fire metaphors
  ignis: {
    framing: 'The fire has revealed something. Now we go deeper. Speak to what you found — first as a thing outside you, then face to face, then as yourself.',
    it: {
      instruction: 'Describe what the fire revealed. Speak about it as something outside you — a presence, a force, a weight.',
      placeholder: 'It is a rage that has been sitting in my chest for years. It burns when...',
    },
    you: {
      instruction: 'Now speak directly TO it. Address this presence. What does your anger want you to DO?',
      placeholder: 'You want me to stop pretending everything is fine. You want me to...',
    },
    i: {
      instruction: 'Now own it. This is part of you. Speak as "I" — what are you ready to do with this fire?',
      placeholder: 'I am the part that refuses to be quiet. I need to...',
    },
  },

  // ── Kaelen (Shaman / Wood) ── Poetic, slow, growth metaphors
  kaelen: {
    framing: 'Something has come to the surface. Let us tend to it gently — first observe it like a seed in soil, then speak to it as a living thing, then let it speak through you.',
    it: {
      instruction: 'Describe what is growing. See it as something in the soil — a root, a tendril, a presence reaching for light.',
      placeholder: 'It is a quiet longing that has been underground for a long time. It reaches toward...',
    },
    you: {
      instruction: 'Now speak to it directly. What does this growing thing need from you?',
      placeholder: 'You have been patient. You need me to give you room to...',
    },
    i: {
      instruction: 'Let it speak through you. You are this growth. What do you know now?',
      placeholder: 'I am the part that never stopped reaching. I know that...',
    },
  },

  // ── Sola (Diplomat / Water) ── Gentle, relational, grief/care metaphors
  sola: {
    framing: 'Something precious has surfaced. Let us hold it with care — first see it as it is, then speak to it with tenderness, then let yourself be spoken through.',
    it: {
      instruction: 'Describe what you see. What is this sadness or longing? See it as something outside you — a river, a stone, a presence that weeps.',
      placeholder: 'It is a grief I have carried since... It looks like...',
    },
    you: {
      instruction: 'Speak to it gently. What does this sadness want you to know?',
      placeholder: 'You have been trying to tell me that... You want me to understand...',
    },
    i: {
      instruction: 'Now let it be you. You are this care, this depth. What is true?',
      placeholder: 'I am the part that loves too much to let go. I need to...',
    },
  },

  // ── Aurelius (Regent / Earth) ── Structured, formal, duty/balance metaphors
  aurelius: {
    framing: 'The scales have shown an imbalance. Let us examine it methodically — first observe the imbalance, then address what governs it, then take responsibility.',
    it: {
      instruction: 'Describe the imbalance you see. What duty or obligation is out of alignment? See it as a structure — a law, a contract, a broken agreement.',
      placeholder: 'It is an obligation I have been avoiding. The structure that broke is...',
    },
    you: {
      instruction: 'Address this imbalance directly. What does it require of you?',
      placeholder: 'You require me to be honest about... You need me to restore...',
    },
    i: {
      instruction: 'Now take ownership. You are the one who must restore order. What will you do?',
      placeholder: 'I am responsible for this. I will restore balance by...',
    },
  },

  // ── Vorm (Architect / Metal) ── Analytical, systems-thinking, design metaphors
  vorm: {
    framing: 'The system has revealed a fault. Let us trace it — first map the failure, then interrogate the root dependency, then redesign.',
    it: {
      instruction: 'Describe the system failure. What pattern keeps producing this result? See it as a blueprint with a flaw.',
      placeholder: 'It is a pattern where every time I try to... the same failure occurs because...',
    },
    you: {
      instruction: 'Address the flaw directly. What is the root dependency that this system relies on?',
      placeholder: 'You depend on my belief that... You break when I try to...',
    },
    i: {
      instruction: 'Now redesign. You are the architect of this system. What changes?',
      placeholder: 'I see now that the real constraint is... I will rebuild by...',
    },
  },

  // ── The Witness (Sage) ── Minimal, open, integrative
  witness: {
    framing: '...',
    it: {
      instruction: 'What do you see?',
      placeholder: 'It is...',
    },
    you: {
      instruction: 'What do you say to it?',
      placeholder: 'You are...',
    },
    i: {
      instruction: 'What is true?',
      placeholder: 'I am...',
    },
  },
}

/** Get 321 questions for an NPC. Falls back to Witness (generic). */
export function get321QuestionsForNpc(npcId: string): Npc321Questions {
  return NPC_321_QUESTIONS[npcId] ?? NPC_321_QUESTIONS.witness
}
