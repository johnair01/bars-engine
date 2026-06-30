/**
 * Quest System
 * Manages quest progress, completion tracking, and rewards.
 */

import { Quests, QuestCategories, getQuestById } from '../data/Quests.js';

export class QuestSystem {
    constructor(cultivationSystem, emotionSystem, farmingSystem) {
        this.cultivation = cultivationSystem;
        this.emotion = emotionSystem;
        this.farming = farmingSystem;
        
        this.activeQuests = [];      // Currently active quests
        this.completedQuests = [];   // Completed quest IDs
        this.availableQuests = [];   // Quests player can accept
        
        this.progress = {
            seedsCreated: 0,
            harvestsCompleted: 0,
            harvestByEmotion: {},
            activeCrops: 0,
            uniqueEmotionsCrystallized: [],
            nurtureActions: 0,
            totalMeditationTime: 0,
            anyStatLevel: 0
        };
        
        this._initAvailableQuests();
    }

    /**
     * Initialize available quests (chapter 1 quests)
     */
    _initAvailableQuests() {
        this.availableQuests = Quests.filter(q => q.chapter === 1);
    }

    /**
     * Accept a quest
     * @param {string} questId
     * @returns {boolean} Success
     */
    acceptQuest(questId) {
        if (this.activeQuests.find(q => q.id === questId)) return false;
        if (this.completedQuests.includes(questId)) return false;
        
        const questData = getQuestById(questId);
        if (!questData) return false;
        
        const quest = {
            ...questData,
            acceptedAt: Date.now(),
            progress: {}
        };
        
        this.activeQuests.push(quest);
        
        // Remove from available
        const availIndex = this.availableQuests.findIndex(q => q.id === questId);
        if (availIndex > -1) this.availableQuests.splice(availIndex, 1);
        
        return true;
    }

    /**
     * Update quest progress based on game events
     * @param {string} eventType - Type of event
     * @param {object} data - Event data
     * @returns {Array} Newly completed quests
     */
    updateProgress(eventType, data = {}) {
        // Update internal progress tracking
        switch (eventType) {
            case 'seed_created':
                this.progress.seedsCreated++;
                if (data.emotionId && !this.progress.uniqueEmotionsCrystallized.includes(data.emotionId)) {
                    this.progress.uniqueEmotionsCrystallized.push(data.emotionId);
                }
                break;
            case 'crop_harvested':
                this.progress.harvestsCompleted++;
                if (data.emotionId) {
                    this.progress.harvestByEmotion[data.emotionId] = 
                        (this.progress.harvestByEmotion[data.emotionId] || 0) + 1;
                }
                break;
            case 'nurture_action':
                this.progress.nurtureActions++;
                break;
            case 'meditation':
                this.progress.totalMeditationTime = data.totalTime || 0;
                break;
            case 'stat_up':
                // Check any stat level
                if (this.cultivation.hasStatAtLevel(5)) {
                    this.progress.anyStatLevel = 5;
                }
                break;
        }
        
        // Sync active crops count from farming system
        this.progress.activeCrops = this.farming.crops.length;
        
        // Check quest completion
        return this._checkCompletion();
    }

    /**
     * Check all active quests for completion
     */
    _checkCompletion() {
        const completed = [];
        
        for (let i = this.activeQuests.length - 1; i >= 0; i--) {
            const quest = this.activeQuests[i];
            
            if (this._isQuestComplete(quest)) {
                this._completeQuest(quest);
                completed.push(quest);
                this.activeQuests.splice(i, 1);
            }
        }
        
        return completed;
    }

