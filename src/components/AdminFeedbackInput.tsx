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
        <div className="space-y-4">
            <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Log any edge cases, broken UI, or unexpected logic here..."
                className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-colors"
            />
            <button
                onClick={handleSubmit}
                disabled={isPending || !feedback.trim()}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg transition-all disabled:opacity-50"
            >
                {isPending ? 'Logging...' : 'Push to Agent Feedback Log'}
            </button>
            {status === 'error' && (
                <p className="text-red-400 text-xs">Failed to log feedback. Check console.</p>
            )}
        </div>
    )
}
