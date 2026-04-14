'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import type { GameplayImportKind, ImportPreviewRow } from '@/lib/book-gameplay-import-types'
import { commitImportBookGameplay, previewImportBookGameplay } from '@/actions/book-gameplay-import'

type SectionOpt = { id: string; title: string }

export function BookGameplayImportClient({
  targetBookId,
  sourceBookId,
  targetSections,
}: {
  targetBookId: string
  sourceBookId: string
  targetSections: SectionOpt[]
}) {
  const [items, setItems] = useState<ImportPreviewRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [kinds, setKinds] = useState<GameplayImportKind[]>(['quest', 'move', 'bar'])
  const [targetSectionId, setTargetSectionId] = useState(targetSections[0]?.id ?? '')
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const load = useCallback(() => {
    setMsg(null)
    startTransition(async () => {
      const r = await previewImportBookGameplay({ targetBookId, sourceBookId, kinds })
      if ('error' in r) setMsg(r.error ?? 'Preview failed')
      else {
        setItems(r.items)
        setSelected(new Set())
      }
    })
  }, [targetBookId, sourceBookId, kinds])

  useEffect(() => {
    let cancelled = false
    void previewImportBookGameplay({ targetBookId, sourceBookId, kinds }).then((r) => {
      if (cancelled) return
      if ('error' in r) setMsg(r.error ?? 'Preview failed')
      else {
        setItems(r.items)
        setSelected(new Set())
      }
    })
    return () => {
      cancelled = true
    }
  }, [targetBookId, sourceBookId, kinds])

  const prefixed = useMemo(
    () =>
      items.map((it) => ({
        ...it,
        ref: `${it.kind}:${it.id}` as const,
      })),
    [items]
  )

  const toggle = (ref: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(ref)) next.delete(ref)
      else next.add(ref)
      return next
    })
  }

  const anyBar = useMemo(
    () => [...selected].some((r) => r.startsWith('bar:')),
    [selected]
  )

  const commit = () => {
    setMsg(null)
    startTransition(async () => {
      if (anyBar && !targetSectionId) {
        setMsg('Pick a target section for BAR imports.')
        return
      }
      const r = await commitImportBookGameplay({
        targetBookId,
        sourceBookId,
        selectedIds: [...selected],
        mode: 'link',
        targetSectionId: anyBar ? targetSectionId : undefined,
      })
      if ('error' in r) setMsg(r.error ?? 'Import failed')
      else {
        setMsg(`Imported ${r.imported} row(s).`)
        load()
      }
    })
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-zinc-500">Kinds:</span>
        {(['quest', 'move', 'bar'] as const).map((k) => (
          <label key={k} className="flex items-center gap-1 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={kinds.includes(k)}
              onChange={() =>
                setKinds((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]))
              }
              className="rounded border-zinc-600 bg-zinc-800"
            />
            {k}
          </label>
        ))}
        <button
          type="button"
          onClick={load}
          disabled={pending}
          className="text-xs text-violet-400 hover:text-violet-300 disabled:opacity-40"
        >
          Refresh preview
        </button>
      </div>

      {msg && (
        <p
          className={`text-sm ${/error|not found|required|No rows|must use|not implemented|not automated/i.test(msg) ? 'text-red-400' : 'text-emerald-400'}`}
        >
          {msg}
        </p>
      )}

      {prefixed.length === 0 ? (
        <p className="text-sm text-zinc-500">No importable rows for these kinds (empty preview).</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {prefixed.map((row) => (
            <li key={row.ref} className="flex gap-2 items-start border border-zinc-800 rounded p-2">
              <input
                type="checkbox"
                checked={selected.has(row.ref)}
                onChange={() => toggle(row.ref)}
                className="mt-1 rounded border-zinc-600 bg-zinc-800"
                disabled={pending}
              />
              <div>
                <span className="text-xs text-zinc-500 uppercase">{row.kind}</span>
                <p className="text-zinc-200">{row.title}</p>
                {row.detail && <p className="text-xs text-zinc-600">{row.detail}</p>}
                <code className="text-xs text-zinc-500">{row.id}</code>
              </div>
            </li>
          ))}
        </ul>
      )}

      {anyBar && (
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Attach imported BARs to section</label>
          <select
            value={targetSectionId}
            onChange={(e) => setTargetSectionId(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white max-w-md"
            disabled={pending}
          >
            {targetSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        disabled={pending || selected.size === 0}
        onClick={commit}
        className="rounded bg-amber-800 px-3 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-40"
      >
        Commit import (link mode)
      </button>
      <p className="text-xs text-zinc-600">
        Quests append to the target book&apos;s thread (creates thread if missing). BARs attach as{' '}
        <code className="text-zinc-500">SectionBARLink</code> on the chosen section. Moves require manual handling in v1.
      </p>
    </div>
  )
}
