# Handoff: MTGOA Sales Letter ("Charge Rooms")

## Overview
A long-form, direct-response **sales letter** for *Mastering the Game of Allyship* (MTGOA) by Wendell Britt. It is a single, top-to-bottom scrolling page aimed at a cold reader (a burnt-out nonprofit executive). The page's job is recognition before sale: it opens on the reader's exhaustion, reframes her situation as a rigged "game," introduces the author, presents one stacked offer (deck + book + coaching), proves it with testimonials, offers two quiz on-ramps, and closes on a binary choice. **Every CTA routes to the same offer; every quiz routes to the offer. No dead ends.**

The visual concept is **"Charge Rooms"**: the page is dark, but each narrative beat is its own full-bleed, saturated **element-colored room** you scroll through — ember → slate → forest → plum → umber → teal → magenta → dark close. Color signals which beat you're in; the accent is never a single flat red.

## About the Design Files
The files in this bundle are **design references authored in HTML** — a prototype showing intended look, copy, and behavior. They are **not production code to ship directly**. `Sales Letter.dc.html` is written for an internal "Design Component" runtime (a `<x-dc>` template + a `<script data-dc-script>` logic class); treat it as a spec, not a drop-in.

The task is to **recreate this design in the target codebase's environment** (React/Next, Vue, Astro, plain HTML/CSS — whatever the marketing site uses) with that project's established patterns. If no environment exists yet, a static React/Next or Astro page is the natural fit. The four diagrams are the one part that benefits from being ported faithfully (see **Diagrams**).

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, and interactions are all specified below and visible in `/screenshots`. Recreate pixel-close. The copy is final and approved (testimonials are permission-cleared and verified; bio is confirmed). Two values remain intentionally parameterized — see **Open Items**.

---

## Page Structure (top to bottom)

The page is one centered reading column (`max-width: 720px`, `24px` side padding) sitting inside a stack of full-bleed colored `<section>` "rooms." Room vertical padding is fluid: `clamp(70px, 12vh, 120px)` top/bottom (offer/close a bit larger).

| # | Room | Background (top→bottom gradient) | Accent | Screenshot |
|---|------|----------------------------------|--------|-----------|
| — | Hero | `radial-gradient(125% 100% at 50% -10%, #241134, #0b0910 62%)` | magenta `#ff5fa8` | 01 |
| 1 | The Open (ember) | `linear-gradient(180deg, #2a0d06, #180a12)` | ember `#ff8a5c`, punch `#ff6a4d` | 02, 03 |
| 2 | The Lineup (slate) | `linear-gradient(180deg, #12161d, #0d1015)` | slate `#b9c1cb` | 04, 05 |
| 3 | The Turn (forest) | `linear-gradient(180deg, #04220f, #06120b)` | green `#4fe0a0`, `#6fe6b2` | 06, 07 |
| 4 | The Disclosure (plum) | `linear-gradient(180deg, #1c1030, #120a1c)` | orchid `#d9a8f0` | 08 |
| 5 | The Offer (umber) | `radial-gradient(120% 80% at 50% 0%, #2a1704, #160d05 66%)` | gold `#e6b93f` | 09, 10 |
| 6 | The Proof (teal) | `linear-gradient(180deg, #06202a, #0a1418)` | teal `#4fd0e0` | 11 |
| 7 | The On-ramps (magenta) | `linear-gradient(180deg, #1c0f2a, #120a1c)` | magenta `#ff5fa8` / violet `#c77bff` | 12 |
| 8 | The Close (dark) | `radial-gradient(120% 100% at 50% 100%, #1a1030, #0b0910 64%)` | gold `#e6b93f` | 13 |

Page background behind everything: `#0b0910`.

---

## Screens / Views (per room)

