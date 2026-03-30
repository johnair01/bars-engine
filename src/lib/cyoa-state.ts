/**
 * CYOA Data Contracts and State definitions based on the
 * CYOA blueprint -> BAR metabolism (CBB) specification.
 */

export interface AuthContext {
    isAuthenticated: boolean
    playerId?: string
}

export interface HexagramBinding {
    hexagramId: string
    /** Product-defined: lines, changing lines, etc. */
    payload: Record<string, unknown>
}

export interface CyoaRunState {
    runId: string
    nodeId: string
    hexagram?: HexagramBinding | null
    /** Append-only artifact ledger for BARs generated during this cycle */
    artifactLedger: Array<{
        kind: 'bar' | 'quest'
        id: string
        sourceNodeId: string
        blueprintKey?: string
        metadata?: {
            type: string
            phase: string
        }
        createdAt: string
    }>
}

export interface ChoiceDescriptor {
    id: string
    blueprintKey: string
    /** Player-facing — in-voice */
    buttonLabel: string
    targetNodeId: string
    /** Optional longer line for accessibility / secondary UI */
    voiceLine?: string
}

export interface RenderResult {
    body: string // or MDX slots
    choices: ChoiceDescriptor[]
}
