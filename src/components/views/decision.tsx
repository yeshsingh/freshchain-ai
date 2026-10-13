"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, ChevronDown, CircleCheck, Cpu, LoaderCircle, Pause, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { HISTORY_SEED, INCIDENT, OPTIONS } from "@/lib/data";
import { clock, inr } from "@/lib/format";
import { useIncident } from "@/lib/live";
import { AGENT_META, AUTO_EXECUTE_S, useSim, type AgentId } from "@/lib/sim";
import { Button, ButtonLink, Card, CardHead, Chip, ConfidenceRing, Eyebrow } from "../ui";

export function DecisionView() {
  const phase = useSim((s) => s.phase);
  if (phase === "idle" || phase === "spiking") return <Empty />;
  return (
    <>
      <div className="mb-6">
        <Eyebrow>AI Decision Center · Strawberry STB-042</Eyebrow>
        <h1 className="mt-1.5 text-[26px] font-semibold tracking-[-0.02em] sm:text-[30px]">Why did FreshChain intervene?</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-2">
          Structured decision evidence — signal → evidence → impact → action. Never raw model chain-of-thought.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Evidence />
          <Options />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <DecisionCard />
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Empty() {
  const start = useSim((s) => s.start);
  const phase = useSim((s) => s.phase);
  const past = HISTORY_SEED.filter((h) => h.value);
  return (
    <div className="mx-auto max-w-2xl py-6">
      <Card className="p-8 text-center sm:p-10">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand">
          <Sparkles className="size-5" strokeWidth={1.75} />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-[-0.01em]">{phase === "spiking" ? "Watching a reading…" : "No active decision"}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
          {phase === "spiking"
            ? "Chiller C-03 is warming up. Agents are only invoked once the rise crosses +3.0 °C — stay here to watch the decision form."
            : "FreshChain only calls its agents when a cheap rule-based trigger fires. Simulate a temperature spike to watch a decision form in real time."}
        </p>
        {phase === "idle" && (
          <Button variant="primary" className="mt-6" onClick={start}>
            <Zap className="size-4" fill="currentColor" />
            Simulate temperature spike
          </Button>
        )}
      </Card>
      <div className="mt-8">
        <Eyebrow className="mb-3 px-1">Earlier decisions today</Eyebrow>
        <Card className="divide-y divide-line">
          {past.map((h) => (
            <Link key={h.id} href={`/history?open=${h.id}`} className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-subtle/70">
              <span className="w-10 font-mono text-[11px] text-ink-3">{clock(h.minute)}</span>
              <span className="flex-1 truncate">
                <span className="font-medium">{h.title}</span> <span className="text-ink-3">· {h.detail}</span>
              </span>
              <span className="text-xs font-medium tabular text-good-ink">{inr(h.value!)}</span>
            </Link>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

type Row = { n: string; title: string; value: string; evidence: string; impact: string; agent: AgentId; tone: "critical" | "warning" | "info" };

const ROWS: Row[] = [
  {
    n: "01",
    title: "Environment",
    value: "Temperature +3.2 °C",
    evidence: "Chiller C-03 at 7.2 °C vs 4.0 °C · humidity 91%",
    impact: "Shelf life −7 h",
    agent: "quality",
    tone: "critical",
  },
  {
    n: "02",
    title: "Visual quality",
    value: "17% early bruising",
    evidence: "4 of 24 units flagged by vision check",
    impact: "Shelf life −7 h",
    agent: "quality",
    tone: "warning",
  },
  {
    n: "03",
    title: "Demand",
    value: "4.2 vs 10.8 units/h",
    evidence: "Footfall −24% · −20% markdown lifts sales to 6.4/h",
    impact: "Won't clear before expiry",
    agent: "pricing",
    tone: "critical",
  },
  {
    n: "04",
    title: "Network",
    value: "Whitefield Micro-Hub headroom 6.5/h",
    evidence: "2.4 km · ETA 18 min · cold space for 120",
    impact: "Transfer clears in ~13 h",
    agent: "logistics",
    tone: "info",
  },
];

function Evidence() {
  const agents = useSim((s) => s.agents);
  const inc = useIncident();
  const rows: Row[] = inc.evidence
    ? inc.evidence.map((e, i) => ({
        n: e.n,
        title: e.title,
        value: e.value,
        evidence: e.evidence,
        impact: e.impact,
        agent: (["quality", "quality", "pricing", "logistics"] as AgentId[])[i] ?? "coordinator",
        tone: e.tone === "critical" || e.tone === "warning" ? e.tone : "info",
      }))
    : ROWS;
  return (
    <Card className="p-5 sm:p-6">
      <CardHead title="Decision evidence" subtitle="Each signal is contributed by one agent and verified against sensor or sales data" />
      <ol className="mt-5 space-y-2">
        {rows.map((r, i) => {
          const ready = agents[r.agent] === "done";
          const working = agents[r.agent] === "running";
          // the temperature reading itself is known the moment the rule fires
          const partial = i === 0 && !ready;
          return (
            <li key={r.n} className="relative">
              <AnimatePresence mode="wait" initial={false}>
                {ready || partial ? (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                    className="grid grid-cols-[28px_1fr] items-start gap-x-3 gap-y-2 rounded-xl bg-subtle/70 p-4 sm:grid-cols-[28px_minmax(0,1.1fr)_minmax(0,1.4fr)_auto]"
                  >
                    <span className={cn("pt-0.5 font-mono text-[13px] font-semibold", r.tone === "critical" ? "text-crit-ink" : r.tone === "warning" ? "text-warn-ink" : "text-info-ink")}>
                      {r.n}
                    </span>
                    <div>
                      <div className="text-[15px] font-semibold">{r.title}</div>
                      <div className="text-[13px] text-ink-2">{r.value}</div>
                    </div>
                    <div className="col-start-2 text-xs leading-relaxed text-ink-3 sm:col-start-auto sm:pt-0.5">{r.evidence}</div>
                    <div className="col-start-2 flex flex-wrap items-center gap-1.5 sm:col-start-auto sm:flex-col sm:items-end">
                      {partial ? (
                        <span className="inline-flex items-center gap-1 text-xs text-ink-3">
                          <LoaderCircle className="size-3 animate-spin" /> estimating
                        </span>
                      ) : (
                        <Chip tone={r.tone}>{r.impact}</Chip>
                      )}
                      <span className="text-[11px] text-ink-3">{AGENT_META[r.agent].name} agent</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="pending"
                    exit={{ opacity: 0 }}
                    className={cn("flex items-center gap-3 rounded-xl border border-dashed border-line-strong p-4 text-[13px]", working ? "text-ink-2" : "text-ink-3")}
                  >
                    <span className="w-7 font-mono font-semibold opacity-60">{r.n}</span>
                    {working ? (
                      <>
                        <LoaderCircle className="size-3.5 animate-spin text-info" />
                        <span className="shimmer-text font-medium">{AGENT_META[r.agent].name} agent assessing {r.title.toLowerCase()}…</span>
                      </>
                    ) : (
                      <span>
                        {r.title} · waiting for {AGENT_META[r.agent].name} agent
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function Options() {
  const done = useSim((s) => s.agents.coordinator === "done");
  const running = useSim((s) => s.agents.coordinator === "running");
  const inc = useIncident();
  const options: { id: string; label: string; detail: string; sellThrough: number; waste: number; value: number; selected?: boolean }[] =
    inc.options ?? [...OPTIONS];
  return (
    <Card className="p-5 sm:p-6">
      <CardHead title="Options evaluated" subtitle="Coordinator agent scores every action by expected sell-through, waste and value versus doing nothing" />
      {!done ? (
        <div className="mt-5 flex h-40 items-center justify-center rounded-xl border border-dashed border-line-strong text-[13px] text-ink-3">
          {running ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="size-3.5 animate-spin text-info" />
              <span className="shimmer-text font-medium">Coordinator weighing {options.length} options…</span>
            </span>
          ) : (
            "Waiting for agent assessments"
          )}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.06em] text-ink-3">
                <th className="pb-2 font-medium">Option</th>
                <th className="pb-2 font-medium">Sell-through</th>
                <th className="pb-2 text-right font-medium">Waste</th>
                <th className="pb-2 text-right font-medium">Value vs. nothing</th>
              </tr>
            </thead>
            <tbody>
              {options.map((o, i) => {
                const sel = !!o.selected;
                return (
                  <motion.tr
                    key={o.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.35 }}
                    className={cn("border-t border-line", sel && "bg-brand-50/70")}
                  >
                    <td className="py-3 pl-2 pr-3">
                      <div className="flex items-center gap-2">
                        {sel ? (
                          <span className="flex size-4 items-center justify-center rounded-full bg-brand text-white">
                            <Check className="size-2.5" strokeWidth={3.5} />
                          </span>
                        ) : (
                          <span className="size-4 rounded-full border border-line-strong" />
                        )}
                        <span className={cn("font-medium", sel ? "text-ink" : "text-ink-2")}>{o.label}</span>
                      </div>
                      <div className="ml-6 text-xs text-ink-3">{o.detail}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-subtle">
                          <div className={cn("h-full rounded-full", sel ? "bg-brand" : "bg-ink-3/50")} style={{ width: `${o.sellThrough}%` }} />
                        </div>
                        <span className="tabular text-xs text-ink-2">{o.sellThrough}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-right tabular text-ink-2">{o.waste}</td>
                    <td className={cn("py-3 pr-2 text-right font-medium tabular", o.value > 0 ? (sel ? "text-good-ink" : "text-ink") : o.value < 0 ? "text-crit-ink" : "text-ink-3")}>
                      {o.value === 0 ? "—" : `${o.value > 0 ? "+" : "−"}${inr(Math.abs(o.value))}`}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-ink-3">
            Offloading now loses money: 71 punnets would still sell at full price. B2B offload stays armed as a fallback at T−4 h.
          </p>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function DecisionCard() {
  const phase = useSim((s) => s.phase);
  const agents = useSim((s) => s.agents);
  const countdown = useSim((s) => s.countdown);
  const { approve, hold } = useSim.getState();
  const inc = useIncident();
  const forming = phase === "anomaly" || phase === "analyzing";

  if (forming)
    return (
      <Card className="p-5">
        <Eyebrow>AI decision</Eyebrow>
        <div className="mt-2 text-lg font-semibold">
          <span className="shimmer-text">Forming a plan…</span>
        </div>
        <ul className="mt-4 space-y-2.5">
          {(Object.keys(AGENT_META) as AgentId[]).map((a) => (
            <li key={a} className="flex items-center gap-2.5 text-[13px]">
              {agents[a] === "done" ? (
                <CircleCheck className="size-4 text-brand" />
              ) : agents[a] === "running" ? (
                <LoaderCircle className="size-4 animate-spin text-info" />
              ) : (
                <span className="size-4 rounded-full border border-line-strong" />
              )}
              <span className={agents[a] === "idle" ? "text-ink-3" : "text-ink"}>{AGENT_META[a].name}</span>
              <span className="truncate text-xs text-ink-3">{AGENT_META[a].role}</span>
            </li>
          ))}
        </ul>
      </Card>
    );

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}>
      <Card className="overflow-hidden">
        <div className="bg-brand-50 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Eyebrow className="text-brand">AI decision</Eyebrow>
              <div className="mt-2 text-xl font-semibold tracking-[-0.01em] text-ink">Redistribute + markdown</div>
            </div>
            <div className="relative">
              <ConfidenceRing value={inc.confidence} size={60} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[15px] font-semibold leading-none">{inc.confidence}%</span>
                <span className="mt-0.5 text-[9px] uppercase tracking-wide text-ink-3">conf.</span>
              </div>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-[13px]">
            <li className="flex items-baseline justify-between gap-3">
              <span className="text-ink-2">Transfer</span>
              <span className="text-right font-medium">{inc.transferUnits} → {inc.hubName}</span>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span className="text-ink-2">Markdown</span>
              <span className="text-right font-medium">{inc.markdownUnits} · ₹{inc.price} → ₹{inc.priceAfter}</span>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span className="text-ink-2">Expected waste</span>
              <span className="text-right font-medium">{inc.baselineWaste} → {inc.planWaste} punnets</span>
            </li>
          </ul>
        </div>
        <div className="p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-ink-3">Value preserved</span>
            <span className="text-2xl font-semibold tracking-[-0.02em] text-good-ink">{inr(inc.valuePreserved)}</span>
          </div>
          {inc.rationale && <p className="mt-2 text-xs leading-relaxed text-ink-2">{inc.rationale}</p>}
          <div className="mt-3 rounded-xl bg-subtle px-3 py-2.5 text-xs text-ink-2">
            <span className="font-medium text-ink">Fallback armed:</span> if under 70% sold by T−4 h, offload the rest to FreshPress Juicery, then
            Annapurna Food Rescue.
          </div>

          <div className="mt-4">
            {phase === "decided" && (
              <div className="space-y-2">
                <Button variant="primary" size="lg" className="w-full tabular" onClick={approve}>
                  <Check className="size-4" strokeWidth={2.5} />
                  Execute now · auto in {countdown ?? AUTO_EXECUTE_S}s
                </Button>
                <Button variant="ghost" size="sm" className="w-full" onClick={hold}>
                  <Pause className="size-3.5" /> Hold for review
                </Button>
                <div className="h-1 overflow-hidden rounded-full bg-subtle">
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-1000 ease-linear"
                    style={{ width: `${(((countdown ?? AUTO_EXECUTE_S) - 1) / AUTO_EXECUTE_S) * 100}%` }}
                  />
                </div>
              </div>
            )}
            {phase === "held" && (
              <div className="space-y-2">
                <Button variant="primary" size="lg" className="w-full" onClick={approve}>
                  <Check className="size-4" strokeWidth={2.5} /> Approve plan
                </Button>
                <p className="text-center text-xs text-warn-ink">Held by you · auto-execution paused</p>
              </div>
            )}
            {(phase === "executing" || phase === "resolved") && (
              <ButtonLink href={phase === "resolved" ? "/network" : "/execution"} variant={phase === "resolved" ? "secondary" : "dark"} size="lg" className="w-full">
                {phase === "resolved" ? (
                  <>
                    <CircleCheck className="size-4 text-good" /> Executed · see impact
                  </>
                ) : (
                  <>
                    <LoaderCircle className="size-4 animate-spin" /> Executing · open live log
                  </>
                )}
                <ArrowRight className="size-4" />
              </ButtonLink>
            )}
          </div>
        </div>
        <ModelFooter />
      </Card>
    </motion.div>
  );
}

function ModelFooter() {
  const [open, setOpen] = useState(false);
  const inc = useIncident();
  const fallback = {
    batch: "STB-042",
    decay: INCIDENT.bruising,
    shelf_h: INCIDENT.shelfAfter,
    actions: ["TRANSFER:84:hub-whitefield", "MARKDOWN:100:0.20"],
    fallback: "B2B_OFFLOAD@T-4h",
    confidence: INCIDENT.confidence / 100,
  };
  const meta = inc.modelMeta;
  const engine = !inc.fromBackend
    ? `Gemini Flash · 1 call · ${INCIDENT.tokensIn.toLocaleString("en-IN")} tokens (${INCIDENT.tokensCachedPct}% cached) · $${INCIDENT.costUsd}`
    : inc.modelUsed === "rules"
      ? "Rules engine · 0 tokens · add a Gemini key to let the model choose"
      : `${inc.modelUsed} · 1 call · ${meta?.tokensIn ?? "?"} tokens in · ${meta?.latencyMs ?? "?"} ms`;
  return (
    <div className="border-t border-line px-5 py-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-left text-xs text-ink-3 transition-colors hover:text-ink" aria-expanded={open}>
        <Cpu className="size-3.5 shrink-0" />
        <span className="flex-1">{engine}</span>
        <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <p className="mt-3 text-xs text-ink-3">Structured JSON output — no conversational filler, no chain-of-thought.</p>
            <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-ink p-3 font-mono text-[11px] leading-relaxed text-white/85">
              {JSON.stringify(inc.decisionJson ?? fallback, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
