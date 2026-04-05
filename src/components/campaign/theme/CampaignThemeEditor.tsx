'use client'

import { useState, useCallback, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  saveCampaignTheme,
  resetCampaignTheme,
  type CampaignThemeRecord,
} from '@/actions/campaign-theme'
import type { ThemeData } from '@/lib/ui/build-skin-vars'
import {
  THEME_PRESET_LIST,
  type ThemePreset,
} from '@/lib/ui/theme-presets'
import {
  DEFAULT_BORDER_TOKENS,
  DEFAULT_DENSITY_TOKENS,
  type CampaignBorderTokens,
  type CampaignDensityTokens,
} from '@/lib/ui/campaign-skin-tokens'
import { ColorPickerField, ColorGroup, type ColorFieldConfig } from './ColorPickerField'
import { FontSelector } from './FontSelector'
import { CampaignThemePreview } from './CampaignThemePreview'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CampaignThemeEditorProps = {
  campaignId: string
  campaignName: string
  campaignSlug: string
  campaignDescription?: string | null
  existingTheme: CampaignThemeRecord | null
}

type EditorSection = 'preset' | 'colors' | 'typography' | 'surfaces' | 'density'

// ---------------------------------------------------------------------------
// Color field configuration — organized by visual group
// ---------------------------------------------------------------------------

const PALETTE_COLORS: ColorFieldConfig[] = [
  { key: 'titleColor', label: 'Title Color', cssVar: '--cs-title' },
  { key: 'accentPrimary', label: 'Accent Primary', cssVar: '--cs-accent-1' },
  { key: 'accentSecondary', label: 'Accent Secondary', cssVar: '--cs-accent-2' },
  { key: 'accentTertiary', label: 'Accent Tertiary', cssVar: '--cs-accent-3' },
  { key: 'greenAccent', label: 'Green Accent', cssVar: '--cs-green' },
]

const TEXT_COLORS: ColorFieldConfig[] = [
  { key: 'textPrimary', label: 'Text Primary', cssVar: '--cs-text-primary' },
  { key: 'textSecondary', label: 'Text Secondary', cssVar: '--cs-text-secondary' },
  { key: 'textMuted', label: 'Text Muted', cssVar: '--cs-text-muted' },
]

const SURFACE_COLORS: ColorFieldConfig[] = [
  { key: 'bgDeep', label: 'Background Deep', cssVar: '--cs-bg-deep' },
  { key: 'surfaceColor', label: 'Card Surface', cssVar: '--cs-surface' },
  { key: 'surfaceHoverColor', label: 'Card Surface Hover', cssVar: '--cs-surface-hover' },
  { key: 'borderColor', label: 'Border Color', cssVar: '--cs-border' },
  { key: 'borderHoverColor', label: 'Border Hover', cssVar: '--cs-border-hover' },
]

const CTA_COLORS: ColorFieldConfig[] = [
  { key: 'ctaBg', label: 'CTA Background', cssVar: '--cs-cta-bg' },
  { key: 'ctaText', label: 'CTA Text', cssVar: '--cs-cta-text' },
  { key: 'ctaHoverBg', label: 'CTA Hover', cssVar: '--cs-cta-hover' },
]

// ---------------------------------------------------------------------------
// Density presets
// ---------------------------------------------------------------------------

