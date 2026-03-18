"""Deterministic 6-face shadow name grammar for 321 Shadow Work.
Zero tokens at suggest time — hash + lookup only.
Same input always yields same name (djb2 hash, same as TS port).

Faces map to the 6 Game Master sects:
  0 shaman     — mystery, divination, threshold
  1 challenger — action, edge, drive
  2 regent     — order, structure, steadiness
  3 architect  — strategy, blueprint, design
  4 diplomat   — connection, translation, harmony
  5 sage       — integration, paradox, wholeness
"""

import re

SHADOW_NAME_VOCAB = {
    "version": "2",
    "faces": [
        {
            "id": "shaman",
            "roles": ["Oracle", "Keeper", "Guardian", "Seer", "Witness", "Diviner", "Wanderer", "Threshold"],
            "descriptors": ["Mythic", "Earthbound", "Ritual", "Hidden", "Liminal", "Sacred", "Ancient", "Veiled"],
        },
        {
            "id": "challenger",
            "roles": ["Dodger", "Walker", "Edge", "Blade", "Hunter", "Striker", "Maverick", "Rebel"],
            "descriptors": ["Deft", "Bold", "Penetrating", "Relentless", "Fierce", "Reckless", "Unyielding", "Sharp"],
        },
        {
            "id": "regent",
            "roles": ["Steward", "Keeper", "Sentinel", "Order", "Warden", "Anchor", "Foundation", "Pillar"],
            "descriptors": ["Structured", "Disciplined", "Calm", "Steady", "Immovable", "Measured", "Clear", "Bound"],
        },
        {
            "id": "architect",
            "roles": ["Blueprint", "Builder", "Strategist", "Designer", "Planner", "Engineer", "Visionary", "Mapper"],
            "descriptors": ["Precise", "Clever", "Systematic", "Deliberate", "Calculated", "Exacting", "Methodical", "Lucid"],
        },
        {
            "id": "diplomat",
            "roles": ["Connector", "Weaver", "Bridge", "Mediator", "Emissary", "Translator", "Liaison", "Harmonizer"],
            "descriptors": ["Quirky", "Gentle", "Subtle", "Fluid", "Adaptive", "Resonant", "Open", "Tender"],
        },
        {
            "id": "sage",
            "roles": ["Trickster", "Integrator", "Mountain", "Sage", "Elder", "Mirror", "Paradox", "Spiral"],
            "descriptors": ["Wise", "Emergent", "Whole", "Layered", "Integrated", "Timeless", "Vast", "Still"],
        },
    ],
    # Grammar patterns: {D} = descriptor, {R} = role
    "patterns": [
        "The {D} {R}",
        "{D} {R}",
        "The {R} of {D}",
    ],
}


def _hash(s: str) -> int:
    """djb2 hash — matches TS port exactly."""
    h = 5381
    for c in s:
        h = (h * 33) ^ ord(c)
    return h & 0xFFFFFFFF


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", text.lower())).strip()


def derive_shadow_name(charge_description: str, mask_shape: str) -> str:
    """Derive a deterministic evocative name from 321 charge + mask shape.
    Hash bits: [0-7] face, [8-15] role, [16-23] descriptor, [24-31] pattern
    """
    combined = _normalize(charge_description + " " + mask_shape)
    if not combined:
        return "The Unnamed Presence"

    h = _hash(combined)
    faces = SHADOW_NAME_VOCAB["faces"]
    patterns = SHADOW_NAME_VOCAB["patterns"]

    face = faces[h % len(faces)]
    role = face["roles"][((h >> 8) & 0xFF) % len(face["roles"])]
    descriptor = face["descriptors"][((h >> 16) & 0xFF) % len(face["descriptors"])]
    pattern = patterns[((h >> 24) & 0xFF) % len(patterns)]

    return pattern.replace("{D}", descriptor).replace("{R}", role)
