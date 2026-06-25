/**
 * Emotion Data Definitions
 * Each emotion has a color, element association, and cultivation properties.
 * In the Taoist framework, emotions are "demons" to be refined into virtue.
 */

export const EmotionTypes = {
    ANGER: {
        id: 'anger',
        name: 'Anger',
        element: 'fire',
        color: '#e04040',
        lightColor: '#ff6b6b',
        darkColor: '#8b2020',
        virtue: 'Courage',
        description: 'Hot, rising energy of injustice',
        meditationAntidote: 'Stillness',
        seedColor: '#cc3333',
        fruitColor: '#ff4444',
        fruitName: 'Dragonheart Fruit',
        statBonus: 'strength',
        qiType: 'yang'
    },
    FEAR: {
        id: 'fear',
        name: 'Fear',
        element: 'metal',
        nation: 'argyra',
        color: '#4060e0',
        lightColor: '#6b8bff',
        darkColor: '#2028a0',
        virtue: 'Wisdom',
        description: 'Cold, contracting energy of uncertainty',
        meditationAntidote: 'Trust',
        seedColor: '#3344cc',
        fruitColor: '#4466ff',
        fruitName: 'Moonlight Lotus',
        statBonus: 'wisdom',
        qiType: 'yin'
    },
    SADNESS: {
        id: 'sadness',
        name: 'Sadness',
        element: 'water',
        nation: 'lamenth',
        color: '#8080a0',
        lightColor: '#a0a0c0',
        darkColor: '#404060',
        virtue: 'Compassion',
        description: 'Heavy, dissolving energy of loss',
        meditationAntidote: 'Acceptance',
        seedColor: '#555577',
        fruitColor: '#8888bb',
        fruitName: 'Tear of Guanyin',
        statBonus: 'spirit',
        qiType: 'yin'
    },
    ANXIETY: {
        id: 'anxiety',
        name: 'Anxiety',
        element: 'earth',
        nation: 'meridia',
        color: '#c0a040',
        lightColor: '#e0c060',
        darkColor: '#806020',
        virtue: 'Peace',
        description: 'Scattered, unsettled energy of worry',
        meditationAntidote: 'Grounding',
        seedColor: '#887733',
        fruitColor: '#ccaa44',
        fruitName: 'Golden Stillness Fruit',
        statBonus: 'agility',
        qiType: 'yang'
    },
    SHAME: {
        id: 'shame',
        name: 'Shame',
        element: 'earth',
        nation: 'meridia',
        color: '#806040',
        lightColor: '#a08060',
        darkColor: '#503020',
        virtue: 'Authenticity',
        description: 'Heavy, hiding energy of unworthiness',
        meditationAntidote: 'Self-Love',
        seedColor: '#5a4030',
        fruitColor: '#8a6a4a',
        fruitName: 'Rooted Truth Tuber',
        statBonus: 'endurance',
        qiType: 'yin'
    },
    JOY: {
        id: 'joy',
        name: 'Joy',
        element: 'wood',
        nation: 'virelune',
        color: '#e0d040',
        lightColor: '#ffe860',
        darkColor: '#a09020',
        virtue: 'Gratitude',
        description: 'Expansive, connecting energy of love',
        meditationAntidote: 'Presence',
        seedColor: '#aaa030',
        fruitColor: '#eedd50',
        fruitName: 'Thunder Pearl',
        statBonus: 'charisma',
        qiType: 'yang'
    }
};

export const EmotionalCharge = {
    MIN: 0,
    MAX: 100,
    CAPTURE_THRESHOLD: 25,      // Minimum charge to capture
    CRYSTALLIZE_THRESHOLD: 60,  // Charge needed to crystallize into seed
    PERFECT_CRYSTALLIZE: 90,    // Higher quality seed production
    DECAY_RATE: 2,              // Per second if unaddressed
    MEDITATION_RATE: 5,         // Per second during meditation
};

/**
 * Get the opposing/converting virtue for an emotion
 */
export function getVirtueForEmotion(emotionId) {
    const emotion = Object.values(EmotionTypes).find(e => e.id === emotionId);
    return emotion ? emotion.virtue : null;
}

/**
 * Get the color for an emotion type
 */
export function getEmotionColor(emotionId, shade = 'default') {
    const emotion = Object.values(EmotionTypes).find(e => e.id === emotionId);
    if (!emotion) return '#ffffff';
    if (shade === 'light') return emotion.lightColor;
    if (shade === 'dark') return emotion.darkColor;
    return emotion.color;
}

/**
 * Check if an emotion exists
 */
export function isValidEmotion(emotionId) {
    return Object.values(EmotionTypes).some(e => e.id === emotionId);
}
