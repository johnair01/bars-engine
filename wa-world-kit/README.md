# World kit

A friend clones this repo, edits the maps in `world/` with Tiled (32-pixel tiles), and asks for them to be published.

1. Put `.tmj` maps and their images in a folder (see `world/`). A map needs a layer named `start`.
2. Check it: `python3 wa-world-kit/publish.py world --volume /tmp/maps --dry-run`
3. Publish it, on the box: `python3 wa-world-kit/publish.py world --volume /opt/workadventure/maps`

`publish.py` refuses a world with a bad tile size, a missing `start`, a missing image or script, or an exit to a map that is not in the folder. On success it copies the folder into the volume and writes `portals.json` there (each map's size, exits and which maps lead to it).

The map's `script` property loads `https://bars-engine.vercel.app/wa/bridge.js`, which sends claims to `/api/wa/event` and `/api/wa/presence`. A claim says "this browser uuid did this in this room". bars-engine logs and rate limits it and grants nothing, because the uuid is a random id in the visitor's browser (council row wa-world-kit-1, answer A). Who may edit a world is a separate question, not settled here.
