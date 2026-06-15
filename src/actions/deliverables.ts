'use server'

/**
 * Digital deliverable intake (Track C, redirected).
 *
 * Admins upload the finished file for a launch SKU (e.g. the book or RPG
 * handbook PDF/EPUB produced in external editorial software). One current file
 * per SKU; re-upload replaces it. Buyers download via the gated
 * /api/deliverables/[sku] route. Storage mirrors src/actions/assets.ts: Vercel
 * Blob when BLOB_READ_WRITE_TOKEN is set, else a local public/uploads fallback.
 */

import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { put } from '@vercel/blob'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { LAUNCH_OFFERS, type OfferKey } from '@/lib/launch/offers'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'deliverables')
const VALID_SKUS = new Set<string>(LAUNCH_OFFERS.map((o) => o.key))

async function requireAdmin(): Promise<string> {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Authentication required')
  const isAdmin = player.roles?.some((r) => r.role.key === 'admin') ?? false
  if (!isAdmin) throw new Error('Unauthorized: Admin access required.')
  return player.id
}

/** Admin: upload (or replace) the deliverable file for a SKU. */
export async function uploadDeliverable(formData: FormData) {
  let adminId: string
  try {
    adminId = await requireAdmin()
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'Unauthorized' }
  }

  const sku = String(formData.get('sku') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const file = formData.get('file')

  if (!VALID_SKUS.has(sku)) return { ok: false as const, error: 'Unknown SKU.' }
  if (!(file instanceof File) || file.size === 0) return { ok: false as const, error: 'Choose a file.' }

  const ext = path.extname(file.name) || ''
  const objectPath = `deliverables/${sku}-${Date.now()}${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  let fileUrl: string
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(objectPath, buffer, {
        access: 'public',
        contentType: file.type || 'application/octet-stream',
      })
      fileUrl = blob.url
    } else {
      const dir = path.join(UPLOAD_DIR, sku)
      await mkdir(dir, { recursive: true })
      const filename = `file${ext}`
      await writeFile(path.join(dir, filename), buffer)
      fileUrl = `/uploads/deliverables/${sku}/${filename}`
    }
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'Upload failed' }
  }

  await db.digitalDeliverable.upsert({
    where: { sku },
    create: {
      sku,
      title: title || file.name,
      fileName: file.name,
      fileUrl,
      contentType: file.type || null,
      sizeBytes: file.size,
      uploadedById: adminId,
    },
    update: {
      title: title || file.name,
      fileName: file.name,
      fileUrl,
      contentType: file.type || null,
      sizeBytes: file.size,
      uploadedById: adminId,
    },
  })

  revalidatePath('/admin/deliverables')
  revalidatePath('/downloads')
  return { ok: true as const, sku }
}

/** Admin: remove a SKU's deliverable record (blob is left in place). */
export async function deleteDeliverable(sku: OfferKey) {
  try {
    await requireAdmin()
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'Unauthorized' }
  }
  await db.digitalDeliverable.deleteMany({ where: { sku } })
  revalidatePath('/admin/deliverables')
  revalidatePath('/downloads')
  return { ok: true as const }
}
