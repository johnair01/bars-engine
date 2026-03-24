"""Basic smoke tests for sprite validation."""
import os
import struct
import tempfile


def _make_png(w: int, h: int, has_alpha: bool = True) -> bytes:
    """Minimal valid PNG bytes."""
    import zlib
    color_type = 6 if has_alpha else 2  # RGBA or RGB
    ihdr = struct.pack('>IIBBBBB', w, h, 8, color_type, 0, 0, 0)
    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    # Minimal IDAT (empty image)
    channels = 4 if has_alpha else 3
    row = bytes([0] + [0] * (w * channels))
    raw = row * h
    idat_data = zlib.compress(raw)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat_data) + chunk(b'IEND', b'')

def test_dimension_check():
    from app.sprites.validation import check_dimensions
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
        f.write(_make_png(64, 64))
        path = f.name
    assert check_dimensions(path, 64, 64) is None
    assert check_dimensions(path, 32, 32) is not None
    os.unlink(path)
    print("test_dimension_check: PASS")

def test_transparency_check():
    from app.sprites.validation import check_transparency
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
        f.write(_make_png(64, 64, has_alpha=True))
        path = f.name
    assert check_transparency(path) is None
    os.unlink(path)
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
        f.write(_make_png(64, 64, has_alpha=False))
        path = f.name
    assert check_transparency(path) is not None
    os.unlink(path)
    print("test_transparency_check: PASS")

if __name__ == "__main__":
    test_dimension_check()
    test_transparency_check()
    print("All validation tests passed.")
