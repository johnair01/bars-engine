/**
 * Main Game Class
 * Orchestrates all systems, rendering, and game loop.
 */

import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { AssetGenerator } from './AssetGenerator.js';
import { Player } from '../entities/Player.js';
import { EmotionSystem } from '../systems/EmotionSystem.js';
import { FarmingSystem } from '../systems/FarmingSystem.js';
import { CultivationSystem } from '../systems/CultivationSystem.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { HUD } from '../ui/HUD.js';
import { Menu } from '../ui/Menu.js';
import { DialogBox } from '../ui/DialogBox.js';
import { SceneManager } from '../systems/SceneManager.js';
import { SaveManager } from '../systems/SaveManager.js';
import { DeckSystem } from '../systems/DeckSystem.js';
import { AssetLoader } from './AssetLoader.js';
import { EmotionTypes } from '../data/Emotions.js';
import { ADVOCATES, ADVOCATE_WORLD_SPAWNS } from '../data/CalruniaAdvocates.js';

const CONTROL_TO_KEY = {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    a: 'e',
    b: ' ',
    start: 'i',
    select: 'j',
    back: 'Escape',
};

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        // Core
        this.input = new Input();
        this.camera = new Camera(canvas.width, canvas.height);
        this.assetGen = new AssetGenerator();
        this.assets = new AssetLoader(this.assetGen);
        
        // Systems
        this.player = new Player(400, 300);
        this.emotion = new EmotionSystem();
        this.farming = new FarmingSystem();
        this.cultivation = new CultivationSystem();
        this.time = new TimeSystem();
        
        // Quest system needs refs to other systems
        this.quests = new QuestSystem(this.cultivation, this.emotion, this.farming);
        this.deck = new DeckSystem();
        
        // UI
        this.hud = new HUD(canvas);
        this.menu = new Menu(canvas);
        this.menu.onSave = () => {
            const gs = this._buildGameState();
            if (this.saves && this.saves.saveImmediate(gs)) {
                const meta = this.saves.getSaveMeta();
                this.menu.setSaveMeta(meta);
                this.hud.notify('Game saved! 💾', '#4a8aff');
            } else {
                this.hud.notify('Save failed!', '#ff4444');
            }
        };
        this.menu.onLoad = () => {
            const gs = this._buildGameState();
            if (this.saves && this.saves.load(gs)) {
                this.hud.notify('Game loaded! 📂', '#88cc44');
                this.menu.setSaveMeta(this.saves.getSaveMeta());
            } else {
                this.hud.notify('No save found.', '#8a8a60');
            }
        };
        this.dialog = new DialogBox(canvas);
        
        // Game state
        this.running = false;
        this.lastTime = 0;
        this.gameTime = 0;
        this.gameState = 'playing'; // 'playing', 'dialog', 'menu', 'meditation'
        
        // World
        this.mapWidth = 1200;
        this.mapHeight = 900;
        this.tileSize = 32;
        this.worldObjects = [];
        this.interactables = [];
        this.waterZones = [];      // Impassable water tiles
        this.particles = [];
        
        // Journal system
        this.journalMode = false;
        this.bridgeCompletions = new Set();
        this._boundBridgeMessage = (event) => this._handleBridgeMessage(event);
        window.addEventListener('message', this._boundBridgeMessage);
        
        // Legacy tutorial tracking (migrating to story system)
        this.tutorial = {
            started: false
        };
        
        // NPCs
        this.npcs = [];
        
        // FPS tracking
        this.fps = 0;
        this.fpsTimer = 0;
        this.frameCount = 0;
        
        // Camera bounds
        this.camera.setBounds(0, 0, this.mapWidth - canvas.width, this.mapHeight - canvas.height);
        
        // Initialize world
        this._initWorld();
        this._initNPCs();
        this._initGarden();
        
        // Story system
        this.story = new SceneManager(this);

        this.menu.onDeckSpendCard = (cardId) => {
            const r = this.deck.trySpendCardForCultivationReflection(cardId, this.cultivation);
            if (r.ok) {
                this.hud.notify(r.message, '#c8a8e8');
                const spentCard = this.deck.cards.find((card) => card.id === cardId);
                if (spentCard?.sourceBarId) {
                    this._emitBarsEngineCompletion({
                        sourceBarId: spentCard.sourceBarId,
                        emotionId: spentCard.emotionId || 'fear',
                        seedQuality: spentCard.seedQuality || 55,
                        cultivationAction: 'witness_card_channeled',
                        harvestedInsight: r.message,
                        campaignRef: spentCard.campaignRef ?? null,
                        resultText: r.message,
                    });
                }
                if (!this.story.getFlag('ch1_first_card_spent')) {
                    this.story.setFlag('ch1_first_card_spent', true);
                    this.story.setFlag('ch1_bar_deck_complete', true);
                }
                this._autoSave();
            } else {
                this.hud.notify('That card cannot be channeled again.', '#aa6666');
            }
        };
        this.menu.onDeckExportCard = (cardId) => {
            const r = this.deck.exportBridgePayloadForCard(cardId);
            if (!r.ok) {
                this.hud.notify('Could not prepare that card for bridge export.', '#aa6666');
                return;
            }
            const text = JSON.stringify(r.payload, null, 2);
            localStorage.setItem('inner_garden_last_bridge_export', text);
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                navigator.clipboard.writeText(text)
                    .then(() => this.hud.notify('Bridge JSON copied. Also saved as inner_garden_last_bridge_export.', '#88ccff'))
                    .catch(() => this.hud.notify('Bridge JSON saved as inner_garden_last_bridge_export.', '#88ccff'));
            } else {
                this.hud.notify('Bridge JSON saved as inner_garden_last_bridge_export.', '#88ccff');
            }
        };
        
        // Save system
        this.saves = new SaveManager();
        
        // Dialog callbacks
        this.dialog.onChoice = (action, choice) => this._handleDialogChoice(action, choice);
        this.dialog.onJournalSubmit = (entry) => this._handleJournalSubmit(entry);
        this.dialog.onBarSubmit = (payload) => this._handleBarSubmit(payload);
        
        // Track state for debug HUD
        this._syncState();
    }

    _handleBridgeMessage(event) {
        const data = event.data;
        if (!data || typeof data !== 'object') return;

        if (data.schemaVersion === 'inner-garden-control.v1') {
            const key = data.key;
            if (!key) return;
            if (data.action === 'press') this.input.pressVirtualKey(key);
            if (data.action === 'release') this.input.releaseVirtualKey(key);
            if (data.action === 'tap') this.input.tapVirtualKey(key);
            return;
        }

        if (data.schemaVersion === 'inner-garden-control.v2') {
            const key = CONTROL_TO_KEY[data.control];
            if (!key) return;
            if (data.action === 'press') this.input.pressVirtualKey(key);
            if (data.action === 'release') this.input.releaseVirtualKey(key);
            if (data.action === 'tap') this.input.tapVirtualKey(key);
            return;
        }

        if (data.schemaVersion === 'bars-inner-garden.v1') {
            this._importBarsEngineBar(data);
        }
    }

    _importBarsEngineBar(payload) {
        const imported = this.deck.importBarsEnginePayload(payload);
        if (!imported.ok) {
            this.hud.notify('The imported BAR could not take root here.', '#cc6666');
            return;
        }
        if (imported.reason === 'already_imported') {
            this.hud.notify('That BAR is already resting in the garden.', '#c8a8e8');
            return;
        }

        const emotionId = imported.card?.emotionId || payload.bar?.emotionHint || 'fear';
        const intensity = imported.bar?.intensity || payload.bar?.intensity || 55;
        const description = payload.bar?.description || payload.bar?.title || 'Imported BAR';
        const seed = this.emotion.recordEmotion(
            emotionId,
            intensity,
            description,
            'bars-engine',
            {
                sourceBarId: payload.bar.id,
                sourceBarTitle: payload.bar.title,
                campaignRef: payload.bar.campaignRef ?? null,
                gameMasterFace: payload.bar.gameMasterFace ?? null,
                externalSource: 'bars-engine',
            }
        );

        this.story.setFlag('first_bar', true);
        this.story.setFlag('first_card_minted', true);
        this.quests.updateProgress('seed_created', { emotionId });
        this.hud.hideJournalHint();
        this.hud.notify(
            `Imported "${payload.bar.title}" as seed ${Math.round(seed.quality)} and witness card.`,
            '#c8a8e8'
        );
        this._autoSave();

        window.parent?.postMessage({
            schemaVersion: 'inner-garden-imported.v1',
            sourceBarId: payload.bar.id,
            seedId: seed.id,
            cardId: imported.card?.id ?? null,
        }, window.location.origin);
    }

    _emitBarsEngineCompletion(detail) {
        const sourceBarId = detail.sourceBarId;
        if (!sourceBarId || this.bridgeCompletions.has(sourceBarId)) return;

        this.bridgeCompletions.add(sourceBarId);
        window.parent?.postMessage({
            schemaVersion: 'inner-garden-bars.v1',
            guideFace: 'shaman',
            sourceBarId,
            emotionId: detail.emotionId || 'fear',
            seedQuality: Math.max(1, Math.min(100, Math.round(Number(detail.seedQuality) || 55))),
            cultivationAction: detail.cultivationAction || 'inner_garden_cultivation',
            harvestedInsight: detail.harvestedInsight || detail.resultText || 'A charge became a tended witness in the Inner Garden.',
            resultText: detail.resultText || detail.harvestedInsight || '',
            campaignRef: detail.campaignRef ?? null,
            completedAt: new Date().toISOString(),
        }, window.location.origin);
    }

    /**
     * Build a game state object for the save system
     */
    _buildGameState() {
        return {
            player: this.player,
            cultivation: this.cultivation,
            emotion: this.emotion,
            farming: this.farming,
            story: this.story,
            quests: this.quests,
            deck: this.deck,
        };
    }

    /**
     * Auto-save: mark save as dirty (debounced)
     */
    _autoSave() {
        if (this.saves) {
            this.saves.markDirty(this._buildGameState());
        }
    }

    /**
     * Sync game state string to HUD for debug display
     */
    _syncState() {
        this.hud.setStateString(this.gameState);
    }

    /**
     * Initialize the world with objects
     */
    _initWorld() {
        // Trees
        const treePositions = [
            { x: 100, y: 80 }, { x: 700, y: 60 }, { x: 900, y: 120 },
            { x: 150, y: 500 }, { x: 800, y: 600 }, { x: 950, y: 450 },
            { x: 60, y: 700 }, { x: 1050, y: 750 }
        ];
        
        for (const pos of treePositions) {
            this.worldObjects.push({
                type: 'tree',
                x: pos.x,
                y: pos.y,
                w: 48,
                h: 48,
                solid: true,
                sprite: this.assets.getSprite('tree')
            });
        }
        
        // Rocks
        const rockPositions = [
            { x: 250, y: 150 }, { x: 550, y: 100 }, { x: 850, y: 300 }
        ];
        
        for (const pos of rockPositions) {
            this.worldObjects.push({
                type: 'rock',
                x: pos.x,
                y: pos.y,
                w: 32,
                h: 32,
                solid: true,
                sprite: this.assets.getSprite('rock')
            });
        }
        
        // Temple / Meditation Hall (center-ish)
        this.worldObjects.push({
            type: 'building',
            x: 400,
            y: 80,
            w: 64,
            h: 60,
            solid: true,
            sprite: this.assets.getSprite('building', 'temple'),
            interactable: true,
            interactionType: 'meditate'
        });
        
        // Water pond (interaction for refill) — also impassable
        this.worldObjects.push({
            type: 'pond',
            x: 100,
            y: 320,
            w: 80,
            h: 48,
            solid: true,
            sprite: null,
            interactable: true,
            interactionType: 'refill_water'
        });
        
        // Water tiles — create impassable zones
        for (let tx = 2; tx <= 5; tx++) {
            for (let ty = 9; ty <= 12; ty++) {
                this.waterZones.push({ x: tx * 32, y: ty * 32 });
            }
        }
    }

    /**
     * Initialize NPCs
     */
    _initNPCs() {
        const npcData = [
            { id: 'sage', name: 'Master Wu', type: 'sage', x: 480, y: 120 },
            { id: 'merchant', name: 'Mei-Lin', type: 'merchant', x: 200, y: 200 },
            { id: 'disciple', name: 'Young Disciple', type: 'disciple', x: 650, y: 250 }
        ];
        
        for (const data of npcData) {
            this.npcs.push({
                ...data,
                sprite: this.assets.getSprite('npc', data.type)
            });
        }

        // New walkable NPCs: pick advocateId from CalruniaAdvocates (see getAdvocatesAvailableForWorld), then add to ADVOCATE_WORLD_SPAWNS.
        const byAdvocateId = new Map(ADVOCATES.map((a) => [a.id, a]));
        for (const spawn of ADVOCATE_WORLD_SPAWNS) {
            const adv = byAdvocateId.get(spawn.advocateId);
            if (!adv) continue;
            this.npcs.push({
                id: `adv_${adv.id}`,
                name: adv.name,
                type: spawn.spriteType,
                x: spawn.x,
                y: spawn.y,
                sprite: this.assets.getSprite('npc', spawn.spriteType),
            });
        }
    }

    /**
     * Initialize garden plots
     */
    _initGarden() {
        this.farming.initializePlots();
    }

    /**
     * Start the game
     */
    start() {
        this.running = true;
        this.lastTime = performance.now();
        
        // Check for existing save
        const gameState = this._buildGameState();
        const loaded = this.saves.load(gameState);
        
        if (loaded) {
            this.menu.setSaveMeta(this.saves.getSaveMeta());
            setTimeout(() => {
                this.hud.notify('Welcome back, cultivator. 🌱', '#88cc44');
            }, 500);
        } else {
            // First-time player — show prologue
            setTimeout(() => {
                this.story.startScene('prologue', 'welcome');
            }, 1500);
        }
        
        // Save on window close
        window.addEventListener('beforeunload', () => {
            this.saves.saveImmediate(this._buildGameState());
        });

        window.parent?.postMessage({ schemaVersion: 'inner-garden-ready.v1' }, window.location.origin);
        
        this._gameLoop(performance.now());
    }

    /**
     * Main game loop
     */
    _gameLoop(currentTime) {
        if (!this.running) return;
        
        const deltaTime = Math.min(currentTime - this.lastTime, 50); // Cap at 50ms
        this.lastTime = currentTime;
        this.gameTime += deltaTime;
        
        // FPS calculation
        this.frameCount++;
        this.fpsTimer += deltaTime;
        if (this.fpsTimer >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer = 0;
        }
        
        // Update
        this._update(deltaTime);
        
        // Render
        this._render(deltaTime);
        
        requestAnimationFrame((t) => this._gameLoop(t));
    }

    /**
     * Main update function
     */
    _update(deltaTime) {
        // Sync state to HUD debug display
        this._syncState();
        this.input.beginFrame();
        
        // Safety: pressing Escape 3 times quickly forces back to playing
        const escHit = this.input.isKeyJustPressed('Escape');
        if (escHit) {
            if (this._escapeCount === undefined || this._escapeCount === 0) {
                this._escapeFirstTime = performance.now();
                this._escapeCount = 1;
            } else {
                const elapsed = performance.now() - (this._escapeFirstTime || 0);
                if (elapsed < 1500) {
                    this._escapeCount++;
                    if (this._escapeCount >= 3) {
                        this.dialog.close();
                        this.menu.close();
                        this.gameState = 'playing';
                        this._escapeCount = 0;
                        this.hud.notify('⚠ Unstuck: reset to playing', '#ff6644');
                    }
                } else {
                    this._escapeCount = 1;
                    this._escapeFirstTime = performance.now();
                }
            }
        }
        
        // Handle dialog input first
        if (this.gameState === 'dialog') {
            this.dialog.setMousePosition(this.input.mouse.x, this.input.mouse.y);
            this.dialog.handleInput(this.input);
            this.dialog.update(deltaTime);
            
            if (!this.dialog.isOpen) {
                this.gameState = 'playing';
                this.input.clearKeys(); // Prevent ghost movement from stale keys
            }
            
            this.input.endFrame();
            return;
        }
        
        // Handle menu input
        if (this.gameState === 'menu') {
            this.menu.handleInput(this.input, this._buildGameState());
            
            if (!this.menu.isOpen) {
                this.gameState = 'playing';
            }
            
            this.input.endFrame();
            return;
        }
        
        // === PLAYING STATE ===
        
        // Toggle menu
        if (this.input.isKeyJustPressed('Escape') || this.input.isKeyJustPressed('i') || this.input.isKeyJustPressed('I')) {
            this.menu.toggle();
            this.gameState = this.menu.isOpen ? 'menu' : 'playing';
        }
        
        if (this.menu.isOpen) {
            this.input.endFrame();
            return;
        }
        
        // Update time
        this.time.update(deltaTime);
        
        // Player movement
        const movement = this.input.getMovementDirection();
        
        // Collect obstacles for collision (world objects, NPCs, water zones)
        const obstacles = [
            ...this.worldObjects.filter(obj => obj.solid).map(obj => ({ x: obj.x, y: obj.y, w: obj.w, h: obj.h })),
            ...this.waterZones.map(zone => ({ x: zone.x, y: zone.y, w: 32, h: 32 })),
            ...this.npcs.map(npc => ({ x: npc.x - 14, y: npc.y - 14, w: 28, h: 28 }))
        ];
        
        // Meditation toggle
        const meditating = this.input.isKeyDown('m') || this.input.isKeyDown('M');
        if (meditating && !this.player.isActing()) {
            this.player.startAction('meditating', 100);
            this.gameState = 'meditation';
        }
        
        // Update player
        this.player.update(deltaTime, movement, obstacles);
        
        // Update emotion system — meditation boosts seed quality
        const meditationResult = this.emotion.updateMeditation(deltaTime, this.gameState === 'meditation');
        
        // Tutorial: first meditation boost
        if (this.gameState === 'meditation' && meditationResult.hasSeedToBoost && !this.story.getFlag('first_meditation')) {
            if (meditationResult.boostApplied > 0) {
                this.story.setFlag('first_meditation', true);
                this.hud.notify(`Seed quality improving: ${Math.round(meditationResult.currentQuality)}`, '#e8c88a');
            }
        }
        
        if (this.gameState === 'meditation' && !meditating) {
            this.gameState = 'playing';
            this.input.clearKeys(); // Prevent ghost movement from stale keys
            this._autoSave(); // Save after meditation
            // Notify when stopping meditation with quality info
            if (meditationResult.hasSeedToBoost) {
                this.hud.notify(`Meditation complete. Seed quality: ${Math.round(meditationResult.currentQuality)}`, '#88cc44');
            } else {
                this.hud.notify('Record a BAR first (J), then meditate to boost seeds.', '#8a8a60');
            }
        }
        
        // Update cultivation system (passive qi regen)
        this.cultivation.regenerateQi(deltaTime);
        
        // Update farming system
        const advancedCrops = this.farming.update(deltaTime);
        for (const crop of advancedCrops) {
            const emotion = Object.values(EmotionTypes).find(e => e.id === crop.emotionId);
            const name = emotion ? emotion.name : 'Mystery';
            this.hud.notify(`${name} crop grew to ${crop.stage}!`, emotion ? emotion.color : '#88cc44');
        }
        
        // Update quest progress
        this.quests.updateProgress('meditation', { time: this.emotion.meditationTimer });
        this.quests.updateProgress('nurture_action', { count: this.farming.nurtureActions });
        
        // Camera follow
        this.camera.setTarget(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2
        );
        this.camera.update(deltaTime);
        
        // Handle interaction (E key)
        if (this.input.isKeyJustPressed('e') || this.input.isKeyJustPressed('E')) {
            this._handleInteraction();
        }
        
        // Handle action (Space)
        if (this.input.isKeyJustPressed(' ')) {
            this._handleAction();
        }
        
        // Open BAR capture (J key) — player records Behavior / Activation / Result
        if (this.input.isKeyJustPressed('j') || this.input.isKeyJustPressed('J')) {
            this._openJournal();
        }
        
        // Update particles
        this._updateParticles(deltaTime);
        
        this.input.endFrame();
    }

    /**
     * Handle interaction (E key)
     */
    _handleInteraction() {
        const px = this.player.x + this.player.width / 2;
        const py = this.player.y + this.player.height / 2;
        const range = this.player.interactionRange;
        
        // Find closest NPC within range
        let closestNpc = null;
        let closestNpcDist = range;
        for (const npc of this.npcs) {
            const dx = px - npc.x;
            const dy = py - npc.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestNpcDist) {
                closestNpcDist = dist;
                closestNpc = npc;
            }
        }
        
        // Find closest interactable object within range
        let closestObj = null;
        let closestObjDist = range;
        for (const obj of this.worldObjects) {
            if (!obj.interactable) continue;
            const ox = obj.x + obj.w / 2;
            const oy = obj.y + obj.h / 2;
            const dist = Math.sqrt((px - ox) * (px - ox) + (py - oy) * (py - oy));
            if (dist < closestObjDist) {
                closestObjDist = dist;
                closestObj = obj;
            }
        }
        
        // Interact with the closer of the two (NPC or object)
        if (closestNpc && (!closestObj || closestNpcDist <= closestObjDist)) {
            this._talkToNPC(closestNpc);
            return;
        }
        
        if (closestObj) {
            if (closestObj.interactionType === 'meditate') {
                this.dialog.show({
                    speaker: '✦ Meditation Hall',
                    speakerColor: '#e8c88a',
                    text: 'The temple radiates peaceful energy. You feel your inner storms calming.\n\nPress M to meditate anytime. While meditating, emotional triggers are processed automatically.',
                    style: 'inner'
                });
                this.gameState = 'dialog';
            } else if (closestObj.interactionType === 'refill_water') {
                const can = this.player.getTool('wateringCan');
                if (can && can.owned) {
                    can.water = can.maxWater;
                    this.hud.notify('Watering can refilled! 💧', '#4a8aff');
                } else {
                    this.hud.notify('You have nothing to fill. Get a watering can from Master Wu.', '#8a8a60');
                }
            }
        }
        
        // Check garden plots
        for (const plot of this.farming.getAllPlots()) {
            const dx = px - (plot.x + 16);
            const dy = py - (plot.y + 16);
            if (Math.sqrt(dx * dx + dy * dy) < range) {
                if (plot.occupied) {
                    const crop = this.farming.crops.find(c => c.id === plot.cropId);
                    if (crop) {
                        const emotion = Object.values(EmotionTypes).find(e => e.id === crop.emotionId);
                        this.dialog.show({
                            speaker: `${emotion ? emotion.name : 'Crop'} ${crop.stage}`,
                            speakerColor: emotion ? emotion.color : '#88cc44',
                            text: `${emotion ? emotion.name : 'This'} crop is in the ${crop.stage} stage.\nHealth: ${Math.round(crop.health)}%\nWater: ${crop.waterGiven} times\nProgress: ${Math.round(crop.progress)}%`,
                            style: 'system'
                        });
                        this.gameState = 'dialog';
                    }
                }
                return;
            }
        }
    }

    /**
     * Talk to an NPC
     */
    _talkToNPC(npc) {
        this.story.startNPCConversation(npc.id);
    }

    /**
     * Handle action (Space) - watering, planting, harvesting
     */
    _handleAction() {
        const px = this.player.x + this.player.width / 2;
        const py = this.player.y + this.player.height / 2;
        const range = this.player.interactionRange;
        
        // Find the closest plot within range (not first-match)
        let closestPlot = null;
        let closestDist = range + 20;
        for (const plot of this.farming.getAllPlots()) {
            const dx = px - (plot.x + 16);
            const dy = py - (plot.y + 16);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
                closestDist = dist;
                closestPlot = plot;
            }
        }
        
        const plot = closestPlot;
        if (!plot) return;
        
        if (plot.occupied) {
            const crop = this.farming.crops.find(c => c.id === plot.cropId);
            if (!crop) return;
            
            if (crop.stage === 'fruit') {
                // Harvest
                const fruit = this.farming.harvestCrop(plot.id);
                if (fruit) {
                            this.hud.notify(`Harvested ${fruit.fruitName}!`, '#ff8844');
                            const result = this.cultivation.consumeFruit(fruit);
                            if (fruit.sourceBarId) {
                                this._emitBarsEngineCompletion({
                                    sourceBarId: fruit.sourceBarId,
                                    emotionId: fruit.emotionId,
                                    seedQuality: fruit.quality,
                                    cultivationAction: 'seed_harvested',
                                    harvestedInsight: `Harvested ${fruit.fruitName}: ${result.fruitName} settled into cultivation.`,
                                    campaignRef: fruit.campaignRef ?? null,
                                    resultText: `${fruit.fruitName} became cultivation experience in the Inner Garden.`,
                                });
                            }
                            this.quests.updateProgress('crop_harvested', { emotionId: fruit.emotionId });
                            this._spawnParticles(plot.x, plot.y, fruit.emotionId);
                            this._autoSave();
                            
                            // Tutorial: first harvest
                            if (!this.story.getFlag('first_harvest')) {
                                this.story.setFlag('first_harvest', true);
                                setTimeout(() => {
                                    this.dialog.show({
                                        speaker: '✦ Inner Voice',
                                        speakerColor: '#e8c88a',
                                        text: `You harvested your first Enlightenment Fruit!\n\n${result.fruitName}\n• ${result.statGained}: +${result.statAmount}\n• Cultivation EXP: +${result.expGained}\n\nEmotions are not your enemy — they are compost for your growth.\n\nThe fruit has been consumed. Check your stats in the menu (I).`,
                                        style: 'inner',
                                        choices: [
                                            { text: 'Continue my journey', action: 'close' }
                                        ]
                                    });
                                    this.gameState = 'dialog';
                                }, 600);
                            }
                        }
                    } else {
                        // Water the crop — requires watering can tool
                        if (!this.player.hasTool('wateringCan')) {
                            this.hud.notify('You need a watering can! Talk to Master Wu.', '#ff8844');
                        } else {
                            const can = this.player.getTool('wateringCan');
                            if (can.water <= 0) {
                                this.hud.notify('Watering can is empty! Refill at the pond (press E near it).', '#4a8aff');
                            } else {
                                // Use water from the can
                                const waterUsed = 10;
                                can.water = Math.max(0, can.water - waterUsed);
                                
                                const result = this.farming.waterCrop(plot.id);
                                if (result.success) {
                                    this.player.startAction('watering', 300);
                                    this.hud.notify(`Watered crop 💧 (${Math.round(can.water)}/${can.maxWater})`, '#4a8aff');
                                    this._spawnParticles(plot.x + 16, plot.y, 'water');
                                    this._autoSave();
                                    
                                    // Tutorial: first water
                                    if (!this.story.getFlag('first_water')) {
                                        this.story.setFlag('first_water', true);
                                        this.story.checkTutorialTrigger('first_water_done');
                                    }
                                } else {
                                    this.hud.notify(result.reason, '#aa6a6a');
                                }
                            }
                        }
                    }
                } else if (this.emotion.seedsInventory.length > 0) {
                    // Plant a seed — take it from inventory first
                    const seed = this.emotion.takeSeed(0);
                    if (seed) {
                        const crop = this.farming.plantSeed(seed, plot.id);
                        if (crop) {
                            this.hud.notify('Planted a seed! 🌱', '#88cc44');
                            this.quests.updateProgress('seed_created', { emotionId: seed.emotionId });
                            this._spawnParticles(plot.x, plot.y, seed.emotionId);
                            this._autoSave();
                            
                            // Tutorial: first plant
                            if (!this.story.getFlag('first_plant')) {
                                this.story.setFlag('first_plant', true);
                                this.story.checkTutorialTrigger('first_plant_done');
                            }
                        } else {
                            // Put it back if planting failed
                            this.emotion.seedsInventory.unshift(seed);
                        }
                    }
                } else {
                    this.hud.notify('No seeds. Press J to write a BAR and create seeds.', '#8a8a60');
                }
    }

    /**
     * Handle dialog choices
     */
    _handleDialogChoice(action, choice) {
        // Let SceneManager try routing first
        if (this.story.handleChoice(choice)) return;
        
        // Fallback to direct actions
        if (action === 'open_journal') {
            this._openJournal();
        } else if (action === 'reflect') {
            this._openJournal();
        }
    }

    /**
     * Open BAR capture (key J) — Chapter 1 player-authored loop
     */
    _openJournal() {
        this.input.clearKeys();
        this.dialog.openBarCapture();
        this.gameState = 'dialog';
    }

    /**
     * Handle a journal entry submission from the dialog system
     * Every journal entry creates a seed. Quality depends on intensity + meditation.
     */
    _handleJournalSubmit(entry) {
        // Record emotion and create seed
        const seed = this.emotion.recordEmotion(
            entry.emotionId,
            entry.intensity,
            entry.description,
            'journal'
        );
        
        const emotion = Object.values(EmotionTypes).find(e => e.id === entry.emotionId);
        this.hud.notify(
            `✨ Seed created: ${emotion ? emotion.name : entry.emotionId} (Quality: ${Math.round(seed.quality)})`,
            emotion ? emotion.color : '#88cc44'
        );
        this.hud.hideJournalHint();
        
        // Tutorial: first journal
        if (!this.story.getFlag('first_journal')) {
            this.story.setFlag('first_journal', true);
            this.story.checkTutorialTrigger('first_journal_done');
        }
        
        // Update quest progress
        this.quests.updateProgress('journal_entry', { count: this.emotion.getEntryCount() });
        
        // Auto-save after journal entry
        this._autoSave();
    }

    /**
     * BAR capture (Chapter 1): BarRecord + minted card + dual-write seed (Migration B).
     */
    _handleBarSubmit(payload) {
        const { emotionId, intensity, behavior, activation, result } = payload;

        const add = this.deck.tryAddBar({
            emotionTag: emotionId,
            intensity,
            behavior,
            activation,
            result,
        });
        if (!add.ok) {
            this.hud.notify(
                add.reason === 'limit'
                    ? 'Many BARs already rest here. Future chapters will teach release.'
                    : 'Each step needs a few honest words before sealing.',
                '#cc6666'
            );
            return;
        }

        const mint = this.deck.mintFromBar(add.bar.id);
        if (!mint.ok || !mint.card) {
            this.hud.notify('The garden could not crystallize a card from that BAR.', '#cc6666');
            return;
        }

        const desc = `B: ${behavior}\nA: ${activation}\nR: ${result}`;
        const seed = this.emotion.recordEmotion(emotionId, intensity, desc, 'bar');

        const emotion = Object.values(EmotionTypes).find((e) => e.id === emotionId);
        this.hud.notify(
            `BAR sealed · Card “${mint.card.title}” · Seed ${Math.round(seed.quality)} (${emotion ? emotion.name : emotionId})`,
            '#c8a8e8'
        );
        this.hud.hideJournalHint();

        if (!this.story.getFlag('first_journal')) {
            this.story.setFlag('first_journal', true);
            this.story.setFlag('first_bar', true);
            this.story.checkTutorialTrigger('first_journal_done');
        } else if (!this.story.getFlag('first_bar')) {
            this.story.setFlag('first_bar', true);
        }
        if (!this.story.getFlag('first_card_minted')) {
            this.story.setFlag('first_card_minted', true);
        }

        this.quests.updateProgress('seed_created', { emotionId });
        this._autoSave();
    }

    /**
     * Spawn particle effects
     */
    _spawnParticles(x, y, type) {
        const particleCount = type === 'water' ? 5 : 10;
        const emotion = Object.values(EmotionTypes).find(e => e.id === type);
        const color = emotion ? emotion.color : type === 'water' ? '#4a8aff' : '#e8c88a';
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x + Math.random() * 32,
                y: y + Math.random() * 32,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 4 - 1,
                life: 1,
                color: color,
                size: 2 + Math.random() * 4
            });
        }
    }

    /**
     * Update particles
     */
    _updateParticles(deltaTime) {
        const dt = deltaTime / 1000;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // gravity
            p.life -= dt * 1.5;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Render the game
     */
    _render(deltaTime) {
        const ctx = this.ctx;
        const cam = this.camera;
        const offset = cam.getOffset();
        
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        
        // === CLEAR ===
        ctx.fillStyle = this.time.getSkyColor();
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // === WORLD ===
        ctx.save();
        ctx.translate(-offset.x, -offset.y);
        
        // Ambient light overlay
        const ambientLight = this.time.getAmbientLight();
        
        // Render ground tiles (grass grid)
        const startTileX = Math.floor(offset.x / this.tileSize);
        const startTileY = Math.floor(offset.y / this.tileSize);
        const endTileX = Math.ceil((offset.x + this.canvas.width) / this.tileSize);
        const endTileY = Math.ceil((offset.y + this.canvas.height) / this.tileSize);
        
        for (let tx = startTileX; tx <= endTileX; tx++) {
            for (let ty = startTileY; ty <= endTileY; ty++) {
                const tileX = tx * this.tileSize;
                const tileY = ty * this.tileSize;
                
                if (tileX > this.mapWidth || tileY > this.mapHeight) continue;
                
                // Different tile types based on position
                let tileSprite = this.assets.getSprite('tile_grass');
                
                // Paths
                if ((tx >= 10 && tx <= 15 && ty === 10) || 
                    (tx === 15 && ty >= 8 && ty <= 15)) {
                    tileSprite = this.assets.getSprite('tile_path');
                }
                
                // Water area
                if (tx >= 2 && tx <= 5 && ty >= 9 && ty <= 12) {
                    tileSprite = this.assets.getSprite('tile_water');
                }
                
                ctx.drawImage(tileSprite, tileX, tileY);
            }
        }
        
        // Render garden plots
        for (const plot of this.farming.getAllPlots()) {
            ctx.drawImage(this.assets.getSprite('tile_soil'), plot.x, plot.y);
            
            // Render crop on plot
            if (plot.occupied) {
                const crop = this.farming.crops.find(c => c.id === plot.cropId);
                if (crop) {
                    const cropSprite = this.assets.getSprite('crop', crop.stage, crop.emotionId);
                    ctx.drawImage(cropSprite, plot.x, plot.y - 8);
                    
                    // Health indicator
                    if (crop.health < 50) {
                        ctx.fillStyle = crop.health < 25 ? '#ff4444' : '#ffaa44';
                        ctx.fillRect(plot.x + 8, plot.y - 4, 16 * (crop.health / 100), 2);
                    }
                }
            }
        }
        
        // Render world objects
        for (const obj of this.worldObjects) {
            if (obj.sprite) {
                ctx.drawImage(obj.sprite, obj.x, obj.y);
            }
        }
        
        // Render NPCs
        for (const npc of this.npcs) {
            if (npc.sprite) {
                ctx.drawImage(npc.sprite, npc.x - 16, npc.y - 16);
                
                // Name tag
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(npc.x - 25, npc.y - 32, 50, 10);
                ctx.fillStyle = '#c8a96e';
                ctx.font = '7px Georgia';
                ctx.textAlign = 'center';
                ctx.fillText(npc.name, npc.x, npc.y - 24);
                ctx.textAlign = 'left';
            }
        }
        
        // Render particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // === PLAYER ===
        const playerState = this.player.getRenderState();
        const playerSprite = this.assets.getSprite('player', playerState.direction);
        ctx.drawImage(playerSprite, playerState.x, playerState.y);
        
        // Player trail (qi footprints)
        for (const trail of playerState.trail) {
            ctx.globalAlpha = trail.life * 0.2;
            ctx.fillStyle = '#e8c88a';
            ctx.beginPath();
            ctx.arc(trail.x + 16, trail.y + 28, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // Active meditation glow
        if (this.gameState === 'meditation') {
            const glowSprite = this.assets.getSprite('meditation_glow', '#e8c88a');
            ctx.drawImage(glowSprite, this.player.x - 8, this.player.y - 8);
            
            ctx.fillStyle = '#e8c88a';
            ctx.font = '9px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText('◎ Meditating...', this.player.x + 16, this.player.y - 10);
            ctx.textAlign = 'left';
        }
        
        // === INTERACTION PROMPTS ===
        if (this.gameState === 'playing') {
            const px = this.player.x + this.player.width / 2;
            const py = this.player.y + this.player.height / 2;
            const range = this.player.interactionRange + 10;
            
            // Check NPCs nearby
            for (const npc of this.npcs) {
                const dx = px - npc.x;
                const dy = py - npc.y;
                if (Math.sqrt(dx * dx + dy * dy) < range) {
                    const icon = this.assets.getSprite('interact_icon', 'talk');
                    ctx.drawImage(icon, npc.x - 12, npc.y - 38);
                    ctx.fillStyle = 'rgba(0,0,0,0.4)';
                    ctx.fillRect(npc.x - 20, npc.y - 48, 40, 10);
                    ctx.fillStyle = '#c8a96e';
                    ctx.font = '7px Georgia';
                    ctx.textAlign = 'center';
                    ctx.fillText('E to talk', npc.x, npc.y - 40);
                    ctx.textAlign = 'left';
                }
            }
            
            // Check garden plots nearby
            for (const plot of this.farming.getAllPlots()) {
                const dx = px - (plot.x + 16);
                const dy = py - (plot.y + 16);
                if (Math.sqrt(dx * dx + dy * dy) < range) {
                    let iconType = 'talk';
                    let label = '';
                    if (plot.occupied) {
                        const crop = this.farming.crops.find(c => c.id === plot.cropId);
                        if (crop && crop.stage === 'fruit') {
                            iconType = 'harvest';
                            label = 'Space to harvest';
                        } else if (!this.player.hasTool('wateringCan')) {
                            iconType = 'talk';
                            label = 'Get can from Wu';
                        } else {
                            iconType = 'water';
                            label = 'Space to water';
                        }
                    } else {
                        iconType = 'plant';
                        label = 'Space to plant';
                    }
                    const icon = this.assets.getSprite('interact_icon', iconType);
                    ctx.drawImage(icon, plot.x + 4, plot.y - 24);
                    ctx.fillStyle = 'rgba(0,0,0,0.4)';
                    ctx.fillRect(plot.x, plot.y - 34, 32, 10);
                    ctx.fillStyle = '#88cc44';
                    ctx.font = '6px Georgia';
                    ctx.textAlign = 'center';
                    ctx.fillText(label, plot.x + 16, plot.y - 26);
                    ctx.textAlign = 'left';
                }
            }
            
            // Check interactable objects (pond, temple)
            for (const obj of this.worldObjects) {
                if (!obj.interactable) continue;
                const ox = obj.x + obj.w / 2;
                const oy = obj.y + obj.h / 2;
                const dx = px - ox;
                const dy = py - oy;
                if (Math.sqrt(dx * dx + dy * dy) < range) {
                    const label = obj.interactionType === 'refill_water' ? 'E to refill' :
                                  obj.interactionType === 'meditate' ? 'E to enter' : 'E to use';
                    ctx.fillStyle = 'rgba(0,0,0,0.4)';
                    ctx.fillRect(obj.x - 10, obj.y - 14, obj.w + 20, 10);
                    ctx.fillStyle = '#c8a96e';
                    ctx.font = '7px Georgia';
                    ctx.textAlign = 'center';
                    ctx.fillText(label, obj.x + obj.w / 2, obj.y - 6);
                    ctx.textAlign = 'left';
                }
            }
        }
        
        // Ambient light overlay
        if (ambientLight < 1) {
            ctx.fillStyle = `rgba(0, 0, 20, ${1 - ambientLight})`;
            ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);
        }
        
        ctx.restore(); // End camera transform
        
        // === DEBUG: FPS ===
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(this.canvas.width - 70, 32, 65, 14);
        ctx.fillStyle = '#4a4a50';
        ctx.font = '9px monospace';
        ctx.fillText(`FPS: ${this.fps}`, this.canvas.width - 65, 43);
        
        // === HUD ===
        const gameState = {
            player: this.player,
            cultivation: this.cultivation,
            emotion: this.emotion,
            farming: this.farming,
            time: this.time,
            quests: this.quests,
            deck: this.deck,
        };
        
        this.hud.render(gameState);
        
        // === DIALOG ===
        if (this.gameState === 'dialog') {
            this.dialog.render();
        }
        
        // === MENU ===
        if (this.menu.isOpen) {
            this.menu.render(gameState);
        }
        
        ctx.restore();
    }

    /**
     * Clean up
     */
    destroy() {
        this.running = false;
        this.input.destroy();
    }
}
