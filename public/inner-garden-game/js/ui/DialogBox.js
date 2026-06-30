/**
 * Dialog Box System
 * Handles NPC conversations, journal entries, meditation insights, and emotional reflection.
 * Typewriter-style text with portrait display, choice options, and journal input mode.
 */

import { EmotionTypes } from '../data/Emotions.js';

export const DialogStyle = {
    NPC: 'npc',        // Standard NPC conversation
    INNER: 'inner',    // Inner voice / meditation insight
    SYSTEM: 'system',  // Game system messages
    QUEST: 'quest',    // Quest-related dialog
    JOURNAL: 'journal' // Journal entry mode
};

export class DialogBox {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isOpen = false;
        this.isAnimatingText = false;
        
        this.currentDialog = null;
        this.currentLine = 0;
        this.displayedText = '';
        this.textTimer = 0;
        this.textSpeed = 25; // ms per character
        this.awaitingInput = false;
        this.fontFamily = '"Georgia", serif';
        
        // Journal input state
        this.journalState = null; // { phase: 'select_emotion' | 'set_intensity' | 'describe', ... }
        this.selectedEmotion = null;
        this.inputBuffer = '';
        this.showCursor = true;
        this.cursorTimer = 0;
        
        // Callbacks
        this.onChoice = null;
        this.onComplete = null;
        this.onJournalSubmit = null; // Legacy journal (unused when BAR capture is active)
        /** @type {((payload: object) => void) | null} */
        this.onBarSubmit = null;
        /** BAR capture state — phases: emotion → intensity → behavior → activation → result */
        this.barState = null;
        
