'use client'

export type CampaignBranchChoiceRow = { text: string; targetId: string }

const DEFAULT_TITLE = 'Choices (branching)'

const DEFAULT_CAMPAIGN_HINT =
  "Target = next passage's nodeId. Use suggestions (existing passages + signup / Game_Login) or type a new id — create that passage or save validation may fail."

type Props = {
  choices: CampaignBranchChoiceRow[]
  /** Must match `list` on target inputs; parent usually renders `<datalist id={datalistId}>`. */
  datalistId: string
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, field: 'text' | 'targetId', value: string) => void
  /** Section heading (default: “Choices (branching)”). */
  title?: string
  /** Footer copy. Omit = campaign default; `null` = hide. */
  hint?: string | null
  /** Dense styling for event-invite builder and similar. */
  compact?: boolean
  choicePlaceholder?: string
  targetPlaceholder?: string
}

/**
 * LEGO-style choice rows — shared by **campaign** `CampaignPassageEditModal` and **event invite** visual builder (COC).
 */
export function CampaignBranchChoicesEditor({
  choices,
  datalistId,
  onAdd,
  onRemove,
  onUpdate,
  title = DEFAULT_TITLE,
  hint,
  compact = false,
  choicePlaceholder = 'Choice text',
  targetPlaceholder = 'target node id',
}: Props) {
  const hintText = hint === undefined ? DEFAULT_CAMPAIGN_HINT : hint

  const addBtn = compact
    ? 'text-[10px] text-amber-600/90 hover:underline font-medium'
    : 'text-xs text-purple-400 hover:text-purple-300 font-medium'

  const headLabel = compact
    ? 'text-[10px] uppercase tracking-wider text-zinc-500 font-semibold'
    : 'block text-xs uppercase tracking-widest text-zinc-500 font-bold'

  const inputBase = compact
    ? 'flex-1 min-w-0 rounded border border-zinc-700 bg-black px-2 py-1 text-xs text-zinc-200'
    : 'flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100'

  const targetW = compact ? 'w-36 min-w-0 font-mono' : 'w-44 min-w-0 font-mono'

  const removeBtn = compact
    ? 'text-[10px] text-zinc-500 hover:text-red-400 disabled:opacity-30 pb-0.5 shrink-0'
    : 'text-zinc-500 hover:text-red-400 text-sm disabled:opacity-50'

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className={headLabel}>{title}</span>
        <button type="button" onClick={onAdd} className={addBtn}>
          + Add choice
        </button>
      </div>
      <div className="space-y-2">
        {choices.map((choice, i) => (
          <div key={i} className="flex flex-wrap gap-2 items-end">
            <input
              type="text"
              value={choice.text ?? ''}
              onChange={(e) => onUpdate(i, 'text', e.target.value)}
              placeholder={choicePlaceholder}
              className={`${inputBase} min-w-[120px]`}
            />
            <input
              type="text"
              value={choice.targetId ?? ''}
              onChange={(e) => onUpdate(i, 'targetId', e.target.value)}
              list={datalistId}
              placeholder={targetPlaceholder}
              className={`${inputBase} ${targetW}`}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              disabled={choices.length <= 1}
              className={removeBtn}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      {hintText ? (
        <p className={compact ? 'text-[10px] text-zinc-600 mt-1.5 leading-relaxed' : 'text-xs text-zinc-500 mt-1'}>
          {hintText}
        </p>
      ) : null}
    </div>
  )
}
