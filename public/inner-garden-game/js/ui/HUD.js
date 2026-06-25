/**
 * HUD - Head-Up Display
 * Renders player stats, time, quest info, and emotion status on screen.
 */

import { EmotionTypes } from '../data/Emotions.js';

export class HUD {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.visible = true;
        this.showEmotions = true;
        this.showQuestTracker = true;
        
        // Font setup
        this.fontFamily = '"Georgia", serif';
        
        // Animation
        this.notifications = [];
        this.fadeTimer = {};
        
        // Journal hint visibility (stops after first entry)
        this._journalHintVisible = true;
        
        // Debug state tracking
        this._stateStr = '';
    }

    /**
     * Set the current game state string for debug display
     */
    setStateString(stateStr) {
        this._stateStr = stateStr;
    }

    /**
     * Render the HUD
     */
    render(gameState) {
        if (!this.visible) return;
        
        const ctx = this.ctx;
        const { player, cultivation, emotion, farming, time, quests } = gameState;
        
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        
        // === TOP BAR ===
        this._renderTopBar(ctx, cultivation, time);
        
        // === SIDE PANEL - Emotion Status ===
        if (this.showEmotions) {
            this._renderEmotionPanel(ctx, emotion, player);
        }
        
        // === QUEST TRACKER ===
        if (this.showQuestTracker && quests) {
            this._renderQuestTracker(ctx, quests);
        }
        
        // === BOTTOM - Action Help ===
        this._renderActionHelp(ctx, player);
        
        // === NOTIFICATIONS ===
        this._renderNotifications(ctx);
        
        // === DEBUG STATE ===
        if (this._stateStr) {
            ctx.save();
            ctx.fillStyle = '#444444';
            ctx.font = '8px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`state:${this._stateStr}`, this.canvas.width - 10, 12);
            ctx.textAlign = 'left';
            ctx.restore();
        }
        
        ctx.restore();
    }

    /**
     * Render the top bar with cultivation info and time
     */
    _renderTopBar(ctx, cultivation, time) {
        const profile = cultivation.getProfile();
        const timeInfo = time ? time.getTimeInfo() : null;
        
        // Background bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, this.canvas.width, 28);
        
        // Bottom border
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(0, 28, this.canvas.width, 1);
        
        // Cultivation level
        ctx.fillStyle = profile.cultivationColor || '#8a8a8a';
        ctx.font = `12px ${this.fontFamily}`;
        ctx.fillText(`⟡ ${profile.title}`, 10, 19);
        
        // Level progress bar
        const barX = 180;
        const barY = 8;
        const barW = 120;
        const barH = 12;
        
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = '#4a3728';
        ctx.strokeRect(barX, barY, barW, barH);
        
        // EXP bar
        const expProgress = profile.expToNext === 'MAX' ? 1 : 
            profile.exp / (profile.exp + profile.expToNext);
        ctx.fillStyle = '#4a8aff';
        ctx.fillRect(barX + 1, barY + 1, (barW - 2) * Math.min(expProgress, 1), barH - 2);
        
        // EXP text
        ctx.fillStyle = '#c8c8d0';
        ctx.font = `9px ${this.fontFamily}`;
        ctx.fillText(`EXP ${profile.exp}`, barX + 4, barY + 10);
        
        // Qi display
        ctx.fillStyle = '#6a8aff';
        ctx.font = `11px ${this.fontFamily}`;
        const qiText = `Qi: ${profile.qi}/${profile.maxQi}`;
        ctx.fillText(qiText, 320, 19);
        
        // Time display (right side)
        if (timeInfo) {
            const timeText = `Day ${timeInfo.day} · ${timeInfo.season} · ${timeInfo.time}`;
            ctx.fillStyle = '#c8a96e';
            ctx.font = `11px ${this.fontFamily}`;
            ctx.textAlign = 'right';
            ctx.fillText(timeText, this.canvas.width - 10, 19);
            ctx.textAlign = 'left';
            
            // Season color dot
            const seasonColors = ['#4a8a4a', '#8aaa4a', '#aa6a3a', '#5a7aaa'];
            ctx.fillStyle = seasonColors[timeInfo.seasonIndex] || '#4a8a4a';
            ctx.beginPath();
            ctx.arc(this.canvas.width - 160, 14, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Render the emotion status panel
     */
    _renderEmotionPanel(ctx, emotion, player) {
        const summary = emotion.getStateSummary();
        const x = 10;
        let y = 40;
        
        // Count items to display for panel height
        let items = 1; // title
        if (summary.isMeditating) items += 1;
        if (summary.hasLastSeed) items += 2; // seed info + quality bar
        items += Math.min(summary.seedsInventory.length, 3); // seeds list
        if (summary.journalEntries > 0) items += 1;
        if (player && player.tools && player.tools.wateringCan && player.tools.wateringCan.owned) items += 1;
        
        // Panel background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x - 5, y - 5, 150, 10 + items * 16);
        
        // Title
        ctx.fillStyle = '#c8a96e';
        ctx.font = `bold 10px ${this.fontFamily}`;
        ctx.fillText('✦ Inner State', x, y);
        y += 16;
        
        // Meditation indicator
        if (summary.isMeditating) {
            ctx.fillStyle = '#e8c88a';
            ctx.font = `9px ${this.fontFamily}`;
            ctx.fillText('◎ Meditating...', x, y);
            y += 14;
        }
        
        // Last seed quality (shows during meditation or after journaling)
        if (summary.hasLastSeed) {
            const emotionData = Object.values(EmotionTypes).find(e => e.id === summary.lastSeedEmotion);
            const color = emotionData ? emotionData.color : '#88cc44';
            
            // Seed emotion label
            ctx.fillStyle = color;
            ctx.font = `8px ${this.fontFamily}`;
            ctx.fillText(`◈ ${emotionData ? emotionData.name : 'Seed'} Quality`, x, y + 4);
            y += 14;
            
            // Quality bar
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(x, y, 130, 8);
            const barW = (summary.lastSeedQuality / 100) * 128;
            ctx.fillStyle = color;
            ctx.fillRect(x + 1, y + 1, Math.max(0, barW - 2), 6);
            
            // Quality text
            ctx.fillStyle = '#c8c8d0';
            ctx.font = `7px ${this.fontFamily}`;
            ctx.fillText(`${summary.lastSeedQuality}%`, x + 100, y + 6);
            y += 14;
        }
        
        // Seed inventory list
        if (summary.seedsInventory.length > 0) {
            ctx.fillStyle = '#88cc44';
            ctx.font = `8px ${this.fontFamily}`;
            ctx.fillText(`🌱 ${summary.seedsInventory.length} seed(s) in inventory`, x, y + 4);
            y += 14;
            
            // Show each seed type
            for (const s of summary.seedsInventory.slice(0, 3)) {
                const e = Object.values(EmotionTypes).find(et => et.id === s.emotionId);
                ctx.fillStyle = e ? e.color : '#88cc44';
                ctx.font = `7px ${this.fontFamily}`;
                ctx.fillText(`  ${e ? e.name : 'Seed'} (q:${s.quality})`, x + 5, y + 3);
                y += 12;
            }
        }
        
        // Journal entry count
        if (summary.journalEntries > 0) {
            ctx.fillStyle = '#c8a96e';
            ctx.font = `8px ${this.fontFamily}`;
            ctx.fillText(`📖 ${summary.journalEntries} entries`, x, y + 4);
            y += 14;
        }
        
        // Seed count
        if (summary.seedsInventory && summary.seedsInventory.length > 0) {
            y += 4;
            ctx.fillStyle = '#8ac48a';
            ctx.font = `9px ${this.fontFamily}`;
            ctx.fillText(`🌱 ${summary.seedsInventory.length} seed(s)`, x, y);
            y += 14;
        }
        
        // Watering can status
        if (player && player.tools && player.tools.wateringCan && player.tools.wateringCan.owned) {
            const can = player.tools.wateringCan;
            ctx.fillStyle = '#4a8aff';
            ctx.font = `8px ${this.fontFamily}`;
            ctx.fillText(`💧 Can: ${Math.round(can.water)}/${can.maxWater}`, x, y + 4);
        }
    }

    /**
     * Render quest tracker
     */
    _renderQuestTracker(ctx, quests) {
        const activeDetails = quests.getActiveQuestDetails();
        if (activeDetails.length === 0) return;
        
        const x = this.canvas.width - 210;
        let y = 40;
        
        // Panel background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x - 5, y - 5, 210, 20 + activeDetails.length * 35);
        
        // Title
        ctx.fillStyle = '#c8a96e';
        ctx.font = `bold 10px ${this.fontFamily}`;
        ctx.fillText('✦ Current Quests', x, y);
        y += 16;
        
        for (const quest of activeDetails.slice(0, 3)) {
            ctx.fillStyle = '#e8d8c0';
            ctx.font = `10px ${this.fontFamily}`;
            ctx.fillText(quest.name, x, y);
            y += 13;
            
            // Progress bar for first requirement
            const firstReq = Object.entries(quest.progress)[0];
            if (firstReq) {
                const [key, { current, needed }] = firstReq;
                const progress = Math.min(current / needed, 1);
                
                ctx.fillStyle = '#1a1a2a';
                ctx.fillRect(x, y, 195, 6);
                ctx.fillStyle = '#6aaa4a';
                ctx.fillRect(x + 1, y + 1, 193 * progress, 4);
                
                ctx.fillStyle = '#8a8a90';
                ctx.font = `7px ${this.fontFamily}`;
                ctx.fillText(`${current}/${needed}`, x + 100, y + 5);
                y += 16;
            }
        }
        
        if (activeDetails.length > 3) {
            ctx.fillStyle = '#6a6a70';
            ctx.font = '8px Georgia';
            ctx.fillText(`+${activeDetails.length - 3} more...`, x, y + 5);
        }
    }

    /**
     * Render action help at bottom
     */
    _renderActionHelp(ctx, player) {
        const y = this.canvas.height - 30;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, y, this.canvas.width, 30);
        
        ctx.fillStyle = '#8a8a90';
        ctx.font = '10px Georgia';
        
        const controls = [
            'WASD: Move', 
            'E: Interact', 
            'J: BAR', 
            'M: Meditate', 
            'I: Inventory',
            'Space: Act'
        ];
        
        let x = 20;
        const spacing = 115;
        for (const control of controls) {
            ctx.fillStyle = '#6a6a70';
            ctx.fillText(control, x, y + 18);
            x += spacing;
        }
        
        // Journal reminder glow if no entries yet
        if (this._journalHintVisible !== false) {
            const blink = Math.floor(Date.now() / 800) % 2 === 0;
            if (blink) {
                ctx.fillStyle = '#e8c88a40';
                ctx.font = '9px Georgia';
                ctx.fillText('⟡ Press J to record what you feel', 150, y + 12);
            }
        }
    }

    /**
     * Hide the journal hint (called after first journal entry)
     */
    hideJournalHint() {
        this._journalHintVisible = false;
    }

    /**
     * Add a notification message
     */
    notify(text, color = '#e8c88a', duration = 3000) {
        this.notifications.push({
            text,
            color,
            createdAt: Date.now(),
            duration
        });
        
        // Keep max 5 notifications
        if (this.notifications.length > 5) {
            this.notifications.shift();
        }
    }

    /**
     * Render notification messages
     */
    _renderNotifications(ctx) {
        const now = Date.now();
        let y = 70;
        
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notif = this.notifications[i];
            const elapsed = now - notif.createdAt;
            const alpha = Math.max(0, 1 - (elapsed / notif.duration));
            
            if (alpha <= 0) {
                this.notifications.splice(i, 1);
                continue;
            }
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            const textWidth = ctx.measureText(notif.text).width || 200;
            ctx.fillRect(this.canvas.width / 2 - textWidth / 2 - 10, y - 12, textWidth + 20, 22);
            
            ctx.fillStyle = notif.color;
            ctx.font = '12px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText(notif.text, this.canvas.width / 2, y + 4);
            ctx.textAlign = 'left';
            
            y -= 28;
        }
        
        ctx.globalAlpha = 1;
    }

    /**
     * Render a tooltip at mouse position
     */
    renderTooltip(ctx, text, x, y) {
        const padding = 6;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = '11px Georgia';
        const metrics = ctx.measureText(text);
        const tw = metrics.width;
        
        ctx.fillRect(x + 10, y - 15, tw + padding * 2, 22);
        ctx.strokeStyle = '#4a3728';
        ctx.strokeRect(x + 10, y - 15, tw + padding * 2, 22);
        
        ctx.fillStyle = '#e8d8c0';
        ctx.fillText(text, x + 12, y + 2);
    }
}
