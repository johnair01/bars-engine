'use client'

import { useState, useEffect } from 'react'
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

// Helper to evaluate SugarCube-like <<if>> conditions against state
function passesCondition(condition: string, state: Record<string, any>): boolean {
    const clean = condition.trim().replace(/^<<if\s+/, '').replace(/>>$/, '')
    // Basic parser for "A and B" or "A or B" or "A >= B"
    // For safety, we avoid eval() and do a very basic string replacement and Function wrap

    // Replace $var with state.var
    let logicExpr = clean.replace(/\$([a-zA-Z0-9_]+)/g, "state['$1']")
    // Replace 'and' with '&&', 'or' with '||'
    logicExpr = logicExpr.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||')

    try {
        const check = new Function('state', `return !!(${logicExpr});`)
        return check(state)
    } catch (e) {
        console.warn("Failed to evaluate condition:", condition, e)
        return false
    }
}

// Helper to process SugarCube-like macros (<<set ...>>, <<print ...>>) and return clean text + state updates
function processMacros(text: string, currentState: Record<string, any>): { cleanText: string, updates: Record<string, any> } {
    const updates: Record<string, any> = {}
    let cleanText = text

    // Process <<set $var = value>> or <<set $var += value>>
    const setRegex = /<<set\s+\$([a-zA-Z0-9_]+)\s*(\+?=)\s*([^>]+)>>/g
    let match;
    while ((match = setRegex.exec(text)) !== null) {
        const [_, varName, op, valStr] = match
        let val: any = valStr.trim()

        // Parse value
        if (val === 'true') val = true
        else if (val === 'false') val = false
        else if (!isNaN(Number(val))) val = Number(val)
        else if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1)

        if (op === '+=') {
            const currentObj = varName in updates ? updates : currentState
            const currentVal = currentObj[varName] || 0
            updates[varName] = currentVal + val
        } else {
            updates[varName] = val
        }

        cleanText = cleanText.replace(match[0], '')
    }

    // Process <<complete_active_face>> custom macro from user prompt
    if (cleanText.includes('<<complete_active_face>>')) {
        const activeFace = updates.active_face || currentState.active_face
        if (activeFace) {
            updates[`completed_${activeFace}`] = true

            // Recompute altitude count
            let count = 0
            const check = (face: string) => (updates[`completed_${face}`] !== undefined ? updates[`completed_${face}`] : currentState[`completed_${face}`])
            if (check('shaman')) count++
            if (check('challenger')) count++
            if (check('regent')) count++
            if (check('architect')) count++
            if (check('diplomat')) count++
            if (check('sage')) count++

            updates['altitude_count'] = count
            updates['onboarding_vibeulons_minted'] = (updates.onboarding_vibeulons_minted || currentState.onboarding_vibeulons_minted || 0) + 1
            updates['onboarding_unlocked'] = true

            if (check('sage') || count >= 2) {
                updates['unlock_teal_starters'] = true
            }
        }
        cleanText = cleanText.replace('<<complete_active_face>>', '')
    }

    // Process <<print_status_report>> custom macro
    if (cleanText.includes('<<print_status_report>>')) {
        const getVal = (k: string) => (updates[k] !== undefined ? updates[k] : currentState[k])
        const report = `
**Completed Paths:**
- Shaman: ${getVal('completed_shaman') ? '✅' : '❌'}
- Challenger: ${getVal('completed_challenger') ? '✅' : '❌'}
- Regent: ${getVal('completed_regent') ? '✅' : '❌'}
- Architect: ${getVal('completed_architect') ? '✅' : '❌'}
- Diplomat: ${getVal('completed_diplomat') ? '✅' : '❌'}
- Sage: ${getVal('completed_sage') ? '✅' : '❌'}

**Onboarding Unlocked:** ${getVal('onboarding_unlocked') ? 'Yes' : 'No'}
**Teal Starters Unlocked:** ${getVal('unlock_teal_starters') ? 'Yes' : 'No'}
**Vibeulons Earned:** ${getVal('onboarding_vibeulons_minted') || 0} ♦
        `
        cleanText = cleanText.replace('<<print_status_report>>', report)
    }

    // Process <<print $var>>
    const printRegex = /<<print\s+\$([a-zA-Z0-9_]+)>>/g
    cleanText = cleanText.replace(printRegex, (match, varName) => {
        const val = updates[varName] !== undefined ? updates[varName] : currentState[varName]
        return String(val)
    })

    // Handle <<if>>...<<else>>...<</if>> blocks (VERY basic non-nested implementation)
    const ifRegex = /<<if\s+([^>]+)>>([\s\S]*?)(?:<<else>>([\s\S]*?))?<<\/if>>/g
    cleanText = cleanText.replace(ifRegex, (match, condition, ifBody, elseBody) => {
        const mergedState = { ...currentState, ...updates }
        if (passesCondition(`<<if ${condition}>>`, mergedState)) {
            return ifBody
        } else {
            return elseBody || ''
        }
    })

    // Clean up empty lines left behind by macros
    cleanText = cleanText.split('\n').filter(line => line.trim() !== '' || line === '').join('\n')

    return { cleanText, updates }
}

