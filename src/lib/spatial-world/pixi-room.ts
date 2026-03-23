import { Application, Assets, Graphics, Container, Rectangle, Sprite, Texture, Text, TextStyle } from 'pixi.js'

export interface TileMapData {
  [key: string]: { floor?: string; impassable?: boolean; object?: string }
}

export interface AnchorData {
  id: string
  anchorType: string
  tileX: number
  tileY: number
  label?: string | null
  linkedId?: string | null
  linkedType?: string | null
  config?: string | null
}

export interface AgentData {
  playerId: string
  playerName: string
  spriteUrl?: string | null
  tileX: number
  tileY: number
  presenceId: string
}

const TILE_SIZE = 32
const FRAME_W = 64
const FRAME_H = 64
const DEFAULT_SPRITE_URL = '/sprites/walkable/default.png'

const ANCHOR_COLORS: Record<string, number> = {
  quest_board:    0x7c3aed,
  anomaly:        0xf97316,
  bar_table:      0x3b82f6,
  portal:         0x22c55e,
  npc_slot:       0x6b7280,
  cyoa_quest:     0xd97706,
  crafting_forge: 0xea580c,
  librarian_npc:  0xca8a04,
  giacomo_npc:    0xdc2626,
  nation_embassy: 0x2563eb,
}

type PlayerDirection = 'north' | 'south' | 'east' | 'west'

function directionToFrameIndex(direction: PlayerDirection): number {
  const map: Record<PlayerDirection, number> = { north: 0, south: 2, east: 4, west: 6 }
  return map[direction] ?? 2
}

export class RoomRenderer {
  private app: Application
  private tileSize: number
  private tilemap: TileMapData
  private anchors: AnchorData[] = []
  private agents: AgentData[] = []
  private playerPos: { x: number; y: number } = { x: 0, y: 0 }
  private playerSpriteUrl: string | null = null
  private playerDirection: PlayerDirection = 'south'
  private tilesContainer: Container
  private anchorsContainer: Container
  private agentsContainer: Container
  private playerContainer: Container
  private textureCache = new Map<string, Texture>()

  constructor(app: Application, tilemap: TileMapData, tileSize = TILE_SIZE) {
    this.app = app
    this.tilemap = tilemap
    this.tileSize = tileSize
    this.tilesContainer = new Container()
    this.anchorsContainer = new Container()
    this.agentsContainer = new Container()
    this.playerContainer = new Container()
    app.stage.addChild(this.tilesContainer)
    app.stage.addChild(this.anchorsContainer)
    app.stage.addChild(this.agentsContainer)
    app.stage.addChild(this.playerContainer)
    this.renderTiles()
  }

  private static readonly OBJECT_COLORS: Record<string, number> = {
    tree: 0x22543d,
    rock: 0x4b5563,
    bush: 0x166534,
    pillar: 0x78716c,
    crate: 0x92400e,
  }

  private renderTiles() {
    this.tilesContainer.removeChildren()
    for (const [key, tile] of Object.entries(this.tilemap)) {
      const [x, y] = key.split(',').map(Number)
      const g = new Graphics()
      const floorColor = tile.impassable ? 0x450a0a : (tile.floor ? 0x27272a : 0x18181b)
      g.rect(0, 0, this.tileSize - 1, this.tileSize - 1).fill(floorColor)
      g.x = (x ?? 0) * this.tileSize
      g.y = (y ?? 0) * this.tileSize
      this.tilesContainer.addChild(g)
      if (tile.object) {
        const objColor = RoomRenderer.OBJECT_COLORS[tile.object] ?? 0x6b7280
        const obj = new Graphics()
        obj.rect(4, 4, this.tileSize - 9, this.tileSize - 9).fill(objColor)
        obj.x = g.x
        obj.y = g.y
        this.tilesContainer.addChild(obj)
      }
    }
  }

  setPlayerPosition(x: number, y: number) {
    this.playerPos = { x, y }
    this.renderPlayer()
  }

  setPlayerSpriteUrl(url: string | null) {
    this.playerSpriteUrl = url
    this.renderPlayer()
  }

  setPlayerDirection(direction: PlayerDirection) {
    this.playerDirection = direction
    this.renderPlayer()
  }

  private async loadFrameTexture(url: string, frameIndex: number): Promise<Texture | null> {
    const cacheKey = `${url}#${frameIndex}`
    const cached = this.textureCache.get(cacheKey)
    if (cached) return cached
    try {
      const base = await Assets.load(url)
      const frame = new Rectangle(frameIndex * FRAME_W, 0, FRAME_W, FRAME_H)
      const tex = new Texture({ source: base.source, frame })
      this.textureCache.set(cacheKey, tex)
      return tex
    } catch {
      if (url !== DEFAULT_SPRITE_URL) {
        return this.loadFrameTexture(DEFAULT_SPRITE_URL, frameIndex)
      }
      return null
    }
  }

