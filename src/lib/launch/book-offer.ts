/**
 * BARS ENGINE — The digital book's canonical purchase URL.
 *
 * One value, one definition. Two very different surfaces need it:
 *
 *   - the launch offer registry (`offers.ts` → the `book-digital` SKU), which
 *     drives /launch and the /mastering-allyship sales letter, and
 *   - the /awaken + chapter-1 funnels (`lib/awaken/content.ts`), which sell the
 *     full book to readers who came for the free sample.
 *
 * Those two used to carry separate copies of the link — the registry read the
 * env var and degraded to "Book link coming soon", while the funnel hard-coded
 * the Gumroad literal and always rendered a live button. The site could tell one
 * reader the book was not for sale yet and sell it to another on the next page.
 * Defining it once here is what stops that from drifting again.
 *
 * It lives in its own module rather than in `offers.ts` so the client-side lead
 * form can import it without pulling the whole SKU registry into the browser
 * bundle.
 *
 * The env var wins when set (see docs/runbooks/GUMROAD_LAUNCH_SETUP.md); the
 * literal below is the product that has been live on the chapter-1 page, kept as
 * the default so the book stays purchasable if the var is ever missing.
 */
export const BOOK_DIGITAL_GUMROAD_URL =
  process.env.NEXT_PUBLIC_GUMROAD_BOOK_DIGITAL_URL?.trim() ||
  'https://wendellbritt.gumroad.com/l/MTGOAbook'

/**
 * The print edition's Gumroad pre-order URL, shared by the registry and the
 * /awaken funnel for the same reason as above.
 *
 * Deliberately has no literal default. The digital book has a product that has
 * been live for a while; the print run does not, so there is nothing honest to
 * fall back to. Empty means "not for sale yet", and callers are expected to
 * handle that — the registry renders the SKU as setup-pending, and the /awaken
 * card sends people to /launch instead of a dead link.
 */
export const BOOK_PHYSICAL_GUMROAD_URL =
  process.env.NEXT_PUBLIC_GUMROAD_BOOK_PHYSICAL_URL?.trim() ?? ''
