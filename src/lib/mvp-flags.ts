export type QuestGeneratorMode = 'placeholder' | 'full'
export type VibeulonLedgerMode = 'simple-balance' | 'event-ledger'

function normalize(value: string | undefined) {
    return (value || '').trim().toLowerCase()
}

export function getQuestGeneratorMode(): QuestGeneratorMode {
    return normalize(process.env.QUEST_GENERATOR_MODE) === 'full'
        ? 'full'
        : 'placeholder'
}

export function isAuthBypassEmailVerificationEnabled(): boolean {
    return process.env.NODE_ENV !== 'production'
        && normalize(process.env.AUTH_BYPASS_EMAIL_VERIFICATION) === 'true'
}

export function getVibeulonLedgerMode(): VibeulonLedgerMode {
    return normalize(process.env.VIBEULON_LEDGER_MODE) === 'event-ledger'
        ? 'event-ledger'
        : 'simple-balance'
}
