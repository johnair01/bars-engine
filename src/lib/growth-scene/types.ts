import type { AlchemyAltitude, EmotionChannel } from '@/lib/alchemy/types'
import type { SceneType } from '@/lib/alchemy/wuxing'

export type { SceneType }

export interface SceneChoice {
  key: string
  label: string
  isGrowth: boolean
}

export interface SceneCard {
  text: string
}

export interface SceneDsl {
  scene_id: string
  vector: string       // e.g. "fear:dissatisfied→anger:neutral"
  sceneType: SceneType // transcend | generate | control
  channel: EmotionChannel
  altitudeFrom: AlchemyAltitude
  altitudeTo: AlchemyAltitude
  targetChannel: EmotionChannel // same as channel for transcend
  cards: SceneCard[]
  choices: SceneChoice[]
  advice: string | null
}

export type ArtifactType =
  | 'BAR'
  | 'quest_hook'
  | 'vibeulon'
  | 'relationship_update'
  | 'memory_entry'
  /** Named BAR candidate surfaced from encounter — admin-reviewable before publishing. */
  | 'bar_candidate'

export interface SceneArtifact {
  type: ArtifactType
  payload: Record<string, unknown>
}
