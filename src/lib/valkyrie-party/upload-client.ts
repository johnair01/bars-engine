'use client'

const UPLOAD_URL = '/api/party/valkyrie/upload'

export type PartyUploadPayload = {
  kind: 'altar' | 'quest_completion' | 'oracle_override'
  questCardId?: string
  cardId?: string
}

export async function uploadPartyAsset(file: File, payload: PartyUploadPayload) {
  const { upload } = await import('@vercel/blob/client')
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const blob = await upload(
    `party/valkyrie-party/${payload.kind}/${crypto.randomUUID()}`,
    file,
    {
      access: 'public',
      contentType: file.type,
      handleUploadUrl: `${base}${UPLOAD_URL}`,
      clientPayload: JSON.stringify(payload),
      multipart: true,
    }
  )
  return { url: blob.url }
}
