"""Check who owns each WorkAdventure world's map file.

usage: python3 wa_owner.py            (lists every world and its owner, exits 1 on a fault)

Wendell's answer C on wa-world-door-intake-1, 2026-11-23: the generated worlds stay sealed and one workroom is his
to draw in. Each world folder under public/wa carries its owner, so a regenerate can never quietly eat a drawing:

  owner "generator"  the map is written by its generator and read-only in the client, so it must carry no .wam
  owner "editor"     the client's map editor is the author, so the map must carry a .wam beside it

The owner is read from the folder's design-language file (`*-language.json` or `*-base.json`) when it has one, and
from `owner.json` otherwise, so a world generated without a language file still names an owner.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OWNERS = ('generator', 'editor')


def owner_of(folder):
    """Return (owner, where) for a world folder, or (None, why) when it does not name one."""
    names = sorted(os.listdir(folder))
    sources = [n for n in names if n.endswith('-language.json') or n.endswith('-base.json')]
    if 'owner.json' in names:
        sources.append('owner.json')
    for name in sources:
        try:
            doc = json.load(open(os.path.join(folder, name)))
        except (json.JSONDecodeError, OSError) as exc:
            return None, f'{name} does not read as JSON: {exc}'
        if isinstance(doc, dict) and doc.get('owner'):
            return doc['owner'], name
    if not sources:
        return None, 'no design-language file and no owner.json'
    return None, f'{", ".join(sources)} name no owner'


def worlds():
    for name in sorted(os.listdir(HERE)):
        folder = os.path.join(HERE, name)
        if os.path.isdir(folder) and any(f.endswith('.tmj') for f in os.listdir(folder)):
            yield name, folder


def main():
    faults = []
    rows = []
    for name, folder in worlds():
        owner, where = owner_of(folder)
        has_wam = any(f.endswith('.wam') for f in os.listdir(folder))
        if owner not in OWNERS:
            faults.append(f'{name}: {where}' if owner is None
                          else f'{name}: owner "{owner}" in {where} is not one of {OWNERS}')
        elif owner == 'editor' and not has_wam:
            faults.append(f'{name}: owner "editor" but no .wam, so the client cannot edit it')
        elif owner == 'generator' and has_wam:
            faults.append(f'{name}: owner "generator" but a .wam is present, which hands it to the editor')
        rows.append(f'  {name:<16} {owner or "?":<10} {where}')
    print('world            owner      named in')
    print('\n'.join(rows))
    for fault in faults:
        print(f'FAULT {fault}', file=sys.stderr)
    return 1 if faults else 0


if __name__ == '__main__':
    raise SystemExit(main())
