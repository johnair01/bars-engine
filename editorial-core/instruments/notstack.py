import os as _os
MS = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), _os.pardir, 'manuscript') + _os.sep
import re, sys, glob

FILES = sorted(glob.glob(MS+'ch[1-9].md'))

# A negation fragment: a sentence that STARTS with Not/No/Never/Nor/Don't and
# has no finite verb-y independent-clause shape -- we detect by: begins with
# the negator and is short-ish and does not contain " is " / " was " etc.
NEG_START = re.compile(r'^(Not|No|Never|Nor|Neither|Don\'t|Doesn\'t|Nothing)\b')

def sentences(text):
    # strip markdown headers/table rows for signal, keep line numbers
    out = []
    for ln, line in enumerate(text.split('\n'), 1):
        if line.startswith('#') or line.startswith('|'):
            continue
        # split into sentences
        parts = re.split(r'(?<=[.!?])\s+', line)
        for p in parts:
            out.append((ln, p.strip()))
    return out

total = 0
for f in FILES:
    text = open(f).read()
    sents = sentences(text)
    hits = []
    prev = None
    for i, (ln, s) in enumerate(sents):
        clean = re.sub(r'[*_`]', '', s).strip()
        if NEG_START.match(clean):
            hits.append((ln, clean))
    if hits:
        print('='*70)
        print(f, len(hits))
        for ln, s in hits:
            print(f'  {ln}: {s[:150]}')
        total += len(hits)
print()
print('TOTAL', total)
