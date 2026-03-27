import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { OuroborosInterviewClient } from './OuroborosInterviewClient'
import { getOuroborosInterviewState } from '@/actions/ouroboros-interview'
import { db } from '@/lib/db'
import { getPlaybookForArchetype } from '@/actions/playbook'
import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'

/**
 * @page /character/create
 * @entity PLAYER
 * @description Ouroboros-powered character creation interview - multi-step guided flow for choosing nation, archetype, domain, and answering story questions
 * @permissions authenticated
 * @relationships PLAYER (interview state), NATION, ARCHETYPE, PLAYBOOK (moves)
 * @dimensions WHO:player, WHAT:character interview, WHERE:character_creation, ENERGY:interview_step, PERSONAL_THROUGHPUT:completed_steps
 * @example /character/create
 * @agentDiscoverable false
 */

export default async function CharacterCreatePage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const state = await getOuroborosInterviewState(player.id)
  if ('error' in state) redirect('/')

  const [nations, archetypes] = await Promise.all([
    db.nation.findMany({
      where: { archived: false },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    }),
    db.archetype.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    }),
  ])

  let playbookMoves: { id: string; name: string; description: string }[] = []
  if (state.answers.archetypeId) {
    const moves = await getPlaybookForArchetype(state.answers.archetypeId)
    playbookMoves = moves.map((m) => ({ id: m.id, name: m.name, description: m.description }))
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link
          href="/"
          className="text-zinc-500 hover:text-white transition text-xs uppercase tracking-widest flex items-center gap-2 mb-8"
        >
          ← Dashboard
        </Link>

        <OuroborosInterviewClient
          playerId={player.id}
          state={state}
          nations={nations}
          archetypes={archetypes}
          playbookMoves={playbookMoves}
          domains={[...ALLYSHIP_DOMAINS]}
        />
      </div>
    </div>
  )
}
