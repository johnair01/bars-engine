# Plan: Blender pipeline test plan

<!-- Spec: ./spec.md. This kit is the plan. The build thread that follows it writes the tests; this one wrote none. -->

## Approach

Run the one cheap test first: R2, the kit rebuild with picture dressing, twice on #285's branch. It decides whether
the kit can be matched byte for byte, and everything else can go ahead whatever it says.

Then build the tiers in the order they pay back. The offline tier is a few small Python checks over files already
in the repo and catches the costliest mistake, a non-CC0 model in a page. The `bpy` tier comes next because it
covers the rebuilds and the walker, which every later change touches. The network tier and the never-tried assets
come last: they cost downloads and their fixtures need pinning by hand. The picture-path tests wait for #285 to
merge, so the build thread never edits files the cave-studio strand is working in.

## Files the build thread adds

Part 1's files are all new, all under `tools/blender-cloud/tests/`. Part 2 adds `cave/scene.yaml`, its schema and a builder, planned in its own thread. No existing file changes except one step in
`.github/workflows/frontend-check.yml`.

| File | Job |
|---|---|
| `run.py` | The runner. `--tier offline,bpy,net`; `--only G1,R2`; writes `$W/test-summary.md` (at most 30 lines) and, for the `bpy` tier, the contact sheet. Exits non-zero on any failure that is not a marked known gap. Calls the `bpy` venv's Python for `bpy` tests and Node for `cave-test.mjs`. |
| `test_offline.py` | G1, G2, G2b, G6, G7 (stub server on localhost). Plain Python 3, no third-party packages. |
| `test_bpy.py` | G3 to G5, R1 to R3, W1 to W4, P1 to P5. Run under the `bpy` venv. |
| `test_net.py` | V1, A1 to A4, N1, N2, N4, N5. |
| `contact_sheet.py` | Builds the sheet for E1 and E2 with `bpy`'s image tools (no extra package). |
| `fixtures.json` | Pinned asset ids: query, index, name, licence, date. |
| `walk_keys.json` | Stored joint rotations for W4, committed after a person checks W3's picture. |
| `LOOKED.md` | One line per look: who, date, piece, verdict. |
| `synthetic/` | The two-tile and one-tile UDIM images, and the odd sidecars for G2. A few KB. |

Downloaded assets, renders and summaries go in `$W` (`/tmp/blender-cloud`), never in git.

## Order

1. R2 twice on #285's branch (the falsify test). Record the result in `tasks.md`.
2. Offline tier and its CI step. G2 and G2b are expected to fail on first run; mark them known gaps and raise each
   as a finding on the board through the reach test (the record already answers them, via `cs-cc0-or-own`, so they
   go as positions, not questions).
3. `bpy` tier: rebuilds, stops, walker. First run writes `walk_keys.json`; look at W3's frames before committing.
4. Contact sheet and `LOOKED.md`.
5. Network tier: pin fixtures, A1 meshopt, A2 multi-material, A3 UDIM search, N4 hosts, N5 heavy run (in the
   background, summary file read once at the end).
6. After #285 merges: P1 to P6 and the dressing pieces on the sheet.
7. Part 2, in its own threads, one job per thread (CLAUDE.md, short sessions):
   a. The recipe schema and builder, then T1 to T3. Token numbers come from each thread's result events, read after the
      thread ends. If T2 fails, stop and replan Part 2 around direct code.
   b. J1 textures, J2 objects, J3 picture to asset (needs his pictures in the Drive inbox).
   c. J4 the character creator, then J5 clothing. J5's sheet goes on Your steps for his eye.
   The recipe and builder touch `content/ontology-game/cave/`, which the cave-studio strand owns: Part 2 waits for #285
   to merge, and its threads check `python3 council/strands.py` before starting.

## How a cloud session runs it

```bash
uv venv --python 3.13 /home/user/blenv && uv pip install --python /home/user/blenv/bin/python bpy==5.2.2
export SSL_CERT_FILE=/root/.ccr/ca-bundle.crt W=/tmp/blender-cloud
python3 tools/blender-cloud/tests/run.py --tier offline,bpy > $W/test-run.log 2>&1 &   # read $W/test-summary.md once it ends
```

The session reads the summary once, looks at the contact sheet if the summary lists pieces waiting for eyes, and
writes `LOOKED.md` lines. It does not watch the run.

## The GitHub check job

One added step after `npm run check`: `python3 tools/blender-cloud/tests/run.py --tier offline`. The runner image
already has Python 3; no install. No `bpy` in CI: the wheel is a large download on every push, and the files it
tests change a few times a month. A session runs the `bpy` tier whenever a pull request touches
`tools/blender-cloud/`, `content/ontology-game/cave/` or `content/ontology-game/body/`, and pastes the summary in the
pull request.

## Rollback

Every file is new. Removing `tools/blender-cloud/tests/` and the one workflow step returns the repo to today.

## What Wendell does, and when

The plan needs nothing from him. Two steps come later, from the build thread: `cave-studio-02` (already on Your steps) is N3,
and after any republish of the two published pages he opens each on his phone (E3). The build thread puts E3 on Your
steps when the first republish happens, with both links and what "loads and moves" means.
