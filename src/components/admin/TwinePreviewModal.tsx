'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { ParsedTwineStory, ParsedPassage } from '@/lib/twine-parser'
import { chunkIntoSlides } from '@/lib/slide-chunker'

interface TwinePreviewModalProps {
  story: ParsedTwineStory
  isOpen: boolean
  onClose: () => void
}

export function TwinePreviewModal({ story, isOpen, onClose }: TwinePreviewModalProps) {
  const [currentPassageName, setCurrentPassageName] = useState(story.startPassage)
  const [slideIndex, setSlideIndex] = useState(0)

  if (!isOpen) return null

  const passageMap = new Map(story.passages.map((p) => [p.name, p]))
  const currentPassage = passageMap.get(currentPassageName) ?? story.passages[0]
  if (!currentPassage) return null

  const rawContent = (currentPassage as { text?: string }).text ?? currentPassage.cleanText
  const slides = chunkIntoSlides(rawContent)
  const useSlideMode = slides.length > 1
  const displayContent = useSlideMode ? slides[slideIndex] : rawContent
  const isEnd = !currentPassage.links || currentPassage.links.length === 0

  const handleChoice = (target: string) => {
    const targetPassage = passageMap.get(target)
    if (targetPassage) {
      setCurrentPassageName(target)
      setSlideIndex(0)
    }
  }

  const handleContinue = () => {
    if (useSlideMode && slideIndex < slides.length - 1) {
      setSlideIndex((i) => i + 1)
    } else if (currentPassage.links?.length) {
      const primary = currentPassage.links.find((l) => l.target !== 'FEEDBACK')
      if (primary) handleChoice(primary.target)
    }
  }

  const showContinue = useSlideMode ? slideIndex < slides.length - 1 : false
  const primaryLinks = currentPassage.links?.filter((l) => l.target !== 'FEEDBACK') ?? []
  const secondaryLinks = currentPassage.links?.filter((l) => l.target === 'FEEDBACK') ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-white truncate">Preview: {story.title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl transition-colors">
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="text-xs text-zinc-600 font-mono uppercase tracking-widest">{currentPassage.name}</div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                    {children}
                  </a>
                ),
              }}
            >
              {displayContent}
            </ReactMarkdown>
          </div>
          {showContinue ? (
            <button
              onClick={handleContinue}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
            >
              Continue
            </button>
          ) : isEnd ? (
            <p className="text-zinc-500 italic text-sm">End of story.</p>
          ) : (
            <div className="space-y-3">
              {primaryLinks.map((link, i) => (
                <button
                  key={i}
                  onClick={() => handleChoice(link.target)}
                  className="w-full text-left p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-purple-600/50 hover:bg-zinc-800/50 transition-all"
                >
                  <span className="text-white">{link.label}</span>
                </button>
              ))}
              {secondaryLinks.map((link, i) => (
                <button
                  key={`fb-${i}`}
                  onClick={() => handleChoice(link.target)}
                  className="w-full text-left p-3 text-zinc-500 hover:text-purple-400 text-sm border border-zinc-800 rounded-xl hover:border-purple-800/50 transition-all"
                >
                  {link.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
