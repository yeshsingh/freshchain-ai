"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { BATCHES, COUNTS, INCIDENT, getBatch, statusOf, type Batch, type Status } from "./data";
import { useSim, type Phase } from "./sim";

export type LiveBatch = Batch & { status: Status; live: boolean };

interface LiveInputs {
  phase: Phase;
  qualityDone: boolean;
  pricingDone: boolean;
  tempNow: number;
  shelfLife: number;
  bruising: number;
}

/** Overlay the running simulation onto the static strawberry batch. */
function overlay(b: Batch, s: LiveInputs): LiveBatch {
  if (b.id !== INCIDENT.batchId) return { ...b, status: statusOf(b.risk), live: false };

  const base: LiveBatch = {
    ...b,
    status: statusOf(b.risk),
    live: true,
    temp: { ...b.temp, now: s.tempNow },
    shelfLifeH: s.shelfLife,
    vision: {
      ...b.vision,
      defectPct: s.bruising,
      label: s.qualityDone ? "Early bruising" : b.vision.label,
      inspectedAt: s.qualityDone ? "now" : b.vision.inspectedAt,
    },
  };
  const tempUp = s.tempNow - INCIDENT.tempBaseline > 1.2;

  switch (s.phase) {
    case "idle":
      return base;
    case "spiking":
      return { ...base, signals: tempUp ? ["Temp ↑", "Demand ↓"] : base.signals, risk: tempUp ? 49 : base.risk };
    case "anomaly":
    case "analyzing":
      if (!s.qualityDone) return { ...base, risk: 61, status: "risk", signals: ["Temp ↑", "Demand ↓"], action: "Analysing…" };
    // falls through once the quality agent has re-scored the batch
    case "decided":
    case "held":
    case "executing":
      return {
        ...base,
        risk: 94,
        status: "critical",
        signals: ["Temp ↑", "Vision", "Demand ↓"],
        action: s.phase === "executing" ? "Executing…" : "Transfer + markdown",
        actionNote: s.phase === "held" ? "Awaiting your approval" : undefined,
      };
    case "resolved":
      return {
        ...base,
        risk: 22,
        status: "managed",
        signals: ["Temp ↑", "Vision", "Demand ↓"],
        action: "Resolved",
        actionNote: "84 transferred · 100 at ₹144",
      };
  }
}

function useLiveInputs(): LiveInputs {
  return useSim(
    useShallow((s) => ({
      phase: s.phase,
      qualityDone: s.agents.quality === "done",
      pricingDone: s.agents.pricing === "done",
      tempNow: s.temps[s.temps.length - 1],
      shelfLife: s.shelfLife,
      bruising: s.bruising,
    })),
  );
}

export function useLiveBatch(id: string): LiveBatch | undefined {
  const inputs = useLiveInputs();
  const b = getBatch(id);
  return b ? overlay(b, inputs) : undefined;
}

export function useLiveBatches(): LiveBatch[] {
  const inputs = useLiveInputs();
  return BATCHES.map((b) => overlay(b, inputs));
}

export function useStoreCounts() {
  const phase = useSim((s) => s.phase);
  const qualityDone = useSim((s) => s.agents.quality === "done");
  if (phase === "resolved") return COUNTS.resolved;
  if (qualityDone) return COUNTS.incident;
  return COUNTS.idle;
}

export const hasDecision = (p: Phase) => p === "decided" || p === "held" || p === "executing" || p === "resolved";

/* ------------------------------------------------------------------ */
/* Backend data                                                        */
/* ------------------------------------------------------------------ */

const cache = new Map<string, unknown>();

/**
 * Fetch from the backend when it's connected; refetches when the simulation reports a change
 * (`version`) and optionally on an interval. Returns undefined offline, so callers fall back to local data.
 */
export function useBackend<T>(key: string, fetcher: () => Promise<T>, intervalMs = 0): T | undefined {
  const mode = useSim((s) => s.mode);
  const version = useSim((s) => s.version);
  const [data, setData] = useState<T | undefined>(() => cache.get(key) as T | undefined);
  const ref = useRef(fetcher);
  ref.current = fetcher;

  useEffect(() => {
    if (mode !== "live") return;
    let alive = true;
    const load = () =>
      ref
        .current()
        .then((d) => {
          cache.set(key, d);
          if (alive) setData(d);
        })
        .catch(() => {});
    load();
    const id = intervalMs ? setInterval(load, intervalMs) : null;
    return () => {
      alive = false;
      if (id) clearInterval(id);
    };
  }, [mode, version, key, intervalMs]);

  return mode === "live" ? data : undefined;
}

/** Poll faster while an incident is unfolding. */
export function usePollInterval() {
  const phase = useSim((s) => s.phase);
  return phase === "idle" || phase === "resolved" ? 15000 : 2500;
}

/* ------------------------------------------------------------------ */
/* The incident numbers every screen shows                             */
/* ------------------------------------------------------------------ */

export function useIncident() {
  const d = useSim((s) => s.decision);
  const ex = useSim((s) => s.execution);
  return useMemo(() => {
    const t = d?.plan.find((p) => p.type === "TRANSFER");
    const m = d?.plan.find((p) => p.type === "MARKDOWN");
    const po = d?.plan.find((p) => p.type === "PO_ADJUST");
    const chosen = d?.options.find((o) => o.selected);
    return {
      ...INCIDENT,
      confidence: d ? Math.round(d.confidence * 100) : INCIDENT.confidence,
      valuePreserved: d?.expected.value ?? INCIDENT.valuePreserved,
      kgSaved: d?.expected.kgSaved ?? INCIDENT.kgSaved,
      co2Saved: d?.expected.co2Saved ?? INCIDENT.co2Saved,
      baselineWaste: d?.expected.wasteBefore ?? INCIDENT.baselineWaste,
      planWaste: d?.expected.wasteAfter ?? INCIDENT.planWaste,
      planSoldStore: chosen?.sold ?? INCIDENT.planSoldStore,
      transferUnits: t?.quantity ?? INCIDENT.transferUnits,
      hubName: t?.targetName ?? "Whitefield Micro-Hub",
      hubKm: t?.distanceKm ?? INCIDENT.hubKm,
      etaMin: t?.etaMin ?? INCIDENT.etaMin,
      transferCost: t?.cost ?? INCIDENT.transferCost,
      markdownUnits: m?.quantity ?? INCIDENT.markdownUnits,
      markdownPct: m?.pct ?? INCIDENT.markdownPct,
      priceAfter: m?.priceTo ?? INCIDENT.priceAfter,
      poAdjustPct: po?.pct ? Math.abs(po.pct) : INCIDENT.poAdjustPct,
      transferId: ex?.transfer?.id ?? INCIDENT.transferId,
      ticketId: ex?.ticket?.id ?? INCIDENT.ticketId,
      evidence: d?.evidence ?? null,
      options: d?.options ?? null,
      rationale: d?.rationale ?? null,
      modelUsed: d?.modelUsed ?? null,
      modelMeta: d?.modelMeta ?? null,
      decisionJson: d ? { decision_id: d.decisionId, option: d.selectedOption, plan: d.plan, confidence: d.confidence, expected: d.expected } : null,
      fromBackend: !!d,
    };
  }, [d, ex]);
}
