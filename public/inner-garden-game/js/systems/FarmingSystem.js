/**
 * Farming System
 * Manages garden plots, planting seeds, watering, nurturing, growth, and harvesting.
 * Rune Factory-style crop management with emotional cultivation theme.
 */

import { GrowthStages, canAdvanceStage, getGrowthProgress, getFruitName } from '../data/Seeds.js';
import { EmotionTypes } from '../data/Emotions.js';

export class FarmingSystem {
    constructor() {
        this.plots = [];           // Garden plots
        this.crops = [];          // Active crops
        this.harvestedFruits = []; // Collected fruits
        this.waterLevel = 100;    // Watering can water level
        this.maxWaterLevel = 100;
        this.gardenLevel = 1;     // Garden upgrade level
        this.maxPlots = 4;        // Starting plots
        this.nurtureActions = 0;   // Total nurture actions performed
    }

    /**
     * Initialize garden plots
     */
    initializePlots() {
        this.plots = [];
        for (let i = 0; i < this.maxPlots; i++) {
            this.plots.push({
                id: i,
                x: 160 + (i % 4) * 48,
                y: 200 + Math.floor(i / 4) * 48,
                occupied: false,
                cropId: null,
                soilQuality: 50 + Math.floor(Math.random() * 30), // 50-80
                watered: false
            });
        }
    }

    /**
     * Plant a seed in an empty plot
     * @param {object} seed - The seed from inventory
     * @param {number} plotId - The plot to plant in
     * @returns {object|null} The created crop, or null if plot occupied
     */
    plantSeed(seed, plotId) {
        const plot = this.plots.find(p => p.id === plotId);
        if (!plot || plot.occupied) return null;

        const crop = {
            id: `crop_${Date.now()}`,
            plotId: plotId,
            seedId: seed.id,
            emotionId: seed.emotionId,
            quality: seed.quality,
            stage: 'seed',
            waterGiven: 0,
            timeElapsed: 0,
            nurtureActions: 0,
            plantedAt: Date.now(),
            lastWaterTime: 0,
            health: 100,
            growthBonus: 0,
            sourceBarId: seed.sourceBarId ?? null,
            sourceBarTitle: seed.sourceBarTitle ?? null,
            campaignRef: seed.campaignRef ?? null,
            gameMasterFace: seed.gameMasterFace ?? null,
            externalSource: seed.externalSource ?? null,
        };

        this.crops.push(crop);
        plot.occupied = true;
        plot.cropId = crop.id;
        plot.watered = false;

        return crop;
    }

    /**
     * Water a crop at a plot
     * @param {number} plotId - The plot to water
     * @returns {object} Result of watering
     */
    waterCrop(plotId) {
        const plot = this.plots.find(p => p.id === plotId);
        if (!plot || !plot.occupied) return { success: false, reason: 'No crop here' };
        if (this.waterLevel < 10) return { success: false, reason: 'Out of water' };

        const crop = this.crops.find(c => c.id === plot.cropId);
        if (!crop) return { success: false, reason: 'Crop not found' };

        this.waterLevel -= 10;
        crop.waterGiven += 1;
        crop.lastWaterTime = Date.now();
        plot.watered = true;

        // Watering is a nurture action
        this.nurtureActions++;

        return {
            success: true,
            waterGiven: crop.waterGiven,
            stage: crop.stage,
            nurtureAction: true
        };
    }

    /**
     * Nurture a crop (emotionally intelligent action beyond watering)
     * @param {number} plotId - The plot
     * @param {string} actionType - Type of nurture action
     * @returns {object} Result
     */
    nurtureCrop(plotId, actionType = 'talk') {
        const plot = this.plots.find(p => p.id === plotId);
        if (!plot || !plot.occupied) return { success: false, reason: 'No crop here' };

        const crop = this.crops.find(c => c.id === plot.cropId);
        if (!crop) return { success: false, reason: 'Crop not found' };

        // Different actions have different effects
        const actionEffects = {
            talk: { growth: 0.5, health: 2, nurtureCount: 1 },
            sing: { growth: 0.8, health: 3, nurtureCount: 1 },
            meditate: { growth: 1.0, health: 5, nurtureCount: 2 },
            reflect: { growth: 1.2, health: 4, nurtureCount: 2 },
            journal: { growth: 0.6, health: 3, nurtureCount: 1 }
        };

        const effect = actionEffects[actionType] || actionEffects.talk;
        crop.growthBonus += effect.growth;
        crop.health = Math.min(100, crop.health + effect.health);
        crop.nurtureActions += effect.nurtureCount;
        this.nurtureActions += effect.nurtureCount;

        return {
            success: true,
            healthGain: effect.health,
            growthBonus: effect.growth,
            nurtureAction: true
        };
    }

