/**
 * @route GET /api/adventures/:slug/:nodeId
 * @entity CAMPAIGN
 * @description Fetch a specific passage node within a CYOA adventure, with special handling for Bruised Banana campaign intake and character creation flows
 * @permissions public
 * @params slug:string (path, required) - Adventure slug identifier
 * @params nodeId:string (path, required) - Passage node identifier
 * @query ref:string (optional) - Reference context (e.g., "bruised-banana")
 * @query preview:string (optional) - Enable draft preview ("1" for admins)
 * @query face:string (optional) - GM face filter for portal moves
 * @relationships CAMPAIGN (adventure), PLAYER (session), QUEST (linkedQuestId)
 * @dimensions WHO:player session, WHAT:passage content, WHERE:adventure context, ENERGY:vibeulons
 * @example /api/adventures/bruised-banana/BB_Intro
 * @example /api/adventures/wake-up/signup?ref=bruised-banana
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { getActiveInstance } from '@/actions/instance'
import { slugifyName } from '@/lib/avatar-utils'
import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'
import { chunkIntoSlides } from '@/lib/slide-chunker'
import { resolveTemplates } from '@/lib/template-resolver'
import { finalizeAdventureNodePayload } from '@/lib/cyoa/filter-choices'
import { getFaceMoveContent, moveFromEmitNodeId, EMIT_NODE_IDS } from '@/lib/cyoa/face-move-passages'

const DEFAULT_WAKE_UP = `The Bruised Banana Residency is a creative space and community supporting artists, healers, and changemakers.
Your awareness and participation help the collective thrive.`

const DEFAULT_SHOW_UP = `Contribute money (Donate above) or play the game by signing up and choosing your domains.
This instance runs on quests, BARs, vibeulons, and story clock.`

const MVP_SEED_VIBEULONS = parseInt(process.env.MVP_SEED_VIBEULONS || '3', 10)
const BB_TOTAL_STEPS = 11

/** When ref=bruised-banana, return dynamic Bruised Banana intro/showup nodes from instance */
async function getBruisedBananaNode(nodeId: string): Promise<{ id: string; text: string; choices: { text: string; targetId: string }[]; stepIndex?: number; totalSteps?: number } | null> {
    if (nodeId === 'BB_Intro') {
        const instance = await getActiveInstance()
        const wakeUp = instance?.wakeUpContent ?? DEFAULT_WAKE_UP
        const storyBridge = instance?.storyBridgeCopy?.trim()
        const text = storyBridge ? `${storyBridge}\n\n${wakeUp}` : wakeUp
        const chunks = chunkIntoSlides(text)
        if (chunks.length > 1) {
            return {
                id: 'BB_Intro_1',
                text: chunks[0],
                choices: [
                    { text: 'Continue', targetId: 'BB_Intro_2' },
                    { text: 'Learn more about the game', targetId: 'BB_LearnMore' }
                ],
                stepIndex: 1,
                totalSteps: BB_TOTAL_STEPS
            }
        }
        return {
            id: 'BB_Intro',
            text,
            choices: [
                { text: 'Continue', targetId: 'BB_ShowUp' },
                { text: 'Learn more about the game', targetId: 'BB_LearnMore' }
            ],
            stepIndex: 1,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    if (/^BB_Intro_\d+$/.test(nodeId)) {
        const instance = await getActiveInstance()
        const wakeUp = instance?.wakeUpContent ?? DEFAULT_WAKE_UP
        const storyBridge = instance?.storyBridgeCopy?.trim()
        const text = storyBridge ? `${storyBridge}\n\n${wakeUp}` : wakeUp
        const chunks = chunkIntoSlides(text)
        const idx = parseInt(nodeId.replace('BB_Intro_', ''), 10)
        if (idx < 1 || idx > chunks.length) return null
        const isLast = idx === chunks.length
        const choices: { text: string; targetId: string }[] = [
            { text: 'Continue', targetId: isLast ? 'BB_ShowUp' : `BB_Intro_${idx + 1}` }
        ]
        return {
            id: nodeId,
            text: chunks[idx - 1],
            choices,
            stepIndex: 1,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    if (nodeId === 'BB_LearnMore') {
        return {
            id: 'BB_LearnMore',
            stepIndex: 2,
            totalSteps: BB_TOTAL_STEPS,
            text: `**Learn more** — Explore the knowledge base for definitions and lore:\n\n- [Bruised Banana campaign](/wiki/campaign/bruised-banana)\n- [The 4 moves](/wiki/moves)\n- [Allyship domains](/wiki/domains)\n- [Glossary](/wiki/glossary) (vibeulons, BAR, Kotter)`,
            choices: [{ text: 'Continue to choose my path', targetId: 'BB_ShowUp' }]
        }
    }
    if (nodeId === 'BB_ShowUp') {
        const instance = await getActiveInstance()
        let text = instance?.showUpContent ?? DEFAULT_SHOW_UP
        const hasDonateUrl = !!(instance?.stripeOneTimeUrl || instance?.venmoUrl || instance?.cashappUrl || instance?.paypalUrl)
        if (hasDonateUrl) {
            text += '\n\n[Contribute to the campaign](/event/donate) — donate before or after playing.'
        }
        const chunks = chunkIntoSlides(text)
        if (chunks.length > 1) {
            return {
                id: 'BB_ShowUp_1',
                text: chunks[0],
                choices: [{ text: 'Continue', targetId: 'BB_ShowUp_2' }],
                stepIndex: 2,
                totalSteps: BB_TOTAL_STEPS
            }
        }
        return {
            id: 'BB_ShowUp',
            text,
            choices: [{ text: 'Continue', targetId: 'BB_Developmental_Q1' }],
            stepIndex: 2,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    if (/^BB_ShowUp_\d+$/.test(nodeId)) {
        const instance = await getActiveInstance()
        let text = instance?.showUpContent ?? DEFAULT_SHOW_UP
        const hasDonateUrl = !!(instance?.stripeOneTimeUrl || instance?.venmoUrl || instance?.cashappUrl || instance?.paypalUrl)
        if (hasDonateUrl) {
            text += '\n\n[Contribute to the campaign](/event/donate) — donate before or after playing.'
        }
        const chunks = chunkIntoSlides(text)
        const idx = parseInt(nodeId.replace('BB_ShowUp_', ''), 10)
        if (idx < 1 || idx > chunks.length) return null
        const isLast = idx === chunks.length
        const choices: { text: string; targetId: string }[] = isLast
            ? [{ text: 'Continue', targetId: 'BB_Developmental_Q1' }]
            : [{ text: 'Continue', targetId: `BB_ShowUp_${idx + 1}` }]
        return {
            id: nodeId,
            text: chunks[idx - 1],
            choices,
            stepIndex: 2,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    // Developmental assessment (simplified Integral Theory hint)
    if (nodeId === 'BB_Developmental_Q1') {
        return {
            id: 'BB_Developmental_Q1',
            text: '**What draws you most right now?** — A quick signal to personalize your experience.',
            choices: [
                { text: 'Understanding — I want to see the big picture first', targetId: 'BB_SetDevelopmental_cognitive' },
                { text: 'Connecting — I want to relate and feel into it', targetId: 'BB_SetDevelopmental_emotional' },
                { text: 'Acting — I want to do something concrete', targetId: 'BB_SetDevelopmental_action' }
            ],
            stepIndex: 3,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    if (nodeId.startsWith('BB_SetDevelopmental_')) {
        const hint = nodeId.replace('BB_SetDevelopmental_', '')
        return {
            id: nodeId,
            text: `<<set $developmentalHint = "${hint}">>Got it. Now choose your path.`,
            choices: [{ text: 'Continue', targetId: 'BB_ChooseNation' }],
            stepIndex: 3,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    if (nodeId === 'BB_ChooseNation') {
        const nations = await db.nation.findMany({
            where: { archived: false },
            orderBy: { name: 'asc' },
            select: { id: true, name: true }
        })
        const choices = nations.map((n) => ({
            text: `Read about ${n.name}`,
            targetId: `BB_NationInfo_${n.id}`
        }))
        return {
            id: 'BB_ChooseNation',
            text: '**Choose your Nation** — WHO you are in the game. Read about each nation before choosing.',
            choices,
            stepIndex: 4,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    if (nodeId.startsWith('BB_NationInfo_')) {
        const nationId = nodeId.replace('BB_NationInfo_', '')
        const nation = await db.nation.findUnique({
            where: { id: nationId },
            select: { id: true, name: true, description: true, wakeUp: true, cleanUp: true, growUp: true, showUp: true }
        })
        if (!nation) return null
        const movesText = [nation.wakeUp, nation.cleanUp, nation.growUp, nation.showUp].some(Boolean)
            ? `\n\n*Wake Up*: ${nation.wakeUp ?? '—'}\n*Clean Up*: ${nation.cleanUp ?? '—'}\n*Grow Up*: ${nation.growUp ?? '—'}\n*Show Up*: ${nation.showUp ?? '—'}`
            : ''
        return {
            id: nodeId,
            text: `**${nation.name}**\n\n${nation.description}${movesText}`,
            choices: [
                { text: `Choose this nation`, targetId: `BB_SetNation_${nation.id}` },
                { text: 'Back to list', targetId: 'BB_ChooseNation' }
            ],
            stepIndex: 4,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    if (nodeId === 'BB_ChoosePlaybook') {
        const playbooks = await db.archetype.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true }
        })
        const choices = playbooks.map((p) => ({
            text: `Read about ${p.name}`,
            targetId: `BB_PlaybookInfo_${p.id}`
        }))
        return {
            id: 'BB_ChoosePlaybook',
            text: '**Choose your Archetype (Playbook)** — your character\'s lens and moves. Read about each before choosing.',
            choices,
            stepIndex: 5,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    if (nodeId.startsWith('BB_PlaybookInfo_')) {
        const playbookId = nodeId.replace('BB_PlaybookInfo_', '')
        const playbook = await db.archetype.findUnique({
            where: { id: playbookId },
            select: { id: true, name: true, description: true, wakeUp: true, cleanUp: true, growUp: true, showUp: true }
        })
        if (!playbook) return null
        const movesText = [playbook.wakeUp, playbook.cleanUp, playbook.growUp, playbook.showUp].some(Boolean)
            ? `\n\n*Wake Up*: ${playbook.wakeUp ?? '—'}\n*Clean Up*: ${playbook.cleanUp ?? '—'}\n*Grow Up*: ${playbook.growUp ?? '—'}\n*Show Up*: ${playbook.showUp ?? '—'}`
            : ''
        return {
            id: nodeId,
            text: `**${playbook.name}**\n\n${playbook.description}${movesText}`,
            choices: [
                { text: 'Choose this archetype', targetId: `BB_SetPlaybook_${playbook.id}` },
                { text: 'Back to list', targetId: 'BB_ChoosePlaybook' }
            ],
            stepIndex: 5,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    if (nodeId === 'BB_ChooseDomain') {
        const choices = ALLYSHIP_DOMAINS.map((d) => ({
            text: d.label,
            targetId: `BB_SetDomain_${d.key}`
        }))
        return {
            id: 'BB_ChooseDomain',
            text: '**Choose your campaign path (Allyship Domain)** — WHERE you want to focus. This shapes which quests you\'ll see.',
            choices,
            stepIndex: 6,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    // BB_SetNation_<id>: set nation state + nationKey for avatar parts, continue to playbook
    if (nodeId.startsWith('BB_SetNation_')) {
        const nationId = nodeId.replace('BB_SetNation_', '')
        const nation = await db.nation.findUnique({ where: { id: nationId }, select: { name: true } })
        if (!nation) return null
        const nationKey = slugifyName(nation.name)
        return {
            id: nodeId,
            text: `<<set $nationId = "${nationId}">><<set $nation = "${nation.name}">><<set $nationKey = "${nationKey}">>You chose **${nation.name}**. Now choose your archetype.`,
            choices: [{ text: 'Continue', targetId: 'BB_ChoosePlaybook' }],
            stepIndex: 4,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    // BB_SetPlaybook_<id>: set playbook state + playbookKey for avatar parts, continue to domain
    if (nodeId.startsWith('BB_SetPlaybook_')) {
        const playbookId = nodeId.replace('BB_SetPlaybook_', '')
        const playbook = await db.archetype.findUnique({ where: { id: playbookId }, select: { name: true } })
        if (!playbook) return null
        const playbookKey = slugifyName(playbook.name)
        return {
            id: nodeId,
            text: `<<set $playbookId = "${playbookId}">><<set $playbook = "${playbook.name}">><<set $playbookKey = "${playbookKey}">>You chose **${playbook.name}**. Now choose your campaign path.`,
            choices: [{ text: 'Continue', targetId: 'BB_ChooseDomain' }],
            stepIndex: 5,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    // BB_SetDomain_<key>: set domain state, continue to moves
    if (nodeId.startsWith('BB_SetDomain_')) {
        const key = nodeId.replace('BB_SetDomain_', '')
        const domain = ALLYSHIP_DOMAINS.find((d) => d.key === key)
        if (!domain) return null
        return {
            id: nodeId,
            text: `<<set $campaignDomainPreference = "${key}">>You chose **${domain.label}**. Now learn the four moves.`,
            choices: [{ text: 'Continue', targetId: 'BB_Moves_Intro' }],
            stepIndex: 6,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    // 4 moves teaching nodes
    if (nodeId === 'BB_Moves_Intro') {
        return {
            id: 'BB_Moves_Intro',
            text: `**The Four Moves** — personal throughput in the game:\n\n- **Wake Up**: See more of what's available (who, what, where, how)\n- **Clean Up**: Get more emotional energy; unblock yourself\n- **Grow Up**: Level up skills through developmental lines\n- **Show Up**: Do the work — complete quests\n\nThese connect to your campaign path.`,
            choices: [{ text: 'Continue', targetId: 'BB_Moves_WakeUp' }],
            stepIndex: 7,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    if (nodeId === 'BB_Moves_WakeUp') {
        return {
            id: 'BB_Moves_WakeUp',
            text: `**Wake Up** — Raise awareness. See what's available: who can help, what resources exist, where the work happens, how to contribute. The Bruised Banana campaign needs people who wake up to the story and share it.`,
            choices: [{ text: 'Next', targetId: 'BB_Moves_CleanUp' }],
            stepIndex: 8,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    if (nodeId === 'BB_Moves_CleanUp') {
        return {
            id: 'BB_Moves_CleanUp',
            text: `**Clean Up** — Unblock emotional energy. When you're stuck, the Emotional First Aid kit helps. Clearing inner obstacles lets you take vibeulon-generating actions.`,
            choices: [{ text: 'Next', targetId: 'BB_Moves_GrowUp' }],
            stepIndex: 9,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    if (nodeId === 'BB_Moves_GrowUp') {
        return {
            id: 'BB_Moves_GrowUp',
            text: `**Grow Up** — Level up skills. Developmental lines (e.g. emotional, cognitive) expand your capacity. The campaign benefits when players grow.`,
            choices: [{ text: 'Next', targetId: 'BB_Moves_ShowUp' }],
            stepIndex: 10,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    if (nodeId === 'BB_Moves_ShowUp') {
        const vibeulonPreview = `Complete this flow to earn **${MVP_SEED_VIBEULONS} starter vibeulons** when you sign up.`
        return {
            id: 'BB_Moves_ShowUp',
            text: `**Show Up** — Do the work. Complete quests, contribute resources, take direct action. This is how the Bruised Banana Residency gets supported.\n\n${vibeulonPreview}`,
            choices: [{ text: 'Create my account', targetId: 'signup' }],
            stepIndex: 11,
            totalSteps: BB_TOTAL_STEPS
        }
    }
    return null
}

function buildTemplateContext(instance: Awaited<ReturnType<typeof getActiveInstance>>) {
    const hasDonateUrl = !!(instance?.stripeOneTimeUrl || instance?.venmoUrl || instance?.cashappUrl || instance?.paypalUrl)
    const wakeUp = instance?.wakeUpContent ?? DEFAULT_WAKE_UP
    const storyBridge = instance?.storyBridgeCopy?.trim()
    const introText = storyBridge ? `${storyBridge}\n\n${wakeUp}` : wakeUp
    return {
        instance: {
            wakeUpContent: wakeUp,
            showUpContent: instance?.showUpContent ?? DEFAULT_SHOW_UP,
            storyBridgeCopy: instance?.storyBridgeCopy ?? '',
            introText,
            donateLink: hasDonateUrl ? '\n\n[Contribute to the campaign](/event/donate) — donate before or after playing.' : ''
        },
        mvpSeedVibeulons: MVP_SEED_VIBEULONS
    }
}

/** When slug=bruised-banana, serve from Passages (with templates) or fall back to dynamic nodes */
async function getBruisedBananaFromPassages(nodeId: string, allowDraft?: boolean): Promise<{ id: string; text: string; choices: { text: string; targetId: string }[]; stepIndex?: number; totalSteps?: number } | null> {
    const adventure = await db.adventure.findUnique({
        where: { slug: 'bruised-banana' }
    })
    if (!adventure || (!allowDraft && adventure.status !== 'ACTIVE')) return null

    const instance = await getActiveInstance()
    const ctx = buildTemplateContext(instance)

    // BB_Intro / BB_Intro_N: chunk after resolve
    const introNodeId = /^BB_Intro(_\d+)?$/.test(nodeId) ? (nodeId === 'BB_Intro' ? 'BB_Intro' : nodeId) : null
    if (introNodeId) {
        const passage = await db.passage.findUnique({
            where: {
                adventureId_nodeId: { adventureId: adventure.id, nodeId: 'BB_Intro' }
            }
        })
        if (!passage) return getBruisedBananaNode(nodeId)
        const raw = resolveTemplates(passage.text, ctx)
        const chunks = chunkIntoSlides(raw)
        if (nodeId === 'BB_Intro') {
            if (chunks.length > 1) {
                return {
                    id: 'BB_Intro_1',
                    text: chunks[0],
                    choices: [
                        { text: 'Continue', targetId: 'BB_Intro_2' },
                        { text: 'Learn more about the game', targetId: 'BB_LearnMore' }
                    ],
                    stepIndex: 1,
                    totalSteps: BB_TOTAL_STEPS
                }
            }
            return {
                id: 'BB_Intro',
                text: raw,
                choices: JSON.parse(passage.choices),
                stepIndex: 1,
                totalSteps: BB_TOTAL_STEPS
            }
        }
        const match = nodeId.match(/^BB_Intro_(\d+)$/)
        if (match) {
            const idx = parseInt(match[1], 10)
            if (idx < 1 || idx > chunks.length) return null
            const isLast = idx === chunks.length
            return {
                id: nodeId,
                text: chunks[idx - 1],
                choices: [
                    { text: 'Continue', targetId: isLast ? 'BB_ShowUp' : `BB_Intro_${idx + 1}` }
                ],
                stepIndex: 1,
                totalSteps: BB_TOTAL_STEPS
            }
        }
    }

    // BB_ShowUp / BB_ShowUp_N: chunk after resolve
    const showUpMatch = /^BB_ShowUp(_\d+)?$/.exec(nodeId)
    if (showUpMatch) {
        const passage = await db.passage.findUnique({
            where: {
                adventureId_nodeId: { adventureId: adventure.id, nodeId: 'BB_ShowUp' }
            }
        })
        if (!passage) return getBruisedBananaNode(nodeId)
        const raw = resolveTemplates(passage.text, ctx)
        const chunks = chunkIntoSlides(raw)
        if (nodeId === 'BB_ShowUp') {
            if (chunks.length > 1) {
                return {
                    id: 'BB_ShowUp_1',
                    text: chunks[0],
                    choices: [{ text: 'Continue', targetId: 'BB_ShowUp_2' }],
                    stepIndex: 2,
                    totalSteps: BB_TOTAL_STEPS
                }
            }
            return {
                id: 'BB_ShowUp',
                text: raw,
                choices: JSON.parse(passage.choices),
                stepIndex: 2,
                totalSteps: BB_TOTAL_STEPS
            }
        }
        const idx = parseInt(nodeId.replace('BB_ShowUp_', ''), 10)
        if (idx < 1 || idx > chunks.length) return null
        const isLast = idx === chunks.length
        return {
            id: nodeId,
            text: chunks[idx - 1],
            choices: [{ text: 'Continue', targetId: isLast ? 'BB_Developmental_Q1' : `BB_ShowUp_${idx + 1}` }],
            stepIndex: 2,
            totalSteps: BB_TOTAL_STEPS
        }
    }

    // Other nodes: load Passage by nodeId
    const baseNodeId = nodeId
    const passage = await db.passage.findUnique({
        where: {
            adventureId_nodeId: { adventureId: adventure.id, nodeId: baseNodeId }
        }
    })
    if (passage) {
        const text = resolveTemplates(passage.text, ctx)
        const stepIndex = getStepIndex(baseNodeId)
        return {
            id: baseNodeId,
            text,
            choices: JSON.parse(passage.choices),
            stepIndex,
            totalSteps: BB_TOTAL_STEPS
        }
    }

    return getBruisedBananaNode(nodeId)
}

function getStepIndex(nodeId: string): number {
    const order = ['BB_Intro', 'BB_ShowUp', 'BB_LearnMore', 'BB_Developmental_Q1', 'BB_SetDevelopmental_cognitive', 'BB_SetDevelopmental_emotional', 'BB_SetDevelopmental_action', 'BB_ChooseNation', 'BB_NationInfo', 'BB_SetNation', 'BB_ChoosePlaybook', 'BB_PlaybookInfo', 'BB_SetPlaybook', 'BB_ChooseDomain', 'BB_SetDomain', 'BB_Moves_Intro', 'BB_Moves_WakeUp', 'BB_Moves_CleanUp', 'BB_Moves_GrowUp', 'BB_Moves_ShowUp']
    for (let i = 0; i < order.length; i++) {
        if (nodeId === order[i] || nodeId.startsWith(order[i] + '_')) return i + 1
    }
    return 1
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string, nodeId: string }> }
) {
    const p = await params
    const { slug, nodeId } = p
    const { searchParams } = new URL(request.url)
    const ref = searchParams.get('ref')
    const preview = searchParams.get('preview')
    const portalFace = searchParams.get('face') ?? undefined
    let allowDraft = false
    if (preview === '1') {
      const player = await getCurrentPlayer()
      const isAdmin = !!player?.roles?.some((r: { role: { key: string } }) => r.role.key === 'admin')
      allowDraft = isAdmin
    }

    try {
        const sessionPlayer = await getCurrentPlayer()
        const isAuthed = !!sessionPlayer

        // Bruised Banana: prefer Passages (editable) when slug=bruised-banana
        if (slug === 'bruised-banana') {
            const bbNode = await getBruisedBananaFromPassages(nodeId, allowDraft)
            if (bbNode) return NextResponse.json(finalizeAdventureNodePayload(bbNode, isAuthed))
            return NextResponse.json({ error: 'Node not found' }, { status: 404 })
        }

        // Legacy: ref=bruised-banana with wake-up slug (campaign may not yet pass bruised-banana)
        if (ref === 'bruised-banana' && slug === 'wake-up') {
            const bbNode = await getBruisedBananaNode(nodeId)
            if (bbNode) return NextResponse.json(finalizeAdventureNodePayload(bbNode, isAuthed))
        }

        const adventure = await db.adventure.findUnique({
            where: { slug }
        })

        if (!adventure || (!allowDraft && adventure.status !== 'ACTIVE')) {
            return NextResponse.json({ error: 'Adventure not found or inactive' }, { status: 404 })
        }

        const passage = await db.passage.findUnique({
            where: {
                adventureId_nodeId: {
                    adventureId: adventure.id,
                    nodeId
                }
            }
        })

        if (!passage) {
            return NextResponse.json({ error: 'Node not found' }, { status: 404 })
        }

        const choices = JSON.parse(passage.choices) as { text: string; targetId: string }[]
        const isCompletionPassage = !!passage.linkedQuestId && (!choices || choices.length === 0)

        const depthMatch = nodeId.match(/^depth_\d+_(shaman|challenger|regent|architect|diplomat|sage)$/)
        if (depthMatch) {
            const face = depthMatch[1]!
            const player = await getCurrentPlayer()
            if (player?.storyProgress) {
                try {
                    const parsed = JSON.parse(player.storyProgress) as { state?: Record<string, unknown> }
                    const state = parsed?.state ?? {}
                    const updates = { ...state, active_face: face, [`completed_${face}`]: true }
                    const faceKeys = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
                    const altitudeCount = faceKeys.filter((f) => updates[`completed_${f}`]).length
                    updates.altitude_count = altitudeCount
                    await db.player.update({
                        where: { id: player.id },
                        data: { storyProgress: JSON.stringify({ ...parsed, state: updates }) },
                    })
                } catch {
                    // Ignore parse/update errors
                }
            }
        }

        // Character creation state persistence (char_set_* from chained initiation)
        const charSetSuffix = nodeId.includes('char_set_') ? nodeId.split('char_set_')[1] : null
        if (charSetSuffix) {
            const player = await getCurrentPlayer()
            if (player) {
                try {
                    const parsed = (player.storyProgress ? JSON.parse(player.storyProgress) : {}) as { state?: Record<string, unknown> }
                    const state = parsed?.state ?? {}
                    const updates = { ...state }
                    let updatePlayer = false
                    const playerData: { nationId?: string; archetypeId?: string; campaignDomainPreference?: string; storyProgress: string } = {
                        storyProgress: JSON.stringify({ ...parsed, state: updates }),
                    }
                    if (charSetSuffix === 'cognitive' || charSetSuffix === 'emotional' || charSetSuffix === 'action') {
                        updates.developmentalHint = charSetSuffix
                        updatePlayer = true
                    } else if (charSetSuffix.startsWith('nation_')) {
                        const nationId = charSetSuffix.slice(7)
                        if (nationId) {
                            updates.nationId = nationId
                            playerData.nationId = nationId
                            updatePlayer = true
                        }
                    } else if (charSetSuffix.startsWith('playbook_') || charSetSuffix.startsWith('archetype_')) {
                        const archetypeId = charSetSuffix.startsWith('playbook_') ? charSetSuffix.slice(9) : charSetSuffix.slice(10)
                        if (archetypeId) {
                            updates.playbookId = archetypeId
                            updates.archetypeId = archetypeId
                            playerData.archetypeId = archetypeId
                            updatePlayer = true
                        }
                    } else if (charSetSuffix.startsWith('domain_')) {
                        const domainKey = charSetSuffix.slice(7)
                        if (domainKey) {
                            updates.campaignDomainPreference = JSON.stringify([domainKey])
                            playerData.campaignDomainPreference = JSON.stringify([domainKey])
                            updatePlayer = true
                        }
                    }
                    if (updatePlayer) {
                        await db.player.update({
                            where: { id: player.id },
                            data: playerData,
                        })
                    }
                } catch {
                    // Ignore parse/update errors
                }
            }
        }

        // GM face from moves packet (gm_set_*)
        const gmSetMatch = nodeId.match(/(?:^|_)gm_set_(shaman|challenger|regent|architect|diplomat|sage)$/)
        if (gmSetMatch) {
            const face = gmSetMatch[1]!
            const player = await getCurrentPlayer()
            if (player?.storyProgress) {
                try {
                    const parsed = JSON.parse(player.storyProgress) as { state?: Record<string, unknown> }
                    const state = parsed?.state ?? {}
                    const updates = { ...state, active_face: face }
                    await db.player.update({
                        where: { id: player.id },
                        data: { storyProgress: JSON.stringify({ ...parsed, state: updates }) },
                    })
                } catch {
                    // Ignore parse/update errors
                }
            }
        }

        const metadata = passage.metadata as {
            actionType?: string
            castIChingTargetId?: string
            moveType?: string
            beat?: string
        } | null

        // Face × move override: inject face-specific text + barTemplate for emit nodes
        const portalMove = moveFromEmitNodeId(nodeId)
        if (portalMove && portalFace) {
            const faceMoveContent = getFaceMoveContent(portalFace, portalMove)
            if (faceMoveContent) {
                return NextResponse.json(
                    finalizeAdventureNodePayload(
                        {
                            id: passage.nodeId,
                            text: faceMoveContent.passage,
                            choices: [],
                            metadata: {
                                actionType: 'bar_emit',
                                blueprintKey: faceMoveContent.blueprintKey,
                                barTemplate: {
                                    defaultTitle: faceMoveContent.barTitle,
                                    defaultDescription: faceMoveContent.barPrompt,
                                },
                                nextTargetId: EMIT_NODE_IDS.hubReturn,
                            },
                        },
                        isAuthed
                    )
                )
            }
        }

        return NextResponse.json(
            finalizeAdventureNodePayload(
                {
                    id: passage.nodeId,
                    text: passage.text,
                    choices,
                    linkedQuestId: passage.linkedQuestId ?? undefined,
                    isCompletionPassage: isCompletionPassage || undefined,
                    metadata: metadata ?? undefined,
                },
                isAuthed
            )
        )
    } catch (e) {
        return NextResponse.json({ error: 'Failed to load node' }, { status: 500 })
    }
}
