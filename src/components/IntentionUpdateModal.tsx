'use client'

import { useState, useTransition, useEffect } from 'react'
import { updatePlayerIntention } from '@/actions/intention'
import { getIntentionOptionsForPreference } from '@/lib/intention-options'
import { INTENTION_GUIDED_TWINE_LOGIC } from '@/lib/intention-guided-journey'
import { QuestTwinePlayer } from './QuestTwinePlayer'
import { useRouter } from 'next/navigation'

interface IntentionUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  currentIntention?: string
  campaignDomainPreference?: string[]
}

export function IntentionUpdateModal({
  isOpen,
  onClose,
  currentIntention = '',
  campaignDomainPreference = [],
}: IntentionUpdateModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'direct' | 'guided' | 'options'>('direct')
  const [directText, setDirectText] = useState(currentIntention)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setDirectText(currentIntention)
      setSelectedOption(null)
      setFeedback(null)
    }
  }, [isOpen, currentIntention])

  if (!isOpen) return null

  const effectiveIntention =
    mode === 'options' && selectedOption
      ? selectedOption
      : mode === 'direct'
        ? directText.trim()
        : null

  async function handleSubmit() {
    if (mode === 'guided') return // Guided uses onComplete
    const text = mode === 'options' ? selectedOption : directText.trim()
    if (!text) return
    startTransition(async () => {
      const result = await updatePlayerIntention(text)
      if (result.success) {
        setFeedback('✨ Intention updated!')
        setTimeout(() => {
          onClose()
          router.refresh()
        }, 800)
      } else {
        setFeedback(`❌ ${result.error || 'Failed to update'}`)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Update my intention</h2>
          <p className="text-zinc-500 text-sm mt-1">Choose how you want to set your intention.</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Path selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode('direct')}
              className={`rounded-lg border px-3 py-2 text-center text-sm transition ${
                mode === 'direct'
                  ? 'border-purple-500 bg-purple-900/30 text-purple-100'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              Write directly
            </button>
            <button
              type="button"
              onClick={() => setMode('guided')}
              className={`rounded-lg border px-3 py-2 text-center text-sm transition ${
                mode === 'guided'
                  ? 'border-emerald-500 bg-emerald-900/20 text-emerald-100'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              Guided journey
            </button>
            <button
              type="button"
              onClick={() => setMode('options')}
              className={`rounded-lg border px-3 py-2 text-center text-sm transition ${
                mode === 'options'
                  ? 'border-teal-500 bg-teal-900/20 text-teal-100'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              Choose option
            </button>
          </div>

          {/* Direct: textarea */}
          {mode === 'direct' && (
            <textarea
              value={directText}
              onChange={(e) => setDirectText(e.target.value)}
              placeholder="What intention do you want to hold for your journey?"
              rows={3}
              className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-600"
            />
          )}

          {/* Guided: Twine player */}
          {mode === 'guided' && (
            <QuestTwinePlayer
              logic={INTENTION_GUIDED_TWINE_LOGIC}
              onComplete={async (vars) => {
                const intention = vars.intention as string
                if (!intention) {
                  setFeedback('❌ Intention was not captured. Please try again.')
                  return
                }
                startTransition(async () => {
                  const result = await updatePlayerIntention(intention)
                  if (result.success) {
                    setFeedback('✨ Intention updated!')
                    setTimeout(() => {
                      onClose()
                      router.refresh()
                    }, 800)
                  } else {
                    setFeedback(`❌ ${result.error || 'Failed to update'}`)
                  }
                })
              }}
            />
          )}

          {/* Options: grid */}
          {mode === 'options' && (
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {getIntentionOptionsForPreference(campaignDomainPreference).map((opt) => (
                <button
                  key={opt.text}
                  type="button"
                  onClick={() => setSelectedOption(opt.text)}
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                    selectedOption === opt.text
                      ? 'border-teal-500 bg-teal-900/30 text-teal-100'
                      : 'border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          )}

          {feedback && (
            <div
              className={`text-center text-sm font-bold p-3 rounded-xl ${
                feedback.includes('❌') ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
              }`}
            >
              {feedback}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-500 hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
          {mode !== 'guided' && (
            <button
              onClick={handleSubmit}
              disabled={isPending || !effectiveIntention}
              className="px-6 py-2 rounded-lg font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
            >
              {isPending ? 'Updating...' : 'Update'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
