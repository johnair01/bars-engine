# EA Move Deep-Dive Pages

## ID
`EAM` | Personal Ops | Priority 2.02b

---

## Purpose

Each emotional alchemy move (e.g. `Metal/fear → Metal/peace`) gets a dedicated deep-dive page at `/ea/[channel]-[from]-[to]` so practitioners can:
1. **Read** what the move means, how it works, what it asks of you
2. **Do** the move (micro-prompt to sit with the transformation)
3. **Save** the move to a personal EA moves list for later stewardship

Example URLs:
- `/ea/metal-fear-peace`
- `/ea/earth-stagnation-stability`
- `/ea/fire-anger-warmth`
- `/ea/water-sadness-ease`
- `/ea/wood-envy-purpose`

---

## Page Structure

Each EA move page contains:

### Header
```
[Channel] — [From] → [To]
e.g. Metal — Fear → Peace
```

### The move card
- **Before feeling** — what it feels like physically and mentally
- **After feeling** — what the satisfied state feels like
- **The bridge** — what the practitioner must let go of and what they must embrace

### Micro-prompt
A short exercise: "Sit with [dissatisfied feeling] for 30 seconds. Notice where it lives in your body. Then breathe into [desired feeling]. What shifts?"

### Actions
1. **Do the move** — checkbox to mark completion (persists to localStorage)
2. **Save to my EA moves** — saves to a `saved_ea_moves[]` in localStorage with timestamp
3. **Return to Inquiry** — deep link back to `/inquiry`

---

## Implementation

- Route pattern: `/ea/[slug]` where slug = `${fromChannel}-${fromFeeling}-${toChannel}-${toFeeling}`
- Static generation for all 5 channels × ~4 dissatisfied states × ~4 satisfied states = ~80 pages
- Data source: `CHANNEL_EMOTIONS` map + feeling chip vocabulary
- No auth required (personal tool)
- Phase 2: sync saved moves to bars-engine via API

---

## Backward compatibility

The inquiry page's alchemy step generates the slug and renders the link. If the page doesn't exist yet, show a "coming soon" state with the micro-prompt still visible.