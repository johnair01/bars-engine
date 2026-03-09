# Plan: Onboarding Flow Nations, Archetypes, Domains, and First Quest

## Architecture

- **Artifact removal**: Use extractTokenSets or similar to strip [[links]] from passage body; ensure buttons are rendered instead.
- **Nation/Archetype paths**: Add BB_NationInfo_* and BB_PlaybookInfo_* (or ArchetypeInfo) nodes; link from choice → info → loop back.
- **Domain links**: Add domain summary nodes or modal content; link to /wiki/emotional-alchemy or domain-specific pages.
- **First quest**: Use starter quest logic (DM, CG) to surface first live quest; remove stub copy.

## File impacts

| Action | Path |
|--------|------|
| Modify | Bruised Banana onboarding Twine / seed |
| Modify | PassageRenderer or CampaignReader (artifact stripping) |
| Modify | Domain/nation/archetype content nodes |
| Modify | First-quest surfacing (starter quests, short wins) |

## Implementation notes

- Check existing BB_NationInfo_*, BB_PlaybookInfo_* nodes from prior cert feedback fixes.
- Domain summaries may live in content or wiki; modal vs link is a UX choice.
- First quest: integrate with resolveMoveForContext, starter quest templates.
