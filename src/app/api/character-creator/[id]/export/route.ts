import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

function safeJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function formatMoveKey(key: string): string {
  switch (key) {
    case 'wakeUp': return 'Wake Up'
    case 'cleanUp': return 'Clean Up'
    case 'growUp': return 'Grow Up'
    case 'showUp': return 'Show Up'
    default: return key
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  const playbook = await db.playerPlaybook.findUnique({
    where: { id },
    select: {
      id: true,
      playerId: true,
      playbookName: true,
      playerAnswers: true,
      playbookMoves: true,
      playbookBonds: true,
      shareToken: true,
      completedAt: true,
    },
  })

  if (!playbook) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Auth: must own the playbook (or be admin — skip for now, owner check is sufficient)
  if (playbook.playerId !== playerId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const archetype = await db.archetype.findFirst({
    where: { name: playbook.playbookName },
    select: {
      name: true,
      description: true,
      primaryQuestion: true,
      vibe: true,
      energy: true,
      shadowSignposts: true,
      lightSignposts: true,
    },
  })

  type MoveEntry = { id: string; name: string; key: string }
  type AnswerEntry = { qId: string; answer: string }
  type AnswersBlob = { discovery: AnswerEntry[]; archetype: AnswerEntry[] }

  const moves = safeJson<MoveEntry[]>(playbook.playbookMoves, [])
  const bonds = safeJson<MoveEntry[]>(playbook.playbookBonds, [])
  const answers = safeJson<AnswersBlob>(playbook.playerAnswers, { discovery: [], archetype: [] })

  const storyQuestions: Record<string, string> = {
    q1: 'What is your relationship to this community?',
    q2: 'What do you dream of building or protecting?',
    q3: 'What fear do you carry that drives you forward?',
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${playbook.playbookName} — Character Sheet</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; background: #fff; color: #111; padding: 2.5rem; max-width: 700px; margin: 0 auto; }
    h1 { font-size: 2rem; font-weight: bold; margin-bottom: 0.25rem; }
    h2 { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-bottom: 1rem; font-family: monospace; }
    h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 0.5rem; font-family: monospace; }
    p { line-height: 1.65; color: #333; }
    .section { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; }
    .italic { font-style: italic; color: #555; }
    .move { display: flex; gap: 0.75rem; margin-bottom: 0.6rem; align-items: baseline; }
    .move-key { font-family: monospace; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.08em; color: #6366f1; min-width: 60px; }
    .bond-key { color: #059669; }
    .story-q { margin-bottom: 1rem; }
    .story-q p.label { font-size: 0.75rem; font-family: monospace; color: #888; margin-bottom: 0.25rem; }
    .meta { font-family: monospace; font-size: 0.65rem; color: #bbb; margin-top: 2rem; text-align: center; }
    @media print { body { padding: 1.5rem; } }
  </style>
</head>
<body>
  <div class="section">
    <h2>Character</h2>
    <h1>${playbook.playbookName}</h1>
    ${archetype?.description ? `<p style="margin-top:0.75rem">${archetype.description}</p>` : ''}
    ${archetype?.primaryQuestion ? `<p class="italic" style="margin-top:0.5rem; font-size:0.9rem">&ldquo;${archetype.primaryQuestion}&rdquo;</p>` : ''}
    ${archetype?.vibe ? `<p style="font-family:monospace; font-size:0.7rem; color:#999; margin-top:0.75rem">Vibe: ${archetype.vibe}</p>` : ''}
    ${archetype?.energy ? `<p style="font-family:monospace; font-size:0.7rem; color:#999">Energy: ${archetype.energy}</p>` : ''}
  </div>

  ${moves.length > 0 ? `
  <div class="section">
    <h3>Archetype Moves</h3>
    ${moves.map((m) => `
    <div class="move">
      <span class="move-key">${formatMoveKey(m.key)}</span>
      <span>${m.name}</span>
    </div>`).join('')}
  </div>` : ''}

  ${bonds.length > 0 ? `
  <div class="section">
    <h3>Nation Moves</h3>
    ${bonds.map((m) => `
    <div class="move">
      <span class="move-key bond-key">✦</span>
      <span>${m.name}</span>
    </div>`).join('')}
  </div>` : ''}

  ${answers.archetype.filter((a) => a.answer?.trim()).length > 0 ? `
  <div class="section">
    <h3>Story</h3>
    ${answers.archetype.filter((a) => a.answer?.trim()).map((a) => `
    <div class="story-q">
      <p class="label">${storyQuestions[a.qId] ?? a.qId}</p>
      <p>${a.answer}</p>
    </div>`).join('')}
  </div>` : ''}

  ${archetype?.shadowSignposts || archetype?.lightSignposts ? `
  <div class="section">
    ${archetype.shadowSignposts ? `<div style="margin-bottom:0.75rem"><h3>Shadow</h3><p>${archetype.shadowSignposts}</p></div>` : ''}
    ${archetype.lightSignposts ? `<div><h3>Light</h3><p>${archetype.lightSignposts}</p></div>` : ''}
  </div>` : ''}

  <div class="meta">
    ${playbook.completedAt ? `Created ${new Date(playbook.completedAt).toLocaleDateString()} &middot; ` : ''}
    Token: ${playbook.shareToken}
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="character-${playbook.shareToken}.html"`,
    },
  })
}
