import type { Metadata } from "next";
import { NetworkView } from "@/components/views/network";

export const metadata: Metadata = { title: "Network & impact" };

export default function Page() {
  return <NetworkView />;
}