### Hero (top)
- **Purpose:** Orient a cold reader — show the book, name the offer, one line of promise, primary CTA.
- **Layout:** Centered flex row, `max-width: 860px`, `gap: 44px`, wraps on narrow. Left: book cover image (`width: 224px`). Right: text column (`min-width: 300px; max-width: 480px`). A large blurred radial "charge bloom" sits behind, centered top: `640×420px`, `radial-gradient(ellipse, rgba(255,95,168,.30), rgba(34,211,238,.14) 52%, transparent 76%)`, `filter: blur(16px)`, breathing opacity animation.
- **Book image:** `assets/book/cover-front.png`. Tilted `perspective(1200px) rotateY(-15deg) rotateX(3deg)`, `border-radius: 3px 8px 8px 3px`, `drop-shadow(0 30px 54px rgba(0,0,0,.7))`, gentle float animation (±11px, 7.5s). A 10px dark gradient strip on the right edge fakes the page block.
- **Components:**
  - Eyebrow: `Field guide · Oracle deck · Coaching` — mono, `11.5px`, `letter-spacing: .3em`, uppercase, `700`, color `#ff5fa8`.
  - H1: "The game you were handed was never built for you to win." — display, `700`, `clamp(30px,5.4vw,42px)`, `line-height:1.07`, `letter-spacing:-.022em`, `#fff`.
  - Sub: "So let's design one that is — allyship rebuilt around your real strengths and your actual, un-apologized-for joy." — `clamp(16px,2.3vw,18.5px)`, `line-height:1.55`, `#cfc9d6`.
  - Primary CTA (`→ #offer`): "Start the game →" — display `700` `16px`, text `#0c0910`, `background: linear-gradient(135deg,#ff5fa8,#e6b93f)`, `padding:15px 30px`, `border-radius:12px`, `box-shadow:0 16px 38px -14px rgba(255,95,168,.7)`; hover `translateY(-2px)`.
  - Secondary (`→ #quizzes`): "or take the quiz" — mono `12px`, `#b6aec2`, underline hairline.
  - *(Note: an earlier row of five Wuxing characters 火水木金土 was intentionally removed — do not re-add.)*

### Room 1 — The Open (ember)
- **Purpose:** Recognition. Long empathetic prose ending on the thesis.
- **Layout:** Single reading column. Ends with a centered diagram figure.
- **Key type:**
  - Kicker `01 · The open` — mono, ember `#ff8a5c`.
  - Opening line "You started this work for a reason." — display `600`, `clamp(26px,4.8vw,40px)`, `#ffe7d8`.
  - Body paragraphs — `clamp(17px,2.4vw,19.5px)`, `line-height:1.64`, `#d6c8c0`; inline `<em>` emphasis in `#ffcdb8`.
  - The punch "You are not failing at this." — display `700`, `clamp(32px,6.4vw,56px)`, `line-height:1.02`, color `#ff6a4d`.
  - Follow line — `clamp(18px,2.6vw,22px)`, `#ffe0d2`.
- **Diagram:** THE LOOP (fire). Caption mono `#c98a6a`: "The game you were handed. It was never designed to close." (screenshot 03)

### Room 2 — The Lineup (slate)
- Kicker `02 · The lineup` slate `#b9c1cb`. H2 "Look at everyone who's tried to help." display `700`, `clamp(28px,5vw,42px)`, `#e6eaf0`. Body `#c0c5ce`, `<em>` `#e6eaf0`.
- **Diagram:** THE LINEUP (metal). Caption `#9aa4b0`. (screenshot 05)

### Room 3 — The Turn (forest)
- Kicker `03 · The turn` green `#4fe0a0`. Lead paragraph `#dcefe4`. Body `#bcd6c8`.
- Big line "You've now hit enough dissatisfaction to suspect there has to be a better way." display `600`, `clamp(24px,4.4vw,36px)`, `#eafff4`.
- Payoff "Care by design. / Not out of social obligation." display `700`, `clamp(26px,4.8vw,40px)`; "Care by design." in `#6fe6b2`, second line `#eafff4`.
- **Diagram:** THE SPIRAL (wood/green). Caption `#5db98c`: "The game you design. It's built to open." (screenshot 07)
- Closing "waking up inside something someone else built" paragraph follows the figure.

