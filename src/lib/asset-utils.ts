/** Parse metadataJson for rotationDegrees (0, 90, 180, 270). */
export function getAssetRotation(asset: { metadataJson?: string | null }): number {
  if (!asset.metadataJson) return 0
  try {
    const meta = JSON.parse(asset.metadataJson) as { rotationDegrees?: number }
    const d = meta.rotationDegrees
    if (typeof d === 'number' && [0, 90, 180, 270].includes(d)) return d
  } catch {
    /* ignore */
  }
  return 0
}
