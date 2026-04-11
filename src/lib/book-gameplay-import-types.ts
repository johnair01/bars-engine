export type GameplayImportKind = 'quest' | 'move' | 'bar'

export type ImportPreviewRow = {
  kind: GameplayImportKind
  id: string
  title: string
  detail?: string
}
