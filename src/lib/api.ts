/**
 * Client for the FreshChain FastAPI backend, reached through the same-origin `/backend/*` proxy
 * (see next.config.ts). When no backend is configured the app runs its built-in offline simulation.
 */

const BASE = "/backend";

export interface EvidenceRow {
  n: string;
  title: string;
  value: string;
  evidence: string;
  impact: string;
  agent: string;
  tone: "critical" | "warning" | "info" | "good" | "neutral";
}

export interface OptionOut {
  id: string;
  label: string;
  detail: string;
  sold: number;
  moved: number;
  waste: number;
  sellThrough: number;
  value: number;
  selected?: boolean;
}

export interface PlanStep {
  type: "TRANSFER" | "MARKDOWN" | "B2B_OFFER" | "DONATION" | "PO_ADJUST" | "MAINTENANCE";
  quantity?: number;
  target?: string;
  targetName?: string;
  distanceKm?: number;
  etaMin?: number;
  cost?: number;
  pct?: number;
  priceFrom?: number;
  priceTo?: number;
  asset?: string;
  observed?: string;
}

export interface DecisionOut {
  decisionId: string;
  batchId: string;
  trigger: string;
  status: string;
  confidence: number;
  selectedOption: string;
  planLabel: string;
  plan: PlanStep[];
  options: OptionOut[];
  evidence: EvidenceRow[];
  rationale: string;
  expected: { value: number; wasteBefore: number; wasteAfter: number; kgSaved: number; co2Saved: number; sellThrough: number; hoursLeft: number };
  modelUsed: string;
  modelMeta: { model?: string; latencyMs?: number; tokensIn?: number; tokensOut?: number; tokensCached?: number };
  executionId: string | null;
}

export interface ExecutionStep {
  type: PlanStep["type"];
  name: string;
  detail: string;
  system: string;
  endpoint: string;
  code: number;
  status: string;
  at: string;
  payload: Record<string, unknown>;
}

export interface ExecutionOut {
  executionId: string;
  decisionId: string;
  steps: ExecutionStep[];
  impact: { value: number; kg: number; co2: number; actions: number };
  transfer: { id: string; destination: string; etaMin: number } | null;
  ticket: { id: string } | null;
}

export interface ItemOut {
  id: string;
  name: string;
  variant: string;
  category: string;
  icon: string;
  units: number;
  unitLabel: string;
  price: number;
  originalPrice: number;
  stockValue: number;
  location: string;
  supplier: string | null;
  lotCode: string;
  receivedAt: string;
  expiryAt: string;
  risk: number;
  status: "healthy" | "risk" | "critical" | "managed";
  shelfLifeH: number;
  printedShelfH: number;
  signals: string[];
  action: string;
  actionNote: string | null;
}

export interface BatchDetailOut extends ItemOut {
  parentBatchId: string | null;
  harvestDate: string | null;
  temp: { baseline: number; now: number; safe: [number, number]; threshold: number; series: number[] };
  humidity: number;
  ethylene: number;
  vision: { defectPct: number; label: string; inspectedAt: string | null; model: string | null; summary: string | null };
  demand: { rate: number; forecast: number | null; needed: number; footfallRatio: number | null; history: number[] };
  shelfLife: { estimateH: number; printedH: number; tempFactor: number; qualityFactor: number };
}

export interface ImpactOut {
  valuePreserved: number;
  kgSaved: number;
  co2Saved: number;
  actions: number;
  week: { day: string; kg: number; today?: boolean }[];
}

export interface OverviewOut {
  store: { id: string; name: string; city: string; area: string; skus: number; sensors: number };
  riskSummary: { healthy: number; risk: number; critical: number; managed: number };
  activeIncident: { batchId: string; decisionId: string; status: string; confidence: number } | null;
  impactToday: ImpactOut;
  coldChain: { zone: string; tempC: number; baselineC: number; deltaC: number; status: "good" | "warning" | "critical"; batchId: string }[];
  weather: { source: string; temperatureC: number | null; precipNext3hMm: number; rainExpected: boolean; footfallFactor: number };
}

export interface EventOut {
  id: string;
  timestamp: string;
  kind: string;
  tone: "neutral" | "info" | "good" | "warning" | "critical";
  group: "sensor" | "ai" | "action";
  batchId: string | null;
  title: string;
  detail: string;
  data: { evidence?: string[]; value?: number; actionType?: string };
}

export interface NetworkNodeOut {
  id: string;
  name: string;
  kind: "store" | "hub" | "dark_store" | "b2b" | "food_bank";
  area: string;
  x: number;
  y: number;
  distanceKm: number;
  selected: boolean;
  etaMin?: number;
  headroomPerH?: number;
  capacity?: number;
  absorbable?: number;
  score?: number;
  verdict?: string;
  unitPrice?: number | null;
}

export interface NetworkOut {
  origin: string;
  nodes: NetworkNodeOut[];
}

export interface HealthOut {
  status: string;
  ai: { provider: "rules" | "gemini"; model: string | null };
  databaseEngine: string;
  monitorIntervalS: number;
}

export interface ReadingOut {
  readingId: string;
  anomalyFlags: string[];
  decisionId: string | null;
}

async function call<T>(path: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(BASE + path, {
      ...init,
      cache: "no-store",
      signal: ctrl.signal,
      headers: init?.body ? { "content-type": "application/json" } : undefined,
    });
    if (!res.ok) throw new Error(`${res.status} ${path}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

const post = <T>(path: string, body?: unknown) => call<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  health: () => call<HealthOut>("/health", undefined, 2500),
  reset: () => post<{ status: string }>("/api/demo/reset"),
  reading: (batchId: string, temperatureC: number) =>
    post<ReadingOut>("/api/sensors/readings", { batch_id: batchId, temperature_c: temperatureC, humidity_percent: 91, ethylene_ppm: 0.4 }),
  decision: (id: string) => call<DecisionOut>(`/api/decisions/${id}`),
  approve: (id: string) => post<ExecutionOut>(`/api/decisions/${id}/approve`),
  hold: (id: string) => post<DecisionOut>(`/api/decisions/${id}/hold`),
  overview: () => call<OverviewOut>("/api/store/overview"),
  items: () => call<{ items: ItemOut[] }>("/api/inventory/items"),
  batch: (id: string) => call<{ batch: BatchDetailOut }>(`/api/batches/${encodeURIComponent(id)}`),
  events: () => call<{ events: EventOut[] }>("/api/history/events?limit=60"),
  network: (batchId = "STB-042") => call<NetworkOut>(`/api/network/graph?batch_id=${encodeURIComponent(batchId)}`),
  impact: () => call<ImpactOut>("/api/network/impact"),
};