    /**
     * Update all crops (called per game tick)
     * @param {number} deltaTime - ms since last update
     * @returns {Array} Crops that advanced to next stage
     */
    update(deltaTime) {
        const advanced = [];

        for (const crop of this.crops) {
            if (crop.stage === 'fruit') continue; // Fully grown

            // Time passes
            crop.timeElapsed += deltaTime;

            // Health decay if not watered
            const timeSinceWater = Date.now() - crop.lastWaterTime;
            if (timeSinceWater > 30000 && crop.stage !== 'seed') { // 30 seconds
                crop.health = Math.max(0, crop.health - 0.5 * (deltaTime / 1000));
            }

            // Check if ready to advance
            const effectiveWater = crop.waterGiven + (crop.growthBonus * 0.5);
            const modifiedCrop = { ...crop, waterGiven: effectiveWater };

            if (canAdvanceStage(modifiedCrop)) {
                this._advanceStage(crop);
                advanced.push(crop);
            }
        }

        return advanced;
    }

    /**
     * Advance a crop to the next growth stage
     */
    _advanceStage(crop) {
        const stages = Object.values(GrowthStages);
        const currentIndex = stages.findIndex(s => s.id === crop.stage);
        const nextStage = stages[currentIndex + 1];
        
        if (nextStage) {
            const oldStage = crop.stage;
            crop.stage = nextStage.id;
            
            // Reset stage-specific counters partially
            crop.waterGiven = Math.floor(crop.waterGiven * 0.3); // Carry over some
        }
    }

    /**
     * Harvest a fully grown crop
     * @param {number} plotId - The plot to harvest
     * @returns {object|null} The harvested fruit
     */
    harvestCrop(plotId) {
        const plot = this.plots.find(p => p.id === plotId);
        if (!plot || !plot.occupied) return null;

        const crop = this.crops.find(c => c.id === plot.cropId);
        if (!crop || crop.stage !== 'fruit') return null;

        const emotion = Object.values(EmotionTypes).find(e => e.id === crop.emotionId);
        
        const fruit = {
            id: `fruit_${Date.now()}`,
            emotionId: crop.emotionId,
            quality: crop.quality + Math.floor(crop.health / 10),
            fruitName: getFruitName(crop.emotionId),
            statBonus: emotion ? emotion.statBonus : 'spirit',
            value: Math.round(crop.quality * 0.5 + crop.health * 0.3),
            harvestedAt: Date.now(),
            sourceBarId: crop.sourceBarId ?? null,
            sourceBarTitle: crop.sourceBarTitle ?? null,
            campaignRef: crop.campaignRef ?? null,
            gameMasterFace: crop.gameMasterFace ?? null,
            externalSource: crop.externalSource ?? null,
        };

        this.harvestedFruits.push(fruit);

        // Clear the plot
        plot.occupied = false;
        plot.cropId = null;
        plot.watered = false;

        // Remove the crop
        const cropIndex = this.crops.indexOf(crop);
        if (cropIndex > -1) this.crops.splice(cropIndex, 1);

        return fruit;
    }

    /**
     * Refill watering can at water source
     * @param {number} amount - Amount to refill
     */
    refillWater(amount = 100) {
        this.waterLevel = Math.min(this.maxWaterLevel, this.waterLevel + amount);
    }

    /**
     * Upgrade garden to unlock more plots
     */
    upgradeGarden() {
        this.gardenLevel++;
        this.maxPlots = 4 + (this.gardenLevel - 1) * 2;
        this.maxWaterLevel += 25;
        
        // Add new plots
        for (let i = this.plots.length; i < this.maxPlots; i++) {
            this.plots.push({
                id: i,
                x: 160 + (i % 4) * 48,
                y: 200 + Math.floor(i / 4) * 48,
                occupied: false,
                cropId: null,
                soilQuality: 60 + Math.floor(Math.random() * 30),
                watered: false
            });
        }

        return {
            gardenLevel: this.gardenLevel,
            maxPlots: this.maxPlots,
            maxWaterLevel: this.maxWaterLevel
        };
    }

    /**
     * Get all active crops with their progress
     */
    getCropStatus() {
        return this.crops.map(crop => {
            const progress = getGrowthProgress(crop);
            const plot = this.plots.find(p => p.id === crop.plotId);
            const emotion = Object.values(EmotionTypes).find(e => e.id === crop.emotionId);
            
            return {
                ...crop,
                progress: Math.round(progress * 100),
                emotionName: emotion ? emotion.name : 'Unknown',
                emotionColor: emotion ? emotion.color : '#ffffff',
                plotX: plot ? plot.x : 0,
                plotY: plot ? plot.y : 0,
                stageIcon: Object.values(GrowthStages).find(s => s.id === crop.stage)?.icon || '?'
            };
        });
    }

    /**
     * Get available (empty) plots
     */
    getAvailablePlots() {
        return this.plots.filter(p => !p.occupied);
    }

    /**
     * Get all plots
     */
    getAllPlots() {
        return this.plots;
    }

    /**
     * Get summary data
     */
    getSummary() {
        return {
            totalPlots: this.plots.length,
            occupiedPlots: this.plots.filter(p => p.occupied).length,
            activeCrops: this.crops.length,
            harvestedFruits: this.harvestedFruits.length,
            waterLevel: Math.round(this.waterLevel),
            maxWaterLevel: this.maxWaterLevel,
            gardenLevel: this.gardenLevel,
            nurtureActions: this.nurtureActions
        };
    }
}
