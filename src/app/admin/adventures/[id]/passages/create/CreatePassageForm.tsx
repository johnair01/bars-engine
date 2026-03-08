'use client'

import { useActionState, useState } from 'react'
import { createPassage } from './actions'
import { useFormStatus } from 'react-dom'
import { ChoiceBuilder, type Choice } from '@/components/admin/ChoiceBuilder'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
    >
      {pending ? 'Saving...' : 'Save Passage'}
    </button>
  )
}

type Passage = { id: string; nodeId: string; choices: string }

export function CreatePassageForm({
  adventureId,
  passages,
}: {
  adventureId: string
  passages: Passage[]
}) {
  const [state, formAction] = useActionState(createPassage, { success: false, message: '' })
  const [choices, setChoices] = useState<Choice[]>([{ text: 'Continue', targetId: 'node_0' }])
  const [linkFrom, setLinkFrom] = useState<{
    mode: 'after' | 'branch'
    passageId: string
    nodeId: string
    choiceIndex?: number
  } | null>(null)

  const targetOptions = passages.map((p) => p.nodeId)
  const hasPassages = passages.length > 0

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="adventureId" value={adventureId} />
      <input type="hidden" name="linkFrom" value={linkFrom ? JSON.stringify(linkFrom) : ''} />

      {state?.message && !state.success && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm">
          {state.message}
        </div>
      )}

      <div className="space-y-4">
        {hasPassages && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Connect from</label>
            <div className="space-y-2">
              <select
                value={linkFrom ? linkFrom.passageId : '__standalone__'}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '__standalone__') {
                    setLinkFrom(null)
                    return
                  }
                  const p = passages.find((x) => x.id === v)
                  if (p) setLinkFrom({ mode: 'after', passageId: p.id, nodeId: p.nodeId })
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="__standalone__">Standalone (link later)</option>
                {passages.map((p) => (
                  <option key={p.id} value={p.id}>
                    After {p.nodeId}
                  </option>
                ))}
              </select>
              {linkFrom && (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={linkFrom.mode === 'after'}
                      onChange={() => setLinkFrom({ ...linkFrom, mode: 'after' })}
                      className="text-indigo-500"
                    />
                    <span className="text-sm text-zinc-300">After (add Continue choice)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={linkFrom.mode === 'branch'}
                      onChange={() => setLinkFrom({ ...linkFrom, mode: 'branch' })}
                      className="text-indigo-500"
                    />
                    <span className="text-sm text-zinc-300">Branch (replace choice target)</span>
                  </label>
                </div>
              )}
              {linkFrom?.mode === 'branch' && (
                <select
                  value={linkFrom.choiceIndex ?? 0}
                  onChange={(e) =>
                    setLinkFrom({ ...linkFrom, choiceIndex: parseInt(e.target.value, 10) })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 text-sm"
                >
                  {(() => {
                    let opts: { text: string; targetId: string }[] = []
                    try {
                      opts = JSON.parse(
                        passages.find((x) => x.id === linkFrom.passageId)?.choices ?? '[]'
                      )
                    } catch {
                      /* ignore */
                    }
                    return opts.map((c, i) => (
                      <option key={i} value={i}>
                        {c.text} → {c.targetId}
                      </option>
                    ))
                  })()}
                </select>
              )}
            </div>
            {!linkFrom && (
              <p className="text-amber-500/80 text-xs mt-1.5">
                You&apos;ll need to edit another passage later to link here.
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="nodeId" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Node ID
          </label>
          <input
            type="text"
            name="nodeId"
            id="nodeId"
            required
            pattern="^[a-zA-Z0-9_-]+$"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
            placeholder={hasPassages ? `e.g. node_${passages.length}` : 'e.g. node_0'}
          />
          <p className="text-zinc-500 text-xs mt-1.5">
            No spaces. Used for linking passages (e.g., targetId in choices).
          </p>
          {state?.errors?.nodeId && (
            <p className="text-red-400 text-sm mt-1">{state.errors.nodeId[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="text" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Passage Text (Markdown + Macros)
          </label>
          <textarea
            name="text"
            id="text"
            required
            rows={12}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
            placeholder="Type your story here..."
          />
          {state?.errors?.text && (
            <p className="text-red-400 text-sm mt-1">{state.errors.text[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Choices</label>
          <ChoiceBuilder
            choices={choices}
            onChange={setChoices}
            targetOptions={targetOptions}
            name="choices"
          />
          {state?.errors?.choicesJson && (
            <p className="text-red-400 text-sm mt-1">{state.errors.choicesJson[0]}</p>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-800">
        <SubmitButton />
      </div>
    </form>
  )
}
