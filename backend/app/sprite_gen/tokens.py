"""
Token registry — nation and archetype descriptors for sprite generation.
Each entry describes conceptual identity (philosophy + material), not just appearance.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class NationTokens:
    key: str
    philosophy: str     # The nation's core ethos — leads the prompt
    palette: str        # Color identity
    motif: str          # Structural / decorative language
    garment: str        # How the outfit manifests the philosophy
    forbidden: str      # Negative prompt tokens for this nation


@dataclass(frozen=True)
class ArchetypeTokens:
    key: str
    role: str           # What the archetype DOES in the world
    silhouette: str     # Body and stance
    gear: str           # Equipment visible in top-down view
    movement: str       # How they carry themselves
    forbidden: str      # Negative prompt tokens


NATIONS: dict[str, NationTokens] = {
    "argyra": NationTokens(
        key="argyra",
        philosophy="precision as sacred — beauty is correctness, ornament is structure",
        palette="silver, cold grey, white-blue highlight",
        motif="geometric angular shapes, circuit-like repeating ornament, crisp seams",
        garment="structured collar, metallic shoulder plates, layered angular chest piece",
        forbidden="warm tones, organic curves, flowing fabric, earth tones, flame imagery",
    ),
    "pyrakanth": NationTokens(
        key="pyrakanth",
        philosophy="passion as power — feeling is the sharpest intelligence",
        palette="flame orange, ember red, gold accent",
        motif="organic flame shapes, burning petal layering, ember-glow edges",
        garment="layered flame-tipped robes, ember-orange sash, shoulder guards with fire motif",
        forbidden="cold tones, silver, geometric rigidity, blue palette, still water imagery",
    ),
    "virelune": NationTokens(
        key="virelune",
        philosophy="growth as wisdom — the patient unfolding is the answer",
        palette="leaf green, pale gold, bark brown accent",
        motif="leaf and vine growth patterns, natural symmetry, woven textures",
        garment="woven leaf-panel tunic, vine-wrapped bracers, wooden toggles",
        forbidden="metal sheen, synthetic textures, urban motifs, fire imagery",
    ),
    "meridia": NationTokens(
        key="meridia",
        philosophy="stability as gift — the steady one holds the center for all",
        palette="warm terracotta, ochre, dusty rose",
        motif="rounded earth shapes, cradle forms, clay-impressed detail",
        garment="draped earth-cloth, rounded shoulder wrap, clay-bead trim",
        forbidden="sharp angles, cold palette, flame imagery, metallic sheen",
    ),
    "lamenth": NationTokens(
        key="lamenth",
        philosophy="mystery as depth — what dissolves returns as something truer",
        palette="deep teal, midnight blue, silver-grey mist",
        motif="water ripple, tide-hem dissolving edges, silver thread embroidery",
        garment="flowing layered cloak, tide-hem detail, silver thread at edges",
        forbidden="flame, earth brown, warm tones, solid sharp edges, bright primary colors",
    ),
}

ARCHETYPES: dict[str, ArchetypeTokens] = {
    "danger-walker": ArchetypeTokens(
        key="danger-walker",
        role="agile scout who reads terrain and threat before others know either exists",
        silhouette="lean build, low center of gravity, slight forward lean",
        gear="twin daggers at hip, hooded cloak, minimal light leather chest piece",
        movement="coiled readiness, alert eyes scanning, weight on balls of feet",
        forbidden="heavy plate armor, robes, bulky silhouette, large two-handed weapons",
    ),
    "devoted-guardian": ArchetypeTokens(
        key="devoted-guardian",
        role="protector whose presence is the shield before the shield is raised",
        silhouette="broad shouldered, upright protective stance, weight-forward",
        gear="kite shield strapped to back, one-handed sword at hip, heavy pauldrons",
        movement="steady, immovable, unhurried",
        forbidden="light build, daggers, ranged weapons, hunched posture",
    ),
    "decisive-storm": ArchetypeTokens(
        key="decisive-storm",
        role="catalytic force who collapses stasis into motion",
        silhouette="dynamic mid-stride, one arm forward, kinetic energy visible",
        gear="large two-handed weapon (hammer or axe), minimal chest armor",
        movement="explosive momentum, weight perpetually in motion",
        forbidden="shields, robes, cautious balanced stance, ranged weapons",
    ),
    "still-point": ArchetypeTokens(
        key="still-point",
        role="the eye of any storm — stillness that clarifies everything around it",
        silhouette="perfectly centered standing stance, hands open and relaxed",
        gear="staff or bare hands, flowing meditation robes, prayer beads",
        movement="gravity-settled, serene stillness, weight fully dropped",
        forbidden="weapons, armor, aggressive posture, rushed or leaning stance",
    ),
    "subtle-influence": ArchetypeTokens(
        key="subtle-influence",
        role="shapes outcomes through presence and timing rather than force",
        silhouette="relaxed, slightly angled, hands partially visible and open",
        gear="no visible weapon, layered civilian clothes, small satchel at hip",
        movement="casual confidence, observer's gaze, unhurried",
        forbidden="armor, large weapons, heroic chest-forward stance",
    ),
    "truth-seer": ArchetypeTokens(
        key="truth-seer",
        role="perceives the pattern beneath the noise and names what others cannot",
        silhouette="upright, hands clasped or resting at chin, deliberate posture",
        gear="long coat or robe, scroll or tome under arm, small pouch",
        movement="measured, scholarly, each step considered",
        forbidden="combat gear, rushed posture, visible weapons, crouching",
    ),
    "joyful-connector": ArchetypeTokens(
        key="joyful-connector",
        role="weaves people into relationship — the one who makes the room warmer",
        silhouette="open posture, slight tilt of head, arms loose and welcoming",
        gear="bright-colored tunic, no weapon, small instrument or flower",
        movement="expressive, warm energy, body turned toward others",
        forbidden="dark tones, armor, weapons, closed or guarded posture",
    ),
    "bold-heart": ArchetypeTokens(
        key="bold-heart",
        role="leads from the front because they genuinely believe it will work",
        silhouette="chest forward, arms spread, open leadership stance",
        gear="cape or banner element, medium sword at hip, polished chest piece",
        movement="commanding presence, generous energy, unguarded",
        forbidden="hidden weapons, hunched posture, dark color palette, cautious stance",
    ),
}
