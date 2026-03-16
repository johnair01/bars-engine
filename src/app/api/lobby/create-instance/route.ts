import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { generateCampaignBars } from '@/lib/birthday-onboarding/generate-campaign-bars'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  if (process.env.ENABLE_LOBBY !== 'true') {
    return NextResponse.json({ error: 'Lobby not enabled' }, { status: 403 })
  }

  const body = (await request.json()) as {
    slug: string
    name: string
    vibeData: {
      birthdayPersonName: string
      vibeWords: string[]
      desiredFeeling: string
      energyLevel: string
    }
    goalData: {
      primaryGoal: string
      secondaryGoals: string[]
      domainType: string
      campaignDuration: string
    }
    sourceInstanceId?: string
  }

  // Check slug availability
  const existing = await db.instance.findUnique({ where: { slug: body.slug } })
  if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 400 })

  const instance = await db.instance.create({
    data: {
      slug: body.slug,
      name: body.name,
      domainType: body.goalData.domainType,
      isEventMode: true,
      vibeData: JSON.stringify(body.vibeData),
      goalData: JSON.stringify(body.goalData),
      sourceInstanceId: body.sourceInstanceId ?? null,
      theme: body.vibeData.vibeWords.join(', '),
      allyshipDomain: body.goalData.domainType,
      campaignRef: body.slug,
    },
  })

  // Generate campaign BARs
  let bars: { title: string; description: string; domain: string }[] = []
  try {
    bars = await generateCampaignBars({
      birthdayPersonName: body.vibeData.birthdayPersonName,
      vibeWords: body.vibeData.vibeWords,
      desiredFeeling: body.vibeData.desiredFeeling,
      primaryGoal: body.goalData.primaryGoal,
      secondaryGoals: body.goalData.secondaryGoals,
      domainType: body.goalData.domainType,
    })

    // Store as draft CustomBars
    for (const bar of bars) {
      await db.customBar.create({
        data: {
          creatorId: playerId,
          title: bar.title,
          description: bar.description,
          status: 'active',
          visibility: 'private',
          allyshipDomain: bar.domain,
        },
      })
    }
  } catch (err) {
    console.error('[create-instance] BAR generation failed:', err)
    // Non-fatal — instance still created
  }

  return NextResponse.json({
    instanceId: instance.id,
    slug: instance.slug,
    barsGenerated: bars.length,
  })
}
