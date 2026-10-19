# Vendored copy

Source: https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/0a70cfc64672d512c5b5b6006b5dcb5cf90dbdbd/skills/disciplines/game-ai
Licence: Apache-2.0 (LICENSE.gamedev-skills, NOTICE.gamedev-skills). Files copied unchanged; this note is ours.

Using it in bars-engine: the cave is plain three.js loaded as ES modules from public/, with no engine.
- Code samples are GDScript and Python.
- Where it says to use "the engine's navmesh", three.js has none: use recast-navigation-js (council toolbox) or a grid A*.
- Daemon walkers in public/between are seeded by the shared clock; steering state is per frame, so use it only for a local encounter.
