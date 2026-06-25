/**
 * AssetLoader — Sprite loading from PNG files with procedural fallback.
 * API-compatible with AssetGenerator (same getSprite() interface).
 * 
 * Priority:
 *   1. Loaded PNG from assets/sprites/{name}.png
 *   2. AssetGenerator procedural fallback
 * 
 * Place PNG files in assets/sprites/ (e.g. assets/sprites/player.png)
 * They are loaded once and cached.
 */

export class AssetLoader {
    constructor(assetGenerator) {
        this.fallback = assetGenerator;
        this.pngCache = new Map();
        this.loading = new Map();   // Track in-flight loads
        this._loaded = false;
    }

    /**
     * Get a sprite by name — tries PNG first, falls back to procedural
     * @param {string} name - Sprite identifier
     * @returns {HTMLCanvasElement|HTMLImageElement} Sprite
     */
    getSprite(name, ...params) {
        const key = name + (params.length ? '_' + params.join('_') : '');
        
        // Check PNG cache for the exact key (e.g. 'player_down', 'crop_seed_anger')
        if (this.pngCache.has(key)) {
            return this.pngCache.get(key);
        }
        
        // Check for two-part key (e.g. 'crop_seed' for all emotions)
        if (params.length >= 2) {
            const twoPart = name + '_' + params[0];
            if (this.pngCache.has(twoPart)) {
                return this.pngCache.get(twoPart);
            }
        }
        
        // Check one-part key (e.g. 'player' for all directions)
        if (params.length >= 1) {
            const onePart = name + '_' + params[0];
            if (this.pngCache.has(onePart)) {
                return this.pngCache.get(onePart);
            }
        }
        
        // Check base name (no params — e.g. 'tree', 'rock')
        if (this.pngCache.has(name)) {
            return this.pngCache.get(name);
        }
        
        // Fall back to procedural generation
        return this.fallback.getSprite(name, ...params);
    }

    /**
     * Register a loaded PNG sprite
     */
    registerSprite(name, image) {
        this.pngCache.set(name, image);
    }

    /**
     * Load all PNG sprites from assets/sprites/
     * Returns a promise that resolves when all are loaded (or timeout)
     */
    async loadAll() {
        if (this._loaded) return;
        
        // Build manifest — base names + emotion variants
        const emotions = ['anger', 'sadness', 'fear', 'joy', 'neutral'];
        const stages = ['seed', 'sprout', 'bud', 'flower', 'fruit'];
        
        const manifest = [
            // Player directions
            'player_down', 'player_up', 'player_left', 'player_right',
            // NPCs
            'npc_sage', 'npc_merchant', 'npc_disciple',
            // Tiles
            'tile_grass', 'tile_dirt', 'tile_water', 'tile_path', 'tile_soil', 'tile_fence',
            // World objects
            'tree', 'rock', 'building_temple', 'building_house',
            // Tools
            'watering_can',
            // UI / effects
            'interact_talk', 'interact_water', 'interact_plant', 'interact_harvest',
            'meditation_glow', 'heart', 'sparkle', 'highlight',
            // Emotion orbs (anger, sadness, fear, joy, neutral)
            ...emotions.map(e => `emotion_orb_${e}`),
            // Seed items
            ...emotions.map(e => `seed_item_${e}`),
            // Fruits
            ...emotions.map(e => `fruit_${e}`),
            // Crop stages × emotions (5×5 = 25 sprites)
            ...stages.flatMap(s => emotions.map(e => `crop_${s}_${e}`))
        ];
        
        const promises = manifest.map(name => this._tryLoad(name));
        await Promise.allSettled(promises);
        this._loaded = true;
    }

    /**
     * Try loading a single PNG sprite
     */
    _tryLoad(name) {
        return new Promise(resolve => {
            const img = new Image();
            let settled = false;
            
            const finish = () => {
                if (settled) return;
                settled = true;
                if (img.complete && img.naturalWidth > 0) {
                    this.pngCache.set(name, img);
                }
                resolve();
            };
            
            img.onload = finish;
            img.onerror = () => {
                // PNG not found — will use procedural fallback, that's fine
                resolve();
            };
            
            // Support both flat and subdirectory paths
            const path = `assets/sprites/${name}.png`;
            img.src = path;
            
            // Safety timeout — don't hang loading
            setTimeout(finish, 3000);
        });
    }

    /**
     * Draw a sprite correctly scaled
     */
    drawSprite(ctx, sprite, x, y, width, height) {
        if (!sprite) return;
        
        if (sprite instanceof HTMLImageElement) {
            // PNG sprite — may be different size than target, scale appropriately
            ctx.drawImage(sprite, x, y, width || sprite.width, height || sprite.height);
        } else if (sprite instanceof HTMLCanvasElement) {
            ctx.drawImage(sprite, x, y, width || sprite.width, height || sprite.height);
        }
    }

    /**
     * Check if a specific sprite is loaded from PNG
     */
    hasPNG(name) {
        const img = this.pngCache.get(name);
        return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
    }

    /**
     * Get the sprite type for rendering decisions
     */
    getSpriteBase(name) {
        if (this.hasPNG(name)) return 'png';
        return 'procedural';
    }
}
