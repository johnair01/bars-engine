/**
 * Handbook content schema — a chapter is data the reader renders with a
 * `switch` over `block.type`. Add block types as chapters need them.
 *
 * Static blocks (`moves`, `handles`, `houses`, `nations`) carry no copy here
 * because their content is canonical — it lives in the block component. All
 * prose lives in the JSON so writers edit text without touching code.
 *
 * Mirrors how the Oracle feature shapes `deck.json` (data-first, dumb renderers).
 */

export type Block =
  | { type: "hero"; art: string; kicker: string; title: string; sub: string }
  // `lead` = oversized opening line. `**emphasis**` in any line renders cinnabar.
  | { type: "prose"; kicker?: string; lead?: string; paras: string[] }
  | { type: "pullquote"; text: string } // cinnabar italic Cormorant
  | {
      type: "letter";
      kicker: string;
      lead: string;
      paras: string[];
      signature: string;
      signatureNote: string;
      seal: string; // '護'
    }
  | { type: "moves" } // static: the 4 Basic Moves + icons
  | { type: "handles" } // static: House/School/Offer/Cost/Line/Bond
  | { type: "houses" } // INTERACTIVE (app hook A)
  | { type: "roll"; scene: string; move: string; stat: string } // INTERACTIVE: 2d6 + stat
  | { type: "barPrompt"; kicker: string; prompt: string } // INTERACTIVE (app hook B)
  | { type: "nations" } // static: 5 Nation tiles
  | { type: "footer"; nextLabel: string };

export interface Chapter {
  id: string;
  kicker: string;
  title: string;
  blocks: Block[];
}
