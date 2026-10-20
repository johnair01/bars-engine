# Jev trials: paused, 2026-10-20

Wendell, 2026-10-20: "Do 1 and 2", on the council's recommendation to fix the real findings and pause the Jev trial.

## Why paused

No Jev call has been made. The audit work that fed the asset trial was done by Claude reading the docs against the code, and it did the job better than a person could by hand. Jev's strength is fast, cheap, structured judgments inside code that runs often, such as a doc-drift check on every pull request. Nothing in the project needs that today, so the case for spending more time on an evaluation is weak until a repeating job appears.

## What is built and saved

| Item | Where |
|---|---|
| Quote-to-claim trial spec, extraction, constructed mismatches, deterministic baseline (12 tests) | `.specify/specs/jev-quote-claim-check/`, `council/jev/` |
| Daemon report saver with a JSON sidecar | `council/daemons/save_report.py` (home repo, merged) |
| Asset scope brief, with its correction | `.specify/specs/jev-asset-pipeline-scope/` |
| 195 asset statements, none labelled, validator and 16 tests | `council/jev/asset_statements.json` |
| Two independent model readers' labels for the 20 admin statements, and the comparison with Wendell's | `council/jev/readers/`, `council/jev/asset_labels_compared.json` |
| One-statement-at-a-time labelling page | `council/jev/label_page.html`, `.specify/specs/jev-asset-labelling-page/` |

## What would restart it

1. A job that runs repeatedly and needs cheap, fast judgments: a doc-drift check on each pull request, routing, or triage of many items.
2. Wendell reads TypeSafe's Data Processing Agreement and Privacy Policy (task T6a) and creates an account and key. Neither is needed while the trials are paused.
3. Two numbers Wendell sets when a trial resumes: the pass mark and the sample sizes. They are still unset.

## Still open

- Board question `jev-asset-additions`: whether an extra behaviour that a document does not mention counts as a mismatch. It decides two rows, so it can wait.
- The server-side 5 MB image limit is a product decision, recorded in bars-engine#407.
