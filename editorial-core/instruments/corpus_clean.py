# -*- coding: utf-8 -*-
"""
corpus_clean.py — strip non-prose from a comp text before it is measured into a band.

## Why this exists

A reference band is only as honest as the text under it. The comps arrive from PDFs, OCR, journal
XML and Gutenberg dumps, and each drags in matter that is not the author's prose: page-number
tables of contents, running headers, reference lists, DOIs and URLs, copyright and ISBN blocks,
and journal boilerplate ("Competing interests", "Patient consent obtained", "Provenance and peer
review"). Measured as prose, that furniture skews the band toward citation-ese and list-ese — the
exact contamination the 2026-09-09 hostile review found in the BMJ and PCSP genre comps.

`build_bands.py` and coherence.py's reference check both run text through `clean()` first, so a
band is always measured on the same prose-only surface, and a re-measure reproduces it.

The cleaner is deliberately conservative: it drops lines that clearly match non-prose shapes and
keeps everything else. A false negative (some boilerplate survives) is cheaper than a false
positive (real prose deleted), so the patterns are narrow.
"""
import re

# Lines that are non-prose furniture. Each pattern matches a whole line (stripped).
_DROP_LINE = [
    r"^\s*$",                                             # blank
    r"^[\divxlcm\.\s,–—-]+$",                             # bare numbers / TOC page-number runs / roman
    r"^\s*(copyright|©|isbn|all rights reserved|first edition|published by|www\.|http)\b.*",
    r"^\s*(competing interests?|patient consent|provenance and peer review|"
    r"contributors?|funding|acknowledge?ments?|conflict of interest|orcid)\b.*",
    r"^\s*(references?|bibliography|works cited|notes)\s*:?\s*$",   # a section header alone
    r"^\s*\d+\.?\s+[A-Z][a-z]+,?\s+[A-Z]{1,3}\b.*\d{4}.*",         # numbered citation: "1. Smith AB ... 2019"
    r"^\s*[A-Z][a-z]+,?\s+[A-Z]{1,3}(,|\s|;).*\d{4};\s*\d+.*",     # "Smith AB, Jones CD. ... 2019;12:34"
    r".*\bdoi:\s*10\.\d{4,}.*",                                     # a DOI line
    r"^\s*(page\s+\d+|p\.\s*\d+)\s*$",                              # page markers
]
_DROP = re.compile("|".join("(?:%s)" % p for p in _DROP_LINE), re.I)

_MD_LINK = re.compile(r"\[([^\]]+)\]\((?:https?://|/)[^)]*\)")     # [text](url) -> text
_BARE_URL = re.compile(r"https?://\S+")
_INLINE_DOI = re.compile(r"\bdoi:\s*10\.\d{4,}/\S+", re.I)


def _strip_gutenberg(t):
    m = re.search(r"\*\*\* START OF TH[EIS].*?\*\*\*(.*?)\*\*\* END OF TH[EIS]", t, re.S)
    return m.group(1) if m else t


def _drop_reference_tail(t):
    """Cut a trailing reference list: from a lone 'References'/'Bibliography' header to the end,
    but only when it sits in the last third of the text, so a mid-document mention is left alone.
    (For multi-article corpora, per-line citation patterns above catch the rest.)"""
    for m in re.finditer(r"(?im)^\s*(references|bibliography|works cited)\s*:?\s*$", t):
        if m.start() > len(t) * 0.66:
            return t[:m.start()]
    return t


def clean(text):
    """Return prose-only text: Gutenberg wrapper removed, links/URLs/DOIs reduced, non-prose lines
    dropped, whitespace normalised. Line structure is preserved so paragraph reflow still works."""
    t = _strip_gutenberg(text)
    t = _MD_LINK.sub(r"\1", t)
    t = _BARE_URL.sub(" ", t)
    t = _INLINE_DOI.sub(" ", t)
    t = _drop_reference_tail(t)
    kept = [ln for ln in t.splitlines() if not _DROP.match(ln.strip())]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(kept)).strip()
