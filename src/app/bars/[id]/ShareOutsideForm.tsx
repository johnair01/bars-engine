'use client'

import { useActionState, useEffect, useRef } from 'react'
import { sendBarExternal } from '@/actions/bars'

export function ShareOutsideForm({ barId }: { barId: string }) {
    const [state, formAction, isPending] = useActionState(sendBarExternal, null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (state && 'success' in state && inputRef.current) {
            inputRef.current.select()
        }
    }, [state])

    const fullUrl =
        state && 'success' in state
            ? (state.shareUrl ?? state.inviteUrl).startsWith('http')
                ? (state.shareUrl ?? state.inviteUrl)
                : typeof window !== 'undefined'
                  ? `${window.location.origin}${state.shareUrl ?? state.inviteUrl}`
                  : state.shareUrl ?? state.inviteUrl
            : ''

    return (
        <div className="space-y-4">
            {state && 'success' in state ? (
                <div className="space-y-3">
                    <p className="text-sm text-zinc-400">
                        Share this link. When they sign up, they'll receive this BAR.
                    </p>
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            readOnly
                            value={fullUrl}
                            className="flex-1 rounded-lg bg-black border border-zinc-700 px-3 py-2.5 text-xs text-zinc-300 font-mono focus:border-purple-500 outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(fullUrl)}
                            className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm font-medium transition-colors"
                        >
                            Copy
                        </button>
                    </div>
                </div>
            ) : (
                <form action={formAction}>
                    <input type="hidden" name="barId" value={barId} />
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
                    >
                        {isPending ? 'Generating link...' : 'Generate Invite Link'}
                    </button>
                    <p className="text-xs text-zinc-600 mt-2 text-center">
                        Creates a sign-up link. They'll receive this BAR when they join.
                    </p>
                </form>
            )}

            {state && 'error' in state && (
                <p className="text-sm text-red-400 text-center">{state.error}</p>
            )}
        </div>
    )
}