        // Choice mouse interaction
        this.hoveredChoice = -1;
        this._choiceRects = [];   // [{x, y, w, h, index}]
    }

    /**
     * Show a dialog
     * @param {object} dialog - Dialog data
     * @param {string} dialog.speaker - Speaker name
     * @param {string} dialog.portrait - Portrait style (emotionId or npc type)
     * @param {string} dialog.text - Dialog text (supports \n for line breaks)
     * @param {Array} dialog.choices - Optional choice buttons [{text, action, value}]
     * @param {string} dialog.style - DialogStyle
     */
    show(dialog) {
        this.isOpen = true;
        this.currentDialog = dialog;
        this.currentLine = 0;
        this.displayedText = '';
        this.textTimer = 0;
        this.awaitingInput = false;
        this.isAnimatingText = true;
        this.journalState = null;
        this.barState = null;
        this.inputBuffer = '';
    }

    /**
     * Open the journal entry dialog (legacy); BAR capture is the player-facing path.
     */
    openJournal() {
        this.openBarCapture();
    }

    /**
     * BAR capture — emotion + intensity (for seeds), then B / A / R text (Chapter 1 spec).
     */
    openBarCapture() {
        this.currentDialog = {
            speaker: '⟡ BAR — Behavior, Activation, Result ⟡',
            speakerColor: '#c8a8e8',
            style: DialogStyle.JOURNAL,
        };
        this.isOpen = true;
        this.journalState = null;
        this.barState = { phase: 'emotion' };
        this.selectedEmotion = null;
        this.inputBuffer = '';
        this.displayedText = '';
        this.awaitingInput = true;
        this.isAnimatingText = false;
    }

    /**
     * Close the dialog
     */
    close() {
        this.isOpen = false;
        this.currentDialog = null;
        this.currentLine = 0;
        this.displayedText = '';
        this.awaitingInput = false;
        this.isAnimatingText = false;
        this.journalState = null;
        this.barState = null;
        this.inputBuffer = '';
        if (this.onComplete) this.onComplete();
    }

    /**
     * Handle input
     * @param {object} input - Input instance
     * @returns {boolean} Whether input was consumed
     */
    handleInput(input) {
        if (!this.isOpen) return false;

        if (this.barState) {
            return this._handleBarInput(input);
        }

        // Journal mode has special input handling
        if (this.journalState) {
            return this._handleJournalInput(input);
        }

        // Skip text animation
        if (this.isAnimatingText && (input.isKeyJustPressed(' ') || input.isKeyJustPressed('Enter') || input.mouse.leftJustPressed)) {
            this.displayedText = this.currentDialog.text;
            this.isAnimatingText = false;
            this.awaitingInput = true;
            return true;
        }

        // Advance or choose
        if (this.awaitingInput) {
            if (input.isKeyJustPressed(' ') || input.isKeyJustPressed('Enter') || input.mouse.leftJustPressed) {
                if (!this.currentDialog.choices || this.currentDialog.choices.length === 0) {
                    this.close();
                    return true;
                }
            }
            
            // Numeric choices
            if (this.currentDialog.choices) {
                for (let i = 0; i < this.currentDialog.choices.length; i++) {
                    if (input.isKeyJustPressed(String(i + 1))) {
                        const choice = this.currentDialog.choices[i];
                        if (this.onChoice) this.onChoice(choice.action, choice);
                        if (choice.action === 'close') {
                            this.close();
                        }
                        return true;
                    }
                }
            }
            
            // Click-to-advance / click-on-choice
            if (input.mouse.leftJustPressed && this.awaitingInput) {
                if (!this.currentDialog.choices || this.currentDialog.choices.length === 0) {
                    this.close();
                    return true;
                }
                // Check if click is on a choice
                const clicked = this.getChoiceAtPosition(input.mouse.x, input.mouse.y);
                if (clicked >= 0 && clicked < this.currentDialog.choices.length) {
                    const choice = this.currentDialog.choices[clicked];
                    if (this.onChoice) this.onChoice(choice.action, choice);
                    if (choice.action === 'close') {
                        this.close();
                    }
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Handle input during journal entry mode
     */
    _handleJournalInput(input) {
        if (!this.journalState) return false;

        const phase = this.journalState.phase;

        if (phase === 'select_emotion') {
            // Number keys 1-6 select emotion
            const emotions = Object.values(EmotionTypes);
            for (let i = 0; i < emotions.length; i++) {
                if (input.isKeyJustPressed(String(i + 1))) {
                    this.selectedEmotion = emotions[i].id;
                    this.journalState.phase = 'set_intensity';
                    this.inputBuffer = '5'; // default medium
                    this.displayedText = '';
                    this.isAnimatingText = false;
                    this.awaitingInput = true;
                    return true;
                }
            }
            if (input.isKeyJustPressed('Escape')) {
                this.close();
                return true;
            }
        }
        
        if (phase === 'set_intensity') {
            // Capture typed number (1-9)
            for (let i = 1; i <= 9; i++) {
                if (input.isKeyJustPressed(String(i))) {
                    this.inputBuffer = String(i);
                    this.journalState.intensity = i * 10 + 10; // 20-100
                    this.journalState.phase = 'describe';
                    this.inputBuffer = '';
                    this.isAnimatingText = false;
                    this.awaitingInput = true;
                    return true;
                }
            }
            if (input.isKeyJustPressed('Escape')) {
                this.journalState.phase = 'select_emotion';
                return true;
            }
        }

        if (phase === 'describe') {
            // Accept text input for description
            for (const key in input.keysJustPressed) {
                if (key.length === 1) {
                    this.inputBuffer += key;
                } else if (key === 'Backspace') {
                    this.inputBuffer = this.inputBuffer.slice(0, -1);
                } else if (key === 'Enter' || key === ' ') {
                    if (this.inputBuffer.length > 0 || true) {
                        // Submit the journal entry
                        if (this.onJournalSubmit) {
                            this.onJournalSubmit({
                                emotionId: this.selectedEmotion,
                                intensity: this.journalState.intensity || 50,
                                description: this.inputBuffer || `I felt ${this.selectedEmotion}`
                            });
                        }
                        this.journalState = null;
                        this.close();
                        return true;
                    }
                }
            }
            if (input.isKeyJustPressed('Escape')) {
                this.journalState.phase = 'set_intensity';
                return true;
            }
        }

        return false;
    }

    /**
     * BAR capture input — emotion, intensity, then three text fields.
     */
    _handleBarInput(input) {
        if (!this.barState) return false;
        const phase = this.barState.phase;

        if (phase === 'emotion') {
            const emotions = Object.values(EmotionTypes);
            for (let i = 0; i < emotions.length; i++) {
                if (input.isKeyJustPressed(String(i + 1))) {
                    this.selectedEmotion = emotions[i].id;
                    this.barState.phase = 'intensity';
                    this.inputBuffer = '';
                    return true;
                }
            }
            if (input.isKeyJustPressed('Escape')) {
                this.close();
                return true;
            }
            return false;
        }

        if (phase === 'intensity') {
            for (let i = 1; i <= 9; i++) {
                if (input.isKeyJustPressed(String(i))) {
                    this.barState.intensity = i * 10 + 10;
                    this.barState.phase = 'behavior';
                    this.inputBuffer = '';
                    return true;
                }
            }
            if (input.isKeyJustPressed('Escape')) {
                this.barState.phase = 'emotion';
                return true;
            }
            return false;
        }

        const textPhases = ['behavior', 'activation', 'result'];
        if (textPhases.includes(phase)) {
            for (const key in input.keysJustPressed) {
                if (key.length === 1) {
                    this.inputBuffer += key;
                } else if (key === 'Backspace') {
                    this.inputBuffer = this.inputBuffer.slice(0, -1);
                } else if (key === 'Enter') {
                    const trimmed = this.inputBuffer.trim();
                    if (!trimmed) {
                        return true;
                    }
                    if (phase === 'behavior') {
                        this.barState.behavior = trimmed;
                        this.barState.phase = 'activation';
                        this.inputBuffer = '';
                        return true;
                    }
                    if (phase === 'activation') {
                        this.barState.activation = trimmed;
                        this.barState.phase = 'result';
                        this.inputBuffer = '';
                        return true;
                    }
                    if (phase === 'result') {
                        this.barState.result = trimmed;
                        if (this.onBarSubmit) {
                            this.onBarSubmit({
                                emotionId: this.selectedEmotion,
                                intensity: this.barState.intensity || 50,
                                behavior: this.barState.behavior,
                                activation: this.barState.activation,
                                result: this.barState.result,
                            });
                        }
                        this.barState = null;
                        this.close();
                        return true;
                    }
                }
            }
            if (input.isKeyJustPressed('Escape')) {
                if (phase === 'behavior') this.barState.phase = 'intensity';
                else if (phase === 'activation') {
                    this.barState.phase = 'behavior';
                    this.inputBuffer = this.barState.behavior || '';
                } else if (phase === 'result') {
                    this.barState.phase = 'activation';
                    this.inputBuffer = this.barState.activation || '';
                }
                return true;
            }
            return true;
        }

        return false;
    }

    /**
     * Update — handles typewriter animation, cursor blink, and hover tracking
     */
    update(deltaTime) {
        if (!this.isOpen) return;
        
        // Typewriter text animation
        if (this.isAnimatingText && this.currentDialog) {
            this.textTimer += deltaTime;
            const charsToShow = Math.floor(this.textTimer / this.textSpeed);
            this.displayedText = this.currentDialog.text.substring(0, charsToShow);
            if (this.displayedText.length >= this.currentDialog.text.length) {
                this.displayedText = this.currentDialog.text;
                this.isAnimatingText = false;
                this.awaitingInput = true;
            }
        }
        
        // Cursor blink
        this.cursorTimer += deltaTime;
        if (this.cursorTimer > 500) {
            this.showCursor = !this.showCursor;
            this.cursorTimer = 0;
        }
        
        // Mouse hover over choices
        if (this._choiceRects.length > 0) {
            const mx = this.canvas.width;  // Replaced — will check via Input
            const my = this.canvas.height;
            // Resolve via mouse event coordinates stored on canvas
            this.hoveredChoice = -1;
        }
    }

    /**
     * Set mouse position for hover detection (called from Input handler)
     */
    setMousePosition(mx, my) {
        if (!this.isOpen || this._choiceRects.length === 0) {
            this.hoveredChoice = -1;
            return;
        }
        this.hoveredChoice = -1;
        for (const rect of this._choiceRects) {
            if (mx >= rect.x && mx <= rect.x + rect.w &&
                my >= rect.y && my <= rect.y + rect.h) {
                this.hoveredChoice = rect.index;
                break;
            }
        }
    }

    /**
     * Get the index of the choice a mouse click hit, or -1
     */
    getChoiceAtPosition(mx, my) {
        for (const rect of this._choiceRects) {
            if (mx >= rect.x && mx <= rect.x + rect.w &&
                my >= rect.y && my <= rect.y + rect.h) {
                return rect.index;
            }
        }
        return -1;
    }

    /**
     * Render the dialog box
     */
    render() {
        if (!this.isOpen) return;

        const ctx = this.ctx;
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        if (this.barState) {
            this._renderBarCapture(ctx, cw, ch);
            ctx.restore();
            return;
        }

        // Journal mode renders full-screen
        if (this.journalState) {
            this._renderJournal(ctx, cw, ch);
            ctx.restore();
            return;
        }

        const dialog = this.currentDialog;
        const style = dialog.style || DialogStyle.NPC;

        // Bottom dialog box — taller when there are choices
        const numChoices = dialog.choices ? dialog.choices.length : 0;
        const extraH = Math.max(0, numChoices - 1) * 16;
        const boxX = 40;
        const boxY = ch - 180 - extraH;
        const boxW = cw - 80;
        const boxH = 150 + extraH;

        this._drawDialogBox(ctx, boxX, boxY, boxW, boxH, style, dialog);
        
        ctx.restore();
    }

    /**
     * Draw the standard dialog box
     */
    _drawDialogBox(ctx, boxX, boxY, boxW, boxH, style, dialog) {
        // Background
        ctx.fillStyle = 'rgba(10, 8, 16, 0.92)';
        ctx.fillRect(boxX, boxY, boxW, boxH);

        // Border
        const borderColor = style === DialogStyle.INNER ? '#e8c88a' :
                           style === DialogStyle.QUEST ? '#4a8a4a' :
                           style === DialogStyle.SYSTEM ? '#4a6a8a' : '#4a3728';

        // Taoist-style decorative corners
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Top accent glow
        ctx.fillStyle = borderColor;
        ctx.fillRect(boxX, boxY, boxW, 3);

        // Speaker name
        if (dialog.speaker) {
            ctx.fillStyle = dialog.speakerColor || '#c8a96e';
            ctx.font = `bold 12px ${this.fontFamily}`;
            ctx.fillText(dialog.speaker, boxX + 15, boxY + 22);
        }

        // Style badge
        const styleLabels = {
            inner: '✦ Reflection',
            npc: '🗣 Conversation',
            quest: '⚔ Quest',
            system: '⚙ Notice',
            journal: '📖 Journal'
        };
        if (styleLabels[style]) {
            ctx.fillStyle = '#4a4a5030';
            ctx.font = `8px ${this.fontFamily}`;
            ctx.fillText(styleLabels[style], boxX + boxW - ctx.measureText(styleLabels[style]).width - 15, boxY + 22);
        }

        // Dialog text with word wrap
        ctx.fillStyle = '#e8d8c0';
        ctx.font = `13px ${this.fontFamily}`;
        
        const maxWidth = boxW - 40;
        const lineHeight = 20;
        let lines = [];
        let currentLine = '';
        
        const text = this.isAnimatingText ? this.displayedText : (this.currentDialog ? this.currentDialog.text : '');
        const words = text.split(' ');
        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        
        let textY = boxY + 45;
        for (const line of lines.slice(0, 5)) {
            ctx.fillText(line, boxX + 20, textY);
            textY += lineHeight;
        }

        // Continue / blink indicator
        if (this.awaitingInput && !dialog.choices) {
            const blink = Math.floor(Date.now() / 500) % 2 === 0;
            if (blink) {
                ctx.fillStyle = '#8a8a90';
                ctx.font = `11px ${this.fontFamily}`;
                ctx.fillText('▼ click or press space', boxX + boxW - 140, boxY + boxH - 10);
            }
        }

        // Choices
        this._choiceRects = [];
        if (dialog.choices && this.awaitingInput) {
            const choiceH = 24;
            const totalH = dialog.choices.length * choiceH + 8;
            let choiceY = boxY + boxH - totalH - 10;
            
            // Background for choices area
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(boxX + 15, choiceY - 2, boxW - 30, totalH + 4);
            
            // Border
            ctx.strokeStyle = '#4a372855';
            ctx.lineWidth = 1;
            ctx.strokeRect(boxX + 15, choiceY - 2, boxW - 30, totalH + 4);
            
            for (let i = 0; i < dialog.choices.length; i++) {
                const choice = dialog.choices[i];
                const isHovered = this.hoveredChoice === i;
                
                // Store rect for mouse hit testing
                this._choiceRects.push({
                    x: boxX + 18,
                    y: choiceY + i * choiceH + 2,
                    w: boxW - 36,
                    h: choiceH - 2,
                    index: i
                });
                
                // Choice background on hover
                if (isHovered) {
                    ctx.fillStyle = 'rgba(200, 169, 110, 0.2)';
                    ctx.fillRect(boxX + 18, choiceY + i * choiceH + 2, boxW - 36, choiceH - 2);
                }
                
                // Number badge
                ctx.fillStyle = '#3a2a1a';
                ctx.fillRect(boxX + 22, choiceY + i * choiceH + 5, 16, 14);
                ctx.strokeStyle = '#4a3728';
                ctx.lineWidth = 1;
                ctx.strokeRect(boxX + 22, choiceY + i * choiceH + 5, 16, 14);
                ctx.fillStyle = '#c8a96e';
                ctx.font = `bold 10px ${this.fontFamily}`;
                ctx.textAlign = 'center';
                ctx.fillText(`${i + 1}`, boxX + 30, choiceY + i * choiceH + 17);
                ctx.textAlign = 'left';
                
                // Choice text
                ctx.fillStyle = isHovered ? '#f0e8d0' : '#d0c0a0';
                ctx.font = `11px ${this.fontFamily}`;
                ctx.fillText(choice.text, boxX + 44, choiceY + i * choiceH + 17);
            }
        }
    }

    /**
     * Render the full-screen journal entry interface
     */
    _renderJournal(ctx, cw, ch) {
        const phase = this.journalState.phase;
        
        // Full screen overlay
        ctx.fillStyle = 'rgba(5, 3, 12, 0.94)';
        ctx.fillRect(0, 0, cw, ch);
        
        // Decorative border
        ctx.strokeStyle = '#e8c88a33';
        ctx.lineWidth = 1;
        ctx.strokeRect(30, 30, cw - 60, ch - 60);
        
        // Top symbol
        ctx.fillStyle = '#e8c88a20';
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.fillText('☯', cw / 2, 65);
        ctx.textAlign = 'left';
        
        // Title
        ctx.fillStyle = '#e8c88a';
        ctx.font = `bold 18px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('⟡ Inner Journal ⟡', cw / 2, 95);
        ctx.textAlign = 'left';
        
        // Step indicator
        const steps = ['What do you feel?', 'How strong?', 'Describe'];
        const stepIndex = phase === 'select_emotion' ? 0 : phase === 'set_intensity' ? 1 : 2;
        ctx.fillStyle = '#4a4a50';
        ctx.font = `10px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        const stepText = steps.map((s, i) => i < stepIndex ? `✦ ${s}` : i === stepIndex ? `⟡ ${s}` : `○ ${s}`).join('   ');
        ctx.fillText(stepText, cw / 2, 115);
        ctx.textAlign = 'left';
        
        // Context help at top right
        ctx.fillStyle = '#4a4a50';
        ctx.font = `9px ${this.fontFamily}`;
        ctx.textAlign = 'right';
        ctx.fillText('ESC to go back', cw - 50, 55);
        ctx.textAlign = 'left';
        
        if (phase === 'select_emotion') {
            this._renderEmotionSelection(ctx, cw, ch);
        } else if (phase === 'set_intensity') {
            this._renderIntensitySelection(ctx, cw, ch);
        } else if (phase === 'describe') {
            this._renderDescriptionInput(ctx, cw, ch);
        }
    }

    /**
     * Render emotion selection grid
     */
    _renderEmotionSelection(ctx, cw, ch) {
        ctx.fillStyle = '#a09070';
        ctx.font = `13px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('What emotion are you feeling right now?', cw / 2, 155);
        ctx.textAlign = 'left';
        
        const emotions = Object.values(EmotionTypes);
        const startY = 185;
        const itemH = 50;
        
        for (let i = 0; i < emotions.length; i++) {
            const em = emotions[i];
            const y = startY + i * itemH;
            
            // Background
            ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)';
            ctx.fillRect(120, y, cw - 240, itemH - 4);
            
            // Emotion circle indicator
            ctx.fillStyle = em.color;
            ctx.beginPath();
            ctx.arc(150, y + itemH / 2 - 5, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Number key
            ctx.fillStyle = '#6a5a4a';
            ctx.font = `11px ${this.fontFamily}`;
            ctx.fillText(`[${i + 1}]`, 175, y + 22);
            
            // Name
            ctx.fillStyle = '#e8d8c0';
            ctx.font = `bold 14px ${this.fontFamily}`;
            ctx.fillText(em.name, 210, y + 22);
            
            // Element tag
            ctx.fillStyle = '#6a5a5a';
            ctx.font = `10px ${this.fontFamily}`;
            ctx.fillText(em.element, 280, y + 22);
            
            // Description
            ctx.fillStyle = '#8a7a6a';
            ctx.font = `10px ${this.fontFamily}`;
            ctx.fillText(em.description, 210, y + 38);
            
            // Cultivation path (virtue)
            ctx.fillStyle = em.color + '80';
            ctx.font = `9px ${this.fontFamily}`;
            ctx.textAlign = 'right';
            ctx.fillText(`→ ${em.virtue}`, cw - 140, y + 22);
            ctx.textAlign = 'left';
        }
        
        // Footer
        ctx.fillStyle = '#4a4a50';
        ctx.font = `9px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('Press 1-6 to select · ESC to cancel', cw / 2, ch - 50);
        ctx.textAlign = 'left';
    }

    /**
     * Render intensity selection
     */
    _renderIntensitySelection(ctx, cw, ch) {
        const emotion = Object.values(EmotionTypes).find(e => e.id === this.selectedEmotion);
        
        ctx.fillStyle = emotion ? emotion.color : '#888';
        ctx.font = `16px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText(emotion ? emotion.name : 'Unknown', cw / 2, 160);
        ctx.textAlign = 'left';
        
        ctx.fillStyle = '#a09070';
        ctx.font = `13px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('How intense is this feeling?', cw / 2, 190);
        ctx.textAlign = 'left';
        
        // Intensity bar levels
        const levels = [
            { key: '1', label: '1 — Barely noticeable', color: '#6a8a6a' },
            { key: '2', label: '2 — Slight ripple', color: '#7a9a6a' },
            { key: '3', label: '3 — Present', color: '#8aaa6a' },
            { key: '4', label: '4 — Moderate', color: '#aa9a5a' },
            { key: '5', label: '5 — Noticeably strong', color: '#c88a4a' },
            { key: '6', label: '6 — Quite intense', color: '#cc7a3a' },
            { key: '7', label: '7 — Very intense', color: '#cc5a2a' },
            { key: '8', label: '8 — Overwhelming', color: '#cc3a1a' },
            { key: '9', label: '9 — Consuming', color: '#cc1a0a' },
        ];
        
        const startY = 220;
        const itemH = 33;
        
        for (let i = 0; i < levels.length; i++) {
            const lev = levels[i];
            const y = startY + i * itemH;
            
            ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)';
            ctx.fillRect(250, y, cw - 500, itemH - 2);
            
            ctx.fillStyle = lev.color;
            ctx.font = `12px ${this.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.fillText(`[${lev.key}]`, 330, y + 20);
            ctx.fillText(lev.label, cw / 2, y + 20);
            ctx.textAlign = 'left';
        }
        
        ctx.fillStyle = '#4a4a50';
        ctx.font = `9px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('Press 1-9 for intensity · ESC back to emotion selection', cw / 2, ch - 50);
        ctx.textAlign = 'left';
    }

    /**
     * Render description text input
     */
    _renderDescriptionInput(ctx, cw, ch) {
        const emotion = Object.values(EmotionTypes).find(e => e.id === this.selectedEmotion);
        
        ctx.fillStyle = emotion ? emotion.color : '#888';
        ctx.font = `14px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText(`${emotion ? emotion.name : 'Unknown'}  ·  Intensity: ${this.journalState.intensity || 50}%`, cw / 2, 160);
        ctx.textAlign = 'left';
        
        ctx.fillStyle = '#a09070';
        ctx.font = `13px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('What happened? What triggered this?', cw / 2, 200);
        ctx.textAlign = 'left';
        
        // Input area
        const inputX = 180;
        const inputY = 230;
        const inputW = cw - 360;
        const inputH = 120;
        
        // Input box
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(inputX, inputY, inputW, inputH);
        ctx.strokeStyle = '#4a3a2a';
        ctx.lineWidth = 1;
        ctx.strokeRect(inputX, inputY, inputW, inputH);
        
        // Display typed text
        ctx.fillStyle = '#e8d8c0';
        ctx.font = `14px ${this.fontFamily}`;
        
        // Word wrap the input buffer
        const maxWidth = inputW - 20;
        const words = this.inputBuffer.split(' ');
        let lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        
        let textY = inputY + 20;
        for (const line of lines.slice(0, 5)) {
            ctx.fillText(line, inputX + 10, textY);
            textY += 22;
        }
        
        // Blinking cursor at end of text
        if (this.showCursor) {
            const lastLine = lines[lines.length - 1] || '';
            const cursorX = inputX + 10 + ctx.measureText(lastLine).width + 2;
            const cursorY = textY - 22;
            ctx.fillStyle = '#e8c88a';
            ctx.fillRect(cursorX, cursorY, 8, 16);
        }
        
        // Character count
        ctx.fillStyle = '#4a4a50';
        ctx.font = `9px ${this.fontFamily}`;
        ctx.textAlign = 'right';
        ctx.fillText(`${this.inputBuffer.length} characters`, inputX + inputW - 5, inputY + inputH - 5);
        ctx.textAlign = 'left';
        
        // Submit hint
        ctx.fillStyle = '#6a5a4a';
        ctx.font = `11px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('Type what you feel · Press ENTER to submit · ESC back to intensity', cw / 2, ch - 50);
        ctx.textAlign = 'left';
        
        // Prompt at bottom
        if (this.inputBuffer.length === 0) {
            ctx.fillStyle = '#4a4a50';
            ctx.font = `12px ${this.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.fillText('(Even a single word is enough. This is for you, not for anyone else.)', cw / 2, ch - 75);
            ctx.textAlign = 'left';
        }
    }

    /**
     * Full-screen BAR capture (emotion + intensity + B / A / R).
     */
    _renderBarCapture(ctx, cw, ch) {
        const phase = this.barState.phase;

        ctx.fillStyle = 'rgba(8, 4, 18, 0.96)';
        ctx.fillRect(0, 0, cw, ch);

        ctx.strokeStyle = '#c8a8e855';
        ctx.lineWidth = 1;
        ctx.strokeRect(30, 30, cw - 60, ch - 60);

        ctx.fillStyle = '#c8a8e820';
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.fillText('☰', cw / 2, 62);
        ctx.textAlign = 'left';

        ctx.fillStyle = '#c8a8e8';
        ctx.font = `bold 17px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('⟡ Record a BAR ⟡', cw / 2, 92);
        ctx.textAlign = 'left';

        ctx.fillStyle = '#7a7090';
        ctx.font = `10px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('Behavior · Activation · Result — one honest pass through the garden gate', cw / 2, 112);
        ctx.textAlign = 'left';

        ctx.fillStyle = '#4a4a50';
        ctx.font = `9px ${this.fontFamily}`;
        ctx.textAlign = 'right';
        ctx.fillText('ESC to step back · Enter to confirm each field', cw - 40, 48);
        ctx.textAlign = 'left';

        if (phase === 'emotion') {
            ctx.fillStyle = '#a090c0';
            ctx.font = `12px ${this.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.fillText('Step 1 — What emotion colors this moment?', cw / 2, 138);
            ctx.textAlign = 'left';
            this._renderEmotionSelection(ctx, cw, ch);
        } else if (phase === 'intensity') {
            this._renderIntensitySelection(ctx, cw, ch);
        } else if (phase === 'behavior') {
            this._renderBarTextStep(ctx, cw, ch, 'Step 3 — Behavior', 'What did you do? (the observable action)');
        } else if (phase === 'activation') {
            this._renderBarTextStep(ctx, cw, ch, 'Step 4 — Activation', 'When or where did it show up? What set it in motion?');
        } else if (phase === 'result') {
            this._renderBarTextStep(ctx, cw, ch, 'Step 5 — Result', 'What happened inside you or in the world afterward?');
        }
    }

    _renderBarTextStep(ctx, cw, ch, title, subtitle) {
        ctx.fillStyle = '#c8a8e8';
        ctx.font = `14px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText(title, cw / 2, 150);
        ctx.textAlign = 'left';

        ctx.fillStyle = '#a09070';
        ctx.font = `12px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText(subtitle, cw / 2, 178);
        ctx.textAlign = 'left';

        const inputX = 140;
        const inputY = 210;
        const inputW = cw - 280;
        const inputH = 200;

        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(inputX, inputY, inputW, inputH);
        ctx.strokeStyle = '#5a4a6a';
        ctx.lineWidth = 1;
        ctx.strokeRect(inputX, inputY, inputW, inputH);

        ctx.fillStyle = '#e8d8c0';
        ctx.font = `14px ${this.fontFamily}`;
        const maxWidth = inputW - 20;
        const words = this.inputBuffer.split(' ');
        let lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);

        let textY = inputY + 22;
        for (const line of lines.slice(0, 8)) {
            ctx.fillText(line, inputX + 12, textY);
            textY += 22;
        }

        if (this.showCursor) {
            const lastLine = lines[lines.length - 1] || '';
            const cursorX = inputX + 12 + ctx.measureText(lastLine).width + 2;
            const cursorY = textY - 22;
            ctx.fillStyle = '#c8a8e8';
            ctx.fillRect(cursorX, cursorY, 8, 16);
        }

        ctx.fillStyle = '#5a5a62';
        ctx.font = `10px ${this.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('ENTER to seal this line · ESC to revise the previous step', cw / 2, ch - 42);
        ctx.textAlign = 'left';
    }
}
