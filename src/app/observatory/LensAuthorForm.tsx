'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { authorLens } from '@/actions/observatory'

const mono = 'var(--bars-font-mono)'
const display = 'var(--bars-font-display)'
const body = 'var(--bars-font-body)'
const purple = 'var(--bars-liminal)'

/** Author/edit the vision or orientation lens (the two felt, player-authored levels). */
export function LensAuthorForm({
  level,
  initialTitle,
  initialDescription,
}: {
  level: 'vision' | 'orientation'
  initialTitle: string
  initialDescription: string
}) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const save = () => {
    setError(null)
    startTransition(async () => {
      const res = await authorLens({ level, title, description })
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', margin: '0 0 7px' }}>
        {level === 'vision' ? 'Name the horizon you are aiming at' : 'Name how you are oriented'}
      </p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={level === 'vision' ? 'Your vision…' : 'Your orientation…'}
        style={{ width: '100%', minHeight: 44, border: '1px solid var(--bars-line)', borderRadius: 8, background: 'var(--bars-surface-card)', padding: '0 12px', fontFamily: body, fontSize: 14, color: 'var(--bars-text-primary)', outline: 'none' }}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Say more (optional)…"
        rows={4}
        style={{ width: '100%', resize: 'none', marginTop: 8, border: '1px solid var(--bars-line)', borderRadius: 8, background: 'var(--bars-surface-card)', padding: 12, fontFamily: body, fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-primary)', outline: 'none' }}
      />
      {error && <p style={{ fontFamily: body, fontSize: 12.5, color: '#e05c2e', margin: '8px 0 0' }}>{error}</p>}
      <button
        type="button"
        disabled={pending || !title.trim()}
        onClick={save}
        className="w-full"
        style={{ marginTop: 10, minHeight: 48, borderRadius: 8, background: title.trim() ? purple : 'var(--bars-surface-card)', color: title.trim() ? '#fff' : 'var(--bars-text-muted)', fontFamily: display, fontWeight: 800, fontSize: 15, boxShadow: 'inset 0 1px 0 var(--bars-inset-top)', opacity: pending ? 0.6 : 1 }}
      >
        Save
      </button>
    </div>
  )
}
