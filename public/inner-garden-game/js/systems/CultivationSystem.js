/**
 * Cultivation System
 * Manages player stats, cultivation levels, and character progression.
 * Seed quality directly determines how much power you gain from harvesting.
 * Higher quality seeds → more stat growth → faster cultivation breakthroughs.
 */

import { EmotionTypes } from '../data/Emotions.js';

export const CultivationLevels = [
    { id: 'mortal', name: 'Mortal', minExp: 0, qiColor: '#8a8a8a', title: 'Awakening One' },
    { id: 'qi_condensation', name: 'Qi Condensation', minExp: 100, qiColor: '#4a8aff', title: 'Qi Gatherer' },
    { id: 'foundation', name: 'Foundation Establishment', minExp: 300, qiColor: '#6a4aff', title: 'Foundation Builder' },
    { id: 'core_formation', name: 'Core Formation', minExp: 700, qiColor: '#ff4a8a', title: 'Core Bearer' },
    { id: 'nascent_soul', name: 'Nascent Soul', minExp: 1500, qiColor: '#aa4aff', title: 'Soul Awakener' },
    { id: 'immortal', name: 'Immortal Unity', minExp: 3000, qiColor: '#ffd700', title: 'Unity Being' }
];

export class CultivationSystem {
    constructor() {
        // Core stats (the six virtues)
        this.stats = {
            strength: 5,
            wisdom: 5,
            spirit: 5,
            agility: 5,
            endurance: 5,
            charisma: 5
        };
        
        // Cultivation progression
        this.exp = 0;
        this.level = 0;         // Index into CultivationLevels
        this.qi = 50;           // Current qi
        this.maxQi = 50;
        this.qiRegenRate = 2;   // Per second
        
        // Breakthrough progress
        this.breakthroughProgress = 0;
    }
    
    /**
     * Consume a harvested fruit to gain its benefits
     * @param {object} fruit - Harvested fruit with emotionId, quality, etc.
     * @returns {object} Result with stat gains
     */
    consumeFruit(fruit) {
        const emotion = Object.values(EmotionTypes).find(e => e.id === fruit.emotionId);
        const statBonusType = emotion ? emotion.statBonus : 'spirit';
        
        // Quality directly scales the stat gain
        // quality 20 → +1, quality 60 → +3, quality 100 → +6
        const qualityFactor = Math.floor(fruit.quality / 16.7) + 1; // 1-6 range
        const statGain = Math.min(qualityFactor, 6);
        
        // Experience gain also scales with quality
        const expGain = Math.round(fruit.quality * 1.5);
        
        // Apply stat gain
        this.stats[statBonusType] = (this.stats[statBonusType] || 5) + statGain;
        
        // Apply experience
        this.exp += expGain;
        
        // Update cultivation level
        this._updateLevel();
        
        return {
            statGained: statBonusType,
            statAmount: statGain,
            expGained: expGain,
            quality: fruit.quality,
            fruitName: emotion ? emotion.fruitName : 'Mystery Fruit'
        };
    }
    
    /**
     * Add cultivation XP (quests, BAR card spend, etc.)
     * @param {number} amount
     */
    addExp(amount) {
        const n = Math.max(0, Math.round(amount));
        this.exp += n;
        this._updateLevel();
    }

    /**
     * True if any virtue stat is at least `level`
     * @param {number} level
     */
    hasStatAtLevel(level) {
        return Object.values(this.stats).some((v) => v >= level);
    }

    /**
     * Regenerate qi over time
     */
    regenerateQi(deltaTime) {
        this.qi = Math.min(this.maxQi, this.qi + (this.qiRegenRate * deltaTime / 1000));
    }
    
    /**
     * Use qi for an action
     * @returns {boolean} Whether there was enough qi
     */
    useQi(amount) {
        if (this.qi >= amount) {
            this.qi -= amount;
            return true;
        }
        return false;
    }
    
    /**
     * Update cultivation level based on exp
     */
    _updateLevel() {
        for (let i = CultivationLevels.length - 1; i >= 0; i--) {
            if (this.exp >= CultivationLevels[i].minExp) {
                if (i !== this.level) {
                    this.level = i;
                    // Max qi increases with level
                    this.maxQi = 50 + this.level * 25;
                }
                break;
            }
        }
    }
    
    /**
     * Get the current cultivation profile
     */
    getProfile() {
        const levelData = CultivationLevels[this.level];
        
        // Calculate progress to next level
        const nextLevel = CultivationLevels[this.level + 1];
        const progress = nextLevel ? 
            (this.exp - levelData.minExp) / (nextLevel.minExp - levelData.minExp) : 1;
        
        return {
            level: this.level,
            title: levelData.title,
            name: levelData.name,
            exp: this.exp,
            nextLevelExp: nextLevel ? nextLevel.minExp : this.exp,
            progress: Math.min(1, progress),
            qi: Math.round(this.qi),
            maxQi: this.maxQi,
            qiColor: levelData.qiColor,
            stats: { ...this.stats }
        };
    }
    
    /**
     * Get total stats (for character sheet)
     */
    getTotalStats() {
        return Object.values(this.stats).reduce((a, b) => a + b, 0);
    }
}
