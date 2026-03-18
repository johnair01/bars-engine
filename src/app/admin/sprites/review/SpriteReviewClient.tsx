'use client'

import { useState } from 'react'
import { rejectSpriteReview } from '@/actions/sprite-review'

export function RejectButton({ auditLogId }: { auditLogId: string }) {
    const [note, setNote] = useState('')
    const [open, setOpen] = useState(false)

    async function handleReject() {
        await rejectSpriteReview(auditLogId, note)
        setOpen(false)
    }

    if (!open) return (
        <button onClick={() => setOpen(true)} className="text-red-400 hover:text-red-300 text-sm">Reject</button>
    )
    return (
        <div className="flex gap-2 items-center">
            <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Rejection note..."
                className="bg-zinc-800 border border-zinc-700 rounded p-1 text-sm text-white"
            />
            <button onClick={handleReject} className="text-red-400 hover:text-red-300 text-sm">Confirm</button>
            <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-400 text-sm">Cancel</button>
        </div>
    )
}
