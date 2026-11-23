"""WorkAdventure map rules, applied and checked.

Every generator in `public/wa/` writes a Tiled map for WorkAdventure. WorkAdventure does not
read maps the way Tiled draws them, and three of its rules cannot be seen in a screenshot:

  floorLayer   must be an Object Layer. WorkAdventure errors and refuses the map when it is a
               tile layer, however it looks ("Your map must have a layer named \"floorLayer\"
               of type \"Object Layer\"" — libs/map-editor/src/GameMap/MapValidator.ts).
  collides     collision comes from a boolean `collides` property on the tileset's tiles, not
               from a layer named "collisions". A collision tile layer collides with nothing and
               is drawn like any other layer.
  start        a tile layer named "start" is read as spawn positions (GameMapFrontWrapper
               .getLayerCollisionGrid marks those tiles type 3), so the start marker is a tile;
               but a *collided* tile there spawns the player inside a wall.

`apply()` fixes all three in a map dict; `check()` returns the reasons a map would not load.
Both are pure functions over the parsed JSON, so a generator calls them just before writing:

    from wa_export import apply, check
    apply(tmj)
    errs = check(tmj)
    if errs:
        raise SystemExit("WorkAdventure rules:\\n  " + "\\n  ".join(errs))
"""

FLIP_MASK = 0x1FFFFFFF  # Tiled stores flip/rotate flags in the four high bits of a gid


def _layers(tmj, name=None, type_=None):
    return [l for l in tmj.get("layers", [])
            if (name is None or l.get("name") == name) and (type_ is None or l.get("type") == type_)]


def _next_layer_id(tmj):
    ids = [l.get("id", 0) for l in tmj.get("layers", [])]
    return max([tmj.get("nextlayerid", 1) - 1] + ids) + 1


def _mass_gid(ground):
    seen = {}
    for g in ground:
        if g:
            seen[g] = seen.get(g, 0) + 1
    return max(seen, key=seen.get) if seen else 0


def _tile_entry(tileset, tile_id):
    """The tileset's `tiles` entry for `tile_id`, created if absent, without disturbing anything else."""
    tiles = tileset.setdefault("tiles", [])
    for t in tiles:
        if t.get("id") == tile_id:
            return t
    entry = {"id": tile_id}
    tiles.append(entry)
    tiles.sort(key=lambda t: t["id"])
    return entry


def _set_bool_property(entry, name, value):
    props = entry.setdefault("properties", [])
    for p in props:
        if p.get("name") == name:
            p["type"], p["value"] = "bool", value
            return
    props.append({"name": name, "type": "bool", "value": value})


def _mark_collides(tmj, gids):
    """Set `collides: true` on the tileset tile behind each gid."""
    marked = []
    for ts in tmj.get("tilesets", []):
        low, high = ts.get("firstgid", 1), ts.get("firstgid", 1) + ts.get("tilecount", 0)
        for gid in gids:
            if low <= gid < high:
                local = gid - low
                if ts.get("columns") and ts["columns"] > 0:
                    _set_bool_property(_tile_entry(ts, local), "collides", True)
                    marked.append((ts.get("name"), local))
    return marked


def apply(tmj):
    """Bring a generated map into line with WorkAdventure's reading of it. Returns a list of changes."""
    changes = []

    # -- 1. start: a marker tile must not be a tile that collides --------------------------------
    ground_layers = _layers(tmj, "ground", "tilelayer")
    ground = ground_layers[0]["data"] if ground_layers else []
    fallback = _mass_gid(ground)
    repointed = 0
    for l in _layers(tmj, "start", "tilelayer"):
        for i, g in enumerate(l["data"]):
            if not g:
                continue
            safe = ground[i] if i < len(ground) and ground[i] else fallback
            if safe and safe != g:
                l["data"][i] = safe
                repointed += 1
    if repointed:
        changes.append(f"start: {repointed} marker tile(s) repointed to the ground tile beneath them")

    # -- 2. collisions: a tile layer collides with nothing --------------------------------------
    collision_gids = set()
    collided_cells = set()
    doomed = []
    for l in _layers(tmj, "collisions", "tilelayer"):
        doomed.append(l)
        collision_gids |= {g & FLIP_MASK for g in l["data"] if g}
        collided_cells |= {i for i, g in enumerate(l["data"]) if g}
    # A collided gid is solid wherever it is placed, not only where the collision grid marked it.
    over = []
    for l in _layers(tmj, None, "tilelayer"):
        if l in doomed or l.get("name") == "start":
            continue
        n = sum(1 for i, g in enumerate(l["data"]) if g and (g & FLIP_MASK) in collision_gids and i not in collided_cells)
        if n:
            over.append(f'{l.get("name")} {n}')
    # Do NOT remove the layer. WorkAdventure hides nothing it reads: "A layer hidden in Tiled still
    # collides: maps use one to draw invisible walls" (GameMapFrontWrapper.ts). These generators put
    # walls in this hidden mask and the wall art in another layer, so dropping it would delete collision.
    for l in doomed:
        l["visible"] = False
    if doomed:
        changes.append(f"collisions: {len(doomed)} hidden layer(s) kept as the wall mask, "
                       f"collides set on {len(collision_gids)} gid(s)")
    if over:
        changes.append("collisions: WARNING these tiles are also drawn in visible layers outside the mask and are now solid: "
                       + ", ".join(over))
    if collision_gids:
        _mark_collides(tmj, collision_gids)

    # -- 3. floorLayer: must be an Object Layer -------------------------------------------------
    floor_tile = _layers(tmj, "floorLayer", "tilelayer")
    for l in floor_tile:
        ix = tmj["layers"].index(l)
        keep_art = any(l["data"])
        tmj["layers"].remove(l)
        if keep_art:
            taken = {x.get("name") for x in tmj["layers"]}
            name = next(n for n in ("floor", "floorTiles", "floor-layer") if n not in taken)
            l["name"] = name
            tmj["layers"].insert(ix, l)
            ix += 1
            changes.append(f"floorLayer: its {sum(1 for g in l['data'] if g)} floor tile(s) kept as layer \"{name}\"")
        tmj["layers"].insert(ix, {"id": _next_layer_id(tmj), "name": "floorLayer", "type": "objectgroup",
                                  "x": 0, "y": 0, "opacity": 1, "visible": True,
                                  "draworder": "topdown", "objects": []})
        changes.append('floorLayer: added as an Object Layer (WorkAdventure refuses a tile layer by that name)')

    if not _layers(tmj, "floorLayer", "objectgroup"):
        tmj["layers"].append({"id": _next_layer_id(tmj), "name": "floorLayer", "type": "objectgroup",
                              "x": 0, "y": 0, "opacity": 1, "visible": True,
                              "draworder": "topdown", "objects": []})
        changes.append('floorLayer: added an empty Object Layer')

    tmj["nextlayerid"] = max(tmj.get("nextlayerid", 1), _next_layer_id(tmj))
    return changes


