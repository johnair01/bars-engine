/**
 * The coin turn's writes (spec .specify/specs/ember-to-vibeulon, FR-010 to FR-013). The player's coin style lives in
 * their private pouch (`coinStyle: { color, mat }`), never in a shared row; a finished coin's face never changes.
 */
import type { Prisma } from '@prisma/client'
import { asCoinStyle, faceIsSet, isCoinColor, isCoinMat, type CoinFace, type CoinStyle } from '@/lib/economy/coin-face'
import type { Tx } from '@/lib/economy/bar-mint'

const asObj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})

/** The player's coin style from their pouch in this garden, or null before the first coin turn. */
export async function readCoinStyle(tx: Tx, gardenId: string, playerId: string): Promise<CoinStyle | null> {
    const row = await tx.betweenPrivate.findUnique({ where: { gardenId_playerId_key: { gardenId, playerId, key: 'pouch' } } })
    return asCoinStyle(asObj(row?.data).coinStyle)
}

async function keepCoinStyle(tx: Tx, gardenId: string, playerId: string, style: CoinStyle): Promise<void> {
    const where = { gardenId_playerId_key: { gardenId, playerId, key: 'pouch' } }
    const row = await tx.betweenPrivate.findUnique({ where })
    const data = { ...asObj(row?.data), coinStyle: style } as Prisma.InputJsonValue
    await tx.betweenPrivate.upsert({ where, create: { gardenId, playerId, key: 'pouch', data }, update: { data } })
}

export type FinishResult =
    | { ok: true; style: CoinStyle; face?: CoinFace }
    | { ok: false; status: 400 | 403 | 404 | 409; code: 'invalid_argument' | 'permission_denied' | 'not_found' | 'face_set'; error: string }

/**
 * `PUT /api/between/[gardenId]/coin`. With `vibulonId`: finish that bare coin (owner only; 409 `face_set` once its
 * colour is set) and keep the style for the next coins. Without it: change the style for the next coins only (FR-012).
 * Nothing here costs a vibeulon or checks a count (FR-013).
 */
export async function finishCoin(
    tx: Tx,
    input: { gardenId: string; playerId: string; vibulonId?: unknown; color: unknown; mat: unknown },
): Promise<FinishResult> {
    if (!isCoinColor(input.color) || !isCoinMat(input.mat))
        return { ok: false, status: 400, code: 'invalid_argument', error: 'Pick one of the six colours and one of the six materials.' }
    const style: CoinStyle = { color: input.color, mat: input.mat }
    if (input.vibulonId === undefined || input.vibulonId === null) {
        await keepCoinStyle(tx, input.gardenId, input.playerId, style)
        return { ok: true, style }
    }
    if (typeof input.vibulonId !== 'string')
        return { ok: false, status: 400, code: 'invalid_argument', error: 'vibulonId is the coin to finish.' }
    const coin = await tx.vibulon.findUnique({ where: { id: input.vibulonId }, select: { id: true, ownerId: true, creatorId: true, face: true } })
    if (!coin) return { ok: false, status: 404, code: 'not_found', error: 'There is no such coin.' }
    if (coin.ownerId !== input.playerId && coin.creatorId !== input.playerId)
        return { ok: false, status: 403, code: 'permission_denied', error: 'Only the player who minted a coin finishes it.' }
    if (faceIsSet(coin.face))
        return { ok: false, status: 409, code: 'face_set', error: 'This coin is already finished; its face never changes.' }
    const bare = asObj(coin.face)
    const face: CoinFace = {
        v: 1,
        ring: (bare.ring as CoinFace['ring']) ?? null,
        tex: (bare.tex as CoinFace['tex']) ?? null,
        seal: typeof bare.seal === 'string' ? bare.seal : null,
        color: style.color,
        mat: style.mat,
    }
    await tx.vibulon.update({ where: { id: coin.id }, data: { face: face as unknown as Prisma.InputJsonValue } })
    await keepCoinStyle(tx, input.gardenId, input.playerId, style)
    return { ok: true, style, face }
}