    /**
     * Check if a specific quest's requirements are met
     */
    _isQuestComplete(quest) {
        const reqs = quest.requirements;
        
        for (const [key, value] of Object.entries(reqs)) {
            switch (key) {
                case 'seedsCreated':
                    if (this.progress.seedsCreated < value) return false;
                    break;
                case 'harvestsCompleted':
                    if (this.progress.harvestsCompleted < value) return false;
                    break;
                case 'harvestByEmotion':
                    for (const [emotionId, count] of Object.entries(value)) {
                        if ((this.progress.harvestByEmotion[emotionId] || 0) < count) return false;
                    }
                    break;
                case 'activeCrops':
                    if (this.progress.activeCrops < value) return false;
                    break;
                case 'uniqueEmotionsCrystallized':
                    for (const emotionId of value) {
                        if (!this.progress.uniqueEmotionsCrystallized.includes(emotionId)) return false;
                    }
                    break;
                case 'nurtureActions':
                    if (this.progress.nurtureActions < value) return false;
                    break;
                case 'totalMeditationTime':
                    if (this.progress.totalMeditationTime < value) return false;
                    break;
                case 'anyStatLevel':
                    if (!this.cultivation.hasStatAtLevel(value)) return false;
                    break;
                case 'timeOfDay':
                    // Time check would come from TimeSystem
                    break;
                default:
                    return false;
            }
        }
        
        return true;
    }

    /**
     * Complete a quest and grant rewards
     */
    _completeQuest(quest) {
        this.completedQuests.push(quest.id);
        
        // Grant rewards
        if (quest.rewards) {
            const rewards = quest.rewards;
            
            // Experience
            if (rewards.exp) {
                this.cultivation.addExp(rewards.exp);
            }
            
            // Stat boosts
            const statFields = ['strength', 'wisdom', 'spirit', 'agility', 'endurance', 'charisma'];
            for (const stat of statFields) {
                if (rewards[stat]) {
                    this.cultivation.boostStat(stat, rewards[stat]);
                }
            }
            
            // All stats
            if (rewards.allStats) {
                for (const stat of statFields) {
                    this.cultivation.boostStat(stat, rewards.allStats);
                }
            }
            
            // Items
            if (rewards.item) {
                this.cultivation.addItem({ name: rewards.item, type: 'quest_reward' });
            }
            
            // Titles
            if (rewards.title) {
                this.cultivation.titles.push(rewards.title);
            }
        }
        
        // Unlock next chapter quests if applicable
        if (quest.chapter) {
            const nextChapter = quest.chapter + 1;
            const chapterQuests = Quests.filter(q => q.chapter === nextChapter);
            for (const q of chapterQuests) {
                if (!this.completedQuests.includes(q.id) && 
                    !this.activeQuests.find(aq => aq.id === q.id) &&
                    !this.availableQuests.find(aq => aq.id === q.id)) {
                    this.availableQuests.push(q);
                }
            }
        }
    }

    /**
     * Get active quests with progress info
     */
    getActiveQuestDetails() {
        return this.activeQuests.map(quest => {
            const reqs = quest.requirements;
            const progress = {};
            
            for (const [key, value] of Object.entries(reqs)) {
                let current = 0;
                switch (key) {
                    case 'seedsCreated': current = this.progress.seedsCreated; break;
                    case 'harvestsCompleted': current = this.progress.harvestsCompleted; break;
                    case 'activeCrops': current = this.progress.activeCrops; break;
                    case 'nurtureActions': current = this.progress.nurtureActions; break;
                    case 'totalMeditationTime': current = this.progress.totalMeditationTime; break;
                    case 'anyStatLevel': current = this.progress.anyStatLevel; break;
                    default: current = 0;
                }
                progress[key] = { current, needed: value };
            }
            
            return {
                id: quest.id,
                name: quest.name,
                description: quest.description,
                category: quest.category,
                progress,
                complete: this._isQuestComplete(quest)
            };
        });
    }

    /**
     * Get available quests
     */
    getAvailableQuests() {
        return this.availableQuests;
    }

    /**
     * Get completed quests
     */
    getCompletedQuests() {
        return this.completedQuests.map(id => getQuestById(id)).filter(Boolean);
    }

    /**
     * Get summary
     */
    getSummary() {
        return {
            active: this.activeQuests.length,
            completed: this.completedQuests.length,
            available: this.availableQuests.length,
            totalQuests: Quests.length
        };
    }
}
