/**
 * SceneManager — Drives story progression.
 * Routes scene IDs through dialog, evaluates conditions, fires callbacks.
 * Integrates with DialogBox and Game directly.
 */

import { StoryChapters, findScene, findScenesByCondition } from '../data/StoryScript.js';
import { getAdvocateByNpcId, NATION_META } from '../data/CalruniaAdvocates.js';

export class SceneManager {
    constructor(game) {
        this.game = game;
        
        // Story state flags — persist across game sessions
        this.flags = {};
        
        // Current scene context
        this.currentScene = null;
        this.currentChapter = null;
        
        // Whether we're in an NPC conversation (affects dialog cycling)
        this.npcConversation = null;
        this.npcCycleIndex = 0;
        this.npcCycleScenes = [];
    }

    /**
     * Set a story flag
     */
    setFlag(key, value = true) {
        this.flags[key] = value;
    }

    /**
     * Get a story flag value
     */
    getFlag(key, defaultValue = false) {
        return this.flags[key] !== undefined ? this.flags[key] : defaultValue;
    }

    /**
     * Set multiple flags at once
     */
    setFlags(flagMap) {
        if (!flagMap) return;
        for (const [key, value] of Object.entries(flagMap)) {
            this.flags[key] = value;
        }
    }

    /**

    getAllFlags() {
        return { ...this.flags };
    }

     * Check conditions object — supports { flags: {...}, hasTool: 'id', notHasTool: 'id' }
     */
    checkConditions(condition) {
        if (!condition) return true;
        
        // Flag checks — ALL must match
        if (condition.flags) {
            for (const [key, value] of Object.entries(condition.flags)) {
                if (this.flags[key] !== value) return false;
            }
        }
        
        // Has tool check
        if (condition.hasTool) {
            if (!this.game.player.hasTool(condition.hasTool)) return false;
        }
        
        // Does not have tool check
        if (condition.notHasTool) {
            if (this.game.player.hasTool(condition.notHasTool)) return false;
        }
        
        // Quest check
        if (condition.questFlag) {
            if (!this.getFlag(condition.questFlag)) return false;
        }
        
        return true;
    }

    /**
     * Find the first matching scene in a chapter by priority:
     * 1. Scenes with conditions that match
     * 2. Scenes without conditions (fallback)
     */
    findBestScene(chapterId, preferId = null) {
        // If a specific scene is requested and exists, try it
        if (preferId) {
            const scene = findScene(chapterId, preferId);
            if (scene && this.checkConditions(scene.condition)) return scene;
        }
        
        // Find first matching scene with a condition
        const chapter = StoryChapters[chapterId];
        if (!chapter) return null;
        
        for (const scene of chapter) {
            if (this.checkConditions(scene.condition)) return scene;
        }
        
        // Fallback to first scene (no condition)
        return chapter.length > 0 ? chapter[0] : null;
    }

    /**
     * Start a scene — opens dialog and fires onEnter
     * @param {string} chapterId - 'prologue', 'tutorial', 'npc_wu', etc.
     * @param {string} sceneId - optional specific scene ID
     */
    startScene(chapterId, sceneId = null) {
        const scene = this.findBestScene(chapterId, sceneId);
        if (!scene) {
            console.warn(`SceneManager: no scene found in ${chapterId}${sceneId ? ' for ' + sceneId : ''}`);
            return;
        }
        
        this.currentScene = scene;
        this.currentChapter = chapterId;
        
        // Fire onEnter actions
        this._executeActions(scene.onEnter);
        
        // Show the dialog
        const dialogData = {
            speaker: scene.speaker,
            speakerColor: scene.speakerColor || '#c8a96e',
            text: scene.text,
            style: scene.style || 'inner',
            choices: scene.choices ? scene.choices.map(c => ({
                text: c.text,
                action: c.action || 'scene_choice',
                sceneId: c.nextScene || null,
                chapterId: c.nextChapter || chapterId
            })) : undefined
        };
        
        this.game.dialog.show(dialogData);
        this.game.gameState = 'dialog';
    }

