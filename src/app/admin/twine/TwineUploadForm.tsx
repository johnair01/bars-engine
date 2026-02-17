'use client'

import { useActionState, useState } from 'react'
import { uploadTwineStory } from '@/actions/twine'

export function TwineUploadForm() {
    const [state, formAction, isPending] = useActionState(uploadTwineStory, null)
    const [fileName, setFileName] = useState<string | null>(null)
    const [sourceText, setSourceText] = useState('')

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setFileName(file.name)
        const text = await file.text()
        setSourceText(text)
    }

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <label className="block text-xs uppercase text-zinc-500 font-bold tracking-widest">
                    Title Override <span className="text-zinc-600 normal-case">(optional, uses Twine title if blank)</span>
                </label>
                <input
                    name="title"
                    type="text"
                    maxLength={200}
                    placeholder="Leave blank to use story title from file"
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none transition text-sm"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-xs uppercase text-zinc-500 font-bold tracking-widest">
                    Twine HTML File *
                </label>
                <input
                    type="file"
                    accept=".html,.htm"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-purple-900/30 file:text-purple-400 hover:file:bg-purple-900/50 file:cursor-pointer"
                />
                {fileName && <p className="text-xs text-zinc-500">Selected: {fileName}</p>}
            </div>

            {/* Hidden field to pass the file content as text */}
            <input type="hidden" name="sourceText" value={sourceText} />

            {state?.error && (
                <div className="p-3 bg-red-900/20 text-red-300 text-sm rounded-lg">{state.error}</div>
            )}
            {state?.success && (
                <div className="p-3 bg-green-900/20 text-green-300 text-sm rounded-lg">Story uploaded successfully!</div>
            )}

            <button
                type="submit"
                disabled={isPending || !sourceText}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition disabled:opacity-50 text-sm"
            >
                {isPending ? 'Uploading...' : 'Upload Story'}
            </button>
        </form>
    )
}
