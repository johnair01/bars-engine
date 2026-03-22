/**
 * BARS ENGINE — Card Art Registry
 *
 * Static source of truth for all 40 card art pairings (5 nations × 8 playbooks).
 * No DB queries at runtime — this is a pure static TS file.
 *
 * DALL-E prompts embed Wuxing element hex values from card-tokens.ts.
 * Output images live at public/card-art/{nationKey}-{playbookKey}.png
 *
 * Two access patterns are provided:
 *   1. Flat array:  CARD_ART_REGISTRY           — iterate all 40 entries
 *   2. Nested Map:  CARD_ART_BY_ARCHETYPE        — keyed by PlaybookKey → ElementKey
 *
 * The nested map is the primary lookup for UI components (via lookupCardArt).
 * The flat array is used by the admin generation script (via getPendingArtEntries).
 *
 * AI: Do NOT add DB calls here. Do NOT compute pairings at request time.
 *     This file is read by the admin art generation script only.
 */

import { ELEMENT_TOKENS, type ElementKey } from './card-tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NationKey = 'pyrakanth' | 'lamenth' | 'virelune' | 'argyra' | 'meridia'
export type PlaybookKey =
  | 'bold-heart'
  | 'devoted-guardian'
  | 'decisive-storm'
  | 'danger-walker'
  | 'still-point'
  | 'subtle-influence'
  | 'truth-seer'
  | 'joyful-connector'

export interface CardArtEntry {
  /** Unique key: "{nationKey}-{playbookKey}" */
  key: string
  nationKey: NationKey
  nationLabel: string
  element: ElementKey
  playbookKey: PlaybookKey
  playbookLabel: string
  /** Path relative to project root for local output */
  outputPath: string
  /** Path for use in Next.js <img src="..."> */
  publicPath: string
  /** DALL-E 3 generation prompt — hex values from ELEMENT_TOKENS embedded */
  dallePrompt: string
  /**
   * Vercel Blob URL — null until populated by scripts/generate-card-art.ts.
   * Components must render a placeholder art window when null.
   * Populated by: put() from @vercel/blob in the admin generation script.
   */
  blobUrl: string | null
  /**
   * ISO 8601 timestamp of last successful generation via DALL-E.
   * null when this pairing has never been generated.
   */
  generatedAt: string | null
}

// ─── Nation Definitions ───────────────────────────────────────────────────────

const NATIONS: Array<{ key: NationKey; label: string; element: ElementKey; lore: string }> = [
  {
    key: 'pyrakanth',
    label: 'Pyrakanth',
    element: 'fire',
    lore: 'blazing vanguard of passion and transformation',
  },
  {
    key: 'lamenth',
    label: 'Lamenth',
    element: 'water',
    lore: 'deep current of emotion, intuition, and flow',
  },
  {
    key: 'virelune',
    label: 'Virelune',
    element: 'wood',
    lore: 'living network of growth, connection, and creativity',
  },
  {
    key: 'argyra',
    label: 'Argyra',
    element: 'metal',
    lore: 'silver mirror of precision, clarity, and structure',
  },
  {
    key: 'meridia',
    label: 'Meridia',
    element: 'earth',
    lore: 'grounded center of stability, nurture, and endurance',
  },
]

// ─── Playbook Definitions ─────────────────────────────────────────────────────

