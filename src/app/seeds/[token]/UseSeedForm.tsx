'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UseSeedFormProps {
  token: string
  usageMode: string
  customizableFields: string[]
  templatePreview: any
}

export function UseSeedForm({
  token,
  usageMode,
  customizableFields,
  templatePreview,
}: UseSeedFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'instant' | 'customize'>('instant')
  const [customizations, setCustomizations] = useState<Record<string, string>>({})

  const supportsInstant = usageMode === 'instant' || usageMode === 'both'
  const supportsCustomize = usageMode === 'customize' || usageMode === 'both'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const body: any = { mode }

      if (mode === 'customize' && Object.keys(customizations).length > 0) {
        body.customizations = customizations
      }

      const response = await fetch(`/api/seeds/use/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to use seed')
      }

      // Redirect to the newly created artifact
      if (data.artifact?.id) {
        router.push(`/bars/${data.artifact.id}`)
      } else {
        throw new Error('No artifact ID returned')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {supportsInstant && supportsCustomize && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('instant')}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              mode === 'instant'
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            Instant Copy
          </button>
          <button
            type="button"
            onClick={() => setMode('customize')}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
              mode === 'customize'
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            Customize
          </button>
        </div>
      )}

      {mode === 'customize' && customizableFields.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
            Customize fields
          </h3>
          {customizableFields.map((field) => (
            <div key={field} className="space-y-1">
              <label className="text-sm text-zinc-400" htmlFor={`field-${field}`}>
                {field}
              </label>
              {field === 'description' ? (
                <textarea
                  id={`field-${field}`}
                  value={customizations[field] || templatePreview?.[field] || ''}
                  onChange={(e) =>
                    setCustomizations({ ...customizations, [field]: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-300 resize-none"
                  rows={3}
                  placeholder={templatePreview?.[field] || ''}
                />
              ) : (
                <input
                  type="text"
                  id={`field-${field}`}
                  value={customizations[field] || templatePreview?.[field] || ''}
                  onChange={(e) =>
                    setCustomizations({ ...customizations, [field]: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-300"
                  placeholder={templatePreview?.[field] || ''}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || (mode === 'customize' && customizableFields.length > 0 && Object.keys(customizations).length === 0)}
        className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-900 disabled:text-zinc-600 text-white rounded-lg transition-colors font-medium"
      >
        {loading ? 'Creating...' : mode === 'instant' ? 'Create instant copy' : 'Create customized copy'}
      </button>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {mode === 'instant' && (
        <p className="text-xs text-zinc-500">
          This will create an exact copy of the template.
        </p>
      )}
    </form>
  )
}
