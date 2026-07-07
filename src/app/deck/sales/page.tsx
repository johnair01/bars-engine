import type { Metadata } from 'next'
import { assembleDeck } from '@/lib/allyship-deck/assemble'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { DeckSalesExperience } from '@/components/deck/DeckSalesExperience'

export const metadata: Metadata = {
  title: 'The Allyship Deck - moves for the moment it counts',
  description:
    'A 120-card physical and digital oracle deck that hands you one concrete allyship move in the moment.',
}

const isMove = (c: { kind: string }): c is MoveCard => c.kind === 'move'

export default function DeckSalesPage() {
  const moves = assembleDeck().cards.filter(isMove)

  return <DeckSalesExperience cards={moves} />
}
