import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { barsApiAuthError } from '@/lib/bars-api-auth'
import { db } from '@/lib/db'
import { barForgeRecordToDto } from '@/lib/bar-forge/registry-dto'
import { questIdsExist } from '@/lib/bar-forge/validate-quest-ids'
import { barRegistryRequestSchema } from '@/lib/bar-forge/validation'

/**
 * POST /api/bar-registry — save BAR + analysis + optional quest links
 * GET /api/bar-registry — list records (newest first)
 * Bearer: BARS_API_KEY
 */
export async function POST(request: NextRequest) {
  const authErr = barsApiAuthError(request)
  if (authErr) {
    return NextResponse.json(authErr.body, { status: authErr.status })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = barRegistryRequestSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { bar, analysis, matches, source, metadataJson, gameMasterFace } = parsed.data
  const primaryQuestId = matches?.primaryQuestId ?? null
  const secondaryQuestIds = matches?.secondaryQuestIds ?? []

  const idsToCheck = [
    ...(primaryQuestId ? [primaryQuestId] : []),
    ...secondaryQuestIds,
  ]
  if (!(await questIdsExist(idsToCheck))) {
    return NextResponse.json(
      { error: 'One or more quest ids do not exist on custom_bars' },
      { status: 400 }
    )
  }

  const mergedMetadata: Record<string, unknown> | undefined =
    gameMasterFace || metadataJson
      ? { ...(metadataJson ?? {}), ...(gameMasterFace ? { gameMasterFace } : {}) }
      : undefined

  try {
    const created = await db.barForgeRecord.create({
      data: {
        bar,
        analysisType: analysis.type,
        wavePhase: analysis.wavePhase,
        polarity: analysis.polarity,
        primaryQuestId,
        secondaryQuestIds,
        source: source ?? null,
        metadataJson:
          mergedMetadata !== undefined ? (mergedMetadata as Prisma.InputJsonValue) : undefined,
      },
    })
    return NextResponse.json({ id: created.id })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to save registry row'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const authErr = barsApiAuthError(request)
  if (authErr) {
    return NextResponse.json(authErr.body, { status: authErr.status })
  }

  const { searchParams } = new URL(request.url)
  const limitRaw = searchParams.get('limit')
  let limit = limitRaw ? parseInt(limitRaw, 10) : 100
  if (Number.isNaN(limit) || limit < 1) limit = 100
  if (limit > 500) limit = 500

  const sampleRaw = searchParams.get('sample')
  let sample = sampleRaw ? parseInt(sampleRaw, 10) : 0
  if (Number.isNaN(sample) || sample < 0) sample = 0
  if (sample > 500) sample = 500

  const includeTotal = searchParams.get('includeTotal') === '1' || searchParams.get('includeTotal') === 'true'

  try {
    const totalPromise = includeTotal ? db.barForgeRecord.count() : Promise.resolve(undefined as undefined)

    let rows: Awaited<ReturnType<typeof db.barForgeRecord.findMany>>

    if (sample > 0) {
      /** Uniform random rows (PostgreSQL). When `sample` is set, `limit` is ignored for ordering. */
      rows = await db.$queryRaw`
        SELECT * FROM "bar_forge_records"
        ORDER BY RANDOM()
        LIMIT ${sample}
      `
    } else {
      rows = await db.barForgeRecord.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
    }

    const totalCount = await totalPromise
    const records = rows.map(barForgeRecordToDto)
    const payload: {
      records: ReturnType<typeof barForgeRecordToDto>[]
      count: number
      totalCount?: number
    } = { records, count: records.length }
    if (totalCount !== undefined) {
      payload.totalCount = totalCount
    }
    return NextResponse.json(payload)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to list registry'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
