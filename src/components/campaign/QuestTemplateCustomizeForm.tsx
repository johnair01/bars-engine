'use client'

/**
 * QuestTemplateCustomizeForm — Copy/settings customization for selected quest templates
 *
 * After selecting templates in QuestTemplateSelector, the steward can customize
 * the copy (title, description, success condition) and settings (reward, estimated
 * time) for each selected template before finalizing.
 *
 * Pattern: template+customize — configuration tool, not authoring tool.
 * Stewards adjust predefined templates; they don't author from scratch (except custom).
 */

import { useState, useCallback } from 'react'
import type { SelectedTemplate } from './QuestTemplateSelector'
import {
  QUEST_TEMPLATE_CATEGORIES,
  type QuestTemplateSeedData,
} from '@/lib/quest-template-seeds'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type QuestTemplateCustomizeFormProps = {
  selectedTemplates: SelectedTemplate[]
  onTemplatesChange: (templates: SelectedTemplate[]) => void
  /** Campaign name for placeholder substitution preview */
  campaignName?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-600/50 transition-colors placeholder:text-zinc-600'

const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`

const MOVE_TYPE_OPTIONS = [
  { value: 'wakeUp', label: 'Wake Up' },
  { value: 'showUp', label: 'Show Up' },
  { value: 'growUp', label: 'Grow Up' },
  { value: 'cleanUp', label: 'Clean Up' },
]

const CATEGORY_ICONS: Record<string, string> = {
  onboarding: '\u{1F44B}',
  fundraising: '\u{1F4B0}',
  awareness: '\u{1F4E2}',
  direct_action: '\u{26A1}',
  community: '\u{1F91D}',
  custom: '\u{1F527}',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolvePlaceholders(text: string, campaignName: string): string {
  return text
    .replace(/\{campaignName\}/g, campaignName || '(Your Campaign)')
    .replace(/\{taskTitle\}/g, '(Task Title)')
    .replace(/\{taskDescription\}/g, '(Task Description)')
}

function getEffectiveValue(
  template: QuestTemplateSeedData,
  overrides: Record<string, unknown>,
  settingsOverrides: Record<string, unknown>,
  field: 'title' | 'description' | 'successCondition',
): string {
  const copyOverrideValue = overrides[field]
  if (typeof copyOverrideValue === 'string' && copyOverrideValue.trim()) {
    return copyOverrideValue
  }
  const copyTemplate = template.copyTemplate as Record<string, unknown>
  return (copyTemplate[field] as string) ?? ''
}

function getEffectiveSetting(
  template: QuestTemplateSeedData,
  settingsOverrides: Record<string, unknown>,
  field: string,
): unknown {
  if (field in settingsOverrides) {
    return settingsOverrides[field]
  }
  const defaults = template.defaultSettings as Record<string, unknown>
  return defaults[field]
}

// ---------------------------------------------------------------------------
// Single template customization card
// ---------------------------------------------------------------------------

function TemplateCustomizeCard({
  index,
  selected,
  campaignName,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  index: number
  selected: SelectedTemplate
  campaignName: string
  onUpdate: (updated: SelectedTemplate) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const { template, copyOverrides, settingsOverrides } = selected
  const [isExpanded, setIsExpanded] = useState(false)

  const copyTemplate = template.copyTemplate as Record<string, unknown>
  const steps = (copyTemplate.steps ?? []) as Array<Record<string, unknown>>

  const updateCopyOverride = useCallback(
    (field: string, value: string) => {
      const defaultValue = (template.copyTemplate as Record<string, unknown>)[field] as string
      const newOverrides = { ...copyOverrides }

      // If the value matches the default, remove the override
      if (value.trim() === '' || value === defaultValue) {
        delete newOverrides[field]
      } else {
        newOverrides[field] = value
      }

      onUpdate({ ...selected, copyOverrides: newOverrides })
    },
    [copyOverrides, selected, template.copyTemplate, onUpdate],
  )

  const updateSettingOverride = useCallback(
    (field: string, value: unknown) => {
      const defaultValue = (template.defaultSettings as Record<string, unknown>)[field]
      const newOverrides = { ...settingsOverrides }

      if (value === defaultValue) {
        delete newOverrides[field]
      } else {
        newOverrides[field] = value
      }

      onUpdate({ ...selected, settingsOverrides: newOverrides })
    },
    [settingsOverrides, selected, template.defaultSettings, onUpdate],
  )

  const effectiveTitle = getEffectiveValue(template, copyOverrides, settingsOverrides, 'title')
  const effectiveDescription = getEffectiveValue(template, copyOverrides, settingsOverrides, 'description')
  const effectiveReward = getEffectiveSetting(template, settingsOverrides, 'reward') as number
  const effectiveMoveType = getEffectiveSetting(template, settingsOverrides, 'moveType') as string
  const effectiveMinutes = getEffectiveSetting(template, settingsOverrides, 'estimatedMinutes') as number

  const hasOverrides = Object.keys(copyOverrides).length > 0 || Object.keys(settingsOverrides).length > 0

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
      {/* Collapsed header */}
      <div className="flex items-center gap-3 p-4">
        {/* Order number */}
        <span className="w-7 h-7 rounded-full bg-purple-900/40 border border-purple-700/40 flex items-center justify-center text-xs text-purple-200 font-bold shrink-0">
          {index + 1}
        </span>

        {/* Template info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm" aria-hidden="true">
              {CATEGORY_ICONS[template.category] ?? ''}
            </span>
            <h4 className="text-sm font-medium text-zinc-100 truncate">
              {resolvePlaceholders(effectiveTitle, campaignName) || template.name}
            </h4>
            {hasOverrides && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-900/40 text-purple-300 border border-purple-700/30">
                customized
              </span>
            )}
          </div>
          <p className="text-[10px] text-zinc-500 capitalize mt-0.5">
            {template.category.replace(/_/g, ' ')}
            {effectiveMoveType && ` \u00B7 ${effectiveMoveType.replace(/([A-Z])/g, ' $1').trim()}`}
            {effectiveReward !== undefined && ` \u00B7 +${effectiveReward} XP`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Move up"
          >
            {'\u2191'}
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Move down"
          >
            {'\u2193'}
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? '\u25B2' : '\u25BC'}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded text-zinc-600 hover:text-red-400 transition-colors"
            aria-label={`Remove ${template.name}`}
          >
            {'\u2715'}
          </button>
        </div>
      </div>

      {/* Expanded customization form */}
      {isExpanded && (
        <div className="border-t border-zinc-800/50 p-4 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-purple-400/80 mb-2">
            Customize Copy
          </p>

          {/* Title override */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
              Quest Title
            </label>
            <input
              type="text"
              value={(copyOverrides.title as string) ?? ''}
              onChange={(e) => updateCopyOverride('title', e.target.value)}
              placeholder={resolvePlaceholders(
                (copyTemplate.title as string) ?? '',
                campaignName,
              )}
              className={INPUT_CLASS}
            />
            {effectiveTitle && (
              <p className="text-[10px] text-zinc-600 mt-1">
                Preview: {resolvePlaceholders(effectiveTitle, campaignName)}
              </p>
            )}
          </div>

          {/* Description override */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
              Quest Description
            </label>
            <textarea
              value={(copyOverrides.description as string) ?? ''}
              onChange={(e) => updateCopyOverride('description', e.target.value)}
              placeholder={resolvePlaceholders(
                (copyTemplate.description as string) ?? '',
                campaignName,
              )}
              rows={3}
              className={TEXTAREA_CLASS}
            />
          </div>

          {/* Success condition override */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
              Success Condition
            </label>
            <input
              type="text"
              value={(copyOverrides.successCondition as string) ?? ''}
              onChange={(e) => updateCopyOverride('successCondition', e.target.value)}
              placeholder={(copyTemplate.successCondition as string) ?? 'Define what completion looks like'}
              className={INPUT_CLASS}
            />
          </div>

          {/* Steps preview (read-only — template structure, not editable) */}
          {steps.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                Quest Steps
                <span className="text-zinc-600 font-normal ml-1">(from template)</span>
              </p>
              <div className="space-y-1">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-950/60 border border-zinc-800/30"
                  >
                    <span className="text-[10px] text-zinc-600 font-mono w-4">
                      {idx + 1}.
                    </span>
                    <span className="text-xs text-zinc-400">
                      {step.label as string}
                    </span>
                    <span className="text-[10px] text-zinc-600 ml-auto capitalize">
                      {step.type as string}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <hr className="border-zinc-800/30" />

          <p className="text-[10px] uppercase tracking-widest text-purple-400/80 mb-2">
            Customize Settings
          </p>

          {/* Settings grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Move type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                Move Type
              </label>
              <select
                value={effectiveMoveType ?? ''}
                onChange={(e) => updateSettingOverride('moveType', e.target.value)}
                className={INPUT_CLASS}
              >
                {MOVE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reward */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                Reward (XP)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={effectiveReward ?? 1}
                onChange={(e) =>
                  updateSettingOverride('reward', parseInt(e.target.value, 10) || 0)
                }
                className={INPUT_CLASS}
              />
            </div>

            {/* Estimated time */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                Est. Minutes
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={effectiveMinutes ?? 15}
                onChange={(e) =>
                  updateSettingOverride(
                    'estimatedMinutes',
                    parseInt(e.target.value, 10) || 5,
                  )
                }
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* Reset overrides */}
          {hasOverrides && (
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  ...selected,
                  copyOverrides: {},
                  settingsOverrides: {},
                })
              }
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Reset to defaults
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function QuestTemplateCustomizeForm({
  selectedTemplates,
  onTemplatesChange,
  campaignName = '',
}: QuestTemplateCustomizeFormProps) {
  const updateTemplate = useCallback(
    (index: number, updated: SelectedTemplate) => {
      const next = [...selectedTemplates]
      next[index] = updated
      onTemplatesChange(next)
    },
    [selectedTemplates, onTemplatesChange],
  )

  const removeTemplate = useCallback(
    (index: number) => {
      onTemplatesChange(selectedTemplates.filter((_, i) => i !== index))
    },
    [selectedTemplates, onTemplatesChange],
  )

  const moveTemplate = useCallback(
    (fromIndex: number, direction: 'up' | 'down') => {
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
      if (toIndex < 0 || toIndex >= selectedTemplates.length) return

      const next = [...selectedTemplates]
      const temp = next[fromIndex]
      next[fromIndex] = next[toIndex]
      next[toIndex] = temp
      onTemplatesChange(next)
    },
    [selectedTemplates, onTemplatesChange],
  )

  if (selectedTemplates.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-8 text-center">
        <p className="text-sm text-zinc-500">
          No quests selected yet. Go back to add quest templates.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          {selectedTemplates.length} quest{selectedTemplates.length !== 1 ? 's' : ''} selected
          {' \u2014 '}expand to customize copy and settings
        </p>
      </div>

      <div className="space-y-3">
        {selectedTemplates.map((sel, idx) => (
          <TemplateCustomizeCard
            key={`${sel.template.key}-${idx}`}
            index={idx}
            selected={sel}
            campaignName={campaignName}
            onUpdate={(updated) => updateTemplate(idx, updated)}
            onRemove={() => removeTemplate(idx)}
            onMoveUp={() => moveTemplate(idx, 'up')}
            onMoveDown={() => moveTemplate(idx, 'down')}
            isFirst={idx === 0}
            isLast={idx === selectedTemplates.length - 1}
          />
        ))}
      </div>

      {/* Quick summary */}
      <div className="rounded-lg border border-zinc-800/40 bg-zinc-950/40 p-3 text-xs text-zinc-500">
        <span className="font-medium text-zinc-400">Tip:</span> Quest titles
        support <code className="text-purple-400/80">{'{campaignName}'}</code>{' '}
        placeholders that auto-fill with your campaign name.
      </div>
    </div>
  )
}
