/**
 * Campaign Self-Serve Type Definitions
 *
 * Organized by level:
 *   L1 — Form wizard (campaign creation, configuration)
 *   L2 — Visual theming (skin, poster aesthetic)
 *   L3 — Narrative sovereignty (deferred — types reserved here)
 */

// ---------------------------------------------------------------------------
// L3 — Narrative Sovereignty (RESERVED)
//
// These types define the domain objects for L3 narrative sovereignty.
// They are placeholder interfaces matching the Prisma schema models
// (CampaignLoreEntry, StoryArcTemplate, and the narrativeSovereignty
// JSON column on Campaign). They exist so that L1/L2 code can reference
// the shapes without importing Prisma types directly, and so that L3
// implementation has stable contracts to build against.
//
// DO NOT implement features against these types until L3 is greenlit.
// ---------------------------------------------------------------------------

/** Lore category taxonomy — extensible via 'custom' */
export type LoreCategory =
  | 'character'
  | 'place'
  | 'faction'
  | 'event'
  | 'item'
  | 'custom';

/**
 * @L3_RESERVED
 *
 * A single lore entry within a campaign's world-bible.
 * Maps to Prisma model `CampaignLoreEntry`.
 *
 * Lore entries are the atomic units of world-building that campaign
 * creators (Steward+) can author. They support rich markdown content,
 * structured metadata (portraits, tags, spatial coordinates), and
 * soft-archival via status.
 *
 * @example
 * ```ts
 * const entry: LoreEntry = {
 *   id: 'clx...',
 *   campaignId: 'clx...',
 *   category: 'character',
 *   title: 'Giacomo',
 *   content: '# The Villain\nA trickster NPC...',
 *   metadata: { tags: ['villain', 'trickster'], portraitUrl: '/img/giacomo.png' },
 *   sortOrder: 0,
 *   status: 'active',
 *   createdById: 'clx...',
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */
export interface LoreEntry {
  id: string;
  campaignId: string;
  category: LoreCategory;
  title: string;
  /** Rich markdown content */
  content: string | null;
  /**
   * Structured metadata blob — shape varies by category.
   * Typical keys: tags, portraitUrl, relationships, coordinates.
   */
  metadata: Record<string, unknown> | null;
  sortOrder: number;
  /** 'active' | 'archived' — soft-archive pattern */
  status: string;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Arc structural type — determines how beats are traversed */
export type ArcType = 'linear' | 'branching' | 'cyclical' | 'emergent';

/**
 * @L3_RESERVED
 *
 * A story arc template that defines narrative structure within a campaign.
 * Maps to Prisma model `StoryArcTemplate`.
 *
 * Story arcs provide the scaffolding for narrative progression. They can
 * be linear (Hero's Journey), branching (CYOA-style), cyclical (seasonal
 * rituals), or emergent (player-driven). The `definition` JSON holds the
 * full arc graph — beats, branches, conditions, and triggers — validated
 * at the application layer based on `arcType`.
 *
 * The `sovereignty` field governs who can modify the arc at runtime,
 * enabling shared narrative authority between GM and players.
 *
 * @example
 * ```ts
 * const arc: NarrativeArc = {
 *   id: 'clx...',
 *   campaignId: 'clx...',
 *   name: "Hero's Journey",
 *   description: 'Classic monomyth structure',
 *   arcType: 'linear',
 *   definition: { beats: [...] },
 *   sovereignty: { canEdit: ['owner', 'steward'], playerPropose: true },
 *   status: 'active',
 *   sortOrder: 0,
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */
export interface NarrativeArc {
  id: string;
  campaignId: string;
  name: string;
  description: string | null;
  arcType: ArcType;
  /**
   * Full arc definition — beats, branches, conditions, triggers.
   * Shape depends on `arcType`; validated at application layer.
   */
  definition: Record<string, unknown>;
  /**
   * L3 sovereignty permissions — governs who can modify this arc at runtime.
   * @see SovereigntyConfig for the expected shape.
   */
  sovereignty: SovereigntyConfig | null;
  /** 'active' | 'archived' */
  status: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @L3_RESERVED
 *
 * Configuration governing narrative sovereignty — who holds authority
 * over campaign narrative elements at runtime.
 *
 * Stored as JSON in both `Campaign.narrativeSovereignty` (campaign-wide
 * defaults) and `StoryArcTemplate.sovereignty` (per-arc overrides).
 *
 * Narrative sovereignty is the core L3 concept: it determines whether
 * the GM retains full control, shares authority with stewards, or grants
 * players proposal rights over story elements. This enables a spectrum
 * from traditional top-down GMing to collaborative world-building.
 *
 * @example
 * ```ts
 * // GM retains full control (default)
 * const strict: SovereigntyConfig = {
 *   mode: 'gm-authority',
 *   canEditLore: ['owner', 'steward'],
 *   canEditArcs: ['owner'],
 *   playerProposals: false,
 *   approvalRequired: true,
 * };
 *
 * // Collaborative mode — players can propose, stewards approve
 * const collaborative: SovereigntyConfig = {
 *   mode: 'collaborative',
 *   canEditLore: ['owner', 'steward'],
 *   canEditArcs: ['owner', 'steward'],
 *   playerProposals: true,
 *   approvalRequired: true,
 * };
 * ```
 */
export interface SovereigntyConfig {
  /**
   * Sovereignty mode — determines the overall authority model.
   * - 'gm-authority': GM has full control (L1/L2 default)
   * - 'collaborative': shared authority with approval gates
   * - 'player-sovereign': players have direct edit rights (advanced)
   */
  mode: 'gm-authority' | 'collaborative' | 'player-sovereign';
  /** Roles that can directly edit lore entries */
  canEditLore: string[];
  /** Roles that can directly edit story arcs */
  canEditArcs: string[];
  /** Whether players can submit narrative proposals */
  playerProposals: boolean;
  /** Whether proposals require steward/GM approval before taking effect */
  approvalRequired: boolean;
}

// ---------------------------------------------------------------------------
// Default sovereignty config — used by L1 wizard when creating campaigns.
// GM-authority is the safe default; L3 features unlock the other modes.
// ---------------------------------------------------------------------------

/**
 * @L3_RESERVED — Default sovereignty configuration applied to new campaigns.
 * GM retains full authority. L3 implementation will expose UI to change this.
 */
export const DEFAULT_SOVEREIGNTY_CONFIG: SovereigntyConfig = {
  mode: 'gm-authority',
  canEditLore: ['owner', 'steward'],
  canEditArcs: ['owner'],
  playerProposals: false,
  approvalRequired: true,
};
