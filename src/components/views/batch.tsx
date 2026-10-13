"use client";

import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Droplets, Eye, LoaderCircle, ShoppingCart, Thermometer, Timer, Wind } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { api, type BatchDetailOut } from "@/lib/api";
import { INCIDENT, statusOf, type Category, type IconKey } from "@/lib/data";
import { hashString, istTime, seededSeries, shelf } from "@/lib/format";
import { hasDecision, useBackend, useLiveBatch, usePollInterval, type LiveBatch } from "@/lib/live";
import { AGENT_META, useSim, type AgentId } from "@/lib/sim";
import { DemandChart, ShelfLifeChart, TempChart } from "../charts";
import { BatchIcon, ButtonLink, Card, CardHead, Chip, LiveDot, StatusPill } from "../ui";
import { VisionPanel } from "./vision";

const istDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });

/** Backend batch → the shape this screen renders. */
function fromBackend(d: BatchDetailOut): LiveBatch {
  return {
    id: d.id,
    name: d.name,
    variant: d.variant,
    category: d.category as Category,
    icon: d.icon as IconKey,
    units: d.units,
    unitLabel: d.unitLabel,
    unitKg: 0,
    price: d.price,
    location: d.location,
    supplier: d.supplier ?? "—",
    receivedAt: istDate(d.receivedAt),
    risk: d.risk,
    shelfLifeH: d.shelfLifeH,
    printedShelfH: d.printedShelfH,
    signals: d.signals,
    action: d.action,
    actionNote: d.actionNote ?? undefined,
    temp: { baseline: d.temp.baseline, now: d.temp.now, safe: d.temp.safe, threshold: d.temp.threshold },
    humidity: d.humidity,
    ethylene: d.ethylene,
    vision: { defectPct: d.vision.defectPct, label: d.vision.label, inspectedAt: d.vision.inspectedAt ? istTime(d.vision.inspectedAt) : "—" },
    demand: { rate: d.demand.rate, forecast: d.demand.forecast ?? d.demand.rate, history: d.demand.history },
    status: d.status ?? statusOf(d.risk),
    live: false,
  };
}

export function BatchView({ id }: { id: string }) {
  const mode = useSim((s) => s.mode);
  const local = useLiveBatch(id);
  const remote = useBackend(`batch:${id}`, () => api.batch(id), usePollInterval())?.batch;
  // the live strawberry batch follows the on-screen incident; everything else is backend data when connected
  const b = local?.live
    ? remote
      ? { ...local, supplier: remote.supplier ?? local.supplier, receivedAt: istDate(remote.receivedAt) }
      : local
    : remote
      ? fromBackend(remote)
      : local;
  if (!b)
    return <div className="py-24 text-center text-ink-3">{mode === "checking" || mode === "live" ? "Loading batch…" : "Batch not found."}</div>;
  return <Batch b={b} series={!b.live ? remote?.temp.series : undefined} trace={remote} />;
}