const PLAYBOOKS: Array<{
  key: PlaybookKey
  label: string
  trigram: string
  energy: string
}> = [
  {
    key: 'bold-heart',
    label: 'The Bold Heart',
    trigram: 'Heaven ☰',
    energy: 'courageous initiative, creative leadership, the first courageous breath',
  },
  {
    key: 'devoted-guardian',
    label: 'The Devoted Guardian',
    trigram: 'Lake ☱',
    energy: 'steadfast protection, loyal devotion, a shield held in love',
  },
  {
    key: 'decisive-storm',
    label: 'The Decisive Storm',
    trigram: 'Thunder ☳',
    energy: 'dynamic action, sudden clarity, the force that breaks paralysis',
  },
  {
    key: 'danger-walker',
    label: 'The Danger Walker',
    trigram: 'Water ☵',
    energy: 'risk navigation, depth exploration, moving through the abyss with grace',
  },
  {
    key: 'still-point',
    label: 'The Still Point',
    trigram: 'Mountain ☶',
    energy: 'stillness, patient receptivity, the eye of the storm',
  },
  {
    key: 'subtle-influence',
    label: 'The Subtle Influence',
    trigram: 'Wind ☴',
    energy: 'gentle persistent power, strategy through softness, the shaping breeze',
  },
  {
    key: 'truth-seer',
    label: 'The Truth Seer',
    trigram: 'Fire ☲',
    energy: 'clear perception, illumination, seeing through shadow to what is real',
  },
  {
    key: 'joyful-connector',
    label: 'The Joyful Connector',
    trigram: 'Earth ☷',
    energy: 'relational joy, weaving community, the warmth that draws people together',
  },
]

// ─── Shared Prompt Preamble ───────────────────────────────────────────────────

/**
 * Style directive anchored to UI_COVENANT aesthetic — prepended to every channel prompt.
 * Pixel-art enforcement terms are mandatory — they prevent smooth vector output from Flux.
 * See docs/card-art-prompt-template.md for full governance spec.
 */
const STYLE_PREAMBLE = [
  `Pixel art, 16-bit RPG aesthetic, hard pixel edges, dithering pattern, retro game sprite style, no smooth gradients.`,
  `Flat graphic illustration for a dark Taoist cultivation card game.`,
  `Style: 8-bit pixel art meets Wes Anderson — symmetric composition, symmetric framing,`,
  `crisp pixel detail, muted desaturated palette.`,
  `Background: deep near-black #1a1a18.`,
  `No text, no words, no UI chrome — pure illustration only.`,
  `Aspect ratio 1:1. Square. Portrait orientation.`,
].join(' ')

/**
 * Negative prompt terms — prevents smooth illustration, watermarks, non-pixel rendering.
 * Injected by the generation script into the negative_prompt field (not the main prompt).
 */
export const CARD_ART_NEGATIVE_PROMPT = [
  `smooth illustration, vector art, concept art, painted, soft gradients,`,
  `anti-aliased edges, photography, watermark, signature, copyright notice,`,
  `text overlay, UI chrome, logo, words, letters`,
].join(' ')

/**
 * Per-playbook negative prompt overrides — merged with CARD_ART_NEGATIVE_PROMPT at generation time.
 * Only defined for playbooks that have structural conflicts with the universal negative prompt.
 */
export const PLAYBOOK_NEGATIVE_OVERRIDES: Partial<Record<PlaybookKey, string>> = {
  'joyful-connector': `solitary figure, lone figure, single figure, isolated, alone, one person only`,
  'decisive-storm':   `calm water, still water, mirror reflection, flat surface, peaceful, tranquil, serene, vertical reflection streak, reflected lightning, water reflection column`,
}

/**
 * Playbook compositional modifiers — encode each archetype's energy into the composition.
 * Injected into every prompt after the element grammar. Without these, all 8 playbooks
 * within a nation look identical. See docs/card-art-prompt-template.md for rationale.
 */
