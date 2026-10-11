"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Factory, HeartHandshake, Leaf, ListChecks, Sparkles, Tag, Thermometer, Truck, Zap, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { HISTORY_SEED, STORE, type HistoryKind } from "@/lib/data";
import { clock, inr } from "@/lib/format";
import { useSim, type FeedKind, type Tone } from "@/lib/sim";
import { Card, PageTitle, toneMeta } from "../ui";

type Item = {
  id: string;
  minute: number;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  detail?: string;
  batchId?: string;
  value?: number;
  evidence?: string[];
  group: "sensor" | "ai" | "action";
  live?: boolean;
};

const SEED_META: Record<HistoryKind, { icon: LucideIcon; tone: Tone; group: Item["group"] }> = {
  markdown: { icon: Tag, tone: "info", group: "action" },
  transfer: { icon: Truck, tone: "good", group: "action" },
  b2b: { icon: Factory, tone: "warning", group: "action" },
  rescue: { icon: HeartHandshake, tone: "good", group: "action" },
  sensor: { icon: Thermometer, tone: "warning", group: "sensor" },
  decision: { icon: ListChecks, tone: "info", group: "ai" },
  system: { icon: Sparkles, tone: "neutral", group: "ai" },
};

const LIVE_META: Record<FeedKind, { icon: LucideIcon; group: Item["group"] }> = {
  sensor: { icon: Thermometer, group: "sensor" },
  agent: { icon: Sparkles, group: "ai" },
  decision: { icon: ListChecks, group: "ai" },
  action: { icon: Zap, group: "action" },
  impact: { icon: Leaf, group: "action" },
  system: { icon: Sparkles, group: "ai" },
};

const LIVE_EVIDENCE: Record<string, string[]> = {
  decision: [
    "01 Environment · +3.2 °C → shelf life −14 h",
    "02 Visual · 17% early bruising → degradation accelerating",
    "03 Demand · 4.2 vs 10.8 units/h → won't clear before expiry",
    "04 Network · hub demand 13.4/h → transfer clears in ~13 h",
  ],
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "action", label: "Actions" },
  { id: "ai", label: "AI decisions" },
  { id: "sensor", label: "Sensors" },
] as const;

export function HistoryView() {
  const feed = useSim((s) => s.feed);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [open, setOpen] = useState<string | null>(null);

  // deep link from Overview / Decision Center: /history?open=<id>
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("open");
    if (!id) return;
    setOpen(id);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "center", behavior: "smooth" }));
  }, []);

  const live: Item[] = feed.map((e) => ({
    id: e.id,
    minute: e.minute,
    icon: LIVE_META[e.kind].icon,
    tone: e.tone,
    title: e.title,
    detail: e.detail,
    batchId: "STB-042",
    group: LIVE_META[e.kind].group,
    evidence: LIVE_EVIDENCE[e.kind],
    live: true,
  }));
  const seeded: Item[] = HISTORY_SEED.map((h) => ({ ...h, ...SEED_META[h.kind] }));
  const items = [...live, ...seeded].filter((i) => filter === "all" || i.group === filter);

  return (
    <>
      <PageTitle
        title="Autonomous action history"
        subtitle="A traceable record of what FreshChain observed, decided and executed — every decision can be revisited with its evidence."
        right={
          <div className="flex items-center gap-1 rounded-full bg-subtle p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn("relative rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors", filter === f.id ? "text-ink" : "text-ink-3 hover:text-ink")}
              >
                {filter === f.id && <motion.span layoutId="hist-filter" className="absolute inset-0 rounded-full bg-surface shadow-card" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <span className="relative">{f.label}</span>
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-3 flex items-center gap-2 px-1 text-[13px] text-ink-3">
        <span className="font-medium text-ink">Today</span> · {STORE.name} · {items.length} events
      </div>

      <Card className="p-2 sm:p-3">
        <ol className="relative">
          <AnimatePresence initial={false}>
            {items.map((it, idx) => {
              const isOpen = open === it.id;
              const canOpen = !!it.evidence?.length;
              const m = toneMeta(it.tone);
              return (
                <motion.li
                  key={it.id}
                  id={it.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                  className="relative"
                >
                  {idx < items.length - 1 && <span className="absolute bottom-0 left-[83px] top-11 w-px bg-line" aria-hidden />}
                  <div
                    role={canOpen ? "button" : undefined}
                    tabIndex={canOpen ? 0 : undefined}
                    aria-expanded={canOpen ? isOpen : undefined}
                    onClick={() => canOpen && setOpen(isOpen ? null : it.id)}
                    onKeyDown={(e) => {
                      if (canOpen && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        setOpen(isOpen ? null : it.id);
                      }
                    }}
                    className={cn("flex w-full items-start gap-4 rounded-xl px-3 py-3 text-left transition-colors", canOpen && "cursor-pointer hover:bg-subtle/70", isOpen && "bg-subtle/70")}
                  >
                    <span className="w-11 shrink-0 pt-1.5 font-mono text-xs text-ink-3">{clock(it.minute)}</span>
                    <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full", m.bg, m.text)}>
                      <it.icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-medium text-ink">{it.title}</span>
                        {it.live && <span className="rounded bg-info-50 px-1 text-[10px] font-semibold uppercase tracking-wide text-info-ink">Live</span>}
                      </div>
                      {it.detail && <div className="mt-0.5 text-[13px] text-ink-2">{it.detail}</div>}
                    </div>
                    <div className="flex shrink-0 items-center gap-3 pt-1">
                      {it.value ? <span className="text-xs font-medium tabular text-good-ink">+{inr(it.value)}</span> : null}
                      {it.batchId && (
                        <Link href={`/batch/${it.batchId}`} onClick={(e) => e.stopPropagation()} className="hidden rounded-md bg-subtle px-1.5 py-0.5 font-mono text-[11px] text-ink-2 hover:text-ink sm:inline">
                          {it.batchId}
                        </Link>
                      )}
                      {canOpen && <ChevronDown className={cn("size-4 text-ink-3 transition-transform", isOpen && "rotate-180")} />}
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <ul className="mb-3 ml-[108px] mr-4 space-y-1.5 border-l-2 border-brand-100 py-1 pl-4">
                          {it.evidence!.map((e) => (
                            <li key={e} className="text-[13px] text-ink-2">
                              {e}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      </Card>
    </>
  );
}
