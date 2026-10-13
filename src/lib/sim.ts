import { create } from "zustand";
import { api, type DecisionOut, type ExecutionOut, type HealthOut } from "./api";
import { INCIDENT, SEED_IMPACT } from "./data";
import { seededSeries } from "./format";

/**
 * Live incident simulation. One real second ≈ one store minute.
 *
 *   idle → spiking → anomaly → analyzing → decided ⇄ held → executing → resolved
 *   SEE      SEE     UNDERSTAND UNDERSTAND   DECIDE           ACT        MEASURE
 *
 * Live mode (backend reachable): the chiller readings are POSTed to the FastAPI backend, which detects the
 * anomaly, runs its agents and returns the decision; approving executes it there. The local timeline only
 * paces the animation. Offline mode: the same story runs from the constants in data.ts.
 */

export type Phase = "idle" | "spiking" | "anomaly" | "analyzing" | "decided" | "held" | "executing" | "resolved";
export type AgentId = "quality" | "pricing" | "logistics" | "coordinator";
export type AgentState = "idle" | "running" | "done";
export type Tone = "neutral" | "info" | "good" | "warning" | "critical";
export type FeedKind = "sensor" | "agent" | "decision" | "action" | "impact" | "system";
export type Mode = "checking" | "live" | "offline";

export interface FeedEvent {
  id: string;
  minute: number;
  kind: FeedKind;
  title: string;
  detail?: string;
  tone: Tone;
  href?: string;
}

export interface WebhookCall {
  id: string;
  method: "POST";
  endpoint: string;
  system: string;
  status: "pending" | "done";
  code?: number;
  latencyMs?: number;
  minute: number;
  payload: Record<string, unknown>;
}

export interface Impact {
  value: number;
  kg: number;
  co2: number;
  actions: number;
}

export const SIM_START_MINUTE = 11 * 60 + 34;
export const TEMP_POINTS = 60;
export const AUTO_EXECUTE_S = 10;
/** Chiller C-03 warming up — the same readings the backend demo uses. */
export const RAMP = [4.5, 4.9, 5.4, 5.8, 6.3, 6.7, INCIDENT.tempPeak];

export const STAGES = ["SEE", "UNDERSTAND", "DECIDE", "ACT", "MEASURE"] as const;

export const stageOf = (p: Phase): number =>
  ({ idle: -1, spiking: 0, anomaly: 1, analyzing: 1, decided: 2, held: 2, executing: 3, resolved: 4 })[p];

export const AGENT_META: Record<AgentId, { name: string; role: string }> = {
  quality: { name: "Quality", role: "Sensors + vision → remaining shelf life" },
  pricing: { name: "Pricing", role: "Demand + footfall → markdown curve" },
  logistics: { name: "Logistics", role: "Network demand → transfer or offload" },
  coordinator: { name: "Coordinator", role: "Weighs options → one action plan" },
};

export const phaseLabel = (p: Phase, agents: Record<AgentId, AgentState>): string => {
  switch (p) {
    case "idle":
      return "Monitoring 1,284 sensors";
    case "spiking":
      return "Chiller C-03 temperature rising";
    case "anomaly":
      return "Anomaly detected · invoking agents";
    case "analyzing": {
      const running = (Object.keys(agents) as AgentId[]).find((a) => agents[a] === "running");
      return running ? `${AGENT_META[running].name} agent working` : "Agents analysing";
    }
    case "decided":
      return "Decision ready · auto-executing";
    case "held":
      return "Held for your approval";
    case "executing":
      return "Executing actions";
    case "resolved":
      return "Loop closed · impact recorded";
  }
};

const idleAgents = (): Record<AgentId, AgentState> => ({ quality: "idle", pricing: "idle", logistics: "idle", coordinator: "idle" });

interface Data {
  phase: Phase;
  runId: number;
  minute: number;
  temps: number[];
  rampIndex: number;
  tempTarget: number;
  agents: Record<AgentId, AgentState>;
  vision: "idle" | "scanning" | "done";
  shelfLife: number;
  bruising: number;
  countdown: number | null;
  webhooks: WebhookCall[];
  eslPrice: number;
  transferStage: number;
  impact: Impact;
  feed: FeedEvent[];
  anomalyMinute: number | null;
  nav: { path: string; n: number } | null;
  decision: DecisionOut | null;
  execution: ExecutionOut | null;
  /** bumps whenever backend data may have changed, so views refetch */
  version: number;
}

