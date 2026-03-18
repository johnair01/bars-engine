#!/usr/bin/env python3
"""
Transcribe audio files using faster-whisper.

Usage:
  cd backend && uv run python ../scripts/transcribe-audio.py <path-or-url>
  cd backend && uv run python ../scripts/transcribe-audio.py ./recording.m4a
  cd backend && uv run python ../scripts/transcribe-audio.py "https://example.com/audio.m4a"

Options:
  --model    Whisper model size: tiny, base, small, medium, large-v3 (default: base)
  --output   Write transcript to file instead of stdout
"""

import argparse
import sys
import tempfile
from pathlib import Path

import httpx


def download_url(url: str, dest: Path) -> None:
    with httpx.stream("GET", url, follow_redirects=True) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_bytes():
                f.write(chunk)


def transcribe(path: Path, model_size: str = "base") -> str:
    from faster_whisper import WhisperModel

    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segments, info = model.transcribe(str(path))
    lines = []
    for seg in segments:
        lines.append(seg.text.strip())
    return "\n".join(lines).strip()


def main() -> int:
    parser = argparse.ArgumentParser(description="Transcribe audio with faster-whisper")
    parser.add_argument("input", help="Path to audio file or URL")
    parser.add_argument("--model", default="base", help="Model: tiny, base, small, medium, large-v3")
    parser.add_argument("-o", "--output", help="Write transcript to file")
    args = parser.parse_args()

    path = Path(args.input)
    if args.input.startswith(("http://", "https://")):
        with tempfile.NamedTemporaryFile(suffix=".m4a", delete=False) as f:
            tmp = Path(f.name)
        try:
            download_url(args.input, tmp)
            text = transcribe(tmp, args.model)
        finally:
            tmp.unlink(missing_ok=True)
    else:
        if not path.exists():
            print(f"Error: file not found: {path}", file=sys.stderr)
            return 1
        text = transcribe(path, args.model)

    if args.output:
        Path(args.output).write_text(text, encoding="utf-8")
        print(f"Wrote transcript to {args.output}", file=sys.stderr)
    else:
        print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
