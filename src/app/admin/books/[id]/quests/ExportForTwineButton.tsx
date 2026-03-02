'use client'

import { getBookQuestsForTwineExport } from '@/actions/book-quest-review'
import { useState } from 'react'

export function ExportForTwineButton({ bookId, bookSlug }: { bookId: string; bookSlug: string }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    const result = await getBookQuestsForTwineExport(bookId)
    setExporting(false)
    if ('error' in result) {
      alert(result.error)
      return
    }
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${bookSlug}-quests.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition disabled:opacity-50"
    >
      {exporting ? 'Exporting...' : 'Export for Twine'}
    </button>
  )
}
