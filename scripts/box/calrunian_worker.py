#!/usr/bin/env python3
"""Calrunian lane worker: pulls from the work queue, answers with the box's local model, files the result.

Runs on the always-on box (systemd timer or `--loop`). Standard library only.

Env:
  COUNCIL_MENU_TOKEN   the council token (it acts in any lane; there is no WORK_TOKEN_CALRUNIAN)
  BARS_URL             default https://bars-engine.vercel.app
  AI_GATEWAY_URL       default https://ai.masteringallyship.com/v1
  AI_GATEWAY_KEY       bearer key for the LiteLLM gateway
  CALRUNIAN_MODEL      default local-quality (Qwen 2.5 7B); local-fast is Llama 3.2 3B

One ticket per run. When the lane's deck is empty it files its own upkeep ticket (once a day per job, deduped by
sourceKey) and works it next run. It never opens pull requests: its `done` result is a note for the ticket.
"""
import datetime, json, os, sys, time, urllib.error, urllib.request

BARS = os.environ.get("BARS_URL", "https://bars-engine.vercel.app").rstrip("/")
GATE = os.environ.get("AI_GATEWAY_URL", "https://ai.masteringallyship.com/v1").rstrip("/")
MODEL = os.environ.get("CALRUNIAN_MODEL", "local-quality")
LANE = "calrunian"
BY = "box: calrunian worker"

# Upkeep the lane files for itself. Each is cheap and read-only; the model writes a note, nobody's files change.
SELF_JOBS = [
    ("deck-report", "Report the ready deck by lane",
     "Below is the count of ready tickets per lane. Write three plain sentences: which lane is fullest, which is idle, "
     "and which single ticket title looks most clerical and could move to the Calrunian lane.\n\n{deck}"),
]


def call(method, url, token, body=None, timeout=120):
    req = urllib.request.Request(url, method=method, data=None if body is None else json.dumps(body).encode(),
                                 headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        return e.code, None


def bars(method, path, body=None):
    return call(method, BARS + path, os.environ["COUNCIL_MENU_TOKEN"], body)


def ask(prompt):
    status, out = call("POST", GATE + "/chat/completions", os.environ["AI_GATEWAY_KEY"],
                       {"model": MODEL, "messages": [{"role": "user", "content": prompt}], "temperature": 0.2}, timeout=600)
    if status != 200 or not out:
        raise RuntimeError(f"gateway answered {status}")
    return out["choices"][0]["message"]["content"].strip()


def deck_text():
    lines = []
    for lane in ("claude", "freebuff", "deepai", "calrunian"):
        s, out = bars("GET", f"/api/work/tickets?lane={lane}&state=ready")
        ts = (out or {}).get("tickets", []) if s == 200 else []
        lines.append(f"{lane}: {len(ts)} ready" + (f" (e.g. {ts[0]['title']})" if ts else ""))
    return "\n".join(lines)


def file_self_work():
    day = datetime.date.today().isoformat()
    for slug, title, _ in SELF_JOBS:
        bars("POST", "/api/work/tickets", {"sourceKey": f"calrunian/self/{day}/{slug}", "title": title,
             "brief": f"self-job:{slug}", "basis": {"selfGenerated": True}, "lanes": [LANE]})


def work(ticket):
    brief = ticket.get("brief", "")
    job = next((j for j in SELF_JOBS if brief == f"self-job:{j[0]}"), None)
    prompt = job[2].format(deck=deck_text()) if job else (
        f"You are a careful assistant on a game-design team. Do this task and answer in plain sentences.\n\n"
        f"Task: {ticket.get('title','')}\n\n{brief}")
    return ask(prompt)


def run_once():
    s, out = bars("POST", f"/api/work/claim?lane={LANE}", {"by": BY})
    if s == 204:
        file_self_work()
        print("deck empty; filed self-work")
        return
    if s != 200:
        print(f"claim answered {s}", file=sys.stderr)
        return
    t = out["ticket"]
    try:
        note = work(t)
    except Exception as e:  # give the ticket back rather than lose it
        bars("POST", f"/api/work/{t['id']}/release", {"result": f"box worker error: {e}"[:300]})
        print(f"released {t['id']}: {e}", file=sys.stderr)
        return
    bars("POST", f"/api/work/{t['id']}/done", {"result": note[:1900]})
    print(f"done {t['id']}: {t.get('title')}")


if __name__ == "__main__":
    if "--loop" in sys.argv:
        while True:
            run_once()
            time.sleep(300)
    else:
        run_once()
