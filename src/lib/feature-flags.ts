/**
 * MVP Feature Flags
 * 
 * All flags are env-based for simplicity. No DB dependency.
 * Can be overridden in .env or at deploy time.
 */

export const MVP_FLAGS = {
    /** How many vibeulons to seed for new signups (default: 3) */
    get SEED_VIBEULONS(): number {
        return parseInt(process.env.MVP_SEED_VIBEULONS || '3', 10)
    },

    /** Quest generator mode: "placeholder" (templates only) or "full" (AI generation) */
    get QUEST_GENERATOR_MODE(): 'placeholder' | 'full' {
        const mode = process.env.QUEST_GENERATOR_MODE
        return mode === 'full' ? 'full' : 'placeholder'
    },

    /** Whether MVP mode is active (enables simplified flows) */
    get MVP_MODE(): boolean {
        return process.env.MVP_MODE !== 'false' // default true
    },

    /** Vibeulon ledger mode: "simple-balance" (token count) or "event-ledger" (full events) */
    get VIBEULON_LEDGER_MODE(): 'simple-balance' | 'event-ledger' {
        const mode = process.env.VIBEULON_LEDGER_MODE
        return mode === 'event-ledger' ? 'event-ledger' : 'simple-balance'
    },

    /** Whether to bypass email verification (for dev/testing) */
    get AUTH_BYPASS_EMAIL_VERIFICATION(): boolean {
        return process.env.AUTH_BYPASS_EMAIL_VERIFICATION === 'true' || true // Always true for MVP
    },
} as const

export function logFlags() {
    console.log('[MVP FLAGS]', {
        SEED_VIBEULONS: MVP_FLAGS.SEED_VIBEULONS,
        QUEST_GENERATOR_MODE: MVP_FLAGS.QUEST_GENERATOR_MODE,
        MVP_MODE: MVP_FLAGS.MVP_MODE,
        VIBEULON_LEDGER_MODE: MVP_FLAGS.VIBEULON_LEDGER_MODE,
        AUTH_BYPASS_EMAIL_VERIFICATION: MVP_FLAGS.AUTH_BYPASS_EMAIL_VERIFICATION,
    })
}
