'use client'

import { updateAdventureStartNode } from '../actions'
import { useFormStatus } from 'react-dom'

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending || disabled}
            className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
        >
            {pending ? 'Saving...' : 'Save'}
        </button>
    )
}

export function StartNodeForm({
    adventureId,
    passages,
    currentStartNodeId
}: {
    adventureId: string
    passages: { nodeId: string }[]
    currentStartNodeId: string | null
}) {
    return (
        <form action={updateAdventureStartNode} className="space-y-2">
            <input type="hidden" name="adventureId" value={adventureId} />
            <select
                name="startNodeId"
                defaultValue={currentStartNodeId ?? ''}
                disabled={passages.length === 0}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
                <option value="">— Not set —</option>
                {passages.map((p) => (
                    <option key={p.nodeId} value={p.nodeId}>
                        {p.nodeId}
                    </option>
                ))}
            </select>
            <SubmitButton disabled={passages.length === 0} />
        </form>
    )
}
