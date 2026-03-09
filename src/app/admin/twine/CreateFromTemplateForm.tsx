'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createStoryFromTemplate } from '@/actions/twine'

interface Template {
  id: string
  title: string
}

export function CreateFromTemplateForm({ templates }: { templates: Template[] }) {
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? '')
  const [newTitle, setNewTitle] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (templates.length === 0) return null

  const handleCreate = () => {
    if (!selectedId) return
    startTransition(async () => {
      const result = await createStoryFromTemplate(selectedId, newTitle.trim() || undefined)
      if (result.error) {
        alert(result.error)
      } else if (result.storyId) {
        router.push(`/admin/twine/${result.storyId}/ir`)
        router.refresh()
      }
    })
  }

  return (
    <div className="mt-6 pt-6 border-t border-zinc-800">
      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Create from template</h3>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Template</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 outline-none"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">New title (optional)</label>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Leave blank for &quot;Title (copy)&quot;"
            className="bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm w-48 focus:border-purple-500 outline-none"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="px-4 py-2 bg-amber-900/50 hover:bg-amber-800/50 text-amber-300 rounded-lg text-sm border border-amber-800 disabled:opacity-50"
        >
          {isPending ? 'Creating…' : 'Create from template'}
        </button>
      </div>
    </div>
  )
}