export function CampaignReader({ initialNode }: CampaignReaderProps) {
    const [currentNode, setCurrentNode] = useState<CampaignNode | null>(null)
    const [loading, setLoading] = useState(true)
    const [campaignState, setCampaignState] = useState<Record<string, any>>({
        completed_shaman: false,
        completed_challenger: false,
        completed_regent: false,
        completed_architect: false,
        completed_diplomat: false,
        completed_sage: false,
        altitude_count: 0,
        onboarding_unlocked: false,
        unlock_teal_starters: false,
        active_face: "",
        tension_bar_id: "",
        action_bar_id: "",
        onboarding_vibeulons_minted: 0,
        step1_done: false,
        step2_done: false
    })

    const [renderedText, setRenderedText] = useState(initialNode.text)
    const [availableChoices, setAvailableChoices] = useState(initialNode.choices)

    useEffect(() => {
        // Load the initial map to ensure we have it cached (in a real app)
        // For now, we fetch the start node
        fetchNode(initialNode.id)
    }, [])

    const fetchNode = async (nodeId: string) => {
        setLoading(true)
        try {
            // In a real app we fetch from API. For now, hitting our static content files
            const res = await fetch(`/api/campaigns/wake_up/${nodeId}`)
            if (res.ok) {
                const node = await res.json()

                // Process macros right as we load the node
                const { cleanText, updates } = processMacros(node.text, campaignState)

                const newState = { ...campaignState, ...updates }
                setCampaignState(newState)
                setCurrentNode(node)
                setRenderedText(cleanText)

                // Filter choices based on their conditions (if they had any, though in this skeleton we use <<if>> blocks in the text instead)
                setAvailableChoices(node.choices)
            } else {
                console.error("Failed to load node", nodeId)
            }
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    const handleChoice = (choice: CampaignChoice) => {
        if (choice.targetId === 'Game_Login' || choice.targetId === 'signup') {
            setCurrentNode({ id: 'signup', text: '', choices: [] })
            return
        }

        fetchNode(choice.targetId)
    }

    if (currentNode?.id === 'signup') {
        return <CampaignAuthForm campaignState={campaignState} />
    }

    if (loading || !currentNode) {
        return <div className="text-zinc-500 animate-pulse text-center p-8">Reading timeline...</div>
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in relative min-h-[60vh] flex flex-col items-center justify-center p-8 border border-zinc-800 bg-zinc-950/50 rounded-2xl shadow-2xl">
            <div className="prose prose-invert prose-lg max-w-none w-full text-left font-sans">
                <ReactMarkdown>{renderedText}</ReactMarkdown>
            </div>

            <div className="w-full pt-8 flex flex-col gap-3 max-w-md">
                {availableChoices.map((choice, i) => (
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
