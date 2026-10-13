"use client";

import { motion } from "motion/react";
import { Factory, FileCheck2, HeartHandshake, Leaf, Store, Warehouse, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import { api, type NetworkNodeOut } from "@/lib/api";
import { INCIDENT, NODES, WEEK_KG, type NetNode, type NodeKind } from "@/lib/data";
import { useBackend, usePollInterval } from "@/lib/live";
import { fmt, inr } from "@/lib/format";
import { useSim } from "@/lib/sim";
import { WeekChart } from "../charts";
import { AnimatedNumber, Card, CardHead, Chip, PageTitle } from "../ui";

const ICON = { origin: Store, hub: Zap, store: Store, dark: Warehouse, b2b: Factory, rescue: HeartHandshake } as const;

export function NetworkView() {
  return (
    <>
      <PageTitle title="Network & impact" subtitle="Where can inventory still create value before it becomes waste? Operational activity, turned into money, food and carbon." />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <MapCard />
          <Candidates />
        </div>
        <div className="lg:col-span-5">
          <ImpactCard />
        </div>
      </div>
    </>
  );
}

const KIND: Record<NetworkNodeOut["kind"], NodeKind> = { store: "store", hub: "hub", dark_store: "dark", b2b: "b2b", food_bank: "rescue" };

/** keep chips (and the lines that meet them) inside the map */
const clampX = (x: number) => Math.min(0.86, Math.max(0.14, x));
const clampY = (y: number) => Math.min(0.9, Math.max(0.1, y));
const fit = (n: NetNode): NetNode => ({ ...n, x: clampX(n.x), y: clampY(n.y) });

/** Real coordinates can put two chips on top of each other; nudge later ones down (or up) until they clear. */
function separate(nodes: NetNode[]): NetNode[] {
  const out = nodes.map((n) => ({ ...n }));
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i];
        const b = out[j];
        if (Math.abs(a.x - b.x) < 0.3 && Math.abs(a.y - b.y) < 0.1) {
          b.y = b.y + 0.1 <= 0.92 ? Math.max(b.y, a.y) + 0.1 : Math.min(b.y, a.y) - 0.1;
        }
      }
    }
  }
  return out;
}

/** Network nodes from the backend's logistics agent when connected, else the bundled snapshot. */
function useNodes(): NetNode[] {
  const g = useBackend("network", () => api.network("STB-042"), usePollInterval());
  if (!g) return separate(NODES.map(fit));
  const nodes = g.nodes.map(
    (n): NetNode => ({
      id: n.id,
      name: n.name,
      area: n.area,
      kind: n.id === g.origin ? "origin" : KIND[n.kind],
      x: n.x,
      y: n.y,
      km: n.distanceKm,
      rate: n.headroomPerH,
      capacity: n.capacity === undefined ? undefined : n.capacity > 0 ? `Cold space for ${n.capacity}` : "Cold storage full",
      score: n.score,
      verdict: n.verdict,
    }),
  );
  return separate([...nodes.filter((n) => n.kind === "origin"), ...nodes.filter((n) => n.kind !== "origin")].map(fit));
}

function useNetState() {
  const phase = useSim((s) => s.phase);
  const logisticsDone = useSim((s) => s.agents.logistics === "done");
  const moving = phase === "executing" || phase === "resolved";
  return { phase, selected: logisticsDone, moving };
}