const PLAYBOOK_COMPOSITIONAL_MODIFIERS: Record<PlaybookKey, string> = {
  'bold-heart':
    `Compositional archetype: the figure faces the light source directly, arms open or raised — courageous, forward-moving. Ascending diagonal energy in the scene.`,
  'devoted-guardian':
    `Compositional archetype: figure in protective stance, slightly turned, one arm extended as a ward or shield. A threshold or boundary is visible behind them.`,
  'decisive-storm':
    `Compositional archetype: figure in dynamic motion — diagonal composition, implied velocity, lightning or sudden illumination. Not centered: movement toward a point. The scene is mid-action. OVERRIDE the element's default stillness: water in storm is turbulent, not reflective. NO still surface, NO mirror reflection, NO bilateral symmetry from calm water. Instead: crashing waves, diagonal rain, churning spray, lightning above turbulent water.`,
  'danger-walker':
    `Compositional archetype: figure at a threshold or crossing — one foot forward into the unknown. Above/below split: sky or light above, void or depth below. Liminal space.`,
  'still-point':
    `Compositional archetype: figure seated or deeply rooted — not standing. Radial or mandala composition, concentric rings emanating from the still center. Receptive, grounded posture.`,
  'subtle-influence':
    `Compositional archetype: figure partially concealed — off-center, at the edge of frame, or in shadow. Indirect light. The environment responds to the figure rather than the figure commanding it.`,
  'truth-seer':
    `Compositional archetype: rare frontal composition — the figure faces the viewer. Eyes or face illuminated. A veil lifts or a shadow recedes, revealing what was hidden beneath the surface.`,
  'joyful-connector':
    `Compositional archetype: OVERRIDE the lone figure anchor — this card requires multiple cultivators or a cultivator in visible relationship with other beings. DO NOT render a single isolated figure. Two or more robed figures facing each other, or a central figure surrounded by other humans in close proximity. Warmth, gathering, visible relationship between beings. The scene must show community, not solitude. Bright warm energy — this is the most joyful card in the set.`,
}

/**
 * Figure anchor — required for every card.
 * Three cards from Pass 1 were missing this (virelune-subtle-influence,
 * argyra-truth-seer, meridia-bold-heart). This anchor prevents figural absence.
 */
const FIGURE_ANCHOR = `Lone robed cultivator figure, centered in frame, silhouetted against the elemental light source. Figure occupies one-third of frame height. Back-facing unless the playbook composition specifies otherwise.`

/** Composition and mood rules from UI_COVENANT — appended to every channel prompt. */
const COMPOSITION_SUFFIX = [
  FIGURE_ANCHOR,
  `The figure embodies both the nation's elemental nature and the archetype's energy simultaneously.`,
  `Mood: contemplative cultivation, quiet power, long-game patience.`,
  `Saturation is deliberately low — cultivation is a long game, not a spectacle.`,
].join(' ')

/**
 * Cards with confirmed third-party watermarks — do not serve in UI, regenerate before shipping.
 * See docs/card-art-prompt-template.md for LoRA audit instructions.
 */
export const QUARANTINED_CARD_KEYS = new Set<string>([
  'argyra-truth-seer',        // ©Rudfren.com watermark visible
  'pyrakanth-joyful-connector', // BQ×Kahuna watermark visible
])

// ─── Per-Channel Prompt Builders ──────────────────────────────────────────────
//
// One builder per Wuxing element (火水木金土).
// Each function:
//   1. Extracts hex values from ELEMENT_TOKENS[element] — never hardcodes hex.
//   2. Applies element-specific visual grammar (light direction, material quality,
//      compositional motion, atmospheric signature).
//   3. Injects archetype label, trigram, and energy descriptor from the pairings table.
//
// These are exported so the admin art-generation script can call them individually
// for batch generation, dry-run preview, or per-element re-runs.

type NationArg  = (typeof NATIONS)[number]
type PlaybookArg = (typeof PLAYBOOKS)[number]

/**
 * Fire 火 — Pyrakanth
 *
 * Visual grammar: ascending cinnabar-framed composition with ember-ochre
 * backlighting erupting from behind the central figure. Chiaroscuro contrast
 * (bright core, near-black periphery). Heat-distortion shimmer at the upper
 * edges of the art frame. The scene implies upward motion — transformation
 * mid-flight. Alchemical crucible or forge imagery as environmental context.
 *
 * Palette from ELEMENT_TOKENS.fire:
 *   frame  #c1392b — cinnabar edge borders
 *   glow   #e8671a — ember-ochre core light source
 *   gem    #e74c3c — bright ember accent sparks
 */
