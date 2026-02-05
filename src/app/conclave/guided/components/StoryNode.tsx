'use client'

import { StoryNode, StoryChoice } from '../types'
import { GuideCharacter } from './GuideCharacter'
import { ChoiceButton } from './ChoiceButton'

interface StoryNodeProps {
    node: StoryNode
    onChoiceSelect: (choice: StoryChoice) => void
    isLoading?: boolean
}

export function StoryNodeComponent({ node, onChoiceSelect, isLoading = false }: StoryNodeProps) {
    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            {/* Guide Dialogue */}
            {node.guideDialogue && (
                <GuideCharacter
                    dialogue={node.guideDialogue}
                    emotion={node.metadata?.emotionalTone as any || 'neutral'}
                />
            )}

            {/* Story Content */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{node.title}</h2>
                <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
                    <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{node.content}</p>
                </div>
            </div>

            {/* Choices */}
            <div className="space-y-3">
                {node.choices.map((choice, index) => (
                    <ChoiceButton
                        key={choice.id}
                        text={choice.text}
                        onClick={() => onChoiceSelect(choice)}
                        disabled={isLoading}
                        variant={index === 0 ? 'primary' : 'secondary'}
                    />
                ))}
            </div>

            {/* Reward Preview */}
            {node.choices.some(c => c.rewards?.vibeulons) && (
                <div className="text-center">
                    <p className="text-xs text-zinc-600">
                        💎 Earn vibeulons by making your choice
                    </p>
                </div>
            )}
        </div>
    )
}
