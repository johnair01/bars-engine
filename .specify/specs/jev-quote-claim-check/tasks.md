# Tasks: Jev quote-to-claim check

- [ ] T1 Read the TypeSafe docs named in plan step 1; write what they state and omit into RESULTS.
- [ ] T2 Write `extract_pairs.py`; produce `labelled.json` from the reports in the window.
- [ ] T3 Build constructed mismatches; check each quote against its source page; count the true mismatches among real pairs and widen the window if too few; split real pairs into tuning and scoring halves.
- [ ] T4 Write and run `baseline.py`; record agreement.
- [ ] T5 Wendell: set the sample size, threshold and pass mark; label the sample. (his numbers)
- [ ] T6a Wendell: read TypeSafe's Data Processing Agreement and Privacy Policy and say whether council report text may be sent. (his decision)
- [ ] T6 Wendell: create the TypeSafe account and key, and set the key as a local environment variable. (his step; the key never goes into chat)
- [ ] T7 Write and run `run_noul.py`; run both arms (Noul and Choice); record agreement on the scoring half, misses, time, token cost and the face's reading time per pair.
- [ ] T8 Read every miss and explain it; show Wendell the table whole.

Verification: T4 and T7 each print a table; T8 is a reading and not a script.
