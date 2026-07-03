# Editable Sales And Campaign Pages Tasks

- [x] Create spec kit for the feature.
- [x] Add typed `/awaken` content defaults and normalization.
- [x] Add server-side `/awaken` content loader and admin save action.
- [x] Update `/awaken` page and flow to render editable content.
- [x] Add campaign landing edit permission + fallback override helpers.
- [x] Add campaign landing save action.
- [x] Add owner/admin editor UI to campaign landing pages.
- [x] Run focused verification and record blockers.

## Verification Notes

- Focused ESLint passed for the touched `/awaken`, campaign landing, content, and action files.
- Browser smoke passed for `/awaken` and the restored dedicated `/campaign/the-crossing` route on localhost. The Crossing now renders the live "Choose Your Move" experience, not the deprecated "The Crossing Car Fundraiser" dynamic fallback. The local environment is missing `DATABASE_URL`, so admin editing cannot be fully save-tested here, but public rendering falls back gracefully.
- `npm run build:type-check` is still blocked by pre-existing syntax errors in `The Library/04 Quests/Casey's Birthday Deck/**`.
