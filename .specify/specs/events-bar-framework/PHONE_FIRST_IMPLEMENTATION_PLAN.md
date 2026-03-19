# Phone-First / Text-Primary Implementation Plan

**Context**: Following Partiful's lead — phone number as primary identity, SMS/text as primary notification channel. This is a major shift from email-first. Plan includes: (1) migration of existing players to text, (2) Partiful research and reverse-engineering, (3) cited user/developer/reviewer feedback.

**Status**: Planning. Not yet implemented.

---

## 1. Partiful Development History & Feature Emergence

### Founding & Early Strategy (2020–2021)

**Sources**: [Wikipedia](https://en.wikipedia.org/wiki/Partiful), [Business Insider](https://www.businessinsider.com/andreessen-horowitz-benchmark-partiful-event-startup-tech-2022-11), [Crunchbase](https://www.crunchbase.com/funding_round/partiful-series-a--c30faa26)

- **Founded 2020** by Joy Tao and Shreya Murthy (met at Palantir)
- **Motivation**: Shreya found it hard to make friends after college; parties as low-stakes relationship builders ([YouTube: Beyond the RSVP](https://www.youtube.com/watch?v=I0HLnRc-wfM))
- **Launch**: Web-first during COVID-19 — *not* mobile app. Lean approach for rapid iteration and early feedback without app-store friction
- **Core design**: SMS-based invitations; guests could participate **without account or app** — link share, text blast, RSVP via web

### Key Product Decisions (What Made Features Emerge)

| Decision | Rationale (from public sources) | Citation |
|----------|--------------------------------|----------|
| **Web-first, not app-first** | Remove friction; iterate fast; no app download for guests | [Wikipedia](https://en.wikipedia.org/wiki/Partiful), founder interviews |
| **SMS as primary invite channel** | "Text blast updates" — hosts message guests directly; higher open rates than email | [Partiful Help: What are guest phone numbers used for?](https://help.partiful.com/hc/en-us/articles/26505680245275-What-are-guest-phone-numbers-used-for) |
| **Phone number required for RSVP** | Even email-invited guests must verify with phone to RSVP. Unifies identity and enables SMS reminders | [Partiful Help: How do I RSVP?](https://help.partiful.com/hc/en-us/articles/34230743189787-How-do-I-RSVP-to-an-event-on-Partiful) |
| **No app required for guests** | "Invite anyone with a link — guests don't need the app!" | [Partiful FAQ](https://partiful.com/faq/ig), [Google Play](https://play.google.com/store/apps/details?id=com.partiful.partiful) |
| **Auto-reminders via SMS** | "Going" → 2h before; "Maybe"/non-responders → 2 weeks, 1 week, 1 day before. Toggle on/off | [Partiful Help: What event reminders do you send?](https://help.partiful.com/hc/en-us/articles/24470120681115-What-event-reminders-do-you-send) |
| **Text Blasts** | Hosts send custom SMS to guests; can edit after sending; target groups (e.g. haven't RSVP'd) | [Partiful Help: Messaging Guests](https://help.partiful.com/hc/en-us/sections/27223770956187--Messaging-Guests) |
| **iMessage / WhatsApp** | Delivery via SMS, iMessage, or WhatsApp depending on country | [Partiful Help: Event reminders](https://help.partiful.com/hc/en-us/articles/24470120681115-What-event-reminders-do-you-send) |

### Growth Timeline

| Year | Milestone | Source |
|------|-----------|--------|
| 2020 | Launched (web) | Wikipedia |
| 2021 | Gaining traction | Wikipedia |
| 2022 | $20M Series A (a16z), "Facebook Events for hot people" / "Eventbrite for Gen Z" | Business Insider, TechCrunch |
| 2023 | Millions of active users | Wikipedia |
| 2024 | iOS + Android apps; **Google Best App of 2024**; Apple Editor's Choice | [Partiful Year in Review](https://partiful.com/blog/post/2024-year-in-review) |
| 2025 | Time 100 Most Influential Companies; 100+ countries | Wikipedia |

---

## 2. Partiful Features to Reverse-Engineer (Most Mature)

### A. Phone-First Identity & RSVP Verification

**How it works** ([Partiful Help](https://help.partiful.com/hc/en-us/articles/34230743189787-How-do-I-RSVP-to-an-event-on-Partiful)):
1. Guest clicks event link (web or app)
2. Clicks "Going" / "Maybe"
3. **Prompted for name + phone number**
4. Receives verification code via SMS
5. Enters code → RSVP confirmed
6. Can then see event details, comment, etc.

**Why it matters**: Phone = canonical identity. Email invite is delivery mechanism; phone is verification. Enables SMS reminders and text blasts.

### B. Text Blasts (Host → Guests)

**Capabilities** ([Partiful Help: Messaging](https://help.partiful.com/hc/en-us/sections/27223770956187--Messaging-Guests)):
- Edit after sending
- Target: haven't RSVP'd, individual, post-event
- Include photos
- Max blasts per event (rate limit)
- Content restrictions (abuse prevention)

### C. Auto-Reminders (System → Guests)

**Schedule** ([Partiful Help](https://help.partiful.com/hc/en-us/articles/24470120681115-What-event-reminders-do-you-send)):
- **Going**: 2 hours before
- **Maybe / non-responders**: 2 weeks, 1 week, 1 day before
- Toggle on/off per event
- Only to invited users who are signed up; delivery via SMS / iMessage / WhatsApp / push

### D. Invite Methods: Phone vs Email

**From Partiful Help** ([Do I need phone or email?](https://help.partiful.com/hc/en-us/articles/28140825325595-Do-I-need-to-have-my-guests-phone-numbers-or-emails-in-order-to-invite-them-to-an-event)):
- **Phone**: Sync contacts; guests get text with link
- **Email**: Manual add or bulk upload (spreadsheet); up to 500 via email, 1000 total
- **Critical**: Even email-invited guests must **log in with phone number to RSVP**

---

## 3. User & Reviewer Citations (No Hallucination)

### Positive Feedback

| Source | Quote / Summary | Link |
|--------|-----------------|------|
| **NYT Wirecutter** | Staff pick; "quirky, vibey aesthetic"; "doesn't feel overly formal" | [Wirecutter review](https://www.nytimes.com/wirecutter/reviews/partiful-app-review/) (paywall) |
| **HmmThis (Gen Z reviewer)** | "Cutest party app"; "absolutely stunning" design; "Pinterest aesthetic"; "chill, colorful, playful"; "for EVERYTHING" — birthdays, dinners, "Chips & Chill Night"; "I literally smiled while using it" | [hmmthis.com](https://www.hmmthis.com/p/cutest-party-genz-app-review-partiful) |
| **Product Hunt** | 3.9 stars; "user-friendly interface and brilliant UX"; "simplicity and effectiveness"; "easy event organization" | [Product Hunt](https://www.producthunt.com/products/partiful/reviews) |
| **Google Play** | 4.8 stars, 16.4K reviews; Best App of 2024 | [Google Play](https://play.google.com/store/apps/details?id=com.partiful.partiful) |
| **Avi Rajendra-Nicolucci (Medium)** | Friction log; "Creating an event on here feels exciting"; "simple UI and cheery colors"; "satisfying"; Party Genie, Find-a-Time, polling praised; "auto-reminder function wonderful for forgetful people"; UX score 8.7/10 | [Medium](https://avirn.medium.com/partiful-friction-log-a4ff841902f2) |

### Pain Points (What to Avoid)

| Source | Issue | Link |
|--------|-------|------|
| **JustUseApp** | App crashes (non-English keyboards, date/time edit); confusing date selection; persistent notification badges; **privacy: requests full calendar access** | [JustUseApp](https://justuseapp.com/en/app/1662982304/partiful/reviews) |
| **Medium friction log** | Date setting UI confusing (month vs day); polling needs built-in calendar | [Medium](https://avirn.medium.com/partiful-friction-log-a4ff841902f2) |
| **Product Hunt** | Some: "data privacy" concerns; design "snobby" | [Product Hunt](https://www.producthunt.com/products/partiful/reviews) |
| **TechCrunch 2025** | Photo GPS metadata not stripped — privacy incident | [TechCrunch](https://techcrunch.com/2025/10/04/event-startup-partiful-wasnt-stripping-gps-locations-from-user-uploaded-photos/) |

---

## 4. BARS Schema: Current State

**Player model** ([prisma/schema.prisma](prisma/schema.prisma)):
```prisma
contactType   String   // e.g. "email" | "phone"
contactValue  String   // e.g. "user@example.com" | "+15551234567"
@@unique([contactType, contactValue])
```

- **Account** links to Player via `accountId`; Account has `email`
- **Invite flow**: Historically email-based (Invite token, signup)
- **Resolve recipient**: `resolveRecipient` in campaign-invitation.ts looks up by email, contactValue, or name

**Gap**: No `phone` or `phoneNumber` field; `contactType`/`contactValue` can hold phone but it's not first-class. No SMS provider integration. No notification preference.

---

## 5. Migration Plan: Existing Players to Text

### Phase 1: Schema & Preference (No Breaking Changes)

| Task | Details |
|------|---------|
| Add `notificationChannel` | `Player.notificationChannel String?` — `email` \| `sms` \| `both`; default `email` for existing |
| Add `phoneNumber` | `Player.phoneNumber String?` — E.164 format; optional; unique when set |
| Keep `contactType`/`contactValue` | Continue to support email; add `phone` as valid contactType |
| Migration script | Backfill: existing players keep `contactType: email`; `notificationChannel: email` |

### Phase 2: Opt-In Phone Collection

| Task | Details |
|------|---------|
| Profile / Settings | "Add phone number" — optional; verify via SMS code (Twilio/etc.) |
| On next BAR receive | "Get event reminders by text? Add your number" — soft prompt |
| On event invite accept | "We'll text you reminders. Add phone?" — contextual |
| Invite flow | New invites: support phone number as recipient (like Partiful contact sync) |

### Phase 3: SMS as Primary (When Ready)

| Task | Details |
|------|---------|
| Notification routing | If `notificationChannel === 'sms'` or `phoneNumber` set → SMS first |
| Fallback | No phone → email. No email → in-app only |
| Deprecation path | Eventually: "Email reminders are being phased out. Add your number to keep getting reminders." |

### Migration Communication

- **Existing players**: Email announcement; in-app banner; no forced migration
- **New players**: Phone-first signup option (like Partiful); email as fallback
- **Event hosts**: "Invite by phone number" — sync contacts or manual add

---

## 6. Technical Implementation: SMS Provider

| Option | Pros | Cons |
|--------|------|-----|
| **Twilio** | Mature, global, verify API | Cost per SMS |
| **SendGrid** | May have SMS | Less SMS-focused |
| **Resend** | Modern API | Email-focused |
| **Partiful** | Uses SMS/iMessage/WhatsApp by country | Not a provider; they use a provider |

**Recommendation**: Twilio for verify + SMS. Document in `docs/ENV_AND_VERCEL.md`; `TWILIO_*` env vars.

---

## 7. Partiful Feature Parity (Target)

| Feature | Partiful | BARS Target |
|---------|----------|-------------|
| Phone for RSVP | Required | Required for event RSVP when SMS primary |
| Text blast (host → guests) | Yes | Phase 2: event organizers message attendees |
| Auto-reminders | 2h / 2w / 1w / 1d | Same schedule; configurable |
| No app for guests | Link works in browser | BAR share link already works |
| Invite by phone | Contact sync | Add: resolve by phone, invite by phone |
| iMessage / WhatsApp | By country | Defer; SMS first |

---

## 8. Research Artifacts to Create

| Artifact | Purpose |
|----------|---------|
| `docs/PARTIFUL_RESEARCH.md` | This content + links; living doc |
| `docs/PHONE_FIRST_MIGRATION.md` | Migration playbook for ops |
| `.specify/specs/phone-first-notifications/` | Spec kit when implementing |

---

## 9. References (All Cited)

- [Partiful Wikipedia](https://en.wikipedia.org/wiki/Partiful)
- [Partiful Help: Guest phone numbers](https://help.partiful.com/hc/en-us/articles/26505680245275-What-are-guest-phone-numbers-used-for)
- [Partiful Help: How to RSVP](https://help.partiful.com/hc/en-us/articles/34230743189787-How-do-I-RSVP-to-an-event-on-Partiful)
- [Partiful Help: Event reminders](https://help.partiful.com/hc/en-us/articles/24470120681115-What-event-reminders-do-you-send)
- [Partiful Help: Messaging guests](https://help.partiful.com/hc/en-us/sections/27223770956187--Messaging-Guests)
- [Partiful Help: Phone or email to invite](https://help.partiful.com/hc/en-us/articles/28140825325595-Do-I-need-to-have-my-guests-phone-numbers-or-emails-in-order-to-invite-them-to-an-event)
- [Business Insider: Partiful Series A](https://www.businessinsider.com/andreessen-horowitz-benchmark-partiful-event-startup-tech-2022-11)
- [Partiful Year in Review 2024](https://partiful.com/blog/post/2024-year-in-review)
- [Medium: Partiful Friction Log](https://avirn.medium.com/partiful-friction-log-a4ff841902f2) — Avi Rajendra-Nicolucci
- [HmmThis: Cutest Party App review](https://www.hmmthis.com/p/cutest-party-genz-app-review-partiful)
- [Product Hunt: Partiful reviews](https://www.producthunt.com/products/partiful/reviews)
- [TechCrunch: Partiful GPS metadata](https://techcrunch.com/2025/10/04/event-startup-partiful-wasnt-stripping-gps-locations-from-user-uploaded-photos/)