interface Actions {
  start: () => void;
  reset: () => void;
  approve: () => void;
  hold: () => void;
  tick: () => void;
  setFollow: (f: boolean) => void;
  connect: () => Promise<void>;
}

export type SimState = Data & Actions & { follow: boolean; mode: Mode; backend: HealthOut | null };

const initialData = (temps?: number[], impact?: Impact): Data => ({
  phase: "idle",
  runId: 0,
  minute: SIM_START_MINUTE,
  temps: temps ?? seededSeries(42, TEMP_POINTS, INCIDENT.tempBaseline, 0.16),
  rampIndex: 0,
  tempTarget: INCIDENT.tempBaseline,
  agents: idleAgents(),
  vision: "idle",
  shelfLife: INCIDENT.shelfBefore,
  bruising: INCIDENT.bruisingBefore,
  countdown: null,
  webhooks: [],
  eslPrice: INCIDENT.price,
  transferStage: 0,
  impact: impact ?? { ...SEED_IMPACT },
  feed: [],
  anomalyMinute: null,
  nav: null,
  decision: null,
  execution: null,
  version: 0,
});

let timers: ReturnType<typeof setTimeout>[] = [];
let seq = 0;
/** live calls run strictly in order (reset → readings → decision → approve) */
let chain: Promise<unknown> = Promise.resolve();
const clearTimers = () => {
  timers.forEach(clearTimeout);
  timers = [];
};

const HOOKS: Record<string, { type: string; endpoint: string; system: string; code: number; latencyMs: number }> = {
  "w-transfer": { type: "TRANSFER", endpoint: "/v1/transfers", system: "Logistics dispatch", code: 201, latencyMs: 212 },
  "w-esl": { type: "MARKDOWN", endpoint: "/v1/esl/labels:batchUpdate", system: "Electronic shelf labels", code: 200, latencyMs: 148 },
  "w-po": { type: "PO_ADJUST", endpoint: "/v1/procurement/forecast-adjustments", system: "Purchasing", code: 202, latencyMs: 96 },
  "w-ticket": { type: "MAINTENANCE", endpoint: "/v1/maintenance/tickets", system: "Facilities", code: 201, latencyMs: 131 },
};

