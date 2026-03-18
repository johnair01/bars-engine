'use client'

import { useActionState, useEffect } from 'react'
import { claimBarShareFromForm } from '@/actions/bars'
import { useRouter } from 'next/navigation'

export function ClaimShareForm({ shareToken }: { shareToken: string }) {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(claimBarShareFromForm, null)

    useEffect(() => {
        if (state?.barId) router.push(`/bars/${state.barId}`)
    }, [state?.barId, router])

    return (
        <form action={formAction} className="space-y-3">
            <input type="hidden" name="shareToken" value={shareToken} />
            <button
                type="submit"
                disabled={isPending}
                className="block w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-center"
            >
                {isPending ? 'Claiming...' : 'View BAR'}
            </button>
            {state?.error && <p className="text-sm text-red-400 text-center">{state.error}</p>}
        </form>
    )
}
