/**
 * Cultivation manuals — in-game data aligned with SPEC_DECK_MECHANICS.md
 * and the Allyship Deck V3 card library (MTGOA / WENDELL_ALLY_DECK_V3).
 *
 * Suit mapping (Inner Garden / poker):
 *   ♠ Spades  = Wake Up   — allyship "Wake Up" wave (listening / awareness)
 *   ♥ Hearts  = Clean Up  — allyship "Clean Up" wave (beliefs / processing)
 *   ♣ Clubs   = Grow Up   — allyship "Grow Up" wave (6-face capacity)
 *   ♦ Diamonds = Show Up — allyship "Show Up" wave (specific action)
 */

export const MANUAL_ARGYRAN_GATE_ID = 'argyran_gate';

export const SUIT = {
    wake: { id: 'wake', symbol: '\u2660', pillar: 'Wake Up', element: 'fire' },
    clean: { id: 'clean', symbol: '\u2665', pillar: 'Clean Up', element: 'water' },
    grow: { id: 'grow', symbol: '\u2663', pillar: 'Grow Up', element: 'metal' },
    show: { id: 'show', symbol: '\u2666', pillar: 'Show Up', element: 'wood' },
};

/**
 * Starter manual: 3♠ 3♥ 4♣ 3♦ — see SPEC_DECK_MECHANICS.md
 * allyshipSource: vault path for authors (see The Library/04 Quests/MTGOA/Allyship Decks/...)
 */
export const ARGYRAN_GATE_CARDS = [
    {
        id: 'the_witness',
        title: 'The Witness',
        suit: 'wake',
        unlockOrder: 1,
        allyshipSource: 'WENDELL_ALLY_DECK_CARDS_V3_WAKEUP_REVISED.md — Catch the override',
        recognition: 'Did you just catch yourself about to give advice — in a moment where your job was to witness, not solve?',
        move: 'Say back what you heard in one sentence. Nothing else.',
    },
    {
        id: 'shared_stillness',
        title: 'Shared Stillness',
        suit: 'clean',
        unlockOrder: 2,
        allyshipSource: 'Clean Up — Controller beliefs (nation voice)',
        recognition: 'Before you offered help — did a voice say you were not qualified to give this?',
        move: 'Name the belief. Then ask: who is benefitting from this story right now?',
    },
    {
        id: 'joy_in_company',
        title: 'Joy in Company',
        suit: 'show',
        unlockOrder: 3,
        allyshipSource: 'WENDELL_ALLY_DECK_CARDS_V3_SHOWUP.md',
        recognition: 'Did you just say "let me know if you need anything" — or are about to?',
        move: 'Make one specific offer. Name what you can actually do.',
    },
    {
        id: 'reflective_surface',
        title: 'Reflective Surface',
        suit: 'wake',
        unlockOrder: 4,
        allyshipSource: 'WENDELL_ALLY_DECK_CARDS_V3_WAKEUP_REVISED.md — Spot the smooth',
        recognition: 'Are you being very reasonable right now — and does it feel like effort?',
        move: 'Name one thing you did not say. Just notice it was there.',
    },
    {
        id: 'gardeners_patience',
        title: "The Gardener's Patience",
        suit: 'grow',
        unlockOrder: 5,
        allyshipSource: 'SPEC tutorial / cultivation loop',
        recognition: 'The fruit is not ready. Can you tend without forcing the season?',
        move: 'Water, wait, return. One more cycle of care without grasping.',
    },
    {
        id: 'shadow_integrated',
        title: 'Shadow Integrated',
        suit: 'clean',
        unlockOrder: 6,
        allyshipSource: 'Clean Up — inner work after difficulty',
        recognition: 'Did something you dislike about yourself just show up in the garden?',
        move: 'Name it without fixing it. Let the compost hold what you cannot eat yet.',
    },
    {
        id: 'catch_the_override',
        title: 'Catch the Override',
        suit: 'wake',
        unlockOrder: 7,
        allyshipSource: 'WENDELL_ALLY_DECK_CARDS_V3_WAKEUP_REVISED.md',
        recognition: 'The solve-impulse is rising — is this a witness moment?',
        move: 'Witness first. Solve only when invited.',
    },
    {
        id: 'name_the_belief',
        title: "Name the 'Not Good Enough' Voice",
        suit: 'clean',
        unlockOrder: 8,
        allyshipSource: 'WENDELL_ALLY_DECK_CARDS_V3_CLEANUP.md — Not good enough',
        recognition: 'Before you offered help — did a voice say you were not qualified?',
        move: "Name the belief. Then ask: who's benefitting from this story right now?",
    },
    {
        id: 'stay_with_it',
        title: 'Stay with It',
        suit: 'grow',
        unlockOrder: 9,
        allyshipSource: 'WENDELL_ALLY_DECK_CARDS_V3_GROWUP.md — Shaman: Stay with it',
        recognition: 'In the hard moment — are you fixing, fleeing, or just barely holding?',
        move: 'Stay with the felt sense one breath longer than is comfortable.',
    },
    {
        id: 'draw_the_line',
        title: 'Draw the Line',
        suit: 'grow',
        unlockOrder: 10,
        allyshipSource: 'WENDELL_ALLY_DECK_CARDS_V3_GROWUP.md — Challenger',
        recognition: 'Did you just say yes when you meant no — or are about to?',
        move: 'Name one thing you will not do. Say it clearly. No essay, no apology.',
    },
    {
        id: 'hold_the_structure',
        title: 'Hold the Structure',
        suit: 'grow',
        unlockOrder: 11,
        allyshipSource: 'WENDELL_ALLY_DECK_CARDS_V3_GROWUP.md — Regent',
        recognition: 'Have you been improvising — showing up when it is convenient, disappearing when it is not?',
        move: 'Name one commitment you made — and one small thing that proves you will keep it.',
    },
    {
        id: 'make_specific_offer',
        title: 'Make a Specific Offer',
        suit: 'show',
        unlockOrder: 12,
        allyshipSource: 'WENDELL_ALLY_DECK_CARDS_V3_SHOWUP.md',
        recognition: 'Did you just say "let me know if you need anything"?',
        move: 'Make one specific offer. Name what you can actually do. Give them something to say yes or no to.',
    },
    {
        id: 'check_capacity_first',
        title: 'Check Your Capacity First',
        suit: 'show',
        unlockOrder: 13,
        allyshipSource: 'WENDELL_ALLY_DECK_CARDS_V3_SHOWUP.md',
        recognition: 'Before you offered — did you check whether you actually had the spoons for this?',
        move: 'Name what you can actually give right now. Not what you wish you could.',
    },
];

export const ARGYRAN_GATE_MANUAL = {
    id: MANUAL_ARGYRAN_GATE_ID,
    name: 'Argyran Gate',
    trigram: 'Lake',
    nation: 'Argyra',
    cardCount: 13,
    cards: ARGYRAN_GATE_CARDS,
};

export function getSuitInfo(suitId) {
    return SUIT[suitId] || null;
}
