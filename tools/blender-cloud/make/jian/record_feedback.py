"""Append an exact design reaction tied to a specific rendered artifact.

Example: python3 record_feedback.py --artifact inventory-v2/contact-sheet.png
         --context 'inventory neutral light' --quote '...' --feature guard
"""
import argparse
import hashlib
import json
from datetime import datetime,timezone
from pathlib import Path

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
p=argparse.ArgumentParser()
p.add_argument("--artifact",type=Path,required=True)
p.add_argument("--context",required=True)
p.add_argument("--quote",required=True)
p.add_argument("--feature",action="append",default=[])
p.add_argument("--comparison",type=Path)
p.add_argument("--speaker",default="user")
a=p.parse_args()

def identify(path):
    path=path.resolve()
    if not path.is_file():raise ValueError(f"missing artifact: {path}")
    try: recorded=str(path.relative_to(ROOT))
    except ValueError: recorded=str(path)
    return {"path":recorded,"sha256":hashlib.sha256(path.read_bytes()).hexdigest()}

record={"recorded_utc":datetime.now(timezone.utc).isoformat(),"speaker":a.speaker,
        "artifact":identify(a.artifact),"context":a.context,"exact_words":a.quote,
        "feature_tags":a.feature,"comparison":identify(a.comparison) if a.comparison else None,
        "interpretation":None,"interpretation_status":"unreviewed"}
with (HERE/"feedback-reactions.jsonl").open("a") as f:f.write(json.dumps(record,ensure_ascii=False)+"\n")
print("Recorded reaction for",a.artifact.name)
