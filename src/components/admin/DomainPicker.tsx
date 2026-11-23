'use client'

import { ALLYSHIP_DOMAINS, type AllyshipDomainKey } from '@/lib/allyship-domains'

/**
 * All four domains, always reachable. Opens on the campaign's domain when it has one; with
 * nothing to carry it opens blank and the quest cannot be built until one is picked.
 */
export function DomainPicker({
  value,
  onChange,
  carriedDomain,
}: {
  value: AllyshipDomainKey | null
  onChange: (domain: AllyshipDomainKey) => void
  /** The campaign's domain, if any; choosing another is a deliberate override. */
  carriedDomain: AllyshipDomainKey | null
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="block text-sm font-medium text-zinc-300 mb-1">Domain</legend>
      <div className="flex flex-wrap gap-2">
        {ALLYSHIP_DOMAINS.map((d) => (
          <label
            key={d.key}
            className={`px-3 py-2 rounded-lg border text-sm cursor-pointer ${
              value === d.key ? 'border-purple-500 text-white' : 'border-zinc-700 text-zinc-400'
            }`}
          >
            <input
              type="radio"
              name="chosenDomain"
              value={d.key}
              checked={value === d.key}
              onChange={() => onChange(d.key)}
              className="sr-only"
            />
            {d.label}
            {carriedDomain === d.key ? ' (campaign)' : ''}
          </label>
        ))}
      </div>
      {!value && (
        <p className="text-xs text-amber-400">
          This campaign has no domain to carry. Pick one before building the quest.
        </p>
      )}
      {value && carriedDomain && value !== carriedDomain && (
        <p className="text-xs text-zinc-500">Overriding the campaign&apos;s domain.</p>
      )}
    </fieldset>
  )
}
