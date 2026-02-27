# Prompt: Allyship Domains (WHERE) + Campaign Path Choice

**Use this prompt when implementing allyship domain tagging and player campaign path choice.**

## Prompt text

> Implement allyship domains per [.specify/specs/bruised-banana-allyship-domains/spec.md](../../specs/bruised-banana-allyship-domains/spec.md). Add allyshipDomain (WHERE) to CustomBar, campaignDomainPreference to Player. Multi-select "Choose your campaign path" UX: checkboxes (checked = include, unchecked = opt out; empty = show all). Persistent "Update campaign path" on Market so players can add/change domains anytime. Filter Market by campaignDomainPreference when non-empty. Use the game language: WHERE = allyship domains (Gathering Resources, Direct Action, Raise Awareness, Skillful Organizing); distinct from moves (personal throughput).

## Checklist

- [x] Schema: allyshipDomain on CustomBar, campaignDomainPreference on Player (JSON array)
- [x] QuestWizard exposes allyship domain selector
- [x] "Choose your campaign path" UX: multi-select checkboxes, opt-out semantics
- [x] Persistent "Update campaign path" entry point (Market)
- [x] Market filters by campaignDomainPreference when non-empty; empty = show all
- [x] Seed Bruised Banana quests with allyshipDomain tags

## Reference

- Spec: [.specify/specs/bruised-banana-allyship-domains/spec.md](../../specs/bruised-banana-allyship-domains/spec.md)
- Plan: [.specify/specs/bruised-banana-allyship-domains/plan.md](../../specs/bruised-banana-allyship-domains/plan.md)
- Conceptual Model: [.agents/skills/spec-kit-translator/SKILL.md](../../../.agents/skills/spec-kit-translator/SKILL.md)
