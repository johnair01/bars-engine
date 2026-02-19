import { db } from '@/lib/db'
import { StoryNode, StoryChoice, StoryProgress } from '@/app/conclave/guided/types'

// Helper to format nation choice
const getNationChoice = (nation: any): StoryChoice => ({
    id: `view_nation_${nation.id}`,
    text: `Learn about ${nation.name}`,
    nextNodeId: `nation_info_${nation.id}`,
})

// Helper to format archetype choice
const getArchetypeChoice = (archetype: any): StoryChoice => ({
    id: `view_playbook_${archetype.id}`,
    text: `Learn about ${archetype.name}`,
    nextNodeId: `playbook_info_${archetype.id}`,
})

export async function getStaticStoryNode(nodeId: string, playerId?: string): Promise<StoryNode | null> {
    const player = playerId ? await db.player.findUnique({ where: { id: playerId } }) : null
    const progress = player?.storyProgress ? JSON.parse(player.storyProgress as string) as StoryProgress : null
    const decisions = progress?.decisions || []
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

    // 3. NATION DISCOVERY (The Mini-Quest)
    if (nodeId === 'nation_select') {
        return {
            id: 'nation_select',
            nodeId: 'nation_select',
            title: 'Entry Point',
            category: 'nation',
            content: `
You've reached the perimeter of the Robot Oscars. A high-resolution security drone floats toward you, sensors glowing a skeptical crimson.

It emits a series of chirps—the standard challenge protocol. How do you respond?
            `,
            guideDialogue: "Classic security. They value order here. Let's see how you handle it.",
            choices: [
                {
                    id: 'nation_argyra',
                    text: "[Logic] Present a perfectly forged permit.",
                    nextNodeId: 'nation_scenario_2',
                    rewards: { vibeulons: 1, unlocks: ['align:argyra'] }
                },
                {
                    id: 'nation_pyrakanth',
                    text: "[Passion] Overload its sensors with a burst of static.",
                    nextNodeId: 'nation_scenario_2',
                    rewards: { vibeulons: 1, unlocks: ['align:pyrakanth'] }
                },
                {
                    id: 'nation_virelune',
                    text: "[Joy] Distract it with a playful hologram.",
                    nextNodeId: 'nation_scenario_2',
                    rewards: { vibeulons: 1, unlocks: ['align:virelune'] }
                },
                {
                    id: 'nation_meridia',
                    text: "[Balance] Negotiate a trade for its silence.",
                    nextNodeId: 'nation_scenario_2',
                    rewards: { vibeulons: 1, unlocks: ['align:meridia'] }
                },
                {
                    id: 'nation_lamenth',
                    text: "[Memory] Share a record of its creator.",
                    nextNodeId: 'nation_scenario_2',
                    rewards: { vibeulons: 1, unlocks: ['align:lamenth'] }
                }
            ]
        }
    }

    if (nodeId === 'nation_scenario_2') {
        return {
            id: 'nation_scenario_2',
            nodeId: 'nation_scenario_2',
            title: 'The Inner Loop',
            category: 'nation',
            content: `
You're inside the maintenance tunnels, but the layout is a shifting kaleidoscope of steel. The blueprint you have is outdated—reconstruction is ongoing for the gala.

A crossroads lies ahead. One path smells of ozone, another echoes with distant laughter, and a third is eerily silent.
            `,
            guideDialogue: "The structural patterns have shifted. Trust your instincts here.",
            choices: [
                {
                    id: 'nation_argyra_2',
                    text: "[Logic] Map the likely layout from acoustics.",
                    nextNodeId: 'nation_reveal',
                    rewards: { vibeulons: 1, unlocks: ['align:argyra'] }
                },
                {
                    id: 'nation_pyrakanth_2',
                    text: "[Passion] Force a new path through that vent.",
                    nextNodeId: 'nation_reveal',
                    rewards: { vibeulons: 1, unlocks: ['align:pyrakanth'] }
                },
                {
                    id: 'nation_virelune_2',
                    text: "[Joy] Follow the laughter; it leads to the party.",
                    nextNodeId: 'nation_reveal',
                    rewards: { vibeulons: 1, unlocks: ['align:virelune'] }
                },
                {
                    id: 'nation_meridia_2',
                    text: "[Balance] Watch the staff; flow with their rhythm.",
                    nextNodeId: 'nation_reveal',
                    rewards: { vibeulons: 1, unlocks: ['align:meridia'] }
                },
                {
                    id: 'nation_lamenth_2',
                    text: "[Memory] Recall the architect's signature style.",
                    nextNodeId: 'nation_reveal',
                    rewards: { vibeulons: 1, unlocks: ['align:lamenth'] }
                }
            ]
        }
    }

    if (nodeId === 'nation_reveal') {
        const nations = await db.nation.findMany({ where: { archived: false }, orderBy: { name: 'asc' } })

        // Suggestion Logic
        const counts: Record<string, number> = {}
        decisions.forEach(d => {
            if (d.choiceId.startsWith('nation_')) {
                const align = d.choiceId.split('_')[1] // argyra, pyrakanth, etc.
                counts[align] = (counts[align] || 0) + 1
            }
        })

        const topAlign = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]
        const suggestedNation = nations.find(n => n.name.toLowerCase().includes(topAlign))

        return {
            id: 'nation_reveal',
            nodeId: 'nation_reveal',
            title: 'Your Orientation',
            category: 'nation',
            content: `
Based on how you navigated the approach, your resonance is becoming clear. We are all shaped by where we come from.

${suggestedNation ? `Your choices align most closely with **${suggestedNation.name}**. Their philosophy appears to match your instincts.` : ''}

Choose your nation. This determines your initial toolkit and social status within the Conclave.
            `,
            guideDialogue: suggestedNation ? `Indeed, your approach to that drone was very ${suggestedNation.name}. Does it feel right?` : "You have a distinct rhythm. Which of these feels like where you belong?",
            choices: [
                ...(suggestedNation ? [getNationChoice(suggestedNation)] : []),
                ...nations.filter(n => n.id !== suggestedNation?.id).map(getNationChoice)
            ]
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

    // 4. ARCHETYPE DISCOVERY (The Mini-Quest)
    if (nodeId === 'playbook_select') {
        return {
            id: 'playbook_select',
            nodeId: 'playbook_select',
            title: 'The Tension',
            category: 'playbook',
            content: `
A conflict breaks out between two of the heist members during the final briefing. Tensions are high; tools are being gripped a bit too tightly, and voices are rising.

The mission is at risk before it even begins. How do you intercede?
            `,
            guideDialogue: "Dynamics are always... delicate in teams like this. What's your move?",
            choices: [
                {
                    id: 'pb_movers',
                    text: "[The Movers] Take control of the room immediately.",
                    nextNodeId: 'playbook_scenario_2',
                    rewards: { vibeulons: 1, unlocks: ['align:movers'] }
                },
                {
                    id: 'pb_connectors',
                    text: "[The Connectors] Find common ground and de-escalate.",
                    nextNodeId: 'playbook_scenario_2',
                    rewards: { vibeulons: 1, unlocks: ['align:connectors'] }
                },
                {
                    id: 'pb_shifters',
                    text: "[The Shifters] Redirect the energy and move past it.",
                    nextNodeId: 'playbook_scenario_2',
                    rewards: { vibeulons: 1, unlocks: ['align:shifters'] }
                },
                {
                    id: 'pb_anchors',
                    text: "[The Anchors] Be the calm center; expose the truth.",
                    nextNodeId: 'playbook_scenario_2',
                    rewards: { vibeulons: 1, unlocks: ['align:anchors'] }
                }
            ]
        }
    }

    if (nodeId === 'playbook_scenario_2') {
        return {
            id: 'playbook_scenario_2',
            nodeId: 'playbook_scenario_2',
            title: 'The Breakthrough',
            category: 'playbook',
            content: `
You've reached the target: a heavy vault door protected by a vibrational lock that responds to emotional frequency. Standard tech won't touch it.

You must project a specific intent to resonate with the tumblers. What do you channel?
            `,
            guideDialogue: "The safe reads intention, not code. Focus yourself.",
            choices: [
                {
                    id: 'pb_movers_2',
                    text: "[The Movers] Pure, driving will and command.",
                    nextNodeId: 'playbook_reveal',
                    rewards: { vibeulons: 1, unlocks: ['align:movers'] }
                },
                {
                    id: 'pb_connectors_2',
                    text: "[The Connectors] Resonance and harmony with the field.",
                    nextNodeId: 'playbook_reveal',
                    rewards: { vibeulons: 1, unlocks: ['align:connectors'] }
                },
                {
                    id: 'pb_shifters_2',
                    text: "[The Shifters] A fluid, adaptive rhythm that shifts.",
                    nextNodeId: 'playbook_reveal',
                    rewards: { vibeulons: 1, unlocks: ['align:shifters'] }
                },
                {
                    id: 'pb_anchors_2',
                    text: "[The Anchors] Unwavering clarity and stillness.",
                    nextNodeId: 'playbook_reveal',
                    rewards: { vibeulons: 1, unlocks: ['align:anchors'] }
                }
            ]
        }
    }

    if (nodeId === 'playbook_reveal') {
        const playbooks = await db.playbook.findMany({ orderBy: { name: 'asc' } })

        // Mapping alignment to playbooks (Simplified matching)
        const groups: Record<string, string[]> = {
            movers: ['Heaven', 'Thunder'],
            connectors: ['Earth', 'Lake'],
            shifters: ['Wind', 'Water'],
            anchors: ['Mountain', 'Fire']
        }

        const counts: Record<string, number> = {}
        decisions.forEach(d => {
            if (d.choiceId.startsWith('pb_')) {
                const align = d.choiceId.split('_')[1] // movers, connectors, etc.
                counts[align] = (counts[align] || 0) + 1
            }
        })

        const topAlign = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]
        const suggestedGroup = topAlign ? groups[topAlign] : []

        // Pick one suggested playbook to feature or just show the group
        const featuredPlaybook = playbooks.find(p => suggestedGroup.includes(p.name))

        return {
            id: 'playbook_reveal',
            nodeId: 'playbook_reveal',
            title: 'Choose Your Way',
            category: 'playbook',
            content: `
Your way of moving through the world is clear. The I Ching archetypes are more than just roles—they are the way you express your power.

${featuredPlaybook ? `Your instincts align with **${topAlign.charAt(0).toUpperCase() + topAlign.slice(1)}**. Archetypes like **${featuredPlaybook.name}** might suit your style.` : ''}

Select your archetype. This defines your unique moves and your contribution to the heist.
            `,
            guideDialogue: featuredPlaybook ? `The way you handled that conflict... it speaks of the ${featuredPlaybook.name}. Use that spark.` : "The Eight Ways are before you. Which path do you walk?",
            choices: [
                ...(featuredPlaybook ? [getArchetypeChoice(featuredPlaybook)] : []),
                ...playbooks.filter(p => p.id !== featuredPlaybook?.id).map(getArchetypeChoice)
            ]
        }
    }

    // ARCHETYPE INFO NODES
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
