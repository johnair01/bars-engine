'use client'

import { useActionState } from 'react'
import { createBinding } from '@/actions/twine'

export function BindingForm({ storyId, passageNames }: { storyId: string; passageNames: string[] }) {
    const [state, formAction, isPending] = useActionState(createBinding, null)

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="storyId" value={storyId} />
            <input type="hidden" name="scopeType" value="passage" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Passage</label>
                    <select name="scopeId" required className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none">
                        <option value="">Select passage...</option>
                        {passageNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Action</label>
                    <select name="actionType" required className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none">
                        <option value="EMIT_QUEST">EMIT_QUEST</option>
                        <option value="EMIT_BAR">EMIT_BAR</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Title *</label>
                <input name="payloadTitle" required className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none" placeholder="Title for the emitted quest/BAR" />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Description</label>
                <textarea name="payloadDescription" rows={2} className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none resize-y" placeholder="Description / content..." />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Tags <span className="text-zinc-600 normal-case">(optional)</span></label>
                <input name="payloadTags" className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none" placeholder="comma-separated tags" />
            </div>

            {state?.error && <div className="p-2 bg-red-900/20 text-red-300 text-xs rounded-lg">{state.error}</div>}
            {state?.success && <div className="p-2 bg-green-900/20 text-green-300 text-xs rounded-lg">Binding created!</div>}

            <button type="submit" disabled={isPending} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-sm transition disabled:opacity-50">
                {isPending ? 'Saving...' : 'Create Binding'}
            </button>
        </form>
    )
}
