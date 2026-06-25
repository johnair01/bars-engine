/**
 * Player Entity
 * The cultivator character that moves around the world, interacts, and performs actions.
 * Supports collision with world objects and NPCs.
 */

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 28;
        this.height = 28;
        this.speed = 120;          // pixels per second
        this.direction = 'down';
        this.facing = 'south';
        this.isMoving = false;
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 150; // ms per frame
        
        // Interaction
        this.interactionRange = 42;
        this.currentAction = null; // 'watering', 'planting', 'meditating', 'harvesting'
        this.actionTimer = 0;
        this.actionDuration = 0;
        
        // Movement trail
        this.trail = [];
        this.trailTimer = 0;
        
        // Collision
        this.collisionPadding = 2;
        
        // Tools
        this.tools = {
            wateringCan: {
                owned: false,     // Starts false — Master Wu gives it
                water: 0,
                maxWater: 100
            }
        };
    }

    /**
     * Check if player owns a specific tool
     */
    hasTool(toolId) {
        const tool = this.tools[toolId];
        return tool && tool.owned;
    }

    /**
     * Give a tool to the player
     */
    giveTool(toolId) {
        if (this.tools[toolId]) {
            this.tools[toolId].owned = true;
            if (toolId === 'wateringCan') {
                this.tools[toolId].water = 50; // Half full when gifted
            }
        }
    }

    /**
     * Get a tool's data
     */
    getTool(toolId) {
        return this.tools[toolId] || null;
    }

    /**
     * Update player state
     * @param {number} deltaTime
     * @param {{x: number, y: number}} movement - Direction vector (-1 to 1)
     * @param {Array<{x: number, y: number, w: number, h: number}>} obstacles - Solid objects
     */
    update(deltaTime, movement, obstacles = []) {
        // Handle action timer
        if (this.currentAction) {
            this.actionTimer -= deltaTime;
            const action = this.currentAction;
            if (this.actionTimer <= 0) {
                this.currentAction = null;
            }
            // 'meditating' is passive — doesn't block movement
            // Active actions like 'watering' block movement
            if (action !== 'meditating') {
                return;
            }
        }

        const dt = deltaTime / 1000;
        const moveX = movement.x;
        const moveY = movement.y;
        
        this.isMoving = (moveX !== 0 || moveY !== 0);
        
        if (this.isMoving) {
            // Update direction
            if (Math.abs(moveX) > Math.abs(moveY)) {
                this.direction = moveX > 0 ? 'right' : 'left';
                this.facing = moveX > 0 ? 'east' : 'west';
            } else {
                this.direction = moveY > 0 ? 'down' : 'up';
                this.facing = moveY > 0 ? 'south' : 'north';
            }
            
            // Calculate new position
            let newX = this.x + moveX * this.speed * dt;
            let newY = this.y + moveY * this.speed * dt;
            
            // Collision check - X axis
            const testXRect = {
                x: newX + this.collisionPadding,
                y: this.y + this.collisionPadding,
                w: this.width - this.collisionPadding * 2,
                h: this.height - this.collisionPadding * 2
            };
            
            let canMoveX = true;
            for (const obs of obstacles) {
                if (this._rectsOverlap(testXRect, obs)) {
                    canMoveX = false;
                    break;
                }
            }
            
            if (canMoveX) {
                this.x = newX;
            }
            
            // Collision check - Y axis
            const testYRect = {
                x: this.x + this.collisionPadding,
                y: newY + this.collisionPadding,
                w: this.width - this.collisionPadding * 2,
                h: this.height - this.collisionPadding * 2
            };
            
            let canMoveY = true;
            for (const obs of obstacles) {
                if (this._rectsOverlap(testYRect, obs)) {
                    canMoveY = false;
                    break;
                }
            }
            
            if (canMoveY) {
                this.y = newY;
            }
            
            // Keep within world bounds
            this.x = Math.max(0, Math.min(this.x, 1200 - this.width));
            this.y = Math.max(0, Math.min(this.y, 900 - this.height));
            
            // Animation
            this.animationTimer += deltaTime;
            if (this.animationTimer >= this.animationSpeed) {
                this.animationTimer = 0;
                this.animationFrame = (this.animationFrame + 1) % 4;
            }
            
            // Trail (qi footprints)
            this.trailTimer += deltaTime;
            if (this.trailTimer > 200) {
                this.trailTimer = 0;
                this.trail.push({
                    x: this.x,
                    y: this.y,
                    life: 1
                });
                if (this.trail.length > 8) {
                    this.trail.shift();
                }
            }
        } else {
            this.animationFrame = 0;
            this.animationTimer = 0;
        }
        
        // Decay trail
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].life -= dt * 2;
            if (this.trail[i].life <= 0) {
                this.trail.splice(i, 1);
            }
        }
    }

    /**
     * AABB collision test
     */
    _rectsOverlap(a, b) {
        return a.x < b.x + b.w &&
               a.x + a.w > b.x &&
               a.y < b.y + b.h &&
               a.y + a.h > b.y;
    }

    /**
     * Start an action
     */
    startAction(action, duration = 500) {
        this.currentAction = action;
        this.actionTimer = duration;
        this.actionDuration = duration;
    }

    /**
     * Is the player currently performing an action?
     */
    isActing() {
        return this.currentAction !== null;
    }

    /**
     * Get current action progress (0-1)
     */
    getActionProgress() {
        if (!this.currentAction) return 0;
        return this.actionTimer / this.actionDuration;
    }

    /**
     * Get the player's facing direction vector
     */
    getFacingVector() {
        switch (this.facing) {
            case 'north': return { x: 0, y: -1 };
            case 'south': return { x: 0, y: 1 };
            case 'east': return { x: 1, y: 0 };
            case 'west': return { x: -1, y: 0 };
            default: return { x: 0, y: 1 };
        }
    }

    /**
     * Get the player's center position
     */
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    /**
     * Get render state
     */
    getRenderState() {
        return {
            x: Math.round(this.x),
            y: Math.round(this.y),
            direction: this.direction,
            isMoving: this.isMoving,
            animationFrame: this.animationFrame,
            trail: this.trail,
            action: this.currentAction,
            actionProgress: this.getActionProgress()
        };
    }
}
