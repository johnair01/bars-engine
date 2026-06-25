/**
 * Seed and Crop Data Definitions
 * Seeds are crystallized emotional charge planted in the Inner Garden.
 */

import { EmotionTypes } from './Emotions.js';

export const GrowthStages = {
    SEED: {
        id: 'seed',
        name: 'Karmic Seed',
        description: 'A crystallized emotion waiting to be planted',
        icon: '●',
        waterNeeded: 0,
        timeNeeded: 0,
    },
    SPROUT: {
        id: 'sprout',
        name: 'Awakening Sprout',
        description: 'Tender green shoot reaching toward the light',
        icon: '🌱',
        waterNeeded: 2,
        timeNeeded: 1,
    },
    BUD: {
        id: 'bud',
        name: 'Virtue Bud',
        description: 'A tight bud holding potential transformation',
        icon: '🌿',
        waterNeeded: 4,
        timeNeeded: 2,
    },
    FLOWER: {
        id: 'flower',
        name: 'Heart Flower',
        description: 'Beautiful bloom radiating cultivated energy',
        icon: '🌸',
        waterNeeded: 6,
        timeNeeded: 3,
    },
    FRUIT: {
        id: 'fruit',
        name: 'Enlightenment Fruit',
        description: 'Ripe fruit ready to harvest and use',
        icon: '🍑',
        waterNeeded: 8,
        timeNeeded: 4,
    }
};

/**
 * Create a new seed from an emotional charge.
 * @param {string} emotionId - The emotion type
 * @param {number} quality - 0-100 quality based on crystallization
 * @returns {object} Seed data
 */
export function createSeed(emotionId, quality = 50, metadata = {}) {
    return {
        id: `seed_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        emotionId: emotionId,
        quality: Math.min(100, Math.max(1, quality)),
        planted: false,
        createdAt: Date.now(),
        sourceBarId: metadata.sourceBarId ?? null,
        sourceBarTitle: metadata.sourceBarTitle ?? null,
        campaignRef: metadata.campaignRef ?? null,
        gameMasterFace: metadata.gameMasterFace ?? null,
        externalSource: metadata.externalSource ?? null,
    };
}

/**
 * Calculate growth progress based on care actions
 * @param {object} crop - The crop instance
 * @returns {number} 0-1 progress toward next stage
 */
export function getGrowthProgress(crop) {
    const stages = Object.values(GrowthStages);
    const currentStageIndex = stages.findIndex(s => s.id === crop.stage);
    const nextStage = stages[currentStageIndex + 1];
    if (!nextStage) return 1; // Fully grown
    
    const waterProgress = Math.min(crop.waterGiven / nextStage.waterNeeded, 1);
    const timeProgress = Math.min(crop.timeElapsed / (nextStage.timeNeeded * 60000), 1);
    const nurtureProgress = Math.min(crop.nurtureActions / (currentStageIndex + 2), 1);
    
    return (waterProgress * 0.4) + (timeProgress * 0.3) + (nurtureProgress * 0.3);
}

/**
 * Check if a crop is ready to advance to the next stage
 */
export function canAdvanceStage(crop) {
    const stages = Object.values(GrowthStages);
    const currentIndex = stages.findIndex(s => s.id === crop.stage);
    if (currentIndex >= stages.length - 1) return false;
    
    const nextStage = stages[currentIndex + 1];
    return crop.waterGiven >= nextStage.waterNeeded && 
           crop.timeElapsed >= nextStage.timeNeeded * 60000;
}

/**
 * Get the stat bonus type from a crop's emotion
 */
export function getCropStatBonus(emotionId) {
    const emotion = Object.values(EmotionTypes).find(e => e.id === emotionId);
    return emotion ? emotion.statBonus : 'spirit';
}

/**
 * Get the fruit name from a crop's emotion
 */
export function getFruitName(emotionId) {
    const emotion = Object.values(EmotionTypes).find(e => e.id === emotionId);
    return emotion ? emotion.fruitName : 'Mystery Fruit';
}
