# Spec: Jev quote-to-claim check

## Purpose

Test whether TypeSafe's Jev can tell, for a quote and the claim it is attached to, whether the quote supports the claim. The council's daemon reports attach a short quote to every linked finding, and the face checks each match by hand. This trial measures whether a Jev Noul can surface the mismatches so the face reads fewer of them cold.

**Problem:** On the board, `dm-quote-the-source` records that the Skeptic's rerun linked real papers to the wrong claims twice in four checks. A quote makes a mismatch visible only if someone reads it.

**Practice:** Deftness Development. Spec first, deterministic first, AI second. This is council tooling, so no player data is involved. Ruled by Wendell on 2026-10-03: "Council and build tooling for now but I'd be curious about asset and story pipeline work too".

## Design Decisions

| Topic | Decision |
|-------|----------|
| Primitive | One Noul per (claim, quote) pair: "Does the quote support the claim?" A Noul is a yes/no probability. Choice and Score are not needed. |
| Role of the output | A candidate flag only. A low probability sends the pair to the face to read. A high probability never closes a check. Position `jev-candidates-only`. |
| Fallback | With no key or no network, the check is skipped and the face reads every pair, as today. Position `jev-fallback`. |
| Scope of data | Daemon reports and their cited sources. No player text. Position `jev-no-player-text`. |
| Where it runs | A script beside `council/daemons/check_report.py`, called by a face on a finished report. Nothing runs at session start. |
| Key | Server-side or local environment variable only. It never enters chat, the repo or a report. Creating the account is Wendell's step. |
| Docs first | Before any code, read TypeSafe's current Noul page, confidence page and citation-check cookbook at docs.typesafe.ai. The skill says live docs are the source of truth. |

## Conceptual Model

| Dimension | In this trial |
|-----------|---------------|
| WHO | The Challenger face and its Skeptic daemon; the Player is Wendell. |
| WHAT | A report's numbered claims, each with its quote and link. |
| WHERE | The council's daemon-report step, after `check_report.py` passes and before the face reads. |
| Energy | The face's reading time. The trial succeeds if it saves reading without hiding a mismatch. |

## Data Contract

**Input** (one pair): `{ id, claim, quote, source_url }`, taken from a daemon report's numbered claims and the quote beside each.
**Output** (one pair): `{ id, p_support, flag }` where `flag` is `read` when `p_support` is below the threshold and `ok` otherwise.
The script writes a table of pairs and flags next to the report. It changes no report text.

## Labelled set (the test's ruler)

The ruler is built before Jev runs, and its labels come from a person.

1. **Known cases.** The four checks in the daemon-subagents spec's Skeptic rerun, two of which were mismatches. Source: `.specify/specs/daemon-subagents/spec.md` in the home repo.
2. **Reports on record.** Every claim-and-quote pair in the daemon reports from passes 5 and 6 and the I Ching test. The window is named: those reports, as they stand on 2026-10-03.
3. **Constructed mismatches.** For each pair in set 2, one pair with the quote swapped for a quote from a different claim in the same report. These mismatches are true by construction.
4. **Wendell's labels.** Wendell labels a sample of set 2 as supports or does not support. The sample size, the pass mark and the threshold are his numbers and are unset (see Open decisions).

## Functional Requirements

### Phase 0: Ruler

- **FR1**: Extract every claim-and-quote pair from the reports in the window into `labelled.json` with `id`, `claim`, `quote`, `source_url` and a `label` of `unlabelled` until a person sets it.
- **FR2**: Build the constructed mismatches and mark them `label: no, by: construction`.
- **FR3**: Verify each quote against its source page by opening the page. A quote that is not on the page is labelled `no, by: source`.

### Phase 1: Baseline

- **FR4**: Run a deterministic baseline first: does the quote appear verbatim on the source page, and do the claim and quote share their key terms. Report its agreement with the labels.
- **FR5**: The baseline is the bar Jev must beat to earn a place. A Jev that only matches the baseline adds a dependency and a cost for nothing.

### Phase 2: Jev

- **FR6**: Run one Noul per pair, in parallel, over `{claim, quote}` as state. Record `p_support` for every pair.
- **FR7**: Report agreement with the labels at the threshold, the misses in both directions, and the end-to-end time and token cost, measured and not assumed.

### Phase 3: Reading the misses

- **FR8**: The Challenger reads every pair where Jev and the label disagree and says why: missing evidence, a model error, a code error, or a bad label. No miss is explained by rate.
- **FR9**: Wendell sees the table whole, before any decision to wire Jev into the daemon step.

## Pass marks

Unset. Wendell sets them. The spec records only the shape: the trial passes if Jev beats the deterministic baseline on the labelled set at a threshold Wendell sets, and misses fewer constructed mismatches than the baseline does. No number here was inferred on his behalf.

## Non-Functional Requirements

- Network calls go only to TypeSafe and to the cited source pages.
- Nothing is cached in the repo except `labelled.json` and the result tables.
- The trial makes no change to any report, to `faces.yaml`, or to any reserved item.

## Open decisions (Wendell's)

| Decision | Why it is his | What it changes |
|----------|---------------|-----------------|
| Size of the sample he labels | It is his time. | How tight the result can be. |
| The threshold for `read` | A number about his tolerance for a missed mismatch against reading time. | Which pairs reach the face. |
| The pass mark | A number on his behalf is forbidden. | Whether the trial ends in adoption. |
| Creating the TypeSafe account and key | His account and money. | Whether Phase 2 can run at all. |

## Verification Quest

Not required: this feature has no player-facing surface. Its verification is the labelled-set table in FR7 and the read in FR8.

## Dependencies

TypeSafe's HTTP API or SDK (read the current docs first); `council/daemons/check_report.py`; the daemon reports on record.