const DENSITY_OPTIONS: { value: 'compact' | 'balanced' | 'spacious'; label: string; description: string }[] = [
  { value: 'compact', label: 'Compact', description: 'Dense information layout — less whitespace' },
  { value: 'balanced', label: 'Balanced', description: 'Default spacing — readable and clean' },
  { value: 'spacious', label: 'Spacious', description: 'Generous breathing room — minimal feel' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract ThemeData from editor state */
function themeDataFromState(state: ThemeData): ThemeData {
  return {
    bgGradient: state.bgGradient ?? null,
    bgDeep: state.bgDeep ?? null,
    titleColor: state.titleColor ?? null,
    accentPrimary: state.accentPrimary ?? null,
    accentSecondary: state.accentSecondary ?? null,
    accentTertiary: state.accentTertiary ?? null,
    greenAccent: state.greenAccent ?? null,
    surfaceColor: state.surfaceColor ?? null,
    surfaceHoverColor: state.surfaceHoverColor ?? null,
    borderColor: state.borderColor ?? null,
    borderHoverColor: state.borderHoverColor ?? null,
    textPrimary: state.textPrimary ?? null,
    textSecondary: state.textSecondary ?? null,
    textMuted: state.textMuted ?? null,
    ctaBg: state.ctaBg ?? null,
    ctaText: state.ctaText ?? null,
    ctaHoverBg: state.ctaHoverBg ?? null,
    fontDisplayKey: state.fontDisplayKey ?? null,
    fontBodyKey: state.fontBodyKey ?? null,
    posterImageUrl: state.posterImageUrl ?? null,
    borderTokens: state.borderTokens ?? null,
    densityTokens: state.densityTokens ?? null,
    cssVarOverrides: state.cssVarOverrides ?? null,
  }
}

/** Build ThemeData from existing CampaignThemeRecord */
function themeRecordToData(record: CampaignThemeRecord | null): ThemeData {
  if (!record) return {}
  return {
    bgGradient: record.bgGradient,
    bgDeep: record.bgDeep,
    titleColor: record.titleColor,
    accentPrimary: record.accentPrimary,
    accentSecondary: record.accentSecondary,
    accentTertiary: record.accentTertiary,
    greenAccent: record.greenAccent,
    surfaceColor: record.surfaceColor,
    surfaceHoverColor: record.surfaceHoverColor,
    borderColor: record.borderColor,
    borderHoverColor: record.borderHoverColor,
    textPrimary: record.textPrimary,
    textSecondary: record.textSecondary,
    textMuted: record.textMuted,
    ctaBg: record.ctaBg,
    ctaText: record.ctaText,
    ctaHoverBg: record.ctaHoverBg,
    fontDisplayKey: record.fontDisplayKey,
    fontBodyKey: record.fontBodyKey,
    posterImageUrl: record.posterImageUrl,
    borderTokens: record.borderTokens,
    densityTokens: record.densityTokens,
    cssVarOverrides: record.cssVarOverrides,
  }
}

// ---------------------------------------------------------------------------
// Section labels
// ---------------------------------------------------------------------------

const SECTION_CONFIG: { key: EditorSection; label: string; description: string }[] = [
  { key: 'preset', label: 'Theme Preset', description: 'Start from a preset, then customize' },
  { key: 'colors', label: 'Color Palette', description: 'Title, accent, text, and CTA colors' },
  { key: 'typography', label: 'Typography', description: 'Display and body font selection' },
  { key: 'surfaces', label: 'Surfaces & Borders', description: 'Card backgrounds, borders, and glow effects' },
  { key: 'density', label: 'Layout Density', description: 'Spacing and content density' },
]

// ---------------------------------------------------------------------------
// Main Editor Component
// ---------------------------------------------------------------------------

export function CampaignThemeEditor({
  campaignId,
  campaignName,
  campaignSlug,
  campaignDescription,
  existingTheme,
}: CampaignThemeEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // --- Editor state ---
  const [theme, setTheme] = useState<ThemeData>(themeRecordToData(existingTheme))
  const [activeSection, setActiveSection] = useState<EditorSection>('preset')
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // --- Field updater ---
  const updateField = useCallback((key: string, value: string | null) => {
    setTheme((prev) => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
    setFeedback(null)
  }, [])

  // --- Preset application ---
  const applyPreset = useCallback((preset: ThemePreset) => {
    setTheme({ ...preset.theme })
    setSelectedPresetKey(preset.key)
    setHasUnsavedChanges(true)
    setFeedback(null)
  }, [])

  // --- Border tokens ---
  const borderTokens: CampaignBorderTokens = useMemo(
    () => (theme.borderTokens as CampaignBorderTokens) ?? { ...DEFAULT_BORDER_TOKENS },
    [theme.borderTokens],
  )

  const updateBorderToken = useCallback((key: keyof CampaignBorderTokens, value: string) => {
    setTheme((prev) => ({
      ...prev,
      borderTokens: {
        ...((prev.borderTokens as CampaignBorderTokens) ?? DEFAULT_BORDER_TOKENS),
        [key]: value,
      },
    }))
    setHasUnsavedChanges(true)
    setFeedback(null)
  }, [])

  // --- Density tokens ---
  const densityTokens: CampaignDensityTokens = useMemo(
    () => (theme.densityTokens as CampaignDensityTokens) ?? { ...DEFAULT_DENSITY_TOKENS },
    [theme.densityTokens],
  )

  const updateDensity = useCallback((contentDensity: 'compact' | 'balanced' | 'spacious') => {
    const spacingMap = {
      compact: { cardPadding: '1rem', sectionSpacing: '1rem' },
      balanced: { cardPadding: '1.5rem', sectionSpacing: '1.5rem' },
      spacious: { cardPadding: '2rem', sectionSpacing: '2rem' },
    }
    setTheme((prev) => ({
      ...prev,
      densityTokens: {
        contentDensity,
        ...spacingMap[contentDensity],
      },
    }))
    setHasUnsavedChanges(true)
    setFeedback(null)
  }, [])

  // --- Gradient editor ---
  const updateGradient = useCallback((value: string) => {
    setTheme((prev) => ({ ...prev, bgGradient: value }))
    setHasUnsavedChanges(true)
    setFeedback(null)
  }, [])

  // --- Save ---
  const handleSave = useCallback(() => {
    setFeedback(null)
    startTransition(async () => {
      const data = themeDataFromState(theme)
      const result = await saveCampaignTheme({
        campaignId,
        presetKey: selectedPresetKey ?? undefined,
        ...data,
      })

      if ('error' in result) {
        setFeedback({ type: 'error', message: result.error })
        return
      }

      setFeedback({ type: 'success', message: 'Theme saved successfully' })
      setHasUnsavedChanges(false)
      router.refresh()
    })
  }, [campaignId, theme, selectedPresetKey, router, startTransition])

  // --- Reset ---
  const handleReset = useCallback(() => {
    setFeedback(null)
    startTransition(async () => {
      const result = await resetCampaignTheme(campaignId)
      if ('error' in result) {
        setFeedback({ type: 'error', message: result.error })
        return
      }

      setTheme({})
      setSelectedPresetKey(null)
      setHasUnsavedChanges(false)
      setFeedback({ type: 'success', message: 'Theme reset to default' })
      router.refresh()
    })
  }, [campaignId, router, startTransition])

  // --- Build color values map for ColorGroup ---
  const colorValues = useMemo(() => {
    const v: Record<string, string | null> = {}
    for (const f of [...PALETTE_COLORS, ...TEXT_COLORS, ...SURFACE_COLORS, ...CTA_COLORS]) {
      v[f.key] = (theme as Record<string, unknown>)[f.key] as string | null ?? null
    }
    return v
  }, [theme])

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6 max-w-6xl">
      {/* ─── Left: Editor Controls ───────────────────────────────── */}
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-purple-400/80">
            L2 Visual Theme
          </p>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {campaignName} — Theme Editor
          </h1>
          <p className="text-sm text-zinc-400">
            Configure the visual identity for your campaign. Pick a preset to start,
            then customize colors, fonts, and layout.
          </p>
        </div>

        {/* Section tabs */}
        <div className="flex flex-wrap gap-1">
          {SECTION_CONFIG.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveSection(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === s.key
                  ? 'bg-purple-950/40 border border-purple-700/50 text-purple-200'
                  : 'bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Active section */}
        <div className="rounded-2xl border border-purple-800/50 bg-zinc-950/80 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {SECTION_CONFIG.find((s) => s.key === activeSection)?.label}
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              {SECTION_CONFIG.find((s) => s.key === activeSection)?.description}
            </p>
          </div>

          {/* ── Preset Section ─────────────────────────── */}
          {activeSection === 'preset' && (
            <div className="space-y-3">
              {THEME_PRESET_LIST.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    selectedPresetKey === preset.key
                      ? 'border-purple-600/60 bg-purple-950/30'
                      : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Preset color swatches */}
                    <div className="flex gap-1 flex-shrink-0">
                      {[
                        preset.theme.titleColor,
                        preset.theme.accentPrimary,
                        preset.theme.accentSecondary,
                        preset.theme.accentTertiary,
                      ]
                        .filter(Boolean)
                        .map((color, idx) => (
                          <div
                            key={idx}
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: color ?? undefined }}
                          />
                        ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${
                        selectedPresetKey === preset.key
                          ? 'text-purple-200'
                          : 'text-zinc-200'
                      }`}>
                        {preset.label}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {preset.description}
                      </div>
                    </div>
                    {selectedPresetKey === preset.key && (
                      <span className="text-purple-400 text-xs font-medium flex-shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                </button>
              ))}

              <p className="text-xs text-zinc-600 pt-2">
                Selecting a preset sets all theme values. You can then customize
                individual colors and fonts in the other sections.
              </p>
            </div>
          )}

          {/* ── Colors Section ─────────────────────────── */}
          {activeSection === 'colors' && (
            <div className="space-y-8">
              <ColorGroup
                title="Brand Palette"
                fields={PALETTE_COLORS}
                values={colorValues}
                onChange={updateField}
              />
              <ColorGroup
                title="Text Colors"
                fields={TEXT_COLORS}
                values={colorValues}
                onChange={updateField}
              />
              <ColorGroup
                title="Call to Action"
                fields={CTA_COLORS}
                values={colorValues}
                onChange={updateField}
              />
            </div>
          )}

          {/* ── Typography Section ─────────────────────── */}
          {activeSection === 'typography' && (
            <div className="space-y-8">
              <FontSelector
                label="Display Font"
                description="Used for campaign titles and headings"
                value={theme.fontDisplayKey ?? null}
                onChange={(v) => updateField('fontDisplayKey', v)}
                variant="display"
              />
              <FontSelector
                label="Body Font"
                description="Used for descriptions and body text"
                value={theme.fontBodyKey ?? null}
                onChange={(v) => updateField('fontBodyKey', v)}
                variant="body"
              />
            </div>
          )}

          {/* ── Surfaces & Borders Section ─────────────── */}
          {activeSection === 'surfaces' && (
            <div className="space-y-8">
              {/* Background gradient */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Background Gradient
                </h3>
                <input
                  type="text"
                  value={theme.bgGradient ?? ''}
                  onChange={(e) => updateGradient(e.target.value)}
                  placeholder="linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-600/50 transition-colors placeholder:text-zinc-600"
                />
                {theme.bgGradient && (
                  <div
                    className="h-8 rounded-lg border border-zinc-800"
                    style={{ background: theme.bgGradient }}
                  />
                )}
              </div>

              <ColorGroup
                title="Surface & Border Colors"
                fields={SURFACE_COLORS}
                values={colorValues}
                onChange={updateField}
              />

              {/* Border tokens */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Border Treatment (Channel 2: Altitude)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                      Border Radius
                    </label>
                    <select
                      value={borderTokens.borderRadius ?? '8px'}
                      onChange={(e) => updateBorderToken('borderRadius', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="0px">Sharp (0px)</option>
                      <option value="4px">Subtle (4px)</option>
                      <option value="8px">Rounded (8px)</option>
                      <option value="12px">Soft (12px)</option>
                      <option value="16px">Pill (16px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                      Border Width
                    </label>
                    <select
                      value={borderTokens.borderWidth ?? '1px'}
                      onChange={(e) => updateBorderToken('borderWidth', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="0px">None (0px)</option>
                      <option value="1px">Thin (1px)</option>
                      <option value="2px">Medium (2px)</option>
                      <option value="3px">Thick (3px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                      Glow Radius
                    </label>
                    <select
                      value={borderTokens.glowRadius ?? '0px'}
                      onChange={(e) => updateBorderToken('glowRadius', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="0px">None</option>
                      <option value="4px">Subtle (4px)</option>
                      <option value="8px">Medium (8px)</option>
                      <option value="12px">Strong (12px)</option>
                      <option value="20px">Intense (20px)</option>
                    </select>
                  </div>
                  <div>
                    <ColorPickerField
                      label="Glow Color"
                      value={borderTokens.glowColor ?? null}
                      onChange={(v) => updateBorderToken('glowColor', v ?? 'transparent')}
                      cssVar="--cs-glow-color"
                      clearable
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Density Section ────────────────────────── */}
          {activeSection === 'density' && (
            <div className="space-y-6">
              <div className="space-y-2">
                {DENSITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateDensity(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                      densityTokens.contentDensity === opt.value
                        ? 'border-purple-600/60 bg-purple-950/30 text-purple-200'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{opt.description}</div>
                  </button>
                ))}
              </div>

              {/* Custom spacing (advanced) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Custom Spacing
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                      Card Padding
                    </label>
                    <select
                      value={densityTokens.cardPadding ?? '1.5rem'}
                      onChange={(e) => {
                        setTheme((prev) => ({
                          ...prev,
                          densityTokens: {
                            ...((prev.densityTokens as CampaignDensityTokens) ?? DEFAULT_DENSITY_TOKENS),
                            cardPadding: e.target.value,
                          },
                        }))
                        setHasUnsavedChanges(true)
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="0.75rem">Tight (0.75rem)</option>
                      <option value="1rem">Compact (1rem)</option>
                      <option value="1.5rem">Balanced (1.5rem)</option>
                      <option value="2rem">Spacious (2rem)</option>
                      <option value="2.5rem">Generous (2.5rem)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                      Section Spacing
                    </label>
                    <select
                      value={densityTokens.sectionSpacing ?? '1.5rem'}
                      onChange={(e) => {
                        setTheme((prev) => ({
                          ...prev,
                          densityTokens: {
                            ...((prev.densityTokens as CampaignDensityTokens) ?? DEFAULT_DENSITY_TOKENS),
                            sectionSpacing: e.target.value,
                          },
                        }))
                        setHasUnsavedChanges(true)
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="0.75rem">Tight (0.75rem)</option>
                      <option value="1rem">Compact (1rem)</option>
                      <option value="1.5rem">Balanced (1.5rem)</option>
                      <option value="2rem">Spacious (2rem)</option>
                      <option value="2.5rem">Generous (2.5rem)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isPending || !hasUnsavedChanges}
            onClick={handleSave}
            className="px-4 py-2.5 rounded-xl border border-purple-700/60 bg-purple-950/30 text-purple-100 text-sm hover:border-purple-500 hover:bg-purple-900/30 transition-colors disabled:opacity-50 font-medium"
          >
            {isPending ? 'Saving...' : 'Save Theme'}
          </button>

          {existingTheme && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/50 text-zinc-500 text-sm hover:text-zinc-300 hover:border-zinc-600 transition-colors disabled:opacity-50"
            >
              Reset to Default
            </button>
          )}

          {hasUnsavedChanges && (
            <span className="text-xs text-amber-400/70">Unsaved changes</span>
          )}
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`text-sm rounded-lg px-3 py-2 border ${
              feedback.type === 'success'
                ? 'text-emerald-300 bg-emerald-950/40 border-emerald-900/50'
                : 'text-red-400 bg-red-950/40 border-red-900/50'
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>

      {/* ─── Right: Live Preview (sticky) ────────────────────────── */}
      <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
        <CampaignThemePreview
          theme={theme}
          campaignName={campaignName}
          campaignDescription={campaignDescription ?? undefined}
        />

        {/* Quick links */}
        <div className="flex flex-wrap gap-2 text-xs">
          <a
            href={`/campaign/${encodeURIComponent(campaignSlug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            View campaign page
          </a>
          <span className="text-zinc-700">|</span>
          <a
            href={`/admin/campaign/${encodeURIComponent(campaignSlug)}/author`}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Author hub
          </a>
        </div>
      </div>
    </div>
  )
}
