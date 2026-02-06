import { db } from '@/lib/db'
import { StoryNode, StoryChoice } from '@/app/conclave/guided/types'

// Helper to format nation choice
const getNationChoice = (nation: any): StoryChoice => ({
    id: `view_nation_${nation.id}`,
    text: `View ${nation.name}`,
    nextNodeId: `nation_info_${nation.id}`,
})

// Helper to format playbook choice
const getPlaybookChoice = (playbook: any): StoryChoice => ({
    id: `view_playbook_${playbook.id}`,
    text: `View ${playbook.name}`,
    nextNodeId: `playbook_info_${playbook.id}`,
})

export async function getStaticStoryNode(nodeId: string): Promise<StoryNode | null> {
    // 1. INTRO
    if (nodeId === 'intro_001') {
        return {
            id: 'intro_001',
            nodeId: 'intro_001',
            title: 'Welcome to the Conclave',
            category: 'intro',
            content: `
Welcome to the Conclave. We've been expecting you. 

The security for the Robot Oscars is tighter than a clam with trust issues this year, but you made it in. The big event is just around the corner, and frankly, we're short a few brilliant minds for the... *festivities*.
            `,
            guideDialogue: "Ah, you made it. Keeping a low profile, I hope?",
            choices: [
                {
                    id: 'ready',
                    text: "I'm ready. What's the job?",
                    nextNodeId: 'identity_001'
                },
                {
                    id: 'explain',
                    text: "Robot Oscars? Explain.",
                    nextNodeId: 'intro_context'
                }
            ],
            metadata: {
                emotionalTone: 'mysterious'
            }
        }
    }

    if (nodeId === 'intro_context') {
        return {
            id: 'intro_context',
            nodeId: 'intro_context',
            title: 'The Job',
            category: 'intro',
            content: `
Only the most prestigious gathering of construct technology in the galaxy. And the perfect place for a... reallocation of assets.

We're here to pull off the heist of the century. But first, we need to get you processed.
            `,
            guideDialogue: "Think of it as the ultimate celebration of engineering. And we're going to crash the party.",
            choices: [
                {
                    id: 'start',
                    text: "Let's get started.",
                    nextNodeId: 'identity_001'
                }
            ]
        }
    }

    // 2. IDENTITY
    if (nodeId === 'identity_001') {
        return {
            id: 'identity_001',
            nodeId: 'identity_001',
            title: 'Who Are You?',
            category: 'identity',
            content: `
I have your invitation here, but the ink is a bit smudged. Smells like... motor oil and expensive cologne.

What name should I put on your dossier? This is how the other heist members will know you.
            `,
            guideDialogue: "Just a formality. Though I do enjoy a good codename.",
            inputType: 'text',
            choices: [
                {
                    id: 'submit_name',
                    text: "Confirm Name",
                    nextNodeId: 'nation_select'
                }
            ]
        }
    }

    // 3. NATION SELECTION
    if (nodeId === 'nation_select') {
        const nations = await db.nation.findMany({ orderBy: { name: 'asc' } })

        return {
            id: 'nation_select',
            nodeId: 'nation_select',
            title: 'The Five Nations',
            category: 'nation',
            content: `
The Conclave is a joint effort, but we all come from somewhere. Which flag feels like home?

There are five nations in the alliance. Each has a different philosophy on how to approach the world—and this heist.
            `,
            guideDialogue: "Take a look. Which story calls to you?",
            choices: nations.map(getNationChoice)
        }
    }

    // NATION INFO NODES
    if (nodeId.startsWith('nation_info_')) {
        const nationId = nodeId.replace('nation_info_', '')
        const nation = await db.nation.findUnique({ where: { id: nationId } })

        if (!nation) return null

        // Get basic moves or description
        const description = nation.description

        return {
            id: nodeId,
            nodeId: nodeId,
            title: nation.name,
            category: 'nation',
            content: `
**${description}**

*Wake Up*: ${nation.wakeUp}
*Clean Up*: ${nation.cleanUp}
*Grow Up*: ${nation.growUp}
*Show Up*: ${nation.showUp}
            `,
            guideDialogue: `Ah, ${nation.name}. An excellent choice.`,
            choices: [
                {
                    id: `confirm_nation_${nation.id}`,
                    text: `I choose ${nation.name}`,
                    nextNodeId: 'playbook_select',
                    rewards: {
                        unlocks: [`nation:${nation.id}`]
                    }
                },
                {
                    id: 'back_to_nations',
                    text: "Let me look at others",
                    nextNodeId: 'nation_select'
                }
            ]
        }
    }

    // 4. PLAYBOOK SELECTION
    if (nodeId === 'playbook_select') {
        // We might want to group these, but for now flat list is fine or we can do a simple categorization in dialogue
        const playbooks = await db.playbook.findMany({ orderBy: { name: 'asc' } })

        return {
            id: 'playbook_select',
            nodeId: 'playbook_select',
            title: 'Your Archetype',
            category: 'playbook',
            content: `
We know where you're from. Now... who are you? In the heat of the moment, how do you solve problems?

The Conclave recognizes 8 archetypes based on the I Ching trigrams. This defines your role in the crew.
            `,
            guideDialogue: "Who are you when the alarm goes off?",
            choices: playbooks.map(getPlaybookChoice)
        }
    }

    // PLAYBOOK INFO NODES
    if (nodeId.startsWith('playbook_info_')) {
        const playbookId = nodeId.replace('playbook_info_', '')
        const playbook = await db.playbook.findUnique({ where: { id: playbookId } })

        if (!playbook) return null

        return {
            id: nodeId,
            nodeId: nodeId,
            title: playbook.name,
            category: 'playbook',
            content: `
**${playbook.description}**

*Wake Up*: ${playbook.wakeUp}
*Clean Up*: ${playbook.cleanUp}
*Grow Up*: ${playbook.growUp}
*Show Up*: ${playbook.showUp}
            `,
            guideDialogue: "A powerful archetype. Is this you?",
            choices: [
                {
                    id: `confirm_playbook_${playbook.id}`,
                    text: `Confirm ${playbook.name}`,
                    nextNodeId: 'conclusion',
                    rewards: {
                        unlocks: [`playbook:${playbook.id}`]
                    }
                },
                {
                    id: 'back_to_playbooks',
                    text: "Let me reconsider",
                    nextNodeId: 'playbook_select'
                }
            ]
        }
    }

    // 5. CONCLUSION
    if (nodeId === 'conclusion') {
        return {
            id: 'conclusion',
            nodeId: 'conclusion',
            title: "You're In",
            category: 'transition',
            content: `
Updates complete. Dossier looks good. 

The crew is assembling. Your personal construct is fueled and ready. The Robot Oscars won't know what hit them.
            `,
            guideDialogue: "Welcome to the team. Let's make some history.",
            choices: [
                {
                    id: 'enter_conclave',
                    text: "Enter the Conclave",
                    nextNodeId: 'dashboard' // Special case to redirect
                }
            ]
        }
    }

    return null
}
