"""
Prompt builder — assembles structured prompts for each sprite category.

Usage:
    from app.sprite_gen.builder import build_walkable, build_overlay
    prompt, negative = build_walkable("argyra", "danger-walker")
"""
from __future__ import annotations
import hashlib
from dataclasses import dataclass
from .tokens import NATIONS, ARCHETYPES, NationTokens, ArchetypeTokens


# ---------------------------------------------------------------------------
# Result type
# ---------------------------------------------------------------------------

@dataclass
class PromptResult:
    positive: str
    negative: str       # rd-animation does not accept negative_prompt; kept for manual/LPC fallback reference
    seed: int           # deterministic — same combo always gets same seed
    category_tag: str   # e.g. "walkable:argyra:danger-walker"


def _derive_seed(tag: str) -> int:
    """Deterministic seed from category tag."""
    h = hashlib.sha256(tag.encode()).hexdigest()
    return int(h[:8], 16) % (2 ** 31)


# ---------------------------------------------------------------------------
# Shared style tokens (apply to all categories)
# ---------------------------------------------------------------------------

_BASE_STYLE = [
    "top-down pixel art RPG",
    "Stardew Valley style",
    "cozy friendly game art",
    "1px black outline",
]

_BASE_NEGATIVE = [
    "extra limbs",
    "photo",
    "3d render",
    "text",
    "watermark",
    "border",
    "grid",
    "background scenery",
]


# ---------------------------------------------------------------------------
# Walkable spritesheet prompt
# rd-animation four_angle_walking: 48×48 per frame, output 192×48 spritesheet
# ---------------------------------------------------------------------------

def build_walkable(
    nation_key: str,
    archetype_key: str,
    gender_key: str = "default",
) -> PromptResult:
    """
    Build a walkable spritesheet prompt for rd-animation four_angle_walking.
    Output format: 4-direction walk frames at 48×48 per frame.
    """
    nation = NATIONS.get(nation_key)
    archetype = ARCHETYPES.get(archetype_key)
    tag = f"walkable:{nation_key}:{archetype_key}"

    # Fallback descriptors for unknown keys
    nation_desc = (
        _nation_prompt_fragment(nation) if nation
        else f"{nation_key} themed, neutral palette"
    )
    archetype_desc = (
        _archetype_walkable_fragment(archetype) if archetype
        else archetype_key.replace("-", " ")
    )

    gender_prefix = "" if gender_key in ("default", "neutral") else f"{gender_key} "

    positive_parts = [
        *_BASE_STYLE,
        # Lead with role/purpose before appearance (Shaman's recommendation)
        f"{archetype.role if archetype else archetype_key.replace('-', ' ')}",
        f"{gender_prefix}walking character",
        nation_desc,
        archetype_desc,
        "consistent character across all frames",
        "transparent background",
        "48x48 per frame",
        "4-direction walking animation, south west east north",
    ]
    if archetype:
        positive_parts.append(archetype.movement)

    negative_parts = [
        *_BASE_NEGATIVE,
        "inconsistent character across frames",
        "style variation between frames",
        "multiple different characters",
    ]
    if nation:
        negative_parts.append(nation.forbidden)
    if archetype:
        negative_parts.append(archetype.forbidden)

    return PromptResult(
        positive=", ".join(p.strip() for p in positive_parts if p.strip()),
        negative=", ".join(n.strip() for n in negative_parts if n.strip()),
        seed=_derive_seed(tag),
        category_tag=tag,
    )


# ---------------------------------------------------------------------------
# Overlay (portrait layer) prompt
# ---------------------------------------------------------------------------

def build_overlay(
    layer: str,         # "nation_body" | "nation_accent" | "playbook_outfit" | "playbook_accent"
    nation_key: str | None = None,
    archetype_key: str | None = None,
) -> PromptResult:
    """
    Build a portrait overlay prompt.
    Overlays are garment-only layers — no body, face, or skin.
    """
    nation = NATIONS.get(nation_key) if nation_key else None
    archetype = ARCHETYPES.get(archetype_key) if archetype_key else None
    tag = f"overlay:{layer}:{nation_key or ''}:{archetype_key or ''}"

    # Core: reframe as floating garment, not a dressed character
    positive_parts = [
        "pixel art RPG",
        "Stardew Valley style",
        "1px black outline",
        "floating pixel art clothing layer",
        "clothing-only sprite, no body, no face, no skin",
    ]

    if layer in ("nation_body", "nation_accent") and nation:
        positive_parts.append(f"color palette: {nation.palette}")
        positive_parts.append(f"motif: {nation.motif}")
        if layer == "nation_body":
            positive_parts.append(f"garment: {nation.garment}")
            positive_parts.append("ONLY RENDER: vest, collar, shoulder plates — face transparent, neck transparent, background transparent")
        else:
            positive_parts.append("ONLY RENDER: chest accent badge, small ornament — face transparent, neck transparent, background transparent")

    elif layer in ("playbook_outfit", "playbook_accent") and archetype:
        positive_parts.append(f"gear: {archetype.gear}")
        if layer == "playbook_outfit":
            positive_parts.append("ONLY RENDER: outfit, cloak, armor — face transparent, neck transparent, background transparent")
        else:
            positive_parts.append("ONLY RENDER: small accent badge, weapon hilt detail — face transparent, neck transparent, background transparent")

    positive_parts.append("pure transparent PNG background, 64x64")

    # Body parts must be named explicitly in negative
    negative_parts = [
        "face", "skin", "neck", "hands", "fingers", "hair", "eyes", "nose", "mouth", "ears",
        "body", "flesh", "portrait", "character", "person",
        "photo", "3d render", "background",
    ]
    if nation:
        negative_parts.append(nation.forbidden)
    if archetype:
        negative_parts.append(archetype.forbidden)

    return PromptResult(
        positive=", ".join(p.strip() for p in positive_parts if p.strip()),
        negative=", ".join(n.strip() for n in negative_parts if n.strip()),
        seed=_derive_seed(tag),
        category_tag=tag,
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _nation_prompt_fragment(n: NationTokens) -> str:
    return f"{n.palette}, {n.motif}, {n.garment}"


def _archetype_walkable_fragment(a: ArchetypeTokens) -> str:
    return f"{a.silhouette}, {a.gear}"
