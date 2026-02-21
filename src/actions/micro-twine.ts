'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { parseTwineHtml } from '@/lib/twine-parser'

export interface MicroTwineOption {
    text: string
    targetMomentId: string // e.g. "moment_2" or "exit_3"
    outcomeValue?: string  // e.g. "success", "chaos", "silver"
}

export interface MicroTwineMoment {
    id: string
    title: string
    text: string
    options: MicroTwineOption[]
}

export interface MicroTwineConfig {
    prologue: string
    moments: MicroTwineMoment[]
    epilogue: string
    outcomeVarName: string // e.g. "$outcome"
}

/**
 * Save or update a Micro-Twine module draft for a specific quest.
 */
export async function saveMicroTwineModule(questId: string, config: MicroTwineConfig) {
    try {
        const player = await getCurrentPlayer()
        if (!player) return { error: 'Not logged in' }

        // Security check: Only admins or the quest creator (if we allow player-authored twine)
        const isAdmin = player.roles.some(r => r.role.key.toUpperCase() === 'ADMIN')
        const quest = await db.customBar.findUnique({
            where: { id: questId },
            select: { creatorId: true }
        })

        if (!isAdmin && quest?.creatorId !== player.id) {
            return { error: 'Unauthorized to edit this quest narrative' }
        }

        const canonicalJson = JSON.stringify(config)

        const module = await db.microTwineModule.upsert({
            where: { questId },
            update: {
                canonicalJson,
                updatedAt: new Date(),
            },
            create: {
                questId,
                canonicalJson,
                tweeSource: '', // To be generated in Rite 3
                isDraft: true,
            }
        })

        revalidatePath(`/admin/world/quest/${questId}`)
        return { success: true, moduleId: module.id }
    } catch (err: any) {
        console.error('[MicroTwine] Save failed:', err)
        return { error: err.message || 'Failed to save narrative' }
    }
}

/**
 * Fetch the Micro-Twine configuration for a quest.
 */
export async function getMicroTwineConfig(questId: string): Promise<{ config: MicroTwineConfig, isCompiled: boolean } | null> {
    const module = await db.microTwineModule.findUnique({
        where: { questId }
    })

    if (!module) return null

    try {
        return {
            config: JSON.parse(module.canonicalJson) as MicroTwineConfig,
            isCompiled: !!module.htmlArtifact
        }
    } catch {
        return null
    }
}

/**
 * Compile the canonical JSON into Twee source and a standalone HTML artifact.
 */
export async function compileMicroTwine(questId: string) {
    try {
        const result = await getMicroTwineConfig(questId)
        if (!result) return { error: 'No narrative config found' }
        const { config } = result

        // 1. Generate Twee Source
        let twee = `:: StoryTitle\n${questId} Narrative\n\n`
        twee += `:: StoryData\n{\n  "ifid": "${questId}-ifid",\n  "format": "SugarCube",\n  "format-version": "2.36.1",\n  "start": "Start"\n}\n\n`

        // Start Node (Prologue)
        twee += `:: Start\n${config.prologue}\n\n[[Next|moment_1]]\n\n`

        // Moments
        config.moments.forEach((m: MicroTwineMoment) => {
            twee += `:: ${m.id}\n${m.text}\n\n`
            m.options.forEach((opt: MicroTwineOption) => {
                const outcomeSetter = opt.outcomeValue ? `<<set ${config.outcomeVarName} to "${opt.outcomeValue}">>` : ''
                twee += `[[${opt.text}|${opt.targetMomentId}]]{${outcomeSetter}}\n`
            })
            twee += '\n'
        })

        // Exits (Fixed)
        const FIXED_EXITS = ['SUCCESS', 'FAILURE', 'CHAOS', 'ORDER', 'SHADOW', 'LIGHT', 'MERCY', 'JUSTICE']
        FIXED_EXITS.forEach(ex => {
            twee += `:: exit_${ex}\n[[Continue|Epilogue]]\n\n`
        })

        // Epilogue (Inject BIND markers)
        // [BIND quest_complete=<QuestSlug>]
        const bindMarkers = `\n\n[BIND quest_complete=${questId}]`
        twee += `:: Epilogue\n${config.epilogue}${bindMarkers}\n`

        // 2. Generate Twine 2 HTML Artifact (Minimal Wrapper)
        const passages = [
            { id: '1', name: 'Start', text: `${config.prologue}\n\n[[Next|moment_1]]` },
            ...config.moments.map((m: MicroTwineMoment, i: number) => ({
                id: (i + 2).toString(),
                name: m.id,
                text: `${m.text}\n\n${m.options.map((o: MicroTwineOption) => `[[${o.text}|${o.targetMomentId}]]`).join('\n')}`
            })),
            ...FIXED_EXITS.map((ex, i) => ({
                id: (config.moments.length + i + 2).toString(),
                name: `exit_${ex}`,
                text: `[[Continue|Epilogue]]`
            })),
            {
                id: (config.moments.length + FIXED_EXITS.length + 2).toString(),
                name: 'Epilogue',
                text: `${config.epilogue}${bindMarkers}`
            }
        ]

        const storyData = `
<tw-storydata name="${questId} Narrative" startnode="1" creator="Micro-Twine Wizard" creator-version="1.0.0" ifid="${questId}-ifid" format="SugarCube" format-version="2.36.1">
${passages.map(p => `  <tw-passagedata pid="${p.id}" name="${p.name}" tags="" x="0" y="0">${p.text}</tw-passagedata>`).join('\n')}
</tw-storydata>`.trim()

        const htmlArtifact = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Quest Narrative</title></head><body>${storyData}</body></html>`

        // 3. Save to MicroTwine module
        await db.microTwineModule.update({
            where: { questId },
            data: {
                tweeSource: twee,
                htmlArtifact,
                isDraft: false
            }
        })

        // 4. Bridge to TwineStory system: upsert a TwineStory from compiled HTML
        //    so the quest can be played via the full Twine player
        const quest = await db.customBar.findUnique({
            where: { id: questId },
            select: { id: true, title: true, twineStoryId: true, creatorId: true }
        })

        if (quest) {
            let twineStoryId = quest.twineStoryId

            // Parse the HTML to get structured passage data
            const parsedStory = parseTwineHtml(htmlArtifact)

            if (twineStoryId) {
                // Update existing TwineStory with recompiled HTML
                await db.twineStory.update({
                    where: { id: twineStoryId },
                    data: {
                        sourceText: htmlArtifact,
                        parsedJson: JSON.stringify(parsedStory),
                    }
                })
            } else {
                // Create new TwineStory from compiled output
                const twineStory = await db.twineStory.create({
                    data: {
                        title: quest.title || `${questId} Narrative`,
                        sourceText: htmlArtifact,
                        parsedJson: JSON.stringify(parsedStory),
                        isPublished: true,
                        createdById: quest.creatorId,
                    }
                })
                twineStoryId = twineStory.id

                // Link quest to the new TwineStory
                await db.customBar.update({
                    where: { id: questId },
                    data: { twineStoryId }
                })
            }
        }

        revalidatePath(`/admin/world/quest/${questId}`)
        return { success: true }
    } catch (err: any) {
        console.error('[MicroTwine] Compilation failed:', err)
        return { error: err.message || 'Failed to compile ritual' }
    }
}