export function buildFirePrompt(nation: NationArg, playbook: PlaybookArg): string {
  const t = ELEMENT_TOKENS['fire']
  return [
    STYLE_PREAMBLE,

    // Palette injection — hex values from ELEMENT_TOKENS.fire
    `Wuxing channel: FIRE 火.`,
    `Scene color accent: cinnabar ${t.frame} — used in material surfaces and edge vignette, not as a painted border.`,
    `Core light source: ${t.glow} (ember-ochre) — backlighting erupts from behind the central figure.`,
    `Accent sparks and gem highlights: ${t.gem} (bright ember) at focal point apex.`,

    // Fire-specific visual grammar
    `Compositional motion: ascending — the figure or scene reaches upward, mid-transformation.`,
    `Lighting model: chiaroscuro — brilliant ember-ochre core (${t.glow}) against deep near-black interior.`,
    `Atmospheric signature: heat distortion shimmer in the upper interior of the scene.`,
    `Material qualities: scorched bronze, volcanic glass, charred wood with glowing seams.`,

    // Playbook compositional modifier — encodes archetype energy into composition
    PLAYBOOK_COMPOSITIONAL_MODIFIERS[playbook.key],

    // Nation lore
    `Nation: ${nation.label} — ${nation.lore}.`,

    // Archetype descriptor from pairings table
    `Archetype: ${playbook.label} (${playbook.trigram}).`,
    `Archetype energy: ${playbook.energy}.`,
    `The central figure channels Fire's transformative force through the archetype's specific agency.`,

    COMPOSITION_SUFFIX,
  ].join(' ')
}

/**
 * Water 水 — Lamenth
 *
 * Visual grammar: reflection-based bilateral symmetry — the scene mirrors
 * perfectly at a still horizontal surface (water or polished obsidian).
 * Deep navy frames the scene like cave walls closing around a hidden pool.
 * Deep teal phosphorescent glow rises from beneath the surface, not from above.
 * Mist or dissolution at the outer edges. The scene implies hidden depth —
 * what is visible is only a fraction of what exists beneath.
 *
 * Palette from ELEMENT_TOKENS.water:
 *   frame  #1a3a5c — deep navy outer chamber
 *   glow   #1a7a8a — deep teal bioluminescent depth
 *   gem    #2980b9 — ocean blue surface accent
 */
export function buildWaterPrompt(nation: NationArg, playbook: PlaybookArg): string {
  const t = ELEMENT_TOKENS['water']
  return [
    STYLE_PREAMBLE,

    // Palette injection — hex values from ELEMENT_TOKENS.water
    `Wuxing channel: WATER 水.`,
    `Scene color accent: deep navy ${t.frame} — used in cave-wall framing and depth haze, not as a painted border.`,
    `Core light source: ${t.glow} (deep teal) — phosphorescent glow from beneath the still surface, not from above.`,
    `Surface accent and gem highlights: ${t.gem} (ocean blue) where the reflection catches the light.`,

    // Water-specific visual grammar
    `Compositional motion: implied depth — the visible scene is one layer; unseen currents move beneath.`,
    `Lighting model: bioluminescent — teal glow (${t.glow}) rises from depth, casting cool light upward.`,
    `Bilateral symmetry achieved via perfect water reflection at a horizontal midline.`,
    `Atmospheric signature: still surface mist at outer edges, depth-haze at the bottom.`,
    `Material qualities: obsidian, polished lapis, dark pearl, wet stone with teal veins.`,

    // Playbook compositional modifier — encodes archetype energy into composition
    PLAYBOOK_COMPOSITIONAL_MODIFIERS[playbook.key],

    // Nation lore
    `Nation: ${nation.label} — ${nation.lore}.`,

    // Archetype descriptor from pairings table
    `Archetype: ${playbook.label} (${playbook.trigram}).`,
    `Archetype energy: ${playbook.energy}.`,
    `The central figure embodies Water's intuitive depth through the archetype's specific way of knowing.`,

    COMPOSITION_SUFFIX,
  ].join(' ')
}

/**
 * Wood 木 — Virelune
 *
 * Visual grammar: radial branching structure emanates from a central living
 * core — the composition grows outward like a tree viewed from directly above
 * or from the root system looking up. Muted sage ground planes anchor the
 * lower register. Jade light filters through an organic network of branches
 * or veins. Upward growth is implied but unhurried — this is patient vitality,
 * not urgency. Living textures: bark, leaf-vein, mycelial thread.
 *
 * Palette from ELEMENT_TOKENS.wood:
 *   frame  #4a7c59 — muted sage/forest border
 *   glow   #27ae60 — jade luminescence through foliage
 *   gem    #2ecc71 — emerald accent at growth tips
 */
