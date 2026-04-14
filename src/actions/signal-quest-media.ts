'use server'

import { put } from '@vercel/blob'
import { cookies } from 'next/headers'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 4 * 1024 * 1024 // 4 MB

/**
 * Upload a photo for the "Share Your Signal" (system-feedback) quest.
 * Stores on public blob; URL is submitted with quest completion inputs for metabolizing visuals.
 */
export async function uploadSignalQuestPhoto(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) return { error: 'Not logged in' }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'No file selected' }
  if (file.size > MAX_SIZE) return { error: 'Image must be under 4 MB' }
  if (!IMAGE_TYPES.includes(file.type)) {
    return { error: 'Use JPEG, PNG, GIF, or WebP' }
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop() || 'jpg'
    const pathname = `signal-feedback/${playerId}/${Date.now()}.${ext}`

    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType: file.type,
    })

    return { url: blob.url }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed'
    console.error('[signal-quest-media]', msg)
    return { error: msg }
  }
}
