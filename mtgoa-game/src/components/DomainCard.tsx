/**
 * DomainCard — a domain/situation tile (Core Architecture § The Four Domains).
 * Shows the domain's purpose and, when available, the NPC's domain relevance text.
 */
import type { DomainName } from "@/data/domains";
import { DOMAINS } from "@/data/domains";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Props {
  domain: DomainName;
  relevance?: string;
}

export function DomainCard({ domain, relevance }: Props) {
  const def = DOMAINS[domain];
  return (
    <Card className="bg-surf">
      <CardHeader>
        <CardTitle className="text-sm">{def.name}</CardTitle>
        <span className="ds-label text-muted">{def.purpose}</span>
      </CardHeader>
      {relevance && <CardContent className="text-[11px]">{relevance}</CardContent>}
    </Card>
  );
}
