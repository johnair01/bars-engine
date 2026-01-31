'use client'

import { useActionState } from 'react'
import { joinWithInvite } from '@/actions/auth'

const initialState = {
    error: '',
}

export function InviteForm({ token }: { token: string }) {
    const [state, formAction, isPending] = useActionState(joinWithInvite, initialState)

    return (
        <form action={formAction} className="space-y-6 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
            <input type="hidden" name="inviteToken" value={token} />

            {state?.error && (
                <div className="p-3 bg-red-900/30 border border-red-500/30 text-red-200 text-sm rounded">
                    {state.error}
                </div>
            )}

            <div className="space-y-2 text-left">
                <label htmlFor="name" className="text-sm font-medium text-zinc-400">
                    Agent Designation (Name)
                </label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Neo, Alice, 007"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="space-y-2 sm:col-span-1">
                    <label htmlFor="contactType" className="text-sm font-medium text-zinc-400">
                        Type
                    </label>
                    <select
                        id="contactType"
                        name="contactType"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
                    >
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                    </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="contactValue" className="text-sm font-medium text-zinc-400">
                        Contact
                    </label>
                    <input
                        id="contactValue"
                        name="contactValue"
                        type="text"
                        required
                        placeholder="contact@example.com"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    />
                </div>
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-white text-black font-bold h-12 rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-wait"
                >
                    {isPending ? 'Connecting...' : (
                        <>
                            <span>Accept Assignment</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}