export function buildWoodPrompt(nation: NationArg, playbook: PlaybookArg): string {
  const t = ELEMENT_TOKENS['wood']
  return [
    STYLE_PREAMBLE,

    // Palette injection — hex values from ELEMENT_TOKENS.wood
    `Wuxing channel: WOOD 木.`,
    `Scene color accent: muted sage ${t.frame} — used in ground planes and canopy shadow, not as a painted border.`,
    `Core light source: ${t.glow} (jade) — light filters through an organic network, dappled and alive.`,
    `Growth tip accents and gem highlights: ${t.gem} (emerald) at the tips of branches, veins, or growth nodes.`,

    // Wood-specific visual grammar
    `Compositional motion: radial outward growth from a living center — patient, not urgent.`,
    `Lighting model: filtered canopy light — jade (${t.glow}) diffused through layered organic structure.`,
    `Structural motif: branching tree, root system, mycelial network, or leaf-vein lattice.`,
    `Atmospheric signature: forest cathedral quiet, living texture in every surface.`,
    `Material qualities: aged bark, living wood, jade stone, moss, emerald glass veins.`,

    // Playbook compositional modifier — encodes archetype energy into composition
    PLAYBOOK_COMPOSITIONAL_MODIFIERS[playbook.key],

    // Nation lore
    `Nation: ${nation.label} — ${nation.lore}.`,

    // Archetype descriptor from pairings table
    `Archetype: ${playbook.label} (${playbook.trigram}).`,
    `Archetype energy: ${playbook.energy}.`,
    `The central figure grows with Wood's patient vitality through the archetype's specific way of connecting.`,

    COMPOSITION_SUFFIX,
  ].join(' ')
}

/**
 * Metal 金 — Argyra
 *
 * Visual grammar: crystalline precision — geometric forms with hard defined
 * edges, no organic softness. Silver-slate surfaces act as mirrors, reflecting
 * a compressed version of the scene back. Bilateral symmetry is architectural,
 * not natural. Chrome sheen catches a single cold light source from directly
 * above. Minimalist composition — negative space is intentional; everything
 * present is essential. The scene embodies the quality of a polished blade:
 * nothing wasted, everything cutting-clear.
 *
 * Palette from ELEMENT_TOKENS.metal:
 *   frame  #8e9aab — silver-slate precise border
 *   glow   #bdc3c7 — chrome sheen from overhead
 *   gem    #bdc3c7 — pale chrome focal accent
 */
export function buildMetalPrompt(nation: NationArg, playbook: PlaybookArg): string {
  const t = ELEMENT_TOKENS['metal']
  return [
    STYLE_PREAMBLE,

    // Palette injection — hex values from ELEMENT_TOKENS.metal
    `Wuxing channel: METAL 金.`,
    `Scene color accent: silver-slate ${t.frame} — used in architectural surfaces and mirror planes, not as a painted border.`,
    `Core light source: ${t.glow} (chrome) — cold overhead light catches geometric surfaces.`,
    `Focal accent and gem highlights: ${t.gem} (pale chrome) at the sharpest point of the composition.`,

    // Metal-specific visual grammar
    `Compositional motion: none — stillness and precision. The scene is suspended, complete.`,
    `Lighting model: cold directional overhead — chrome (${t.glow}) creates high-contrast reflections on flat planes.`,
    `Structural motif: crystalline lattice, polished blade, angular facets, geometric mirror planes.`,
    `Atmospheric signature: cold clarity, the silence of a precision instrument, negative space as meaning.`,
    `Material qualities: polished silver, quartz crystal, mirror-finish obsidian, chrome alloy.`,

    // Playbook compositional modifier — encodes archetype energy into composition
    PLAYBOOK_COMPOSITIONAL_MODIFIERS[playbook.key],

    // Nation lore
    `Nation: ${nation.label} — ${nation.lore}.`,

    // Archetype descriptor from pairings table
    `Archetype: ${playbook.label} (${playbook.trigram}).`,
    `Archetype energy: ${playbook.energy}.`,
    `The central figure embodies Metal's cutting clarity through the archetype's specific way of discerning.`,

    COMPOSITION_SUFFIX,
  ].join(' ')
}

