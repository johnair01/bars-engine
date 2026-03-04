"use client"

import { useActionState, useState } from "react"
import { updatePassage } from "./actions"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { BridgeGapModal } from "./BridgeGapModal"

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

type Choice = { text: string; targetId: string }

export function EditPassageForm({
    adventureId,
    passage
}: {
    adventureId: string
    passage: { id: string; nodeId: string; text: string; choices: string }
}) {
    const [state, formAction] = useActionState(updatePassage, { success: false, message: "" })
    const [bridgeTarget, setBridgeTarget] = useState<{ toNodeId: string; choiceLabel: string } | null>(null)

    let choices: Choice[] = []
    try {
        const parsed = JSON.parse(passage.choices || "[]")
        choices = Array.isArray(parsed) ? parsed.filter((c: unknown) => c && typeof c === "object" && "text" in c && "targetId" in c) : []
    } catch {
        /* ignore */
    }

    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="passageId" value={passage.id} />
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
                        defaultValue={passage.nodeId}
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
                        defaultValue={passage.text}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                        placeholder="Type your story here..."
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
                        defaultValue={passage.choices}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                    />
                    <p className="text-zinc-500 text-xs mt-1.5">Must be a valid JSON array of objects with `text` and `targetId`.</p>
                    {state?.errors?.choicesJson && (
                        <p className="text-red-400 text-sm mt-1">{state.errors.choicesJson[0]}</p>
                    )}
                    {choices.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-zinc-800">
                            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Bridge this gap</p>
                            <div className="space-y-2">
                                {choices.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-zinc-950 border border-zinc-800">
                                        <span className="text-sm text-zinc-300 truncate">
                                            {c.text} → <span className="font-mono text-indigo-400">{c.targetId}</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setBridgeTarget({ toNodeId: c.targetId, choiceLabel: c.text })}
                                            className="shrink-0 px-3 py-1.5 text-xs font-medium text-purple-300 hover:text-purple-100 border border-purple-700/50 hover:border-purple-500 rounded-lg transition-colors"
                                        >
                                            Bridge
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {bridgeTarget && (
                <BridgeGapModal
                    adventureId={adventureId}
                    fromNodeId={passage.nodeId}
                    toNodeId={bridgeTarget.toNodeId}
                    choiceLabel={bridgeTarget.choiceLabel}
                    onClose={() => setBridgeTarget(null)}
                />
            )}

            <div className="pt-2 border-t border-zinc-800 flex items-center gap-4">
                <SubmitButton />
                <Link
                    href={`/admin/adventures/${adventureId}`}
                    className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
                >
                    Cancel
                </Link>
            </div>
        </form>
    )
}
