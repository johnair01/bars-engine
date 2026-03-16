import { Application, Graphics, Container } from 'pixi.js'

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
const ANCHOR_COLORS: Record<string, number> = {
  quest_board: 0x7c3aed,
  anomaly: 0xf97316,
  bar_table: 0x3b82f6,
  portal: 0x22c55e,
  npc_slot: 0x6b7280,
}

export class RoomRenderer {
  private app: Application
  private tileSize: number
  private tilemap: TileMapData
  private anchors: AnchorData[] = []
  private agents: AgentData[] = []
  private playerPos: { x: number; y: number } = { x: 0, y: 0 }
  private tilesContainer: Container
  private anchorsContainer: Container
  private agentsContainer: Container
  private playerContainer: Container

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

  private renderTiles() {
    this.tilesContainer.removeChildren()
    for (const [key, tile] of Object.entries(this.tilemap)) {
      const [x, y] = key.split(',').map(Number)
      const g = new Graphics()
      const color = tile.impassable ? 0x450a0a : (tile.floor ? 0x27272a : 0x18181b)
      g.rect(0, 0, this.tileSize - 1, this.tileSize - 1).fill(color)
      g.x = (x ?? 0) * this.tileSize
      g.y = (y ?? 0) * this.tileSize
      this.tilesContainer.addChild(g)
    }
  }

  setPlayerPosition(x: number, y: number) {
    this.playerPos = { x, y }
    this.renderPlayer()
  }

  private renderPlayer() {
    this.playerContainer.removeChildren()
    const g = new Graphics()
    g.rect(2, 2, this.tileSize - 4, this.tileSize - 4).fill(0x10b981)
    g.x = this.playerPos.x * this.tileSize
    g.y = this.playerPos.y * this.tileSize
    this.playerContainer.addChild(g)
  }

  setIntentAgents(agents: AgentData[]) {
    this.agents = agents
    this.renderAgents()
  }

  private renderAgents() {
    this.agentsContainer.removeChildren()
    for (const agent of this.agents) {
      const g = new Graphics()
      g.rect(2, 2, this.tileSize - 4, this.tileSize - 4).fill(0x4b5563)
      g.x = agent.tileX * this.tileSize
      g.y = agent.tileY * this.tileSize
      g.eventMode = 'static'
      g.cursor = 'pointer'
      const data = agent
      g.on('pointerdown', () => this._onAgentClick?.(data))
      this.agentsContainer.addChild(g)
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

  isWalkable(x: number, y: number): boolean {
    const tile = this.tilemap[`${x}, ${y}`] ?? this.tilemap[`${x},${y}`]
    if (!tile) return false
    return !tile.impassable
  }

  tileToPixel(x: number, y: number) {
    return { px: x * this.tileSize + this.tileSize / 2, py: y * this.tileSize + this.tileSize / 2 }
  }

  destroy() {
    this.app.stage.removeChildren()
  }
}