/**
 * Earth 土 — Meridia
 *
 * Visual grammar: concentric layered terrain planes recede toward a warm low
 * horizon. Terracotta light enters from a low angle (dawn or dusk), casting
 * long warm shadows. Root systems and foundations are visible beneath the
 * ground plane — stability is structural, not assumed. Ochre-amber harvest
 * tones dominate the mid-register. Concentric circles or rings as symbolic
 * motif of cyclical endurance. The scene implies the patience of seasons.
 *
 * Palette from ELEMENT_TOKENS.earth:
 *   frame  #b5651d — terracotta warm border
 *   glow   #d4a017 — ochre-amber harvest light
 *   gem    #d4a017 — warm gold focal accent
 */
export function buildEarthPrompt(nation: NationArg, playbook: PlaybookArg): string {
  const t = ELEMENT_TOKENS['earth']
  return [
    STYLE_PREAMBLE,

    // Palette injection — hex values from ELEMENT_TOKENS.earth
    `Wuxing channel: EARTH 土.`,
    `Scene color accent: terracotta ${t.frame} — used in fired-clay terrain and root textures, not as a painted border.`,
    `Core light source: ${t.glow} (ochre-amber) — low-angle harvest light from the horizon, long warm shadows.`,
    `Focal accent and gem highlights: ${t.gem} (warm gold) at the composition's still center.`,

    // Earth-specific visual grammar
    `Compositional motion: inward and downward — gravity toward a stable center, roots reaching below.`,
    `Lighting model: low-angle warm — ochre-amber (${t.glow}) rakes across layered terrain, creating depth.`,
    `Structural motif: concentric terrain rings, visible root system below the surface plane, harvest fields.`,
    `Atmospheric signature: patient seasonal warmth, the certainty of soil, ancient endurance.`,
    `Material qualities: terracotta clay, fired earth, warm sandstone, root-wood, amber resin.`,

    // Playbook compositional modifier — encodes archetype energy into composition
    PLAYBOOK_COMPOSITIONAL_MODIFIERS[playbook.key],

    // Nation lore
    `Nation: ${nation.label} — ${nation.lore}.`,

    // Archetype descriptor from pairings table
    `Archetype: ${playbook.label} (${playbook.trigram}).`,
    `Archetype energy: ${playbook.energy}.`,
    `The central figure embodies Earth's grounded endurance through the archetype's specific way of sustaining.`,

    COMPOSITION_SUFFIX,
  ].join(' ')
}

// ─── Channel Dispatcher ───────────────────────────────────────────────────────

/**
 * Routes to the correct per-channel prompt builder based on the nation's element.
 * This is the internal entry point used by buildRegistry().
 * Exported per-element builders (buildFirePrompt, etc.) are available for
 * admin scripts that need per-channel batch generation or dry-run preview.
 */
function buildPrompt(
  nation: NationArg,
  playbook: PlaybookArg
): string {
  switch (nation.element) {
    case 'fire':   return buildFirePrompt(nation, playbook)
    case 'water':  return buildWaterPrompt(nation, playbook)
    case 'wood':   return buildWoodPrompt(nation, playbook)
    case 'metal':  return buildMetalPrompt(nation, playbook)
    case 'earth':  return buildEarthPrompt(nation, playbook)
    default: {
      // TypeScript exhaustiveness guard — never reached with valid ElementKey
      const _exhaustive: never = nation.element
      throw new Error(`card-art-registry: Unknown element "${_exhaustive}"`)
    }
  }
}

// ─── Registry ────────────────────────────────────────────────────────────────
// 5 nations × 8 playbooks = 40 entries

