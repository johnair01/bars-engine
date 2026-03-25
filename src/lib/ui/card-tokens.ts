/**
 * BARS ENGINE — Card Design Tokens
 * Single source of truth for element-aware card UI.
 *
 * Three-channel encoding system:
 *   Element → color (frame border, glow, gem)
 *   Altitude → border treatment (dissatisfied / neutral / satisfied)
 *   Stage → card density (seed / growing / composted)
 *
 * AI: Always derive colors from these tokens. Never hardcode hex in components.
 * Layout via Tailwind. Game aesthetic via cultivation-cards.css using these vars.
 *
 * ARDS (Asset Register Design System) — which semantic register each export feeds:
 *   Register 1 Cosmic — ELEMENT_TOKENS palettes for mythic art + derived UI tints.
 *   Register 4 Walk — nation overlay colors trace to `frame` / css vars (walk sheets tint); nation keys → element: `nation-element.ts`.
 *   Register 5 Frame/Chrome — altitude + stage tokens below (border/glow/density); move icons are separate PNGs in public/icons/moves/.
 *   Register 6 Zone/Texture — SURFACE_TOKENS screen/card surfaces; zone tile PNGs layer on bgBase when present.
 *   Register 7 Ceremony — elementCssVars / gem+glow for ritual feedback; no separate image register.
 * See docs/SEMANTIC_REGISTERS.md
 */

// ─── Element Keys ────────────────────────────────────────────────────────────
// Maps to Nation.element field in Prisma schema

export type ElementKey = 'fire' | 'water' | 'wood' | 'metal' | 'earth'

export type CardAltitude = 'dissatisfied' | 'neutral' | 'satisfied'
export type CardStage    = 'seed' | 'growing' | 'composted'
export type CardTier     = 1 | 2 | 3 | 4

// ─── Wuxing Element Palette — Register 1 (Cosmic palette) + 4 (walk tint) + 7 (ceremony) ──
// Each element: frame (border), glow (box-shadow), gem (rarity indicator)
// Colors are desaturated — cultivation is a long game.
// Saturation increases with altitude via glow intensity, not hue shift.
//
// NOTE: Metal uses silver-slate, NOT purple.
// Purple (#7c3aed range) is reserved for liminal / primary action states.

export const ELEMENT_TOKENS = {
  fire: {
    sigil:      '火',
    frame:      '#c1392b',   // cinnabar
    glow:       '#e8671a',   // ember-ochre
    gem:        '#e74c3c',   // bright ember
    bg:         'bg-orange-950/40',
    border:     'border-orange-700/50',
    borderHover:'border-orange-500/70',
    textAccent: 'text-orange-300',
    badgeBg:    'bg-orange-900/60',
    gradFrom:   '#431407',
    gradTo:     '#1c0700',
    cssVarColor: '#c1392b',
    cssVarGlow:  '#e8671a',
  },
  water: {
    sigil:      '水',
    frame:      '#1a3a5c',   // deep navy
    glow:       '#1a7a8a',   // deep teal
    gem:        '#2980b9',   // ocean blue
    bg:         'bg-blue-950/40',
    border:     'border-blue-700/50',
    borderHover:'border-blue-500/70',
    textAccent: 'text-blue-300',
    badgeBg:    'bg-blue-900/60',
    gradFrom:   '#0c1e3e',
    gradTo:     '#020c1f',
    cssVarColor: '#1a3a5c',
    cssVarGlow:  '#1a7a8a',
  },
  wood: {
    sigil:      '木',
    frame:      '#4a7c59',   // muted sage / forest
    glow:       '#27ae60',   // jade
    gem:        '#2ecc71',   // emerald
    bg:         'bg-emerald-950/40',
    border:     'border-emerald-700/50',
    borderHover:'border-emerald-500/70',
    textAccent: 'text-emerald-300',
    badgeBg:    'bg-emerald-900/60',
    gradFrom:   '#052e16',
    gradTo:     '#011309',
    cssVarColor: '#4a7c59',
    cssVarGlow:  '#27ae60',
  },
  metal: {
    sigil:      '金',
    frame:      '#8e9aab',   // silver-slate (NOT purple — purple = primary action)
    glow:       '#bdc3c7',   // chrome
    gem:        '#bdc3c7',   // pale chrome
    bg:         'bg-slate-900/50',
    border:     'border-slate-600/50',
    borderHover:'border-slate-400/70',
    textAccent: 'text-slate-300',
    badgeBg:    'bg-slate-800/60',
    gradFrom:   '#1e2530',
    gradTo:     '#0d1017',
    cssVarColor: '#8e9aab',
    cssVarGlow:  '#bdc3c7',
  },
  earth: {
    sigil:      '土',
    frame:      '#b5651d',   // terracotta
    glow:       '#d4a017',   // ochre-amber
    gem:        '#d4a017',   // warm gold
    bg:         'bg-amber-950/40',
    border:     'border-amber-700/50',
    borderHover:'border-amber-500/70',
    textAccent: 'text-amber-300',
    badgeBg:    'bg-amber-900/60',
    gradFrom:   '#451a03',
    gradTo:     '#1a0a00',
    cssVarColor: '#b5651d',
    cssVarGlow:  '#d4a017',
  },
} as const satisfies Record<ElementKey, {
  sigil: string
  frame: string; glow: string; gem: string
  bg: string; border: string; borderHover: string
  textAccent: string; badgeBg: string
  gradFrom: string; gradTo: string
  cssVarColor: string; cssVarGlow: string
}>