    /**
     * Handle a choice from a scene — routes to next scene or action
     */
    handleChoice(choice) {
        if (!this.currentScene) return false;
        
        const action = choice.action || 'close';
        
        // Built-in actions
        if (action === 'close') {
            this.currentScene = null;
            this.currentChapter = null;
            return false; // Let default close logic handle it
        }
        
        if (action === 'open_journal') {
            this.currentScene = null;
            this.currentChapter = null;
            this.game._openJournal();
            return true;
        }
        
        if (action === 'receive_watering_can') {
            this.game.player.giveTool('wateringCan');
            this.game.hud.notify('Received Watering Can! 💧', '#4a8aff');
            this.game._spawnParticles(this.game.player.x, this.game.player.y, 'water');
            this.setFlag('has_can', true);
            
            // Show follow-up tutorial
            setTimeout(() => {
                this.startScene('tutorial', 'got_watering_can');
            }, 600);
            
            this.currentScene = null;
            this.currentChapter = null;
            return true;
        }
        
        if (action === 'tutorial_meditation') {
            this.startScene('tutorial', 'meditation_tutorial');
            return true;
        }
        
        // Scene routing — go to a different scene (may be in different chapter)
        if (choice.sceneId) {
            const chapter = choice.chapterId || this.currentChapter;
            this.startScene(chapter, choice.sceneId);
            return true;
        }
        
        return false;
    }

    /**
     * Start an NPC conversation — finds appropriate scenes for the NPC
     */
    startNPCConversation(npcId) {
        if (npcId.startsWith('adv_')) {
            const adv = getAdvocateByNpcId(npcId);
            if (adv) {
                const meta = NATION_META[adv.nationId];
                const nationLine = meta ? `${meta.label} — ${meta.channel}` : adv.nationId;
                this.npcConversation = npcId;
                this.game.dialog.show({
                    speaker: adv.name,
                    speakerColor: meta?.color || '#c8a96e',
                    text: `${adv.title}\n\n${nationLine}\n${adv.archetype}\n\nWe are the eight faces of practice in our nation — trigram advocates on pilgrimage or duty. The full roster is in the menu under Advocates (press I).`,
                    style: 'npc',
                    choices: [{ text: 'Farewell', action: 'close' }],
                });
                this.game.gameState = 'dialog';
                return;
            }
        }

        const chapterMap = {
            'sage': 'npc_wu',
            'merchant': 'npc_merchant',
            'disciple': 'npc_disciple'
        };
        
        const chapterId = chapterMap[npcId] || 'npc_wu';
        this.npcConversation = npcId;
        
        // Start the appropriate scene
        this.startScene(chapterId);
    }

    /**
     * Execute onEnter actions: setFlags, giveTool, startQuest
     */
    _executeActions(actions) {
        if (!actions) return;
        if (actions.setFlags) this.setFlags(actions.setFlags);
        if (actions.giveTool) this.game.player.giveTool(actions.giveTool);
    }

    /**
     * Check if a tutorial scene should play based on current flags
     */
    checkTutorialTrigger(triggerId) {
        const tutorialMap = {
            'first_journal_done': { flag: 'first_journal', scene: 'first_seed_created' },
            'first_plant_done': { flag: 'first_plant', scene: 'first_planted' },
            'first_water_done': { flag: 'first_water', scene: 'first_watered' },
            'first_harvest_done': { flag: 'first_harvest', scene: 'first_harvested' }
        };
        
        const entry = tutorialMap[triggerId];
        if (!entry) return false;
        
        // Only fire once
        if (this.getFlag(entry.flag)) return false;
        
        this.setFlag(entry.flag + '_triggered', true);
        setTimeout(() => {
            this.startScene('tutorial', entry.scene);
        }, 600);
        return true;
    }

    /**
     * Reset all story state (for new game)
     */
    reset() {
        this.flags = {};
        this.currentScene = null;
        this.currentChapter = null;
        this.npcConversation = null;
    }
}
