"""Local motion lab server: static repo files plus append-only review notes.

Run from the repository root: python3 tools/blender-cloud/tests/motion_lab_server.py
The write endpoint is available only on loopback and stores notes in the repo.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import time
import uuid

ROOT = Path(__file__).resolve().parents[3]
PUBLIC = ROOT / 'public'
NOTES = PUBLIC / 'between/cult/review-notes.jsonl'


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def do_POST(self):
        if self.path != '/api/motion-notes':
            self.send_error(404)
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length < 1 or length > 10000:
                raise ValueError('note length out of bounds')
            data = json.loads(self.rfile.read(length))
            motion = data.get('motion')
            note = data.get('note', '').strip()
            if motion not in {'walk', 'run', 'pose', 'jump', 'climb'} or not 1 <= len(note) <= 2000:
                raise ValueError('motion or note invalid')
            record = {'id': str(uuid.uuid4()), 'created_at': int(time.time()), 'motion': motion,
                      'time_seconds': round(float(data.get('time_seconds', 0)), 3),
                      'settings': data.get('settings', {}), 'note': note, 'source': 'motion lab'}
            with NOTES.open('a', encoding='utf-8') as out:
                out.write(json.dumps(record, ensure_ascii=False) + '\n')
            body = json.dumps({'ok': True, 'record': record}).encode()
            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            self.send_error(400, str(exc))


if __name__ == '__main__':
    print('Motion lab: http://127.0.0.1:8767/between/cult/motion-lab.html', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8767), Handler).serve_forever()
