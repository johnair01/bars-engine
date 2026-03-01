# Prompt: JRPG Composable Sprite Avatar + Build-a-Bear Onboarding

**Use this prompt when implementing composable sprite avatars with progressive onboarding reveal.**

## Context

The current avatar is a colored circle with initials. This spec extends it to JRPG-style 2D sprites built from composable parts (base, nation_body, nation_accent, playbook_outfit, playbook_accent). As players move through the Bruised Banana campaign flow, their sprite assembles piece by piece — build-a-bear style — so character creation feels tangible.

## Prompt text

> Implement JRPG composable sprite avatars. Create avatar-parts.ts with PartLayer, PartSpec, getAvatarPartSpecs, getUnlockedLayersForNode, getAvatarPartSpecsForProgress. Extend AvatarConfig with genderKey (from pronouns). Use name-based slugs (nationKey, playbookKey) for stable part paths. Update Avatar component to render stacked img layers with onError fallback. Extend BB API so BB_SetNation_* and BB_SetPlaybook_* set $nationKey and $playbookKey via macros. Create OnboardingAvatarPreview component; add to CampaignReader when campaignRef=bruised-banana. Layers unlock: base (steps 1–3), nation_body (4), playbook_outfit (5), nation_accent (6), playbook_accent (7–11). Add cert-composable-sprite-v1 verification quest.

## Checklist

- [ ] avatar-parts.ts: PartLayer, PartSpec, getAvatarPartSpecs, getUnlockedLayersForNode, getAvatarPartSpecsForProgress
- [ ] avatar-utils: genderKey, slugifyName, deriveGenderFromPronouns
- [ ] createCampaignPlayer: name-based nationKey, playbookKey in avatarConfig
- [ ] BB API: nationKey, playbookKey macros in BB_SetNation_*, BB_SetPlaybook_*
- [ ] Avatar.tsx: layered img rendering, onError fallback
- [ ] OnboardingAvatarPreview: campaignState, currentNodeId, progressive layers
- [ ] CampaignReader: render OnboardingAvatarPreview for bruised-banana
- [ ] cert-composable-sprite-v1: seed script, verification steps

## Reference

- Spec: [.specify/specs/jrpg-composable-sprite-avatar/spec.md](../specs/jrpg-composable-sprite-avatar/spec.md)
- Plan: [.specify/specs/jrpg-composable-sprite-avatar/plan.md](../specs/jrpg-composable-sprite-avatar/plan.md)
- Tasks: [.specify/specs/jrpg-composable-sprite-avatar/tasks.md](../specs/jrpg-composable-sprite-avatar/tasks.md)
- Extends: [avatar-from-cyoa-choices](../specs/avatar-from-cyoa-choices/spec.md)
