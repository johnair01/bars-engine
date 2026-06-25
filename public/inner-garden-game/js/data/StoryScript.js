/**
 * StoryScript — All dialog, scenes, and narrative data in one place.
 * Scene Manager reads these to drive branching story.
 * 
 * Scene structure:
 *   id        — unique scene identifier
 *   speaker   — name displayed in dialog
 *   speakerColor — hex color for name
 *   text      — dialog text (\n for line breaks)
 *   style     — 'inner' | 'npc' | 'system' | 'journal'
 *   onEnter   — { setFlags: {...}, giveTool: 'id', startQuest: 'id' } — fires when scene starts
 *   choices   — array of { text, action|nextScene, conditions? }
 *   condition — { flags: { key: value, ... }, hasTool: 'id', notHasTool: 'id' }
 */

export const StoryChapters = {
    prologue: [
        {
            id: 'welcome',
            speaker: '✦ Inner Voice',
            speakerColor: '#e8c88a',
            text: 'Welcome, cultivator.\n\nThe Inner Garden is a place where emotions become seeds,\nseeds become plants, and plants bear Enlightenment Fruit.\n\nHere is your path:\n  1. Record a BAR — Behavior, Activation, Result (press J)\n  2. That truth becomes a card in your deck and a seed in your soil\n  3. Meditate (hold M) to boost seed quality\n  4. Plant seeds in garden plots\n  5. Water and nurture them to harvest\n\nYour first step: press J to open the BAR.',
            style: 'inner',
            onEnter: { setFlags: { tutorial_started: true } },
            choices: [
                { text: '✧ Open BAR capture (J)', action: 'open_journal' },
                { text: 'Find Master Wu by the temple', nextScene: 'wu_intro' }
            ]
        },
        {
            id: 'wu_intro',
            speaker: 'Master Wu',
            speakerColor: '#c8a96e',
            text: 'Ah, welcome cultivator. I am Master Wu, keeper of this garden.\n\nI see you are new to the path. Let me explain:\n\nWhen you feel something strongly — joy, fear, anger, shame — write it as a BAR: what you did, what activated it, what resulted.\n\nEach BAR becomes a card you can channel, and a seed you can plant.\n\nThe fruit transforms you. That is the cycle.',
            style: 'npc',
            choices: [
                { text: 'How do I write a BAR?', nextScene: 'wu_journal_help' },
                { text: 'What is a cultivation manual?', nextScene: 'wu_manual_bridge' },
                { text: 'I understand', nextScene: 'wu_back_to_start' }
            ]
        },
        {
            id: 'wu_manual_bridge',
            speaker: 'Master Wu',
            speakerColor: '#c8a96e',
            text: 'In Calrunia, techniques are collected into **manuals** — thirteen moves that hang together like a teaching.\n\nYour first manual is the **Argyran Gate**: Wake Up, Clean Up, Grow Up, and Show Up — the same four gates many allies learn in the outer world.\n\nOpen the menu (I) and the **Manual** tab to read each technique. The Recognition lines are questions a serious ally asks in the moment; the Moves are what you practice.\n\nHarvests will one day unlock these as true cards. For now, study the gate.',
            style: 'npc',
            choices: [
                { text: 'How do I write a BAR?', nextScene: 'wu_journal_help' },
                { text: 'I will open the Manual tab', nextScene: 'wu_back_to_start' }
            ]
        },
        {
            id: 'wu_journal_help',
            speaker: 'Master Wu',
            speakerColor: '#c8a96e',
            text: 'Press J to open BAR capture.\n\nChoose the emotion, then its strength, then three lines: Behavior, Activation, Result.\n\nEach BAR becomes a Witness card in your deck (press I → Deck) and a Karmic Seed in your inventory.\n\nHigher intensity charges the seed with more starting quality.',
            style: 'npc',
            choices: [
                { text: 'I will try it now', action: 'open_journal' },
                { text: 'Show me the garden', nextScene: 'wu_back_to_start' }
            ]
        },
        {
            id: 'wu_back_to_start',
            speaker: 'Master Wu',
            speakerColor: '#c8a96e',
            text: 'Go now, and tend your garden.\n\nThe seeds of your emotions are waiting.',
            style: 'npc',
            choices: [
                { text: 'Open BAR (J)', action: 'open_journal' },
                { text: 'Explore', action: 'close' }
            ]
        }
    ],
    
    // Tutorial scenes — triggered by story flags
    tutorial: [
        {
            id: 'first_seed_created',
            speaker: '✦ Inner Voice',
            speakerColor: '#e8c88a',
            text: 'A Karmic Seed has formed in your inventory.\n\nHigher quality fruit gives better stat boosts.\n\nYou can meditate (hold M) to raise seed quality.\n\nFind an empty garden plot and press Space to plant it.',
            style: 'inner',
            onEnter: { setFlags: { first_journal: true } },
            choices: [
                { text: '🌱 Try planting it now', action: 'close' },
                { text: 'Show me how to meditate first', nextScene: 'meditation_tutorial' }
            ]
        },
        {
            id: 'meditation_tutorial',
            speaker: '✦ Inner Voice',
            speakerColor: '#e8c88a',
            text: 'To meditate, hold the M key.\n\nWhile meditating, your most recent seed\'s quality will increase.\n\nHigher quality seeds produce better Enlightenment Fruit with greater stat bonuses.\n\nTry it now — hold M and watch the HUD.',
            style: 'inner',
            choices: [
                { text: 'Try meditating now', action: 'close' }
            ]
        },
        {
            id: 'first_planted',
            speaker: '✦ Inner Voice',
            speakerColor: '#e8c88a',
            text: 'Your seed is planted in the Inner Garden.\n\nNow you need a tool to water it.\n\nTalk to Master Wu (E near him) — he has something for you.',
            style: 'inner',
            onEnter: { setFlags: { first_plant: true } },
            choices: [
                { text: 'Find Master Wu', action: 'close' }
            ]
        },
        {
            id: 'got_watering_can',
            speaker: '✦ Inner Voice',
            speakerColor: '#4a8aff',
            text: 'The Watering Can holds water from the Pond of Compassion.\n\nPress Space near a planted seed to water it.\n\nWhen empty, refill at the pond (press E near it).\n\nWater your seeds daily to help them grow!',
            style: 'inner',
            onEnter: { setFlags: { has_can: true } },
            choices: [
                { text: 'Water my seed!', action: 'close' }
            ]
        },
        {
            id: 'first_watered',
            speaker: '✦ Inner Voice',
            speakerColor: '#e8c88a',
            text: 'Watering the crop nurtures it toward the next growth stage.\n\nKeep watering each day. As it grows, you\'ll see it transform:\nSeed → Sprout → Bud → Flower → Fruit\n\nCheck back often — plants grow in real time.',
            style: 'inner',
            onEnter: { setFlags: { first_water: true } },
            choices: [
                { text: 'I understand', action: 'close' }
            ]
        },
        {
            id: 'first_harvested',
            speaker: '✦ Inner Voice',
            speakerColor: '#ff8844',
            text: 'You harvested your first Enlightenment Fruit!\n\nEmotions are not your enemy — they are compost for your growth.\n\nThe fruit has been consumed. Check your stats in the menu (I).',
            style: 'inner',
            onEnter: { setFlags: { first_harvest: true, tutorial_complete: true } },
            choices: [
                { text: 'Continue my journey', action: 'close' }
            ]
        }
    ],
    
    // Master Wu's special dialogs
    npc_wu: [
        {
            id: 'wu_give_can',
            condition: { flags: { first_plant: true }, notHasTool: 'wateringCan' },
            speaker: 'Master Wu',
            speakerColor: '#c8a96e',
            text: 'Ah, I see you have planted your first seed. A gardener must have the right tools.\n\nTake this watering can. It holds the water of compassion — use it to nourish your crops.\n\nApproach a planted seed and press Space to water it. When empty, refill at the pond.',
            style: 'npc',
            choices: [
                { text: 'Thank you, Master Wu', action: 'receive_watering_can' }
            ]
        },
        {
            id: 'wu_has_can',
            condition: { flags: { has_can: true } },
            speaker: 'Master Wu',
            speakerColor: '#c8a96e',
            text: 'Keep tending your garden. Water your seeds, and they will grow.\n\nWhen your watering can runs dry, refill it at the pond in the south.',
            style: 'npc',
            choices: [
                { text: 'I will', action: 'close' }
            ]
        },
        {
            id: 'wu_generic',
            speaker: 'Master Wu',
            speakerColor: '#c8a96e',
            text: 'The path of inner cultivation is simple, but not easy.\n\nEvery emotion is a teacher. Every seed is a possibility.',
            style: 'npc',
            choices: [
                { text: 'Talk more', nextScene: 'wu_generic', nextChapter: 'npc_wu' },
                { text: 'Goodbye', action: 'close' }
            ]
        },
        {
            id: 'wu_generic_b',
            speaker: 'Master Wu',
            speakerColor: '#c8a96e',
            text: 'The fruit it bears will transform you.\n\nGo now, and tend your garden.',
            style: 'npc',
            choices: [
                { text: 'Farewell', action: 'close' }
            ]
        }
    ],
    
    // Merchant Mei-Lin
    npc_merchant: [
        {
            id: 'mei_greeting',
            speaker: 'Mei-Lin',
            speakerColor: '#88cc44',
            text: 'Greetings, traveler! Need supplies for your garden?\n\nI have watering cans, rare soil, and even some peculiar seeds from distant lands.\n\nBut the best seeds are the ones you grow yourself, from the heart.',
            style: 'npc',
            choices: [
                { text: 'Goodbye', action: 'close' }
            ]
        }
    ],
    
    // Young Disciple
    npc_disciple: [
        {
            id: 'disciple_greeting',
            speaker: 'Young Disciple',
            speakerColor: '#c8a96e',
            text: 'Hello senior! I just started my cultivation journey.\n\nI heard that if you meditate under the moonlight, your seeds grow faster.\n\nMaybe we can learn together?',
            style: 'npc',
            choices: [
                { text: 'Study together', nextScene: 'disciple_study' },
                { text: 'Maybe later', action: 'close' }
            ]
        },
        {
            id: 'disciple_study',
            speaker: 'Young Disciple',
            speakerColor: '#c8a96e',
            text: 'Great! I will meditate here and tend my plot.\n\nCome find me when you have harvested your first fruit — I would love to hear about it!',
            style: 'npc',
            choices: [
                { text: 'I will!', action: 'close' }
            ]
        }
    ]
};

/**
 * Get a scene by its chapter and id
 */
export function findScene(chapterId, sceneId) {
    const chapter = StoryChapters[chapterId];
    if (!chapter) return null;
    return chapter.find(s => s.id === sceneId) || null;
}

/**
 * Get all scenes with a matching condition (for NPC dialogs)
 */
export function findScenesByCondition(chapterId, conditionChecker) {
    const chapter = StoryChapters[chapterId];
    if (!chapter) return [];
    return chapter.filter(s => {
        if (!s.condition) return true; // no condition = always available
        return conditionChecker(s.condition);
    });
}
