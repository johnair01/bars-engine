'use client'

import { useState, useCallback } from 'react'

type AdminBooksRouter = { refresh: () => void }
import { extractBookText, extractBookToc } from '@/actions/books'
import { analyzeBook, analyzeBookMore, analyzeBookForMoves, type AnalysisFilters } from '@/actions/book-analyze'
import { createThreadFromBook } from '@/actions/book-to-thread'

export type BookPipelineShared = {
  extractingId: string | null
  extractingTocId: string | null
  extractingMovesId: string | null
  analyzingId: string | null
  analyzingMoreId: string | null
  publishingId: string | null
  extractResult: { id: string; msg: string } | null
  analyzeResult: { id: string; msg: string } | null
  publishResult: { id: string; msg: string } | null
  tocResult: { id: string; msg: string } | null
  extractMovesResult: { id: string; msg: string } | null
  handleExtract: (bookId: string) => Promise<void>
  handleExtractToc: (bookId: string) => Promise<void>
  handleExtractMoves: (bookId: string) => Promise<void>
  handleAnalyze: (bookId: string) => Promise<void>
  handleAnalyzeMore: (bookId: string) => Promise<void>
  handlePublish: (bookId: string) => Promise<void>
}

export function useBookPipelineActions(
  router: AdminBooksRouter,
  options: { filters: AnalysisFilters; hasActiveFilters: boolean }
): BookPipelineShared {
  const { filters, hasActiveFilters } = options

  const [extractingId, setExtractingId] = useState<string | null>(null)
  const [extractResult, setExtractResult] = useState<{ id: string; msg: string } | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [analyzingMoreId, setAnalyzingMoreId] = useState<string | null>(null)
  const [analyzeResult, setAnalyzeResult] = useState<{ id: string; msg: string } | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [publishResult, setPublishResult] = useState<{ id: string; msg: string } | null>(null)
  const [extractingTocId, setExtractingTocId] = useState<string | null>(null)
  const [tocResult, setTocResult] = useState<{ id: string; msg: string } | null>(null)
  const [extractingMovesId, setExtractingMovesId] = useState<string | null>(null)
  const [extractMovesResult, setExtractMovesResult] = useState<{ id: string; msg: string } | null>(null)

  const handleExtractToc = useCallback(
    async (bookId: string) => {
      setExtractingTocId(bookId)
      setTocResult(null)
      const result = await extractBookToc(bookId)
      setExtractingTocId(null)
      if (result.error) {
        setTocResult({ id: bookId, msg: result.error })
      } else {
        setTocResult({
          id: bookId,
          msg: `TOC extracted: ${result.entryCount} entries`,
        })
        router.refresh()
      }
    },
    [router]
  )

  const handleExtract = useCallback(
    async (bookId: string) => {
      setExtractingId(bookId)
      setExtractResult(null)
      const result = await extractBookText(bookId)
      setExtractingId(null)
      if (result.error) {
        setExtractResult({ id: bookId, msg: result.error })
      } else {
        setExtractResult({
          id: bookId,
          msg: `Extracted: ${result.pageCount} pages, ${result.wordCount} words`,
        })
        router.refresh()
      }
    },
    [router]
  )

  const handleAnalyze = useCallback(
    async (bookId: string) => {
      setAnalyzingId(bookId)
      setAnalyzeResult(null)
      const result = await analyzeBook(bookId, hasActiveFilters ? { filters } : undefined)
      setAnalyzingId(null)
      if (result.error) {
        setAnalyzeResult({ id: bookId, msg: result.error })
      } else if ('chunksTotal' in result) {
        const chunkMsg =
          result.chunksTotal != null && result.chunksTotal > result.chunkCount
            ? `${result.chunkCount} of ${result.chunksTotal} chunks`
            : `${result.chunkCount} chunks`
        const filterMsg =
          'chunksFilteredByTarget' in result &&
          result.chunksFilteredByTarget != null &&
          result.chunksFilteredByTarget > 0
            ? ` (${result.chunksFilteredByTarget} skipped by filters)`
            : ''
        setAnalyzeResult({
          id: bookId,
          msg: `Analyzed: ${result.questsCreated} quests from ${chunkMsg}${filterMsg}`,
        })
        router.refresh()
      }
    },
    [router, filters, hasActiveFilters]
  )

  const handleAnalyzeMore = useCallback(
    async (bookId: string) => {
      setAnalyzingMoreId(bookId)
      setAnalyzeResult(null)
      const result = await analyzeBookMore(bookId)
      setAnalyzingMoreId(null)
      if (result.error) {
        setAnalyzeResult({ id: bookId, msg: result.error })
      } else if ('chunksTotal' in result) {
        const chunkMsg =
          result.chunksTotal != null && result.chunksTotal > result.chunkCount
            ? `${result.chunkCount} of ${result.chunksTotal} chunks`
            : `${result.chunkCount} chunks`
        setAnalyzeResult({
          id: bookId,
          msg: `Analyzed: ${result.questsCreated} quests from ${chunkMsg}`,
        })
        router.refresh()
      }
    },
    [router]
  )

  const handleExtractMoves = useCallback(
    async (bookId: string) => {
      setExtractingMovesId(bookId)
      setExtractMovesResult(null)
      const result = await analyzeBookForMoves(bookId)
      setExtractingMovesId(null)
      if ('error' in result) {
        setExtractMovesResult({ id: bookId, msg: result.error })
      } else if ('created' in result) {
        const errMsg = result.errors?.length ? ` (${result.errors.length} errors)` : ''
        setExtractMovesResult({
          id: bookId,
          msg: `Extracted: ${result.created} moves created, ${result.skipped} skipped${errMsg}`,
        })
        router.refresh()
      }
    },
    [router]
  )

  const handlePublish = useCallback(
    async (bookId: string) => {
      setPublishingId(bookId)
      setPublishResult(null)
      const result = await createThreadFromBook(bookId)
      setPublishingId(null)
      if (result.error) {
        setPublishResult({ id: bookId, msg: result.error })
      } else {
        setPublishResult({
          id: bookId,
          msg: `Published: ${result.questCount} quests → thread`,
        })
        router.refresh()
      }
    },
    [router]
  )

  return {
    extractingId,
    extractingTocId,
    extractingMovesId,
    analyzingId,
    analyzingMoreId,
    publishingId,
    extractResult,
    analyzeResult,
    publishResult,
    tocResult,
    extractMovesResult,
    handleExtract,
    handleExtractToc,
    handleExtractMoves,
    handleAnalyze,
    handleAnalyzeMore,
    handlePublish,
  }
}
