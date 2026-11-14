'use client'

import { useMemo, useState } from 'react'

const positions = [
  { id: 'one', label: 'First position', hint: 'A role, pull, or move in the pattern — not a person to blame.' },
  { id: 'two', label: 'Second position', hint: 'What does the pattern recruit someone or something to do here?' },
  { id: 'three', label: 'Third position', hint: 'What completes or stabilizes the loop?' },
]

const interfaces = [
  ['Witness the field', 'Notice when, where, and with whom the triangle becomes most stable.'],
  ['Name the adhesion', 'Identify the belief, agreement, fear, or payoff that keeps the loop cycling.'],
  ['Protect the value', 'Separate the value worth keeping from the form that creates harm.'],
  ['Introduce mobility', 'Choose one small variation that makes the fixed pattern less compulsory.'],
  ['Change the conditions', 'Add a boundary, support, pause, or environmental change before engaging the roles.'],
] as const

export function TrianglePractice() {
  const [roles, setRoles] = useState<Record<string, string>>({})
  const [values, setValues] = useState<Record<string, string>>({})
  const [operation, setOperation] = useState('Witness the field')
  const [nextMove, setNextMove] = useState('')
  const [revealed, setRevealed] = useState(false)

  const mapped = positions.every(({ id }) => roles[id]?.trim())
  const valued = positions.every(({ id }) => values[id]?.trim())
  const operationDescription = useMemo(
    () => interfaces.find(([name]) => name === operation)?.[1],
    [operation],
  )

  return (
    <section className="mt-7 space-y-5">
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">Practice one · make the triangle visible</p>
        <h2 className="mt-2 text-lg font-medium text-teal-100">Name the pattern, not the culprit.</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-300">Place the three positions. A position can be an impulse, a story, an absence, a system, or a person — but describe its function before its identity.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {positions.map(({ id, label, hint }, index) => (
            <label key={id} className="rounded-lg border border-teal-300/20 bg-teal-950/20 p-3">
              <span className="text-xs font-medium text-teal-100">{index + 1}. {label}</span>
              <textarea
                value={roles[id] ?? ''}
                onChange={(event) => setRoles((current) => ({ ...current, [id]: event.target.value }))}
                placeholder={hint}
                className="mt-2 min-h-24 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950/80 p-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-teal-400 focus:outline-none"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">Keep the gold</p>
        <h2 className="mt-2 text-lg font-medium text-teal-100">What is each position trying to preserve?</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-300">A disempowering form can still be attempting to protect something tender, true, or necessary. Find the value without endorsing the loop.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {positions.map(({ id, label }) => (
            <label key={id} className="block text-xs font-medium text-zinc-300">
              {label}
              <textarea
                value={values[id] ?? ''}
                onChange={(event) => setValues((current) => ({ ...current, [id]: event.target.value }))}
                placeholder="The value worth keeping…"
                className="mt-2 min-h-20 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950/80 p-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-teal-400 focus:outline-none"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-teal-300/25 bg-teal-950/25 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">First interface</p>
        <h2 className="mt-2 text-lg font-medium text-teal-100">Work with what keeps the pattern in place.</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-300">This is preparatory practice inspired by the first 8th-Ray transmission, not a completed clearing protocol. Start with the pattern’s stabilizing conditions before trying to alter its parts.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {interfaces.map(([name, description]) => (
            <button
              key={name}
              type="button"
              onClick={() => setOperation(name)}
              className={`rounded-lg border p-3 text-left transition ${operation === name ? 'border-teal-300 bg-teal-500/20 text-white' : 'border-zinc-700 bg-zinc-950/50 text-zinc-300 hover:border-teal-400/50'}`}
            >
              <span className="block text-sm font-medium">{name}</span>
              <span className="mt-1 block text-xs leading-5 text-zinc-400">{description}</span>
            </button>
          ))}
        </div>
        <label className="mt-5 block text-sm font-medium text-teal-100">
          One next move outside this room
          <textarea
            value={nextMove}
            onChange={(event) => setNextMove(event.target.value)}
            placeholder="A small, observable move I am willing to try…"
            className="mt-2 min-h-20 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950/80 p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-teal-400 focus:outline-none"
          />
        </label>
        <button
          type="button"
          disabled={!mapped || !valued || !nextMove.trim()}
          onClick={() => setRevealed(true)}
          className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Set the next move
        </button>
        {revealed && (
          <div className="mt-4 rounded-lg border border-teal-300/30 bg-zinc-950/50 p-4 text-sm leading-6 text-zinc-200">
            <p><span className="font-medium text-teal-100">{operation}:</span> {operationDescription}</p>
            <p className="mt-2">Your experiment: <span className="text-white">{nextMove}</span></p>
            <p className="mt-2 text-xs text-zinc-500">This first version stays in this browser session; nothing is saved or shared yet.</p>
          </div>
        )}
      </div>
    </section>
  )
}
