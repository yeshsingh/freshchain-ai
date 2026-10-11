"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronRight, LoaderCircle, PackageCheck, Sparkles, Store, Tag, Truck, Warehouse, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { INCIDENT } from "@/lib/data";
import { clock, inr } from "@/lib/format";
import { AUTO_EXECUTE_S, useSim, type WebhookCall } from "@/lib/sim";
import { Button, ButtonLink, Card, CardHead, Chip, Eyebrow } from "../ui";

export function ExecutionView() {
  const phase = useSim((s) => s.phase);
  if (phase !== "executing" && phase !== "resolved") return <Waiting />;
  return (
    <>
      <div className="mb-6">
        <Eyebrow>Action execution · Strawberry STB-042</Eyebrow>
        <h1 className="mt-1.5 text-[26px] font-semibold tracking-[-0.02em] sm:text-[30px]">Autonomous action execution</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-2">
          FreshChain doesn&apos;t stop at recommendations — it closes the loop through logistics APIs, e-paper shelf labels and purchasing
          webhooks (simulated).
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <TransferCard />
        <PricingCard />
        <Console />
        <ValueBanner />
      </div>
    </>
  );
}

function Waiting() {
  const phase = useSim((s) => s.phase);
  const countdown = useSim((s) => s.countdown);
  const { start, approve } = useSim.getState();
  const pending = phase === "decided" || phase === "held";
  return (
    <div className="mx-auto max-w-xl py-10">
      <Card className="p-8 text-center sm:p-10">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand">
          <Zap className="size-5" strokeWidth={1.75} />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-[-0.01em]">{pending ? "Plan ready to execute" : "Nothing executing"}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-2">
          {pending
            ? phase === "held"
              ? "You held this plan. Approve to transfer 84 punnets and reprice 100."
              : `FreshChain will execute automatically in ${countdown ?? AUTO_EXECUTE_S}s unless you hold it.`
            : phase === "idle"
              ? "Actions appear here the moment FreshChain decides. Start the scenario to watch transfers and price changes fire."
              : "Agents are still analysing the batch. Execution starts once a plan is chosen."}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {pending && (
            <Button variant="primary" onClick={approve}>
              <Check className="size-4" strokeWidth={2.5} /> Execute now
            </Button>
          )}
          {phase === "idle" && (
            <Button variant="primary" onClick={start}>
              <Zap className="size-4" fill="currentColor" /> Simulate temperature spike
            </Button>
          )}
          {!pending && phase !== "idle" && (
            <ButtonLink href="/decision" variant="secondary">
              <Sparkles className="size-4" /> Watch the decision form
            </ButtonLink>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const STEPS = ["Created", "Picked", "Dispatched", "Delivered"];

function TransferCard() {
  const stage = useSim((s) => s.transferStage);
  const progress = [0.04, 0.16, 0.32, 0.58][stage];
  return (
    <Card className="p-5 sm:p-6 lg:col-span-7">
      <CardHead
        title="Redistribution"
        icon={Truck}
        subtitle={`Transfer ${INCIDENT.transferId} · cold-chain van`}
        right={<StatusBadge done={stage >= 1} label={stage >= 3 ? "In transit" : stage >= 1 ? "Executed" : "Creating"} />}
      />
      <div className="mt-6 flex items-center gap-4">
        <Endpoint icon={Store} title="Store #042" sub="84 punnets out" />
        <div className="relative h-10 flex-1">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line-strong" />
          <motion.div className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-brand" initial={false} animate={{ width: `${progress * 100}%` }} transition={{ duration: 1.4, ease: [0.25, 1, 0.5, 1] }} />
          <motion.div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={false}
            animate={{ left: `${progress * 100}%` }}
            transition={{ duration: 1.4, ease: [0.25, 1, 0.5, 1] }}
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-surface text-brand shadow-lift">
              <Truck className="size-4" strokeWidth={1.75} />
            </span>
          </motion.div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-ink-3">2.4 km · ETA 18 min</div>
        </div>
        <Endpoint icon={Warehouse} title="Whitefield Hub" sub="13.4 units/h demand" align="right" />
      </div>
      <ol className="mt-9 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => {
          const done = stage > i;
          const on = stage === i;
          return (
            <li key={s} className="text-center">
              <div className={cn("mx-auto mb-1.5 h-1 rounded-full transition-colors duration-500", done ? "bg-brand" : on ? "bg-brand/40" : "bg-subtle")} />
              <span className={cn("text-xs transition-colors", done ? "font-medium text-ink" : "text-ink-3")}>{s}</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function Endpoint({ icon: Icon, title, sub, align = "left" }: { icon: typeof Store; title: string; sub: string; align?: "left" | "right" }) {
  return (
    <div className={cn("flex w-32 shrink-0 flex-col gap-1.5", align === "right" ? "items-end text-right" : "items-start")}>
      <span className="flex size-10 items-center justify-center rounded-xl bg-subtle text-ink-2">
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </span>
      <div>
        <div className="text-[13px] font-semibold">{title}</div>
        <div className="text-[11px] text-ink-3">{sub}</div>
      </div>
    </div>
  );
}

function StatusBadge({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-xs font-medium transition-colors duration-500", done ? "bg-good-50 text-good-ink" : "bg-info-50 text-info-ink")}>
      {done ? <Check className="size-3" strokeWidth={3} /> : <LoaderCircle className="size-3 animate-spin" />}
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */

function PricingCard() {
  const price = useSim((s) => s.eslPrice);
  const marked = price !== INCIDENT.price;
  return (
    <Card className="p-5 sm:p-6 lg:col-span-5">
      <CardHead title="Dynamic pricing" icon={Tag} subtitle="2 e-paper labels · Aisle 3" right={<StatusBadge done={marked} label={marked ? "Executed" : "Updating"} />} />
      <div className="mt-5 flex justify-center [perspective:800px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={price}
            initial={{ rotateX: -90, opacity: 0.4 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0.4 }}
            transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            className="w-full max-w-[290px] rounded-lg border border-[#d9dbd6] bg-[#eceee9] p-4 font-mono text-[#1d1f1c] shadow-[inset_0_1px_0_white,0_2px_6px_rgb(0_0_0/0.06)]"
          >
            <div className="flex items-start justify-between text-[10px] uppercase tracking-wider">
              <span>Strawberry · 250 g</span>
              <span>ESL-3-114</span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                {marked && <div className="text-xs text-[#55574f] line-through">₹{INCIDENT.price}.00</div>}
                <div className="text-[34px] font-bold leading-none tracking-tight">₹{price}.00</div>
              </div>
              {marked && <div className="rounded bg-[#1d1f1c] px-1.5 py-0.5 text-[11px] font-bold text-[#eceee9]">−20%</div>}
            </div>
            <div className="mt-3 flex items-end justify-between">
              <span className="text-[9px] uppercase tracking-wider">{marked ? "Fresh deal · best today" : "Nandi Hills Farms"}</span>
              <span className="flex h-5 items-end gap-px" aria-hidden>
                {[2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2].map((w, i) => (
                  <span key={i} className="h-full bg-[#1d1f1c]" style={{ width: w }} />
                ))}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-xs text-ink-3">Units</div>
          <div className="text-[15px] font-semibold">100</div>
        </div>
        <div>
          <div className="text-xs text-ink-3">Demand</div>
          <div className="text-[15px] font-semibold">4.2 → 6.4/h</div>
        </div>
        <div>
          <div className="text-xs text-ink-3">Clears in</div>
          <div className="text-[15px] font-semibold">15.6 h</div>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function Console() {
  const hooks = useSim((s) => s.webhooks);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="overflow-hidden rounded-2xl bg-[#0f1714] text-white shadow-card lg:col-span-12">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
          </span>
          <span className="ml-2">Actions sent</span>
          <span className="text-white/40">· simulated webhooks · click a row for its payload</span>
        </div>
        <span className="font-mono text-[11px] text-white/40">{hooks.filter((h) => h.status === "done").length}/4 delivered</span>
      </div>
      <ul className="divide-y divide-white/5 font-mono text-[12px]">
        <AnimatePresence initial={false}>
          {hooks.map((h) => (
            <motion.li key={h.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.3 }}>
              <HookRow h={h} open={open === h.id} onToggle={() => setOpen(open === h.id ? null : h.id)} />
            </motion.li>
          ))}
        </AnimatePresence>
        {hooks.length === 0 && <li className="px-5 py-4 text-white/40">Waiting for first call…</li>}
      </ul>
    </div>
  );
}

const HOOK_LABEL: Record<string, string> = {
  "w-transfer": "Transfer 84 punnets to Whitefield Hub",
  "w-esl": "Reprice 2 shelf labels ₹180 → ₹144",
  "w-po": "Trim the next strawberry order by 12%",
  "w-ticket": "Raise maintenance ticket for Chiller C-03",
};

function HookRow({ h, open, onToggle }: { h: WebhookCall; open: boolean; onToggle: () => void }) {
  const done = h.status === "done";
  return (
    <>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-white/[0.03]">
        <span className="w-10 shrink-0 text-white/40">{clock(h.minute)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-sans text-[13px] text-white/90">{HOOK_LABEL[h.id] ?? h.system}</span>
          <span className="block truncate text-[11px] text-white/40">
            <span className="text-[#8fd3a8]">{h.method}</span> {h.endpoint}
          </span>
        </span>
        <span className="w-24 text-right">
          {done ? (
            <span className="text-[#8fd3a8]">
              {h.code} <span className="text-white/40">{h.latencyMs}ms</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-white/50">
              <LoaderCircle className="size-3 animate-spin" /> sending
            </span>
          )}
        </span>
        <ChevronRight className={cn("size-3.5 text-white/30 transition-transform", open && "rotate-90")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.pre
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden bg-black/25 px-5 py-3 text-[11px] leading-relaxed text-white/70"
          >
            {JSON.stringify(h.payload, null, 2)}
          </motion.pre>
        )}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------------------------ */

function ValueBanner() {
  const resolved = useSim((s) => s.phase === "resolved");
  const [open, setOpen] = useState(false);
  const lines = [
    { label: "Hub sales · 84 × ₹180", v: 15120 },
    { label: "Store sales at markdown · 96 × ₹144", v: 13824 },
    { label: "Cold-chain transfer cost", v: -INCIDENT.transferCost },
    { label: "Baseline if nothing done · 71 × ₹180", v: -12780 },
  ];
  return (
    <Card className={cn("overflow-hidden transition-colors duration-700 lg:col-span-12", resolved && "bg-brand-50")}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 p-5 text-left sm:p-6">
        <span className={cn("flex size-10 items-center justify-center rounded-xl transition-colors duration-700", resolved ? "bg-brand text-white" : "bg-subtle text-ink-3")}>
          <PackageCheck className="size-5" strokeWidth={1.75} />
        </span>
        <div className="flex-1">
          <div className="text-xs text-ink-3">{resolved ? "Value preserved" : "Potential value preserved"}</div>
          <div className="text-2xl font-semibold tracking-[-0.02em] text-good-ink">{inr(INCIDENT.valuePreserved)}</div>
        </div>
        <div className="hidden text-right text-xs text-ink-3 sm:block">
          <div>113 → 4 punnets wasted</div>
          <div>27 kg food · 68 kg CO₂e saved</div>
        </div>
        <Chip className="hidden sm:inline-flex">{open ? "Hide" : "How it's calculated"}</Chip>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <ul className="mx-5 mb-5 space-y-1.5 border-t border-line pt-4 text-[13px] sm:mx-6">
              {lines.map((l) => (
                <li key={l.label} className="flex justify-between">
                  <span className="text-ink-2">{l.label}</span>
                  <span className={cn("tabular", l.v < 0 ? "text-ink-2" : "text-ink")}>
                    {l.v < 0 ? "−" : "+"}
                    {inr(Math.abs(l.v))}
                  </span>
                </li>
              ))}
              <li className="flex justify-between border-t border-line pt-2 font-semibold">
                <span>Value preserved vs. doing nothing</span>
                <span className="tabular text-good-ink">{inr(INCIDENT.valuePreserved)}</span>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
