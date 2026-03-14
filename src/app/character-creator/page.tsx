import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCharacterCreatorData } from '@/actions/character-creator'
import { CharacterCreatorRunner } from './CharacterCreatorRunner'

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
