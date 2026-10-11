"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Check,
  CircleAlert,
  CircleCheck,
  Leaf,
  LoaderCircle,
  ShieldCheck,
  Snowflake,
  Sparkles,
  ThermometerSun,
  TrendingDown,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CHILLERS, HISTORY_SEED, INCIDENT, STORE } from "@/lib/data";
import { clock, fmt, inr } from "@/lib/format";
import { useStoreCounts } from "@/lib/live";
import { AGENT_META, AUTO_EXECUTE_S, useSim, type AgentId } from "@/lib/sim";
import { Sparkline } from "../charts";
import { AnimatedNumber, Button, ButtonLink, Card, CardHead, Chip, Eyebrow, LiveDot, toneMeta } from "../ui";

export function TowerView() {
  const phase = useSim((s) => s.phase);
  const headline =
    phase === "idle"
      ? `Everything is under control. FreshChain is watching ${fmt(STORE.skus)} SKUs across ${fmt(STORE.sensors)} sensors.`
      : phase === "resolved"
        ? "FreshChain handled one incident on its own. Nothing needs you right now."
        : phase === "spiking"
          ? "FreshChain is watching an unusual reading in Chiller C-03."
          : "One batch needs attention — FreshChain is on it.";

  return (
    <>
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>
            {STORE.name} · {STORE.area}, {STORE.city}
          </Eyebrow>
          <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.025em] text-ink sm:text-[32px]">Good morning, Store Manager</h1>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={headline}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="mt-1 text-[15px] text-ink-2"
            >
              {headline}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <CountTiles />
          <AttentionCard />
          <TodayImpact />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <ColdChain />
          <Activity />
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function CountTiles() {
  const c = useStoreCounts();
  const tiles = [
    { key: "healthy", label: "Healthy", value: c.healthy, dot: "bg-good", icon: CircleCheck, href: "/inventory?status=healthy" },
    { key: "risk", label: "At risk", value: c.risk, dot: "bg-warn", icon: CircleAlert, href: "/inventory?status=risk" },
    { key: "critical", label: "Critical", value: c.critical, dot: "bg-crit", icon: TriangleAlert, href: "/inventory?status=critical" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {tiles.map((t) => (
        <Link key={t.key} href={t.href} className="group min-w-0 rounded-2xl bg-surface p-3.5 shadow-card transition-shadow hover:shadow-lift sm:p-5">
          <div className="flex items-center gap-1.5 text-[13px] text-ink-2">
            <span className={cn("size-2 rounded-full", t.dot)} />
            {t.label}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <AnimatedNumber value={t.value} className="text-[22px] font-semibold tracking-[-0.02em] sm:text-[30px]" />
            <span className="hidden text-xs text-ink-3 sm:inline">SKUs</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-ink-3 opacity-0 transition-opacity group-hover:opacity-100">
            View <ArrowRight className="size-3" />
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] as const },
};

function AttentionCard() {
  const phase = useSim((s) => s.phase);
  const group =
    phase === "idle"
      ? "idle"
      : phase === "spiking"
        ? "watch"
        : phase === "anomaly" || phase === "analyzing"
          ? "analyse"
          : phase === "decided" || phase === "held"
            ? "decide"
            : phase === "executing"
              ? "exec"
              : "done";
  const ring =
    group === "decide" || group === "analyse"
      ? "ring-crit/25"
      : group === "watch"
        ? "ring-warn/40"
        : group === "done"
          ? "ring-good/25"
          : "ring-transparent";

  return (
    <motion.div layout transition={{ type: "spring", stiffness: 300, damping: 34 }} className={cn("overflow-hidden rounded-2xl bg-surface shadow-card ring-2 transition-shadow duration-500", ring)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={group} {...fade} className="p-5 sm:p-6">
          {group === "idle" && <AllClear />}
          {group === "watch" && <Watching />}
          {group === "analyse" && <Analysing />}
          {group === "decide" && <NeedsAttention />}
          {group === "exec" && <Executing />}
          {group === "done" && <Resolved />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function AllClear() {
  const temps = useSim((s) => s.temps);
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand">
          <ShieldCheck className="size-5" strokeWidth={1.75} />
        </span>
        <div>
          <div className="text-[17px] font-semibold tracking-[-0.01em]">All clear</div>
          <p className="mt-1 max-w-md text-sm text-ink-2">
            No batch needs your attention. Next scheduled action: B2B pickup of 32 sourdough loaves at 14:00.
          </p>
        </div>
      </div>
      <div className="w-full rounded-xl bg-subtle p-3 sm:w-56">
        <div className="flex items-center justify-between text-xs text-ink-3">
          <span className="flex items-center gap-1.5">
            <LiveDot tone="good" /> Chiller C-03
          </span>
          <span className="font-medium tabular text-ink">{temps[temps.length - 1].toFixed(1)} °C</span>
        </div>
        <Sparkline data={temps.slice(-30)} className="mt-2" height={36} />
      </div>
    </div>
  );
}

function Watching() {
  const temps = useSim((s) => s.temps);
  const now = temps[temps.length - 1];
  const delta = now - INCIDENT.tempBaseline;
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-warn-50 text-warn-ink">
          <ThermometerSun className="size-5" strokeWidth={1.75} />
        </span>
        <div>
          <div className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.01em]">
            Watching Chiller C-03
            <Chip tone="warning">Rule-based · no AI yet</Chip>
          </div>
          <p className="mt-1 max-w-md text-sm text-ink-2">
            Temperature is climbing above the 4.0 °C baseline. FreshChain only invokes its agents if the rise passes +3.0 °C — keeping AI
            cost near zero.
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular">{now.toFixed(1)} °C</span>
            <span className={cn("text-sm font-medium tabular", delta >= 2 ? "text-crit-ink" : "text-warn-ink")}>
              +{delta.toFixed(1)} °C
            </span>
            <span className="text-xs text-ink-3">/ +3.0 °C rule</span>
          </div>
        </div>
      </div>
      <div className="w-full rounded-xl bg-subtle p-3 sm:w-56">
        <Sparkline data={temps.slice(-30)} height={56} threshold={INCIDENT.tempBaseline + INCIDENT.tempRule} tone="crit" />
      </div>
    </div>
  );
}

function AgentSteps() {
  const agents = useSim((s) => s.agents);
  return (
    <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {(Object.keys(AGENT_META) as AgentId[]).map((a) => {
        const st = agents[a];
        return (
          <li
            key={a}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] transition-colors duration-300",
              st === "done" ? "bg-brand-50 text-brand" : st === "running" ? "bg-info-50 text-info-ink" : "bg-subtle text-ink-3",
            )}
          >
            {st === "done" ? (
              <Check className="size-3.5" strokeWidth={2.5} />
            ) : st === "running" ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <span className="size-1.5 rounded-full bg-current opacity-50" />
            )}
            <span className="font-medium">{AGENT_META[a].name}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Analysing() {
  return (
    <div>
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-info-50 text-info-ink">
          <Sparkles className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold tracking-[-0.01em]">
            <span className="shimmer-text">FreshChain is analysing</span> Strawberry · STB-042
          </div>
          <p className="mt-1 text-sm text-ink-2">
            +3.2 °C in Chiller C-03 crossed the rule. Four agents are fusing sensors, camera inspection and local demand.
          </p>
        </div>
        <ButtonLink href="/batch/STB-042" variant="ghost" size="sm" className="hidden sm:inline-flex">
          Investigate <ArrowRight className="size-3.5" />
        </ButtonLink>
      </div>
      <AgentSteps />
    </div>
  );
}

function NeedsAttention() {
  const phase = useSim((s) => s.phase);
  const countdown = useSim((s) => s.countdown);
  const approve = useSim((s) => s.approve);
  const metrics = [
    { label: "Shelf life", value: "17 h", sub: "was 31 h", tone: "text-crit-ink" },
    { label: "Demand", value: "↓ 24%", sub: "4.2/h vs 10.8 needed", tone: "text-crit-ink" },
    { label: "Temperature", value: "↑ 3.2 °C", sub: "Chiller C-03", tone: "text-crit-ink" },
    { label: "Vision", value: "17%", sub: "early bruising", tone: "text-warn-ink" },
  ];
  return (
    <div>
      <div className="flex items-center gap-2 text-[13px] font-medium text-crit-ink">
        <TriangleAlert className="size-4" />
        FreshChain needs your attention
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[22px] font-semibold tracking-[-0.02em]">Strawberry · Batch STB-042</h2>
        <span className="text-sm text-ink-3">184 punnets · Chiller C-03</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="text-xs text-ink-3">{m.label}</div>
            <div className={cn("mt-0.5 text-xl font-semibold tracking-[-0.01em]", m.tone)}>{m.value}</div>
            <div className="text-xs text-ink-3">{m.sub}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-4 rounded-xl bg-subtle p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="text-xs text-ink-3">FreshChain recommendation · {INCIDENT.confidence}% confidence</div>
          <div className="mt-1 text-[15px] font-semibold">
            Transfer 84 units to Whitefield Hub <span className="font-normal text-ink-3">·</span> Markdown 100 units by 20%
          </div>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/decision" variant="secondary" size="sm">
            Why?
          </ButtonLink>
          <Button variant="primary" size="sm" onClick={approve} className="tabular">
            <Check className="size-3.5" strokeWidth={2.5} />
            {phase === "held" ? "Approve plan" : `Approve · ${countdown ?? AUTO_EXECUTE_S}s`}
          </Button>
        </div>
      </div>
      {phase === "decided" && (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-subtle">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-1000 ease-linear"
            style={{ width: `${(((countdown ?? AUTO_EXECUTE_S) - 1) / AUTO_EXECUTE_S) * 100}%` }}
          />
        </div>
      )}
      {phase === "held" && <p className="mt-3 text-xs text-warn-ink">Auto-execution paused. FreshChain will re-check the batch every 15 minutes.</p>}
    </div>
  );
}

function Executing() {
  const hooks = useSim((s) => s.webhooks);
  const labels: Record<string, string> = {
    "w-transfer": "Create transfer TO-7781 → Whitefield Hub",
    "w-esl": "Reprice 2 shelf labels ₹180 → ₹144",
    "w-po": "Trim next strawberry order by 12%",
    "w-ticket": "Raise maintenance ticket for Chiller C-03",
  };
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[17px] font-semibold tracking-[-0.01em]">Executing plan for STB-042</div>
          <p className="mt-1 text-sm text-ink-2">FreshChain doesn&apos;t stop at a recommendation — it closes the loop.</p>
        </div>
        <ButtonLink href="/execution" variant="ghost" size="sm">
          Live log <ArrowRight className="size-3.5" />
        </ButtonLink>
      </div>
      <ul className="mt-4 space-y-1.5">
        {Object.entries(labels).map(([id, label]) => {
          const h = hooks.find((x) => x.id === id);
          return (
            <li key={id} className="flex items-center gap-3 rounded-xl px-1 py-1.5 text-sm">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full transition-colors",
                  h?.status === "done" ? "bg-brand text-white" : h ? "bg-info-50 text-info-ink" : "bg-subtle text-ink-3",
                )}
              >
                {h?.status === "done" ? <Check className="size-3" strokeWidth={3} /> : h ? <LoaderCircle className="size-3 animate-spin" /> : null}
              </span>
              <span className={cn("transition-colors", h ? "text-ink" : "text-ink-3")}>{label}</span>
              {h?.status === "done" && <span className="ml-auto font-mono text-[11px] text-ink-3">{h.code}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Resolved() {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-good-50 text-good-ink">
          <CircleCheck className="size-5" strokeWidth={1.75} />
        </span>
        <div>
          <div className="text-[17px] font-semibold tracking-[-0.01em]">Resolved autonomously</div>
          <p className="mt-1 max-w-md text-sm text-ink-2">
            84 strawberry punnets are on their way to Whitefield Micro-Hub and 100 are repriced to ₹144. Purchasing and maintenance were
            notified.
          </p>
          <div className="mt-4 flex gap-2">
            <ButtonLink href="/network" variant="secondary" size="sm">
              See impact
            </ButtonLink>
            <ButtonLink href="/history" variant="ghost" size="sm">
              Audit trail
            </ButtonLink>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-good-50 px-5 py-4 text-good-ink">
        <div className="text-xs">Value preserved</div>
        <div className="mt-0.5 text-[26px] font-semibold tracking-[-0.02em]">{inr(INCIDENT.valuePreserved)}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TodayImpact() {
  const impact = useSim((s) => s.impact);
  const resolved = useSim((s) => s.phase === "resolved");
  const stats = [
    { label: "Waste prevented", value: impact.value, format: inr, delta: inr(INCIDENT.valuePreserved) },
    { label: "Food saved", value: impact.kg, format: (n: number) => `${fmt(n)} kg`, delta: "27 kg" },
    { label: "CO₂e avoided", value: impact.co2, format: (n: number) => `${fmt(n)} kg`, delta: "68 kg" },
    { label: "Autonomous actions", value: impact.actions, format: (n: number) => fmt(n), delta: "4" },
  ];
  return (
    <Card className="p-5 sm:p-6">
      <CardHead
        title="Today's impact"
        icon={Leaf}
        subtitle="Measured outcomes, not projections"
        right={
          <Link href="/network" className="text-xs font-medium text-ink-3 hover:text-ink">
            Details
          </Link>
        }
      />
      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-xs text-ink-3">{s.label}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <AnimatedNumber value={s.value} format={s.format} className="text-[22px] font-semibold tracking-[-0.02em] text-ink" duration={1.6} />
            </div>
            <AnimatePresence>
              {resolved && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-0.5 text-xs font-medium text-good-ink">
                  +{s.delta} from STB-042
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ColdChain() {
  const temps = useSim((s) => s.temps);
  const now = temps[temps.length - 1];
  return (
    <Card className="p-5">
      <CardHead title="Cold chain" icon={Snowflake} subtitle="5 zones · live" right={<LiveDot tone="good" />} />
      <ul className="mt-4 space-y-1">
        {CHILLERS.map((c) => {
          const live = c.id === "C-03";
          const v = live ? now : c.base + (c.drift ?? 0);
          const delta = v - c.base;
          const tone = delta >= 3 ? "critical" : delta >= 1 ? "warning" : "good";
          return (
            <li key={c.id} className={cn("flex items-center gap-3 rounded-xl px-2 py-2 transition-colors", live && delta >= 1 && "bg-subtle")}>
              <span className={cn("size-2 shrink-0 rounded-full transition-colors", toneMeta(tone).dot)} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] text-ink">{c.label}</div>
                <div className="text-[11px] text-ink-3">{c.zone}</div>
              </div>
              {live && (
                <div className="w-16 shrink-0">
                  <Sparkline data={temps.slice(-20)} height={22} tone={delta >= 3 ? "crit" : "series"} />
                </div>
              )}
              <div className="w-16 text-right">
                <div className="text-[13px] font-medium tabular">{v.toFixed(1)} °C</div>
                {delta >= 0.95 && <div className={cn("text-[11px] tabular", toneMeta(tone).text)}>+{delta.toFixed(1)}</div>}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Activity() {
  const feed = useSim((s) => s.feed);
  const seeded = HISTORY_SEED.slice(0, Math.max(0, 5 - feed.length)).map((h) => ({
    id: h.id,
    minute: h.minute,
    title: `${h.title} · ${h.batchId}`,
    detail: h.detail,
    tone: (h.kind === "sensor" ? "warning" : "good") as "warning" | "good",
    href: `/history?open=${h.id}`,
  }));
  const rows = [...feed.slice(0, 5), ...seeded];
  return (
    <Card className="p-5">
      <CardHead
        title="Live activity"
        icon={TrendingDown}
        right={
          <Link href="/history" className="text-xs font-medium text-ink-3 hover:text-ink">
            All
          </Link>
        }
      />
      <ul className="relative mt-4">
        <AnimatePresence initial={false}>
          {rows.map((e) => (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
              className="overflow-hidden"
            >
              <Link href={e.href ?? "/history"} className="-mx-2 flex gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-subtle/70">
                <span className="w-10 shrink-0 pt-px font-mono text-[11px] text-ink-3">{clock(e.minute)}</span>
                <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", toneMeta(e.tone).dot)} />
                <div className="min-w-0">
                  <div className="text-[13px] leading-snug text-ink">{e.title}</div>
                  {e.detail && <div className="mt-0.5 truncate text-xs text-ink-3">{e.detail}</div>}
                </div>
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Card>
  );
}
