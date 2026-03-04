'use client'

import { useState, useEffect } from 'react'
import { getAdminQuests } from '@/actions/admin'
import { UpgradeQuestToCYOAFlow } from '@/components/admin/UpgradeQuestToCYOAFlow'
import Link from 'next/link'

type Quest = { id: string; title: string; description?: string | null; moveType?: string | null; storyContent?: string | null }

export function UpgradeFromQuest() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [selectedQuestId, setSelectedQuestId] = useState('')

  useEffect(() => {
    getAdminQuests().then(setQuests).catch(() => setQuests([]))
  }, [])

  const selectedQuest = quests.find((q) => q.id === selectedQuestId)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Start from existing quest</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Select a quest and run the unpacking flow to upgrade it to CYOA. Original quest is preserved and linked.
        </p>
      </div>
      <div>
        <label htmlFor="quest" className="block text-sm font-medium text-zinc-300 mb-1">
          Quest
        </label>
        <select
          id="quest"
          value={selectedQuestId}
          onChange={(e) => setSelectedQuestId(e.target.value)}
          className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="">Choose a quest…</option>
          {quests.map((q) => (
            <option key={q.id} value={q.id}>
              {q.title || q.id}
            </option>
          ))}
        </select>
      </div>
      {selectedQuest && (
        <UpgradeQuestToCYOAFlow
          key={selectedQuest.id}
          questId={selectedQuest.id}
          quest={selectedQuest}
          existingAdventureId={null}
        />
      )}
      <p className="text-xs text-zinc-500">
        Or go to <Link href="/admin/quests" className="text-purple-400 hover:underline">Admin → Quests</Link> and use
        &quot;Upgrade to CYOA&quot; on a quest detail page.
      </p>
    </div>
  )
}
