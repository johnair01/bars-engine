/**
 * Asset Generator
 * Programmatically generates pixel-art style sprites and tiles using Canvas 2D.
 * Creates all game visuals without external asset files.
 */

import { EmotionTypes } from '../data/Emotions.js';

export class AssetGenerator {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Get or generate a sprite by name
     * @param {string} name - Sprite identifier
     * @returns {HTMLCanvasElement} The generated sprite canvas
     */
    getSprite(name, ...params) {
        const key = name + (params.length ? '_' + params.join('_') : '');
        if (this.cache.has(key)) return this.cache.get(key);
        
        const sprite = this._generate(name, ...params);
        if (sprite) this.cache.set(key, sprite);
        return sprite;
    }

    _generate(name, ...params) {
        switch (name) {
            case 'player': return this._createPlayerSprite(params[0] || 'down');
            case 'tile_grass': return this._createTileGrass();
            case 'tile_dirt': return this._createTileDirt();
            case 'tile_water': return this._createTileWater();
            case 'tile_path': return this._createTilePath();
            case 'tile_soil': return this._createTileSoil();
            case 'tile_fence': return this._createTileFence();
            case 'crop': return this._createCropSprite(params[0] || 'seed', params[1] || 'anger');
            case 'seed_item': return this._createSeedSprite(params[0] || 'anger');
            case 'tree': return this._createTreeSprite();
            case 'rock': return this._createRockSprite();
            case 'building': return this._createBuildingSprite(params[0] || 'temple');
            case 'npc': return this._createNPCSprite(params[0] || 'sage');
            case 'watering_can': return this._createToolSprite('watering_can');
            case 'meditation_glow': return this._createGlowSprite(params[0] || '#e8c88a');
            case 'emotion_orb': return this._createEmotionOrb(params[0] || 'anger');
            case 'heart': return this._createHeartSprite();
            case 'sparkle': return this._createSparkleSprite();
            case 'fruit': return this._createFruitSprite(params[0] || 'anger');
            case 'interact_icon': return this._createInteractIcon(params[0] || 'talk');
            case 'highlight': return this._createHighlightSprite();
            default: return this._createPlaceholder(name);
        }
    }

    _createCanvas(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        return canvas;
    }

    _getCtx(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        return ctx;
    }

