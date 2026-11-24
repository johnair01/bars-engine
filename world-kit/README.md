# World kit (offline checks)

Install dependencies with `npm install` in this directory, then run `npx world-kit validate <kit-directory> [--json]`. A kit contains `world.yaml`, `world.md`, `conditions.yaml`, `obstacles.yaml`, `npcs.yaml`, and a `portraits/` directory. The offline check verifies required paths, nonempty files, and YAML syntax. It does not establish that a kit can be played or accepted by the engine.

Publishing is not implemented: this workspace does not yet expose the requested gate-backed world-kit ingest endpoint or its contract. Do not put credentials in a kit folder.