function buildRegistry(): CardArtEntry[] {
  const entries: CardArtEntry[] = []

  for (const nation of NATIONS) {
    for (const playbook of PLAYBOOKS) {
      const key = `${nation.key}-${playbook.key}`
      entries.push({
        key,
        nationKey: nation.key,
        nationLabel: nation.label,
        element: nation.element,
        playbookKey: playbook.key,
        playbookLabel: playbook.label,
        outputPath: `public/card-art/${key}.png`,
        publicPath: `/card-art/${key}.png`,
        dallePrompt: buildPrompt(nation, playbook),
        // Populated by scripts/generate-card-art.ts after DALL-E generation + @vercel/blob upload
        blobUrl:     null,
        generatedAt: null,
      })
    }
  }

  return entries
}

export const CARD_ART_REGISTRY: ReadonlyArray<CardArtEntry> = buildRegistry()

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

/** Get a single registry entry by nation + playbook keys */
export function getCardArtEntry(
  nationKey: NationKey,
  playbookKey: PlaybookKey
): CardArtEntry | undefined {
  return CARD_ART_REGISTRY.find(
    (e) => e.nationKey === nationKey && e.playbookKey === playbookKey
  )
}

/** Get all entries for a given element */
export function getCardArtByElement(element: ElementKey): CardArtEntry[] {
  return CARD_ART_REGISTRY.filter((e) => e.element === element)
}

/** Get all entries for a given playbook archetype */
export function getCardArtByPlaybook(playbookKey: PlaybookKey): CardArtEntry[] {
  return CARD_ART_REGISTRY.filter((e) => e.playbookKey === playbookKey)
}

// ─── Nested Index: keyed by PlaybookKey (archetypeName) → ElementKey ──────────
//
// Primary lookup structure for UI components.
// Satisfies AC-11: "keyed by archetypeName and elementKey".
// Built from the flat CARD_ART_REGISTRY — single source of truth.

/** Nested map: CARD_ART_BY_ARCHETYPE[playbookKey][element] → CardArtEntry */
export const CARD_ART_BY_ARCHETYPE: Readonly<Record<PlaybookKey, Readonly<Record<ElementKey, CardArtEntry>>>> =
  (() => {
    const index = {} as Record<PlaybookKey, Record<ElementKey, CardArtEntry>>
    for (const entry of CARD_ART_REGISTRY) {
      if (!index[entry.playbookKey]) {
        index[entry.playbookKey] = {} as Record<ElementKey, CardArtEntry>
      }
      index[entry.playbookKey][entry.element] = entry
    }
    return index as Readonly<Record<PlaybookKey, Readonly<Record<ElementKey, CardArtEntry>>>>
  })()

// ─── Extended Lookup Helpers ──────────────────────────────────────────────────

/**
 * Primary lookup by archetypeName (PlaybookKey) and elementKey.
 *
 * This is the canonical lookup for UI components (CultivationCard art window).
 * Accepts loose string input — safe to pass player.archetype.name or
 * player.playerPlaybook.playbookName without pre-validation.
 *
 * @returns CardArtEntry or null when slug/element is unrecognised
 *
 * @example
 *   const art = lookupCardArt('bold-heart', 'fire')
 *   // art?.blobUrl — Vercel Blob URL or null (render placeholder)
 *   // art?.publicPath — local fallback path
 */
export function lookupCardArt(
  archetypeName: string | null | undefined,
  element: ElementKey | string | null | undefined,
): CardArtEntry | null {
  if (!archetypeName || !element) return null
  const archetypeRecord = CARD_ART_BY_ARCHETYPE[archetypeName as PlaybookKey]
  if (!archetypeRecord) return null
  return archetypeRecord[element as ElementKey] ?? null
}

/**
 * Type guard for PlaybookKey.
 * Use to validate archetype inputs before passing to registry lookups.
 */
export function isPlaybookKey(value: string): value is PlaybookKey {
  return value in CARD_ART_BY_ARCHETYPE
}

