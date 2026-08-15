'use client'

import { useState, useTransition } from 'react'
import { submitIntroduction, type IntroductionState } from '@/actions/introductions'
import { CORRIDOR, LEAD_KINDS } from '@/lib/tour-leads/corridor'

const field =
  'min-h-11 w-full rounded-xl border border-zinc-700 bg-[#111110] px-4 text-sm text-[#e8e6e0] placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none'

export function IntroductionForm() {
  const [place, setPlace] = useState('')
  const [city, setCity] = useState('')
  const [kind, setKind] = useState<string>(LEAD_KINDS[0].key)
  const [canIntroduce, setCanIntroduce] = useState(false)
  const [note, setNote] = useState('')
  const [submitterName, setName] = useState('')
  const [submitterEmail, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<IntroductionState | null>(null)
  const [pending, startTransition] = useTransition()

  if (state?.ok) {
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-700/60 bg-emerald-950/30 p-6">
        <p className="text-sm font-semibold text-emerald-100">{state.message}</p>
        <button
          type="button"
          onClick={() => {
            setState(null)
            setPlace('')
            setCity('')
            setNote('')
            setCanIntroduce(false)
          }}
          className="text-sm text-emerald-200 underline underline-offset-4"
        >
          Add another
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        startTransition(async () => {
          setState(
            await submitIntroduction({
              place,
              city,
              kind,
              canIntroduce,
              note,
              submitterName,
              submitterEmail,
              consent,
            }),
          )
        })
      }}
      className="space-y-5 rounded-2xl border border-zinc-800 bg-black/40 p-5 sm:p-6"
    >
      <label className="block text-sm font-semibold text-zinc-100">
        The place
        <span className="mt-1 block text-xs font-normal text-zinc-500">
          A shop, a hall, an organization, a show. Somewhere rather than someone.
        </span>
        <input
          required
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          className={`${field} mt-2`}
          placeholder="Powell's, the union hall, a podcast you like"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-zinc-100">
          Town
          <input
            required
            list="corridor-cities"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={`${field} mt-2`}
            placeholder="Portland"
          />
          <datalist id="corridor-cities">
            {CORRIDOR.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>
        </label>

        <label className="block text-sm font-semibold text-zinc-100">
          What kind
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className={`${field} mt-2`}
          >
            {LEAD_KINDS.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={canIntroduce}
          onChange={(e) => setCanIntroduce(e.target.checked)}
          className="mt-1 size-4 accent-emerald-500"
        />
        <span>
          I know somebody there and I am willing to make the introduction myself.
          <span className="mt-1 block text-xs text-zinc-500">
            Leave this unticked and it is still a good lead. I will chase it cold.
          </span>
        </span>
      </label>

      <label className="block text-sm font-semibold text-zinc-100">
        Anything worth knowing
        <span className="mt-1 block text-xs font-normal text-zinc-500">
          Optional. What they care about, who runs it, when they programme.
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={`${field} mt-2 min-h-24 py-3`}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-zinc-100">
          Your name
          <input
            value={submitterName}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className={`${field} mt-2`}
          />
        </label>
        <label className="block text-sm font-semibold text-zinc-100">
          Your email <span className="text-emerald-300">*</span>
          <input
            required
            type="email"
            value={submitterEmail}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={`${field} mt-2`}
          />
        </label>
      </div>

      <label className="flex items-start gap-3 text-xs leading-5 text-zinc-400">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 size-4 accent-emerald-500"
        />
        <span>
          You can write back to me about this lead. Used for the tour and nothing else.
        </span>
      </label>

      {state && !state.ok && (
        <p className="rounded-xl border border-amber-700/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? 'Adding…' : 'Add it to the board'}
      </button>
    </form>
  )
}
