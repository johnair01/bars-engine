/**
 * @route GET /api/campaigns/wake_up/:nodeId
 * @entity CAMPAIGN
 * @description Load static campaign node content from file system for Wake Up campaign
 * @permissions public
 * @params nodeId:string (path, required) - Node identifier matching JSON file name
 * @relationships CAMPAIGN (static content files)
 * @dimensions WHO:campaign context, WHAT:node content, WHERE:campaign/wake_up directory, ENERGY:narrative flow
 * @example /api/campaigns/wake_up/BB_Intro
 * @agentDiscoverable true
 */
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ nodeId: string }> }
) {
    const p = await params
    const nodeId = p.nodeId

    try {
        const filePath = path.join(process.cwd(), 'content', 'campaigns', 'wake_up', `${nodeId}.json`)

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Node not found' }, { status: 404 })
        }

        const content = fs.readFileSync(filePath, 'utf-8')
        return NextResponse.json(JSON.parse(content))
    } catch (e) {
        return NextResponse.json({ error: 'Failed to load node' }, { status: 500 })
    }
}
