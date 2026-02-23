'use client'

import { useState } from 'react'
import { logAdminFeedback } from '@/actions/admin-feedback'

export function AdminFeedbackInput({ context }: { context?: any }) {
    const [feedback, setFeedback] = useState('')
    const [isPending, setIsPending] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

    async function handleSubmit() {
        if (!feedback.trim()) return

        setIsPending(true)
        const result = await logAdminFeedback(feedback, context)
        setIsPending(false)

        if (result.success) {
            setStatus('success')
            setFeedback('')
        } else {
            setStatus('error')
        }
    }

    if (status === 'success') {
        return (
            <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                ✅ Feedback logged to `.feedback/admin_feedback.jsonl`. The agent will pull this during the next cycle.
            </div>
        )
    }

    return (
        <div className="space-y-4 bg-zinc-900/50 p-4 border border-zinc-800 rounded-xl">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-tight">Signal Feed</h4>
            <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Log any edge cases, broken UI, or unexpected logic here..."
                className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-colors resize-none"
            />
            <button
                onClick={handleSubmit}
                disabled={isPending || !feedback.trim()}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-sm font-bold rounded-lg transition-all disabled:opacity-30 active:scale-[0.98]"
            >
                {isPending ? 'Propagating...' : 'Push Signal to Agent'}
            </button>
            {status === 'error' && (
                <p className="text-red-400 text-xs">Failed to log signal. Check console.</p>
            )}
        </div>
    )
}