function Trace({ d }: { d: BatchDetailOut }) {
  return (
    <p className="mt-1 text-xs text-ink-3">
      Lot <span className="font-mono text-ink-2">{d.lotCode}</span>
      {d.parentBatchId && <> · transferred from {d.parentBatchId}</>}
      {d.harvestDate && <> · harvested {new Date(d.harvestDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</>} · printed expiry{" "}
      {istDate(d.expiryAt)}
    </p>
  );
}

function Batch({ b, series, trace }: { b: LiveBatch; series?: number[]; trace?: BatchDetailOut }) {
  const phase = useSim((s) => s.phase);
  const liveTemps = useSim((s) => s.temps);
  const vision = useSim((s) => s.vision);
  const temps = useMemo(() => {
    if (b.live) return liveTemps;
    if (series && series.length > 1) return series;
    const noise = seededSeries(hashString(b.id), 60, 0, 0.14);
    return noise.map((n, i) => {
      const ramp = i < 40 ? 0 : (i - 40) / 19;
      return Math.round((b.temp.baseline + (b.temp.now - b.temp.baseline) * ramp + n) * 100) / 100;
    });
  }, [b.live, b.id, b.temp.baseline, b.temp.now, liveTemps, series]);

  const delta = Math.round((b.temp.now - b.temp.baseline) * 10) / 10 || 0; // no "−0.0"
  const needed = Math.round((b.units / Math.max(1, b.shelfLifeH)) * 10) / 10;
  const ratio = b.demand.rate / needed;
  const short = ratio < 1;
  const isLongLife = b.shelfLifeH > 200;
  const visionState = b.live ? (vision === "idle" ? "done" : vision) : "done";
  const prevShelf = b.live && b.shelfLifeH !== INCIDENT.shelfBefore ? INCIDENT.shelfBefore : undefined;

  return (
    <>
      <nav className="mb-4 flex items-center gap-1 text-[13px] text-ink-3">
        <Link href="/inventory" className="hover:text-ink">
          Inventory
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-ink-2">
          {b.name} · {b.id}
        </span>
      </nav>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <BatchIcon icon={b.icon} className="size-12 rounded-2xl [&_svg]:size-6" />
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[26px] font-semibold tracking-[-0.02em]">
                {b.name} · {b.id}
              </h1>
              <StatusPill status={b.status} />
              {b.live && (
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
                  <LiveDot tone="info" /> Live
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-2">
              {b.units} {b.unitLabel} · {b.variant} · {b.location} · from {b.supplier}, received {b.receivedAt}
            </p>
            {trace && <Trace d={trace} />}
          </div>
        </div>
        <BatchCta b={b} />
      </div>

      {b.live && phase !== "idle" && <AgentStrip />}

      <div className="grid gap-4 md:grid-cols-3">
        <Signal
          icon={Thermometer}
          label="Environment"
          tone={delta >= 3 ? "crit" : delta >= 1 ? "warn" : "ok"}
          value={`${b.temp.now.toFixed(1)} °C`}
          sub={
            <>
              Baseline {b.temp.baseline.toFixed(1)} °C ·{" "}
              <span className={cn(delta >= 1 && "font-medium text-crit-ink")}>
                {delta >= 0 ? "+" : "−"}
                {Math.abs(delta).toFixed(1)} °C
              </span>
            </>
          }
          extra={
            <div className="flex gap-4 text-xs text-ink-3">
              <span className="inline-flex items-center gap-1">
                <Droplets className="size-3" /> {b.humidity}% RH
              </span>
              {b.ethylene !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <Wind className="size-3" /> {b.ethylene} ppm C₂H₄
                </span>
              )}
            </div>
          }
        />
        <Signal
          icon={Eye}
          label="Visual quality"
          tone={b.vision.defectPct >= 10 ? "warn" : "ok"}
          value={b.vision.label}
          sub={`${b.vision.defectPct}% surface defects · inspected ${b.vision.inspectedAt}`}
        />
        <Signal
          icon={ShoppingCart}
          label="Demand"
          tone={isLongLife || !short ? "ok" : ratio < 0.5 ? "crit" : "warn"}
          value={`${b.demand.rate} units/h`}
          sub={
            isLongLife ? (
              "Long shelf life — no clearance pressure"
            ) : (
              <>
                Need <span className={cn(short && "font-medium", ratio < 0.5 ? "text-crit-ink" : short && "text-warn-ink")}>{needed}/h</span> to clear in {shelf(b.shelfLifeH)} · forecast {b.demand.forecast}/h
              </>
            )
          }
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Card className="p-5 lg:col-span-7">
          <CardHead
            title={`Temperature · ${b.location.split(" · ")[0]}`}
            subtitle="Last 60 min · 1 reading/min · simulated MQTT stream"
            right={b.live ? <Chip tone="info">Live</Chip> : undefined}
          />
          <div className="mt-4">
            <TempChart data={temps} safe={b.temp.safe} threshold={b.temp.threshold} />
          </div>
        </Card>
        <Card className="p-5 lg:col-span-5">
          <CardHead title="Visual inspection" subtitle="Camera frame scored by Gemini Vision (downsampled to 800 px)" />
          <div className="mt-4">
            <VisionPanel id={b.id} icon={b.icon} defectPct={b.vision.defectPct} state={visionState} label={b.vision.label} inspectedAt={b.vision.inspectedAt} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Card className="p-5 lg:col-span-7">
          <CardHead
            title="Shelf-life degradation"
            icon={Timer}
            subtitle={
              isLongLife
                ? "Regulated cold-chain item — compliance monitoring only"
                : prevShelf
                  ? `Environmental stress + visual degradation: ${prevShelf} h → ${b.shelfLifeH} h`
                  : `FreshChain estimates ${shelf(b.shelfLifeH)} of sellable life vs ${shelf(b.printedShelfH)} on the label`
            }
          />
          <div className="mt-4">
            {isLongLife ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-subtle text-center">
                <div className="text-2xl font-semibold">{shelf(b.shelfLifeH)}</div>
                <div className="mt-1 text-sm text-ink-3">Within GDP 2–8 °C range for 100% of the last 72 h</div>
              </div>
            ) : (
              <ShelfLifeChart estimate={b.shelfLifeH} printed={b.printedShelfH} previous={prevShelf} />
            )}
          </div>
        </Card>
        <Card className="p-5 lg:col-span-5">
          <CardHead title="Sales velocity" subtitle="Units sold per hour, last 12 h" />
          <div className="mt-4">
            <DemandChart history={b.demand.history} needed={isLongLife ? b.demand.forecast : needed} />
          </div>
        </Card>
      </div>
    </>
  );
}

function BatchCta({ b }: { b: LiveBatch }) {
  const phase = useSim((s) => s.phase);
  if (!b.live || phase === "idle") return null;
  if (hasDecision(phase))
    return (
      <ButtonLink href="/decision" variant="primary">
        Open AI decision <ArrowRight className="size-4" />
      </ButtonLink>
    );
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-2">
      <LoaderCircle className="size-4 animate-spin text-info" /> Agents analysing…
    </span>
  );
}

function AgentStrip() {
  const agents = useSim((s) => s.agents);
  return (
    <Card className="mb-4 p-2">
      <ol className="grid grid-cols-2 gap-1 md:grid-cols-4">
        {(Object.keys(AGENT_META) as AgentId[]).map((a, i) => {
          const st = agents[a];
          return (
            <li key={a} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-300", st === "running" && "bg-info-50")}>
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                  st === "done" ? "bg-brand text-white" : st === "running" ? "bg-info text-white" : "bg-subtle text-ink-3",
                )}
              >
                {st === "done" ? <Check className="size-3.5" strokeWidth={3} /> : st === "running" ? <LoaderCircle className="size-3.5 animate-spin" /> : i + 1}
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{AGENT_META[a].name} agent</div>
                <div className="truncate text-[11px] text-ink-3">{AGENT_META[a].role}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function Signal({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  extra,
}: {
  icon: typeof Thermometer;
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  tone: "ok" | "warn" | "crit";
  extra?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
          <Icon className="size-4 text-ink-3" strokeWidth={1.75} />
          {label}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium transition-colors duration-500",
            tone === "crit" ? "text-crit-ink" : tone === "warn" ? "text-warn-ink" : "text-good-ink",
          )}
        >
          <span className={cn("size-1.5 rounded-full", tone === "crit" ? "bg-crit" : tone === "warn" ? "bg-warn" : "bg-good")} />
          {tone === "crit" ? "Critical" : tone === "warn" ? "Watch" : "Normal"}
        </span>
      </div>
      <div className="mt-3 text-[22px] font-semibold tracking-[-0.02em] text-ink">{value}</div>
      <div className="mt-1 text-xs text-ink-3">{sub}</div>
      {extra && <div className="mt-3 border-t border-line pt-3">{extra}</div>}
    </Card>
  );
}
