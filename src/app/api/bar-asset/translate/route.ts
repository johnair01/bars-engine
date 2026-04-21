// POST /api/bar-asset/translate
// Body: { seed: BarSeed }
// Returns: BarAsset
// Gate: seed maturity must be >= 'shared_or_acted'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { translateBarSeedToAsset, SeedMaturityError, TranslationError } from '@/lib/bar-asset/translator'

export async function POST(req: NextRequest) {
  const player = await getCurrentPlayer()

  if (!player) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: { seed: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.seed || typeof body.seed !== 'object') {
    return NextResponse.json({ error: 'Missing required field: seed' }, { status: 400 })
  }

  const seed = body.seed as Record<string, unknown>

  if (!seed.id || typeof seed.id !== 'string') {
    return NextResponse.json({ error: 'seed.id is required' }, { status: 400 })
  }
  if (!seed.title || typeof seed.title !== 'string') {
    return NextResponse.json({ error: 'seed.title is required' }, { status: 400 })
  }
  if (!seed.description || typeof seed.description !== 'string') {
    return NextResponse.json({ error: 'seed.description is required' }, { status: 400 })
  }

  try {
    const creator = player.name ?? 'anonymous'
    const asset = await translateBarSeedToAsset(seed as Parameters<typeof translateBarSeedToAsset>[0], creator)
    return NextResponse.json({ asset }, { status: 200 })
  } catch (err) {
    if (err instanceof SeedMaturityError) {
      return NextResponse.json(
        { error: err.message, code: 'SEED_MATURITY_INSUFFICIENT', currentMaturity: err.currentMaturity },
        { status: 422 }
      )
    }
    if (err instanceof TranslationError) {
      return NextResponse.json(
        { error: err.message, code: 'TRANSLATION_FAILED', provider: err.provider },
        { status: 502 }
      )
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/bar-asset/translate]', message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
