"use client"

import { useActionState } from "react"
import { createPassage } from "./actions"
import { useFormStatus } from "react-dom"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
            {pending ? "Saving..." : "Save Passage"}
        </button>
    )
}

export function CreatePassageForm({ adventureId }: { adventureId: string }) {
    const [state, formAction] = useActionState(createPassage, { success: false, message: "" })

    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="adventureId" value={adventureId} />

            {state?.message && !state.success && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm">
                    {state.message}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label htmlFor="nodeId" className="block text-sm font-medium text-zinc-300 mb-1.5">
                        Node ID
                    </label>
                    <input
                        type="text"
                        name="nodeId"
                        id="nodeId"
                        required
                        pattern="^[a-zA-Z0-9_-]+$"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                        placeholder="e.g. Center_Witness"
                    />
                    <p className="text-zinc-500 text-xs mt-1.5">No spaces. Used for linking passages (e.g., targetId in choices).</p>
                    {state?.errors?.nodeId && (
                        <p className="text-red-400 text-sm mt-1">{state.errors.nodeId[0]}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="text" className="block text-sm font-medium text-zinc-300 mb-1.5">
                        Passage Text (Markdown + Macros)
                    </label>
                    <textarea
                        name="text"
                        id="text"
                        required
                        rows={12}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                        placeholder="Type your story here...
                        
<<set $var = true>>
<<if $var>>
You see a hidden door.
<</if>>"
                    />
                    {state?.errors?.text && (
                        <p className="text-red-400 text-sm mt-1">{state.errors.text[0]}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="choices" className="block text-sm font-medium text-zinc-300 mb-1.5">
                        Choices (JSON Array)
                    </label>
                    <textarea
                        name="choices"
                        id="choices"
                        required
                        rows={6}
                        defaultValue="[\n  {\n    &#34;text&#34;: &#34;Continue&#34;,\n    &#34;targetId&#34;: &#34;Next_Node&#34;\n  }\n]"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                    />
                    <p className="text-zinc-500 text-xs mt-1.5">Must be a valid JSON array of objects with `text` and `targetId`.</p>
                    {state?.errors?.choicesJson && (
                        <p className="text-red-400 text-sm mt-1">{state.errors.choicesJson[0]}</p>
                    )}
                </div>
            </div>

            <div className="pt-2 border-t border-zinc-800">
                <SubmitButton />
            </div>
        </form>
    )
}
