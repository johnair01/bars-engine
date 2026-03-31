'use server'

import { cookies } from 'next/headers'
import type { SourceAnalysisProfileId } from '@/lib/source-genre-profiles'

const UNAVAILABLE =
  'Source ingestion pipeline is not deployed in this build (database models not present).'

/** Admin UI row shape when the real SourceDocument pipeline exists. */
export type SourceDocumentRow = {
  id: string
  title: string
  author?: string | null
  status: string
  pageCount?: number | null
  documentKind: string
  fileUrl?: string | null
}

export type GetSourceDocumentDetailResult =
  | { error: string; document: null; candidateCount: number; promptCount: number; seedCount: number }
  | {
      error?: undefined
      document: SourceDocumentRow
      candidateCount: number
      promptCount: number
      seedCount: number
    }

export type SourceDocumentForBookRow = {
  id: string
  status: string
  excerpts?: unknown[]
  _count?: { excerpts: number }
}

async function requireAdmin(): Promise<string> {
  const { db } = await import('@/lib/db')
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) throw new Error('Not logged in')
  const adminRole = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  if (!adminRole) throw new Error('Admin access required')
  return playerId
}

export async function createSourceDocumentForUpload(params: {
  title: string
  author?: string
  documentKind: SourceAnalysisProfileId
}): Promise<{ success: false; error: string } | { success: true; documentId: string }> {
  try {
    await requireAdmin()
    void params
    return { success: false, error: UNAVAILABLE }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Create failed'
    return { success: false, error: msg }
  }
}

export async function updateSourceDocumentFileUrl(_id: string, _url: string) {
  try {
    await requireAdmin()
    return { error: UNAVAILABLE }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Update failed'
    return { error: msg }
  }
}

export async function listSourceDocuments(_filters?: { status?: string }) {
  try {
    await requireAdmin()
    return { success: true as const, documents: [] }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'List failed'
    return { error: msg, documents: [] }
  }
}

export async function getSourceDocumentDetail(_id: string): Promise<GetSourceDocumentDetailResult> {
  try {
    await requireAdmin()
    void _id
    return {
      error: UNAVAILABLE,
      document: null,
      candidateCount: 0,
      promptCount: 0,
      seedCount: 0,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Get failed'
    return {
      error: msg,
      document: null,
      candidateCount: 0,
      promptCount: 0,
      seedCount: 0,
    }
  }
}

export async function parseSourceDocument(_id: string) {
  try {
    await requireAdmin()
    return { success: false as const, error: UNAVAILABLE }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Parse failed'
    return { success: false as const, error: msg }
  }
}

export async function analyzeSourceDocument(_id: string, _profileId?: SourceAnalysisProfileId) {
  try {
    await requireAdmin()
    return { success: false as const, analyzed: 0, error: UNAVAILABLE }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Analyze failed'
    return { success: false as const, analyzed: 0, error: msg }
  }
}

export async function listSourceExcerpts(_documentId: string) {
  try {
    await requireAdmin()
    return { success: true as const, excerpts: [] }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'List failed'
    return { error: msg, excerpts: [] }
  }
}

export async function reanalyzeExcerpt(_excerptId: string, _profileId?: SourceAnalysisProfileId) {
  try {
    await requireAdmin()
    return { success: false as const, error: UNAVAILABLE }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Reanalyze failed'
    return { success: false as const, error: msg }
  }
}

export async function listBarCandidates(_documentId: string) {
  try {
    await requireAdmin()
    return { success: true as const, candidates: [] }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'List failed'
    return { error: msg, candidates: [] }
  }
}

export async function getBarCandidateDetail(_id: string) {
  try {
    await requireAdmin()
    void _id
    return { error: 'Not found' }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Get failed'
    return { error: msg }
  }
}

export async function approveBarCandidate(_id: string) {
  try {
    await requireAdmin()
    return { success: false as const, error: UNAVAILABLE }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Approve failed'
    return { success: false as const, error: msg }
  }
}

export async function rejectBarCandidate(_id: string) {
  try {
    await requireAdmin()
    return { success: false as const, error: UNAVAILABLE }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Reject failed'
    return { success: false as const, error: msg }
  }
}

export async function mintBarFromBarCandidate(_id: string) {
  try {
    await requireAdmin()
    return { error: UNAVAILABLE }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Mint failed'
    return { error: msg }
  }
}

export async function saveBarCandidateAsPrompt(_id: string) {
  try {
    await requireAdmin()
    return { error: UNAVAILABLE }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Save failed'
    return { error: msg }
  }
}

export async function promoteBookToSourceIngestionPipeline(
  _bookId: string,
  _documentKind?: SourceAnalysisProfileId
) {
  try {
    await requireAdmin()
    return { error: UNAVAILABLE }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Promote failed'
    return { error: msg }
  }
}

export async function getSourceDocumentForBook(_bookId: string): Promise<
  | {
      success: true
      sourceDocument: SourceDocumentForBookRow | null
      candidateCount: number
      promptCount: number
      seedCount: number
    }
  | {
      success: false
      error: string
      sourceDocument: null
      candidateCount: number
      promptCount: number
      seedCount: number
    }
> {
  try {
    await requireAdmin()
    void _bookId
    return {
      success: true,
      sourceDocument: null,
      candidateCount: 0,
      promptCount: 0,
      seedCount: 0,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Get failed'
    return {
      success: false,
      error: msg,
      sourceDocument: null,
      candidateCount: 0,
      promptCount: 0,
      seedCount: 0,
    }
  }
}

export async function saveBarCandidateAsLore(_id: string) {
  try {
    await requireAdmin()
    return { success: false as const, error: UNAVAILABLE }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Save failed'
    return { success: false as const, error: msg }
  }
}
