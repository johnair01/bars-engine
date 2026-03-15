// EmotionChannel is canonical in charge-quest-generator — re-export to avoid duplication
export type { EmotionChannel } from '@/lib/charge-quest-generator/types'

export type AlchemyAltitude = 'dissatisfied' | 'neutral' | 'satisfied'

export interface AlchemyChoice {
  key: string
  label: string
  isGrowth: boolean
}

export interface AlchemySceneTemplateRow {
  id: string
  title: string
  situation: string
  friction: string
  invitation: string
  choices: string   // JSON-encoded AlchemyChoice[]
  advice: string | null
}
