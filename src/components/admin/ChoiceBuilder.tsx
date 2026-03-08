'use client'

export type Choice = { text: string; targetId: string }

const RESERVED_TARGETS = ['signup', 'Game_Login', 'node_0']

type Props = {
  choices: Choice[]
  onChange: (choices: Choice[]) => void
  targetOptions: string[]
  name?: string
}

export function ChoiceBuilder({ choices, onChange, targetOptions, name = 'choices' }: Props) {
  const allTargets = [...new Set([...RESERVED_TARGETS, ...targetOptions])]

  const update = (index: number, field: 'text' | 'targetId', value: string) => {
    const next = [...choices]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  const add = () => onChange([...choices, { text: 'Continue', targetId: allTargets[0] ?? 'node_0' }])
  const remove = (index: number) => onChange(choices.filter((_, i) => i !== index))

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(choices)} readOnly />
      {choices.map((c, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            value={c.text}
            onChange={(e) => update(i, 'text', e.target.value)}
            placeholder="Choice text"
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <span className="text-zinc-500">→</span>
          <select
            value={c.targetId}
            onChange={(e) => update(i, 'targetId', e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[140px]"
          >
            {allTargets.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-zinc-500 hover:text-red-400 text-sm px-2"
            aria-label="Remove choice"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-sm text-indigo-400 hover:text-indigo-300"
      >
        + Add choice
      </button>
    </div>
  )
}
