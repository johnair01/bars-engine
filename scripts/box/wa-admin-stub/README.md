# WorkAdventure Admin API stub

Gate 2 of council pass wa-own-world-1 (board row wa-own-first-1: "Remember who players are"). The question this
answers: if the world's server asks an outside service who a player is, and the service names a look and a tag,
does WorkAdventure skip its shelf of 30 stock faces and open the map editor?

The stub knows one account, `test-admin`. It returns a fixed two-layer look and the `editor` tag. Any other player
gets an anonymous answer with no tags, so the world still opens for everyone.

## Run on the box (needs his Mac session; nothing on the box changes without it)

1. Copy `server.mjs` to the box. Node 18 or later. No install step.
2. `ADMIN_API_TOKEN=<a new random string> node server.mjs` (it listens on port 8787 and logs every call the world makes).
3. In the world's `.env`, set `ADMIN_API_URL=http://<address the pusher can reach, port 8787>` and the same value as
   `ADMIN_API_TOKEN`, then restart the pusher and front.
4. Open the world signed in as `test-admin` (the pusher passes the account as `userIdentifier`), then reload.

## What to look for

- Does the face shelf disappear for `test-admin` and the fixed look load? If the sprite does not draw, the URLs in
  `FIXED_TEXTURES` are the first suspect; open them in a browser.
- Does the map editor open (the `editor` tag)?
- The log shows which endpoints the pusher actually calls and with what query. Paste it into the reply: it is the
  real answer to "which fields does the pusher read".

## Not checked

The response shapes come from memory of WorkAdventure's pusher source and the fork's copy of its Admin API doc. They
have not run against a live pusher. Passing `node --test server.test.mjs` shows the stub does what it says, not that
WorkAdventure accepts it. If the world rejects a field, change it here; it is a stub.
