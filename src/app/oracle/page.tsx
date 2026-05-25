import { useState, useEffect, useCallback } from 'react'

type FlavorBlock = {
  line: string
  npc: string
  title: string
}

type Card = {
  id: string
  suit: { code: string; name: string; color: string; icon: string }
  rank: string
  title: string
  image_file: string
  flavor: { easy: FlavorBlock; medium: FlavorBlock; hard: FlavorBlock }
  prompts: { easy: string; medium: string; hard: string }
}

type Deck = {
  deck_name: string
  for: string
  made_by: string
  cards: Card[]
}

type Depth = 'easy' | 'medium' | 'hard'

const SUITS = [
  { code: 'WU', label: 'Wake Up', color: '#C9A84C', bg: '#1a1408' },
  { code: 'CU', label: 'Clean Up', color: '#8B5CF6', bg: '#160d1f' },
  { code: 'GU', label: 'Grow Up', color: '#059669', bg: '#041410' },
  { code: 'SU', label: 'Show Up', color: '#DC2626', bg: '#1f0808' },
]

const DEPTH_LABELS: Record<Depth, string> = {
  easy: 'Gentle',
  medium: 'Medium',
  hard: 'Deep',
}

export default function OraclePage() {
  const [deck, setDeck] = useState<Deck | null>(null)
  const [activeSuit, setActiveSuit] = useState(SUITS[0].code)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [depth, setDepth] = useState<Depth>('hard')
  const [loading, setLoading] = useState(true)
  const [drawnCard, setDrawnCard] = useState<Card | null>(null)
  const [view, setView] = useState<'grid' | 'flip' | 'draw'>('grid')

  useEffect(() => {
    fetch('/oracle/deck.json')
      .then(r => r.json())
      .then((d: Deck) => {
        setDeck(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const suitCards = deck?.cards.filter(c => c.suit.code === activeSuit) ?? []
  const activeSuitMeta = SUITS.find(s => s.code === activeSuit)!

  const handleCardClick = (card: Card) => {
    setSelectedCard(card)
    setDepth('hard')
    setView('flip')
  }

  const handleShuffle = useCallback(() => {
    if (!deck) return
    const card = deck.cards[Math.floor(Math.random() * deck.cards.length)]
    setDrawnCard(card)
    setView('draw')
  }, [deck])

  const closeFlip = () => {
    setSelectedCard(null)
    setView('grid')
  }

  const closeDraw = () => {
    setDrawnCard(null)
    setView('grid')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0c09] flex items-center justify-center">
        <p className="text-[#C9A84C] font-sans text-sm tracking-widest uppercase opacity-60">
          Loading deck…
        </p>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-[#0d0c09] flex items-center justify-center">
        <p className="text-red-400 font-sans text-sm">Could not load deck.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0c09] text-[#f5f0e8]">

      {/* Header */}
      <header className="px-6 pt-10 pb-6 text-center border-b border-[#2a2520]">
        <h1 className="text-2xl font-serif font-bold tracking-wide text-[#C9A84C] mb-1">
          The Oracle at the Edge of the Known World
        </h1>
        <p className="text-[#8a7d6a] font-sans text-xs tracking-widest uppercase">
          for Casey
        </p>
      </header>

      {/* Suit tabs */}
      <nav className="flex border-b border-[#2a2520]">
        {SUITS.map(suit => (
          <button
            key={suit.code}
            onClick={() => { setActiveSuit(suit.code); setView('grid') }}
            className={`flex-1 flex flex-col items-center gap-1 py-4 px-2 border-b-2 transition-colors ${
              activeSuit === suit.code
                ? 'border-[#C9A84C] text-[#C9A84C]'
                : 'border-transparent text-[#5a5040] hover:text-[#8a7d6a]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              {suit.code === 'WU' && <><path d="M2 12 C2 12 L12 3 L22 12 C22 12 L12 21 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1" fill="currentColor"/><line x1="12" y1="3" x2="12" y2="1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="5" x2="4" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="19" y1="5" x2="20" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></>}
              {suit.code === 'CU' && <><path d="M4 4 L20 4 L20 20 L4 20 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2"/><line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" stroke-width="2"/></>}
              {suit.code === 'GU' && <><path d="M12 3 C12 3 L19 8 L19 16 L12 21 L5 16 L5 8 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></>}
              {suit.code === 'SU' && <><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1" fill="currentColor"/></>}
            </svg>
            <span className="font-sans text-[10px] tracking-widest uppercase">{suit.label}</span>
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="px-4 py-8 max-w-3xl mx-auto">

        {/* Draw button */}
        <div className="text-center mb-8">
          <button
            onClick={handleShuffle}
            className="px-6 py-3 bg-[#C9A84C] text-[#0d0c09] font-sans font-medium text-sm rounded-lg hover:bg-[#d4b85c] transition-colors"
          >
            Draw a card
          </button>
        </div>

        {/* Grid view */}
        {view === 'grid' && (
          <>
            <p className="text-center text-[#5a5040] font-sans text-xs mb-6 tracking-widest uppercase">
              {activeSuitMeta.label} — {suitCards.length} cards
            </p>
            <div className="grid grid-cols-4 gap-3">
              {suitCards.map(card => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  className="relative aspect-[5/7] rounded-lg overflow-hidden border border-[#2a2520] hover:border-[#C9A84C] transition-colors group"
                >
                  <img
                    src={card.image_file}
                    alt={card.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                    <span className="text-[10px] font-sans text-white/80">{card.rank}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Flip view */}
        {view === 'flip' && selectedCard && (
          <div className="max-w-sm mx-auto">
            {/* Card face image */}
            <div className="relative aspect-[5/7] rounded-xl overflow-hidden mb-6 border border-[#2a2520]">
              <img
                src={selectedCard.image_file}
                alt={selectedCard.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-[10px] font-sans text-[#C9A84C] tracking-widest uppercase">{selectedCard.suit.name} {selectedCard.rank}</p>
              </div>
            </div>

            {/* Depth selector */}
            <div className="flex gap-2 mb-6">
              {(['easy', 'medium', 'hard'] as Depth[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  className={`flex-1 py-2 rounded-lg font-sans text-xs tracking-widest uppercase transition-colors ${
                    depth === d
                      ? 'bg-[#C9A84C] text-[#0d0c09]'
                      : 'bg-[#1f1b16] text-[#8a7d6a] hover:bg-[#2a2520]'
                  }`}
                >
                  {DEPTH_LABELS[d]}
                </button>
              ))}
            </div>

            {/* NPC quote */}
            <div className="mb-6">
              <p className="text-[#C9A84C] font-serif text-lg leading-snug mb-2 italic">
                &ldquo;{selectedCard.flavor[depth].line}&rdquo;
              </p>
              <p className="text-[#8a7d6a] font-sans text-xs">
                — {selectedCard.flavor[depth].npc}, {selectedCard.flavor[depth].title}
              </p>
            </div>

            {/* Prompt */}
            <div className="bg-[#1a1712] rounded-xl p-5 mb-6">
              <p className="text-[#f5f0e8] font-serif text-base leading-relaxed">
                {selectedCard.prompts[depth]}
              </p>
            </div>

            {/* Card title */}
            <p className="text-center text-[#5a5040] font-sans text-xs tracking-widest uppercase mb-6">
              {selectedCard.title}
            </p>

            {/* Back button */}
            <div className="flex gap-3">
              <button
                onClick={closeFlip}
                className="flex-1 py-3 rounded-lg bg-[#1f1b16] text-[#8a7d6a] font-sans text-sm hover:bg-[#2a2520] transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Draw view */}
        {view === 'draw' && drawnCard && (
          <div className="max-w-sm mx-auto">
            {/* Card back watermark */}
            <div className="relative aspect-[5/7] rounded-xl overflow-hidden mb-6 border border-[#2a2520] opacity-60">
              <img
                src="/oracle/card-back-lite.png"
                alt="Card back"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Depth selector */}
            <div className="flex gap-2 mb-6">
              {(['easy', 'medium', 'hard'] as Depth[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  className={`flex-1 py-2 rounded-lg font-sans text-xs tracking-widest uppercase transition-colors ${
                    depth === d
                      ? 'bg-[#C9A84C] text-[#0d0c09]'
                      : 'bg-[#1f1b16] text-[#8a7d6a] hover:bg-[#2a2520]'
                  }`}
                >
                  {DEPTH_LABELS[d]}
                </button>
              ))}
            </div>

            {/* Card info */}
            <p className="text-center text-[#C9A84C] font-sans text-xs tracking-widest uppercase mb-2">
              {drawnCard.suit.name} — {drawnCard.rank}
            </p>
            <p className="text-center text-[#f5f0e8] font-serif text-lg mb-6">
              {drawnCard.title}
            </p>

            {/* NPC quote */}
            <div className="mb-6">
              <p className="text-[#C9A84C] font-serif text-lg leading-snug mb-2 italic">
                &ldquo;{drawnCard.flavor[depth].line}&rdquo;
              </p>
              <p className="text-[#8a7d6a] font-sans text-xs">
                — {drawnCard.flavor[depth].npc}, {drawnCard.flavor[depth].title}
              </p>
            </div>

            {/* Prompt */}
            <div className="bg-[#1a1712] rounded-xl p-5 mb-6">
              <p className="text-[#f5f0e8] font-serif text-base leading-relaxed">
                {drawnCard.prompts[depth]}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleShuffle}
                className="flex-1 py-3 rounded-lg bg-[#1f1b16] text-[#8a7d6a] font-sans text-sm hover:bg-[#2a2520] transition-colors"
              >
                Draw again
              </button>
              <button
                onClick={closeDraw}
                className="flex-1 py-3 rounded-lg bg-[#C9A84C] text-[#0d0c09] font-sans text-sm hover:bg-[#d4b85c] transition-colors"
              >
                Browse
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-[#1a1712]">
        <p className="text-[#3a3530] font-sans text-xs tracking-widest uppercase">
          The Oracle at the Edge of the Known World — made for Casey
        </p>
      </footer>
    </div>
  )
}