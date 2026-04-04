'use client'

/**
 * QuestTemplateSelector — Browsable/filterable quest template grid with preview panel
 *
 * Used in the L1 campaign creation wizard. Steward+ users browse available quest
 * templates, filter by category, search by name, preview details, and select
 * templates to add to their campaign's quest lineup.
 *
 * Pattern: template+customize (configuration tool, not authoring tool)
 * Design: follows project conventions — dark background, purple accents, zinc borders
 */

import { useState, useMemo, useCallback } from 'react'
import {
  ALL_QUEST_TEMPLATE_SEEDS,
  QUEST_TEMPLATE_CATEGORIES,
  type QuestTemplateSeedData,
  type QuestTemplateCategory,
} from '@/lib/quest-template-seeds'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SelectedTemplate = {
  template: QuestTemplateSeedData
  /** Copy overrides the steward has customized */
  copyOverrides: Record<string, unknown>
  /** Settings overrides */
  settingsOverrides: Record<string, unknown>
}

type QuestTemplateSelectorProps = {
  /** Already-selected templates (for the campaign being built) */
  selectedTemplates: SelectedTemplate[]
  /** Called when templates change (add/remove/update) */
  onTemplatesChange: (templates: SelectedTemplate[]) => void
  /** Maximum templates allowed (0 = unlimited) */
  maxTemplates?: number
}

// ---------------------------------------------------------------------------
// Category icons (text-based, accessible)
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<string, string> = {
  onboarding: '\u{1F44B}',    // wave
  fundraising: '\u{1F4B0}',   // money bag
  awareness: '\u{1F4E2}',     // loudspeaker
  direct_action: '\u{26A1}',  // lightning
  community: '\u{1F91D}',     // handshake
  custom: '\u{1F527}',        // wrench
}

const MOVE_TYPE_LABELS: Record<string, string> = {
  wakeUp: 'Wake Up',
  showUp: 'Show Up',
  growUp: 'Grow Up',
  cleanUp: 'Clean Up',
}

// ---------------------------------------------------------------------------
// Styling constants (matches CampaignCreateWizard conventions)
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-600/50 transition-colors placeholder:text-zinc-600'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CategoryFilter({
  selected,
  onSelect,
}: {
  selected: QuestTemplateCategory | 'all'
  onSelect: (cat: QuestTemplateCategory | 'all') => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onSelect('all')}
        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
          selected === 'all'
            ? 'border-purple-600/60 bg-purple-950/30 text-purple-200'
            : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
        }`}
      >
        All
      </button>
      {QUEST_TEMPLATE_CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          type="button"
          onClick={() => onSelect(cat.key)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            selected === cat.key
              ? 'border-purple-600/60 bg-purple-950/30 text-purple-200'
              : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
          }`}
        >
          <span className="mr-1">{CATEGORY_ICONS[cat.key] ?? ''}</span>
          {cat.label}
        </button>
      ))}
    </div>
  )
}

