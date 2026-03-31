'use server'

import { put } from '@vercel/blob'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

export async function addBarMedia(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const barId = (formData.get('barId') as string)?.trim()
  const file = formData.get('file') as File | null

  if (!barId) return { error: 'BAR ID is required' }
  if (!file || file.size === 0) return { error: 'No file selected' }
  if (file.size > MAX_SIZE) return { error: 'File must be under 5 MB' }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, creatorId: true },
  })
  if (!bar) return { error: 'BAR not found' }
  if (bar.creatorId !== playerId) return { error: "You don't own this BAR" }

  const contentType = file.type
  const isImage = IMAGE_TYPES.includes(contentType)
  const isFile = FILE_TYPES.includes(contentType) || !isImage
  const kind = isImage ? 'image' : 'file'

  if (!isImage && !isFile) {
    return { error: 'Unsupported file type. Use images (JPEG, PNG, GIF, WebP) or PDF/DOC.' }
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop() || (isImage ? 'jpg' : 'bin')
    const pathname = `bar-media/${barId}/${Date.now()}.${ext}`

    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType: file.type,
    })

    const count = await db.barMedia.count({ where: { barId } })
    await db.barMedia.create({
      data: {
        barId,
        blobUrl: blob.url,
        kind,
        name: file.name,
        sortOrder: count,
      },
    })

    revalidatePath(`/bars/${barId}`)
    revalidatePath('/bars')
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed'
    console.error('[BAR-MEDIA] Upload error:', msg)
    return { error: msg }
  }
}

export async function removeBarMedia(barId: string, mediaId: string) {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not logged in' }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { creatorId: true },
  })
  if (!bar || bar.creatorId !== playerId) return { error: 'Not authorized' }

  await db.barMedia.delete({
    where: { id: mediaId, barId },
  })
  revalidatePath(`/bars/${barId}`)
  revalidatePath('/bars')
  return { success: true }
}
