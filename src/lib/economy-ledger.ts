import { db } from '@/lib/db'

export type LedgerEventType = 'MINT' | 'ATTUNE' | 'SPEND' | 'TRANSMUTE'

export class LedgerService {
    /**
     * Attune vibeulons from global reserve to a local instance balance.
     */
    static async attune(playerId: string, instanceId: string, amount: number) {
        if (amount <= 0) throw new Error('Attunement amount must be positive')

        return await db.$transaction(async (tx) => {
            // 1. Check global balance (vibulon tokens)
            const globalTokens = await tx.vibulon.findMany({
                where: { ownerId: playerId },
                take: amount
            })

            if (globalTokens.length < amount) {
                throw new Error('Insufficient global Vibeulon reserve')
            }

            // 2. Remove tokens from global (attunement consumes the global token to create local liquidity)
            // Or should we just change ownership? The spec says "global decreases, local increases".
            // We'll delete the tokens from the global set as they are now "attuned" to the instance.
            const tokenIds = globalTokens.map(t => t.id)
            await tx.vibulon.deleteMany({
                where: { id: { in: tokenIds } }
            })

            // 3. Upsert instance participation and increment local balance
            const participation = await tx.instanceParticipation.upsert({
                where: {
                    playerId_instanceId: { playerId, instanceId }
                },
                update: {
                    localBalance: { increment: amount }
                },
                create: {
                    playerId,
                    instanceId,
                    localBalance: amount
                }
            })

            // 4. Record ledger event
            await tx.vibeulonLedger.create({
                data: {
                    playerId,
                    targetInstanceId: instanceId,
                    amount,
                    type: 'ATTUNE',
                    metadata: JSON.stringify({ tokenIds })
                }
            })

            return participation
        })
    }

    /**
     * Transmute local balance into another context (global or target instance).
     * Requires ratification (handled at the action level).
     */
    static async transmute(params: {
        playerId: string,
        sourceInstanceId: string,
        amount: number,
        targetInstanceId?: string, // if null, transmutes to global
        metadata?: any
    }) {
        const { playerId, sourceInstanceId, amount, targetInstanceId, metadata } = params
        if (amount <= 0) throw new Error('Transmutation amount must be positive')

        return await db.$transaction(async (tx) => {
            // 1. Check local balance
            const participation = await tx.instanceParticipation.findUnique({
                where: {
                    playerId_instanceId: { playerId, instanceId: sourceInstanceId }
                }
            })

            if (!participation || participation.localBalance < amount) {
                throw new Error('Insufficient local balance for transmutation')
            }

            // 2. Decrement local balance
            await tx.instanceParticipation.update({
                where: { id: participation.id },
                data: { localBalance: { decrement: amount } }
            })

            if (!targetInstanceId) {
                // Transmute back to GLOBAL
                const tokens = []
                for (let i = 0; i < amount; i++) {
                    tokens.push({
                        ownerId: playerId,
                        originSource: 'transmutation',
                        originId: sourceInstanceId,
                        originTitle: 'Transmuted from Local'
                    })
                }
                await tx.vibulon.createMany({ data: tokens })
            } else {
                // Transmute to another LOCAL instance
                await tx.instanceParticipation.upsert({
                    where: {
                        playerId_instanceId: { playerId, instanceId: targetInstanceId }
                    },
                    update: {
                        localBalance: { increment: amount }
                    },
                    create: {
                        playerId,
                        instanceId: targetInstanceId,
                        localBalance: amount
                    }
                })
            }

            // 3. Record ledger event
            return await tx.vibeulonLedger.create({
                data: {
                    playerId,
                    sourceInstanceId,
                    targetInstanceId: targetInstanceId || null,
                    amount,
                    type: 'TRANSMUTE',
                    metadata: JSON.stringify(metadata || {})
                }
            })
        })
    }

    /**
     * Spend local vibeulons within an instance.
     */
    static async spendLocal(playerId: string, instanceId: string, amount: number, metadata?: any) {
        return await db.$transaction(async (tx) => {
            const participation = await tx.instanceParticipation.findUnique({
                where: {
                    playerId_instanceId: { playerId, instanceId }
                }
            })

            if (!participation || participation.localBalance < amount) {
                throw new Error('Insufficient local balance')
            }

            await tx.instanceParticipation.update({
                where: { id: participation.id },
                data: { localBalance: { decrement: amount } }
            })

            return await tx.vibeulonLedger.create({
                data: {
                    playerId,
                    sourceInstanceId: instanceId,
                    amount: -amount,
                    type: 'SPEND',
                    metadata: JSON.stringify(metadata || {})
                }
            })
        })
    }

    /**
     * Mint new vibeulons to the player's global reserve.
     */
    static async mint(playerId: string, amount: number, metadata?: any) {
        if (amount <= 0) throw new Error('Minting amount must be positive')

        return await db.$transaction(async (tx) => {
            const tokens = []
            for (let i = 0; i < amount; i++) {
                tokens.push({
                    ownerId: playerId,
                    originSource: 'mint',
                    originId: metadata?.questId || 'system',
                    originTitle: metadata?.questTitle || 'System Mint'
                })
            }
            await tx.vibulon.createMany({ data: tokens })

            return await tx.vibeulonLedger.create({
                data: {
                    playerId,
                    amount,
                    type: 'MINT',
                    metadata: JSON.stringify(metadata || {})
                }
            })
        })
    }
}
