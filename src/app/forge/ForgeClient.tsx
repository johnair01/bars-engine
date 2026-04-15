'use client'

import { useState, useEffect } from 'react'
import { ChargeCaptureForm } from '@/components/charge-capture/ChargeCaptureForm'
import { CreateBarForm, type CreateBarPrefill } from '@/components/CreateBarForm'
import type { CreateBar321Session } from '@/components/CreateBarForm'

const STORAGE_KEY = 'shadow321_metadata'
const STORAGE_SESSION_KEY = 'shadow321_session'

type ForgeMode = 'seal' | 'forge'

interface ForgeClientProps {
  initialMode?: ForgeMode
  setup?: boolean
  from321?: boolean
}

export function ForgeClient({
  initialMode = 'seal',
  setup = false,
  from321 = false,
}: ForgeClientProps) {
  const [mode, setMode] = useState<ForgeMode>(initialMode)
  const [prefill, setPrefill] = useState<CreateBarPrefill | undefined>(undefined)
  const [session321, setSession321] = useState<CreateBar321Session | undefined>(undefined)

  useEffect(() => {
    if (from321 && typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as CreateBarPrefill
          if (parsed && typeof parsed === 'object') {
            setPrefill(parsed)
            setMode('forge')
            sessionStorage.removeItem(STORAGE_KEY)
          }
        }
        const sessionRaw = sessionStorage.getItem(STORAGE_SESSION_KEY)
        if (sessionRaw) {
          const session = JSON.parse(sessionRaw) as CreateBar321Session
          if (session && typeof session === 'object') {
            setSession321(session)
            sessionStorage.removeItem(STORAGE_SESSION_KEY)
          }
        }
      } catch {
        /* ignore */
      }
    }
  }, [from321])

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 rounded-xl bg-zinc-900/50 border border-zinc-800">
        <button
          type="button"
          onClick={() => setMode('seal')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
            mode === 'seal'
              ? 'bg-purple-600 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Seal
        </button>
        <button
          type="button"
          onClick={() => setMode('forge')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition ${
            mode === 'forge'
              ? 'bg-amber-600 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Forge
        </button>
      </div>

      <p className="text-xs text-zinc-500">
        {mode === 'seal'
          ? 'Quick capture — a few words, optional emotion. Under 10 seconds.'
          : 'Full structure — title, description, visibility, move type, and more.'}
      </p>

      {mode === 'seal' ? (
        <ChargeCaptureForm submitLabel="Seal" loadingLabel="Sealing..." />
      ) : (
        <CreateBarForm setup={setup} prefill={prefill} session321={session321} />
      )}
    </div>
  )
}
