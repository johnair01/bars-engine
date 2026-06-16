import { redirect } from "next/navigation";

/**
 * The book-specific unlock form was folded into the single /redeem surface,
 * which now accepts a Gumroad license key as well as a minted code
 * (launch-paywall-integration spec). Kept as a redirect so existing links,
 * bookmarks, and the verification quest still land in the right place;
 * `next=/handbook` routes the reader into the book on success.
 */
export default function HandbookUnlockPage() {
  redirect("/redeem?next=/handbook");
}
