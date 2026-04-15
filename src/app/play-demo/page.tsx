'use client'

import { Experiment5PlayShell } from '@/components/play/Experiment5PlayShell'

const NATIONS = ['argyra', 'lamenth', 'meridia', 'pyrakanth', 'virelune'] as const
const SAMPLE_ASSETS = [
  'exp3_farm_carrot.png',
  'exp3_farm_watering_can.png',
  'exp3_farm_wooden_crate.png',
  'exp3_forest_red_mushroom.png',
  'exp3_forest_sapling.png',
  'exp3_forest_stone_ore.png',
] as const

const MOCK_RECENT_BARS = [
  {
    id: 'demo-1',
    title: 'Overwhelm to Action',
    description: 'A quest about turning overwhelm into one useful action',
    type: 'charge-quest',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    title: 'Finding the Forest Path',
    description: 'Explore deeper patterns in shadow work',
    type: 'transformation-quest',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

export default function PlayDemoPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="px-4 py-6 text-center border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-white mb-2">Experiment 5: Play Shell Demo</h1>
        <p className="text-zinc-400 text-sm">Mock data — no authentication required</p>
      </div>
      
      <Experiment5PlayShell
        playerId="demo-player-001"
        nations={Array.from(NATIONS)}
        sampleAssets={Array.from(SAMPLE_ASSETS)}
        recentBars={MOCK_RECENT_BARS}
      />
    </div>
  )
}
