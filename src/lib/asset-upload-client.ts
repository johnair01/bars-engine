/**
 * Client-side asset upload. Default path for all BAR photo/media uploads.
 * Streams directly to Vercel Blob — never send files through server actions.
 * Uses dynamic import so @vercel/blob/client (browser-only) never loads during SSR.
 */

const UPLOAD_URL = '/api/assets/upload'

export type UploadBarAssetPayload = {
  barId: string
  side?: 'front' | 'back'
  intention?: string
}

/**
 * Upload a file to a BAR. Uses Vercel Blob client upload — bypasses serverless
 * payload limits. Call from client components only.
 */
export async function uploadBarAsset(
  file: File,
  payload: UploadBarAssetPayload
): Promise<{ url: string }> {
  const { upload } = await import('@vercel/blob/client')
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const blob = await upload(
    `assets/${payload.barId}/${payload.side ?? 'attachment'}/${crypto.randomUUID()}`,
    file,
    {
      access: 'public',
      contentType: file.type,
      handleUploadUrl: `${base}${UPLOAD_URL}`,
      clientPayload: JSON.stringify({
        barId: payload.barId,
        ...(payload.side && { side: payload.side }),
        ...(payload.intention && { intention: payload.intention }),
      }),
      multipart: true,
    }
  )
  return { url: blob.url }
}
