/**
 * Emotion System
 * Manages journal entries, seed crystallization, and meditation quality boosts.
 * Core loop: Journal → Seed (every entry) → Meditate to boost quality → Plant
 *
 * Emotional input comes from the player's real life, not random encounters.
 * Every journal entry immediately creates a seed. Higher intensity + meditation = better quality.
 */

import { EmotionTypes } from '../data/Emotions.js';
import { createSeed } from '../data/Seeds.js';

export class EmotionSystem {
    constructor() {
        this.seedsInventory = [];      // Seeds ready to plant
        this.journalEntries = [];      // Player's real-life emotion journal
        this.isMeditating = false;
        this.meditationTimer = 0;
        this.totalMeditationTime = 0;
        
        // Last created seed — can be boosted via meditation before planting
        this.lastSeed = null;
        
        // Seed quality tracking
        this.meditationBoostRate = 5;  // Quality points per second of meditation
        this.maxSeedQuality = 100;
    }

    /**
     * Record a real-life emotional experience and immediately create a seed.
     * @param {string} emotionId - Which emotion was felt
     * @param {number} intensity - 1-100 how strong
     * @param {string} description - What happened (player's words)
     * @param {string} source - 'journal' | 'meditation' | 'reflection'
     * @returns {object} The created seed
     */
    recordEmotion(emotionId, intensity = 50, description = '', source = 'journal', metadata = {}) {
        const entry = {
            id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            emotionId,
            intensity: Math.min(100, Math.max(1, intensity)),
            description: description || `I felt ${emotionId}`,
            source,
            timestamp: Date.now(),
            processed: false,
            metadata: { ...metadata }
        };
        
        this.journalEntries.unshift(entry); // newest first
        
        // Every journal entry creates a seed immediately
        const baseQuality = this._calculateBaseQuality(intensity);
        const seed = this._createSeed(emotionId, baseQuality, metadata);
        
        return seed;
    }

    /**
     * Calculate base seed quality from journal intensity
     * Lower intensities still make seeds, higher intensities make better seeds
     */
    _calculateBaseQuality(intensity) {
        // Scale: intensity 10 → quality 20, intensity 50 → quality 40, intensity 100 → quality 60
        // (intensity/100) maps 0-100 → 0-1, then 0.2 + 0.4 * that = 0.2-0.6 range
        // Scaled to 1-100: 20-60
        return Math.round(20 + (intensity / 100) * 40);
    }

    /**
     * Internal: create a seed and add to inventory
     */
    _createSeed(emotionId, baseQuality, metadata = {}) {
        const quality = Math.min(this.maxSeedQuality, Math.max(1, baseQuality));
        const seed = createSeed(emotionId, quality, metadata);
        this.seedsInventory.push(seed);
        this.lastSeed = seed;
        return seed;
    }

    /**
     * Process meditation — boosts quality of the last created seed
     * @param {number} deltaTime - ms since last frame
     * @param {boolean} isMeditating - Is the player currently meditating
     * @returns {object} Result with boost info
     */
    updateMeditation(deltaTime, isMeditating) {
        this.isMeditating = isMeditating;
        
        const result = {
            boostApplied: 0,
            currentQuality: this.lastSeed ? this.lastSeed.quality : 0,
            hasSeedToBoost: this.lastSeed !== null
        };
        
        if (!isMeditating) {
            this.meditationTimer = 0;
            return result;
        }
        
        this.meditationTimer += deltaTime;
        this.totalMeditationTime += deltaTime;
        
        // Boost the last seed's quality while meditating
        if (this.lastSeed && this.lastSeed.quality < this.maxSeedQuality) {
            const boost = (deltaTime / 1000) * this.meditationBoostRate;
            const previousQuality = this.lastSeed.quality;
            this.lastSeed.quality = Math.min(
                this.maxSeedQuality,
                this.lastSeed.quality + boost
            );
            result.boostApplied = this.lastSeed.quality - previousQuality;
            result.currentQuality = this.lastSeed.quality;
        }
        
        return result;
    }

    /**
     * Get all journal entries
     * @param {number} limit - Max entries to return
     */
    getJournalEntries(limit = 10) {
        return this.journalEntries.slice(0, limit);
    }

    /**
     * Get total number of journal entries
     */
    getEntryCount() {
        return this.journalEntries.length;
    }

    /**
     * Take a seed from inventory (for planting)
     * @param {number} index - Index in seedsInventory
     * @returns {object|null} The seed, or null if invalid
     */
    takeSeed(index = 0) {
        if (index < 0 || index >= this.seedsInventory.length) return null;
        const seed = this.seedsInventory.splice(index, 1)[0];
        return seed;
    }

    /**
     * Get a summary of the current state for the HUD
     */
    getStateSummary() {
        return {
            seedsInventory: this.seedsInventory.map(s => ({
                emotionId: s.emotionId,
                quality: Math.round(s.quality),
                planted: s.planted
            })),
            journalEntries: this.journalEntries.length,
            isMeditating: this.isMeditating,
            meditationTimer: this.meditationTimer,
            hasLastSeed: this.lastSeed !== null,
            lastSeedQuality: this.lastSeed ? Math.round(this.lastSeed.quality) : 0,
            lastSeedEmotion: this.lastSeed ? this.lastSeed.emotionId : null
        };
    }

    /**
     * Reset all state (for new game)
     */
    reset() {
        this.seedsInventory = [];
        this.journalEntries = [];
        this.isMeditating = false;
        this.meditationTimer = 0;
        this.totalMeditationTime = 0;
        this.lastSeed = null;
    }
}