function MapCard() {
  const { phase, selected, moving } = useNetState();
  const nodes = useNodes();
  const origin = nodes[0];
  const hub = nodes.find((n) => n.kind === "hub") ?? nodes[1];
  const W = 640;
  const H = 400;
  const px = (n: NetNode) => [n.x * W, n.y * H] as const;
  const [ox, oy] = px(origin);

  return (
    <Card className="p-5 sm:p-6">
      <CardHead
        title="Store network · Bengaluru East"
        subtitle={selected ? "Logistics agent ranked 4 destinations and 2 fallbacks" : "Candidates within 8 km that can absorb Store #042 surplus"}
        right={moving ? <Chip tone="good">Transfer en route</Chip> : selected ? <Chip tone="info">Route selected</Chip> : undefined}
      />
      <div className="dot-grid relative mt-5 aspect-[16/10] w-full overflow-hidden rounded-xl bg-subtle/60">
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden>
          {nodes.slice(1).map((n) => {
            const [x, y] = px(n);
            const isHub = n.kind === "hub";
            const fallback = n.kind === "b2b" || n.kind === "rescue";
            const on = isHub && selected;
            return (
              <g key={n.id}>
                <line
                  x1={ox}
                  y1={oy}
                  x2={x}
                  y2={y}
                  stroke={on ? "var(--color-brand)" : "var(--color-line-strong)"}
                  strokeWidth={on ? 2.5 : 1.25}
                  strokeDasharray={fallback ? "3 5" : on && moving ? "6 6" : undefined}
                  className={cn(on && moving && "animate-dash")}
                  vectorEffect="non-scaling-stroke"
                  style={{ transition: "stroke 600ms, stroke-width 600ms" }}
                />
              </g>
            );
          })}
        </svg>

        {moving && (
          <motion.span
            className="absolute z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white shadow-lift"
            initial={{ left: `${origin.x * 100}%`, top: `${origin.y * 100}%` }}
            animate={{
              left: `${(origin.x + (hub.x - origin.x) * (phase === "resolved" ? 0.62 : 0.3)) * 100}%`,
              top: `${(origin.y + (hub.y - origin.y) * (phase === "resolved" ? 0.62 : 0.3)) * 100}%`,
            }}
            transition={{ duration: 3, ease: [0.25, 1, 0.5, 1] }}
          >
            <span className="size-2 rounded-full bg-white" />
          </motion.span>
        )}

        {nodes.map((n) => (
          <NodeChip key={n.id} n={n} selected={selected} phase={phase} />
        ))}
      </div>
    </Card>
  );
}

function NodeChip({ n, selected, phase }: { n: NetNode; selected: boolean; phase: string }) {
  const Icon = ICON[n.kind];
  const origin = n.kind === "origin";
  const hub = n.kind === "hub";
  const fallback = n.kind === "b2b" || n.kind === "rescue";
  const atRisk = origin && phase !== "idle" && phase !== "resolved";
  const managed = origin && phase === "resolved";
  return (
    <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }}>
      <div
        className={cn(
          "flex items-center gap-2 whitespace-nowrap rounded-xl bg-surface py-1.5 pl-1.5 pr-2.5 shadow-card transition-all duration-500",
          hub && selected && "ring-2 ring-brand shadow-lift",
          atRisk && "ring-2 ring-crit/50",
          managed && "ring-2 ring-info/40",
          fallback && "opacity-80",
        )}
      >
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-lg transition-colors duration-500",
            origin ? (atRisk ? "bg-crit-50 text-crit-ink" : managed ? "bg-info-50 text-info-ink" : "bg-ink text-white") : hub && selected ? "bg-brand text-white" : "bg-subtle text-ink-2",
          )}
        >
          <Icon className="size-3.5" strokeWidth={2} />
        </span>
        <div className="leading-tight">
          <div className="text-[11.5px] font-semibold text-ink">{n.name}</div>
          <div className="text-[10px] text-ink-3">
            {origin ? (atRisk ? "184 punnets at risk" : managed ? "Resolved" : n.area) : n.rate ? `${n.km} km · ${n.rate}/h` : `${n.km} km · fallback`}
          </div>
        </div>
      </div>
    </div>
  );
}

