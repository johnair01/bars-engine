/** Calrunia return context is private even when the BAR itself is shared. */
export function redactCalruniaReturnMetadata(metadata: string | null, isOwner: boolean): string | null {
  if (isOwner || !metadata) return metadata
  try {
    const value: unknown = JSON.parse(metadata)
    if (value && typeof value === 'object' && 'source' in value && value.source === 'calrunia_return_v1') return null
  } catch {
    // Existing non-Calrunia metadata retains its current behavior.
  }
  return metadata
}
