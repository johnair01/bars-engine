export type ChapterOneLeadState =
  | { ok: true; emailed: boolean; message: string; readerHref: string }
  | { ok: false; error: string }
