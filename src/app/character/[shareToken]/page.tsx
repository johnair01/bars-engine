import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublicCharacter } from '@/actions/character-creator'

/**
 * @page /character/:shareToken
 * @entity PLAYER
 * @description Public character sheet showing player's archetype, moves, bonds, and story answers via shareable token
 * @permissions public
 * @params shareToken:string (character share token, required)
 * @relationships PLAYER (character data), PLAYBOOK (moves, bonds), ARCHETYPE
 * @dimensions WHO:viewer, WHAT:character sheet, WHERE:public, ENERGY:shareToken
 * @example /character/abc123xyz
 * @agentDiscoverable false
 */

export default async function PublicCharacterPage({
  params,
}: {
  params: Promise<{ shareToken: string }>
}) {
  const { shareToken } = await params
  const character = await getPublicCharacter(shareToken)
  if (!character) notFound()

  const archetype = character.archetype
  const moves: Array<{ id: string; name: string; key: string }> = character.playbookMoves
    ? safeJson(character.playbookMoves, [])
    : []
  const bonds: Array<{ id: string; name: string; key: string }> = character.playbookBonds
    ? safeJson(character.playbookBonds, [])
    : []
  const answers: {
    discovery: Array<{ qId: string; answer: string }>
    archetype: Array<{ qId: string; answer: string }>
  } = character.playerAnswers
    ? safeJson(character.playerAnswers, { discovery: [], archetype: [] })
    : { discovery: [], archetype: [] }

  const storyQuestions: Record<string, string> = {
    q1: 'What is your relationship to this community?',
    q2: 'What do you dream of building or protecting?',
    q3: 'What fear do you carry that drives you forward?',
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link
          href="/"
          className="text-zinc-500 hover:text-white transition text-xs uppercase tracking-widest flex items-center gap-2"
        >
          ← Home
        </Link>

        {/* Header */}
        <div className="border border-zinc-800 bg-zinc-900 rounded-xl p-8 space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Character</p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
              {character.playbookName}
            </h1>
          </div>
          {archetype?.description && (
            <p className="text-zinc-400 leading-relaxed">{archetype.description}</p>
          )}
          {archetype?.primaryQuestion && (
            <p className="text-zinc-500 italic text-sm">&ldquo;{archetype.primaryQuestion}&rdquo;</p>
          )}
          <div className="flex flex-wrap gap-4 pt-2 text-xs font-mono">
            {archetype?.vibe && (
              <span className="text-zinc-600">
                <span className="text-zinc-500">Vibe:</span> {archetype.vibe}
              </span>
            )}
            {archetype?.energy && (
              <span className="text-zinc-600">
                <span className="text-zinc-500">Energy:</span> {archetype.energy}
              </span>
            )}
          </div>
        </div>

        {/* Archetype moves */}
        {moves.length > 0 && (
          <div className="border border-zinc-800 bg-zinc-900 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Archetype Moves
            </h2>
            <div className="space-y-3">
              {moves.map((m) => (
                <div key={m.id} className="flex items-start gap-3">
                  <span className="text-indigo-400 text-xs font-mono uppercase tracking-wider mt-0.5 min-w-16">
                    {formatMoveKey(m.key)}
                  </span>
                  <span className="text-zinc-300 text-sm">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nation moves */}
        {bonds.length > 0 && (
          <div className="border border-zinc-800 bg-zinc-900 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Nation Moves
            </h2>
            <div className="space-y-3">
              {bonds.map((m) => (
                <div key={m.id} className="flex items-start gap-3">
                  <span className="text-emerald-400 text-lg leading-none">✦</span>
                  <span className="text-zinc-300 text-sm">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Story answers */}
        {answers.archetype.length > 0 && (
          <div className="border border-zinc-800 bg-zinc-900 rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Story
            </h2>
            <div className="space-y-5">
              {answers.archetype.map((a) => {
                if (!a.answer?.trim()) return null
                return (
                  <div key={a.qId} className="space-y-1">
                    <p className="text-xs text-zinc-500 font-medium">
                      {storyQuestions[a.qId] ?? a.qId}
                    </p>
                    <p className="text-zinc-300 text-sm leading-relaxed">{a.answer}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Signposts */}
        {(archetype?.shadowSignposts || archetype?.lightSignposts) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {archetype.shadowSignposts && (
              <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-5 space-y-2">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Shadow</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{archetype.shadowSignposts}</p>
              </div>
            )}
            {archetype.lightSignposts && (
              <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-5 space-y-2">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Light</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{archetype.lightSignposts}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-zinc-600 text-xs font-mono pt-4">
          {character.completedAt && (
            <p>Created {new Date(character.completedAt).toLocaleDateString()}</p>
          )}
          <p className="mt-1 opacity-50">/{shareToken}</p>
        </div>
      </div>
    </div>
  )
}

function safeJson<T>(raw: string, fallback: T): T {
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
