"use client"

import { useActionState } from "react"
import { createAdventure } from "../actions"
import { useFormStatus } from "react-dom"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
            {pending ? "Creating..." : "Create Adventure"}
        </button>
    )
}

export function CreateAdventureForm() {
    const [state, formAction] = useActionState(createAdventure, { success: false, message: "" })

    return (
        <form action={formAction} className="space-y-6">
            {state?.message && !state.success && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm">
                    {state.message}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-1.5">
                        Title
                    </label>
                    <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        placeholder="e.g. Wake-Up Campaign"
                    />
                    {state?.errors?.title && (
                        <p className="text-red-400 text-sm mt-1">{state.errors.title[0]}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-zinc-300 mb-1.5">
                        URL Slug
                    </label>
                    <input
                        type="text"
                        name="slug"
                        id="slug"
                        required
                        pattern="^[a-z0-9-]+$"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                        placeholder="e.g. wake-up"
                    />
                    <p className="text-zinc-500 text-xs mt-1.5">Lowercase letters, numbers, and hyphens only. Used in URLs like /campaign/wake-up.</p>
                    {state?.errors?.slug && (
                        <p className="text-red-400 text-sm mt-1">{state.errors.slug[0]}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1.5">
                        Description (Optional)
                    </label>
                    <textarea
                        name="description"
                        id="description"
                        rows={3}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                        placeholder="Internal notes about this adventure..."
                    />
                </div>

                <div>
                    <label htmlFor="visibility" className="block text-sm font-medium text-zinc-300 mb-1.5">
                        Visibility
                    </label>
                    <select
                        name="visibility"
                        id="visibility"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                    >
                        <option value="PUBLIC_ONBOARDING">Public Onboarding (Accessible without login)</option>
                        <option value="PRIVATE_QUEST">Private Quest (Requires login & assignment)</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="adventureType" className="block text-sm font-medium text-zinc-300 mb-1.5">
                        Adventure Type <span className="text-zinc-500 font-normal">(Optional)</span>
                    </label>
                    <select
                        name="adventureType"
                        id="adventureType"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                    >
                        <option value="">Standard Adventure</option>
                        <option value="CHARACTER_CREATOR">Character Creator</option>
                        <option value="CYOA_INTAKE">CYOA Intake (Hub Campaign)</option>
                    </select>
                    <p className="text-zinc-500 text-xs mt-1.5">
                        CYOA Intake adventures route players to AI-generated spoke adventures based on their answers.
                    </p>
                </div>
            </div>

            <div className="pt-2 border-t border-zinc-800">
                <SubmitButton />
            </div>
        </form>
    )
}
