# Plan: WorkAdventure character sync

1. bars-engine PR A (small): email fallback and logging in `save-textures` / `save-name`; test with the admin and
   an ordinary player; read the logged identifier to settle the 404.
2. Entry (box change needs go-ahead): login offered with "Continue as guest"; confirm in a private window.
3. bars-engine PR B: `lookOverride` field + migration; `room/access` and `save-textures` use it.
4. Play fork: per-texture frame height; rebuild `wa-play-tall`; test a tall and a 32px figure together.
5. Board rows for the open questions in the council repo before PR B.
