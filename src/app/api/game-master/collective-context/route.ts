import { NextRequest, NextResponse } from 'next/server'
import { barsApiAuthError } from '@/lib/bars-api-auth'
import { collectiveContextQuerySchema } from '@/lib/game-master-quest/schemas'
import { resolveInstance } from '@/lib/game-master-quest/instance'

/**
 * GET /api/game-master/collective-context?instanceId=|campaignRef=
 * Bearer: BARS_API_KEY
 */
export async function GET(request: NextRequest) {
  const authErr = barsApiAuthError(request)
  if (authErr) {
    return NextResponse.json(authErr.body, { status: authErr.status })
  }

  const sp = request.nextUrl.searchParams
  const parsed = collectiveContextQuerySchema.safeParse({
    instanceId: sp.get('instanceId') ?? undefined,
    campaignRef: sp.get('campaignRef') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const result = await resolveInstance({
    instanceId: parsed.data.instanceId,
    campaignRef: parsed.data.campaignRef,
  })

  if (!result.ok) {
    if (result.reason === 'ambiguous') {
      return NextResponse.json(
        {
          error: 'Ambiguous campaignRef',
          detail: 'Multiple instances share this campaignRef; pass instanceId.',
          count: result.count,
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
  }

  const i = result.instance
  return NextResponse.json({
    instanceId: i.id,
    campaignRef: i.campaignRef,
    kotterStage: i.kotterStage,
    allyshipDomain: i.allyshipDomain,
    primaryCampaignDomain: i.primaryCampaignDomain,
    campaignHubState: i.campaignHubState,
    narrativeKernel: i.narrativeKernel,
  })
}
