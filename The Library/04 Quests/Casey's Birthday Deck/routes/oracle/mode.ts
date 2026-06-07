export type OracleAppMode = "editor" | "reader";
export type ViewMode = "shuffle" | "grid" | "single";

/** Editor vs reader: `?mode=reader|editor` overrides; default is editor in dev, reader in production. */
export function getOracleAppMode(): OracleAppMode {
  const param = new URLSearchParams(window.location.search).get("mode");
  if (param === "reader") return "reader";
  if (param === "editor") return "editor";
  return import.meta.env.DEV ? "editor" : "reader";
}

export function getInitialView(mode: OracleAppMode): ViewMode {
  return mode === "editor" ? "grid" : "shuffle";
}

export function modeToggleHref(target: OracleAppMode): string {
  const url = new URL(window.location.href);
  url.searchParams.set("mode", target);
  return `${url.pathname}${url.search}`;
}

export function isReaderPreviewInDev(appMode: OracleAppMode): boolean {
  return import.meta.env.DEV && appMode === "reader";
}
