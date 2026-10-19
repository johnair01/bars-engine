# Vendored copy

Source: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/0a70cfc64672d512c5b5b6006b5dcb5cf90dbdbd/skills/disciplines/ai-behavior-trees-utility-ai
Licence: Apache-2.0 (LICENSE.gamedev-skills, NOTICE.gamedev-skills). Files copied unchanged; this note is ours.

Using it in bars-engine: the cave is plain three.js loaded as ES modules from public/, with no engine.
- Code samples are C# with Unity types; port the patterns to JS.
- SKILL.md line 126 says the compensated product "keeps a single 0 from vetoing". It does not: 0 stays 0, which matches references/utility-ai-system.md line 89 (a near-zero should veto).
- Daemon walkers in public/between are seeded by the shared clock so both players agree without messages; keep any per-frame decision state local to one player's encounter.