// ─── Altitude Tokens — Register 5 Frame/Chrome (dissatisfied / neutral / satisfied border) ─

export const ALTITUDE_TOKENS: Record<CardAltitude, {
  glowRadius: string     // CSS value for --glow-radius
  borderOpacity: number  // 0–1
  borderWidth: string    // CSS px
  floatPeriod: string    // CSS duration
  label: string
}> = {
  dissatisfied: {
    glowRadius:   '0px',
    borderOpacity: 0.3,
    borderWidth:  '1px',
    floatPeriod:  'none',
    label:        'Dissatisfied',
  },
  neutral: {
    glowRadius:   '4px',
    borderOpacity: 0.7,
    borderWidth:  '2px',
    floatPeriod:  '4s',
    label:        'Neutral',
  },
  satisfied: {
    glowRadius:   '12px',
    borderOpacity: 1.0,
    borderWidth:  '2px',
    floatPeriod:  '6s',
    label:        'Satisfied',
  },
}

// ─── Stage Tokens — Register 5 Frame/Chrome (seed / growing / composted density) ─────────

export const STAGE_TOKENS: Record<CardStage, {
  artWindowHeight: string  // Tailwind class
  artOpacity: string       // Tailwind class
  statBlockVisible: boolean
  descriptionLines: number
  hasCompostedOverlay: boolean
  label: string
}> = {
  seed: {
    artWindowHeight:   'h-[30%]',
    artOpacity:        'opacity-100',
    statBlockVisible:  false,
    descriptionLines:  2,
    hasCompostedOverlay: false,
    label: 'Seed',
  },
  growing: {
    artWindowHeight:   'h-[50%]',
    artOpacity:        'opacity-100',
    statBlockVisible:  true,
    descriptionLines:  4,
    hasCompostedOverlay: false,
    label: 'Growing',
  },
  composted: {
    artWindowHeight:   'h-[30%]',
    artOpacity:        'opacity-20',
    statBlockVisible:  true,
    descriptionLines:  4,
    hasCompostedOverlay: true,
    label: 'Composted',
  },
}

// ─── Surface Tokens — Register 6 Zone/Texture (ambient surfaces; pair with zone-*.png tiles) ─

export const SURFACE_TOKENS = {
  bgBase:        '#0a0908',   // screen background (imperceptibly warm, not pure black)
  surfaceCard:   '#1a1a18',   // card body
  surfaceElevated: '#242420', // modals, bottom sheets
  surfaceInset:  '#111110',   // description wells within cards
  textPrimary:   '#e8e6e0',   // warm white
  textSecondary: '#a09e98',   // zinc-400 equivalent
  textMuted:     '#6b6965',   // only at text-sm or larger — never text-xs
  // text-zinc-600 at text-xs = ~3.2:1 contrast — FORBIDDEN
} as const

// ─── Helper: build CSS custom properties for a card element ──────────────────

export function elementCssVars(element: ElementKey): Record<string, string> {
  const t = ELEMENT_TOKENS[element]
  return {
    '--element-frame': t.cssVarColor,
    '--element-glow':  t.cssVarGlow,
    '--element-gem':   t.gem,
  }
}

export function altitudeCssVars(altitude: CardAltitude): Record<string, string> {
  const t = ALTITUDE_TOKENS[altitude]
  return {
    '--glow-radius':     t.glowRadius,
    '--border-width':    t.borderWidth,
    '--border-opacity':  String(t.borderOpacity),
  }
}
