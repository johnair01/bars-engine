'use client'

/**
 * CompletionOptionsList — Selectable CYOA completion options with selection state
 * management and visual feedback for chosen/unchosen items.
 *
 * This is a reusable selection component for the Alchemy Engine vertical slice.
 * It renders a list of options where:
 *   - Clicking an option selects it (persistent selection state)
 *   - Selected items show a distinct visual treatment (glow, border, check)
 *   - Unselected items show a muted treatment with hover feedback
 *   - Only one item can be selected at a time (radio-style)
 *   - Selection does NOT immediately advance — a separate confirm action is required
 *
 * Design follows the three-channel encoding system:
 *   Element → color (fire = cinnabar/orange for Challenger vertical slice)
 *   Altitude → border treatment (glow intensity)
 *   Stage → card density
 *
 * Non-AI first-class: works with GM-authored template bank content.
 * AI-generated completions use the same visual treatment.
 *
 * @see src/components/alchemy-engine/ReflectionPhaseStep.tsx — primary consumer
 * @see src/lib/ui/card-tokens.ts — ELEMENT_TOKENS for color values
 */

import { useState, useCallback, useId } from 'react'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single selectable completion option.
 *
 * Generic enough to be used across all alchemy engine phases,
 * but typed for the completion selection use case.
 */
export interface CompletionOption {
  /** Unique identifier for this option */
  id: string
  /** Display title */
  title: string
  /** Full content/body text */
  content: string
  /** Optional descriptive label (e.g., tone, framing, type) */
  label?: string
  /** Optional source provenance */
  source?: 'template' | 'ai'
  /** Optional metadata — passed through on selection, not rendered */
  meta?: Record<string, unknown>
}

/**
 * Selection state exposed by CompletionOptionsList.
 * Consumers can use this to track what's selected without
 * managing their own state.
 */
export interface CompletionSelectionState {
  /** Currently selected option, or null if nothing selected */
  selectedId: string | null
  /** The full selected option object, or null */
  selectedOption: CompletionOption | null
  /** Whether any option is currently selected */
  hasSelection: boolean
}

export interface CompletionOptionsListProps {
  /** The options to render */
  options: CompletionOption[]
  /** Callback when selection changes (option selected or deselected) */
  onSelectionChange?: (state: CompletionSelectionState) => void
  /** Callback when the confirm/submit action is triggered */
  onConfirm?: (option: CompletionOption) => void
  /** Element for color theming (defaults to 'fire' for Challenger) */
  element?: ElementKey
  /** Pre-selected option ID (controlled mode) */
  selectedId?: string | null
  /** Whether the list is disabled (e.g., during pending server action) */
  disabled?: boolean
  /** Whether to show the confirm button inline */
  showConfirmButton?: boolean
  /** Label for the confirm button */
  confirmLabel?: string
  /** Whether to allow deselection by clicking the selected item again */
  allowDeselect?: boolean
  /** Accessible label for the option group */
  groupLabel?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Visual states for option items */
const OPTION_STATES = {
  unselected: {
    ring: 'ring-0',
    scale: 'scale-100',
    opacity: 'opacity-100',
  },
  selected: {
    ring: 'ring-2',
    scale: 'scale-[1.01]',
    opacity: 'opacity-100',
  },
  dimmed: {
    ring: 'ring-0',
    scale: 'scale-100',
    opacity: 'opacity-60',
  },
} as const

// ---------------------------------------------------------------------------
// Subcomponent: Single Option Item
// ---------------------------------------------------------------------------

interface OptionItemProps {
  option: CompletionOption
  isSelected: boolean
  isDimmed: boolean
  isHovered: boolean
  element: ElementKey
  disabled: boolean
  onSelect: (option: CompletionOption) => void
  onHoverStart: (id: string) => void
  onHoverEnd: () => void
  optionIndex: number
  labelId: string
}

function OptionItem({
  option,
  isSelected,
  isDimmed,
  isHovered,
  element,
  disabled,
  onSelect,
  onHoverStart,
  onHoverEnd,
  optionIndex,
  labelId,
}: OptionItemProps) {
  const tokens = ELEMENT_TOKENS[element]

  // Determine visual state
  const visualState = isSelected
    ? OPTION_STATES.selected
    : isDimmed
    ? OPTION_STATES.dimmed
    : OPTION_STATES.unselected

  // Element-specific selected colors
  const selectedBorderClass = {
    fire: 'border-orange-400/80',
    water: 'border-blue-400/80',
    wood: 'border-green-400/80',
    metal: 'border-slate-400/80',
    earth: 'border-amber-400/80',
  }[element]

  const selectedRingClass = {
    fire: 'ring-orange-500/30',
    water: 'ring-blue-500/30',
    wood: 'ring-green-500/30',
    metal: 'ring-slate-500/30',
    earth: 'ring-amber-500/30',
  }[element]

  const selectedGlowClass = {
    fire: 'shadow-[0_0_12px_rgba(234,88,12,0.25)]',
    water: 'shadow-[0_0_12px_rgba(59,130,246,0.25)]',
    wood: 'shadow-[0_0_12px_rgba(34,197,94,0.25)]',
    metal: 'shadow-[0_0_12px_rgba(148,163,184,0.25)]',
    earth: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]',
  }[element]

