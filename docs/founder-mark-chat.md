# Marking a payment from chat (the fallback half of gm-mark-surface-1)

Wendell answered C on 2026-11-21: the page at `/admin/founder-mark` does the marking, and chat is the fallback.
Use chat when he pastes a payment note into a session and has no browser handy.

The rule for a Claude session:

1. He pastes the note, the amount and who sent it. Read it first: `GET /api/founder/mark?note=<note>` with the council token
   (`COUNCIL_MENU_TOKEN`, injected for bars-engine.vercel.app in a Claude cloud thread). The answer names the word or says why nothing would be marked.
2. Tell him in one sentence whose word it carries only if the read says `marked`. Mark when he asked you to mark; his paste of a note and an amount is that ask.
3. Mark with `POST /api/founder/mark` and `{"note": "<as written>", "cents": <whole cents>, "ref": "<payer and day>"}`.
   The ref is what makes a second call harmless: a ref seen before returns `already` and writes nothing.
4. Report the result as he would read it: `marked` (the player's crop grows), `already` (nothing written), `no-word` or `unknown-word` (nothing marked; he asks the payer).
5. Never guess a word from a half-typed note, and never mark without an amount he gave.

The page and this route call the same engine (`markPayment`, bars-engine #916), so a payment marked in either place shows in the other.
