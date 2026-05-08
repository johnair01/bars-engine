import { NextRequest, NextResponse } from "next/server";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { map321ToBarDraft, type Shadow321File } from "@/lib/quest-grammar/map321ToBarDraft";
import { createCustomBar } from "@/actions/create-bar";

const LIBRARY_321_DIR = "/home/workspace/The Library/The Library/03 BARs/321";

export async function POST(request: NextRequest) {
  let fileId: string | undefined;
  let chapterOverride: string | undefined;

  try {
    const body = (await request.json()) as { fileId?: string; chapter?: string };
    fileId = body.fileId;
    chapterOverride = body.chapter;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let filePath: string;
  if (fileId) {
    filePath = resolve(LIBRARY_321_DIR, `${fileId}.json`);
  } else {
    const files = readdirSync(LIBRARY_321_DIR).filter((f) => f.endsWith(".json"));
    if (!files.length) {
      return NextResponse.json({ error: "No 321 files found" }, { status: 404 });
    }
    files.sort();
    const latest = files[files.length - 1];
    filePath = resolve(LIBRARY_321_DIR, latest);
    fileId = latest.replace(/\.json$/, "");
  }

  let rawFile: Shadow321File;
  try {
    rawFile = JSON.parse(readFileSync(filePath, "utf-8")) as Shadow321File;
  } catch {
    return NextResponse.json(
      { error: `Could not read or parse file: ${fileId}` },
      { status: 400 }
    );
  }

  if (!rawFile.id || !rawFile.thirdPerson || !rawFile.firstPerson) {
    return NextResponse.json(
      {
        error: "Missing required 321 fields",
        required: ["id", "thirdPerson", "firstPerson"],
        has: Object.keys(rawFile),
      },
      { status: 400 }
    );
  }

  const draft = map321ToBarDraft(rawFile);

  const formData = new FormData();
  formData.set("title", draft.systemTitle || rawFile.id);
  formData.set("description", draft.body);
  formData.set("visibility", "private");
  formData.set("tags", draft.tags.join(","));
  formData.set(
    "metadata321",
    JSON.stringify({
      title: draft.systemTitle || rawFile.id,
      description: draft.body,
      tags: draft.tags,
      barDraftFrom321: true,
      moveType: null,
      source321FullText: draft.source321FullText,
      systemTitle: draft.systemTitle,
    })
  );
  formData.set("quickFrom321", "true");
  formData.set("inputType", "text");
  formData.set("inputLabel", "321 response");

  const result = await createCustomBar(null, formData);

  if (!result || "error" in result) {
    const errMsg = (result as { error: string })?.error ?? "Unknown error";
    return NextResponse.json({ error: `createCustomBar failed: ${errMsg}` }, { status: 500 });
  }

  const barId = (result as { barId: string }).barId;

  return NextResponse.json({
    barId,
    draft: {
      systemTitle: draft.systemTitle,
      body: draft.body,
      tags: draft.tags,
      moveType: null,
      source321FullText: draft.source321FullText,
    },
    sourceFile: `03 BARs/321/${fileId}.json`,
  });
}