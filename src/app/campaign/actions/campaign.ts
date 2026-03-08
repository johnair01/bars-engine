'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { deriveAvatarConfig } from '@/lib/avatar-utils'
import { z } from 'zod'
import { hashPassword } from '@/lib/auth-utils'
import { createRequestId, logActionError } from '@/lib/mvp-observability'
import { isAuthBypassEmailVerificationEnabled } from '@/lib/mvp-flags'
import { login } from '@/actions/conclave-auth'
import { getPostSignupRedirect, getDashboardRedirectForPlayer } from '@/actions/config'

const CampaignIdentitySchema = z.object({
    contact: z.string().email(),
    password: z.string().min(6),
})

function deriveTemporaryNameFromEmail(email: string): string {
    const localPart = email.split('@')[0]?.trim() || ''
    if (localPart.length >= 2) return localPart.slice(0, 50)
    return 'Traveler'
}

export async function createCampaignPlayer(prevState: any, formData: FormData) {
    const requestId = createRequestId()
    const rawData = {
        identity: formData.get('identity'),
        campaignState: formData.get('campaignState')
    }

    let identity
    try {
        const parsed = JSON.parse(rawData.identity as string)
        identity = CampaignIdentitySchema.parse(parsed)
    } catch (e: any) {
        return { error: `Invalid Identity: ${e?.message}` }
    }

    let campaignState = {}
    try {
        if (rawData.campaignState) {
            campaignState = JSON.parse(rawData.campaignState as string)
        }
    } catch (e) {
        console.warn("Failed to parse campaign state", e)
    }

    try {
        if (isAuthBypassEmailVerificationEnabled()) {
            console.info(`[MVP][createCampaignPlayer] req=${requestId} AUTH_BYPASS_EMAIL_VERIFICATION enabled (dev-only)`)
        }

        const existingAccount = await db.account.findUnique({ where: { email: identity.contact } })
        if (existingAccount) return { error: 'Account already exists. Please log in.' }
        const temporaryName = deriveTemporaryNameFromEmail(identity.contact)

        const passwordHash = await hashPassword(identity.password)

        const player = await db.$transaction(async (tx) => {
            const account = await tx.account.create({
                data: {
                    email: identity.contact,
                    passwordHash,
                }
            })

            const autoInvite = await tx.invite.create({
                data: {
                    token: `campaign_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                    status: 'used',
                    usedAt: new Date(),
                    players: {
                        create: {
                            accountId: account.id,
                            name: temporaryName,
                            contactType: 'email',
                            contactValue: identity.contact,
                            onboardingMode: 'guided',
                            // Add campaign state as a note for tracking, or inject into progress
                            // For now we persist it to storyProgress just so it's not lost
                            storyProgress: JSON.stringify({
                                campaignBypass: true,
                                state: campaignState
                            })
                        }
                    }
                },
                include: {
                    players: true
                }
            })

            const newPlayer = autoInvite.players[0]

            await tx.starterPack.create({
                data: {
                    playerId: newPlayer.id,
                    data: JSON.stringify({ completedBars: [] }),
                    initialVibeulons: 0,
                }
            })

            return newPlayer
        })

        // Assign orientation threads (reads personalization from storyProgress when available)
        // When lens present (Bruised Banana signup), assignOrientationThreads also assigns bruised-banana-orientation-thread
        const { assignOrientationThreads } = await import('@/actions/quest-thread')
        await assignOrientationThreads(player.id)

        // Apply campaign state: prefill nation/playbook/domain when the campaign collected them
        const state = campaignState as Record<string, unknown>
        let nationId: string | null = null
        let playbookId: string | null = null
        if (state?.nationId && typeof state.nationId === 'string') {
            const exists = await db.nation.findUnique({ where: { id: state.nationId }, select: { id: true } })
            if (exists) nationId = state.nationId
        }
        if (!nationId && state?.nation && typeof state.nation === 'string') {
            const byName = await db.nation.findFirst({ where: { name: { equals: state.nation, mode: 'insensitive' } }, select: { id: true } })
            if (byName) nationId = byName.id
        }
        if (state?.playbookId && typeof state.playbookId === 'string') {
            const exists = await db.playbook.findUnique({ where: { id: state.playbookId }, select: { id: true } })
            if (exists) playbookId = state.playbookId
        }
        if (!playbookId && state?.playbook && typeof state.playbook === 'string') {
            const byName = await db.playbook.findFirst({ where: { name: { equals: state.playbook, mode: 'insensitive' } }, select: { id: true } })
            if (byName) playbookId = byName.id
        }
        // Note: draft "archetype" (connector, storyteller, strategist, etc.) = allyship superpower, not canonical archetype.
        // Only map explicit playbook names (8 canonical archetypes). Superpower stored in storyProgress for later use.
        // Apply campaignDomainPreference from campaignState (AC2.4)
        // Bruised Banana Twine: map lens to domain when no explicit preference
        const validDomainKeys = ['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING']
        let campaignDomainPreference: string | null = null
        const rawPref = state?.campaignDomainPreference
        if (typeof rawPref === 'string' && rawPref.trim()) {
            try {
                const parsed = JSON.parse(rawPref) as unknown
                if (Array.isArray(parsed)) {
                    const filtered = (parsed as string[]).filter((k) => validDomainKeys.includes(k))
                    if (filtered.length > 0) campaignDomainPreference = JSON.stringify(filtered)
                } else if (typeof parsed === 'string' && validDomainKeys.includes(parsed)) {
                    campaignDomainPreference = JSON.stringify([parsed])
                }
            } catch {
                // Single key stored by BB flow (no JSON)
                const key = rawPref.trim()
                if (validDomainKeys.includes(key)) {
                    campaignDomainPreference = JSON.stringify([key])
                }
            }
        }
        // Bruised Banana Twine: derive domain from lens when no preference set
        if (!campaignDomainPreference && typeof state?.lens === 'string') {
            const lensToDomain: Record<string, string> = {
                allyship: 'RAISE_AWARENESS',
                creative: 'GATHERING_RESOURCES',
                strategic: 'SKILLFUL_ORGANIZING',
                community: 'DIRECT_ACTION',
            }
            const mapped = lensToDomain[state.lens.toLowerCase()]
            if (mapped && validDomainKeys.includes(mapped)) {
                campaignDomainPreference = JSON.stringify([mapped])
            }
        }
        // Bruised Banana onboarding draft: derive domain from intended_impact
        if (!campaignDomainPreference && typeof state?.intended_impact === 'string') {
            const impactToDomain: Record<string, string> = {
                gather_resources: 'GATHERING_RESOURCES',
                skillful_organizing: 'SKILLFUL_ORGANIZING',
                raise_awareness: 'RAISE_AWARENESS',
                direct_action: 'DIRECT_ACTION',
            }
            const mapped = impactToDomain[state.intended_impact.toLowerCase().replace(/-/g, '_')]
            if (mapped && validDomainKeys.includes(mapped)) {
                campaignDomainPreference = JSON.stringify([mapped])
            }
        }

        // Fetch Nation/Playbook names for stable avatar part keys
        let nationName: string | null = null
        let playbookName: string | null = null
        if (nationId) {
            const n = await db.nation.findUnique({ where: { id: nationId }, select: { name: true } })
            if (n) nationName = n.name
        }
        if (playbookId) {
            const p = await db.playbook.findUnique({ where: { id: playbookId }, select: { name: true } })
            if (p) playbookName = p.name
        }
        const avatarConfig = deriveAvatarConfig(
            nationId,
            playbookId,
            campaignDomainPreference,
            { nationName, playbookName }
        )
        if (nationId !== null || playbookId !== null || campaignDomainPreference !== null || avatarConfig !== null) {
            await db.player.update({
                where: { id: player.id },
                data: {
                    ...(nationId !== null && { nationId }),
                    ...(playbookId !== null && { playbookId }),
                    ...(campaignDomainPreference !== null && { campaignDomainPreference }),
                    ...(avatarConfig !== null && { avatarConfig })
                }
            })
            const { assignGatedThreads } = await import('@/actions/onboarding')
            await assignGatedThreads(player.id)
        }

        // Finalize pending BAR from Twine onboarding (Bruised Banana initiation)
        const pendingBar = state?.pendingBar as {
            refinedSignal?: string
            barContent?: string
            rawSignal?: string
            lens?: string
            quadrant?: string
            campaignId?: string
            developmental_lens?: string
            intended_impact?: string
            gm?: string
        } | undefined
        const barSignal = pendingBar?.refinedSignal ?? pendingBar?.barContent
        if (barSignal) {
            const { finalizePendingBar } = await import('@/actions/onboarding-bar')
            const lens = (pendingBar?.developmental_lens ?? pendingBar?.lens ?? pendingBar?.gm ?? '') as string
            const quadrant = (pendingBar?.intended_impact ?? pendingBar?.quadrant ?? '') as string
            const payload = {
                title: (barSignal as string).slice(0, 40),
                content: barSignal as string,
                rawSignal: (pendingBar?.rawSignal ?? barSignal) as string,
                lens,
                quadrant,
                campaignId: (pendingBar?.campaignId as string) ?? 'bruised-banana'
            }
            const result = await finalizePendingBar(player.id, payload)
            if (result && 'barId' in result) {
                console.log(`[MVP] Finalized onboarding BAR ${result.barId} for campaign player ${player.id}`)
            }
        }

        // Seed Vibeulons (Give 5 instead of 3 for Campaign heroes as a reward for completing Act 5)
        const seedAmount = parseInt(process.env.MVP_SEED_VIBEULONS || '3', 10) + 2

        const { mintVibulon } = await import('@/actions/economy')
        await mintVibulon(player.id, seedAmount, {
            source: 'campaign_seed',
            id: 'campaign_starter',
            title: 'Wake-Up Campaign Bonus'
        }, { skipRevalidate: true })
        console.log(`[MVP] Seeded ${seedAmount} vibeulons for campaign player ${player.id}`)

        const cookieStore = await cookies()
        cookieStore.set('bars_player_id', player.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        })

        const postSignupRedirect = await getPostSignupRedirect()
        const redirectTo =
            postSignupRedirect === 'dashboard'
                ? await getDashboardRedirectForPlayer(player.id)
                : '/conclave/onboarding'

        return { success: true, redirectTo }
    } catch (e: any) {
        logActionError(
            { action: 'createCampaignPlayer', requestId, userId: null, extra: { email: identity?.contact } },
            e
        )
        return { error: `Account creation failed (req: ${requestId})` }
    }
}

export type LoginWithCampaignStateResult = {
    error?: string
    success?: boolean
    redirectTo?: string
}

/**
 * Log in and apply campaign state. Used when existing player reaches auth node in campaign CYOA.
 */
export async function loginWithCampaignState(
    _prevState: LoginWithCampaignStateResult | null,
    formData: FormData
): Promise<LoginWithCampaignStateResult> {
    const loginResult = await login(formData)
    if (loginResult.error) return loginResult

    const campaignStateRaw = formData.get('campaignState') as string | null
    let campaignState: Record<string, unknown> = {}
    if (campaignStateRaw) {
        try {
            const parsed = JSON.parse(campaignStateRaw) as unknown
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                campaignState = parsed as Record<string, unknown>
            }
        } catch {
            // ignore
        }
    }

    if (Object.keys(campaignState).length > 0) {
        const applyResult = await applyCampaignStateToExistingPlayer(campaignState)
        if (applyResult.error) return { error: applyResult.error }
    }

    const postSignupRedirect = await getPostSignupRedirect()
    let redirectTo: string
    if (postSignupRedirect === 'dashboard') {
        const cookieStore = await cookies()
        const playerId = cookieStore.get('bars_player_id')?.value
        redirectTo = playerId ? await getDashboardRedirectForPlayer(playerId) : '/'
    } else {
        redirectTo = '/conclave/onboarding'
    }
    return { success: true, redirectTo }
}

/**
 * Form action: apply campaign state (for "Continue to campaign" when logged in).
 * Use this as the form action attribute - accepts FormData only.
 */
export async function applyCampaignStateFormAction(formData: FormData) {
    return applyCampaignStateAction(formData)
}

async function applyCampaignStateAction(formData: FormData) {
    const campaignStateRaw = formData.get('campaignState') as string | null
    let campaignState: Record<string, unknown> = {}
    if (campaignStateRaw) {
        try {
            const parsed = JSON.parse(campaignStateRaw) as unknown
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                campaignState = parsed as Record<string, unknown>
            }
        } catch {
            // ignore
        }
    }
    const result = await applyCampaignStateToExistingPlayer(campaignState)
    if (result.error) return { error: result.error }

    const postSignupRedirect = await getPostSignupRedirect()
    if (postSignupRedirect === 'dashboard') {
        const cookieStore = await cookies()
        const playerId = cookieStore.get('bars_player_id')?.value
        const target = playerId ? await getDashboardRedirectForPlayer(playerId) : '/'
        redirect(target)
    } else {
        redirect('/conclave/onboarding')
    }
}

/**
 * Apply campaign state to an existing logged-in player.
 * Merges state into storyProgress, assigns orientation threads (including bruised-banana when lens present).
 * Used when: (1) logged-in player clicks "Continue to campaign", (2) existing player logs in from campaign auth form.
 */
export async function applyCampaignStateToExistingPlayer(campaignState: Record<string, unknown>) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) return { error: 'Not logged in' }

    const player = await db.player.findUnique({
        where: { id: playerId },
        select: { id: true, storyProgress: true }
    })
    if (!player) return { error: 'Player not found' }

    const state = campaignState as Record<string, unknown>
    const mergedProgress = {
        campaignBypass: true,
        state: { ...(typeof state === 'object' && state ? state : {}) }
    }
    await db.player.update({
        where: { id: playerId },
        data: { storyProgress: JSON.stringify(mergedProgress) }
    })

    const { assignOrientationThreads } = await import('@/actions/quest-thread')
    await assignOrientationThreads(playerId)

    // Apply nation/playbook/domain/avatar when campaign collected them (same as createCampaignPlayer)
    const validDomainKeys = ['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING']
    let nationId: string | null = null
    let playbookId: string | null = null
    if (state?.nationId && typeof state.nationId === 'string') {
        const exists = await db.nation.findUnique({ where: { id: state.nationId }, select: { id: true } })
        if (exists) nationId = state.nationId
    }
    if (!nationId && state?.nation && typeof state.nation === 'string') {
        const byName = await db.nation.findFirst({ where: { name: { equals: state.nation, mode: 'insensitive' } }, select: { id: true } })
        if (byName) nationId = byName.id
    }
    if (state?.playbookId && typeof state.playbookId === 'string') {
        const exists = await db.playbook.findUnique({ where: { id: state.playbookId }, select: { id: true } })
        if (exists) playbookId = state.playbookId
    }
    if (!playbookId && state?.playbook && typeof state.playbook === 'string') {
        const byName = await db.playbook.findFirst({ where: { name: { equals: state.playbook, mode: 'insensitive' } }, select: { id: true } })
        if (byName) playbookId = byName.id
    }
    // Note: draft "archetype" = allyship superpower; only map explicit playbook (8 canonical archetypes)
    let campaignDomainPreference: string | null = null
    const rawPref = state?.campaignDomainPreference
    if (typeof rawPref === 'string' && rawPref.trim()) {
        try {
            const parsed = JSON.parse(rawPref) as unknown
            if (Array.isArray(parsed)) {
                const filtered = (parsed as string[]).filter((k) => validDomainKeys.includes(k))
                if (filtered.length > 0) campaignDomainPreference = JSON.stringify(filtered)
            } else if (typeof parsed === 'string' && validDomainKeys.includes(parsed)) {
                campaignDomainPreference = JSON.stringify([parsed])
            }
        } catch {
            const key = rawPref.trim()
            if (validDomainKeys.includes(key)) campaignDomainPreference = JSON.stringify([key])
        }
    }
    if (!campaignDomainPreference && typeof state?.lens === 'string') {
        const lensToDomain: Record<string, string> = {
            allyship: 'RAISE_AWARENESS',
            creative: 'GATHERING_RESOURCES',
            strategic: 'SKILLFUL_ORGANIZING',
            community: 'DIRECT_ACTION',
        }
        const mapped = lensToDomain[state.lens.toLowerCase()]
        if (mapped && validDomainKeys.includes(mapped)) {
            campaignDomainPreference = JSON.stringify([mapped])
        }
    }
    if (!campaignDomainPreference && typeof state?.intended_impact === 'string') {
        const impactToDomain: Record<string, string> = {
            gather_resources: 'GATHERING_RESOURCES',
            skillful_organizing: 'SKILLFUL_ORGANIZING',
            raise_awareness: 'RAISE_AWARENESS',
            direct_action: 'DIRECT_ACTION',
        }
        const mapped = impactToDomain[state.intended_impact.toLowerCase().replace(/-/g, '_')]
        if (mapped && validDomainKeys.includes(mapped)) {
            campaignDomainPreference = JSON.stringify([mapped])
        }
    }

    let nationName: string | null = null
    let playbookName: string | null = null
    if (nationId) {
        const n = await db.nation.findUnique({ where: { id: nationId }, select: { name: true } })
        if (n) nationName = n.name
    }
    if (playbookId) {
        const p = await db.playbook.findUnique({ where: { id: playbookId }, select: { name: true } })
        if (p) playbookName = p.name
    }
    const avatarConfig = deriveAvatarConfig(
        nationId,
        playbookId,
        campaignDomainPreference,
        { nationName, playbookName }
    )
    if (nationId !== null || playbookId !== null || campaignDomainPreference !== null || avatarConfig !== null) {
        await db.player.update({
            where: { id: playerId },
            data: {
                ...(nationId !== null && { nationId }),
                ...(playbookId !== null && { playbookId }),
                ...(campaignDomainPreference !== null && { campaignDomainPreference }),
                ...(avatarConfig !== null && { avatarConfig })
            }
        })
        const { assignGatedThreads } = await import('@/actions/onboarding')
        await assignGatedThreads(playerId)
    }

    return { success: true }
}
