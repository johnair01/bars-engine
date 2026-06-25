/**
 * Menu / UI Overlay System
 * Manages inventory, cultivation status, quest log, and settings screens.
 * Rendered as an overlay on top of the game canvas.
 */

import { EmotionTypes } from '../data/Emotions.js';
import { CultivationLevels } from '../systems/CultivationSystem.js';
import { ARGYRAN_GATE_MANUAL, getSuitInfo } from '../data/CultivationManuals.js';
import { ADVOCATES, NATION_META } from '../data/CalruniaAdvocates.js';

export class Menu {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isOpen = false;
        this.currentTab = 'cultivation';
        this.tabs = ['cultivation', 'manual', 'advocates', 'deck', 'inventory', 'quests', 'garden', 'settings'];
        this.tabNames = ['Cultivation', 'Manual', 'Advocates', 'Deck', 'Inventory', 'Quests', 'Garden', 'Settings'];
        this.selectedIndex = 0;
        this.scrollOffset = 0;
        this.animating = false;
        this.animationProgress = 0;
        this.fontFamily = '"Georgia", serif';
        
        // Callbacks set by Game
        this.onSave = null;
        this.onLoad = null;
        /** @type {((cardId: string) => void) | null} */
        this.onDeckSpendCard = null;
        /** @type {((cardId: string) => void) | null} */
        this.onDeckExportCard = null;
    }

    /**
     * Toggle menu open/closed
     */
    toggle() {
        this.isOpen = !this.isOpen;
        this.animating = true;
        this.animationProgress = this.isOpen ? 0 : 1;
    }

    /**
     * Open/close
     */
    setOpen(open) {
        if (this.isOpen !== open) {
            this.toggle();
        }
    }

    /**
     * Handle input within the menu
     */
    handleInput(input, gameState = null) {
        if (!this.isOpen) return false;

        if (input.isKeyJustPressed('Escape')) {
            this.toggle();
            return true;
        }
        
        // Save/Load hotkeys in settings tab
        if (this.currentTab === 'settings') {
            if (input.isKeyJustPressed('s') || input.isKeyJustPressed('S')) {
                if (this.onSave) this.onSave();
                return true;
            }
            if (input.isKeyJustPressed('l') || input.isKeyJustPressed('L')) {
                if (this.onLoad) this.onLoad();
                return true;
            }
        }

        // Tab navigation with number keys
        for (let i = 0; i < this.tabs.length; i++) {
            if (input.isKeyJustPressed(String(i + 1))) {
                this.currentTab = this.tabs[i];
                this.selectedIndex = 0;
                return true;
            }
        }

        // Arrow key navigation within tabs
        if (input.isKeyJustPressed('ArrowRight') || input.isKeyJustPressed('d')) {
            const idx = this.tabs.indexOf(this.currentTab);
            this.currentTab = this.tabs[(idx + 1) % this.tabs.length];
            this.selectedIndex = 0;
            return true;
        }
        if (input.isKeyJustPressed('ArrowLeft') || input.isKeyJustPressed('a')) {
            const idx = this.tabs.indexOf(this.currentTab);
            this.currentTab = this.tabs[(idx - 1 + this.tabs.length) % this.tabs.length];
            this.selectedIndex = 0;
            return true;
        }

        if (input.isKeyJustPressed('ArrowUp') || input.isKeyJustPressed('w')) {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            return true;
        }
        if (input.isKeyJustPressed('ArrowDown') || input.isKeyJustPressed('s')) {
            this.selectedIndex = Math.min(this._getMaxIndex(gameState), this.selectedIndex + 1);
            return true;
        }

        if (
            this.currentTab === 'deck' &&
            gameState?.deck?.cards &&
            input.isKeyJustPressed('Enter') &&
            this.onDeckSpendCard
        ) {
            const cards = gameState.deck.cards;
            if (cards.length === 0) return false;
            const idx = Math.min(this.selectedIndex, cards.length - 1);
            const card = cards[idx];
            if (card && !card.spent) {
                this.onDeckSpendCard(card.id);
                return true;
            }
        }

        if (
            this.currentTab === 'deck' &&
            gameState?.deck?.cards &&
            (input.isKeyJustPressed('e') || input.isKeyJustPressed('E')) &&
            this.onDeckExportCard
        ) {
            const cards = gameState.deck.cards;
            if (cards.length === 0) return false;
            const idx = Math.min(this.selectedIndex, cards.length - 1);
            const card = cards[idx];
            if (card) {
                this.onDeckExportCard(card.id);
                return true;
            }
        }

        return false;
    }

    _getMaxIndex(gameState = null) {
        if (this.currentTab === 'deck' && gameState?.deck?.cards) {
            return Math.max(0, gameState.deck.cards.length - 1);
        }
        return 20;
    }

    /**
     * Render the menu overlay
     */
    render(gameState) {
        if (!this.isOpen) return;

        const ctx = this.ctx;
        const { cultivation, emotion, farming, quests, time, deck } = gameState;

        // Animation
        if (this.animating) {
            this.animationProgress += this.isOpen ? 0.08 : -0.08;
            if (this.animationProgress >= 1 || this.animationProgress <= 0) {
                this.animationProgress = Math.max(0, Math.min(1, this.animationProgress));
                this.animating = false;
            }
        }

        const alpha = this.animationProgress;
        
        ctx.save();
        ctx.globalAlpha = alpha;

        // Dark overlay
        ctx.fillStyle = 'rgba(10, 8, 16, 0.85)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Title
        ctx.fillStyle = '#c8a96e';
        ctx.font = `bold 20px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('⟡ Inner Garden ⟡', this.canvas.width / 2, 40);
        ctx.textAlign = 'left';

        // Tab bar
        this._renderTabs(ctx);

        // Tab content
        const contentX = 20;
        const contentY = 80;
        const contentW = this.canvas.width - 40;
        const contentH = this.canvas.height - 120;

        switch (this.currentTab) {
            case 'cultivation':
                this._renderCultivationTab(ctx, cultivation, contentX, contentY, contentW, contentH);
                break;
            case 'manual':
                this._renderManualTab(ctx, contentX, contentY, contentW, contentH);
                break;
            case 'advocates':
                this._renderAdvocatesTab(ctx, contentX, contentY, contentW, contentH);
                break;
            case 'deck':
                this._renderDeckTab(ctx, deck, contentX, contentY, contentW, contentH);
                break;
            case 'inventory':
                this._renderInventoryTab(ctx, cultivation, emotion, farming, contentX, contentY, contentW, contentH);
                break;
            case 'quests':
                this._renderQuestsTab(ctx, quests, contentX, contentY, contentW, contentH);
                break;
            case 'garden':
                this._renderGardenTab(ctx, farming, contentX, contentY, contentW, contentH);
                break;
            case 'settings':
                this._renderSettingsTab(ctx, contentX, contentY, contentW, contentH);
                break;
        }

        // Close hint
        ctx.fillStyle = '#4a4a50';
        ctx.font = `9px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('Press ESC to close  ·  Tab with 1-8 or ← →', this.canvas.width / 2, this.canvas.height - 10);
        ctx.textAlign = 'left';

        ctx.restore();
    }

    /**
     * Render tab buttons
     */
    _renderTabs(ctx) {
        const tabY = 50;
        let x = 20;
        const tabWidth = 76;

        for (let i = 0; i < this.tabs.length; i++) {
            const isSelected = this.currentTab === this.tabs[i];
            
            ctx.fillStyle = isSelected ? '#4a3728' : 'rgba(30, 25, 20, 0.6)';
            ctx.fillRect(x, tabY, tabWidth, 24);
            
            if (isSelected) {
                ctx.fillStyle = '#c8a96e';
                ctx.fillRect(x, tabY + 22, tabWidth, 2);
            }
            
            ctx.fillStyle = isSelected ? '#e8d8c0' : '#6a5a4a';
            ctx.font = `10px ${this.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.fillText(`${i + 1}. ${this.tabNames[i]}`, x + tabWidth / 2, tabY + 16);
            
            x += tabWidth + 5;
        }
        ctx.textAlign = 'left';
    }

    /**
     * Cultivation tab - shows stats, levels, breakthrough progress
     */
    _renderCultivationTab(ctx, cultivation, x, y, w, h) {
        const profile = cultivation.getProfile();
        
        // Cultivation Level
        ctx.fillStyle = '#c8a96e';
        ctx.font = `bold 16px ${this.fontFamily}`;
        ctx.fillText('Cultivation Path', x, y + 20);
        
        // Level display with glow
        ctx.fillStyle = profile.cultivationColor;
        ctx.font = `bold 22px ${this.fontFamily}`;
        ctx.fillText(profile.cultivationLevel, x + 200, y + 22);
        
        // Title
        ctx.fillStyle = '#8a8a90';
        ctx.font = `12px ${this.fontFamily}`;
        ctx.fillText(`"${profile.title}"`, x + 200, y + 42);
        
        // Exp bar
        const barX = x;
        const barY = y + 55;
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(barX, barY, 300, 14);
        ctx.strokeStyle = '#4a3728';
        ctx.strokeRect(barX, barY, 300, 14);
        
        const expProgress = profile.expToNext === 'MAX' ? 1 : 
            profile.exp / (profile.exp + profile.expToNext);
        ctx.fillStyle = '#4a8aff';
        ctx.fillRect(barX + 1, barY + 1, 298 * Math.min(expProgress, 1), 12);
        
        ctx.fillStyle = '#c8c8d0';
        ctx.font = `9px ${this.fontFamily}`;
        ctx.fillText(`EXP: ${profile.exp} / ${profile.expToNext === 'MAX' ? 'MAX' : profile.exp + profile.expToNext}`, barX + 5, barY + 11);
        
        // Stats section
        const statsX = x;
        let statsY = y + 85;
        
        ctx.fillStyle = '#c8a96e';
        ctx.font = `bold 13px ${this.fontFamily}`;
        ctx.fillText('Inner Stats', statsX, statsY);
        statsY += 20;
        
        const statEntries = Object.entries(profile.stats);
        const statsPerRow = 3;
        const statW = 180;
        const statH = 30;
        
        for (let i = 0; i < statEntries.length; i++) {
            const [statName, statValue] = statEntries[i];
            const row = Math.floor(i / statsPerRow);
            const col = i % statsPerRow;
            const sx = statsX + col * statW;
            const sy = statsY + row * statH;
            
            // Stat name
            const statColors = {
                strength: '#e04040', wisdom: '#4060e0', spirit: '#8080a0',
                agility: '#c0a040', endurance: '#806040', charisma: '#e0d040'
            };
            ctx.fillStyle = statColors[statName] || '#ffffff';
            ctx.font = `11px ${this.fontFamily}`;
            ctx.fillText(`${statName.charAt(0).toUpperCase() + statName.slice(1)}`, sx, sy + 12);
            
            // Stat value boxes
            for (let j = 0; j < 10; j++) {
                const bx = sx + 70 + j * 10;
                ctx.fillStyle = j < statValue ? (statColors[statName] || '#888888') : '#2a2a3a';
                ctx.fillRect(bx, sy, 8, 10);
                if (j < statValue) {
                    ctx.fillStyle = '#ffffff30';
                    ctx.fillRect(bx, sy, 8, 2);
                }
            }
            
            // Value text
            ctx.fillStyle = '#e8d8c0';
            ctx.font = `bold 10px ${this.fontFamily}`;
            ctx.fillText(`${statValue}`, sx + 70 + 100, sy + 12);
        }
        
        // Qi display
        const qiY = y + 175;
        ctx.fillStyle = '#6a8aff';
        ctx.font = `13px ${this.fontFamily}`;
        ctx.fillText(`Qi: ${profile.qi} / ${profile.maxQi}`, x, qiY);
        
        // Qi bar
        const qiBarX = x + 120;
        const qiBarY = qiY - 5;
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(qiBarX, qiBarY, 150, 12);
        ctx.fillStyle = '#4a7aff';
        const qiRatio = profile.qi / profile.maxQi;
        ctx.fillRect(qiBarX + 1, qiBarY + 1, 148 * qiRatio, 10);
        
        // Breakthroughs
        ctx.fillStyle = '#8a8a90';
        ctx.font = `10px ${this.fontFamily}`;
        ctx.fillText(`Breakthroughs: ${profile.breakthroughs}`, x, qiY + 25);
        ctx.fillText(`Titles Earned: ${profile.titles.length}`, x, qiY + 40);
        
        // Cultivation levels reference
        const refY = y + 240;
        ctx.fillStyle = '#c8a96e';
        ctx.font = `bold 11px ${this.fontFamily}`;
        ctx.fillText('Cultivation Stages', x, refY);
        
        for (let i = 0; i < CultivationLevels.length; i++) {
            const level = CultivationLevels[i];
            const reached = cultivation.cultivationLevel === level.id || 
                           CultivationLevels.indexOf(level) <= CultivationLevels.findIndex(l => l.id === cultivation.cultivationLevel);
            
            ctx.fillStyle = reached ? level.qiColor : '#3a3a40';
            ctx.font = `10px ${this.fontFamily}`;
            ctx.fillText(`${i + 1}. ${level.name}`, x + (i % 2) * 160, refY + 16 + Math.floor(i / 2) * 18);
            
            if (!reached) {
                ctx.fillStyle = '#3a3a40';
                ctx.fillText(`(EXP: ${level.minExp})`, x + (i % 2) * 160 + 120, refY + 16 + Math.floor(i / 2) * 18);
            }
        }
    }

    /**
     * Cultivation manual — Argyran Gate techniques (allyship deck correlate). See SPEC_DECK_MECHANICS.md.
     */
    _renderManualTab(ctx, x, y, w, h) {
        const manual = ARGYRAN_GATE_MANUAL;
        ctx.fillStyle = '#c8a96e';
        ctx.font = `bold 16px ${this.fontFamily}`;
        ctx.fillText(`Manual — ${manual.name}`, x, y + 18);

        ctx.fillStyle = '#8a8a90';
        ctx.font = `10px ${this.fontFamily}`;
        ctx.fillText(`${manual.nation} · ${manual.trigram} sect · 13 techniques (3♠ Wake 3♥ Clean 4♣ Grow 3♦ Show)`, x, y + 36);
        ctx.fillText('Paired with Allyship Deck V3 (Wake / Clean / Grow / Show). Harvest unlocks combat cards — see design spec.', x, y + 50);

        const sorted = [...manual.cards].sort((a, b) => a.unlockOrder - b.unlockOrder);
        let rowY = y + 72;
        const lineH = 36;
        const maxY = y + h - 20;

        for (const card of sorted) {
            if (rowY > maxY) break;
            const su = getSuitInfo(card.suit);
            const sym = su ? su.symbol : '?';
            const pillar = su ? su.pillar : '';

            ctx.fillStyle = 'rgba(30, 25, 20, 0.55)';
            ctx.fillRect(x, rowY, w - 8, lineH - 4);
            ctx.strokeStyle = '#4a3728';
            ctx.strokeRect(x, rowY, w - 8, lineH - 4);

            ctx.fillStyle = '#e8d8c0';
            ctx.font = `bold 10px ${this.fontFamily}`;
            ctx.fillText(`${card.unlockOrder}. ${sym} ${card.title}`, x + 8, rowY + 12);

            ctx.fillStyle = '#7a7a82';
            ctx.font = `8px ${this.fontFamily}`;
            const rec = card.recognition.length > 110 ? `${card.recognition.slice(0, 107)}…` : card.recognition;
            ctx.fillText(`${pillar} · ${rec}`, x + 8, rowY + 24);

            rowY += lineH;
        }
    }

    /**
     * Calrunia advocates — 5×8 roster from Casey's Birthday Deck NPC grid.
     */
    _renderAdvocatesTab(ctx, x, y, w, h) {
        ctx.fillStyle = '#c8a96e';
        ctx.font = `bold 16px ${this.fontFamily}`;
        ctx.fillText('Calrunia — Trigram Advocates', x, y + 16);

        ctx.fillStyle = '#8a8a90';
        ctx.font = `9px ${this.fontFamily}`;
        ctx.fillText("Source: Casey's Birthday Deck / Calrunia NPC Grid (5 × 8). Seven visitors appear on the garden map; all 40 are listed here.", x, y + 32);

        const nationOrder = ['argyra', 'pyrakanth', 'lamenth', 'meridia', 'virelune'];
        let rowY = y + 48;
        const lineH = 13;
        const maxY = y + h - 12;

        for (const nid of nationOrder) {
            if (rowY > maxY) break;
            const meta = NATION_META[nid];
            ctx.fillStyle = meta?.color || '#c8a96e';
            ctx.font = `bold 10px ${this.fontFamily}`;
            ctx.fillText(`${meta?.label || nid} — ${meta?.channel || ''}`, x, rowY);
            rowY += lineH + 2;

            const rows = ADVOCATES.filter((a) => a.nationId === nid);
            for (const a of rows) {
                if (rowY > maxY) break;
                ctx.fillStyle = '#c8c8d0';
                ctx.font = `8px ${this.fontFamily}`;
                const arch = a.archetype.length > 36 ? `${a.archetype.slice(0, 33)}…` : a.archetype;
                ctx.fillText(`  • ${a.name} — ${a.title}`, x + 4, rowY);
                rowY += lineH;
                ctx.fillStyle = '#5a5a62';
                ctx.font = `7px ${this.fontFamily}`;
                ctx.fillText(`    ${arch}`, x + 8, rowY);
                rowY += lineH;
            }
            rowY += 4;
        }
    }

    /**
     * Deck tab — BAR-minted cards; Enter channels selected unspent card (Ch.1).
     */
    _renderDeckTab(ctx, deck, x, y, w, h) {
        ctx.fillStyle = '#c8a8e8';
        ctx.font = `bold 16px ${this.fontFamily}`;
        ctx.fillText('Deck — Witness cards', x, y + 16);

        ctx.fillStyle = '#8a8a90';
        ctx.font = `9px ${this.fontFamily}`;
        ctx.fillText('From your BARs. ↑↓ select · ENTER channel (+12 XP once) · E export bridge JSON (copy/local).', x, y + 34);

        if (!deck || !deck.cards || deck.cards.length === 0) {
            ctx.fillStyle = '#5a5a62';
            ctx.font = `11px ${this.fontFamily}`;
            ctx.fillText('No cards yet. Press J in the world to seal your first BAR.', x, y + 58);
            return;
        }

        let rowY = y + 52;
        const lineH = 36;
        const cards = deck.cards;
        for (let i = 0; i < cards.length; i++) {
            const c = cards[i];
            const sel = this.currentTab === 'deck' && i === this.selectedIndex;
            ctx.fillStyle = sel ? 'rgba(200, 168, 232, 0.15)' : 'rgba(40, 32, 50, 0.5)';
            ctx.fillRect(x, rowY - 4, w - 8, lineH);
            if (sel) {
                ctx.strokeStyle = '#c8a8e8';
                ctx.strokeRect(x, rowY - 4, w - 8, lineH);
            }

            ctx.fillStyle = c.spent ? '#5a5a62' : '#d8c8e8';
            ctx.font = `bold 11px ${this.fontFamily}`;
            ctx.fillText(c.title + (c.spent ? '  ·  spent' : ''), x + 6, rowY + 10);

            ctx.fillStyle = '#6a6a72';
            ctx.font = `8px ${this.fontFamily}`;
            const preview = (c.body || '').replace(/\n/g, ' · ');
            const clip = preview.length > 72 ? `${preview.slice(0, 69)}…` : preview;
            ctx.fillText(clip, x + 6, rowY + 24);

            rowY += lineH + 4;
            if (rowY > y + h - 20) break;
        }
    }

    /**
     * Inventory tab - shows items, seeds, fruits
     */
    _renderInventoryTab(ctx, cultivation, emotion, farming, x, y, w, h) {
        ctx.fillStyle = '#c8a96e';
        ctx.font = `bold 16px ${this.fontFamily}`;
        ctx.fillText('Inventory & Seeds', x, y + 20);
        
        // Seeds section
        ctx.fillStyle = '#8a8a90';
        ctx.font = `12px ${this.fontFamily}`;
        ctx.fillText(`Crystallized Seeds: ${emotion.seedsInventory.length}`, x, y + 45);
        
        if (emotion.seedsInventory.length > 0) {
            let seedY = y + 65;
            for (const seed of emotion.seedsInventory) {
                const emotionData = Object.values(EmotionTypes).find(e => e.id === seed.emotionId);
                ctx.fillStyle = emotionData ? emotionData.color : '#ffffff';
                ctx.font = `11px ${this.fontFamily}`;
                ctx.fillText(`● ${emotionData ? emotionData.name : 'Unknown'} Seed (Quality: ${seed.quality})`, x + 10, seedY);
                seedY += 20;
            }
        } else {
            ctx.fillStyle = '#4a4a50';
            ctx.font = `10px ${this.fontFamily}`;
            ctx.fillText('No seeds yet. Meditate to crystallize emotional energy into seeds.', x + 10, y + 65);
        }
        
        // Captured energy display
        let energyY = y + (emotion.seedsInventory.length > 0 ? 70 + emotion.seedsInventory.length * 22 : 100);
        
        ctx.fillStyle = '#c8a96e';
        ctx.font = `bold 13px ${this.fontFamily}`;
        ctx.fillText('Captured Emotional Energy', x, energyY);
        energyY += 20;
        
        for (const [emotionId, energy] of Object.entries(emotion.capturedEnergy)) {
            if (energy <= 0) continue;
            const emotionData = Object.values(EmotionTypes).find(e => e.id === emotionId);
            if (!emotionData) continue;
            
            ctx.fillStyle = emotionData.color;
            ctx.fillRect(x + 10, energyY, 160 * (energy / 100), 10);
            ctx.fillStyle = '#2a2a3a';
            ctx.strokeRect(x + 10, energyY, 160, 10);
            
            ctx.fillStyle = '#e8d8c0';
            ctx.font = `9px ${this.fontFamily}`;
            ctx.fillText(`${emotionData.name}: ${Math.round(energy)}%`, x + 15, energyY + 8);
            
            if (energy >= 60) {
                ctx.fillStyle = '#ffd700';
                ctx.font = '8px sans-serif';
                ctx.fillText('◆ Ready to crystallize!', x + 180, energyY + 8);
            }
            
            energyY += 18;
        }
        
        if (Object.values(emotion.capturedEnergy).every(v => v <= 0)) {
            ctx.fillStyle = '#4a4a50';
            ctx.font = `10px ${this.fontFamily}`;
            ctx.fillText('No emotional energy captured yet. Interact with the world to experience feelings.', x + 10, energyY);
        }
        
        // Harvested fruits
        if (farming && farming.harvestedFruits.length > 0) {
            const fruitY = Math.max(energyY + 30, y + 350);
            ctx.fillStyle = '#c8a96e';
            ctx.font = `bold 13px ${this.fontFamily}`;
            ctx.fillText('Harvested Fruit', x, fruitY);
            
            let fY = fruitY + 20;
            for (const fruit of farming.harvestedFruits.slice(-5)) {
                ctx.fillStyle = '#e8d8c0';
                ctx.font = `11px ${this.fontFamily}`;
                ctx.fillText(`🍑 ${fruit.fruitName} (Quality: ${fruit.quality})`, x + 10, fY);
                fY += 18;
            }
        }
    }

    /**
     * Quests tab - shows active and available quests
     */
    _renderQuestsTab(ctx, quests, x, y, w, h) {
        ctx.fillStyle = '#c8a96e';
        ctx.font = `bold 16px ${this.fontFamily}`;
        ctx.fillText('Quest Log', x, y + 20);
        
        // Active quests
        const active = quests.getActiveQuestDetails();
        ctx.fillStyle = '#8a8a90';
        ctx.font = `12px ${this.fontFamily}`;
        ctx.fillText(`Active Quests (${active.length})`, x, y + 45);
        
        let qy = y + 65;
        if (active.length > 0) {
            for (const quest of active) {
                // Quest card background
                ctx.fillStyle = 'rgba(30, 25, 20, 0.5)';
                ctx.fillRect(x + 5, qy, w - 10, 55);
                ctx.strokeStyle = '#4a3728';
                ctx.strokeRect(x + 5, qy, w - 10, 55);
                
                ctx.fillStyle = '#e8d8c0';
                ctx.font = `bold 11px ${this.fontFamily}`;
                ctx.fillText(quest.name, x + 15, qy + 18);
                
                ctx.fillStyle = '#8a8a90';
                ctx.font = `9px ${this.fontFamily}`;
                ctx.fillText(quest.description, x + 15, qy + 32);
                
                // Progress bar
                const firstReq = Object.entries(quest.progress)[0];
                if (firstReq) {
                    const [_, { current, needed }] = firstReq;
                    const progress = Math.min(current / needed, 1);
                    ctx.fillStyle = '#1a1a2a';
                    ctx.fillRect(x + w - 130, qy + 10, 110, 10);
                    ctx.fillStyle = '#6aaa4a';
                    ctx.fillRect(x + w - 129, qy + 11, 108 * progress, 8);
                    ctx.fillStyle = '#c8c8d0';
                    ctx.font = '7px Georgia';
                    ctx.fillText(`${current}/${needed}`, x + w - 125, qy + 18);
                }
                
                qy += 65;
            }
        } else {
            ctx.fillStyle = '#4a4a50';
            ctx.font = `10px ${this.fontFamily}`;
            ctx.fillText('No active quests. Check the quest board for available tasks.', x + 10, qy);
            qy += 25;
        }
        
        // Available quests
        const available = quests.getAvailableQuests();
        if (available.length > 0) {
            qy += 15;
            ctx.fillStyle = '#8a8a90';
            ctx.font = `12px ${this.fontFamily}`;
            ctx.fillText(`Available Quests (${available.length})`, x, qy);
            qy += 20;
            
            for (const quest of available.slice(0, 4)) {
                ctx.fillStyle = '#5a5a60';
                ctx.font = `10px ${this.fontFamily}`;
                ctx.fillText(`📜 ${quest.name}`, x + 15, qy);
                qy += 16;
            }
        }
        
        // Completed count
        const completed = quests.getCompletedQuests();
        ctx.fillStyle = '#4a6a4a';
        ctx.font = `10px ${this.fontFamily}`;
        ctx.fillText(`Completed: ${completed.length} quests`, x, qy + 20);
    }

    /**
     * Garden tab - shows farming status
     */
    _renderGardenTab(ctx, farming, x, y, w, h) {
        ctx.fillStyle = '#c8a96e';
        ctx.font = `bold 16px ${this.fontFamily}`;
        ctx.fillText('Inner Garden', x, y + 20);
        
        const summary = farming.getSummary();
        
        // Garden stats
        ctx.fillStyle = '#8a8a90';
        ctx.font = `12px ${this.fontFamily}`;
        ctx.fillText(`Garden Level: ${summary.gardenLevel}`, x, y + 45);
        ctx.fillText(`Plots: ${summary.occupiedPlots}/${summary.totalPlots}`, x + 200, y + 45);
        ctx.fillText(`Crops Growing: ${summary.activeCrops}`, x, y + 65);
        ctx.fillText(`Harvested: ${summary.harvestedFruits} fruits`, x + 200, y + 65);
        
        // Water level
        const waterY = y + 90;
        ctx.fillStyle = '#4a6a8a';
        ctx.font = `11px ${this.fontFamily}`;
        ctx.fillText('Watering Can:', x, waterY + 10);
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(x + 100, waterY, 150, 12);
        ctx.fillStyle = '#4a8aff';
        const waterRatio = summary.waterLevel / summary.maxWaterLevel;
        ctx.fillRect(x + 101, waterY + 1, 148 * waterRatio, 10);
        ctx.fillStyle = '#c8d0d8';
        ctx.font = '9px Georgia';
        ctx.fillText(`${summary.waterLevel}/${summary.maxWaterLevel}`, x + 115, waterY + 9);
        
        // Active crops detail
        const crops = farming.getCropStatus();
        if (crops.length > 0) {
            let cropY = y + 120;
            ctx.fillStyle = '#c8a96e';
            ctx.font = `bold 12px ${this.fontFamily}`;
            ctx.fillText('Growing Crops', x, cropY);
            cropY += 20;
            
            for (const crop of crops) {
                ctx.fillStyle = 'rgba(30, 25, 20, 0.5)';
                ctx.fillRect(x + 5, cropY, w - 10, 30);
                
                // Emotion color indicator
                ctx.fillStyle = crop.emotionColor;
                ctx.fillRect(x + 5, cropY, 3, 30);
                
                // Stage icon and name
                ctx.fillStyle = '#e8d8c0';
                ctx.font = `10px ${this.fontFamily}`;
                ctx.fillText(`${crop.stageIcon} ${crop.emotionName} — ${crop.stage}`, x + 15, cropY + 12);
                
                // Health
                ctx.fillStyle = crop.health > 50 ? '#4a8a4a' : (crop.health > 25 ? '#8a8a4a' : '#8a4a4a');
                ctx.fillRect(x + w - 120, cropY + 2, 100 * (crop.health / 100), 4);
                
                // Progress
                ctx.fillStyle = '#6aaa4a';
                ctx.fillRect(x + w - 120, cropY + 10, 100 * (crop.progress / 100), 4);
                
                ctx.fillStyle = '#8a8a90';
                ctx.font = '7px Georgia';
                ctx.fillText(`HP ${Math.round(crop.health)}%`, x + w - 115, cropY + 5);
                ctx.fillText(`${crop.progress}%`, x + w - 115, cropY + 13);
                
                cropY += 38;
            }
        } else {
            ctx.fillStyle = '#4a4a50';
            ctx.font = `10px ${this.fontFamily}`;
            ctx.fillText('No crops growing. Plant seeds in the garden plots!', x + 10, y + 150);
        }
        
        // Nurture actions counter
        ctx.fillStyle = '#8ac48a';
        ctx.font = `10px ${this.fontFamily}`;
        ctx.fillText(`Nurture Actions Performed: ${summary.nurtureActions}`, x, y + h - 20);
    }

    /**
     * Settings tab
     */
    _renderSettingsTab(ctx, x, y, w, h) {
        ctx.fillStyle = '#c8a96e';
        ctx.font = `bold 16px ${this.fontFamily}`;
        ctx.fillText('Settings', x, y + 20);
        
        ctx.fillStyle = '#8a8a90';
        ctx.font = `12px ${this.fontFamily}`;
        ctx.fillText('Controls:', x, y + 50);
        
        const controls = [
            ['WASD / Arrow Keys', 'Move character'],
            ['E', 'Interact with objects/NPCs'],
            ['Space', 'Perform action (water, harvest, etc.)'],
            ['M', 'Toggle Meditation'],
            ['I / Tab', 'Open Inventory/Menu'],
            ['Escape', 'Close Menu'],
            ['1-5', 'Switch menu tabs'],
            ['Enter', 'Confirm dialog option']
        ];
        
        let cy = y + 72;
        for (const [key, action] of controls) {
            ctx.fillStyle = '#c8a96e';
            ctx.font = `10px ${this.fontFamily}`;
            ctx.fillText(key, x + 20, cy);
            ctx.fillStyle = '#8a8a90';
            const descX = x + 200;
            ctx.fillText(action, descX, cy);
            cy += 20;
        }
        
        // Save / Load buttons
        cy += 10;
        ctx.fillStyle = '#4a8aff';
        ctx.font = `bold 12px ${this.fontFamily}`;
        ctx.fillText('[S] Save Game', x + 20, cy);
        cy += 18;
        ctx.fillStyle = '#88cc44';
        ctx.font = `bold 12px ${this.fontFamily}`;
        ctx.fillText('[L] Load Game', x + 20, cy);
        cy += 24;
        
        // Save meta info
        if (this._saveMeta) {
            ctx.fillStyle = '#5a5a60';
            ctx.font = '9px Georgia';
            ctx.fillText(`Last save: ${this._saveMeta.date || 'unknown'}`, x + 20, cy);
            cy += 15;
            ctx.fillText(`Level ${this._saveMeta.level} · ${this._saveMeta.entries} entries · ${this._saveMeta.harvests} harvests · ${this._saveMeta.cards ?? 0} cards`, x + 20, cy);
            cy += 24;
        }
        
        // About
        ctx.fillStyle = '#c8a96e';
        ctx.font = `bold 12px ${this.fontFamily}`;
        ctx.fillText('About Inner Garden', x, cy);
        cy += 20;
        ctx.fillStyle = '#6a6a70';
        ctx.font = `10px ${this.fontFamily}`;
        ctx.fillText('A personal development game blending Taoist cultivation', x, cy); cy += 15;
        ctx.fillText('with Rune Factory-style farming mechanics.', x, cy); cy += 15;
        ctx.fillText('Transform emotional charge into seeds of virtue.', x, cy); cy += 15;
        ctx.fillText('Nurture them with conscious action. Harvest enlightenment.', x, cy);
        
        // Version
        ctx.fillStyle = '#3a3a40';
        ctx.font = '8px Georgia';
        ctx.fillText('v0.1.0 — Inner Garden', x, y + h - 10);
    }
    
    /**
     * Update save metadata for display
     */
    setSaveMeta(meta) {
        this._saveMeta = meta;
    }
}