### Room 4 — The Disclosure (plum)
- **Purpose:** Meet Wendell; disarm the skeptic; bio; anchor testimonial.
- **Layout:** `max-width: 820px`. A two-column flex row (text `flex:1; max-width:520px` + a `260px` portrait figure), then a `max-width: 640px` full-width prose block below.
- Kicker `04 · The disclosure` `#d9a8f0`. H2 "Now — I should say this before you do." display `700`, `clamp(26px,4.6vw,38px)`, `#f0e6fa`. Body `#cbc2d8`, `<em>` `#ecd9f6`.
- **Portrait:** a fillable image slot, `aspect-ratio: 4/5`, `border-radius:16px`, border `1px rgba(217,168,240,.25)`, `box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 24px 50px -24px rgba(0,0,0,.8)`. Placeholder copy: "Drop a candid photo of Wendell — mid-sentence, not a headshot." Caption below (mono, `#a48ec0`): "Wendell Britt · in the middle of it". **In production, replace with a real `<img>` of Wendell.**
- **Anchor testimonial** (blockquote): left border `2px #d9a8f0`, background `linear-gradient(120deg, rgba(217,168,240,.10), rgba(217,168,240,.02))`, `border-radius: 0 12px 12px 0`, `padding: 26px 30px`. Quote italic `clamp(17px,2.4vw,20px)` `#efe7f6`; cite mono `#a48ec0`.

### Room 5 — The Offer (umber) — `id="offer"`
- **Purpose:** The single stacked offer. Three pieces + convergence diagram + primary CTA.
- Centered header: kicker `05 · What this actually is` gold `#e6b93f`; H2 "Three things, built to work as one." display `700`, `clamp(28px,5.2vw,44px)`, `#f5e2b0`.
- **Three stacked cards** (`max-width: 760px`, vertical `gap: 18px`):
  - The Deck & The Book — neutral cards: `background: rgba(20,14,6,.6)`, border `1px rgba(230,185,63,.2)`, `border-radius:16px`, `padding:28px 30px`, `inset 0 1px 0 rgba(255,255,255,.05)`. Label mono gold `#e6b93f` + sub-label `#8a7440`. Body `#cfc2a4`.
  - Coaching — highlighted card: `background: linear-gradient(150deg, rgba(230,185,63,.16), rgba(230,185,63,.03))`, border `1px rgba(230,185,63,.5)`, glow `0 0 34px -14px rgba(230,185,63,.6)`. Top-right pill "Go all the way" (`background: linear-gradient(135deg,#ffe08a,#e6b93f)`, text `#12100e`). Body `#e2d3ac`. **This card is conditionally shown** (see State).
- **Diagram:** THE ROAD (gold, yellow-brick-road convergence). Caption `#c9a45a`.  (screenshot 10)
- **Primary CTA** (centered, `→ offerHref`): "Start the game →" display `700`, `clamp(18px,2.6vw,21px)`, text `#12100e`, `background: linear-gradient(135deg,#ffe08a,#e6b93f 55%,#c07a1e)`, `padding:19px 44px`, `border-radius:13px`, `box-shadow:0 18px 44px -16px rgba(230,185,63,.8)`.

### Room 6 — The Proof (teal)
- Kicker `06 · What actually happens` teal `#4fd0e0`. H2 "Here's what I'll stand behind." `#d6f2f6`.
- Two "results" body paragraphs (`#b6cdd2`), then a display transition line "You don't have to take my word for any of it. Take theirs." (`600`, `clamp(20px,3.4vw,26px)`, `#d6f2f6`).
- **Four testimonial blocks**, vertical `gap: 30px`. Each: a mono teal claim-label (`#4fd0e0`, `letter-spacing:.15em`, uppercase) above a card blockquote: `background: rgba(8,26,34,.6)`, border `1px rgba(79,208,224,.18)`, `border-radius:12px`, `padding:22px 26px`, `inset 0 1px 0 rgba(255,255,255,.05)`; quote italic `clamp(16px,2.3vw,18.5px)` `#daf0f4`.
- Closing "That last one is the tell…" paragraph.

### Room 7 — The On-ramps (magenta) — `id="quizzes"`
- Kicker `07 · Two on-ramps` `#ff5fa8`. H2 "Not ready to buy a thing from a man promising fun. Fair. Play instead." `#f6e0ee`.
- **Two link cards**, responsive grid `repeat(auto-fit, minmax(300px, 1fr))`, `gap:20px`. Card: `background: rgba(24,14,34,.6)`, border `1px rgba(255,95,168,.28)`, `border-radius:16px`, `padding:30px 30px 26px`. A `120px` radial glow in the top-right corner (magenta on card 1, violet `rgba(168,85,247,.28)` on card 2). Hover: `translateY(-4px)`, border→`rgba(255,95,168,.6)`, glow shadow.
  - Card 1 → `Superpower Quiz.dc.html`: label "Quiz 01 · the flip" `#ff5fa8`, title "The Superpower Quiz", CTA "Find your superpower →" `#ff77b6`.
  - Card 2 → `Myths Read.dc.html`: label "Quiz 02 · the mirror" `#c77bff`, title "The Myths Quiz", CTA "Name the myth →" `#c77bff`.
