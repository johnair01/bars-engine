# Book `metadataJson` — Praxis pillar fields

Stored on `Book.metadataJson` as JSON string. All fields optional except when pillar is set.

## Shape

```ts
export type PraxisPillarId = 'antifragile' | 'commons_networks' | 'felt_sense' | 'unset'

export interface BookPraxisMetadata {
  /** Design pillar for library / quest alignment */
  praxisPillar?: PraxisPillarId
  /** Short admin-facing: why this book is in the library */
  designIntentSummary?: string
  /** e.g. diplomat strand consult — provenance, not player-facing required */
  strandNote?: string
  /** Wiki slugs to link when we expose player library */
  relatedWikiSlugs?: string[]
}
```

## Merging

When updating, merge with existing `metadataJson` keys (book analysis may add other keys). Do not wipe unrelated fields.

## Example (Antifragile)

```json
{
  "praxisPillar": "antifragile",
  "designIntentSummary": "Engine + gameplay: learn from stressors; friction as signal; compost not shame.",
  "relatedWikiSlugs": ["emotional-alchemy"]
}
```

## Example (Wealth of Networks)

```json
{
  "praxisPillar": "commons_networks",
  "designIntentSummary": "Commons-based peer production; threads/BARs over static manual (diplomat strand).",
  "strandNote": "Suggested vs Wikipedia Missing Manual — strand consult."
}
```

## Example (Complete Focusing Instructions)

```json
{
  "praxisPillar": "felt_sense",
  "designIntentSummary": "Felt sense as trainable skill; 321 strengthens contact; scaffold for low-skill players.",
  "relatedWikiSlugs": ["emotional-alchemy"]
}
```
