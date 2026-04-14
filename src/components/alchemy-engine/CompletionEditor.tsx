'use client'

/**
 * CompletionEditor — Inline edit/customize for a selected CYOA completion.
 *
 * When a player selects a completion option, they can optionally customize it
 * before sealing it as their Reflection BAR (= epiphany artifact).
 *
 * Features:
 *   - Pre-filled with the selected completion's content
 *   - Full text editing with character count
 *   - Save edits (applies customization, marks as customized)
 *   - Revert to original (restores template text, clears customized flag)
 *   - Visual diff indicator when content has been modified
 *   - Fire element theming consistent with Challenger vertical slice
 *
 * Design principles:
 *   - Non-AI first-class: editing works on GM-authored template content
 *   - Behavior over self-report: player actively shapes their epiphany
 *   - The edited content IS the BAR content — no separate "original" stored
 *
 * @see src/components/alchemy-engine/ReflectionPhaseStep.tsx — parent consumer
 * @see src/components/alchemy-engine/CompletionOptionsList.tsx — selection step
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** State produced by the editor, consumed by ReflectionPhaseStep. */
export interface CompletionEditState {
  /** The current content (may be edited or original) */
  content: string
  /** The original, unmodified content from the template */
  originalContent: string
  /** Whether the player has customized the content */
  isCustomized: boolean
  /** Whether the content meets minimum length requirements */
  isValid: boolean
}

