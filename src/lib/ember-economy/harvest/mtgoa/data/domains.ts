/**
 * The Four Domains — where encounters are located and situations resolved.
 *
 * Canonical source: "MTGOA Game — Core Architecture" § The Encounter Engine.
 * Card acquisition follows the Pokemon model: each domain card carries a loot
 * table (2–3 possible move cards) earned by resolving the situation, not bought.
 */

export type DomainName =
  | "Gather Resources"
  | "Raise Awareness"
  | "Direct Action"
  | "Skillful Organizing";

export interface DomainDef {
  name: DomainName;
  purpose: string;
}

export const DOMAINS: Record<DomainName, DomainDef> = {
  "Gather Resources": {
    name: "Gather Resources",
    purpose: "Increase available capacity",
  },
  "Raise Awareness": {
    name: "Raise Awareness",
    purpose: "Increase accuracy",
  },
  "Direct Action": {
    name: "Direct Action",
    purpose: "Create change",
  },
  "Skillful Organizing": {
    name: "Skillful Organizing",
    purpose: "Create stability",
  },
};

export const DOMAIN_NAMES: DomainName[] = [
  "Gather Resources",
  "Raise Awareness",
  "Direct Action",
  "Skillful Organizing",
];