  private renderPlayer() {
    this.playerContainer.removeChildren()
    const px = this.playerPos.x * this.tileSize
    const py = this.playerPos.y * this.tileSize

    const addFallbackRect = () => {
      const g = new Graphics()
      g.rect(2, 2, this.tileSize - 4, this.tileSize - 4).fill(0x10b981)
      g.x = px
      g.y = py
      this.playerContainer.addChild(g)
    }

    if (!this.playerSpriteUrl) {
      addFallbackRect()
      return
    }

    addFallbackRect()
    const frameIndex = directionToFrameIndex(this.playerDirection)
    void this.loadFrameTexture(this.playerSpriteUrl, frameIndex).then(tex => {
      if (!tex) return
      this.playerContainer.removeChildren()
      const sprite = new Sprite(tex)
      sprite.width = this.tileSize
      sprite.height = this.tileSize
      sprite.x = this.playerPos.x * this.tileSize
      sprite.y = this.playerPos.y * this.tileSize
      this.playerContainer.addChild(sprite)
    })
  }

  setIntentAgents(agents: AgentData[]) {
    this.agents = agents
    this.renderAgents()
  }

  private renderAgents() {
    this.agentsContainer.removeChildren()
    for (const agent of this.agents) {
      const container = new Container()
      container.x = agent.tileX * this.tileSize
      container.y = agent.tileY * this.tileSize
      container.eventMode = 'static'
      container.cursor = 'pointer'
      const data = agent
      container.on('pointerdown', () => this._onAgentClick?.(data))

      const g = new Graphics()
      g.rect(2, 2, this.tileSize - 4, this.tileSize - 4).fill(0x374151)
      container.addChild(g)

      const initials = (agent.playerName ?? '?').slice(0, 2).toUpperCase()
      const label = new Text({
        text: initials,
        style: new TextStyle({ fontSize: 9, fill: 0xe5e7eb, fontFamily: 'monospace' }),
      })
      label.x = 5
      label.y = 11
      container.addChild(label)

      this.agentsContainer.addChild(container)
    }
  }

  setAnchors(anchors: AnchorData[]) {
    this.anchors = anchors
    this.renderAnchors()
  }

  private renderAnchors() {
    this.anchorsContainer.removeChildren()
    for (const anchor of this.anchors) {
      const g = new Graphics()
      const color = ANCHOR_COLORS[anchor.anchorType] ?? 0x6b7280
      g.rect(4, 4, this.tileSize - 8, this.tileSize - 8).fill(color)
      g.x = anchor.tileX * this.tileSize
      g.y = anchor.tileY * this.tileSize
      this.anchorsContainer.addChild(g)
    }
  }

  getProximateAnchor(playerX: number, playerY: number): AnchorData | null {
    return this.anchors.find(a =>
      Math.abs(a.tileX - playerX) <= 1 && Math.abs(a.tileY - playerY) <= 1
    ) ?? null
  }

  private _onAgentClick?: (agent: AgentData) => void
  onAgentClick(cb: (agent: AgentData) => void) { this._onAgentClick = cb }

  private _onCanvasTap?: (tileX: number, tileY: number) => void
  onCanvasTap(cb: (tileX: number, tileY: number) => void) { this._onCanvasTap = cb }

  handlePointerDown(pixelX: number, pixelY: number) {
    const tileX = Math.floor(pixelX / this.tileSize)
    const tileY = Math.floor(pixelY / this.tileSize)
    this._onCanvasTap?.(tileX, tileY)
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.tilemap[`${x}, ${y}`] ?? this.tilemap[`${x},${y}`]
    if (!tile) return false
    return !tile.impassable
  }

  findPath(fromX: number, fromY: number, toX: number, toY: number): { x: number; y: number }[] {
    if (!this.isWalkable(toX, toY)) return []
    type Node = { x: number; y: number; path: { x: number; y: number }[] }
    const queue: Node[] = [{ x: fromX, y: fromY, path: [] }]
    const visited = new Set<string>([`${fromX},${fromY}`])

    while (queue.length > 0) {
      const { x, y, path } = queue.shift()!
      const next = [...path, { x, y }]
      if (x === toX && y === toY) return next
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as [number, number][]) {
        const nx = x + dx, ny = y + dy
        const key = `${nx},${ny}`
        if (!visited.has(key) && this.isWalkable(nx, ny)) {
          visited.add(key)
          queue.push({ x: nx, y: ny, path: next })
        }
      }
    }
    return []
  }

  tileToPixel(x: number, y: number) {
    return { px: x * this.tileSize + this.tileSize / 2, py: y * this.tileSize + this.tileSize / 2 }
  }

  destroy() {
    this.app.stage.removeChildren()
  }
}
