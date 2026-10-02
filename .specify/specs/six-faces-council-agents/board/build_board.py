#!/usr/bin/env python3
"""Build council-board.html from board/template.html and board/board_data.json.

Usage: python3 board/build_board.py   (run from .specify/specs/six-faces-council-agents/)
To change the board, edit board_data.json: add rows to positions, questions, terms or causes, and
when a board read is recorded in the ledger, add the item to `resolved` with its decision and the
ledger file. The page shows open rows on its first view and everything resolved on the second.
Then publish council-board.html to the same artifact URL.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
data = json.loads((HERE / "board_data.json").read_text())
blob = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
html = (HERE / "template.html").read_text().replace("__DATA__", blob)
(HERE.parent / "council-board.html").write_text(html)
print("wrote council-board.html")
