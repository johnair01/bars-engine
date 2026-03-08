import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { translateTweeToFlow } from '@/lib/twee-to-flow'

const TWEE_PATH = path.join(
  process.cwd(),
  'content/twine/onboarding/bruised-banana-onboarding-draft.twee'
)

export async function GET(request: NextRequest) {
  const campaign = request.nextUrl.searchParams.get('campaign')
  if (!campaign || campaign !== 'bruised-banana') {
    return NextResponse.json({ error: 'Unknown campaign' }, { status: 400 })
  }

  try {
    const tweeSource = await readFile(TWEE_PATH, 'utf-8')
    const flow = translateTweeToFlow(tweeSource, {
      flowId: 'bruised-banana-onboarding-v1',
      campaignId: 'bruised_banana_residency',
    })
    return NextResponse.json(flow)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load flow'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
