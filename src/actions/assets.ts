'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { put } from '@vercel/blob'
import { getCurrentPlayer } from '@/lib/auth'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'assets')
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_PDF_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const ALLOWED_PDF_TYPE = 'application/pdf'

async function requirePlayerOrAdmin() {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Authentication required')

  const adminRole = await db.playerRole.findFirst({
    where: { playerId: player.id, role: { key: 'admin' } },
  })
  return { player, isAdmin: !!adminRole }
}

/**
 * Upload an attachment for a BAR (CustomBar).
 * Creator or admin can upload. Optional intention stored in metadata.
 */
export async function uploadBarAttachment(
  customBarId: string,
  formData: FormData
): Promise<{ success: boolean; assetId?: string; error?: string }> {
  try {
    const { player, isAdmin } = await requirePlayerOrAdmin()

    const bar = await db.customBar.findUnique({
      where: { id: customBarId },
      select: { id: true, creatorId: true },
    })
    if (!bar) return { success: false, error: 'BAR not found' }
    if (bar.creatorId !== player.id && !isAdmin) {
      return { success: false, error: 'Only the creator or an admin can add attachments' }
    }

    const file = formData.get('file') as File | null
    if (!file || file.size === 0) return { success: false, error: 'No file provided' }

    const intention = (formData.get('intention') as string)?.trim() || undefined

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isPdf = file.type === ALLOWED_PDF_TYPE
    if (!isImage && !isPdf) {
      return { success: false, error: 'File must be an image (PNG, JPEG, WebP, GIF) or PDF' }
    }

    const maxBytes = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES
    if (file.size > maxBytes) {
      return { success: false, error: `File too large (max ${isPdf ? '10' : '5'} MB)` }
    }

    const ext = path.extname(file.name) || (isPdf ? '.pdf' : '.png')
    const asset = await db.asset.create({
      data: {
        type: 'bar_attachment',
        url: '', // set below
        mimeType: file.type,
        metadataJson: intention ? JSON.stringify({ intention }) : null,
        ownerId: player.id,
        customBarId,
      },
    })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (token) {
      const blob = await put(
        `assets/${asset.id}${ext}`,
        buffer,
        { access: 'public', contentType: file.type }
      )
      await db.asset.update({
        where: { id: asset.id },
        data: { url: blob.url },
      })
    } else {
      const dir = path.join(UPLOAD_DIR, asset.id)
      await mkdir(dir, { recursive: true })
      const filename = `file${ext}`
      await writeFile(path.join(dir, filename), buffer)
      const url = `/uploads/assets/${asset.id}/${filename}`
      await db.asset.update({
        where: { id: asset.id },
        data: { url },
      })
    }

    revalidatePath(`/admin/quests`)
    revalidatePath(`/quests/${customBarId}`)
    return { success: true, assetId: asset.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed'
    console.error('[ASSETS] uploadBarAttachment error:', msg)
    return { success: false, error: msg }
  }
}

/**
 * Get all assets attached to a BAR.
 */
export async function getBarAssets(customBarId: string) {
  return db.asset.findMany({
    where: { customBarId, type: 'bar_attachment' },
    orderBy: { createdAt: 'asc' },
  })
}
