import type { OracleAppMode } from "./mode";

export const READER_URL = "https://wendellbritt.zo.space/oracle";

export type PublishStatus = {
  publish_status: "draft" | "published";
  published_at: string | null;
  published_version: number;
  cards_ready: number;
  total_cards: number;
  reader_url: string;
  has_published_snapshot: boolean;
};

export function deckFetchUrl(appMode: OracleAppMode): string {
  return appMode === "reader" ? "/api/oracle/deck?mode=reader" : "/api/oracle/deck";
}

/** Append query params for published asset routing and optional cache bust. */
export function oracleAssetUrl(
  assetPath: string,
  options: { usePublished?: boolean; cacheKey?: number; publishedVersion?: number } = {}
): string {
  const { usePublished = false, cacheKey, publishedVersion } = options;
  const params = new URLSearchParams();
  if (usePublished) params.set("source", "published");
  if (publishedVersion != null && publishedVersion > 0) {
    params.set("v", String(publishedVersion));
  } else if (cacheKey != null && cacheKey > 0) {
    params.set("v", String(cacheKey));
  }
  const qs = params.toString();
  if (!qs) return assetPath;
  return `${assetPath}${assetPath.includes("?") ? "&" : "?"}${qs}`;
}
