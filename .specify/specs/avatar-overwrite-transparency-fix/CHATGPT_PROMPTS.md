# ChatGPT Prompts for Base-Aligned Avatar Overlays

**Purpose**: Generate nation and archetype sprites that layer correctly over the base avatar. Overlays must be **partial** (clothing/badge only), not full characters. Transparent everywhere except the overlay content.

**Critical constraints**:
- 64×64 px PNG
- Transparent background
- Content fits overlay region only (see base-silhouette.json)
- Face and neck areas = fully transparent (base shows through)
- 1px black outline (Stardew style)
- Center-bottom registration (align to base)

---

## Base layer reference (for context)

Include this when prompting so the AI understands the underlying structure:

```
The base avatar is a 64×64 pixel art character bust: front-facing, Stardew Valley style, 
center-bottom anchor. Overlay regions:
- Torso/vest: approximately pixels (17,24) to (45,57) — 28×33 px
- Badge/accent: approximately (27,32) — 8×8 px small emblem
Face and neck (upper ~40px, centered) must remain TRANSPARENT in overlays so base shows through.
```

---

## Nation overlays

### nation_body (clothing/torso only)

**Template**:
```
64×64 pixel art OVERLAY ONLY — clothing/vest region. NOT a full character.
- Transparent background everywhere except the vest/collar/shoulders
- Face (upper center), neck, and all areas outside the torso region must be FULLY TRANSPARENT
- Content fits a 28×33 px region roughly centered on the torso (pixels 17–45 x, 24–57 y)
- [NATION-SPECIFIC]: [description]
- Stardew Valley style, 1px black outline
- PNG, 64×64
```

**Per-nation**:

| Nation | Insert for [NATION-SPECIFIC] |
|--------|------------------------------|
| Argyra | Silver metallic collar and shoulders, precise geometric lines, Argyra metal nation |
| Pyrakanth | Flame-orange vest or shoulders, burning garden aesthetic, Pyrakanth fire nation |
| Virelune | Leaf-green vest or vine-trimmed shoulders, organic growth, Virelune wood nation |
| Meridia | Earth-toned golden-brown vest, midday sun aesthetic, Meridia earth nation |
| Lamenth | Water-blue flowing collar or crystalline shoulders, tear-like elegance, Lamenth water nation |

### nation_accent (small badge only)

**Template**:
```
64×64 pixel art SMALL BADGE/EMBLEM ONLY. NOT a full character.
- Transparent background everywhere except a small 8×8 px motif
- Motif centered roughly at (27,32) — chest area
- [NATION-SPECIFIC] small geometric badge or emblem
- Stardew Valley style, 1px black outline
- PNG, 64×64
```

**Per-nation**:

| Nation | Insert for [NATION-SPECIFIC] |
|--------|------------------------------|
| Argyra | Small geometric badge, silver emblem, Argyra metal |
| Pyrakanth | Small flame or ember motif, Pyrakanth fire |
| Virelune | Small leaf or vine motif, Virelune wood |
| Meridia | Small sun or balance motif, Meridia earth |
| Lamenth | Small water droplet or crystalline tear motif, Lamenth water |

---

## Playbook (archetype) overlays

### playbook_outfit (clothing/torso only)

**Template**: Same as nation_body, but with archetype theme:

```
64×64 pixel art OVERLAY ONLY — clothing/vest region. NOT a full character.
- Transparent background everywhere except the vest/collar/shoulders
- Face, neck, and areas outside torso = FULLY TRANSPARENT
- Content fits 28×33 px torso region (centered)
- [ARCHETYPE-SPECIFIC]: [description]
- Stardew Valley style, 1px black outline
- PNG, 64×64
```

**Per-archetype**:

| Archetype | Insert for [ARCHETYPE-SPECIFIC] |
|-----------|----------------------------------|
| Bold Heart | Crimson red vest, heart-themed shoulders, bold creative energy |
| Devoted Guardian | Soft blue vest, protective shoulders, nurturing guardian |
| Decisive Storm | Purple vest with lightning accents, decisive bold |
| Danger Walker | Earth-toned brown vest, wilderness-trimmed, fluid adventurer |
| Still Point | Dark slate vest, mountain-inspired shoulders, calm centered |
| Subtle Influence | Lavender vest, gentle wind-inspired |
| Truth Seer | Golden-amber or forest-green vest, radiant clarity |
| Joyful Connector | Warm orange vest, sunlit shoulders, joyful connection |

### playbook_accent (small badge only)

**Template**: Same as nation_accent, archetype motif.

**Per-archetype**:

| Archetype | Motif |
|-----------|-------|
| Bold Heart | Small heart or crimson badge |
| Devoted Guardian | Small shield or protective emblem |
| Decisive Storm | Small lightning bolt or storm motif |
| Danger Walker | Small wave or path motif |
| Still Point | Small mountain or anchor motif |
| Subtle Influence | Small feather or breeze motif |
| Truth Seer | Small eye or flame motif |
| Joyful Connector | Small sun or link motif |

---

## Post-generation checklist

After generating with ChatGPT (or DALL-E, etc.):

1. **Resize** to exactly 64×64 if needed: `convert input.png -resize 64x64 output.png`
2. **Verify transparency**: Open in image editor; check that face/neck/background are transparent (alpha=0)
3. **Test stacking**: Upload to `/admin/avatars/assets`, assign nation+archetype, confirm layers composite
4. **Fix if needed**: Use placeholder output from `npm run sprites:nation-placeholders` as reference for correct shape
