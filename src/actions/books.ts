'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { writeFile, mkdir, readFile } from 'fs/promises'
import path from 'path'
import { put } from '@vercel/blob'
import { extractTextFromPdf } from '@/lib/pdf-extract'
import { extractTocFromText } from '@/lib/book-toc'
import { mapSectionsToDimensions } from '@/lib/book-section-mapper'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'books')

async function requireAdmin() {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not logged in')

  const adminRole = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  if (!adminRole) throw new Error('Admin access required')
  return playerId
}

function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Create a draft Book record for client-side Blob upload.
 * Returns bookId for use with upload() from @vercel/blob/client.
 * Bypasses Vercel's 4.5 MB request limit by not receiving file bytes.
 */
export async function createBookForUpload(title: string, author: string | null) {
  try {
    await requireAdmin()

    const trimmedTitle = title?.trim() || 'Untitled'
    let slug = slugFromTitle(trimmedTitle)

    const existing = await db.book.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now()}`

    const book = await db.book.create({
      data: {
        title: trimmedTitle,
        author: author?.trim() || null,
        slug,
        status: 'draft',
      },
    })

    revalidatePath('/admin/books')
    return { success: true, bookId: book.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create book'
    console.error('[BOOKS] Create book error:', msg)
    return { error: msg }
  }
}

/**
 * Upload a PDF and create a Book record.
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set; otherwise saves to public/uploads/books/{id}.pdf
 * Note: For files > 4.5 MB on Vercel, use createBookForUpload + client upload instead.
 */
export async function uploadBook(
  _prev: { error?: string; success?: boolean; bookId?: string } | null,
  formData: FormData
) {
  try {
    await requireAdmin()

    const file = formData.get('file') as File | null
    if (!file || file.size === 0) return { error: 'No file provided' }
    if (!file.name.toLowerCase().endsWith('.pdf')) return { error: 'File must be a PDF' }

    const titleOverride = (formData.get('title') as string)?.trim()
    const author = (formData.get('author') as string)?.trim() || null

    const title = titleOverride || file.name.replace(/\.pdf$/i, '')
    let slug = slugFromTitle(title)

    const existing = await db.book.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now()}`

    const book = await db.book.create({
      data: {
        title,
        author,
        slug,
        status: 'draft',
      },
    })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (token) {
      const blob = await put(`books/${book.id}.pdf`, buffer, {
        access: 'public',
        contentType: 'application/pdf',
      })
      await db.book.update({
        where: { id: book.id },
        data: { sourcePdfUrl: blob.url },
      })
    } else {
      await mkdir(UPLOAD_DIR, { recursive: true })
      await writeFile(path.join(UPLOAD_DIR, `${book.id}.pdf`), buffer)
      await db.book.update({
        where: { id: book.id },
        data: { sourcePdfUrl: `/uploads/books/${book.id}.pdf` },
      })
    }

    revalidatePath('/admin/books')
    return { success: true, bookId: book.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed'
    console.error('[BOOKS] Upload error:', msg)
    return { error: msg }
  }
}

/**
 * Extract text from a book's PDF and update the record.
 */
export async function extractBookText(bookId: string) {
  try {
    await requireAdmin()

    const book = await db.book.findUnique({ where: { id: bookId } })
    if (!book) return { error: 'Book not found' }
    if (book.status !== 'draft' && book.status !== 'extracted') {
      return { error: 'Book must be in draft status to extract' }
    }

    let buffer: Buffer
    if (book.sourcePdfUrl?.startsWith('http')) {
      const res = await fetch(book.sourcePdfUrl)
      if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`)
      const ab = await res.arrayBuffer()
      buffer = Buffer.from(ab)
    } else if (book.sourcePdfUrl) {
      const filePath = path.join(process.cwd(), book.sourcePdfUrl)
      buffer = await readFile(filePath)
    } else {
      return { error: 'No PDF URL' }
    }

    const { text, pageCount } = await extractTextFromPdf(buffer)

    // PostgreSQL rejects null bytes (0x00) in UTF-8; PDF extraction can produce them
    const sanitizedText = text.replace(/\0/g, '')

    const metadata = {
      pageCount,
      wordCount: sanitizedText.split(/\s+/).filter(Boolean).length,
      extractedAt: new Date().toISOString(),
    }

    await db.book.update({
      where: { id: bookId },
      data: {
        extractedText: sanitizedText,
        status: 'extracted',
        metadataJson: JSON.stringify(metadata),
      },
    })

    revalidatePath('/admin/books')
    return { success: true, pageCount, wordCount: metadata.wordCount }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Extraction failed'
    console.error('[BOOKS] Extract error:', msg)
    return { error: msg }
  }
}

/**
 * Extract table of contents from a book's extracted text.
 * Persists TOC to Book.metadataJson.toc.
 * Spec: .specify/specs/book-quest-targeted-extraction/spec.md
 */
export async function extractBookToc(bookId: string) {
  try {
    await requireAdmin()

    const book = await db.book.findUnique({
      where: { id: bookId },
      select: { id: true, extractedText: true, metadataJson: true, status: true },
    })
    if (!book) return { error: 'Book not found' }
    if (!book.extractedText) return { error: 'Book has no extracted text. Run Extract Text first.' }

    const toc = extractTocFromText(book.extractedText)
    const sectionHints = mapSectionsToDimensions(toc, book.extractedText)
    const tocWithHints = { ...toc, sectionHints }

    const existingMeta = book.metadataJson ? JSON.parse(book.metadataJson) : {}
    await db.book.update({
      where: { id: bookId },
      data: {
        metadataJson: JSON.stringify({ ...existingMeta, toc: tocWithHints }),
      },
    })

    revalidatePath('/admin/books')
    return { success: true, entryCount: toc.entries.length }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'TOC extraction failed'
    console.error('[BOOKS] Extract TOC error:', msg)
    return { error: msg }
  }
}

/**
 * Update praxis pillar metadata on a book's metadataJson without wiping other keys.
 * Spec: .specify/specs/library-praxis-three-pillars/spec.md (FR1–FR3)
 */
export async function updateBookPraxisMetadata(
  bookId: string,
  updates: import('@/lib/books/praxisMetadata').BookPraxisMetadata
) {
  try {
    await requireAdmin()
    const { mergePraxisMetadata } = await import('@/lib/books/praxisMetadata')
    const book = await db.book.findUnique({ where: { id: bookId }, select: { metadataJson: true } })
    if (!book) return { error: 'Book not found' }
    const merged = mergePraxisMetadata(book.metadataJson, updates)
    await db.book.update({ where: { id: bookId }, data: { metadataJson: merged } })
    revalidatePath('/admin/books')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Update failed' }
  }
}

const adminBookHubSelect = {
  id: true,
  title: true,
  author: true,
  slug: true,
  sourcePdfUrl: true,
  status: true,
  metadataJson: true,
  createdAt: true,
  thread: { select: { id: true } },
} as const

/**
 * Single book for admin hub page. No extractedText (P6009).
 */
export async function getAdminBookForHub(bookId: string) {
  await requireAdmin()
  return db.book.findUnique({
    where: { id: bookId },
    select: adminBookHubSelect,
  })
}

/**
 * List all books for admin.
 * Excludes extractedText to avoid P6009 (response size > 5MB) with Prisma Accelerate.
 */
export async function listBooks() {
  await requireAdmin()
  return db.book.findMany({
    select: adminBookHubSelect,
    orderBy: { createdAt: 'desc' },
  })
}
