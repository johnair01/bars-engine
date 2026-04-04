'use client'

import { useCallback } from 'react'
import {
  APPROVED_DISPLAY_FONTS,
  APPROVED_BODY_FONTS,
} from '@/lib/ui/campaign-skin-tokens'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FontSelectorProps = {
  label: string
  description?: string
  value: string | null
  onChange: (value: string | null) => void
  variant: 'display' | 'body'
}

// ---------------------------------------------------------------------------
// Font option styling
// ---------------------------------------------------------------------------

const FONT_FAMILIES: Record<string, string> = {
  'press-start-2p': '"Press Start 2P", monospace',
  'inter': '"Inter", system-ui, sans-serif',
  'dm-sans': '"DM Sans", system-ui, sans-serif',
  'space-grotesk': '"Space Grotesk", system-ui, sans-serif',
  'playfair': '"Playfair Display", serif',
  'lora': '"Lora", serif',
  'system-ui': 'system-ui, sans-serif',
}

const CATEGORY_LABELS: Record<string, string> = {
  pixel: 'Pixel',
  sans: 'Sans-serif',
  serif: 'Serif',
  system: 'System',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FontSelector({
  label,
  description,
  value,
  onChange,
  variant,
}: FontSelectorProps) {
  const fonts = variant === 'display' ? APPROVED_DISPLAY_FONTS : APPROVED_BODY_FONTS

  const handleSelect = useCallback(
    (key: string) => {
      onChange(value === key ? null : key)
    },
    [value, onChange],
  )

  // Group by category
  const categories = new Map<string, typeof fonts[number][]>()
  for (const font of fonts) {
    const cat = font.category
    if (!categories.has(cat)) categories.set(cat, [])
    categories.get(cat)!.push(font)
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          {label}
        </h3>
        {description && (
          <p className="text-[10px] text-zinc-600 mt-0.5">{description}</p>
        )}
      </div>

      <div className="space-y-2">
        {/* Default / System option */}
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
            value === null
              ? 'border-purple-600/60 bg-purple-950/30 text-purple-200'
              : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
          }`}
        >
          <span className="text-xs uppercase tracking-wider text-zinc-500">
            Default
          </span>
          <span className="block mt-0.5 text-zinc-300">
            {variant === 'display' ? 'System default display font' : 'System default body font'}
          </span>
        </button>

        {Array.from(categories.entries()).map(([cat, catFonts]) => (
          <div key={cat} className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 pl-1">
              {CATEGORY_LABELS[cat] ?? cat}
            </span>
            {catFonts.map((font) => (
              <button
                key={font.key}
                type="button"
                onClick={() => handleSelect(font.key)}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                  value === font.key
                    ? 'border-purple-600/60 bg-purple-950/30 text-purple-200'
                    : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                <span
                  className="block text-sm"
                  style={{
                    fontFamily: FONT_FAMILIES[font.key] ?? 'inherit',
                    fontSize: font.key === 'press-start-2p' ? '10px' : undefined,
                  }}
                >
                  {font.label}
                </span>
                <span
                  className="block mt-1 text-xs text-zinc-500"
                  style={{
                    fontFamily: FONT_FAMILIES[font.key] ?? 'inherit',
                    fontSize: font.key === 'press-start-2p' ? '8px' : undefined,
                  }}
                >
                  The quick brown fox jumps over the lazy dog
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
