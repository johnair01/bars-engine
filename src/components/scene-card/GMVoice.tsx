// ---------------------------------------------------------------------------
// GMVoice — the six Game Master faces, as contemplative-flow voices.
// Aliased to the canonical GameMasterFace so this can't drift to a phantom
// voice (e.g. "integrator") or silently drop a face: VOICE_STYLES must cover
// exactly the six faces or this file won't compile.
// ---------------------------------------------------------------------------

import type { GameMasterFace } from '@/lib/quest-grammar/types'

export type GMVoice = GameMasterFace

const VOICE_STYLES: Record<GMVoice, { label: string; borderColor: string; textColor: string }> = {
  shaman:     { label: 'Shaman',     borderColor: 'border-amber-500/40',  textColor: 'text-amber-400' },
  challenger: { label: 'Challenger', borderColor: 'border-red-500/40',    textColor: 'text-red-400' },
  regent:     { label: 'Regent',     borderColor: 'border-amber-600/40',  textColor: 'text-amber-500' },
  architect:  { label: 'Architect',  borderColor: 'border-indigo-500/40', textColor: 'text-indigo-400' },
  diplomat:   { label: 'Diplomat',   borderColor: 'border-teal-500/40',   textColor: 'text-teal-400' },
  sage:       { label: 'Sage',       borderColor: 'border-violet-500/40', textColor: 'text-violet-400' },
}

type Props = {
  voice: GMVoice
  line: string
}

export function GMVoiceLabel({ voice, line }: Props) {
  const style = VOICE_STYLES[voice]
  return (
    <div className={`border-l-2 pl-4 py-1 ${style.borderColor}`}>
      <span className={`text-xs font-mono uppercase tracking-widest ${style.textColor}`}>
        {style.label}
      </span>
      <p className="text-zinc-400 text-sm mt-1 italic leading-relaxed">{line}</p>
    </div>
  )
}
