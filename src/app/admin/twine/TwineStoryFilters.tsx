'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

export function TwineStoryFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const status = searchParams.get('status') ?? 'all'
  const search = searchParams.get('search') ?? ''
  const [searchInput, setSearchInput] = useState(search)

  const updateFilters = useCallback(
    (updates: { status?: string; search?: string }) => {
      const params = new URLSearchParams(searchParams.toString())
      if (updates.status !== undefined) {
        if (updates.status === 'all') params.delete('status')
        else params.set('status', updates.status)
      }
      if (updates.search !== undefined) {
        if (!updates.search.trim()) params.delete('search')
        else params.set('search', updates.search.trim())
      }
      router.push(`/admin/twine?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: searchInput })
  }

  const hasFilters = status !== 'all' || search

  const clearFilters = () => {
    setSearchInput('')
    router.push('/admin/twine')
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by title..."
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white text-sm w-48 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg transition"
        >
          Search
        </button>
      </form>
      <div className="flex gap-1">
        {(['all', 'published', 'draft'] as const).map((s) => (
          <button
            key={s}
            onClick={() => updateFilters({ status: s })}
            className={`px-3 py-1.5 text-xs rounded-lg transition ${
              status === s
                ? 'bg-purple-900/50 text-purple-300 border border-purple-800'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {s === 'all' ? 'All' : s === 'published' ? 'Published' : 'Draft'}
          </button>
        ))}
      </div>
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
