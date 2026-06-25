/**
 * Time System
 * Manages day/night cycle, seasons, and time-based events.
 */

export class TimeSystem {
    constructor() {
        this.dayLength = 120000;    // 2 minutes per day (ms)
        this.seasonLength = 10;     // 10 days per season
        this.day = 1;
        this.season = 0;            // 0-3: Spring, Summer, Autumn, Winter
        this.year = 1;
        this.timeOfDay = 0;         // 0-1 (0 = dawn, 0.5 = noon, 1 = night)
        this.dayPhase = 'dawn';
        this.elapsed = 0;
        this.paused = false;
        this.speedMultiplier = 1;
        this.mvpLightingDisabled = true;
        
        this.seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];
        this.phases = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night'];
        
        // Sun/Moon position for lighting
        this.sunAngle = 0;
        this.moonAngle = Math.PI;
    }

    /**
     * Update the time
     * @param {number} deltaTime - ms since last update
     */
    update(deltaTime) {
        if (this.paused) return;
        
        this.elapsed += deltaTime * this.speedMultiplier;
        this.timeOfDay = (this.elapsed % this.dayLength) / this.dayLength;
        
        // Update phase
        this.dayPhase = this._getPhase(this.timeOfDay);
        
        // Sun angle (0 = midnight, PI/2 = noon)
        this.sunAngle = this.timeOfDay * Math.PI * 2;
        
        // Check for day rollover
        const previousDay = this.day;
        this.day = Math.floor(this.elapsed / this.dayLength) + 1;
        
        if (this.day !== previousDay) {
            this._onNewDay();
        }
    }

    /**
     * Get the current phase name based on time of day
     */
    _getPhase(t) {
        if (t < 0.083) return 'dawn';         // 0-8.3%
        if (t < 0.25) return 'morning';        // 8.3-25%
        if (t < 0.417) return 'noon';          // 25-41.7%
        if (t < 0.583) return 'afternoon';     // 41.7-58.3%
        if (t < 0.75) return 'evening';        // 58.3-75%
        return 'night';                         // 75-100%
    }

    /**
     * Called when a new day begins
     */
    _onNewDay() {
        // Season change
        if ((this.day - 1) % this.seasonLength === 0 && this.day > 1) {
            this.season = (this.season + 1) % 4;
            if (this.season === 0) {
                this.year++;
            }
        }
    }

    /**
     * Get current season name
     */
    getSeasonName() {
        return this.seasons[this.season];
    }

    /**
     * Get current time display string
     */
    getTimeDisplay() {
        const hour = Math.floor(this.timeOfDay * 24);
        const minute = Math.floor(((this.timeOfDay * 24) - hour) * 60);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
    }

    /**
     * Get ambient light level (0-1, 0=dark, 1=bright)
     */
    getAmbientLight() {
        if (this.mvpLightingDisabled) return 1;

        // Dawn/dusk are dimmer, noon is brightest
        const t = this.timeOfDay;
        if (t < 0.083) return 0.3 + (t / 0.083) * 0.7;           // Dawn rising
        if (t < 0.417) return 1.0;                                  // Day
        if (t < 0.583) return 1.0 - ((t - 0.417) / 0.166) * 0.5;  // Afternoon dimming
        if (t < 0.75) return 0.5 - ((t - 0.583) / 0.167) * 0.3;   // Evening
        return 0.2 - ((t - 0.75) / 0.25) * 0.15;                    // Night
    }

    /**
     * Get sky color
     */
    getSkyColor() {
        if (this.mvpLightingDisabled) return '#8fd0ff';

        const light = this.getAmbientLight();
        const seasonHue = this.season * 30;
        
        if (light > 0.8) {
            return `hsl(${210 + seasonHue}, 50%, ${60 + light * 20}%)`;
        } else if (light > 0.5) {
            return `hsl(${230 + seasonHue}, 40%, ${40 + light * 20}%)`;
        } else if (light > 0.3) {
            return `hsl(${250 + seasonHue}, 30%, ${20 + light * 30}%)`;
        } else {
            return `hsl(${260 + seasonHue}, 20%, ${10 + light * 20}%)`;
        }
    }

    /**
     * Is it currently nighttime?
     */
    isNight() {
        if (this.mvpLightingDisabled) return false;
        return this.dayPhase === 'night';
    }

    /**
     * Is it daytime?
     */
    isDaytime() {
        return !this.isNight() && this.dayPhase !== 'evening' && this.dayPhase !== 'dawn';
    }

    /**
     * Get formatted time info for display
     */
    getTimeInfo() {
        return {
            day: this.day,
            season: this.getSeasonName(),
            year: this.year,
            time: this.getTimeDisplay(),
            phase: this.dayPhase,
            light: this.getAmbientLight(),
            isNight: this.isNight(),
            seasonIndex: this.season
        };
    }

    /**
     * Set time of day directly (for debug or meditation skip)
     */
    setTimeOfDay(value) {
        this.timeOfDay = Math.max(0, Math.min(1, value));
        this.elapsed = this.timeOfDay * this.dayLength;
        this.dayPhase = this._getPhase(this.timeOfDay);
    }
}
