import type { Metadata } from "next";
import { InventoryView } from "@/components/views/inventory";

export const metadata: Metadata = { title: "At-risk inventory" };

export default function Page() {
  return <InventoryView />;
}
