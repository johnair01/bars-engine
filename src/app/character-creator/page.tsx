import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCharacterCreatorData } from '@/actions/character-creator'
import { CharacterCreatorRunner } from './CharacterCreatorRunner'

/**
 * @page /character-creator
 * @entity PLAYER
 * @description Character creator flow for choosing or updating player archetype/playbook
 * @permissions authenticated
 * @relationships PLAYER (archetype, nation), PLAYBOOK (archetypes)
 * @dimensions WHO:player, WHAT:character creation, WHERE:character_creator, ENERGY:archetype_selection
 * @example /character-creator
 * @agentDiscoverable false
 */

export default async function CharacterCreatorPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const data = await getCharacterCreatorData()

  return (
    <CharacterCreatorRunner
      archetypes={data.archetypes}
      playerNationId={data.playerNationId}
      playerNationName={data.playerNationName}
      existingPlaybook={data.existingPlaybook}
    />
  )
}