    _setPixel(ctx, x, y, color, size = 1) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);
    }

    // ===== PLAYER SPRITE (16x16 pixel art scale, rendered at 32x32) =====
    _createPlayerSprite(direction = 'down') {
        const canvas = this._createCanvas(32);
        const ctx = this._getCtx(canvas);
        const p = (x, y, c) => this._setPixel(ctx, x, y, c);
        
        // Simple Taoist cultivator sprite
        // Robe (body)
        for (let y = 10; y < 26; y++) {
            for (let x = 10; x < 22; x++) {
                if (y < 14) {
                    // Head
                    p(x, y, '#f5d0a9');
                } else if (y < 18) {
                    // Upper body - robe
                    p(x, y, '#5a4a3a');
                } else if (y < 24) {
                    // Lower body - robe
                    p(x, y, '#4a3a2a');
                } else {
                    // Feet
                    if (x % 3 === 0) p(x, y, '#3a2a1a');
                }
            }
        }
        
        // Head details
        for (let y = 10; y < 14; y++) {
            for (let x = 12; x < 20; x++) {
                p(x, y, '#f5d0a9');
            }
        }
        // Hair
        for (let x = 11; x < 21; x++) {
            p(x, 9, '#2a1a0a');
            p(x, 10, '#2a1a0a');
        }
        // Top knot (Daoist bun)
        for (let x = 14; x < 18; x++) {
            p(x, 7, '#2a1a0a');
            p(x, 8, '#2a1a0a');
        }
        p(15, 6, '#2a1a0a');
        
        // Eyes
        const eyeOffset = direction === 'up' ? 12 : (direction === 'down' ? 13 : 13);
        p(13, eyeOffset, '#1a1a2a');
        p(18, eyeOffset, '#1a1a2a');
        
        // Belt (sash)
        for (let x = 10; x < 22; x++) {
            p(x, 18, '#c8a96e');
        }
        
        // Arms
        for (let y = 14; y < 20; y++) {
            p(8, y, '#5a4a3a');
            p(9, y, '#5a4a3a');
            p(22, y, '#5a4a3a');
            p(23, y, '#5a4a3a');
        }
        
        // Direction indicator (subtle)
        if (direction === 'right') {
            p(24, 15, '#c8a96e'); // arm holding something
        } else if (direction === 'left') {
            p(7, 15, '#c8a96e');
        }
        
        // Glow aura (cultivation)
        ctx.globalAlpha = 0.1;
        for (let x = 6; x < 26; x++) {
            for (let y = 5; y < 28; y++) {
                if (x < 8 || x >= 24 || y < 7 || y >= 26) {
                    const dist = Math.sqrt((x - 15) ** 2 + (y - 16) ** 2);
                    if (dist > 8 && dist < 12) {
                        p(x, y, '#e8c88a');
                    }
                }
            }
        }
        ctx.globalAlpha = 1;
        
        return canvas;
    }

    // ===== TILE: Grass =====
    _createTileGrass() {
        const canvas = this._createCanvas(32);
        const ctx = this._getCtx(canvas);
        
        // Base green
        ctx.fillStyle = '#4a7a3a';
        ctx.fillRect(0, 0, 32, 32);
        
        // Grass texture
        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * 32);
            const y = Math.floor(Math.random() * 32);
            const shade = Math.random() > 0.5 ? '#5a8a4a' : '#3a6a2a';
            this._setPixel(ctx, x, y, shade);
        }
        
        // Occasional small flowers
        for (let i = 0; i < 3; i++) {
            const x = Math.floor(Math.random() * 32);
            const y = Math.floor(Math.random() * 32);
            const colors = ['#e8d040', '#e8a0d0', '#ffffff'];
            this._setPixel(ctx, x, y, colors[i % 3]);
            this._setPixel(ctx, x+1, y, colors[i % 3]);
        }
        
        return canvas;
    }

    // ===== TILE: Dirt =====
    _createTileDirt() {
        const canvas = this._createCanvas(32);
        const ctx = this._getCtx(canvas);
        
        ctx.fillStyle = '#6a4a2a';
        ctx.fillRect(0, 0, 32, 32);
        
        for (let i = 0; i < 25; i++) {
            const x = Math.floor(Math.random() * 32);
            const y = Math.floor(Math.random() * 32);
            const shade = Math.random() > 0.5 ? '#7a5a3a' : '#5a3a1a';
            this._setPixel(ctx, x, y, shade);
        }
        
        return canvas;
    }

    // ===== TILE: Water =====
    _createTileWater() {
        const canvas = this._createCanvas(32);
        const ctx = this._getCtx(canvas);
        
        ctx.fillStyle = '#3a5a8a';
        ctx.fillRect(0, 0, 32, 32);
        
        // Ripple effect
        for (let i = 0; i < 10; i++) {
            const x = Math.floor(Math.random() * 32);
            const y = Math.floor(Math.random() * 32);
            this._setPixel(ctx, x, y, '#5a7aaa');
        }
        
        // Shimmer
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * 32);
            const y = Math.floor(Math.random() * 32);
            this._setPixel(ctx, x, y, '#8aaddd');
            this._setPixel(ctx, x+1, y, '#8aaddd');
        }
        
        return canvas;
    }

    // ===== TILE: Path =====
    _createTilePath() {
        const canvas = this._createCanvas(32);
        const ctx = this._getCtx(canvas);
        
        ctx.fillStyle = '#8a7a5a';
        ctx.fillRect(0, 0, 32, 32);
        
        for (let i = 0; i < 20; i++) {
            const x = Math.floor(Math.random() * 32);
            const y = Math.floor(Math.random() * 32);
            const shade = Math.random() > 0.5 ? '#9a8a6a' : '#7a6a4a';
            this._setPixel(ctx, x, y, shade);
        }
        
        // Edge stones
        ctx.fillStyle = '#6a5a3a';
        for (let i = 0; i < 8; i++) {
            this._setPixel(ctx, i * 4, 0, '#6a5a3a');
            this._setPixel(ctx, i * 4, 31, '#6a5a3a');
        }
        
        return canvas;
    }

    // ===== TILE: Soil (farm plot) =====
    _createTileSoil() {
        const canvas = this._createCanvas(32);
        const ctx = this._getCtx(canvas);
        
        ctx.fillStyle = '#3a2510';
        ctx.fillRect(0, 0, 32, 32);
        
        // Plowed lines
        for (let y = 4; y < 32; y += 8) {
            ctx.fillStyle = '#4a3018';
            ctx.fillRect(0, y, 32, 2);
        }
        
        // Loose dirt texture
        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * 32);
            const y = Math.floor(Math.random() * 32);
            const shade = Math.random() > 0.5 ? '#4a3018' : '#2a1a08';
            this._setPixel(ctx, x, y, shade);
        }
        
        // Border - wooden frame
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(0, 0, 32, 2);
        ctx.fillRect(0, 30, 32, 2);
        ctx.fillRect(0, 0, 2, 32);
        ctx.fillRect(30, 0, 2, 32);
        
        return canvas;
    }

    // ===== TILE: Fence =====
    _createTileFence() {
        const canvas = this._createCanvas(32);
        const ctx = this._getCtx(canvas);
        
        ctx.fillStyle = '#4a7a3a'; // grass background
        ctx.fillRect(0, 0, 32, 32);
        
        // Fence posts
        ctx.fillStyle = '#6a4a2a';
        ctx.fillRect(2, 4, 4, 24);
        ctx.fillRect(26, 4, 4, 24);
        
        // Horizontal rails
        ctx.fillStyle = '#7a5a3a';
        ctx.fillRect(4, 8, 24, 3);
        ctx.fillRect(4, 20, 24, 3);
        
        // Wood grain
        ctx.fillStyle = '#5a3a1a';
        this._setPixel(ctx, 3, 10, '#5a3a1a');
        this._setPixel(ctx, 27, 10, '#5a3a1a');
        this._setPixel(ctx, 3, 22, '#5a3a1a');
        this._setPixel(ctx, 27, 22, '#5a3a1a');
        
        return canvas;
    }

    // ===== CROP SPRITE (by growth stage and emotion) =====
    _createCropSprite(stage, emotionId) {
        const canvas = this._createCanvas(32);
        const ctx = this._getCtx(canvas);
        const emotion = Object.values(EmotionTypes).find(e => e.id === emotionId);
        const color = emotion ? emotion.color : '#88cc44';
        const lightColor = emotion ? emotion.lightColor : '#aadd66';
        
        // Soil background
        ctx.fillStyle = '#3a2510';
        ctx.fillRect(0, 0, 32, 32);
        
        switch (stage) {
            case 'seed': {
                // Small seed in soil
                ctx.fillStyle = '#2a1a08';
                ctx.beginPath();
                ctx.arc(16, 20, 3, 0, Math.PI * 2);
                ctx.fill();
                // Glow
                ctx.fillStyle = color + '40';
                ctx.beginPath();
                ctx.arc(16, 20, 6, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'sprout': {
                // Tiny green sprout
                ctx.fillStyle = '#4a8a30';
                ctx.fillRect(14, 12, 4, 10);
                // Leaves
                ctx.fillStyle = '#5aaa40';
                ctx.fillRect(10, 14, 6, 3);
                ctx.fillRect(16, 10, 6, 3);
                // Emotion glow at base
                ctx.fillStyle = color + '30';
                ctx.beginPath();
                ctx.arc(16, 22, 8, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'bud': {
                // Larger plant with buds
                ctx.fillStyle = '#3a7a28';
                ctx.fillRect(13, 8, 6, 14);
                // Leaves
                ctx.fillStyle = '#4a9a38';
                ctx.fillRect(8, 12, 8, 4);
                ctx.fillRect(16, 8, 8, 4);
                ctx.fillRect(10, 18, 6, 3);
                // Bud
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(16, 8, 4, 0, Math.PI * 2);
                ctx.fill();
                // Glow
                ctx.fillStyle = lightColor + '40';
                ctx.beginPath();
                ctx.arc(16, 8, 7, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'flower': {
                // Flowering plant
                ctx.fillStyle = '#3a7a28';
                ctx.fillRect(14, 10, 4, 12);
                // Stems
                ctx.fillStyle = '#4a8a30';
                ctx.fillRect(18, 14, 2, 8);
                ctx.fillRect(12, 16, 2, 6);
                // Flower petals
                const petalColor = lightColor;
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    const px = 16 + Math.cos(angle) * 5;
                    const py = 8 + Math.sin(angle) * 5;
                    ctx.fillStyle = petalColor;
                    ctx.beginPath();
                    ctx.arc(px, py, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Center
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(16, 8, 3, 0, Math.PI * 2);
                ctx.fill();
                // Leaves on stem
                ctx.fillStyle = '#5aaa40';
                ctx.fillRect(18, 18, 6, 3);
                ctx.fillRect(8, 20, 6, 3);
                // Glow
                ctx.fillStyle = lightColor + '20';
                ctx.beginPath();
                ctx.arc(16, 8, 12, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'fruit': {
                // Plant with ripe fruit
                ctx.fillStyle = '#3a6a20';
                ctx.fillRect(14, 12, 4, 10);
                ctx.fillRect(18, 16, 2, 6);
                ctx.fillRect(12, 18, 2, 4);
                // Leaves
                ctx.fillStyle = '#4a8a30';
                ctx.fillRect(18, 14, 6, 3);
                ctx.fillRect(8, 16, 6, 3);
                // Fruit
                const fruitColor = emotion ? emotion.fruitColor : '#ff8844';
                ctx.fillStyle = fruitColor;
                ctx.beginPath();
                ctx.arc(16, 8, 5, 0, Math.PI * 2);
                ctx.fill();
                // Fruit highlight
                ctx.fillStyle = '#ffffff40';
                ctx.beginPath();
                ctx.arc(14, 6, 2, 0, Math.PI * 2);
                ctx.fill();
                // Glow
                ctx.fillStyle = fruitColor + '30';
                ctx.beginPath();
                ctx.arc(16, 8, 12, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
        }
        
        return canvas;
    }

    // ===== SEED ITEM ICON =====
    _createSeedSprite(emotionId) {
        const canvas = this._createCanvas(24);
        const ctx = this._getCtx(canvas);
        const emotion = Object.values(EmotionTypes).find(e => e.id === emotionId);
        const color = emotion ? emotion.color : '#88cc44';
        
        // Seed shape
        ctx.fillStyle = '#3a2a1a';
        ctx.beginPath();
        ctx.ellipse(12, 14, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Emotion glow
        ctx.fillStyle = color + '60';
        ctx.beginPath();
        ctx.ellipse(12, 14, 7, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Center highlight
        ctx.fillStyle = color + '80';
        ctx.beginPath();
        ctx.ellipse(11, 13, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Small sparkle
        ctx.fillStyle = '#ffffff80';
        this._setPixel(ctx, 14, 10, '#ffffff80');
        this._setPixel(ctx, 15, 11, '#ffffff80');
        
        return canvas;
    }

    // ===== TREE =====
    _createTreeSprite() {
        const canvas = this._createCanvas(48);
        const ctx = this._getCtx(canvas);
        
        // Trunk
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(20, 24, 8, 20);
        
        // Branches
        ctx.fillStyle = '#4a2a0a';
        ctx.fillRect(14, 28, 8, 3);
        ctx.fillRect(26, 32, 8, 3);
        
        // Foliage (layered circles)
        const foliageColors = ['#3a7a28', '#4a8a38', '#5a9a48'];
        for (let layer = 0; layer < 3; layer++) {
            ctx.fillStyle = foliageColors[layer];
            const radius = 14 - layer * 2;
            const cy = 14 - layer * 3;
            ctx.beginPath();
            ctx.arc(24, cy, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Small blossoms
        const blossomColor = '#e8a0d0';
        for (let i = 0; i < 5; i++) {
            const bx = 16 + Math.floor(Math.random() * 16);
            const by = 6 + Math.floor(Math.random() * 12);
            this._setPixel(ctx, bx, by, blossomColor);
            this._setPixel(ctx, bx+1, by, blossomColor);
        }
        
        return canvas;
    }

    // ===== ROCK =====
    _createRockSprite() {
        const canvas = this._createCanvas(32);
        const ctx = this._getCtx(canvas);
        
        ctx.fillStyle = '#7a7a7a';
        ctx.beginPath();
        ctx.ellipse(16, 20, 12, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.ellipse(14, 17, 6, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Shadow
        ctx.fillStyle = '#5a5a5a';
        ctx.beginPath();
        ctx.ellipse(18, 23, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Moss
        ctx.fillStyle = '#4a7a3a';
        for (let i = 0; i < 4; i++) {
            const mx = 10 + Math.floor(Math.random() * 14);
            const my = 18 + Math.floor(Math.random() * 6);
            this._setPixel(ctx, mx, my, '#4a7a3a');
        }
        
        return canvas;
    }

    // ===== BUILDING =====
    _createBuildingSprite(type = 'temple') {
        const canvas = this._createCanvas(64);
        const ctx = this._getCtx(canvas);
        
        if (type === 'temple') {
            // Taoist temple / meditation hall
            // Walls
            ctx.fillStyle = '#8a3a1a';
            ctx.fillRect(8, 24, 48, 36);
            
            // Roof (curved pagoda style)
            ctx.fillStyle = '#6a1a0a';
            ctx.beginPath();
            ctx.moveTo(2, 26);
            ctx.lineTo(32, 4);
            ctx.lineTo(62, 26);
            ctx.closePath();
            ctx.fill();
            
            // Roof tiles
            ctx.fillStyle = '#8a2a1a';
            for (let x = 8; x < 56; x += 8) {
                ctx.fillRect(x, 10, 4, 2);
            }
            
            // Door
            ctx.fillStyle = '#4a2a1a';
            ctx.fillRect(26, 36, 12, 24);
            
            // Door frame
            ctx.fillStyle = '#c8a96e';
            ctx.fillRect(24, 36, 2, 24);
            ctx.fillRect(38, 36, 2, 24);
            ctx.fillRect(24, 36, 16, 2);
            
            // Windows
            ctx.fillStyle = '#e8c88a';
            ctx.fillRect(14, 30, 8, 8);
            ctx.fillRect(42, 30, 8, 8);
            
            // Window frames
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(14, 30, 8, 1);
            ctx.fillRect(14, 30, 1, 8);
            ctx.fillRect(42, 30, 8, 1);
            ctx.fillRect(42, 30, 1, 8);
            
            // Pillars
            ctx.fillStyle = '#6a2a1a';
            ctx.fillRect(10, 24, 4, 36);
            ctx.fillRect(50, 24, 4, 36);
            
            // Lanterns
            ctx.fillStyle = '#e04040';
            ctx.fillRect(6, 14, 4, 6);
            ctx.fillRect(54, 14, 4, 6);
            ctx.fillStyle = '#ff6060';
            this._setPixel(ctx, 8, 16, '#ff6060');
            this._setPixel(ctx, 56, 16, '#ff6060');
            
            // Steps
            ctx.fillStyle = '#7a6a4a';
            ctx.fillRect(22, 56, 20, 4);
        }
        
        return canvas;
    }

    // ===== NPC =====
    _createNPCSprite(type = 'sage') {
        const canvas = this._createCanvas(32);
        const ctx = this._getCtx(canvas);
        
        const robeColor = type === 'sage' ? '#3a5a7a' : 
                         type === 'merchant' ? '#7a5a3a' : 
                         type === 'disciple' ? '#5a6a4a' : '#5a4a6a';
        
        // Body
        for (let y = 10; y < 28; y++) {
            for (let x = 10; x < 22; x++) {
                if (y < 14) ctx.fillStyle = '#f0c8a0';
                else if (y < 18) ctx.fillStyle = robeColor;
                else if (y < 24) ctx.fillStyle = robeColor;
                else ctx.fillStyle = '#3a2a1a';
                
                if (y >= 10 && y < 14 && x >= 12 && x < 20) ctx.fillStyle = '#f0c8a0';
                if (y >= 10 && y < 14 && (x < 12 || x >= 20)) continue;
                
                ctx.fillRect(x, y, 1, 1);
            }
        }
        
        // Head
        ctx.fillStyle = '#f0c8a0';
        ctx.fillRect(12, 10, 8, 4);
        
        // Hair
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(11, 8, 10, 3);
        
        if (type === 'sage') {
            // Beard
            ctx.fillStyle = '#6a5a4a';
            ctx.fillRect(14, 14, 4, 4);
            // Sage hat / crown
            ctx.fillStyle = '#4a3a2a';
            ctx.fillRect(12, 5, 8, 4);
            ctx.fillRect(10, 7, 12, 2);
        }
        
        // Eyes
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(13, 11, 2, 1);
        ctx.fillRect(17, 11, 2, 1);
        
        // Robe detail - sash
        ctx.fillStyle = '#c8a96e';
        ctx.fillRect(14, 18, 4, 2);
        
        return canvas;
    }

    // ===== TOOL SPRITE =====
    _createToolSprite(type = 'watering_can') {
        const canvas = this._createCanvas(24);
        const ctx = this._getCtx(canvas);
        
        if (type === 'watering_can') {
            // Body
            ctx.fillStyle = '#6a8a4a';
            ctx.fillRect(6, 8, 12, 10);
            
            // Handle
            ctx.fillStyle = '#4a6a2a';
            ctx.fillRect(4, 6, 4, 4);
            ctx.fillRect(4, 14, 4, 4);
            ctx.fillRect(2, 8, 4, 8);
            
            // Spout
            ctx.fillStyle = '#5a7a3a';
            ctx.fillRect(16, 6, 6, 3);
            ctx.fillRect(18, 4, 4, 4);
            
            // Water drops
            ctx.fillStyle = '#6a9aff';
            this._setPixel(ctx, 20, 2, '#6a9aff');
            this._setPixel(ctx, 21, 3, '#6a9aff');
            this._setPixel(ctx, 22, 4, '#6a9aff');
            
        } else if (type === 'spade') {
            // Handle
            ctx.fillStyle = '#6a4a2a';
            ctx.fillRect(11, 0, 3, 14);
            // Blade
            ctx.fillStyle = '#8a8a8a';
            ctx.fillRect(8, 14, 8, 8);
            ctx.fillRect(9, 12, 6, 4);
        }
        
        return canvas;
    }

    // ===== GLOW EFFECT =====
    _createGlowSprite(color) {
        const canvas = this._createCanvas(48);
        const ctx = this._getCtx(canvas);
        
        const gradient = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
        gradient.addColorStop(0, color + '60');
        gradient.addColorStop(0.5, color + '20');
        gradient.addColorStop(1, color + '00');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 48, 48);
        
        return canvas;
    }

    // ===== EMOTION ORB =====
    _createEmotionOrb(emotionId) {
        const canvas = this._createCanvas(16);
        const ctx = this._getCtx(canvas);
        const emotion = Object.values(EmotionTypes).find(e => e.id === emotionId);
        const color = emotion ? emotion.color : '#ffffff';
        
        // Glow
        ctx.fillStyle = color + '40';
        ctx.beginPath();
        ctx.arc(8, 8, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(8, 8, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = '#ffffff60';
        ctx.beginPath();
        ctx.arc(6, 6, 2, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }

    // ===== HEART =====
    _createHeartSprite() {
        const canvas = this._createCanvas(16);
        const ctx = this._getCtx(canvas);
        
        ctx.fillStyle = '#e04060';
        // Simple heart using circles and triangle
        ctx.beginPath();
        ctx.arc(5, 6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(11, 6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(2, 6, 12, 5);
        // Point
        ctx.beginPath();
        ctx.moveTo(2, 8);
        ctx.lineTo(8, 14);
        ctx.lineTo(14, 8);
        ctx.fill();
        
        return canvas;
    }

    // ===== SPARKLE =====
    _createSparkleSprite() {
        const canvas = this._createCanvas(12);
        const ctx = this._getCtx(canvas);
        
        ctx.fillStyle = '#ffffc0';
        // 4-point star
        const cx = 6, cy = 6;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const dx = Math.cos(angle) * 4;
            const dy = Math.sin(angle) * 4;
            ctx.fillRect(cx + dx - 1, cy + dy - 1, 2, 2);
        }
        ctx.fillRect(cx - 1, cy - 1, 2, 2);
        
        return canvas;
    }

    // ===== FRUIT SPRITE =====
    _createFruitSprite(emotionId) {
        const canvas = this._createCanvas(20);
        const ctx = this._getCtx(canvas);
        const emotion = Object.values(EmotionTypes).find(e => e.id === emotionId);
        const color = emotion ? emotion.fruitColor : '#ff8844';
        
        // Fruit body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(10, 11, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = '#ffffff40';
        ctx.beginPath();
        ctx.arc(8, 8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Stem
        ctx.fillStyle = '#4a6a2a';
        ctx.fillRect(9, 2, 2, 4);
        
        // Leaf
        ctx.fillStyle = '#5a8a3a';
        ctx.fillRect(11, 3, 4, 2);
        
        // Glow
        ctx.fillStyle = color + '30';
        ctx.beginPath();
        ctx.arc(10, 11, 10, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }

    // ===== INTERACTION ICONS =====
    _createInteractIcon(type) {
        const canvas = this._createCanvas(24);
        const ctx = this._getCtx(canvas);
        
        if (type === 'talk') {
            // Speech bubble icon
            ctx.fillStyle = '#c8a96e';
            ctx.fillRect(4, 8, 16, 10);
            ctx.fillRect(8, 6, 8, 2);
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(7, 10, 4, 3);
            ctx.fillRect(13, 10, 4, 3);
            ctx.fillRect(10, 14, 4, 2);
        } else if (type === 'water') {
            // Water drop icon
            ctx.fillStyle = '#4a8aff';
            ctx.beginPath();
            ctx.moveTo(12, 4);
            ctx.lineTo(18, 16);
            ctx.lineTo(6, 16);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#6abaff';
            ctx.fillRect(10, 10, 4, 5);
        } else if (type === 'plant') {
            // Seed/plant icon
            ctx.fillStyle = '#88cc44';
            ctx.fillRect(11, 12, 2, 8);
            ctx.fillStyle = '#66aa22';
            ctx.fillRect(7, 8, 10, 6);
        } else if (type === 'harvest') {
            // Harvest icon
            ctx.fillStyle = '#ff8844';
            ctx.beginPath();
            ctx.arc(12, 10, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#cc6622';
            ctx.fillRect(10, 16, 4, 6);
        } else if (type === 'journal') {
            // Book icon
            ctx.fillStyle = '#e8c88a';
            ctx.fillRect(5, 6, 14, 14);
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(7, 8, 10, 10);
            ctx.fillStyle = '#e8c88a';
            ctx.fillRect(9, 11, 6, 1);
            ctx.fillRect(9, 13, 4, 1);
        } else {
            // Default: exclamation
            ctx.fillStyle = '#e8c88a';
            ctx.fillRect(11, 5, 2, 8);
            ctx.fillRect(11, 15, 2, 2);
        }
        
        return canvas;
    }

    _createHighlightSprite() {
        const canvas = this._createCanvas(40);
        const ctx = this._getCtx(canvas);
        
        // Pulsing circle highlight
        ctx.strokeStyle = 'rgba(232, 200, 138, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(20, 20, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Corner brackets
        const c = '#e8c88a';
        ctx.strokeStyle = c;
        ctx.lineWidth = 1;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(6, 10);
        ctx.lineTo(6, 6);
        ctx.lineTo(10, 6);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(30, 6);
        ctx.lineTo(34, 6);
        ctx.lineTo(34, 10);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(6, 30);
        ctx.lineTo(6, 34);
        ctx.lineTo(10, 34);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(30, 34);
        ctx.lineTo(34, 34);
        ctx.lineTo(34, 30);
        ctx.stroke();
        
        return canvas;
    }

    // ===== PLACEHOLDER =====
    _createPlaceholder(name) {
        const canvas = this._createCanvas(32);
        const ctx = this._getCtx(canvas);
        
        // Checkerboard pattern
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillRect(16, 16, 16, 16);
        ctx.fillStyle = '#000000';
        ctx.fillRect(16, 0, 16, 16);
        ctx.fillRect(0, 16, 16, 16);
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.fillText(name.substring(0, 4), 4, 20);
        
        return canvas;
    }
}
