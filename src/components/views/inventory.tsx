"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { STORE, type Status } from "@/lib/data";
import { fmt, inr, shelf } from "@/lib/format";
import { api } from "@/lib/api";
import type { IconKey } from "@/lib/data";
import { useBackend, useLiveBatches, usePollInterval, type LiveBatch } from "@/lib/live";

type RowItem = Pick<
  LiveBatch,
  "id" | "name" | "live" | "units" | "unitLabel" | "location" | "risk" | "shelfLifeH" | "printedShelfH" | "signals" | "price" | "status" | "action" | "actionNote"
> & { icon: IconKey; category: string };
import { BatchIcon, Card, Chip, PageTitle, RiskMeter, StatusPill } from "../ui";
import type { Tone } from "@/lib/sim";

const FILTERS: { id: "all" | Status; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "risk", label: "At risk" },
  { id: "healthy", label: "Healthy" },
  { id: "managed", label: "Managed" },
];

const actionTone = (a: string): Tone =>
  a === "Monitor"
    ? "neutral"
    : a === "Resolved"
      ? "good"
      : a.startsWith("Analys") || a.startsWith("Execut")
        ? "info"
        : a === "Transfer + markdown"
          ? "critical"
          : "warning";

export function InventoryView() {
  const local = useLiveBatches();
  const remote = useBackend("items", api.items, usePollInterval());
  // backend rows when connected; the live strawberry row follows the on-screen incident timeline
  const batches: RowItem[] = remote
    ? remote.items.map((i) => {
        const mine = local.find((b) => b.id === i.id && b.live);
        return mine ?? { ...i, icon: i.icon as IconKey, live: false, actionNote: i.actionNote ?? undefined };
      })
    : local;
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("status");
    if (s && FILTERS.some((f) => f.id === s)) setFilter(s as Status);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: batches.length };
    batches.forEach((b) => (c[b.status] = (c[b.status] ?? 0) + 1));
    return c;
  }, [batches]);

  const rows = batches
    .filter((b) => filter === "all" || b.status === filter)
    .filter((b) => {
      const t = q.trim().toLowerCase();
      return !t || `${b.name} ${b.id} ${b.category} ${b.location}`.toLowerCase().includes(t);
    })
    .sort((a, b) => b.risk - a.risk);

  return (
    <>
      <PageTitle
        title="At-risk inventory"
        subtitle="Prioritised by spoilage risk, remaining shelf life and recoverable value. Risk is recalculated live from sensors, vision and sales."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search SKU, batch or location"
            className="h-9 w-full rounded-full bg-surface pl-9 pr-3 text-sm shadow-card outline-none transition-shadow placeholder:text-ink-3 focus:shadow-lift"
          />
        </label>
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full bg-subtle p-0.5">
          {FILTERS.filter((f) => f.id !== "managed" || counts.managed).map((f) => {
            const on = f.id === filter;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn("relative shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors", on ? "text-ink" : "text-ink-3 hover:text-ink")}
              >
                {on && <motion.span layoutId="inv-filter" className="absolute inset-0 rounded-full bg-surface shadow-card" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <span className="relative">
                  {f.label} <span className="tabular text-ink-3">{counts[f.id] ?? 0}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,2.3fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1.5fr)_20px] gap-4 border-b border-line px-5 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3 md:grid">
          <span>SKU</span>
          <span>Spoilage risk</span>
          <span>Shelf life</span>
          <span>Signals</span>
          <span className="text-right">Stock value</span>
          <span>FreshChain action</span>
          <span />
        </div>
        <ul>
          {rows.map((b) => (
            <Row key={b.id} b={b} />
          ))}
          {rows.length === 0 && (
            <li className="px-5 py-12 text-center">
              <div className="text-sm font-medium text-ink-2">{q ? "No batches match your search." : "No tracked batches in this state right now."}</div>
              {!q && filter !== "all" && (
                <div className="mx-auto mt-1 max-w-md text-xs text-ink-3">
                  FreshChain follows {batches.length} high-value batches in detail; the store&apos;s other SKUs in this tier are handled by
                  rule-based FEFO markdowns.
                </div>
              )}
            </li>
          )}
        </ul>
      </Card>
      <p className="mt-3 text-xs text-ink-3">
        Showing {rows.length} tracked batches with live signals out of {fmt(STORE.skus)} SKUs. All data is simulated for this prototype.
      </p>
    </>
  );
}

function Row({ b }: { b: RowItem }) {
  const hot = b.live && (b.status === "critical" || b.status === "risk");
  return (
    <motion.li layout transition={{ type: "spring", stiffness: 380, damping: 38 }} className="border-b border-line last:border-0">
      <Link
        href={`/batch/${b.id}`}
        className={cn(
          "group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors duration-500 hover:bg-subtle/70 md:grid-cols-[minmax(0,2.3fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1.5fr)_20px]",
          hot && "bg-crit-50/50",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <BatchIcon icon={b.icon} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-ink">{b.name}</span>
              {b.live && <span className="rounded bg-info-50 px-1 text-[10px] font-semibold uppercase tracking-wide text-info-ink">Live</span>}
            </div>
            <div className="truncate text-xs text-ink-3">
              {b.id} · {b.units} {b.unitLabel} · {b.location}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 md:order-none">
          <span className="w-9 text-right text-sm font-semibold tabular">{b.risk}%</span>
          <RiskMeter value={b.risk} className="hidden w-16 md:block" />
        </div>

        <div className="hidden text-sm tabular text-ink md:block">
          {shelf(b.shelfLifeH)}
          {b.printedShelfH !== b.shelfLifeH && b.shelfLifeH < 72 && <span className="ml-1 text-xs text-ink-3">/ {shelf(b.printedShelfH)}</span>}
        </div>

        <div className="hidden flex-wrap gap-1 md:flex">
          {b.signals.length ? b.signals.map((s) => <Chip key={s}>{s}</Chip>) : <span className="text-xs text-ink-3">—</span>}
        </div>

        <div className="hidden text-right text-sm tabular text-ink-2 md:block">{inr(b.units * b.price)}</div>

        <div className="col-span-2 flex min-w-0 items-center gap-2 md:col-span-1">
          <StatusPill status={b.status} className="md:hidden" />
          <div className="min-w-0">
            <Chip tone={actionTone(b.action)} className="h-6 px-2 text-xs">
              {b.action}
            </Chip>
            {b.actionNote && <div className="mt-0.5 truncate text-[11px] text-ink-3">{b.actionNote}</div>}
          </div>
        </div>

        <ChevronRight className="hidden size-4 text-ink-3 transition-transform group-hover:translate-x-0.5 md:block" />
      </Link>
    </motion.li>
  );
}
