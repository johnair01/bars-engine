# Plan: Emotional Alchemy Composer

## Strategy

Pure function, built to reproduce all 16 golden scenarios. Encode §4.1 as an ordered pipeline; drive correctness from the scenario fixtures (the same rigor as the registry's drift tests — a fixture break is a canon change).

## File impacts

| File | Action | Content |
|---|---|---|
| `src/lib/emotional-alchemy/composer.ts` | create | `recommendPractice`, `ComposerCard`, `Recommendation`, scoring/guard/render helpers |
| `src/lib/emotional-alchemy/index.ts` | edit | `export * from './composer'` |
| `src/lib/emotional-alchemy/__tests__/composer.test.ts` | create | S1–S16 fixtures + per-guard + crisis/capture |
| `vitest.config.ts` | edit | add test file |

## Algorithm (ordered)

```
recommendPractice(card, d):
  if d.flags∋'crisis'        → {kind:'crisis'}
  if d.flags∋'capture_only'  → {kind:'capture_only'}
  prepend = isHotCharge(d.vector.intensity) ? 'T07' : null
  effectiveSubmove = card.submove
  bridged = bankedCardAim = false
  if prepend && card.submove ∈ {show_up,grow_up}:        // §4.1 step 1b
      effectiveSubmove = 'clean_up'; bridged = bankedCardAim = true
  pool = ALL tools
  if 'frozen_suspected' ∈ flags: pool = [T02]            // §3.1 walled-off pin
  else:
      if fuel==='depleted': pool ∩= {T07,T03,T09}
      if time===2:          pool ∩= {T03,T07}
      pool = pool without channelFit(channel)==0
      pool = pool without guard-blocked (joy/grief/action-on-grief/gamified-risk)
  if pool empty: pool = [T03]                            // never-blank fallback
  score(t) = 2*RV(channelRatings[channel]) + RV(waveRatings[effectiveSubmove]) + (shape∈shapeBonusKeys?3:0)
  primary = argmax(score, tiebreak: aimFit → shorter fitted timebox → registry order)
  render(primary): protocol (mini if time=2) + SPIRIT_STEPS[target]; showUp gating; rolePath; guardsApplied; notes
```

## Key notes

- **Rating scale** `strong3/medium2/weak1/nr0`; channel `nr` excludes a tool; submove fit is a score term only (lets shape bonus pull in a submove-medium tool — S3/S7/T01).
- **Guards fire independent of whether the blocked tool would have won** — record in `guardsApplied` whenever the condition holds and the tool is present. Grief guards key on `channel==='sadness' && altitude==='dissatisfied'` (fresh grief). Joy guards key on `channel∈{anger,sadness} && intensity≥5`. `no_gamified_risk` proxy = `safety_power_over` (documented gap G11).
- **Show Up**: `harmRelation==='received'` → `external=null`; else `externalGated = intensity≥4 || safety_power_over`.
- **rolePath**: metabolizers = {T01,T02,T04}; aim = same-channel→transcend else translate.

## Verification here
Unit tests, `npm run check`. No DB/UI. Runs fully in this sandbox.

## Out of scope
Practice-card render (design-gated UX follow-up), AI tailoring, thread-history demotion (needs target 5), physical-risk detection (G11).
