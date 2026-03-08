'use server'

import { promises as fs } from 'fs'
import path from 'path'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'

export type NarrativeFeedbackType = 'edit' | 'rating' | 'explicit'
export type NarrativeFeedbackRating = 'accept' | 'needs_work' | 'reject'
export type NarrativeFeedbackSource = 'admin_edit' | 'admin_rating' | 'cert_feedback' | 'manual'

export type LogNarrativeQualityFeedbackParams = {
    type: NarrativeFeedbackType
    passageId: string
    adventureId: string
    nodeId: string
    before?: string
    after?: string
    rating?: NarrativeFeedbackRating
    tags?: string[]
    feedback?: string
}

/**
 * Logs narrative quality feedback from admin passage edits.
 * Writes to .feedback/narrative_quality.jsonl for the narrative-quality skill to ingest.
 * Admin-only.
 */
export async function logNarrativeQualityFeedback(params: LogNarrativeQualityFeedbackParams) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const adminRole = await db.playerRole.findFirst({
        where: { playerId: player.id, role: { key: 'admin' } }
    })
    if (!adminRole) return { error: 'Admin access required' }

    const { type, passageId, adventureId, nodeId, before, after, rating, tags, feedback } = params

    const source: NarrativeFeedbackSource =
        type === 'edit' ? 'admin_edit' : type === 'rating' ? 'admin_rating' : 'admin_rating'

    const entry = {
        timestamp: new Date().toISOString(),
        type,
        passageId,
        adventureId,
        nodeId,
        ...(before !== undefined && { before }),
        ...(after !== undefined && { after }),
        ...(rating !== undefined && { rating }),
        ...(tags?.length && { tags }),
        ...(feedback?.trim() && { feedback: feedback.trim() }),
        source,
        playerId: player.id
    }

    try {
        const feedbackDir = path.join(process.cwd(), '.feedback')
        await fs.mkdir(feedbackDir, { recursive: true })
        const feedbackFile = path.join(feedbackDir, 'narrative_quality.jsonl')
        await fs.appendFile(feedbackFile, JSON.stringify(entry) + '\n')
        return { success: true }
    } catch (error) {
        console.error('Failed to log narrative quality feedback:', error)
        return { error: 'Failed to write feedback' }
    }
}

export type LogPrePublishFeedbackParams = {
    feedback: string
    generationCount: number
    packetSignature: {
        primaryChannel?: string
        moveType?: string
        segment?: string
    }
}

/**
 * Logs pre-publish feedback from quest grammar unpacking (admin regeneration flow).
 * Writes to .feedback/pre_publish_feedback.jsonl for skills to ingest.
 */
export async function logPrePublishFeedback(params: LogPrePublishFeedbackParams) {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' }

    const adminRole = await db.playerRole.findFirst({
        where: { playerId: player.id, role: { key: 'admin' } }
    })
    if (!adminRole) return { error: 'Admin access required' }

    const entry = {
        timestamp: new Date().toISOString(),
        ...params,
        playerId: player.id
    }

    try {
        const feedbackDir = path.join(process.cwd(), '.feedback')
        await fs.mkdir(feedbackDir, { recursive: true })
        const feedbackFile = path.join(feedbackDir, 'pre_publish_feedback.jsonl')
        await fs.appendFile(feedbackFile, JSON.stringify(entry) + '\n')
        return { success: true }
    } catch (error) {
        console.error('Failed to log pre-publish feedback:', error)
        return { error: 'Failed to write feedback' }
    }
}
