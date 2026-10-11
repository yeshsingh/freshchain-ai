import { create } from "zustand";
import { INCIDENT, SEED_IMPACT } from "./data";
import { seededSeries } from "./format";

/**
 * Live incident simulation. One real second ≈ one store minute.
 *
 *   idle → spiking → anomaly → analyzing → decided ⇄ held → executing → resolved
 *   SEE      SEE     UNDERSTAND UNDERSTAND   DECIDE           ACT        MEASURE
 */

export type Phase = "idle" | "spiking" | "anomaly" | "analyzing" | "decided" | "held" | "executing" | "resolved";
export type AgentId = "quality" | "pricing" | "logistics" | "coordinator";
export type AgentState = "idle" | "running" | "done";
export type Tone = "neutral" | "info" | "good" | "warning" | "critical";
export type FeedKind = "sensor" | "agent" | "decision" | "action" | "impact" | "system";

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

export const STAGES = ["SEE", "UNDERSTAND", "DECIDE", "ACT", "MEASURE"] as const;

export const stageOf = (p: Phase): number =>
  ({ idle: -1, spiking: 0, anomaly: 1, analyzing: 1, decided: 2, held: 2, executing: 3, resolved: 4 })[p];

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

export const AGENT_META: Record<AgentId, { name: string; role: string }> = {
  quality: { name: "Quality", role: "Sensors + vision → remaining shelf life" },
  pricing: { name: "Pricing", role: "Demand + footfall → markdown curve" },
  logistics: { name: "Logistics", role: "Network demand → transfer or offload" },
  coordinator: { name: "Coordinator", role: "Weighs options → one action plan" },
};

const idleAgents = (): Record<AgentId, AgentState> => ({
  quality: "idle",
  pricing: "idle",
  logistics: "idle",
  coordinator: "idle",
});

interface Data {
  phase: Phase;
  runId: number;
  minute: number;
  temps: number[];
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
}

interface Actions {
  start: () => void;
  reset: () => void;
  approve: () => void;
  hold: () => void;
  tick: () => void;
  setFollow: (f: boolean) => void;
}

export type SimState = Data & Actions & { follow: boolean };

const initialData = (temps?: number[]): Data => ({
  phase: "idle",
  runId: 0,
  minute: SIM_START_MINUTE,
  temps: temps ?? seededSeries(42, TEMP_POINTS, INCIDENT.tempBaseline, 0.16),
  tempTarget: INCIDENT.tempBaseline,
  agents: idleAgents(),
  vision: "idle",
  shelfLife: INCIDENT.shelfBefore,
  bruising: INCIDENT.bruisingBefore,
  countdown: null,
  webhooks: [],
  eslPrice: INCIDENT.price,
  transferStage: 0,
  impact: { ...SEED_IMPACT },
  feed: [],
  anomalyMinute: null,
  nav: null,
});

let timers: ReturnType<typeof setTimeout>[] = [];
let seq = 0;
const clearTimers = () => {
  timers.forEach(clearTimeout);
  timers = [];
};

