import type { Metadata } from "next";
import { DecisionView } from "@/components/views/decision";

export const metadata: Metadata = { title: "AI Decision Center" };

export default function Page() {
  return <DecisionView />;
}
