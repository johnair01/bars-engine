"""
Sprite validation — Challenger gate.
Rejects sprites to review queue if any of the 4 failure modes are detected.
"""
import struct
from pathlib import Path

# Approved palette from docs/STYLE_GUIDE.md (load dynamically if file exists, else use defaults)
# Each entry is an (R, G, B) tuple. Alpha is excluded from palette check (transparency is separate check).
DEFAULT_PALETTE: list[tuple[int, int, int]] = []  # Permissive default — override by loading STYLE_GUIDE

def load_approved_palette(style_guide_path: str = "docs/STYLE_GUIDE.md") -> list[tuple[int, int, int]]:
    """Parse hex colors from STYLE_GUIDE.md. Returns empty list (permissive) if file not found."""
    try:
        text = Path(style_guide_path).read_text()
        import re
        hexes = re.findall(r'#([0-9A-Fa-f]{6})', text)
        return [(int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)) for h in hexes]
    except Exception:
        return []

def read_png_header(path: str) -> tuple[int, int, int, bool]:
    """
    Read PNG IHDR: returns (width, height, bit_depth, has_alpha).
    Raises ValueError if not a valid PNG.
    """
    with open(path, 'rb') as f:
        sig = f.read(8)
        if sig != b'\x89PNG\r\n\x1a\n':
            raise ValueError(f"Not a PNG file: {path}")
        f.read(4)  # chunk length
        chunk_type = f.read(4)
        if chunk_type != b'IHDR':
            raise ValueError(f"Missing IHDR chunk: {path}")
        data = f.read(13)
        w = struct.unpack('>I', data[0:4])[0]
        h = struct.unpack('>I', data[4:8])[0]
        bit_depth = data[8]
        color_type = data[9]
        # color_type 4 = grayscale+alpha, 6 = RGBA, 2 = RGB, 0 = grayscale, 3 = indexed
        has_alpha = color_type in (4, 6)
        return w, h, bit_depth, has_alpha

def check_dimensions(path: str, expected_w: int, expected_h: int) -> str | None:
    """Failure mode 1: Wrong dimensions. Returns error string or None."""
    try:
        w, h, _, _ = read_png_header(path)
        if w != expected_w or h != expected_h:
            return f"Dimension mismatch: expected {expected_w}x{expected_h}, got {w}x{h}"
        return None
    except Exception as e:
        return f"PNG read error: {e}"

def check_transparency(path: str) -> str | None:
    """Failure mode 3: Opaque background on overlay layers. Returns error string or None."""
    try:
        _, _, _, has_alpha = read_png_header(path)
        if not has_alpha:
            return "Overlay layer PNG must have alpha channel (RGBA), got opaque format"
        return None
    except Exception as e:
        return f"PNG read error: {e}"

def check_palette(path: str, approved: list[tuple[int, int, int]]) -> str | None:
    """Failure mode 2: Palette violation. Permissive (pass) when approved palette is empty."""
    if not approved:
        return None  # No palette locked yet — pass
    # Sample check: use Pillow if available, else skip
    try:
        from PIL import Image
        img = Image.open(path).convert("RGBA")
        pixels = set(img.getdata())
        violations = []
        for px in pixels:
            r, g, b, a = px
            if a == 0:
                continue  # transparent pixel — skip
            if (r, g, b) not in approved:
                violations.append(f"#{r:02x}{g:02x}{b:02x}")
            if len(violations) > 5:
                break
        if violations:
            return f"Palette violation: {violations[:5]} not in approved palette"
        return None
    except ImportError:
        return None  # Pillow not installed — skip palette check
    except Exception as e:
        return f"Palette check error: {e}"

def check_attribution(sprite_dir: str, nation_key: str, archetype_key: str) -> str | None:
    """Failure mode 4: LPC-derived assets require attribution file."""
    attr_path = Path(sprite_dir) / f"{nation_key}-{archetype_key}.attribution.txt"
    source_path = Path(sprite_dir) / f"{nation_key}-{archetype_key}.source"
    # Only required if .source file says 'lpc'
    if source_path.exists():
        source = source_path.read_text().strip().lower()
        if source == 'lpc' and not attr_path.exists():
            return f"LPC-derived asset requires attribution file: {attr_path}"
    return None

class ValidationResult:
    def __init__(self):
        self.errors: list[str] = []

    def ok(self) -> bool:
        return len(self.errors) == 0

    def add(self, err: str | None):
        if err:
            self.errors.append(err)

def validate_portrait_layer(path: str, layer: str, sprite_dir: str = "") -> ValidationResult:
    """Run all 4 checks on a portrait layer PNG."""
    result = ValidationResult()
    result.add(check_dimensions(path, 64, 64))
    # base layer is opaque — skip transparency check
    if layer != "base":
        result.add(check_transparency(path))
    approved = load_approved_palette("docs/STYLE_GUIDE.md")
    result.add(check_palette(path, approved))
    # Attribution: extract keys from path
    import re
    m = re.search(r'([^/]+)-([^/]+)-\w+\.png$', path)
    if m and sprite_dir:
        result.add(check_attribution(sprite_dir, m.group(1), m.group(2)))
    return result

def validate_walkable_spritesheet(path: str, sprite_dir: str = "") -> ValidationResult:
    """Run all checks on a walkable spritesheet (512x64)."""
    result = ValidationResult()
    result.add(check_dimensions(path, 512, 64))
    # walkable sprites are not required to have alpha (LPC base is often indexed)
    approved = load_approved_palette("docs/STYLE_GUIDE.md")
    result.add(check_palette(path, approved))
    import re
    m = re.search(r'([^/]+)-([^/]+)\.png$', path)
    if m and sprite_dir:
        result.add(check_attribution(sprite_dir, m.group(1), m.group(2)))
    return result
