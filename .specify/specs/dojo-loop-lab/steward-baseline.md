# Dojo Steward: first baseline

Verified 2026-11-01 (Pacific). This is a source and deployment-metadata inspection, not a player walkthrough.

- Steward branch: `codex/dojo-project-steward`, commit `8017f718571c1f23287b8ed05fda3533ba0af435`; based on main `e3c576029a2a441cff0a7a2c332cdc677a16bf00`.
- Vercel reports production READY at that main SHA. This verifies the recorded deployment revision and build status, not route behavior or user access.
- There is no `src/app/dojo/triangle-workshop/loop-lab` route in that source. The existing prototype at `/dojo/triangle-workshop/prototype` is a different, 2D charge-aware thought-string experiment and must not be represented as the 3D Loop Lab.
- PR #459 introduced the deterministic fixture and Lab specs; it did not implement the Lab route.
- PR #455 contains a separate 3D dojo room and is open as of this inspection. Its relationship to the current Lab implementation needs reconciliation; it has not been integrated or tested here.
- The workshop page and prototype route require a logged-in player. No authenticated walkthrough, phone-sized screenshot, independent playtest, route-level no-write instrumentation, or accessibility test has been performed in this session.
- Installed npm dependencies locally with `npm ci --ignore-scripts --no-audit --no-fund`; installation succeeded. This does not establish a runnable app, database credentials, or a successful build.

## Next implementation slice

Inspect PR #455 and its current compatibility with main, then establish a small, non-persistent Lab entry in or adjacent to the 3D dojo. The first phone-sized scene should explain the authored demonstration and its non-persistence, show one obvious wall interaction, and preserve an accessible equivalent and Nook return. Integrate the existing deterministic fixture rather than inventing EA interpretation. Before calling it ready, exercise the actual rendered scene and check the no-write contract. Do not claim the full loop, a physical phone test, or independent comprehension has been verified.

Acceptance target: a new player can identify what the practice demonstrates and how to begin without being asked for personal material. Whether they actually understand must be tested with a person.
