# Economy mint / burn / transfer audit (EL — Phase 1)

**Spec:** [.specify/specs/attunement-translation/spec.md](../.specify/specs/attunement-translation/spec.md)

This document maps **where Vibeulons enter and leave** the player’s wallet (token rows on `Vibulon`), so we can spot unchecked inflation and plan **Global vs Local** attunement later.

**Ledger note:** `getVibeulonLedgerMode()` in [`src/lib/mvp-flags.ts`](../src/lib/mvp-flags.ts) toggles between `simple-balance` and `event-ledger`. [`LedgerService`](../src/lib/economy-ledger.ts) writes `VibeulonLedger` on mint in some paths; [`mintVibulon`](../src/actions/economy.ts) creates `Vibulon` rows directly (see below).

---

## Mint sources (Vibulon created)

| Source / origin | Entry point | Notes |
|-----------------|-------------|--------|
| Signup seed | [`createCharacter`](../src/actions/conclave.ts) → `mintVibulon` | `MVP_SEED_VIBEULONS` (default 3) |
| Campaign signup | [`createCampaignPlayer`](../src/app/campaign/actions/campaign.ts) | `campaign_seed`, amount = `MVP_SEED_VIBEULONS + 2` |
| Quest completion | [`quest-engine`](../src/actions/quest-engine.ts) `processCompletionEffects` / completion flow | Reward from `CustomBar` / effects |
| Twine auto-complete | [`twine.ts`](../src/actions/twine.ts) `autoCompleteQuestFromTwine` | Quest reward path |
| Admin grant | [`adminMintVibeulons`](../src/actions/admin-tools.ts) | `admin_grant`, capped 1–100 |
| Donation / packs | [`donate.ts`](../src/actions/donate.ts), pack flows | Check webhooks + pack open |
| Emotional First Aid | [`emotional-first-aid.ts`](../src/actions/emotional-first-aid.ts) | Session completion |
| Legacy migration | [`ensureWallet`](../src/actions/economy.ts) | Migrates `starterPack.initialVibeulons` to tokens |
| Legacy `LedgerService.mint` | [`economy-ledger.ts`](../src/lib/economy-ledger.ts) | `originSource: 'mint'` — verify call sites |

**Action:** When adding a new mint, record it here and use a **distinct** `origin.source` / `originId` for observability.

---

## Burn / spend (Vibulon removed or consumed)

| Mechanism | Entry point | Notes |
|-----------|-------------|--------|
| `transferVibulons` | [`economy.ts`](../src/actions/economy.ts) | Sender wallet FIFO; recipient receives new tokens |
| Public quest creation | [`create-bar` / create bar flows](../src/actions/create-bar.ts) | Stake cost where applicable |
| Bounty / stake | Schema + actions for `BountyStake`, `stakedPool` | Tied to quest/bounty |

**Action:** Grep for `vibulon.delete`, `vibulon.update`, stake deductions when adding features.

---

## Not yet implemented (spec EL)

- **Global vs Local** balances per instance
- **`attune` / `transmute`** with ratifier role
- Immutable **VibeulonLedger** for every move type (MINT, ATTUNE, SPEND, TRANSMUTE) as single source of truth

Phase 2 should extend this table and align `mintVibulon` with ledger policy.

---

## How to re-audit

```bash
rg "mintVibulon|vibulon\.create|LedgerService\.mint" src scripts --glob "*.ts"
```

Update this file when new economy paths ship.
