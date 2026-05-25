import type { Metadata } from "next";
import { OracleReader } from "@/components/oracle/OracleReader";

export const metadata: Metadata = {
  title: "Oracle at the Edge of the Known World",
  description: "A deck for Casey — shuffle, draw, choose your depth.",
};

export default function OraclePage() {
  return <OracleReader />;
}