export const useSim = create<SimState>()((set, get) => {
  const later = (run: number, ms: number, fn: () => void) => {
    timers.push(
      setTimeout(() => {
        if (get().runId === run) fn();
      }, ms),
    );
  };

  const live = () => get().mode === "live";

  /** queue a backend call; failures drop the app back to offline mode instead of breaking the demo */
  const enqueue = <T>(run: number, fn: () => Promise<T>, then?: (v: T) => void) => {
    chain = chain
      .then(async () => {
        if (get().runId !== run || !live()) return;
        const v = await fn();
        if (get().runId === run && then) then(v);
      })
      .catch(() => set({ mode: "offline" }));
  };

  const emit = (e: Omit<FeedEvent, "id" | "minute">) =>
    set((s) => ({ feed: [{ ...e, id: `e${++seq}`, minute: s.minute }, ...s.feed].slice(0, 40) }));

  const go = (run: number, path: string, ms: number) =>
    later(run, ms, () => {
      if (get().follow) set({ nav: { path, n: ++seq } });
    });

  const setAgent = (id: AgentId, st: AgentState) => set((s) => ({ agents: { ...s.agents, [id]: st } }));
  const bump = () => set((s) => ({ version: s.version + 1 }));

  const payloadFor = (id: string, fallback: Record<string, unknown>) => {
    const step = get().execution?.steps.find((x) => x.type === HOOKS[id].type);
    return step ? step.payload : fallback;
  };

  const call = (run: number, at: number, dur: number, id: string, fallback: Record<string, unknown>, onDone: () => void) => {
    const h = HOOKS[id];
    later(run, at, () =>
      set((s) => ({
        webhooks: [
          ...s.webhooks,
          { id, method: "POST", endpoint: h.endpoint, system: h.system, code: h.code, latencyMs: h.latencyMs, status: "pending", minute: s.minute, payload: payloadFor(id, fallback) },
        ],
      })),
    );
    later(run, at + dur, () => {
      set((s) => ({ webhooks: s.webhooks.map((x) => (x.id === id ? { ...x, status: "done", payload: payloadFor(id, x.payload) } : x)) }));
      onDone();
    });
  };

  const onAnomaly = (run: number) => {
    set((s) => ({ phase: "anomaly", anomalyMinute: s.minute }));
    emit({
      kind: "sensor",
      tone: "critical",
      title: "Anomaly · +3.2 °C over baseline",
      detail: "Rule Δ ≥ 3.0 °C met in Chiller C-03 → agents invoked",
      href: "/batch/STB-042",
    });
    go(run, "/batch/STB-042", 1300);

    later(run, 900, () => {
      set({ phase: "analyzing", vision: "scanning" });
      setAgent("quality", "running");
    });
    later(run, 3900, () => {
      set({ vision: "done", bruising: INCIDENT.bruising, shelfLife: INCIDENT.shelfAfter });
      setAgent("quality", "done");
      setAgent("pricing", "running");
      bump();
      emit({ kind: "agent", tone: "warning", title: "Quality agent · shelf life 31 h → 17 h", detail: "17% early bruising · thermal stress in Chiller C-03", href: "/batch/STB-042" });
    });
    later(run, 6100, () => {
      setAgent("pricing", "done");
      setAgent("logistics", "running");
      emit({ kind: "agent", tone: "info", title: "Pricing agent · −20% clears 100 punnets in 15.7 h", detail: "Footfall −24% · selling 4.2/h, need 10.8/h" });
    });
    later(run, 8300, () => {
      setAgent("logistics", "done");
      setAgent("coordinator", "running");
      emit({ kind: "agent", tone: "info", title: "Logistics agent · Whitefield Hub can take 84", detail: "2.4 km · spare demand 6.5/h · ETA 18 min" });
    });
    later(run, 10100, () => {
      setAgent("coordinator", "done");
      set({ phase: "decided", countdown: AUTO_EXECUTE_S });
      const d = get().decision;
      const value = d?.expected.value ?? INCIDENT.valuePreserved;
      emit({
        kind: "decision",
        tone: "good",
        title: `Decision · ${(d?.planLabel ?? "Transfer 84 + markdown 100 by 20%").toLowerCase()}`,
        detail: `${Math.round((d?.confidence ?? INCIDENT.confidence / 100) * 100)}% confidence · ₹${value.toLocaleString("en-IN")} preserved`,
        href: "/decision",
      });
      bump();
      go(run, "/decision", 500);
    });
  };

  const execute = () => {
    const run = get().runId;
    set({ phase: "executing", countdown: null });
    emit({ kind: "action", tone: "info", title: "Executing plan", detail: "4 actions via store APIs", href: "/execution" });
    go(run, "/execution", 250);
    const d = get().decision;
    if (d) enqueue(run, () => api.approve(d.decisionId), (ex) => set({ execution: ex }));

    call(run, 300, 1000, "w-transfer", { transfer_id: INCIDENT.transferId, batch_id: "STB-042", units: INCIDENT.transferUnits, from: "store-042", to: "hub-whitefield", cold_chain: true, eta_min: INCIDENT.etaMin }, () => {
      set({ transferStage: 1 });
      const id = (get().execution?.transfer?.id as string) ?? INCIDENT.transferId;
      emit({ kind: "action", tone: "good", title: `Transfer ${id} created`, detail: "84 punnets → Whitefield Micro-Hub · ETA 18 min", href: "/execution" });
    });
    call(run, 1500, 1000, "w-esl", { batch_id: "STB-042", labels: ["ESL-3-101", "ESL-3-102"], units: INCIDENT.markdownUnits, price_from: INCIDENT.price, price_to: INCIDENT.priceAfter, reason: "freshness_markdown" }, () => {
      set({ eslPrice: INCIDENT.priceAfter });
      emit({ kind: "action", tone: "good", title: "Shelf labels repriced · ₹180 → ₹144", detail: "100 punnets · 2 e-paper labels in Aisle 3", href: "/execution" });
    });
    call(run, 2700, 800, "w-po", { sku: "strawberry-250g", store: "store-042", adjustment_pct: -INCIDENT.poAdjustPct, reason: "elevated_spoilage_rate", effective: "next_po" }, () => {
      set({ transferStage: 2 });
      emit({ kind: "action", tone: "good", title: "Next strawberry order trimmed 12%", detail: "Spoilage rate fed back into purchasing" });
    });
    call(run, 3700, 800, "w-ticket", { ticket: INCIDENT.ticketId, asset: "Chiller C-03", severity: "high", observed: "+3.2 °C over baseline" }, () => {
      set({ tempTarget: 4.5 });
      const id = (get().execution?.ticket?.id as string) ?? INCIDENT.ticketId;
      emit({ kind: "action", tone: "good", title: `Maintenance ticket ${id} raised`, detail: "Chiller C-03 · door-seal inspection" });
    });
    later(run, 5000, () => {
      const exp = get().decision?.expected;
      const delta = exp ? { value: exp.value, kg: exp.kgSaved, co2: exp.co2Saved } : { value: INCIDENT.valuePreserved, kg: INCIDENT.kgSaved, co2: INCIDENT.co2Saved };
      set((s) => ({
        phase: "resolved",
        transferStage: 3,
        impact: { value: s.impact.value + delta.value, kg: s.impact.kg + delta.kg, co2: s.impact.co2 + delta.co2, actions: s.impact.actions + INCIDENT.actionsExecuted },
      }));
      if (live()) enqueue(run, () => api.impact(), (i) => set({ impact: { value: i.valuePreserved, kg: i.kgSaved, co2: i.co2Saved, actions: i.actions } }));
      bump();
      emit({
        kind: "impact",
        tone: "good",
        title: `Impact recorded · ₹${delta.value.toLocaleString("en-IN")} preserved`,
        detail: `${Math.round(delta.kg)} kg food saved · ${Math.round(delta.co2)} kg CO₂e avoided`,
        href: "/network",
      });
      go(run, "/network", 2600);
    });
  };

  return {
    ...initialData(),
    follow: true,
    mode: "checking",
    backend: null,

    connect: async () => {
      try {
        const h = await api.health();
        set({ mode: "live", backend: h });
        const o = await api.overview();
        set({ impact: { value: o.impactToday.valuePreserved, kg: o.impactToday.kgSaved, co2: o.impactToday.co2Saved, actions: o.impactToday.actions } });
      } catch {
        set({ mode: "offline", backend: null });
      }
    },

    start: () => {
      clearTimers();
      const run = get().runId + 1;
      set({ ...initialData(get().temps), runId: run, phase: "spiking", tempTarget: INCIDENT.tempPeak });
      if (live()) enqueue(run, () => api.reset(), () => bump());
      emit({ kind: "sensor", tone: "warning", title: "Chiller C-03 temperature rising", detail: "Strawberry STB-042 · 184 punnets inside", href: "/batch/STB-042" });
      go(run, "/tower", 0);
    },

    reset: () => {
      clearTimers();
      const run = get().runId + 1;
      set({ ...initialData(get().temps), runId: run });
      if (live()) enqueue(run, () => api.reset(), () => bump());
    },

    approve: () => {
      const p = get().phase;
      if (p === "decided" || p === "held") execute();
    },

    hold: () => {
      if (get().phase !== "decided") return;
      set({ phase: "held", countdown: null });
      const d = get().decision;
      if (d) enqueue(get().runId, () => api.hold(d.decisionId));
      emit({ kind: "decision", tone: "warning", title: "Held for manager review", detail: "Auto-execution paused", href: "/decision" });
    },

    setFollow: (follow) => set({ follow }),

    tick: () => {
      const s = get();
      const last = s.temps[s.temps.length - 1];
      let next: number;
      if (s.phase === "spiking") {
        next = RAMP[Math.min(s.rampIndex, RAMP.length - 1)];
      } else {
        next = Math.round((last + (s.tempTarget - last) * 0.3 + (Math.random() - 0.5) * 0.1) * 100) / 100;
      }

      const patch: Partial<Data> = {
        temps: [...s.temps.slice(1), next],
        minute: s.phase === "idle" ? s.minute : s.minute + 1,
        rampIndex: s.phase === "spiking" ? s.rampIndex + 1 : s.rampIndex,
      };
      if (s.phase === "decided" && s.countdown !== null) patch.countdown = Math.max(0, s.countdown - 1);
      set(patch);

      if (s.phase === "spiking") {
        const run = s.runId;
        enqueue(run, () => api.reading("STB-042", next), (r) => {
          if (r.decisionId) enqueue(run, () => api.decision(r.decisionId as string), (d) => set({ decision: d }));
        });
        if (next >= INCIDENT.tempPeak) onAnomaly(run);
      }
      if (s.phase === "decided" && patch.countdown === 0) execute();
    },
  };
});