- **This entire room is conditionally shown** (see State). In production, link to the real quiz routes.

### Room 8 — The Close (dark) — `id="close"`
- Centered. Kicker `08 · The close` gold `#e6b93f`.
- Fair-warning: two body paragraphs (`#bdbac6`, `max-width:600px`) + a display line "This is for the version of you that's already done pretending the current setup is working." (`600`, `clamp(20px,3.6vw,28px)`, `#f4f1ea`).
- **Diagram reprise:** the LOOP (small) → an arrow `→` → the SPIRAL (small), side by side, `max-width:440px`, each `max-width:150px`, `opacity:.9`.
- H2 "So here's the only real question." `#f4f1ea`. Two binary paragraphs.
- "But it is your one, aggressively non-refundable life." display `600`, `clamp(22px,4vw,32px)`, `#f4f1ea`.
- Final punch "You might as well have fun in it." display `700`, `clamp(30px,6vw,52px)`, gold `#e6b93f`.
- Final CTA (gold, → `offerHref`) + secondary "or just take the quiz" (→ `#quizzes`).

### Footer
Centered row: small logo (`assets/logo/mtgoa-logo-transparent.png`, 26px, `drop-shadow(0 0 8px rgba(255,95,168,.4))`) + mono caption "Mastering the Game of Allyship · © Wendell Britt" (`#6b6965`). Top border `1px rgba(255,255,255,.06)`.

---

## Diagrams (the one thing to port faithfully)
Four animated SVGs, each generated programmatically (see the logic class in `Sales Letter.dc.html`, methods `mkLoop / mkSpiral / mkLineup / mkRoad`). Each draws on a `viewBox` and scales to `width:100%`. All honor `prefers-reduced-motion`. Element colors: fire `#ef6a4d`, wood/green `#4fe0a0`, teal `#2fd3d0`, gold `#e6b93f`, metal `#b9c1cb`. Each stroke carries `filter: drop-shadow(0 0 5px rgba(<rgb>,.55))`.

1. **THE LOOP** (fire, `viewBox -10 -10 440 400`) — a closed rounded-triangle ring (`M210 56 Q364 150 338 288 Q210 366 82 288 Q56 150 210 56 Z`) with a slow circulating dash (`stroke-dasharray:9 21`, `@keyframes loopFlow { to { stroke-dashoffset:-300 } }`, 3.4s linear infinite), a small lemniscate "knot" at center, three inward arrowheads, three node dots, and mono labels TRY HARDER / FALL SHORT / NOT ENOUGH. **Meaning:** the rigged game that never closes.
2. **THE SPIRAL** (wood/green) — an Archimedean spiral (`r = 7 + 8.9·θ`, ~2.65 turns) that threads the same knot and opens outward to an arrowhead. Animated outward "release" dash (`stroke-dasharray:70 520`, `@keyframes spiralFlow { from{stroke-dashoffset:590} to{stroke-dashoffset:0} }`, 3.8s). **Meaning:** the game you design; it opens. (The loop + spiral are a matched pair; they reprise small in the Close.)
3. **THE LINEUP** (metal, `viewBox 0 0 470 285`) — four labeled node dots (THERAPIST / COACH / CONSULTANT / LUNCH) across a top arc, each with a **dashed line pointing inward but stopping short** of a central dashed circle labeled "A MOVE?". **Meaning:** everyone surrounds her; the center — an actual move — stays empty.
4. **THE ROAD** (gold, `viewBox 0 0 470 285`) — three labeled starts (DECK / BOOK / COACHING) whose curves **converge** to a merge point, from which a perspective "brick road" of rungs recedes to a glowing horizon node. **Meaning:** three things → one paved road (the Yellow Brick Road motif).

Port these as inline SVG (React components or framework equivalents). Exact coordinate math is in the logic class — copy it.

---

