import { permanentRedirect } from "next/navigation";

/**
 * @route /pricing
 * @page /pricing
 * @entity SYSTEM
 * @description Legacy funnel front door — composted into the Gumroad-backed `/launch`
 *   page (the real, card-charging checkout). Kept as a permanent redirect so existing
 *   links, the book's "unlock" CTA, and the barn's pre-sale wall CTA still land.
 * @permissions public
 * @energyCost 0 (redirect)
 * @dimensions WHO:visitor, WHAT:SYSTEM, WHERE:funnel, ENERGY:N/A
 * @agentDiscoverable false
 * @example /pricing
 */
export default function PricingPage() {
  permanentRedirect("/launch");
}
