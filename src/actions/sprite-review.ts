'use server'

import { checkGM } from '@/actions/admin'
import { revalidatePath } from 'next/cache'

export async function getPendingSpriteReviews() {
    await checkGM()
    // SpriteAuditLog is being added to schema — stub until Prisma client regenerated after 3a.1-3a.3
    return []
}

export async function approveSpriteReview(
    auditLogId: string,
    spritePath: string,
    playerId: string,
    pipeline: 'portrait' | 'walkable',
) {
    await checkGM()
    // Move sprite from /sprites/pending/ to /public/sprites/
    // Update Player.avatarSpritePath or walkableSpritePath
    // Update SpriteAuditLog status to 'approved'
    // Stubbed until schema migration (3a.1-3a.3) is applied
    console.log(`[SpriteReview] Approve ${auditLogId} pipeline=${pipeline} player=${playerId} path=${spritePath}`)
    revalidatePath('/admin/sprites/review')
    return { success: true }
}

export async function rejectSpriteReview(auditLogId: string, note: string) {
    await checkGM()
    // Update SpriteAuditLog status to 'rejected', store reviewNote
    // Stubbed until schema migration (3a.1-3a.3) is applied
    console.log(`[SpriteReview] Reject ${auditLogId} note=${note}`)
    revalidatePath('/admin/sprites/review')
    return { success: true }
}
