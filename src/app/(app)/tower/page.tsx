import type { Metadata } from "next";
import { TowerView } from "@/components/views/tower";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return <TowerView />;
}
