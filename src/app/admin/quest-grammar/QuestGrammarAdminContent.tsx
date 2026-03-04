'use client'

import { useState } from 'react'
import { UnpackingForm } from './UnpackingForm'
import { GenerationFlow } from './GenerationFlow'
import { ImportTwee } from './ImportTwee'
import { UpgradeFromQuest } from './UpgradeFromQuest'

export function QuestGrammarAdminContent({
  appendToAdventureId = null,
}: {
  appendToAdventureId?: string | null
}) {
  const [view, setView] = useState<'form' | 'cyoa' | 'import' | 'upgrade'>('cyoa')
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 p-1 bg-zinc-900 rounded-lg border border-zinc-700 w-fit">
        <button
          type="button"
          onClick={() => setView('form')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === 'form' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Form
        </button>
        <button
          type="button"
          onClick={() => setView('cyoa')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === 'cyoa' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          CYOA
        </button>
        <button
          type="button"
          onClick={() => setView('upgrade')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === 'upgrade' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Upgrade from quest
        </button>
        <button
          type="button"
          onClick={() => setView('import')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === 'import' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Import .twee
        </button>
      </div>
      {view === 'form' && <UnpackingForm />}
      {view === 'cyoa' && <GenerationFlow appendToAdventureId={appendToAdventureId} />}
      {view === 'upgrade' && <UpgradeFromQuest />}
      {view === 'import' && <ImportTwee />}
    </div>
  )
}
