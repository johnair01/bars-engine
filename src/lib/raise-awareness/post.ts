import type { Channel } from '@/lib/allyship-deck/types'

export type SlideKind = 'hook' | 'body' | 'steps' | 'cta'
export type TextColor = 'ink' | 'accent' | 'ember' | 'teal' | 'jade' | 'silver' | 'ochre' | 'liminal'
export type TextRun = { text: string; bold?: boolean; italic?: boolean; color?: TextColor }
export type CarouselSlide = {
  kind: SlideKind
  runs: TextRun[]
  ground: string
  alignment: 'left' | 'center'
  fontRole: 'display' | 'body' | 'mono'
  scale: 'compact' | 'standard' | 'large'
}
export type PostV1 = { series: string; from: Channel; to: Channel; caption: string; slides: CarouselSlide[] }
