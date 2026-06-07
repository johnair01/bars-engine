import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { db } from '@/lib/db'
import { requirePartyPlayer } from '@/lib/valkyrie-party/http'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_BYTES = 8 * 1024 * 1024

function assetTypeForKind(kind: string) {
  switch (kind) {
    case 'quest_completion':
      return 'party_quest_completion'
    case 'oracle_override':
      return 'party_oracle_override'
    default:
      return 'party_altar_media'
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { ok: false, error: 'Party uploads require BLOB_READ_WRITE_TOKEN in Vercel Blob storage.' },
        { status: 503 }
      )
    }

    const raw = await request.text()
    if (!raw?.trim()) return NextResponse.json({ ok: false, error: 'Empty request body' }, { status: 400 })
    const body = JSON.parse(raw) as HandleUploadBody

    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const actor = await requirePartyPlayer()
        if (!pathname.startsWith('party/valkyrie-party/')) {
          throw new Error('Invalid upload path')
        }
        let payload: Record<string, unknown> = {}
        if (clientPayload) {
          payload = JSON.parse(clientPayload) as Record<string, unknown>
        }
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          tokenPayload: JSON.stringify({
            ...payload,
            playerId: actor.playerId,
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) throw new Error('Missing upload payload')
        const payload = JSON.parse(tokenPayload) as Record<string, unknown>
        const playerId = typeof payload.playerId === 'string' ? payload.playerId : ''
        if (!playerId) throw new Error('Missing player id')
        const kind = typeof payload.kind === 'string' ? payload.kind : 'altar'
        await db.asset.create({
          data: {
            type: assetTypeForKind(kind),
            url: blob.url,
            mimeType: blob.contentType ?? 'image/jpeg',
            metadataJson: JSON.stringify(payload),
            ownerId: playerId,
          },
        })
        revalidatePath('/valkyrie-party')
        revalidatePath('/valkyrie-party/altar')
      },
    })

    return NextResponse.json(json)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
