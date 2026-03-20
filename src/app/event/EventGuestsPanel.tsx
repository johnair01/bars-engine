'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  listEventParticipantsForManage,
  markEventParticipantAttended,
} from '@/actions/campaign-invitation'

type Row = {
  id: string
  participantId: string
  name: string
  participantState: string
  functionalRole: string | null
}

export function EventGuestsPanel({ instanceId, eventId }: { instanceId: string; eventId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkInId, setCheckInId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    const r = await listEventParticipantsForManage(instanceId, eventId)
    setLoading(false)
    if ('error' in r && r.error) {
      setErr(r.error)
      setRows([])
      return
    }
    if ('participants' in r) setRows(r.participants)
  }, [instanceId, eventId])

  useEffect(() => {
    if (!open) return
    void load()
  }, [open, load])

  async function handleCheckIn(rowId: string) {
    setCheckInId(rowId)
    setErr(null)
    const r = await markEventParticipantAttended(instanceId, eventId, rowId)
    setCheckInId(null)
    if ('error' in r) {
      setErr(r.error)
      return
    }
    await load()
    router.refresh()
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => {
          if (!open) setErr(null)
          setOpen(!open)
        }}
        className="text-[11px] font-semibold text-zinc-500 hover:text-amber-400/90"
      >
        {open ? '▼ Hide guests' : '▸ Guests & check-in'}
      </button>
      {open && (
        <div className="mt-2 pl-1 border-l border-amber-900/30 space-y-2">
          {loading && <p className="text-xs text-zinc-600">Loading…</p>}
          {err && <p className="text-xs text-red-400">{err}</p>}
          {!loading && !err && rows.length === 0 && (
            <p className="text-xs text-zinc-600">No participants yet.</p>
          )}
          <ul className="space-y-1.5">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-2 text-xs text-zinc-400"
              >
                <span className="text-zinc-300">{r.name}</span>
                <span className="font-mono text-[10px] uppercase text-zinc-600">
                  {r.participantState}
                </span>
                {r.functionalRole && (
                  <span className="text-[10px] text-amber-700/80">{r.functionalRole}</span>
                )}
                {['RSVP_yes', 'attending'].includes(r.participantState) && (
                  <button
                    type="button"
                    disabled={checkInId === r.id}
                    onClick={() => void handleCheckIn(r.id)}
                    className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 disabled:opacity-40"
                  >
                    {checkInId === r.id ? '…' : 'Check in'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
