'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ColorPickerFieldProps = {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  /** CSS var name for context (e.g. "--cs-title") */
  cssVar?: string
  /** Allow clearing (setting to null) */
  clearable?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Validate hex color format */
function isValidHex(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color) || /^#[0-9a-fA-F]{3}$/.test(color)
}

/** Validate any CSS color (hex, rgba, named) */
function isValidCssColor(color: string): boolean {
  if (isValidHex(color)) return true
  if (/^rgba?\(/.test(color)) return true
  if (/^hsla?\(/.test(color)) return true
  return false
}

/** Normalize hex for the native color input (requires 6-digit hex) */
function toHex6(color: string | null): string {
  if (!color) return '#000000'
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const [, r, g, b] = color.match(/^#(.)(.)(.)$/) ?? []
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return '#000000'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ColorPickerField({
  label,
  value,
  onChange,
  cssVar,
  clearable = false,
}: ColorPickerFieldProps) {
  const [textValue, setTextValue] = useState(value ?? '')
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync external value changes
  useEffect(() => {
    if (!isEditing) {
      setTextValue(value ?? '')
    }
  }, [value, isEditing])

  const handleColorInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value
      setTextValue(hex)
      onChange(hex)
    },
    [onChange],
  )

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      setTextValue(v)
      if (isValidCssColor(v)) {
        onChange(v)
      }
    },
    [onChange],
  )

  const handleTextBlur = useCallback(() => {
    setIsEditing(false)
    if (textValue && !isValidCssColor(textValue)) {
      // Revert to last valid value
      setTextValue(value ?? '')
    }
  }, [textValue, value])

  const handleClear = useCallback(() => {
    setTextValue('')
    onChange(null)
  }, [onChange])

  const hasRgbaValue = value && /^rgba?\(/.test(value)

  return (
    <div className="flex items-center gap-3 group">
      {/* Color swatch / native picker */}
      <div className="relative flex-shrink-0">
        <div
          className="w-8 h-8 rounded-lg border border-zinc-700 group-hover:border-zinc-500 transition-colors cursor-pointer overflow-hidden"
          style={{ backgroundColor: value ?? 'transparent' }}
        >
          {!value && (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
              --
            </div>
          )}
        </div>
        {/* Only show native picker for hex-compatible values */}
        {!hasRgbaValue && (
          <input
            type="color"
            value={toHex6(value)}
            onChange={handleColorInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title={`Pick ${label}`}
          />
        )}
      </div>

      {/* Label + text input */}
      <div className="flex-1 min-w-0">
        <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5 truncate">
          {label}
          {cssVar && (
            <span className="ml-1 text-zinc-700 font-mono normal-case tracking-normal">
              {cssVar}
            </span>
          )}
        </label>
        <input
          ref={inputRef}
          type="text"
          value={textValue}
          onChange={handleTextChange}
          onFocus={() => setIsEditing(true)}
          onBlur={handleTextBlur}
          placeholder="#000000"
          className="w-full bg-transparent border-b border-zinc-800 text-zinc-300 text-xs font-mono py-0.5 focus:outline-none focus:border-purple-600 transition-colors placeholder:text-zinc-700"
        />
      </div>

      {/* Clear button */}
      {clearable && value && (
        <button
          type="button"
          onClick={handleClear}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          title="Clear color"
        >
          <span className="text-xs">x</span>
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Color Group — renders a labeled group of color pickers
// ---------------------------------------------------------------------------

export type ColorFieldConfig = {
  key: string
  label: string
  cssVar?: string
}

type ColorGroupProps = {
  title: string
  fields: ColorFieldConfig[]
  values: Record<string, string | null>
  onChange: (key: string, value: string | null) => void
}

export function ColorGroup({ title, fields, values, onChange }: ColorGroupProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
        {title}
      </h3>
      <div className="space-y-2.5">
        {fields.map((f) => (
          <ColorPickerField
            key={f.key}
            label={f.label}
            value={values[f.key] ?? null}
            onChange={(v) => onChange(f.key, v)}
            cssVar={f.cssVar}
            clearable
          />
        ))}
      </div>
    </div>
  )
}
