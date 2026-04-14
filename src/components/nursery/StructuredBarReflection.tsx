'use client'

import { useState } from 'react'
import type { BarIntegration, ReflectionSchema } from '@/lib/nation/move-library-accessor'

/**
 * Structured BAR Reflection Form — renders the move's bar_prompt_template
 * and 4-field reflection schema.
 *
 * Every move in the library defines:
 *   bar_prompt_template: "From [Move], I learned that ______."
 *   reflection_schema.required_fields: [what_i_did, what_happened, what_resistance_appeared, what_changed]
 *   reflection_schema.bar_prompt: contextual prompt for this move's BAR
 */

type Props = {
  moveName: string
  barIntegration: BarIntegration
  reflectionSchema: ReflectionSchema
  onComplete: (reflection: {
    barText: string
    fields: Record<string, string>
  }) => void
  /** Optional face-voiced closing framing */
  framing?: string
}

const FIELD_LABELS: Record<string, string> = {
  what_i_did: 'What I did',
  what_happened: 'What happened',
  what_resistance_appeared: 'What resistance appeared',
  what_changed: 'What changed',
}

const FIELD_PLACEHOLDERS: Record<string, string> = {
  what_i_did: 'I sat with my fear and named it...',
  what_happened: 'When I did that, I noticed...',
  what_resistance_appeared: 'The part of me that resisted was...',
  what_changed: 'After this, I feel...',
}

export function StructuredBarReflection({
  moveName,
  barIntegration,
  reflectionSchema,
  onComplete,
  framing,
}: Props) {
  const [barText, setBarText] = useState('')
  const [fields, setFields] = useState<Record<string, string>>(
    Object.fromEntries(reflectionSchema.required_fields.map(f => [f, '']))
  )

  const allFieldsFilled = reflectionSchema.required_fields.every(
    f => (fields[f] ?? '').trim().length > 0
  )
  const barFilled = barText.trim().length > 0
  const canSubmit = barFilled && allFieldsFilled

  function handleSubmit() {
    onComplete({ barText, fields })
  }

  // Parse the template to show the fill-in-the-blank
  const templateParts = barIntegration.bar_prompt_template.split('______')

  return (
    <div className="space-y-5">
      {framing && (
        <p className="text-zinc-400 text-sm italic">&ldquo;{framing}&rdquo;</p>
      )}

      {/* BAR prompt */}
      <div className="space-y-2">
        <p className="text-zinc-300 text-sm font-medium">{reflectionSchema.bar_prompt}</p>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3">
          <div className="flex items-baseline gap-1 flex-wrap">
            {templateParts[0] && (
              <span className="text-zinc-400 text-sm">{templateParts[0]}</span>
            )}
            <input
              type="text"
              value={barText}
              onChange={e => setBarText(e.target.value)}
              placeholder="your insight here"
              className="flex-1 min-w-[200px] bg-transparent border-b border-zinc-600 text-zinc-200 text-sm py-1 px-1 focus:outline-none focus:border-purple-400 placeholder:text-zinc-600"
              autoFocus
            />
            {templateParts[1] && (
              <span className="text-zinc-400 text-sm">{templateParts[1]}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className={`px-1.5 py-0.5 rounded ${
            barIntegration.bar_type === 'insight'
              ? 'bg-blue-900/30 text-blue-400'
              : 'bg-amber-900/30 text-amber-400'
          }`}>
            {barIntegration.bar_type}
          </span>
          <span>{moveName}</span>
        </div>
      </div>

      {/* 4-field reflection */}
      <div className="space-y-3 border-t border-zinc-800 pt-4">
        <p className="text-zinc-500 text-xs uppercase tracking-wider">Reflection</p>

        {reflectionSchema.required_fields.map(field => (
          <div key={field} className="space-y-1">
            <label className="text-zinc-400 text-xs font-medium">
              {FIELD_LABELS[field] ?? field.replace(/_/g, ' ')}
            </label>
            <textarea
              value={fields[field] ?? ''}
              onChange={e =>
                setFields(prev => ({ ...prev, [field]: e.target.value }))
              }
              placeholder={FIELD_PLACEHOLDERS[field] ?? ''}
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-colors"
      >
        Seal this commitment
      </button>
    </div>
  )
}
