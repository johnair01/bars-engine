# Spec: Allyship Domains (WHERE) + Campaign Path Choice

## Purpose
Let players choose which **allyship domain** (WHERE the work happens) they want quests from. Allyship domains are distinct from the 4 moves (personal throughput). Schema: `allyshipDomain` on CustomBar, `campaignDomainPreference` on Player. Market and quest assignment filter by preference.

## Conceptual model (game language)

- **WHERE** = Allyship domains: Gathering Resources, Direct Action, Raise Awareness, Skillful Organizing (Mastering the Game of Allyship)
- **WHO** = Nation, Archetype (unchanged)
- **WHAT** = Quests (CustomBar)
- **Personal throughput** = 4 moves (Wake Up, Clean Up, Grow Up, Show Up) — how players get things done

A quest in "Direct Action" (WHERE) might require Show Up (move). A quest in "Raise Awareness" might benefit from Wake Up. The domain is the context; the move is how the player executes.

## User stories

### P1: Tag quests with allyship domain
**As an admin**, I want to tag quests with an allyship domain (Gathering Resources, Direct Action, Raise Awareness, Skillful Organizing), so players can filter by WHERE they want to contribute.

**Acceptance**: CustomBar has `allyshipDomain` (enum or string). QuestWizard and CreateBarForm expose allyship domain selector.

### P2: Player chooses campaign path (multi-select, opt-out)
**As a player**, I want to choose which allyship domain(s) I want quests from and opt out of the ones I don't care about, so I receive quests aligned with how I want to contribute.

**Acceptance**: Player has `campaignDomainPreference` (JSON array of selected domain keys). Multi-select checkboxes: checked = include domain, unchecked = opt out. Empty selection = show all domains (no filter). "Choose your campaign path" UX after onboarding or on first Market visit.

### P3: Sign up for a domain later
**As a player**, I want a way to add or change my domain preferences anytime, so I can pick up a new domain when it emerges or adjust as my interests shift.

**Acceptance**: A persistent "Update campaign path" or "Choose your domains" entry point (Market page, Settings, or Profile). Opens the same multi-select UX; saving updates `campaignDomainPreference`. No one-time-only gate.

### P4: Market filters by preference
**As a player**, I want the Market to prioritize quests matching my chosen allyship domain(s), so I see relevant work first.

**Acceptance**: [src/actions/market.ts](src/actions/market.ts) filters by `allyshipDomain` when `player.campaignDomainPreference` is a non-empty array. Empty or null = show all.

## Functional requirements

- **FR1**: CustomBar MUST have `allyshipDomain` field (enum: `GATHERING_RESOURCES`, `DIRECT_ACTION`, `RAISE_AWARENESS`, `SKILLFUL_ORGANIZING` or nullable).
- **FR2**: Player MUST have `campaignDomainPreference` (JSON array of domain keys; null or empty = no filter).
- **FR3**: QuestWizard / CreateBarForm MUST expose allyship domain selector.
- **FR4**: Market MUST filter by `allyshipDomain` when `campaignDomainPreference` is non-empty. Empty = show all.
- **FR5**: "Choose your campaign path" UX MUST use multi-select checkboxes; checked = include, unchecked = opt out; empty = show all.
- **FR6**: A persistent entry point (Market, Settings, or Profile) MUST allow updating domain preferences anytime. No one-time-only gate.

## Schema changes

```prisma
// CustomBar
allyshipDomain String?  // GATHERING_RESOURCES | DIRECT_ACTION | RAISE_AWARENESS | SKILLFUL_ORGANIZING

// Player
campaignDomainPreference String?  // JSON array: ["GATHERING_RESOURCES","DIRECT_ACTION"]; null or [] = show all
```

## Preference semantics

- **Multi-select**: Player can check multiple domains. Checked = "I want quests from this domain."
- **Opt-out**: Unchecked = "I don't want quests from this domain" (excluded from filter when preference is set).
- **Empty selection**: If no domains checked, treat as "show all" (no filter). Player can explicitly opt out of everything by a different UX if needed (e.g. "Show no domain quests" toggle — optional).
- **Sign up later**: "Update campaign path" link on Market (or Settings) opens the same form; player can add/remove domains anytime.

## Reference

- Cursor plan: [.cursor/plans/bruised_banana_campaign_unblock_3fab45ae.plan.md](.cursor/plans/bruised_banana_campaign_unblock_3fab45ae.plan.md)
- Spec Kit Translator: [.agents/skills/spec-kit-translator/SKILL.md](.agents/skills/spec-kit-translator/SKILL.md) (Conceptual Model)
