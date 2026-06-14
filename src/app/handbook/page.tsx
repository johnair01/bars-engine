import type { Metadata } from "next";
import { HandbookReader } from "@/components/handbook/HandbookReader";

export const metadata: Metadata = {
  title: "The Handbook — Mastering the Game of Allyship",
  description: "A phone-first digital reader for the front of the book.",
};

export default function HandbookPage() {
  return <HandbookReader chapterId="front-of-book" />;
}
