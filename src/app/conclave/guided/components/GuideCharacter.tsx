'use client'

import { GuideEmotion } from './types'
import { useState, useEffect } from 'react'

interface GuideCharacterProps {
    dialogue: string
    emotion?: GuideEmotion
    isVisible?: boolean
}

export function GuideCharacter({
    dialogue,
    emotion = 'neutral',
    isVisible = true
}: GuideCharacterProps) {
    const [displayedText, setDisplayedText] = useState('')
    const [isTyping, setIsTyping] = useState(true)

    // Typewriter effect
    useEffect(() => {
        if (!dialogue) return

        setDisplayedText('')
        setIsTyping(true)
        let index = 0

        const timer = setInterval(() => {
            if (index < dialogue.length) {
                setDisplayedText(dialogue.substring(0, index + 1))
                index++
            } else {
                setIsTyping(false)
                clearInterval(timer)
            }
        }, 30) // 30ms per character for smooth typing

        return () => clearInterval(timer)
    }, [dialogue])

    if (!isVisible) return null

    const getEmotionStyles = () => {
        switch (emotion) {
            case 'welcoming':
                return 'border-purple-500/50 bg-purple-900/10'
            case 'encouraging':
                return 'border-green-500/50 bg-green-900/10'
            case 'mysterious':
                return 'border-pink-500/50 bg-pink-900/10'
            case 'thoughtful':
                return 'border-blue-500/50 bg-blue-900/10'
            default:
                return 'border-zinc-700 bg-zinc-900/40'
        }
    }

    return (
        <div className="flex items-start gap-4 mb-6">
            {/* Guide Avatar */}
            <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl sm:text-3xl">
                    📜
                </div>
                <div className="text-xs text-center text-zinc-500 mt-1 font-mono">Archivist</div>
            </div>

            {/* Dialogue Bubble */}
            <div className={`flex-1 rounded-2xl border-2 p-4 sm:p-6 ${getEmotionStyles()} transition-all`}>
                <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
                    {displayedText}
                    {isTyping && <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse"></span>}
                </p>
            </div>
        </div>
    )
}
