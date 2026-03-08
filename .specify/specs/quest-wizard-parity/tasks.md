# Tasks: Quest Wizard Parity

## Task 1: Step 1 — Move + Domain required

- Add Move (Wake Up, Clean Up, Grow Up, Show Up) and Allyship Domain to step 1.
- Require both for non-gameboard before Next.
- Gameboard: skip requirement (inherit from parent).

## Task 2: Step 2 — Success criteria

- Add "What does success look like?" textarea.
- Pass to createQuestFromWizard; append to description in create-bar.

## Task 3: Step 3 — Scope, reward, BAR type

- Add scope selector: Personal (self), Personal (assign), Collective.
- Add reward input 1–5.
- Add optional BAR type on completion: None, Insight BAR, Vibe BAR.
- Map scope to visibility (collective = public).

## Task 4: create-bar validation and persistence

- Validate moveType and allyshipDomain when not gameboard.
- Accept successCriteria, barTypeOnCompletion.
- Append successCriteria to description.
- Store barTypeOnCompletion in completionEffects.

## Task 5: quest-engine barTypeOnCompletion

- In processCompletionEffects, parse barTypeOnCompletion.
- When 'insight' or 'vibe', create CustomBar for completer.

## Task 6: Run build and check

- `npm run build` and `npm run check`.