/**
 * Returns the expected @vercel/blob object path for a card art entry.
 * The admin script (scripts/generate-card-art.ts) uses this path on upload.
 *
 * Convention: `card-art/{playbookKey}/{element}.png`
 *
 * @example
 *   cardArtBlobPath('bold-heart', 'fire')  // → 'card-art/bold-heart/fire.png'
 */
export function cardArtBlobPath(playbookKey: PlaybookKey, element: ElementKey): string {
  return `card-art/${playbookKey}/${element}.png`
}

/**
 * Return all entries that still need generation (blobUrl is null).
 * Used by scripts/generate-card-art.ts to determine the work queue.
 */
export function getPendingArtEntries(): Array<{
  playbookKey: PlaybookKey
  element: ElementKey
  entry: CardArtEntry
}> {
  return CARD_ART_REGISTRY
    .filter((e) => e.blobUrl === null)
    .map((e) => ({ playbookKey: e.playbookKey, element: e.element, entry: e }))
}

/**
 * Return all entries that have already been generated (blobUrl is not null).
 * Useful for admin audit and re-generation checks.
 */
export function getGeneratedArtEntries(): Array<{
  playbookKey: PlaybookKey
  element: ElementKey
  entry: CardArtEntry & { blobUrl: string }
}> {
  return CARD_ART_REGISTRY
    .filter((e): e is CardArtEntry & { blobUrl: string } => e.blobUrl !== null)
    .map((e) => ({ playbookKey: e.playbookKey, element: e.element, entry: e }))
}

/**
 * Count how many of the 40 entries have been generated (blobUrl is not null).
 * Used by the admin script to report generation progress.
 */
export function countGeneratedArt(): number {
  return CARD_ART_REGISTRY.filter((e) => e.blobUrl !== null).length
}

/** Total expected entries: 5 nations × 8 playbooks */
export const TOTAL_CARD_ART_COUNT = 40

// ─── Ideogram Palette Hints ───────────────────────────────────────────────────
// Used by generate-card-art.ts --custom path.
// Derived from ELEMENT_TOKENS — locked to card-tokens.ts values.
// Each member: { color_hex, color_weight } for Ideogram's color_palette API param.

export const ELEMENT_PALETTE_HINTS = {
  fire: [
    { color_hex: '#1a1a18', color_weight: 0.40 },
    { color_hex: '#c1392b', color_weight: 0.25 },
    { color_hex: '#e8671a', color_weight: 0.20 },
    { color_hex: '#e74c3c', color_weight: 0.15 },
  ],
  water: [
    { color_hex: '#1a1a18', color_weight: 0.40 },
    { color_hex: '#1a3a5c', color_weight: 0.25 },
    { color_hex: '#1a7a8a', color_weight: 0.20 },
    { color_hex: '#2980b9', color_weight: 0.15 },
  ],
  wood: [
    { color_hex: '#1a1a18', color_weight: 0.40 },
    { color_hex: '#4a7c59', color_weight: 0.25 },
    { color_hex: '#27ae60', color_weight: 0.20 },
    { color_hex: '#2ecc71', color_weight: 0.15 },
  ],
  metal: [
    { color_hex: '#1a1a18', color_weight: 0.40 },
    { color_hex: '#8e9aab', color_weight: 0.25 },
    { color_hex: '#bdc3c7', color_weight: 0.25 },
    { color_hex: '#0d1017', color_weight: 0.10 },
  ],
  earth: [
    { color_hex: '#1a1a18', color_weight: 0.40 },
    { color_hex: '#b5651d', color_weight: 0.25 },
    { color_hex: '#d4a017', color_weight: 0.20 },
    { color_hex: '#451a03', color_weight: 0.15 },
  ],
} as const satisfies Record<ElementKey, { color_hex: string; color_weight: number }[]>

// ─── Invariant check ──────────────────────────────────────────────────────────
// Verified at module load: all 40 pairings present. Throws if registry is broken.

if (CARD_ART_REGISTRY.length !== 40) {
  throw new Error(
    `card-art-registry: Expected 40 entries (5 nations × 8 playbooks), got ${CARD_ART_REGISTRY.length}`
  )
}