function Candidates() {
  const { selected } = useNetState();
  const rows = useNodes()
    .filter((n) => n.score !== undefined)
    .sort((a, b) => b.score! - a.score!);
  return (
    <Card className="p-5 sm:p-6">
      <CardHead title="Destination scoring" subtitle="Score = demand headroom × cold capacity × proximity × time-to-clear" />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.06em] text-ink-3">
              <th className="pb-2 font-medium">Destination</th>
              <th className="pb-2 text-right font-medium">Distance</th>
              <th className="pb-2 text-right font-medium">Demand</th>
              <th className="pb-2 pl-6 font-medium">Score</th>
              <th className="pb-2 font-medium">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => {
              const sel = selected && n.kind === "hub";
              return (
                <tr key={n.id} className={cn("border-t border-line transition-colors duration-500", sel && "bg-brand-50/70")}>
                  <td className="py-2.5 pl-2 pr-3">
                    <div className="font-medium">{n.name}</div>
                    <div className="text-xs text-ink-3">{n.capacity}</div>
                  </td>
                  <td className="py-2.5 text-right tabular text-ink-2">{n.km} km</td>
                  <td className="py-2.5 text-right tabular text-ink-2">{n.rate}/h</td>
                  <td className="py-2.5 pl-6">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-subtle">
                        <div className={cn("h-full rounded-full", sel ? "bg-brand" : "bg-ink-3/45")} style={{ width: `${n.score! * 100}%` }} />
                      </div>
                      <span className="tabular text-xs">{n.score!.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className={cn("py-2.5 pr-2 text-xs", sel ? "font-medium text-good-ink" : "text-ink-3")}>{n.verdict}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ImpactCard() {
  const impact = useSim((s) => s.impact);
  const remote = useBackend("impact", api.impact, usePollInterval());
  const resolved = useSim((s) => s.phase === "resolved");
  const past = remote ? remote.week.filter((d) => !d.today) : WEEK_KG;
  const week = [...past, { day: "Today", kg: impact.kg, today: true }];
  const lakh = (n: number) => `₹${(n / 100000).toFixed(1)} L`;
  return (
    <Card className="p-5 sm:p-6 lg:sticky lg:top-32">
      <CardHead title="Impact · today" icon={Leaf} subtitle="Store #042 · measured from executed actions" right={resolved ? <Chip tone="good">+ STB-042</Chip> : undefined} />
      <div className="mt-6">
        <div className="text-xs text-ink-3">Waste prevented</div>
        <AnimatedNumber value={impact.value} format={inr} duration={1.8} className="mt-1 block text-[44px] font-semibold leading-none tracking-[-0.03em] text-ink" />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5">
        <div>
          <div className="text-xs text-ink-3">Food saved</div>
          <AnimatedNumber value={impact.kg} format={(n) => `${fmt(n)} kg`} duration={1.8} className="mt-1 block text-lg font-semibold" />
        </div>
        <div>
          <div className="text-xs text-ink-3">CO₂e avoided</div>
          <AnimatedNumber value={impact.co2} format={(n) => `${fmt(n)} kg`} duration={1.8} className="mt-1 block text-lg font-semibold" />
        </div>
        <div>
          <div className="text-xs text-ink-3">Actions</div>
          <AnimatedNumber value={impact.actions} duration={1.8} className="mt-1 block text-lg font-semibold" />
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[13px] font-medium">Food saved · last 7 days</span>
          <span className="text-xs text-ink-3">kg</span>
        </div>
        <WeekChart data={week} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-subtle p-3">
          <div className="text-xs text-ink-3">30-day run-rate</div>
          <div className="mt-0.5 text-[15px] font-semibold tabular">{lakh(impact.value * 30)}</div>
          <div className="text-[11px] text-ink-3">{fmt((impact.co2 * 30) / 1000, 1)} t CO₂e avoided</div>
        </div>
        <div className="rounded-xl bg-subtle p-3">
          <div className="flex items-center gap-1 text-xs text-ink-3">
            <FileCheck2 className="size-3.5" /> ESG &amp; tax
          </div>
          <div className="mt-0.5 text-[15px] font-semibold">1 donation receipt</div>
          <div className="text-[11px] text-ink-3">{INCIDENT.co2Factor} kg CO₂e per kg food saved</div>
        </div>
      </div>
    </Card>
  );
}
