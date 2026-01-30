'use client'

import { joinWithInvite } from '@/actions/auth'
import { useActionState } from 'react'

export function InviteForm({ token }: { token: string }) {
    const [state, action, isPending] = useActionState(joinWithInvite, null)

    return (
        <form action={action} className="w-full">
            <input type="hidden" name="inviteToken" value={token} />
            {/* Stubbing required fields for MVP flow */}
            <input type="hidden" name="name" value="Guest" />
            <input type="hidden" name="contactType" value="email" />
            <input type="hidden" name="contactValue" value={`guest_${Date.now()}@example.com`} />

            {state?.error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 text-red-200 text-sm text-center">
                    {state.error}
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-zinc-100 hover:bg-white text-black py-4 text-lg uppercase tracking-widest font-light transition-all disabled:opacity-50"
            >
                {isPending ? 'Entering...' : 'Enter'}
            </button>
        </form>
    )
}
