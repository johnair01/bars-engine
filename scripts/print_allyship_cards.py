#!/usr/bin/env python3
"""Render a review PDF of the Allyship Deck's authored cards (fpdf2).
Reads public/allyship-deck/allyship-deck.json; writes output/allyship-deck/allyship-cards-review.pdf.
Two cards per row, grouped by domain. A review artifact, not the print-house export.
"""
import json, os, textwrap

from fpdf import FPDF

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DECK = os.path.join(ROOT, "public", "allyship-deck", "allyship-deck.json")
OUTDIR = os.path.join(ROOT, "output", "allyship-deck")
OUT = os.path.join(OUTDIR, "allyship-cards-review.pdf")

MOVE_LABEL = {"wake_up": "Wake Up", "open_up": "Open Up", "clean_up": "Clean Up", "grow_up": "Grow Up", "show_up": "Show Up"}
OP_LABEL = {"shaman": "Shaman", "challenger": "Challenger", "regent": "Regent", "architect": "Architect", "diplomat": "Diplomat", "sage": "Sage"}
DOMAIN_LABEL = {"GATHERING_RESOURCES": "Gather Resources", "RAISE_AWARENESS": "Raise Awareness", "DIRECT_ACTION": "Direct Action", "SKILLFUL_ORGANIZING": "Skillful Organizing"}
MOVE_ORDER = ["wake_up", "open_up", "clean_up", "grow_up", "show_up"]
OP_ORDER = ["shaman", "challenger", "regent", "architect", "diplomat", "sage"]

INK = (33, 29, 23)
MUTE = (106, 94, 68)
CINNABAR = (168, 64, 46)
GOLD = (138, 111, 58)
GREEN = (28, 74, 46)
PAPER = (250, 246, 236)
BORDER = (201, 182, 143)

# Card geometry (mm): 2.5 x 3.5 in poker ratio, scaled to fit 2-up on Letter.
CARD_W = 88
CARD_H = 123
GAP = 8
MARGIN = 12


def clean(s: str) -> str:
    # Latin-1 safe (core fonts): replace smart punctuation.
    return (s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
            .replace("—", "-").replace("–", "-").replace("…", "...").replace("→", "->")
            .replace("—", "-"))


def main():
    with open(DECK) as f:
        deck = json.load(f)
    cards = [c for c in deck["cards"] if c.get("kind") == "move" and c.get("status") == "authored"]
    cards.sort(key=lambda c: (MOVE_ORDER.index(c["move"]), OP_ORDER.index(c["operation"])))
    by_domain = {}
    for c in cards:
        by_domain.setdefault(c["domain"], []).append(c)

    pdf = FPDF(orientation="P", unit="mm", format="Letter")
    pdf.set_auto_page_break(auto=False)
    pdf.set_title("The Allyship Deck - authored cards for review")

    def header():
        pdf.set_xy(MARGIN, MARGIN)
        pdf.set_font("Helvetica", "B", 16)
        pdf.set_text_color(*INK)
        pdf.cell(0, 8, "The Allyship Deck - authored cards for review", ln=1)
        pdf.set_x(MARGIN)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*MUTE)
        pdf.cell(0, 5, f"{len(cards)} authored move cards (of 120). Both registers (Self / Campaign) + full anatomy.", ln=1)

    def draw_card(x, y, c):
        pdf.set_draw_color(*BORDER)
        pdf.set_fill_color(*PAPER)
        pdf.rect(x, y, CARD_W, CARD_H, "DF")
        ix = x + 5
        iw = CARD_W - 10
        cy = y + 5

        def line(txt, font, size, color, h=4.0, gap=0.6, lab=None):
            nonlocal cy
            pdf.set_xy(ix, cy)
            if lab:
                pdf.set_font("Helvetica", "B", size)
                pdf.set_text_color(*MUTE)
                pdf.cell(pdf.get_string_width(lab + " "), h, lab)
                pdf.set_font(*font_tuple(font, size))
                pdf.set_text_color(*color)
                pdf.set_x(ix + pdf.get_string_width(lab + " "))
                pdf.multi_cell(iw - pdf.get_string_width(lab + " "), h, txt)
            else:
                pdf.set_font(*font_tuple(font, size))
                pdf.set_text_color(*color)
                pdf.multi_cell(iw, h, txt)
            cy = pdf.get_y() + gap

        def font_tuple(style, size):
            fam = "Helvetica" if style != "times-i" else "Times"
            st = "I" if style in ("i", "times-i") else ("B" if style == "b" else "")
            return (fam, st, size)

        meta = f"{OP_LABEL[c['operation']]}  -  {MOVE_LABEL[c['move']]}  -  {DOMAIN_LABEL[c['domain']]}"
        line(meta.upper(), "", 6.5, GOLD, h=3.2)
        line(clean(c["title"]), "b", 12, INK, h=5.2, gap=1.2)
        line(clean(c["primaryQuestion"]), "i", 8, (90, 63, 42), h=3.6, lab="Self -")
        line(clean(c["campaignQuestion"]), "i", 8, (90, 63, 42), h=3.6, lab="Campaign -")
        line(clean(c["optimizesFor"]), "", 7.5, INK, h=3.4, lab="Optimizes for:")
        fb = c.get("forbiddenMoves") or []
        if fb and not (len(fb) == 1 and fb[0] == "- author -"):
            line(clean(" - ".join(fb)), "", 7.5, INK, h=3.4, lab="Forbidden:")
        fm = c.get("failureModes") or []
        if fm and not (len(fm) == 1 and fm[0] == "- author -"):
            line(clean(" - ".join(fm)), "", 7.5, INK, h=3.4, lab="Failure modes:")
        line(clean(c["remediation"]), "", 7.5, GREEN, h=3.4, lab="Practice:")
        if c.get("flavor"):
            line('"' + clean(c["flavor"]) + '"', "i", 7.5, MUTE, h=3.4)
        caps = ", ".join(c.get("capabilities") or []) or "-"
        pdf.set_xy(ix, y + CARD_H - 6)
        pdf.set_font("Helvetica", "", 6.5)
        pdf.set_text_color(*GOLD)
        pdf.cell(iw, 3, clean(f"restores: {caps}   ->  {c['outputBar']} BAR"))

    first = True
    for domain, dcards in by_domain.items():
        pdf.add_page()
        if first:
            header()
            top = MARGIN + 16
            first = False
        else:
            top = MARGIN
        pdf.set_xy(MARGIN, top)
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(*CINNABAR)
        pdf.cell(0, 7, f"{DOMAIN_LABEL[domain]} - {len(dcards)} cards", ln=1)
        row_y = pdf.get_y() + 2
        col = 0
        for i, c in enumerate(dcards):
            if row_y + CARD_H > 270 and col == 0:
                pdf.add_page()
                row_y = MARGIN
            x = MARGIN + col * (CARD_W + GAP)
            draw_card(x, row_y, c)
            col += 1
            if col == 2:
                col = 0
                row_y += CARD_H + GAP

    os.makedirs(OUTDIR, exist_ok=True)
    pdf.output(OUT)
    print(f"OK wrote {OUT} ({len(cards)} cards)")


if __name__ == "__main__":
    main()
