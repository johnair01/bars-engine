# council/jev

Deterministic tooling for phases 0 and 1 of `.specify/specs/jev-quote-claim-check/`. It calls no model and uses only the Python standard library.

- `extract_pairs.py` reads every `council/daemons/reports/*.json` and writes `labelled.json`, one row per (claim, quote) pair. Every label starts as `unlabelled`. A source row with no quote or no claim is skipped and counted.
- `make_constructed.py` adds one constructed mismatch per real pair by swapping in a quote from a different claim in the same report. These rows carry `kind: constructed`, `label: no`, `by: construction`. They stay separate from the real rows and never count toward the pass.
- `baseline.py` fetches each cited page (15 second timeout, cached under `cache/`, failing soft), checks the quote word for word and then fuzzily, and measures key-term overlap between claim and quote. It flags `read` or `ok` using two thresholds that must be given on the command line. It reports agreement with labels for real and constructed rows separately, and says so when no real row has a label.
- `test_jev.py` holds the unit tests: `python3 council/jev/test_jev.py`. It needs no network.

No script here invents a label. Only a person sets a real label. The sample size, the thresholds and the pass mark are Wendell's numbers; the spec leaves them unset.

The Jev arms (`run_noul.py`) are not built. There is no TypeSafe account or key yet, and the data-terms reading (task T6a) has not been done.
