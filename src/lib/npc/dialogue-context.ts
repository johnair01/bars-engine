/**
 * NPC Dialogue Context — campaign-aware NPC greetings.
 *
 * The 6 named NPCs (Ignis, Kaelen, Sola, Aurelius, Vorm, Witness) are universal characters
 * that appear in every campaign's spoke intro rooms. Their *core identity* never changes,
 * but their *framing* of allyship/cultivation work shifts depending on which campaign and
 * which spoke the player encounters them in.
 *
 * Lookup precedence (most specific wins):
 *   1. (campaignRef, spokeIndex, faceKey) — per-spoke override
 *   2. (campaignRef, faceKey)             — campaign-wide framing
 *   3. NPC default greeting               — fallback
 *
 * This is the prototype implementation of the "NPC dialogue context per campaign per spoke"
 * dependency surfaced during MTGOA design. Authoring is currently in TypeScript data; future
 * iterations may move to DB-backed authoring per the campaign template system.
 */

import type { GameMasterFace } from '@/lib/quest-grammar/types'

export interface NpcDialogueEntry {
    /** The NPC's spoken greeting in this context. */
    greeting: string
    /**
     * Optional invitation prompt — what the NPC asks the player to do
     * (e.g. "What move do you want to make?"). Falls back to a generic invitation
     * if omitted.
     */
    invitation?: string
}

/** Per-spoke greeting overrides keyed by `(campaignRef, spokeIndex, face)`. */
const PER_SPOKE_DIALOGUE: Record<string, Record<number, Partial<Record<GameMasterFace, NpcDialogueEntry>>>> = {
    'mastering-allyship': {
        // Spoke 0 — Answer the Call
        0: {
            shaman: {
                greeting:
                    'You felt it — the splinter under your certainty, the whisper that things could be better. That whisper IS the call. Walk with me through the threshold and we will name what brought you here.',
                invitation: 'What part of the call wants to be honored first?',
            },
            challenger: {
                greeting:
                    'You came to play. Good. Most people stay in the audience. The call is real and it asks something specific from you — let us cut through the hesitation and find your first move.',
                invitation: 'What is the move you have been avoiding making?',
            },
            sage: {
                greeting:
                    '... you are here. That itself is the practice. Many hear the call and never enter the room. Let us look at the whole shape of why this moment found you.',
                invitation: 'What pattern brought you to this threshold?',
            },
        },
    },
    // Future campaigns add their per-spoke overrides here.
}

/**
 * Campaign-wide greetings (used when no per-spoke override exists for a face).
 * These set the tonal register of an NPC across an entire campaign.
 */
const PER_CAMPAIGN_DIALOGUE: Record<string, Partial<Record<GameMasterFace, NpcDialogueEntry>>> = {
    'mastering-allyship': {
        challenger: {
            greeting:
                'Allyship needs your fire — but unmetabolized fire burns the wrong things. Walk with me. We will name what burns, find the move only you can make, and turn intensity into a quest worth completing.',
            invitation: 'What move do you want to make in your allyship today?',
        },
        shaman: {
            greeting:
                'Something in you is becoming. The call to allyship is not a duty — it is a threshold. Walk with me and we will mark the crossing properly. The Inner Child remembers why you started caring.',
            invitation: 'What move would honor where you are right now?',
        },
        diplomat: {
            greeting:
                'I see you carrying something heavy — care that has not yet learned to sustain itself. Walk with me. We will weave the structures that let your allyship last beyond your willingness to burn.',
            invitation: 'What kind of care wants to move through you today?',
        },
        regent: {
            greeting:
                'Before you can be a reliable ally, we need clear roles and clear terms. Walk with me. We will name what role you are playing, what you are committing to, and what you are not.',
            invitation: 'What move would you make if your role were clear?',
        },
        architect: {
            greeting:
                'Allyship is a system you can design — not a feeling you have to perform. Walk with me. Let me show you the blueprint, and let us build the move that makes the next move easier.',
            invitation: 'What move would compound into a system over time?',
        },
        sage: {
            greeting:
                '... You are in the game. That alone changes things. Walk with me and we will see the whole pattern — why this campaign found you, what you are becoming, what wants to be made.',
            invitation: 'Which move would the integrated version of you choose?',
        },
    },
    // Bruised Banana could be added here if we want to override the legacy hardcoded greetings.
}

/** NPC default greetings (fallback when no campaign override exists). */
const NPC_DEFAULT_DIALOGUE: Partial<Record<GameMasterFace, NpcDialogueEntry>> = {
    challenger: {
        greeting:
            'You carry fire in you. I can see it. Walk with me and we will name what burns, cut through what binds you, and turn your intensity into purpose.',
    },
    shaman: {
        greeting:
            'Something is growing beneath you. I can feel it. Walk with me and we will find the ritual that your spirit needs — a bridge between what was and what is becoming.',
    },
    diplomat: {
        greeting:
            'I see something heavy in you. May I sit with you? Walk with me and we will weave the connections that sustain you — care for others is care for yourself.',
    },
    regent: {
        greeting:
            'Before we proceed, let us establish the terms of this exchange. Walk with me and we will build the structure that holds your growth — duty first, then freedom.',
    },
    architect: {
        greeting:
            'Let me see the system you are stuck in. Walk with me and we will reveal the stakes, draft the blueprint, and build something that lasts.',
    },
    sage: {
        greeting:
            '... I am here. Walk with me and I will help you see the whole — the patterns beneath the patterns, the integration that holds everything together.',
    },
}

const DEFAULT_INVITATION = 'What move do you want to make?'

/**
 * Resolve the appropriate dialogue for an NPC encounter, given the campaign context.
 *
 * Falls through three layers (most specific first):
 *   1. Per-spoke override → 2. Campaign-wide framing → 3. NPC default
 *
 * Always returns a valid dialogue entry (never null).
 */
export function resolveNpcDialogue(input: {
    face: GameMasterFace
    campaignRef?: string
    spokeIndex?: number
}): NpcDialogueEntry {
    const { face, campaignRef, spokeIndex } = input

    // Layer 1: per-spoke override
    if (campaignRef !== undefined && spokeIndex !== undefined) {
        const perSpoke = PER_SPOKE_DIALOGUE[campaignRef]?.[spokeIndex]?.[face]
        if (perSpoke) {
            return {
                greeting: perSpoke.greeting,
                invitation: perSpoke.invitation ?? DEFAULT_INVITATION,
            }
        }
    }

    // Layer 2: campaign-wide framing
    if (campaignRef !== undefined) {
        const perCampaign = PER_CAMPAIGN_DIALOGUE[campaignRef]?.[face]
        if (perCampaign) {
            return {
                greeting: perCampaign.greeting,
                invitation: perCampaign.invitation ?? DEFAULT_INVITATION,
            }
        }
    }

    // Layer 3: NPC default
    const fallback = NPC_DEFAULT_DIALOGUE[face]
    return {
        greeting: fallback?.greeting ?? '',
        invitation: fallback?.invitation ?? DEFAULT_INVITATION,
    }
}