export interface CompletionEditorProps {
  /** The original completion title */
  title: string
  /** The original completion content to edit */
  originalContent: string
  /** Optional source label (template or ai) */
  source?: 'template' | 'ai'
  /** Optional tone label */
  tone?: string
  /** Element for color theming (defaults to 'fire' for Challenger) */
  element?: ElementKey
  /** Minimum content length for validation */
  minLength?: number
  /** Whether the editor is disabled (e.g., during pending action) */
  disabled?: boolean
  /** Callback when the edit state changes (content, customization status) */
  onEditStateChange?: (state: CompletionEditState) => void
  /** Callback when the player confirms the edited content */
  onConfirm?: (state: CompletionEditState) => void
  /** Callback to cancel editing and return to selection */
  onCancel?: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MIN_LENGTH = 20

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CompletionEditor({
  title,
  originalContent,
  source,
  tone,
  element = 'fire',
  minLength = DEFAULT_MIN_LENGTH,
  disabled = false,
  onEditStateChange,
  onConfirm,
  onCancel,
}: CompletionEditorProps) {
  const tokens = ELEMENT_TOKENS[element]

  // ── State ──────────────────────────────────────────────────────────────────
  const [editedContent, setEditedContent] = useState(originalContent)
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Derived state ──────────────────────────────────────────────────────────
  const isCustomized = editedContent.trim() !== originalContent.trim()
  const isValid = editedContent.trim().length >= minLength
  const charCount = editedContent.trim().length
  const charDiff = charCount - originalContent.trim().length

  // Build edit state object
  const buildEditState = useCallback(
    (content: string): CompletionEditState => ({
      content: content.trim(),
      originalContent,
      isCustomized: content.trim() !== originalContent.trim(),
      isValid: content.trim().length >= minLength,
    }),
    [originalContent, minLength]
  )

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStartEditing = useCallback(() => {
    setIsEditing(true)
    // Focus textarea on next tick
    setTimeout(() => {
      textareaRef.current?.focus()
      // Place cursor at end
      const len = textareaRef.current?.value.length ?? 0
      textareaRef.current?.setSelectionRange(len, len)
    }, 0)
  }, [])

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value
      setEditedContent(newContent)
      onEditStateChange?.(buildEditState(newContent))
    },
    [onEditStateChange, buildEditState]
  )

  const handleSave = useCallback(() => {
    if (!isValid) return
    setIsEditing(false)
    onEditStateChange?.(buildEditState(editedContent))
  }, [isValid, editedContent, onEditStateChange, buildEditState])

  const handleRevert = useCallback(() => {
    setEditedContent(originalContent)
    setIsEditing(false)
    onEditStateChange?.(buildEditState(originalContent))
  }, [originalContent, onEditStateChange, buildEditState])

  const handleConfirm = useCallback(() => {
    if (!isValid) return
    onConfirm?.(buildEditState(editedContent))
  }, [isValid, editedContent, onConfirm, buildEditState])

  // Handle Escape key to cancel editing
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && isEditing) {
        e.preventDefault()
        // If content was changed, just exit edit mode (keep changes)
        setIsEditing(false)
      }
    },
    [isEditing]
  )

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      const ta = textareaRef.current
      ta.style.height = 'auto'
      ta.style.height = `${ta.scrollHeight}px`
    }
  }, [editedContent, isEditing])

  // ── Element-specific colors ────────────────────────────────────────────────
  const accentBorder = {
    fire: 'border-orange-500/60',
    water: 'border-blue-500/60',
    wood: 'border-green-500/60',
    metal: 'border-slate-500/60',
    earth: 'border-amber-500/60',
  }[element]

  const accentBg = {
    fire: 'bg-orange-950/30',
    water: 'bg-blue-950/30',
    wood: 'bg-green-950/30',
    metal: 'bg-slate-950/30',
    earth: 'bg-amber-950/30',
  }[element]

  const editingRing = {
    fire: 'ring-orange-500/30 focus:ring-orange-400/40',
    water: 'ring-blue-500/30 focus:ring-blue-400/40',
    wood: 'ring-green-500/30 focus:ring-green-400/40',
    metal: 'ring-slate-500/30 focus:ring-slate-400/40',
    earth: 'ring-amber-500/30 focus:ring-amber-400/40',
  }[element]

  const customizedBadge = {
    fire: 'bg-orange-800/60 text-orange-300',
    water: 'bg-blue-800/60 text-blue-300',
    wood: 'bg-green-800/60 text-green-300',
    metal: 'bg-slate-800/60 text-slate-300',
    earth: 'bg-amber-800/60 text-amber-300',
  }[element]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className={`
        rounded-lg border transition-all duration-200
        ${isEditing ? `${accentBorder} ${accentBg}` : `${tokens.border} ${tokens.bg}`}
        ${isEditing ? 'ring-1 ' + editingRing : ''}
        p-4 space-y-3
      `}
      data-testid="completion-editor"
      data-editing={isEditing}
      data-customized={isCustomized}
    >
      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${tokens.textAccent}`}>
            {title}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            {tone && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded capitalize ${tokens.badgeBg} ${tokens.textAccent}`}>
                {tone}
              </span>
            )}
            {source && (
              <span className="text-[10px] italic text-zinc-500">
                {source === 'template' ? 'crafted reflection' : 'generated insight'}
              </span>
            )}
            {isCustomized && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${customizedBadge}`}>
                customized
              </span>
            )}
          </div>
        </div>

        {/* Edit / Customize toggle button */}
        {!isEditing && !disabled && (
          <button
            onClick={handleStartEditing}
            className={`
              shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-md
              border transition-all duration-200
              ${tokens.border} ${accentBg}
              ${tokens.textAccent} hover:opacity-90
              active:scale-[0.97]
            `}
            aria-label="Customize this reflection"
            data-testid="completion-editor-edit-btn"
          >
            Customize
          </button>
        )}
      </div>

      {/* ── Content area ──────────────────────────────────────────────────── */}
      {isEditing ? (
        <div className="space-y-2" onKeyDown={handleKeyDown}>
          <textarea
            ref={textareaRef}
            value={editedContent}
            onChange={handleContentChange}
            disabled={disabled}
            rows={4}
            className={`
              w-full rounded-lg px-3 py-2.5
              bg-zinc-900/60 border ${accentBorder}
              text-sm text-zinc-200 placeholder:text-zinc-600
              focus:outline-none focus:ring-1 ${editingRing}
              resize-y min-h-[100px] transition
              disabled:opacity-40
              leading-relaxed
            `}
            aria-label="Edit reflection content"
            data-testid="completion-editor-textarea"
          />

          {/* Footer: char count + validation + diff indicator */}
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <span className={isValid ? 'text-zinc-500' : 'text-red-400/80'}>
                {charCount} chars
                {!isValid && ` (min ${minLength})`}
              </span>
              {isCustomized && (
                <span className="text-zinc-600">
                  {charDiff > 0 ? `+${charDiff}` : charDiff} from original
                </span>
              )}
            </div>
            <span className="text-zinc-600 italic">
              Esc to stop editing
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Revert button */}
            <button
              onClick={handleRevert}
              disabled={disabled || !isCustomized}
              className={`
                text-xs px-3 py-1.5 rounded-md transition-all duration-200
                border border-zinc-700/60 bg-zinc-900/40
                ${isCustomized
                  ? 'text-zinc-300 hover:text-zinc-100 hover:border-zinc-600/80'
                  : 'text-zinc-600 cursor-not-allowed opacity-50'
                }
                disabled:opacity-40 disabled:pointer-events-none
              `}
              aria-label="Revert to original text"
              data-testid="completion-editor-revert-btn"
            >
              Revert to original
            </button>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={disabled || !isValid}
              className={`
                flex-1 text-xs py-1.5 rounded-md font-medium transition-all duration-200
                ${isValid
                  ? `${accentBg} border ${accentBorder} ${tokens.textAccent} hover:opacity-90`
                  : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-600 cursor-not-allowed'
                }
                disabled:opacity-40 disabled:pointer-events-none
                active:scale-[0.98]
              `}
              aria-label="Save edits"
              data-testid="completion-editor-save-btn"
            >
              {isCustomized ? 'Save changes' : 'Done editing'}
            </button>
          </div>
        </div>
      ) : (
        /* Read-only content display */
        <p className="text-xs text-zinc-300 leading-relaxed italic">
          &ldquo;{editedContent}&rdquo;
        </p>
      )}

      {/* ── Confirm button (non-editing mode) ─────────────────────────────── */}
      {!isEditing && onConfirm && (
        <button
          onClick={handleConfirm}
          disabled={disabled || !isValid}
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
          data-testid="completion-editor-confirm-btn"
        >
          {isCustomized ? 'Seal customized insight' : 'Seal this insight'} &rarr;
        </button>
      )}

      {/* Cancel link */}
      {onCancel && (
        <button
          onClick={onCancel}
          disabled={disabled}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          data-testid="completion-editor-cancel-btn"
        >
          &larr; Choose a different reflection
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hook: useCompletionEditor
// ---------------------------------------------------------------------------

/**
 * Standalone hook for managing completion editor state outside the component.
 * Useful when the parent needs to track edit state for form submission.
 */
export function useCompletionEditor(originalContent: string, minLength = DEFAULT_MIN_LENGTH) {
  const [editedContent, setEditedContent] = useState(originalContent)

  const isCustomized = editedContent.trim() !== originalContent.trim()
  const isValid = editedContent.trim().length >= minLength

  const revert = useCallback(() => {
    setEditedContent(originalContent)
  }, [originalContent])

  const update = useCallback((content: string) => {
    setEditedContent(content)
  }, [])

  // Reset when original changes (new completion selected)
  useEffect(() => {
    setEditedContent(originalContent)
  }, [originalContent])

  return {
    editedContent,
    isCustomized,
    isValid,
    revert,
    update,
    editState: {
      content: editedContent.trim(),
      originalContent,
      isCustomized,
      isValid,
    } satisfies CompletionEditState,
  } as const
}