function TemplateCard({
  template,
  isSelected,
  isPreview,
  onSelect,
  onPreview,
}: {
  template: QuestTemplateSeedData
  isSelected: boolean
  isPreview: boolean
  onSelect: () => void
  onPreview: () => void
}) {
  const settings = template.defaultSettings as Record<string, unknown>
  const moveType = settings.moveType as string | undefined
  const reward = settings.reward as number | undefined
  const estimatedMinutes = settings.estimatedMinutes as number | undefined

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPreview}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPreview()
        }
      }}
      className={`relative rounded-xl border p-4 cursor-pointer transition-all group ${
        isPreview
          ? 'border-purple-500/70 bg-purple-950/20 ring-1 ring-purple-500/30'
          : isSelected
            ? 'border-emerald-600/50 bg-emerald-950/10'
            : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900/80'
      }`}
      aria-label={`Quest template: ${template.name}`}
      aria-selected={isPreview}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-900/60 border border-emerald-600/50 flex items-center justify-center">
          <span className="text-emerald-300 text-xs font-bold">{'\u2713'}</span>
        </div>
      )}

      {/* Category icon + name */}
      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg" aria-hidden="true">
          {CATEGORY_ICONS[template.category] ?? ''}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-zinc-100 leading-tight truncate">
            {template.name}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5 capitalize">
            {template.category.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      {/* Description preview */}
      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-3">
        {template.description}
      </p>

      {/* Meta pills */}
      <div className="flex flex-wrap gap-1.5">
        {moveType && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300">
            {MOVE_TYPE_LABELS[moveType] ?? moveType}
          </span>
        )}
        {reward !== undefined && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300">
            +{reward} XP
          </span>
        )}
        {estimatedMinutes !== undefined && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300">
            ~{estimatedMinutes}m
          </span>
        )}
      </div>

      {/* Quick add button (visible on hover or focus) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        className={`mt-3 w-full px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          isSelected
            ? 'border-red-800/50 bg-red-950/20 text-red-300 hover:border-red-600/60 hover:bg-red-950/30'
            : 'border-purple-800/50 bg-purple-950/20 text-purple-300 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:border-purple-600/60 hover:bg-purple-950/30'
        }`}
        aria-label={isSelected ? `Remove ${template.name}` : `Add ${template.name}`}
      >
        {isSelected ? 'Remove' : 'Add to campaign'}
      </button>
    </div>
  )
}

function PreviewPanel({
  template,
  isSelected,
  onToggle,
}: {
  template: QuestTemplateSeedData
  isSelected: boolean
  onToggle: () => void
}) {
  const settings = template.defaultSettings as Record<string, unknown>
  const copyTemplate = template.copyTemplate as Record<string, unknown>
  const steps = (copyTemplate.steps ?? []) as Array<Record<string, unknown>>

  return (
    <div className="rounded-xl border border-purple-800/50 bg-zinc-950/80 p-5 space-y-5 sticky top-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl" aria-hidden="true">
            {CATEGORY_ICONS[template.category] ?? ''}
          </span>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {template.name}
          </h3>
        </div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest">
          {template.category.replace(/_/g, ' ')}
        </p>
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-300 leading-relaxed">
        {template.description}
      </p>

      {/* Copy template preview */}
      {typeof copyTemplate.title === 'string' && copyTemplate.title && (
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            Default Copy
          </p>
          <div>
            <span className="text-xs text-zinc-500">Title</span>
            <p className="text-sm text-zinc-200 font-medium">
              {String(copyTemplate.title)}
            </p>
          </div>
          {typeof copyTemplate.description === 'string' && copyTemplate.description && (
            <div>
              <span className="text-xs text-zinc-500">Description</span>
              <p className="text-sm text-zinc-400">
                {String(copyTemplate.description)}
              </p>
            </div>
          )}
          {typeof copyTemplate.successCondition === 'string' && copyTemplate.successCondition && (
            <div>
              <span className="text-xs text-zinc-500">Success Condition</span>
              <p className="text-sm text-zinc-400">
                {String(copyTemplate.successCondition)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Steps preview */}
      {steps.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            Quest Steps ({steps.length})
          </p>
          <div className="space-y-1.5">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50"
              >
                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-300 truncate">
                    {step.label as string}
                  </p>
                  <p className="text-[10px] text-zinc-600 capitalize">
                    {step.type as string}
                    {step.inputType ? ` (${step.inputType})` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings summary */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Default Settings
        </p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="text-xs">
              <span className="text-zinc-500 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <p className="text-zinc-300 font-medium">
                {typeof value === 'boolean'
                  ? value ? 'Yes' : 'No'
                  : String(value).replace(/_/g, ' ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Remove button */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
          isSelected
            ? 'border-red-800/50 bg-red-950/20 text-red-300 hover:border-red-600/60'
            : 'border-purple-700/60 bg-purple-950/30 text-purple-100 hover:border-purple-500'
        }`}
      >
        {isSelected ? 'Remove from campaign' : 'Add to campaign'}
      </button>
    </div>
  )
}

function SelectedTemplatesSummary({
  templates,
  onRemove,
}: {
  templates: SelectedTemplate[]
  onRemove: (index: number) => void
}) {
  if (templates.length === 0) return null

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Selected Quests ({templates.length})
        </p>
      </div>
      <div className="space-y-1.5">
        {templates.map((sel, idx) => (
          <div
            key={`${sel.template.key}-${idx}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-800/40"
          >
            <span className="w-5 h-5 rounded-full bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center text-[10px] text-emerald-300 font-bold shrink-0">
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-zinc-200 truncate font-medium">
                {sel.template.name}
              </p>
              <p className="text-[10px] text-zinc-500 capitalize">
                {sel.template.category.replace(/_/g, ' ')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="text-zinc-600 hover:text-red-400 transition-colors text-xs px-1"
              aria-label={`Remove ${sel.template.name}`}
            >
              {'\u2715'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function QuestTemplateSelector({
  selectedTemplates,
  onTemplatesChange,
  maxTemplates = 0,
}: QuestTemplateSelectorProps) {
  const [categoryFilter, setCategoryFilter] = useState<QuestTemplateCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewKey, setPreviewKey] = useState<string | null>(null)

  // --- Filtered templates ---
  const filteredTemplates = useMemo(() => {
    let templates = ALL_QUEST_TEMPLATE_SEEDS

    if (categoryFilter !== 'all') {
      templates = templates.filter((t) => t.category === categoryFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.key.toLowerCase().includes(query),
      )
    }

    return templates
  }, [categoryFilter, searchQuery])

  // --- Preview template ---
  const previewTemplate = useMemo(
    () => ALL_QUEST_TEMPLATE_SEEDS.find((t) => t.key === previewKey) ?? null,
    [previewKey],
  )

  // --- Selection helpers ---
  const selectedKeys = useMemo(
    () => new Set(selectedTemplates.map((s) => s.template.key)),
    [selectedTemplates],
  )

  const isAtLimit = maxTemplates > 0 && selectedTemplates.length >= maxTemplates

  const toggleTemplate = useCallback(
    (template: QuestTemplateSeedData) => {
      if (selectedKeys.has(template.key)) {
        // Remove
        onTemplatesChange(
          selectedTemplates.filter((s) => s.template.key !== template.key),
        )
      } else if (!isAtLimit) {
        // Add with defaults
        onTemplatesChange([
          ...selectedTemplates,
          {
            template,
            copyOverrides: {},
            settingsOverrides: {},
          },
        ])
      }
    },
    [selectedKeys, selectedTemplates, onTemplatesChange, isAtLimit],
  )

  const removeByIndex = useCallback(
    (index: number) => {
      onTemplatesChange(selectedTemplates.filter((_, i) => i !== index))
    },
    [selectedTemplates, onTemplatesChange],
  )

  return (
    <div className="space-y-5">
      {/* Search + filter bar */}
      <div className="space-y-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search quest templates..."
          className={INPUT_CLASS}
          aria-label="Search quest templates"
        />
        <CategoryFilter selected={categoryFilter} onSelect={setCategoryFilter} />
      </div>

      {/* Limit warning */}
      {isAtLimit && (
        <p className="text-xs text-amber-300 bg-amber-950/20 border border-amber-800/40 rounded-lg px-3 py-2">
          Maximum of {maxTemplates} quests reached. Remove one to add another.
        </p>
      )}

      {/* Selected summary */}
      <SelectedTemplatesSummary
        templates={selectedTemplates}
        onRemove={removeByIndex}
      />

      {/* Grid + Preview layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Template grid */}
        <div className={`${previewTemplate ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-3`}>
          {filteredTemplates.length === 0 ? (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-8 text-center">
              <p className="text-sm text-zinc-500">
                No templates match your search.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('all')
                }}
                className="mt-2 text-xs text-purple-400 hover:text-purple-300"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className={`grid gap-3 ${
              previewTemplate
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.key}
                  template={template}
                  isSelected={selectedKeys.has(template.key)}
                  isPreview={previewKey === template.key}
                  onSelect={() => toggleTemplate(template)}
                  onPreview={() =>
                    setPreviewKey(
                      previewKey === template.key ? null : template.key,
                    )
                  }
                />
              ))}
            </div>
          )}

          {/* Result count */}
          <p className="text-[10px] text-zinc-600 tabular-nums">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            {categoryFilter !== 'all' && (
              <> in {categoryFilter.replace(/_/g, ' ')}</>
            )}
          </p>
        </div>

        {/* Preview panel */}
        {previewTemplate && (
          <div className="lg:col-span-1">
            <PreviewPanel
              template={previewTemplate}
              isSelected={selectedKeys.has(previewTemplate.key)}
              onToggle={() => toggleTemplate(previewTemplate)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
