# AAR 2026-11-21: DeepAI lane failed 43 of 48 tickets

What happened: 40 tickets ended "lane timed out after 2700s", 3 at 1500s. They were picture builds (robe tuck, magenta
band, over-robe skirt, run gait) and a design question (fate-clearing). A picture build needs a render and a look; the
DeepAI environment has no browser or GPU, so it ran out its budget. Four tickets finished (smoke test, three
cultivation-locomotion recipes, bars #840 draft) and posted no look row because none asked for one.

Cause: `routeLane` overflowed any ticket into DeepAI once claude and freebuff passed the deck ceiling (20).

Fix: `ticketKind` (src/lib/work/lanes.ts) marks picture and design tickets; they never route to DeepAI, and a picture
ticket is `done` only with a `look` or a result saying `no look: <why>`. The failed picture tickets were retried and
steered to the Claude lane.
