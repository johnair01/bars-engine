'use client'

import { useActionState, useState } from 'react'
import { joinWithInvite } from '@/actions/auth'

const initialState = {
    error: '',
}

export function InviteForm({ token, theme }: { token: string, theme?: string }) {
    const [state, formAction, isPending] = useActionState(joinWithInvite, initialState)
    const [declined, setDeclined] = useState(false)

    // "Ocean's 11" Theme: The Professionals
    if (theme === 'oceans11') {
        if (declined) {
            return (
                <div className="text-center p-8 bg-black border border-zinc-800 rounded-2xl animate-in fade-in zoom-in duration-500">
                    <h2 className="text-2xl font-serif text-zinc-500 mb-4">Understood.</h2>
                    <p className="text-zinc-600">The file has been burned. We never had this conversation.</p>
                </div>
            )
        }

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="space-y-4">
                    <div className="border-l-2 border-amber-600 pl-4">
                        <h1 className="text-4xl font-serif text-white tracking-wide">
                            THE COALITION IS ASSEMBLING.
                        </h1>
                    </div>
                    <div className="text-zinc-400 text-lg font-light leading-relaxed space-y-4">
                        <p>We have a job. It was supposed to be simple. Standard operating procedure. But the situation has become... complicated.</p>
                        <p>We need your specific talents to untangle the knot. The stakes are personal. The pay is glory. The risk is total.</p>
                    </div>
                </div>

                <form action={formAction} className="bg-zinc-900/30 p-8 rounded-xl border border-zinc-800 space-y-6">
                    <input type="hidden" name="inviteToken" value={token} />

                    {state?.error && (
                        <div className="p-3 bg-red-900/20 border border-red-800 text-red-200 text-sm">
                            {state.error}
                        </div>
                    )}

                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-zinc-500">Codename</label>
                            <input
                                name="name"
                                required
                                placeholder="Who are you in the dark?"
                                className="w-full bg-black border border-zinc-700 rounded-none px-4 py-3 text-white font-mono focus:border-amber-600 focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-zinc-500">Secure Channel</label>
                            <input
                                name="contactValue"
                                required
                                placeholder="How do we reach you?"
                                className="w-full bg-black border border-zinc-700 rounded-none px-4 py-3 text-white font-mono focus:border-amber-600 focus:outline-none transition-colors"
                            />
                            <input type="hidden" name="contactType" value="email" />
                        </div>
                    </div>

                    <div className="pt-6 space-y-3">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-4 px-6 text-lg tracking-widest uppercase transition-all disabled:opacity-50"
                        >
                            {isPending ? 'Authenticating...' : "You son of a bitch, I'm in."}
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setDeclined(true)}
                                className="w-full bg-transparent border border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 py-3 text-xs uppercase tracking-wider transition-all"
                            >
                                I'm too old for this sh*t.
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeclined(true)}
                                className="w-full bg-transparent border border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 py-3 text-xs uppercase tracking-wider transition-all"
                            >
                                I had a bad experience.
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        )
    }

    // Default Theme
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
