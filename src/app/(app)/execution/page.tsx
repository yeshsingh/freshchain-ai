import type { Metadata } from "next";
import { ExecutionView } from "@/components/views/execution";

export const metadata: Metadata = { title: "Action execution" };

export default function Page() {
  return <ExecutionView />;
}
