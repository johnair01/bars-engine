'use client'

import { submitChoice } from '@/actions/engine'

interface Choice {
    text: string
    targetId: string
}

export function StoryChoices({ passageId, choices, action }: { passageId: string, choices: Choice[], action?: string }) {
    // We don't strictly need useActionState if we just want to submit, 
    // but it's good practice for loading states.
    // Although submitChoice redirects, so loading state helps UX.

    // Note: submitChoice is: async function submitChoice(formData: FormData)
    // To use with useActionState, we might need to wrap it or adjust signature.
    // But for simple "formAction" on buttons, we can just use the action directly 
    // inside the form if we weren't doing per-button logic.

    // Actually, standard HTML way:
    // <input type="hidden" name="passageId" value={passageId} />
    // <button name="choiceIndex" value={i}>

    // But to fix Hydration/Server Action binding issues, let's keep it simple.

    return (
        <form action={submitChoice} className="space-y-6 w-full">
            <input type="hidden" name="passageId" value={passageId} />
            {choices.map((choice, i) => (
                <button
                    key={i}
                    name="choiceIndex"
                    value={i} // Index is passed as string, parsed in action
                    type="submit"
                    className="w-full bg-transparent border border-zinc-700 hover:border-zinc-300 hover:bg-zinc-900 text-zinc-300 hover:text-white py-6 text-lg tracking-widest uppercase transition-all duration-300"
                >
                    {choice.text}
                </button>
            ))}
        </form>
    )
}
