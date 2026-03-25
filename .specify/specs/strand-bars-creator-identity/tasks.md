# Tasks: Strand BARs — dedicated creator identity

- [x] **T1** Add `strand_creator_player_id` to `backend/app/config.py` (`STRAND_CREATOR_PLAYER_ID`); document in `docs/ENV_AND_VERCEL.md`.
- [x] **T1b** Ensure SQLAlchemy `Player` exposes `creatorType` (same DB column as Prisma); add mapped column if absent.
- [x] **T2** Implement `backend/app/strand/creator.py` — `resolve_strand_creator_id(session)` per spec resolution order (env → agent+name lookup → error).
- [x] **T3** Replace `_get_system_creator_id` in `backend/app/strand/runner.py` with `resolve_strand_creator_id`; remove dead helper.
- [x] **T4** Add pytest coverage: env id valid / invalid; lookup path; error when missing (use test DB or mocked session per project patterns).
- [x] **T5** Seed: upsert canonical agent `Player` (`creatorType: agent`, fixed name constant in one module); idempotent; log id for operators.
- [x] **T6** Run `cd backend && make check` and targeted pytest; `npm run check` if TS/docs touched.
- [ ] **T7** (Optional / Phase 2) Admin discovery endpoint or runbook for listing strand BARs by creator.