def check(tmj):
    """Everything that would stop this map loading, or would silently misbehave, as plain sentences."""
    errs = []
    if tmj.get("orientation") != "orthogonal":
        errs.append(f"orientation is {tmj.get('orientation')!r}; WorkAdventure requires orthogonal")
    if tmj.get("infinite"):
        errs.append("infinite maps are not supported")
    if not _layers(tmj, "floorLayer", "objectgroup"):
        errs.append('no Object Layer named "floorLayer" (WorkAdventure refuses the map without it)')
    for l in _layers(tmj, "collisions"):
        if l.get("visible") is not False:
            errs.append('the "collisions" layer is visible: WorkAdventure draws it like any other layer; '
                        'hide it in Tiled (a hidden layer still collides)')

    start_tiles = [l for l in _layers(tmj, "start", "tilelayer") if any(l["data"])]
    start_objects = [o for l in _layers(tmj, "start", "objectgroup") for o in l.get("objects", [])]
    start_areas = [o for l in tmj["layers"] if l.get("type") == "objectgroup"
                   for o in l.get("objects", []) if o.get("name") == "start"]
    if not (start_tiles or start_objects or start_areas):
        errs.append('no start position: WorkAdventure needs a tile layer or Object Layer named "start"')
    if len(start_tiles) > 1:
        errs.append(f'{len(start_tiles)} start tile layers; keep one')

    collided = set()
    for ts in tmj.get("tilesets", []):
        if "source" in ts:
            errs.append(f'tileset {ts.get("name")!r} is external (.tsj); WorkAdventure only reads embedded tilesets')
            continue
        if not ts.get("image"):
            errs.append(f'tileset {ts.get("name")!r} has no sheet image (image-collection tilesets do not load)')
        if not ts.get("columns"):
            errs.append(f'tileset {ts.get("name")!r} has columns={ts.get("columns")!r}; a sheet tileset needs columns > 0')
        low = ts.get("firstgid", 1)
        for t in ts.get("tiles") or []:
            for p in t.get("properties") or []:
                if p.get("name") != "collides":
                    errs.append(f'tileset {ts.get("name")!r} tile {t["id"]}: unknown property {p.get("name")!r} '
                                f'(WorkAdventure only reads "collides")')
                elif p.get("type") != "bool":
                    errs.append(f'tileset {ts.get("name")!r} tile {t["id"]}: collides must be a bool')
                elif p.get("value") is False:
                    errs.append(f'tileset {ts.get("name")!r} tile {t["id"]}: collides: false has no effect; omit it')
                elif p.get("value") is True:
                    collided.add(low + t["id"])

    for l in _layers(tmj, "start", "tilelayer"):
        for g in l["data"]:
            if g and (g & FLIP_MASK) in collided:
                errs.append(f'start marker tile {g & FLIP_MASK} is a collided tile: the player would spawn inside a wall')
                break

    if tmj.get("tilewidth") != 32 or tmj.get("tileheight") != 32:
        errs.append(f'tiles are {tmj.get("tilewidth")}x{tmj.get("tileheight")}; WorkAdventure characters are 32x32')
    return errs


def report(tmj, name=""):
    """Print the changes and the errors the way a generator's own check prints."""
    for c in apply(tmj):
        print(f'  wa: {c}')
    errs = check(tmj)
    for e in errs:
        print(f'  WA RULE: {e}')
    return errs
