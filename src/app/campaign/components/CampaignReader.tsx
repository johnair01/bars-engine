'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { CampaignAuthForm } from './CampaignAuthForm'

interface CampaignChoice {
    text: string
    targetId: string
}

interface CampaignNode {
    id: string
    text: string
    choices: CampaignChoice[]
}

interface CampaignReaderProps {
    initialNode: CampaignNode
}

// In a real app this would fetch the JSON on choice
// For now, we mock it
const mockNodes: Record<string, CampaignNode> = {
    intro: {
        id: 'intro',
        text: "## The Wake-Up Call\n\nThe world is shifting. Do you feel it?\n\nThis is the beginning of the Wake-Up Campaign.",
        choices: [
            { text: "I feel it.", targetId: "act1" },
            { text: "What are you talking about?", targetId: "act1" }
        ]
    },
    act1: {
        id: 'act1',
        text: "## Act 1: Fracture\n\nThings can't go on as they have. You need to make a choice about your path.",
        choices: [
            { text: "I will build something new.", targetId: "act5" },
            { text: "I will protect what is good.", targetId: "act5" }
        ]
    },
    act5: {
        id: 'act5',
        text: "## Act 5: The Oath\n\nYou've seen the fracture. You've made your choice. Are you ready to step into the Conclave?\n\nThis is where the story truly begins. Create your resonance signature to enter.",
        choices: [
            { text: "I am ready.", targetId: "signup" }
        ]
    }
}

export function CampaignReader({ initialNode }: CampaignReaderProps) {
    const [currentNode, setCurrentNode] = useState<CampaignNode>(initialNode)
    const [campaignState, setCampaignState] = useState<Record<string, any>>({})

    const handleChoice = (choice: CampaignChoice) => {
        // Record choice in state
        setCampaignState(prev => ({
            ...prev,
            [currentNode.id]: choice.text
        }))

        if (choice.targetId === 'signup') {
            setCurrentNode({ id: 'signup', text: '', choices: [] })
            return
        }

        const nextNode = mockNodes[choice.targetId]
        if (nextNode) {
            setCurrentNode(nextNode)
        }
    }

    if (currentNode.id === 'signup') {
        return <CampaignAuthForm campaignState={campaignState} />
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in relative min-h-[60vh] flex flex-col items-center justify-center p-8 border border-zinc-800 bg-zinc-950/50 rounded-2xl shadow-2xl">
            <div className="prose prose-invert prose-lg max-w-none w-full text-center">
                <ReactMarkdown>{currentNode.text}</ReactMarkdown>
            </div>

            <div className="w-full pt-8 flex flex-col gap-3 max-w-md">
                {currentNode.choices.map((choice, i) => (
                    <button
                        key={i}
                        onClick={() => handleChoice(choice)}
                        className="w-full text-left bg-zinc-900 border border-zinc-700 hover:border-purple-500 hover:bg-zinc-800 text-zinc-300 hover:text-white p-4 rounded-xl transition-all font-medium text-sm flex justify-between items-center group relative overflow-hidden"
                    >
                        <span className="relative z-10">{choice.text}</span>
                        <span className="text-purple-500/0 group-hover:text-purple-500 transition-colors relative z-10">→</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
