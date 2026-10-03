# Plan: Jev quote-to-claim check

1. Read TypeSafe's Noul, confidence and citation-check pages, and the SDK page for the chosen language. Note any limit, price or data term the docs state, and any they omit.
2. Build the ruler (spec Phase 0) with no model call. Nothing in Phase 1 or 2 starts until the ruler exists.
3. Run the deterministic baseline (Phase 1) and record its agreement.
4. After Wendell creates the account and key, run Jev (Phase 2) from a local script that reads the key from the environment.
5. Read the misses (Phase 3) and show Wendell the whole table.

Files: `council/jev/extract_pairs.py`, `council/jev/baseline.py`, `council/jev/run_noul.py`, `council/jev/labelled.json`, `council/jev/RESULTS_<date>.md`. These are council tooling and belong in the home repo once the trial has a result.
