/**
 * Camera System
 * Handles viewport scrolling, following the player, and screen shake effects.
 */

export class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.targetX = 0;
        this.targetY = 0;
        this.smoothing = 0.1;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;
        this.bounds = null; // { minX, minY, maxX, maxY }
        this.zoom = 2;
    }
    
    /**
     * Set camera bounds (map boundaries)
     */
    setBounds(minX, minY, maxX, maxY) {
        this.bounds = { minX, minY, maxX, maxY };
    }
    
    /**
     * Set the target for the camera to follow
     */
    setTarget(x, y) {
        this.targetX = x - this.width / 2;
        this.targetY = y - this.height / 2;
    }
    
    /**
     * Trigger a screen shake
     * @param {number} intensity - Initial shake intensity
     */
    shake(intensity = 5) {
        this.shakeIntensity = intensity;
    }
    
    /**
     * Update camera position with smoothing
     */
    update(deltaTime) {
        // Smooth follow
        this.x += (this.targetX - this.x) * this.smoothing;
        this.y += (this.targetY - this.y) * this.smoothing;
        
        // Apply bounds
        if (this.bounds) {
            this.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.x));
            this.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.y));
        }
        
        // Shake effect
        if (this.shakeIntensity > 0.5) {
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeIntensity *= this.shakeDecay;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
            this.shakeIntensity = 0;
        }
    }
    
    /**
     * Get the camera offset for rendering
     */
    getOffset() {
        return {
            x: Math.round(this.x) + this.shakeX,
            y: Math.round(this.y) + this.shakeY
        };
    }
    
    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }
    
    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }
    
    /**
     * Check if a rectangle is visible on screen
     */
    isVisible(x, y, w, h) {
        return x + w > this.x && 
               x < this.x + this.width && 
               y + h > this.y && 
               y < this.y + this.height;
    }
}