## Interactions & Behavior
- **In-page anchors:** hero + close CTAs scroll to `#offer`; "take the quiz" links scroll to `#quizzes`. In production these become smooth-scroll or real routes.
- **Buy buttons** (`Start the game →`, both the offer and close) point at `offerHref` — wire to the real checkout/pre-order URL.
- **Quiz cards** link to the two quiz experiences (`Superpower Quiz.dc.html`, `Myths Read.dc.html` here → real quiz routes in prod).
- **Hover:** CTAs lift `translateY(-2px)`; quiz cards lift `translateY(-4px)` + brighten border/glow. Transition ~`.18s`.
- **Ambient animation:** hero bloom breathes (opacity 0.4↔0.78, 9s); book floats (±11px, 7.5s); the loop and spiral diagrams animate their dash flow continuously. All disabled under `prefers-reduced-motion`.
- **Responsive:** everything is fluid — one centered column, `clamp()` type, flex rows that wrap (hero, disclosure), and an `auto-fit` grid for the quiz cards. Reads cleanly on mobile. No fixed desktop width.

## State Management
Three parameters (in the prototype they are component props / tweaks; in production make them config or CMS fields):
- `offerHref` (string, default `#offer`) — destination for all buy buttons.
- `includeCoaching` (boolean, default `true`) — show/hide the Coaching card in the Offer room.
- `showQuizzes` (boolean, default `true`) — show/hide the entire On-ramps room.

No data fetching. The page is static content.

## Design Tokens
**Element accents:** fire `#ef6a4d` / ember `#ff8a5c` / punch `#ff6a4d`; wood/green `#4fe0a0` `#6fe6b2`; teal `#4fd0e0` / `#2fd3d0`; gold `#e6b93f` / `#ffe08a` / `#c07a1e`; metal/slate `#b9c1cb`; plum/orchid `#d9a8f0`; magenta `#ff5fa8`; violet `#c77bff`.
**Room backgrounds:** see the table above. Page base `#0b0910`.
**Text:** headings `#f4f1ea`/`#fff` and room-tinted lights; body ~`#bdbac6` room-tinted; mono micro-labels room-accent colored.
**Type families** (from the BARS Engine design system tokens in `_ds/…/tokens/`):
- Display / headings & chrome: **Jost** (`--bars-font-display`), tight tracking `-0.02em`.
- Body / prose: **Nunito** (`--bars-font-body`), line-height ~1.62.
- Mono / micro-labels & captions: **Space Mono** (`--bars-font-mono`), uppercase, `letter-spacing` .13–.3em.
**Type scale:** fluid via `clamp()` — body `clamp(17px,2.4vw,19.5px)`; section H2 `clamp(28px,5vw,42px)`; big punches up to `clamp(30–32px, 6–6.4vw, 52–56px)`; micro-labels 11–12.5px.
**Radii:** cards 16px; CTAs 12–13px; blockquotes 12px; book cover `3px 8px 8px 3px`.
**Shadows:** CTA `0 16–18px 38–44px -14…-16px rgba(accent,.7–.8)`; cards `inset 0 1px 0 rgba(255,255,255,.05)` (the load-bearing top highlight from the BARS system); elevated portrait `0 24px 50px -24px rgba(0,0,0,.8)`.
**Motion easing:** the BARS default `cubic-bezier(0.16,1,0.3,1)` for lifts; linear for diagram dash flow.

## Assets
- `assets/book/cover-front.png` — the book cover (colorful neon; carries the page's whole palette). Included in this bundle.
- `assets/logo/mtgoa-logo-transparent.png` — footer logo mark. Included.
- **Wendell portrait** — NOT included; the Disclosure room has a placeholder slot. Supply a real candid, ~4:5.
- Fonts (Jost, Nunito, Space Mono) load from the BARS design-system token CSS; in production use your own webfont setup or Google Fonts equivalents.

## Files
- `Sales Letter.dc.html` — the design source (template + logic class). Reference for exact copy, styles, and the four diagram generators.
- `screenshots/01–13-room.png` — rendered reference of each room / diagram, in scroll order (01 hero → 13 close).

## Open Items (business, not design)
- Real `offerHref` (checkout / pre-order URL).
- Real quiz routes for the two on-ramp cards.
- Phase-B quiz *content* (superpower + myths result logic) is a separate build.
- Wendell portrait photo.