export const useSim = create<SimState>()((set, get) => {
  /** Schedule work that is cancelled automatically by reset()/restart. */
  const later = (run: number, ms: number, fn: () => void) => {
    timers.push(
      setTimeout(() => {
        if (get().runId === run) fn();
      }, ms),
    );
  };

  const emit = (e: Omit<FeedEvent, "id" | "minute">) =>
    set((s) => ({ feed: [{ ...e, id: `e${++seq}`, minute: s.minute }, ...s.feed].slice(0, 40) }));

  const go = (run: number, path: string, ms: number) =>
    later(run, ms, () => {
      if (get().follow) set({ nav: { path, n: ++seq } });
    });

  const setAgent = (id: AgentId, st: AgentState) => set((s) => ({ agents: { ...s.agents, [id]: st } }));

  const call = (run: number, at: number, dur: number, w: Omit<WebhookCall, "status" | "minute">, onDone: () => void) => {
    later(run, at, () => set((s) => ({ webhooks: [...s.webhooks, { ...w, status: "pending", minute: s.minute }] })));
    later(run, at + dur, () => {
      set((s) => ({ webhooks: s.webhooks.map((x) => (x.id === w.id ? { ...x, status: "done" } : x)) }));
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
      emit({
        kind: "agent",
        tone: "warning",
        title: "Quality agent · shelf life 31 h → 17 h",
        detail: "17% early bruising · thermal stress in Chiller C-03",
        href: "/batch/STB-042",
      });
    });
    later(run, 6100, () => {
      setAgent("pricing", "done");
      setAgent("logistics", "running");
      emit({
        kind: "agent",
        tone: "info",
        title: "Pricing agent · −20% clears 100 punnets in 15.6 h",
        detail: "Footfall −24% (rain) · selling 4.2/h, need 10.8/h",
      });
    });
    later(run, 8300, () => {
      setAgent("logistics", "done");
      setAgent("coordinator", "running");
      emit({
        kind: "agent",
        tone: "info",
        title: "Logistics agent · Whitefield Hub can absorb 84",
        detail: "2.4 km · hub demand 13.4/h · ETA 18 min",
      });
    });
    later(run, 10100, () => {
      setAgent("coordinator", "done");
      set({ phase: "decided", countdown: AUTO_EXECUTE_S });
      emit({
        kind: "decision",
        tone: "good",
        title: "Decision · transfer 84 + markdown 100 by 20%",
        detail: `${INCIDENT.confidence}% confidence · auto-executes in ${AUTO_EXECUTE_S} s`,
        href: "/decision",
      });
      go(run, "/decision", 500);
    });
  };

  const execute = () => {
    const run = get().runId;
    set({ phase: "executing", countdown: null });
    emit({ kind: "action", tone: "info", title: "Executing plan", detail: "4 actions via simulated APIs", href: "/execution" });
    go(run, "/execution", 250);

    call(
      run,
      300,
      1000,
      {
        id: "w-transfer",
        method: "POST",
        endpoint: "/v1/transfers",
        system: "Logistics dispatch",
        code: 201,
        latencyMs: 212,
        payload: {
          transfer_id: INCIDENT.transferId,
          batch_id: "STB-042",
          sku: "strawberry-250g",
          units: INCIDENT.transferUnits,
          from: "store-042",
          to: "hub-whitefield",
          cold_chain: true,
          eta_min: INCIDENT.etaMin,
        },
      },
      () => {
        set({ transferStage: 1 });
        emit({
          kind: "action",
          tone: "good",
          title: `Transfer ${INCIDENT.transferId} created`,
          detail: "84 punnets → Whitefield Micro-Hub · ETA 18 min",
          href: "/execution",
        });
      },
    );
    call(
      run,
      1500,
      1000,
      {
        id: "w-esl",
        method: "POST",
        endpoint: "/v1/esl/labels:batchUpdate",
        system: "Electronic shelf labels",
        code: 200,
        latencyMs: 148,
        payload: {
          batch_id: "STB-042",
          labels: ["ESL-3-114", "ESL-3-115"],
          units: INCIDENT.markdownUnits,
          price_from: INCIDENT.price,
          price_to: INCIDENT.priceAfter,
          reason: "freshness_markdown",
          valid_for_h: INCIDENT.shelfAfter,
        },
      },
      () => {
        set({ eslPrice: INCIDENT.priceAfter });
        emit({
          kind: "action",
          tone: "good",
          title: "Shelf labels repriced · ₹180 → ₹144",
          detail: "100 punnets · 2 e-paper labels in Aisle 3",
          href: "/execution",
        });
      },
    );
    call(
      run,
      2700,
      800,
      {
        id: "w-po",
        method: "POST",
        endpoint: "/v1/procurement/forecast-adjustments",
        system: "Purchasing",
        code: 202,
        latencyMs: 96,
        payload: {
          sku: "strawberry-250g",
          store: "store-042",
          adjustment_pct: -INCIDENT.poAdjustPct,
          reason: "elevated_spoilage_rate",
          effective: "next_po",
        },
      },
      () => {
        set({ transferStage: 2 });
        emit({
          kind: "action",
          tone: "good",
          title: "Next strawberry order trimmed 12%",
          detail: "Spoilage rate fed back into purchasing",
        });
      },
    );
    call(
      run,
      3700,
      800,
      {
        id: "w-ticket",
        method: "POST",
        endpoint: "/v1/maintenance/tickets",
        system: "Facilities",
        code: 201,
        latencyMs: 131,
        payload: {
          ticket: INCIDENT.ticketId,
          asset: "chiller-c03",
          severity: "high",
          observed: "+3.2 °C over baseline for 9 min",
        },
      },
      () => {
        set({ tempTarget: 4.5 });
        emit({
          kind: "action",
          tone: "good",
          title: `Maintenance ticket ${INCIDENT.ticketId} raised`,
          detail: "Chiller C-03 · door-seal inspection",
        });
      },
    );
    later(run, 5000, () => {
      set((s) => ({
        phase: "resolved",
        transferStage: 3,
        impact: {
          value: s.impact.value + INCIDENT.valuePreserved,
          kg: s.impact.kg + INCIDENT.kgSaved,
          co2: s.impact.co2 + INCIDENT.co2Saved,
          actions: s.impact.actions + INCIDENT.actionsExecuted,
        },
      }));
      emit({
        kind: "impact",
        tone: "good",
        title: "Impact recorded · ₹15,714 preserved",
        detail: "27 kg food saved · 68 kg CO₂e avoided",
        href: "/network",
      });
      go(run, "/network", 2600);
    });
  };

  return {
    ...initialData(),
    follow: true,

    start: () => {
      clearTimers();
      const run = get().runId + 1;
      set({ ...initialData(get().temps), runId: run, phase: "spiking", tempTarget: INCIDENT.tempPeak });
      emit({
        kind: "sensor",
        tone: "warning",
        title: "Chiller C-03 temperature rising",
        detail: "Strawberry STB-042 · 184 punnets inside",
        href: "/batch/STB-042",
      });
      go(run, "/tower", 0);
    },

    reset: () => {
      clearTimers();
      set({ ...initialData(get().temps), runId: get().runId + 1 });
    },

    approve: () => {
      const p = get().phase;
      if (p === "decided" || p === "held") execute();
    },

    hold: () => {
      if (get().phase !== "decided") return;
      set({ phase: "held", countdown: null });
      emit({ kind: "decision", tone: "warning", title: "Held for manager review", detail: "Auto-execution paused", href: "/decision" });
    },

    setFollow: (follow) => set({ follow }),

    tick: () => {
      const s = get();
      const last = s.temps[s.temps.length - 1];
      let next =
        s.phase === "spiking"
          ? Math.min(INCIDENT.tempPeak, last + 0.4 + Math.random() * 0.12)
          : last + (s.tempTarget - last) * 0.3 + (Math.random() - 0.5) * 0.1;
      next = Math.round(next * 100) / 100;

      const patch: Partial<Data> = {
        temps: [...s.temps.slice(1), next],
        minute: s.phase === "idle" ? s.minute : s.minute + 1,
      };

      if (s.phase === "decided" && s.countdown !== null) {
        patch.countdown = Math.max(0, s.countdown - 1);
      }
      set(patch);

      if (s.phase === "spiking" && next >= INCIDENT.tempPeak) onAnomaly(s.runId);
      if (s.phase === "decided" && patch.countdown === 0) execute();
    },
  };
});
