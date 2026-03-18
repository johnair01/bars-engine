# Feasibility: YouTube Embed in BAR Pane

## Question

How much energy and time would it take to embed YouTube links in the BAR pane (shared view and BAR detail) instead of showing them as plain links?

## Auto-shift: Any YouTube link → embed

**Yes.** When someone pastes a YouTube link (youtube.com/watch?v=..., youtu.be/..., or any supported format), we detect `platform === 'youtube'` from the URL and render the embed. No extra step needed — the stored URL is used to extract the video ID and show the iframe. Plain links and embeds are the same data; we just change how we render based on platform.

## Assessment

### Effort: **Low — ~1–2 hours**

### Why it's straightforward

1. **Platform detection already exists** — `src/lib/bar-social-links.ts` detects YouTube via `youtube.com` and `youtu.be` patterns. `BarSocialLinks` already receives `platform` and `url`.

2. **Video ID extraction is simple** — Two patterns:
   - `youtube.com/watch?v=VIDEO_ID`
   - `youtu.be/VIDEO_ID`
   - Embed URL: `https://www.youtube.com/embed/VIDEO_ID`

3. **Single component change** — Add a `YouTubeEmbed` (or `SocialLinkEmbed`) that, when `platform === 'youtube'`, renders an iframe instead of a link. Fallback to link if URL parsing fails.

4. **No backend work** — Client-side only. No oEmbed, no API calls.

### Implementation sketch

```tsx
// In BarSocialLinks or new BarSocialLinkEmbed.tsx
function getYouTubeVideoId(url: string): string | null {
  const m1 = url.match(/[?&]v=([^&]+)/)
  const m2 = url.match(/youtu\.be\/([^?&]+)/)
  return m1?.[1] ?? m2?.[1] ?? null
}

// For platform === 'youtube' and valid videoId:
<iframe
  src={`https://www.youtube.com/embed/${videoId}`}
  title="YouTube video"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  className="aspect-video w-full rounded-lg"
/>
```

### Considerations

| Topic | Note |
|-------|------|
| **Security** | YouTube embed is same-origin sandboxed. Use `allow` attribute to limit capabilities. No user-defined iframes. |
| **Layout** | 16:9 aspect ratio; responsive. May want collapsible/expand for multiple videos. |
| **Other platforms** | Spotify, Instagram, Vimeo have different embed models. YouTube is the easiest. Could phase: YouTube first, others later. |
| **Performance** | Each iframe adds ~1–2 network requests. Lazy-load or show on expand if many links. |

### Recommendation

- **Phase 1**: YouTube embed only — ~1–2 hours. Add `getYouTubeVideoId`, conditional render in `BarSocialLinks`.
- **Phase 2** (optional): Spotify embed (oEmbed or iframe), Vimeo — each ~30–60 min.
- **Phase 3** (optional): Lazy-load embeds, collapsible when >2 links.

## Separate platform buttons (design decision)

**Preferred UX**: Replace the single "Add link" input with **separate buttons per platform** — "Add YouTube", "Add Spotify", "Add Instagram". Benefits:

- **Guaranteed platform** — User picks YouTube → we know it's YouTube; no mis-detection from URL parsing.
- **Per-platform validation** — Each button opens a field with platform-specific placeholder and validation.
- **Easier to verify** — Test YouTube embed, Spotify embed, Instagram link independently.
- **Clearer affordance** — Users see exactly what's supported.

Implementation: `BarSocialLinksForm` shows three (or more) buttons; clicking "Add YouTube" expands a URL field that validates against YouTube patterns and stores `platform: 'youtube'`. Same for Spotify, Instagram. Max links per bar still applies (e.g. 5 total across all platforms).

### Files to touch

- `src/components/bars/BarSocialLinks.tsx` — add embed branch for YouTube
- `src/components/bars/BarSocialLinksForm.tsx` — replace generic add with platform-specific buttons
- `src/lib/bar-social-links.ts` — add `getYouTubeVideoId(url: string): string | null` (optional; could inline)
