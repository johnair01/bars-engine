/**
 * CanvasScaler — Integer scaling for crisp pixel rendering.
 * 
 * Renders the game at a lower internal resolution and upscales
 * with nearest-neighbor interpolation, giving a classic 16-bit
 * pixel look at any display size.
 * 
 * Usage:
 *   const scaler = new CanvasScaler(displayCanvas, 480, 320);
 *   // Get the internal canvas to render into:
 *   const internalCtx = scaler.getContext();
 *   // After rendering, call this to upscale to display:
 *   scaler.present();
 */

export class CanvasScaler {
    /**
     * @param {HTMLCanvasElement} displayCanvas - The visible canvas element
     * @param {number} internalW - Internal render width (e.g. 480)
     * @param {number} internalH - Internal render height (e.g. 320)
     */
    constructor(displayCanvas, internalW = 480, internalH = 320) {
        this.displayCanvas = displayCanvas;
        this.internalW = internalW;
        this.internalH = internalH;
        
        // Create internal render canvas
        this.internalCanvas = document.createElement('canvas');
        this.internalCanvas.width = internalW;
        this.internalCanvas.height = internalH;
        this.ctx = this.internalCanvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        // Track scale factor
        this.scaleX = 1;
        this.scaleY = 1;
        
        // Set display canvas to internal size initially
        // (will be scaled on first present())
        displayCanvas.width = internalW;
        displayCanvas.height = internalH;
        
        // Bind resize handler
        this._onResize = this._handleResize.bind(this);
        window.addEventListener('resize', this._onResize);
        
        // Initial scale
        this._updateScale();
    }

    /**
     * Get the internal rendering context
     */
    getContext() {
        return this.ctx;
    }

    /**
     * Get the internal canvas dimensions
     */
    getInternalSize() {
        return { w: this.internalW, h: this.internalH };
    }

    /**
     * Present the internal buffer to the display canvas
     * Call this after all rendering is done
     */
    present() {
        const dCtx = this.displayCanvas.getContext('2d');
        dCtx.imageSmoothingEnabled = false;
        dCtx.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);
        
        // Draw internal canvas scaled up to fill display canvas
        dCtx.drawImage(
            this.internalCanvas,
            0, 0, this.internalW, this.internalH,
            0, 0, this.displayCanvas.width, this.displayCanvas.height
        );
    }

    /**
     * Convert screen coordinates to internal game coordinates
     */
    screenToGame(screenX, screenY) {
        return {
            x: (screenX / this.displayCanvas.width) * this.internalW,
            y: (screenY / this.displayCanvas.height) * this.internalH
        };
    }

    /**
     * Convert game coordinates to screen coordinates
     */
    gameToScreen(gameX, gameY) {
        return {
            x: (gameX / this.internalW) * this.displayCanvas.width,
            y: (gameY / this.internalH) * this.displayCanvas.height
        };
    }

    /**
     * Update scale factor based on display size
     */
    _updateScale() {
        const rect = this.displayCanvas.getBoundingClientRect();
        const displayW = Math.floor(rect.width) || 960;
        const displayH = Math.floor(rect.height) || 640;
        
        // Calculate integer scale factors
        this.scaleX = displayW / this.internalW;
        this.scaleY = displayH / this.internalH;
        
        // Set display canvas pixel dimensions
        this.displayCanvas.width = displayW;
        this.displayCanvas.height = displayH;
    }

    /**
     * Handle window resize
     */
    _handleResize() {
        this._updateScale();
    }

    /**
     * Clean up
     */
    destroy() {
        window.removeEventListener('resize', this._onResize);
    }
}
