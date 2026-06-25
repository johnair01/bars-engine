/**
 * Quest Definitions
 * Personal development quests tied to emotional cultivation.
 */

export const QuestCategories = {
    INNER_WORK: 'inner_work',
    CULTIVATION: 'cultivation',
    GARDENING: 'gardening',
    COMPASSION: 'compassion',
    WISDOM: 'wisdom'
};

/**
 * All available quests in the game
 */
export const Quests = [
    {
        id: 'first_seed',
        name: 'The First Seed',
        description: 'Crystallize your first emotional charge into a seed',
        category: QuestCategories.INNER_WORK,
        requirements: {
            seedsCreated: 1,
        },
        rewards: {
            exp: 50,
            spirit: 1,
            item: 'jade_watering_can'
        },
        dialogWhenComplete: 'The first seed is always the hardest. You have begun the Great Work.',
        chapter: 1
    },
    {
        id: 'first_harvest',
        name: 'First Harvest',
        description: 'Grow a seed through all stages and harvest its fruit',
        category: QuestCategories.GARDENING,
        requirements: {
            harvestsCompleted: 1,
        },
        rewards: {
            exp: 100,
            wisdom: 1,
            item: 'spirit_compass'
        },
        dialogWhenComplete: 'The fruit of your labor nourishes body and soul alike.',
        chapter: 1
    },
    {
        id: 'master_angler',
        name: 'Master of Anger',
        description: 'Harvest 3 Dragonheart Fruits (from Anger seeds)',
        category: QuestCategories.CULTIVATION,
        requirements: {
            harvestByEmotion: { anger: 3 }
        },
        rewards: {
            exp: 200,
            strength: 2,
            title: 'Flame Tamer'
        },
        dialogWhenComplete: 'You have learned to hold fire without being burned.',
        chapter: 2
    },
    {
        id: 'heart_garden',
        name: 'The Heart\'s Garden',
        description: 'Have 5 crops growing simultaneously',
        category: QuestCategories.GARDENING,
        requirements: {
            activeCrops: 5
        },
        rewards: {
            exp: 150,
            spirit: 2,
            item: 'golden_spade'
        },
        dialogWhenComplete: 'A garden of many flowers reflects a rich inner world.',
        chapter: 2
    },
    {
        id: 'emotional_balance',
        name: 'Emotional Balance',
        description: 'Crystallize one seed of each emotion type',
        category: QuestCategories.INNER_WORK,
        requirements: {
            uniqueEmotionsCrystallized: ['anger', 'fear', 'sadness', 'anxiety', 'shame']
        },
        rewards: {
            exp: 300,
            wisdom: 3,
            spirit: 3,
            title: 'Heart-Weaver'
        },
        dialogWhenComplete: 'You have looked into the full mirror of your heart. Truly, you are becoming whole.',
        chapter: 3
    },
    {
        id: 'compassion_act',
        name: 'Compassionate Action',
        description: 'Perform 10 emotionally intelligent actions (watering, weeding, nurturing)',
        category: QuestCategories.COMPASSION,
        requirements: {
            nurtureActions: 10
        },
        rewards: {
            exp: 100,
            charisma: 1,
        },
        dialogWhenComplete: 'Compassion in action transforms the world, one small act at a time.',
        chapter: 1
    },
    {
        id: 'breakthrough_one',
        name: 'Qi Condensation',
        description: 'Reach level 5 in any single stat',
        category: QuestCategories.CULTIVATION,
        requirements: {
            anyStatLevel: 5
        },
        rewards: {
            exp: 500,
            allStats: 1,
            title: 'Qi Condensation Adept'
        },
        dialogWhenComplete: 'Qi flows through you like a river. Foundation Building begins.',
        chapter: 3
    },
    {
        id: 'zen_master',
        name: 'Zen Garden',
        description: 'Meditate for a cumulative total of 10 minutes',
        category: QuestCategories.CULTIVATION,
        requirements: {
            totalMeditationTime: 600000 // 10 minutes in ms
        },
        rewards: {
            exp: 400,
            wisdom: 3,
            title: 'Stillness Seeker'
        },
        dialogWhenComplete: 'In the silence between thoughts, the Tao reveals itself.',
        chapter: 3
    },
    {
        id: 'night_garden',
        name: 'Moonlight Garden',
        description: 'Harvest a Moonlight Lotus (Fear-based fruit) during night time',
        category: QuestCategories.CULTIVATION,
        requirements: {
            harvestByEmotion: { fear: 1 },
            timeOfDay: 'night'
        },
        rewards: {
            exp: 250,
            wisdom: 2,
            item: 'moon_crystal'
        },
        dialogWhenComplete: 'The moon illuminates what the sun cannot. Your shadows become teachers.',
        chapter: 2
    }
];

/**
 * Get all quests for a given chapter
 */
export function getQuestsByChapter(chapter) {
    return Quests.filter(q => q.chapter === chapter);
}

/**
 * Get quest by ID
 */
export function getQuestById(id) {
    return Quests.find(q => q.id === id);
}

/**
 * Get all quest titles
 */
export function getQuestTitles() {
    return Quests.map(q => ({
        id: q.id,
        name: q.name,
        chapter: q.chapter,
        category: q.category
    }));
}