  const selectedBgClass = {
    fire: 'bg-orange-950/60',
    water: 'bg-blue-950/60',
    wood: 'bg-green-950/60',
    metal: 'bg-slate-950/60',
    earth: 'bg-amber-950/60',
  }[element]

  const checkColor = {
    fire: 'text-orange-400',
    water: 'text-blue-400',
    wood: 'text-green-400',
    metal: 'text-slate-400',
    earth: 'text-amber-400',
  }[element]

  return (
    <button
      role="radio"
      aria-checked={isSelected}
      aria-labelledby={`${labelId}-title-${optionIndex}`}
      aria-describedby={`${labelId}-desc-${optionIndex}`}
      onClick={() => onSelect(option)}
      onMouseEnter={() => onHoverStart(option.id)}
      onMouseLeave={onHoverEnd}
      disabled={disabled}
      tabIndex={isSelected ? 0 : -1}
      className={`
        group relative text-left rounded-lg border transition-all duration-200
        ${isSelected
          ? `${selectedBorderClass} ${selectedBgClass} ${visualState.ring} ${selectedRingClass} ${selectedGlowClass} ${visualState.scale}`
          : `${tokens.border} ${tokens.bg} ${visualState.opacity}`
        }
        ${!isSelected && !isDimmed
          ? `hover:border-opacity-80 hover:bg-opacity-60 ${tokens.borderHover}`
          : ''
        }
        active:scale-[0.98]
        disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none
        p-4
        focus-visible:outline-none focus-visible:ring-2 ${selectedRingClass}
      `}
      data-testid={`completion-option-${option.id}`}
      data-selected={isSelected}
    >
      {/* Selection indicator + Title row */}
      <div className="flex items-start gap-3">
        {/* Radio circle / check indicator */}
        <div
          className={`
            shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center
            transition-all duration-200
            ${isSelected
              ? `${selectedBorderClass} ${selectedBgClass}`
              : `border-zinc-600/60 bg-zinc-900/40 group-hover:border-zinc-500/80`
            }
          `}
          aria-hidden="true"
        >
          {isSelected && (
            <svg
              className={`w-3 h-3 ${checkColor}`}
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title + label row */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4
              id={`${labelId}-title-${optionIndex}`}
              className={`
                text-sm font-semibold transition-colors duration-200
                ${isSelected
                  ? tokens.textAccent
                  : isDimmed
                  ? 'text-zinc-500'
                  : `text-zinc-300 group-hover:${tokens.textAccent.replace('text-', 'text-')}`
                }
              `}
            >
              {option.title}
            </h4>
            {option.label && (
              <span
                className={`
                  shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded capitalize
                  transition-colors duration-200
                  ${isSelected
                    ? `${tokens.badgeBg} ${tokens.textAccent}`
                    : 'bg-zinc-800/60 text-zinc-500'
                  }
                `}
              >
                {option.label}
              </span>
            )}
          </div>

          {/* Content preview */}
          <p
            id={`${labelId}-desc-${optionIndex}`}
            className={`
              text-xs leading-relaxed transition-colors duration-200
              ${isSelected
                ? 'text-zinc-300'
                : isDimmed
                ? 'text-zinc-600'
                : 'text-zinc-400'
              }
              ${isSelected ? '' : 'line-clamp-3'}
            `}
          >
            {option.content}
          </p>

          {/* Footer: source + status */}
          <div className="flex items-center justify-between mt-2">
            {option.source && (
              <span
                className={`
                  text-[10px] italic transition-colors duration-200
                  ${isSelected ? 'text-zinc-400' : 'text-zinc-600'}
                `}
              >
                {option.source === 'template' ? 'crafted reflection' : 'generated insight'}
              </span>
            )}
            <span
              className={`
                text-[10px] uppercase tracking-wider transition-all duration-200
                ${isSelected
                  ? `${checkColor} font-medium`
                  : isHovered
                  ? tokens.textAccent
                  : 'text-zinc-600'
                }
              `}
            >
              {isSelected ? 'selected' : 'select'}
            </span>
          </div>
        </div>
      </div>

      {/* Selection indicator bar (bottom edge) */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg
          transition-all duration-300
          ${isSelected
            ? `opacity-100 bg-gradient-to-r ${
                element === 'fire' ? 'from-orange-500 to-amber-500'
                : element === 'water' ? 'from-blue-500 to-cyan-500'
                : element === 'wood' ? 'from-green-500 to-emerald-500'
                : element === 'metal' ? 'from-slate-400 to-zinc-400'
                : 'from-amber-500 to-yellow-500'
              }`
            : isHovered
            ? `opacity-60 bg-gradient-to-r ${
                element === 'fire' ? 'from-orange-600 to-amber-600'
                : element === 'water' ? 'from-blue-600 to-cyan-600'
                : element === 'wood' ? 'from-green-600 to-emerald-600'
                : element === 'metal' ? 'from-slate-500 to-zinc-500'
                : 'from-amber-600 to-yellow-600'
              }`
            : 'opacity-0 bg-zinc-700'
          }
        `}
        aria-hidden="true"
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CompletionOptionsList({
  options,
  onSelectionChange,
  onConfirm,
  element = 'fire',
  selectedId: controlledSelectedId,
  disabled = false,
  showConfirmButton = true,
  confirmLabel = 'Confirm selection',
  allowDeselect = true,
  groupLabel = 'Completion options',
}: CompletionOptionsListProps) {
  const baseId = useId()
  const labelId = `completion-list-${baseId}`

  // Internal selection state (uncontrolled mode)
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Resolve controlled vs uncontrolled
  const isControlled = controlledSelectedId !== undefined
  const activeSelectedId = isControlled ? controlledSelectedId : internalSelectedId

  // Find the selected option object
  const selectedOption = activeSelectedId
    ? options.find(o => o.id === activeSelectedId) ?? null
    : null

  const hasSelection = selectedOption !== null

  // Build state object for callbacks
  const buildState = useCallback(
    (id: string | null): CompletionSelectionState => ({
      selectedId: id,
      selectedOption: id ? options.find(o => o.id === id) ?? null : null,
      hasSelection: id !== null && options.some(o => o.id === id),
    }),
    [options]
  )

  // Handle option selection
  const handleSelect = useCallback(
    (option: CompletionOption) => {
      if (disabled) return

      const newId =
        allowDeselect && activeSelectedId === option.id ? null : option.id

      if (!isControlled) {
        setInternalSelectedId(newId)
      }

      onSelectionChange?.(buildState(newId))
    },
    [disabled, allowDeselect, activeSelectedId, isControlled, onSelectionChange, buildState]
  )

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (selectedOption && onConfirm) {
      onConfirm(selectedOption)
    }
  }, [selectedOption, onConfirm])

  // Hover handlers
  const handleHoverStart = useCallback((id: string) => {
    setHoveredId(id)
  }, [])

  const handleHoverEnd = useCallback(() => {
    setHoveredId(null)
  }, [])

  // Keyboard navigation for radiogroup
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return

      const currentIndex = activeSelectedId
        ? options.findIndex(o => o.id === activeSelectedId)
        : -1

      let nextIndex: number | null = null

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault()
          nextIndex =
            currentIndex < options.length - 1 ? currentIndex + 1 : 0
          break
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault()
          nextIndex =
            currentIndex > 0 ? currentIndex - 1 : options.length - 1
          break
        case 'Enter':
        case ' ':
          if (hasSelection) {
            e.preventDefault()
            handleConfirm()
          }
          break
        default:
          return
      }

      if (nextIndex !== null) {
        const nextOption = options[nextIndex]
        if (nextOption) {
          handleSelect(nextOption)
          // Focus the new radio button
          const nextEl = document.querySelector(
            `[data-testid="completion-option-${nextOption.id}"]`
          ) as HTMLElement | null
          nextEl?.focus()
        }
      }
    },
    [disabled, activeSelectedId, options, hasSelection, handleConfirm, handleSelect]
  )

  const tokens = ELEMENT_TOKENS[element]

  if (options.length === 0) {
    return (
      <div
        className="text-xs text-zinc-500 italic py-4 text-center"
        data-testid="completion-options-empty"
      >
        No completion options available.
      </div>
    )
  }

  return (
    <div className="space-y-3" data-testid="completion-options-list">
      {/* Options as radiogroup */}
      <div
        role="radiogroup"
        aria-label={groupLabel}
        onKeyDown={handleKeyDown}
        className="grid grid-cols-1 gap-3"
      >
        {options.map((option, index) => (
          <OptionItem
            key={option.id}
            option={option}
            isSelected={activeSelectedId === option.id}
            isDimmed={hasSelection && activeSelectedId !== option.id}
            isHovered={hoveredId === option.id}
            element={element}
            disabled={disabled}
            onSelect={handleSelect}
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
            optionIndex={index}
            labelId={labelId}
          />
        ))}
      </div>

      {/* Confirm button (shown when selection exists and showConfirmButton is true) */}
      {showConfirmButton && (
        <div
          className={`
            transition-all duration-300 ease-out
            ${hasSelection
              ? 'opacity-100 translate-y-0 max-h-20'
              : 'opacity-0 translate-y-2 max-h-0 overflow-hidden pointer-events-none'
            }
          `}
        >
          <button
            onClick={handleConfirm}
            disabled={disabled || !hasSelection}
            className={`
              w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              bg-gradient-to-r
              ${element === 'fire' ? 'from-orange-700/80 to-amber-700/80 hover:from-orange-600/80 hover:to-amber-600/80'
                : element === 'water' ? 'from-blue-700/80 to-cyan-700/80 hover:from-blue-600/80 hover:to-cyan-600/80'
                : element === 'wood' ? 'from-green-700/80 to-emerald-700/80 hover:from-green-600/80 hover:to-emerald-600/80'
                : element === 'metal' ? 'from-slate-600/80 to-zinc-600/80 hover:from-slate-500/80 hover:to-zinc-500/80'
                : 'from-amber-700/80 to-yellow-700/80 hover:from-amber-600/80 hover:to-yellow-600/80'
              }
              border ${tokens.border}
              ${tokens.textAccent}
              active:scale-[0.98]
              disabled:opacity-40 disabled:pointer-events-none
            `}
            data-testid="completion-options-confirm"
          >
            {confirmLabel} &rarr;
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hook: useCompletionSelection
// ---------------------------------------------------------------------------

/**
 * Standalone hook for managing completion selection state.
 * Use this when you need selection state outside the CompletionOptionsList,
 * e.g., in a parent component that controls multiple lists.
 */
export function useCompletionSelection(options: CompletionOption[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedOption = selectedId
    ? options.find(o => o.id === selectedId) ?? null
    : null

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id)
    },
    []
  )

  const toggle = useCallback(
    (id: string) => {
      setSelectedId(prev => (prev === id ? null : id))
    },
    []
  )

  const clear = useCallback(() => {
    setSelectedId(null)
  }, [])

  return {
    selectedId,
    selectedOption,
    hasSelection: selectedOption !== null,
    select,
    toggle,
    clear,
  } as const
}
