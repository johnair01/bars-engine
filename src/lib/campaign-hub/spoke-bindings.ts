/**
 * Campaign-spoke bindings: maps a (parentCampaignRef, parentSpokeIndex) to a child campaign
 * that should be entered as a sub-hub instead of the default leaf-spoke flow.
 *
 * This is the prototype implementation of the recursive nesting concept from
 * `.specify/specs/campaign-recursive-nesting/spec.md`. It is intentionally a static
 * registry (not a DB table) so the prototype can ship without migrations.
 *
 * When a player navigates to a bound spoke, the spoke entry page redirects them to
 * the child campaign's hub. The child campaign runs its own lifecycle independently.
 */

export interface SpokeBinding {
    parentCampaignRef: string
    parentSpokeIndex: number
    childCampaignRef: string
    childHubPath: string // route to enter the child campaign hub
    label: string // display label for breadcrumbs
}

const BINDINGS: SpokeBinding[] = [
    {
        parentCampaignRef: 'bruised-banana',
        parentSpokeIndex: 7,
        childCampaignRef: 'mastering-allyship',
        // Spatial walkable clearing (mirrors the BB pattern). Falls back to the
        // simple list hub at /mastering-allyship/hub if you want to bypass spatial.
        childHubPath: '/world/mastering-allyship/mtgoa-clearing',
        label: 'Mastering the Game of Allyship',
    },
]

/** Look up a binding for a parent spoke. Returns null if no binding exists (= leaf spoke). */
export function getSpokeBinding(
    parentCampaignRef: string,
    parentSpokeIndex: number,
): SpokeBinding | null {
    return (
        BINDINGS.find(
            (b) =>
                b.parentCampaignRef === parentCampaignRef && b.parentSpokeIndex === parentSpokeIndex,
        ) ?? null
    )
}

/** Get all bindings for a parent campaign (used to render hub with sub-hub indicators). */
export function getBindingsForCampaign(parentCampaignRef: string): SpokeBinding[] {
    return BINDINGS.filter((b) => b.parentCampaignRef === parentCampaignRef)
}

/** Reverse lookup: find which parent (if any) this child campaign is bound to. */
export function getParentBindingForChild(childCampaignRef: string): SpokeBinding | null {
    return BINDINGS.find((b) => b.childCampaignRef === childCampaignRef) ?? null
}
