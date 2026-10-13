import type { Metadata } from "next";
import { BatchView } from "@/components/views/batch";
import { BATCHES, getBatch } from "@/lib/data";

export function generateStaticParams() {
  return BATCHES.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const b = getBatch(id);
  return { title: b ? `${b.name} · ${b.id}` : "Batch" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BatchView id={id} />;
}
