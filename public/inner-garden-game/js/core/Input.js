/**
 * Input Handler - Keyboard and Mouse input management
 * Provides a clean API for checking input state across the game.
 */

export class Input {
    constructor() {
        this.keys = {};
        this.keysJustPressed = {};
        this._lastKeyTime = {};
        this.mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            left: false,
            right: false,
            leftJustPressed: false,
            rightJustPressed: false,
        };
        
        this._boundKeyDown = this._onKeyDown.bind(this);
        this._boundKeyUp = this._onKeyUp.bind(this);
        this._boundMouseMove = this._onMouseMove.bind(this);
        this._boundMouseDown = this._onMouseDown.bind(this);
        this._boundMouseUp = this._onMouseUp.bind(this);
        
        this._setupListeners();
    }
    
    _setupListeners() {
        window.addEventListener('keydown', this._boundKeyDown);
        window.addEventListener('keyup', this._boundKeyUp);
        window.addEventListener('mousemove', this._boundMouseMove);
        window.addEventListener('mousedown', this._boundMouseDown);
        window.addEventListener('mouseup', this._boundMouseUp);
        // Prevent context menu on right-click
        window.addEventListener('contextmenu', e => e.preventDefault());
    }
    
    _onKeyDown(e) {
        // Ignore browser key-repeat (held key auto-repeat events)
        if (e.repeat) return;
        
        if (!this.keys[e.key]) {
            this.keysJustPressed[e.key] = true;
        }
        this.keys[e.key] = true;
        // Prevent arrow key scrolling
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
    }
    
    _onKeyUp(e) {
        this.keys[e.key] = false;
        this._lastKeyTime[e.key] = 0;
    }

    pressVirtualKey(key) {
        if (!this.keys[key]) {
            this.keysJustPressed[key] = true;
        }
        this.keys[key] = true;
    }

    releaseVirtualKey(key) {
        this.keys[key] = false;
        this._lastKeyTime[key] = 0;
    }

    tapVirtualKey(key) {
        this.keysJustPressed[key] = true;
        this.keys[key] = true;
        requestAnimationFrame(() => {
            this.keys[key] = false;
        });
    }
    
    /**
     * Clear all held keys (call when transitioning game states)
     * Prevents ghost movement from stale key states
     */
    clearKeys() {
        this.keys = {};
        this.keysJustPressed = {};
    }
    
    _onMouseMove(e) {
        const canvas = document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
        this.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    }
    
    _onMouseDown(e) {
        if (e.button === 0) {
            this.mouse.left = true;
            this.mouse.leftJustPressed = true;
        }
        if (e.button === 2) {
            this.mouse.right = true;
            this.mouse.rightJustPressed = true;
        }
    }
    
    _onMouseUp(e) {
        if (e.button === 0) {
            this.mouse.left = false;
        }
        if (e.button === 2) {
            this.mouse.right = false;
        }
    }
    
    /**
     * Check if a key is currently held down
     */
    isKeyDown(key) {
        return !!this.keys[key];
    }
    
    /**
     * Check if a key was just pressed this frame
     */
    isKeyJustPressed(key) {
        return !!this.keysJustPressed[key];
    }
    
    /**
     * Get movement direction from WASD/Arrow keys
     * @returns {{x: number, y: number}} Normalized direction vector
     */
    getMovementDirection() {
        let dx = 0;
        let dy = 0;
        
        if (this.isKeyDown('w') || this.isKeyDown('W') || this.isKeyDown('ArrowUp')) dy -= 1;
        if (this.isKeyDown('s') || this.isKeyDown('S') || this.isKeyDown('ArrowDown')) dy += 1;
        if (this.isKeyDown('a') || this.isKeyDown('A') || this.isKeyDown('ArrowLeft')) dx -= 1;
        if (this.isKeyDown('d') || this.isKeyDown('D') || this.isKeyDown('ArrowRight')) dx += 1;
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }
        
        return { x: dx, y: dy };
    }
    
    /**
     * Get the mouse position in world coordinates
     * @param {object} camera - Camera instance with x, y
     * @returns {{x: number, y: number}}
     */
    getWorldMouse(camera) {
        return {
            x: this.mouse.x + camera.x,
            y: this.mouse.y + camera.y
        };
    }
    
    /**
     * Call at the end of each frame to clear just-pressed states
     */
    endFrame() {
        this.keysJustPressed = {};
        this.mouse.leftJustPressed = false;
        this.mouse.rightJustPressed = false;
    }
    
    /**
     * Clean up event listeners
     */
    destroy() {
        window.removeEventListener('keydown', this._boundKeyDown);
        window.removeEventListener('keyup', this._boundKeyUp);
        window.removeEventListener('mousemove', this._boundMouseMove);
        window.removeEventListener('mousedown', this._boundMouseDown);
        window.removeEventListener('mouseup', this._boundMouseUp);
    }
}
