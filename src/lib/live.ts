"use client";

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
