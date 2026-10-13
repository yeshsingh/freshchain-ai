/**
 * All data in this prototype is simulated. Numbers are internally consistent:
 * every figure shown in the UI is derived from the constants below.
 */

export type Category = "Produce" | "Dairy" | "Bakery" | "Seafood" | "Meat" | "Pharma";
export type Status = "healthy" | "risk" | "critical" | "managed";
export type IconKey =
  | "strawberry"
  | "bread"
  | "milk"
  | "lettuce"
  | "fish"
  | "paneer"
  | "meat"
  | "pharma"
  | "spinach"
  | "croissant"
  | "yogurt"
  | "avocado"
  | "prawn";

export interface Batch {
  id: string;
  name: string;
  variant: string;
  category: Category;
  icon: IconKey;
  units: number;
  unitLabel: string;
  unitKg: number;
  price: number;
  location: string;
  supplier: string;
  receivedAt: string;
  risk: number;
  shelfLifeH: number;
  printedShelfH: number;
  signals: string[];
  action: string;
  actionNote?: string;
  temp: { baseline: number; now: number; safe: [number, number]; threshold: number };
  humidity: number;
  ethylene?: number;
  vision: { defectPct: number; label: string; inspectedAt: string };
  demand: { rate: number; forecast: number; history: number[] };
}

export const STORE = {
  id: "store-042",
  name: "Store #042",
  city: "Bengaluru",
  area: "Brookefield",
  manager: "Store Manager",
  skus: 8706,
  sensors: 1284,
};

export const statusOf = (risk: number): Status => (risk >= 80 ? "critical" : risk >= 50 ? "risk" : "healthy");

/* ------------------------------------------------------------------ */
/* The demo incident — Strawberry STB-042 in Chiller C-03              */
/* ------------------------------------------------------------------ */

export const INCIDENT = {
  batchId: "STB-042",
  chiller: "Chiller C-03",
  tempBaseline: 4.0,
  tempPeak: 7.2,
  tempRule: 3.0,
  shelfBefore: 31,
  shelfAfter: 17,
  printedShelf: 40,
  bruising: 17,
  bruisingBefore: 2,
  units: 184,
  price: 180,
  unitKg: 0.25,
  demandRate: 4.2,
  demandForecast: 5.5,
  neededRate: 10.8, // 184 units / 17 h
  transferUnits: 84,
  markdownUnits: 100,
  markdownPct: 20,
  priceAfter: 144,
  markdownRate: 6.4, // demand at −20% (elasticity 2.6)
  markdownClearH: 15.7,
  hubHeadroom: 6.5, // hub demand 13.4/h minus 6.9/h already supplied
  hubClearH: 13,
  hubKm: 2.4,
  etaMin: 18,
  transferCost: 450,
  confidence: 92,
  transferId: "TO-7781",
  ticketId: "MT-2291",
  poAdjustPct: 12,
  // Expected outcomes
  baselineSold: 71, // 4.2 u/h × 17 h
  baselineWaste: 113,
  planSoldStore: 100,
  planWaste: 0,
  valuePreserved: 16290, // (84×180 + 100×144 − 450) − 71×180, same as the backend
  kgSaved: 28.25, // 113 × 0.25 kg
  co2Factor: 2.5, // kg CO₂e per kg food saved
  co2Saved: 70.6,
  actionsExecuted: 4,
  tokensIn: 1184,
  tokensCachedPct: 78,
  tokensOut: 41,
  costUsd: 0.0019,
  latencyMs: 640,
} as const;

export const BATCHES: Batch[] = [
  {
    id: "STB-042",
    name: "Strawberry",
    variant: "250 g punnet",
    category: "Produce",
    icon: "strawberry",
    units: 184,
    unitLabel: "punnets",
    unitKg: 0.25,
    price: 180,
    location: "Chiller C-03 · Aisle 3",
    supplier: "Nandi Hills Farms",
    receivedAt: "06:10",
    risk: 38,
    shelfLifeH: 31,
    printedShelfH: 40,
    signals: ["Demand ↓"],
    action: "Monitor",
    temp: { baseline: 4.0, now: 4.0, safe: [1, 5], threshold: 7.0 },
    humidity: 91,
    ethylene: 0.4,
    vision: { defectPct: 2, label: "Within tolerance", inspectedAt: "08:00" },
    demand: { rate: 4.2, forecast: 5.5, history: [6.1, 5.8, 5.9, 5.6, 5.2, 5.4, 4.9, 4.6, 4.4, 4.1, 4.3, 4.2] },
  },
  {
    id: "BRD-021",
    name: "Sourdough loaf",
    variant: "500 g",
    category: "Bakery",
    icon: "bread",
    units: 64,
    unitLabel: "loaves",
    unitKg: 0.5,
    price: 120,
    location: "Bakery shelf B-1",
    supplier: "In-store bakery",
    receivedAt: "05:30",
    risk: 88,
    shelfLifeH: 8,
    printedShelfH: 10,
    signals: ["Expiry", "Demand ↓"],
    action: "B2B offload",
    actionNote: "32 loaves · Second Bake Co. · pickup 14:00",
    temp: { baseline: 24.0, now: 24.3, safe: [18, 27], threshold: 29 },
    humidity: 52,
    vision: { defectPct: 4, label: "Crust drying", inspectedAt: "09:00" },
    demand: { rate: 3.6, forecast: 5.0, history: [5.2, 5.0, 4.8, 4.9, 4.4, 4.1, 3.9, 3.8, 3.7, 3.5, 3.6, 3.6] },
  },
  {
    id: "MLK-188",
    name: "Toned milk",
    variant: "1 L",
    category: "Dairy",
    icon: "milk",
    units: 120,
    unitLabel: "packs",
    unitKg: 1.03,
    price: 68,
    location: "Dairy cooler D-2",
    supplier: "Nandini Dairy Co-op",
    receivedAt: "05:50",
    risk: 71,
    shelfLifeH: 29,
    printedShelfH: 30,
    signals: ["Demand ↓"],
    action: "Markdown",
    actionNote: "15% off since 07:10",
    temp: { baseline: 3.5, now: 3.6, safe: [1, 4.5], threshold: 6.5 },
    humidity: 80,
    vision: { defectPct: 0, label: "Packaging intact", inspectedAt: "08:00" },
    demand: { rate: 3.1, forecast: 4.1, history: [4.6, 4.4, 4.2, 4.0, 3.9, 3.6, 3.4, 3.2, 3.3, 3.1, 3.0, 3.1] },
  },
  {
    id: "CRS-015",
    name: "Butter croissant",
    variant: "Single",
    category: "Bakery",
    icon: "croissant",
    units: 48,
    unitLabel: "pieces",
    unitKg: 0.1,
    price: 75,
    location: "Bakery shelf B-2",
    supplier: "In-store bakery",
    receivedAt: "06:00",
    risk: 77,
    shelfLifeH: 10,
    printedShelfH: 12,
    signals: ["Expiry"],
    action: "Food rescue",
    actionNote: "36 pieces · Annapurna Food Rescue · 20:00",
    temp: { baseline: 23.5, now: 23.8, safe: [18, 27], threshold: 29 },
    humidity: 50,
    vision: { defectPct: 3, label: "Minor flaking", inspectedAt: "09:00" },
    demand: { rate: 2.4, forecast: 3.2, history: [3.8, 3.6, 3.5, 3.1, 3.0, 2.9, 2.7, 2.6, 2.5, 2.4, 2.4, 2.4] },
  },
  {
    id: "PRN-118",
    name: "Tiger prawns",
    variant: "250 g tray",
    category: "Seafood",
    icon: "prawn",
    units: 26,
    unitLabel: "trays",
    unitKg: 0.25,
    price: 520,
    location: "Seafood case S-1",
    supplier: "Mangaluru Coast Fisheries",
    receivedAt: "05:20",
    risk: 66,
    shelfLifeH: 22,
    printedShelfH: 36,
    signals: ["Temp drift"],
    action: "Monitor",
    actionNote: "Re-evaluate 15:00",
    temp: { baseline: 1.0, now: 2.1, safe: [0, 2], threshold: 4.0 },
    humidity: 88,
    vision: { defectPct: 5, label: "Slight discolouration", inspectedAt: "09:30" },
    demand: { rate: 1.1, forecast: 1.3, history: [1.4, 1.3, 1.2, 1.3, 1.2, 1.1, 1.2, 1.0, 1.1, 1.1, 1.0, 1.1] },
  },
  {
    id: "SLM-310",
    name: "Atlantic salmon fillet",
    variant: "250 g",
    category: "Seafood",
    icon: "fish",
    units: 22,
    unitLabel: "fillets",
    unitKg: 0.25,
    price: 640,
    location: "Seafood case S-1",
    supplier: "Nordic Cold Imports",
    receivedAt: "05:20",
    risk: 63,
    shelfLifeH: 26,
    printedShelfH: 48,
    signals: ["Temp drift"],
    action: "Monitor",
    actionNote: "Drift +1.4 °C — below rule",
    temp: { baseline: 1.0, now: 2.4, safe: [0, 2], threshold: 4.0 },
    humidity: 87,
    vision: { defectPct: 1, label: "Within tolerance", inspectedAt: "09:30" },
    demand: { rate: 0.9, forecast: 1.1, history: [1.2, 1.1, 1.0, 1.1, 1.0, 0.9, 1.0, 0.9, 0.8, 0.9, 0.9, 0.9] },
  },
  {
    id: "SPN-118",
    name: "Baby spinach",
    variant: "200 g bag",
    category: "Produce",
    icon: "spinach",
    units: 72,
    unitLabel: "bags",
    unitKg: 0.2,
    price: 70,
    location: "Chiller C-01",
    supplier: "Hosur Greens",
    receivedAt: "06:15",
    risk: 58,
    shelfLifeH: 20,
    printedShelfH: 36,
    signals: ["Vision"],
    action: "Markdown",
    actionNote: "25% off since 09:05",
    temp: { baseline: 3.0, now: 3.1, safe: [1, 5], threshold: 6.0 },
    humidity: 94,
    vision: { defectPct: 9, label: "Leaf wilting", inspectedAt: "09:00" },
    demand: { rate: 3.4, forecast: 3.0, history: [2.6, 2.7, 2.9, 2.8, 3.0, 3.2, 3.3, 3.5, 3.4, 3.6, 3.5, 3.4] },
  },
  {
    id: "LET-091",
    name: "Iceberg lettuce",
    variant: "Head",
    category: "Produce",
    icon: "lettuce",
    units: 96,
    unitLabel: "heads",
    unitKg: 0.4,
    price: 60,
    location: "Chiller C-01",
    supplier: "Hosur Greens",
    receivedAt: "06:15",
    risk: 52,
    shelfLifeH: 41,
    printedShelfH: 72,
    signals: ["Demand"],
    action: "Monitor",
    temp: { baseline: 3.0, now: 3.0, safe: [1, 5], threshold: 6.0 },
    humidity: 93,
    vision: { defectPct: 3, label: "Within tolerance", inspectedAt: "09:00" },
    demand: { rate: 2.0, forecast: 2.6, history: [2.8, 2.7, 2.6, 2.5, 2.4, 2.3, 2.2, 2.2, 2.1, 2.0, 2.0, 2.0] },
  },
  {
    id: "CHK-204",
    name: "Chicken breast",
    variant: "500 g",
    category: "Meat",
    icon: "meat",
    units: 40,
    unitLabel: "packs",
    unitKg: 0.5,
    price: 290,
    location: "Meat case M-1",
    supplier: "Suguna Fresh",
    receivedAt: "05:40",
    risk: 46,
    shelfLifeH: 38,
    printedShelfH: 48,
    signals: ["Demand"],
    action: "Monitor",
    temp: { baseline: 1.5, now: 1.6, safe: [0, 3], threshold: 4.5 },
    humidity: 85,
    vision: { defectPct: 1, label: "Within tolerance", inspectedAt: "09:30" },
    demand: { rate: 1.1, forecast: 1.4, history: [1.6, 1.5, 1.4, 1.4, 1.3, 1.3, 1.2, 1.2, 1.1, 1.1, 1.1, 1.1] },
  },
  {
    id: "AVC-033",
    name: "Hass avocado",
    variant: "Single",
    category: "Produce",
    icon: "avocado",
    units: 60,
    unitLabel: "pieces",
    unitKg: 0.2,
    price: 99,
    location: "Ripening rack R-1",
    supplier: "Coorg Orchards",
    receivedAt: "Yesterday",
    risk: 41,
    shelfLifeH: 44,
    printedShelfH: 96,
    signals: ["Ripeness"],
    action: "Monitor",
    actionNote: "30 moved to Store #017 at 10:52",
    temp: { baseline: 14.0, now: 14.2, safe: [10, 18], threshold: 20 },
    humidity: 86,
    ethylene: 1.9,
    vision: { defectPct: 6, label: "Ripening fast", inspectedAt: "09:00" },
    demand: { rate: 1.6, forecast: 1.8, history: [1.9, 1.8, 1.8, 1.7, 1.7, 1.6, 1.7, 1.6, 1.5, 1.6, 1.6, 1.6] },
  },
  {
    id: "PNR-077",
    name: "Fresh paneer",
    variant: "200 g",
    category: "Dairy",
    icon: "paneer",
    units: 58,
    unitLabel: "packs",
    unitKg: 0.2,
    price: 95,
    location: "Dairy cooler D-1",
    supplier: "Nandini Dairy Co-op",
    receivedAt: "05:50",
    risk: 34,
    shelfLifeH: 52,
    printedShelfH: 72,
    signals: [],
    action: "Monitor",
    temp: { baseline: 3.5, now: 3.5, safe: [1, 4.5], threshold: 6.5 },
    humidity: 78,
    vision: { defectPct: 0, label: "Packaging intact", inspectedAt: "08:00" },
    demand: { rate: 1.4, forecast: 1.4, history: [1.3, 1.4, 1.5, 1.4, 1.3, 1.4, 1.5, 1.4, 1.4, 1.3, 1.4, 1.4] },
  },
  {
    id: "YGT-260",
    name: "Greek yogurt",
    variant: "400 g",
    category: "Dairy",
    icon: "yogurt",
    units: 90,
    unitLabel: "tubs",
    unitKg: 0.4,
    price: 150,
    location: "Dairy cooler D-2",
    supplier: "Epigamia",
    receivedAt: "Yesterday",
    risk: 12,
    shelfLifeH: 96,
    printedShelfH: 120,
    signals: [],
    action: "Monitor",
    temp: { baseline: 3.5, now: 3.6, safe: [1, 4.5], threshold: 6.5 },
    humidity: 80,
    vision: { defectPct: 0, label: "Packaging intact", inspectedAt: "08:00" },
    demand: { rate: 1.2, forecast: 1.1, history: [1.0, 1.1, 1.1, 1.2, 1.1, 1.2, 1.3, 1.2, 1.2, 1.1, 1.2, 1.2] },
  },
  {
    id: "INS-902",
    name: "Insulin pens",
    variant: "Cold-chain pharma",
    category: "Pharma",
    icon: "pharma",
    units: 30,
    unitLabel: "pens",
    unitKg: 0.02,
    price: 780,
    location: "Pharmacy fridge P-1",
    supplier: "Regional pharma DC",
    receivedAt: "Mon",
    risk: 6,
    shelfLifeH: 2160,
    printedShelfH: 2160,
    signals: [],
    action: "Monitor",
    actionNote: "GDP compliant · 2–8 °C",
    temp: { baseline: 5.0, now: 5.1, safe: [2, 8], threshold: 8.0 },
    humidity: 45,
    vision: { defectPct: 0, label: "Seals intact", inspectedAt: "08:00" },
    demand: { rate: 0.3, forecast: 0.3, history: [0.3, 0.2, 0.3, 0.3, 0.4, 0.3, 0.3, 0.2, 0.3, 0.3, 0.3, 0.3] },
  },
];

export const getBatch = (id: string) => BATCHES.find((b) => b.id === id);

/* ------------------------------------------------------------------ */
/* Store-wide counters (all 8,706 SKUs)                               */
/* ------------------------------------------------------------------ */

export const COUNTS = {
  idle: { healthy: 8422, risk: 247, critical: 37 },
  incident: { healthy: 8421, risk: 247, critical: 38 },
  resolved: { healthy: 8421, risk: 248, critical: 37 },
};

export const CHILLERS = [
  { id: "C-01", label: "Chiller C-01", zone: "Leafy greens", base: 3.0 },
  { id: "C-02", label: "Chiller C-02", zone: "Cut fruit", base: 3.4 },
  { id: "C-03", label: "Chiller C-03", zone: "Berries", base: 4.0 },
  { id: "D-2", label: "Dairy cooler D-2", zone: "Milk & yogurt", base: 3.5 },
  { id: "S-1", label: "Seafood case S-1", zone: "Fish & prawns", base: 1.0, drift: 1.1 },
];

/* ------------------------------------------------------------------ */
/* Redistribution network                                             */
/* ------------------------------------------------------------------ */

export type NodeKind = "origin" | "hub" | "store" | "dark" | "b2b" | "rescue";
export interface NetNode {
  id: string;
  name: string;
  area: string;
  kind: NodeKind;
  x: number;
  y: number;
  km?: number;
  rate?: number;
  capacity?: string;
  score?: number;
  verdict?: string;
}

export const NODES: NetNode[] = [
  { id: "store-042", name: "Store #042", area: "Brookefield", kind: "origin", x: 0.412, y: 0.745 },
  {
    id: "hub-whitefield",
    name: "Whitefield Micro-Hub",
    area: "Quick-commerce hub",
    kind: "hub",
    x: 0.644,
    y: 0.551,
    km: 2.4,
    rate: 6.5,
    capacity: "Cold space for 120",
    score: 0.96,
    verdict: "Best · sells 84 in ~13 h",
  },
  {
    id: "dark-kadugodi",
    name: "Kadugodi Dark Store",
    area: "Dark store",
    kind: "dark",
    x: 0.9,
    y: 0.239,
    km: 5.5,
    rate: 5.6,
    capacity: "Cold storage full",
    score: 0.07,
    verdict: "No cold capacity",
  },
  {
    id: "store-017",
    name: "Store #017",
    area: "Marathahalli",
    kind: "store",
    x: 0.205,
    y: 0.9,
    km: 2.1,
    rate: 3.8,
    capacity: "Space for 60",
    score: 0.6,
    verdict: "Can sell 48 in ~13 h",
  },
  {
    id: "store-031",
    name: "Store #031",
    area: "KR Puram",
    kind: "store",
    x: 0.128,
    y: 0.1,
    km: 5.2,
    rate: 2.2,
    capacity: "Space for 90",
    score: 0.31,
    verdict: "Can sell 24 in ~11 h",
  },
  {
    id: "b2b-freshpress",
    name: "FreshPress Juicery",
    area: "Hoodi · B2B buyer",
    kind: "b2b",
    x: 0.376,
    y: 0.349,
    km: 2.8,
    verdict: "Fallback at T−4 h · ₹54/punnet",
  },
  {
    id: "rescue-annapurna",
    name: "Annapurna Food Rescue",
    area: "Mahadevapura · food bank",
    kind: "rescue",
    x: 0.1,
    y: 0.354,
    km: 3.8,
    verdict: "Donation fallback",
  },
];

/* ------------------------------------------------------------------ */
/* Today's history (before the live incident)                         */
/* ------------------------------------------------------------------ */

export type HistoryKind = "markdown" | "transfer" | "b2b" | "rescue" | "sensor" | "decision" | "system";
export interface HistoryItem {
  id: string;
  minute: number;
  kind: HistoryKind;
  title: string;
  detail: string;
  batchId?: string;
  value?: number;
  kg?: number;
  evidence?: string[];
}

const t = (h: number, m: number) => h * 60 + m;

export const HISTORY_SEED: HistoryItem[] = [
  {
    id: "h-1052",
    minute: t(10, 52),
    kind: "transfer",
    title: "Redistribution",
    detail: "30 avocados moved to Store #017 (5.1 km)",
    batchId: "AVC-033",
    value: 2700,
    kg: 6,
    evidence: ["Ethylene 1.9 ppm — ripening 2× faster", "Store #017 avocado demand 3.1/h vs 1.6/h here", "Transfer clears stock in 10 h vs 37 h"],
  },
  {
    id: "h-1015",
    minute: t(10, 15),
    kind: "sensor",
    title: "Temperature drift",
    detail: "Seafood case S-1 +1.4 °C — below 3.0 °C rule, no AI call",
    batchId: "SLM-310",
    evidence: ["Rule-based filter handled it — 0 tokens spent", "Re-evaluation scheduled 15:00"],
  },
  {
    id: "h-0940",
    minute: t(9, 40),
    kind: "rescue",
    title: "Food rescue",
    detail: "36 croissants booked for Annapurna Food Rescue · 20:00",
    batchId: "CRS-015",
    value: 1350,
    kg: 3.6,
    evidence: ["10 h left · demand 2.4/h won't clear 48", "Markdown below cost — donation preferred", "Tax receipt auto-generated (₹1,350)"],
  },
  {
    id: "h-0905",
    minute: t(9, 5),
    kind: "markdown",
    title: "Dynamic markdown",
    detail: "Baby spinach −25% on 40 bags · ESL updated",
    batchId: "SPN-118",
    value: 1800,
    kg: 8,
    evidence: ["Vision: 9% leaf wilting", "Shelf life 36 h → 20 h", "−25% lifts demand to 3.4/h — clears in 12 h"],
  },
  {
    id: "h-0825",
    minute: t(8, 25),
    kind: "b2b",
    title: "B2B offload",
    detail: "32 sourdough loaves listed to Second Bake Co. · pickup 14:00",
    batchId: "BRD-021",
    value: 1920,
    kg: 16,
    evidence: ["8 h left · demand down 28% (weekday)", "Markdown alone clears ~50%", "Croutons buyer pays ₹60/loaf"],
  },
  {
    id: "h-0710",
    minute: t(7, 10),
    kind: "markdown",
    title: "Dynamic markdown",
    detail: "Toned milk −15% on 48 packs · ESL updated",
    batchId: "MLK-188",
    value: 2880,
    kg: 24,
    evidence: ["Demand 3.1/h vs 4.1/h forecast", "29 h left on 120 packs", "−15% lifts demand to 4.4/h"],
  },
];

export const SEED_IMPACT = HISTORY_SEED.reduce(
  (acc, h) => {
    if (h.value) {
      acc.value += h.value;
      acc.kg += h.kg ?? 0;
      acc.co2 += (h.kg ?? 0) * INCIDENT.co2Factor;
      acc.actions += 1;
    }
    return acc;
  },
  { value: 0, kg: 0, co2: 0, actions: 0 },
);

/** kg of food saved per day, last 6 days (today is appended live). */
export const WEEK_KG = [
  { day: "Sun", kg: 92 },
  { day: "Mon", kg: 71 },
  { day: "Tue", kg: 84 },
  { day: "Wed", kg: 66 },
  { day: "Thu", kg: 103 },
  { day: "Fri", kg: 88 },
];

/* ------------------------------------------------------------------ */
/* Decision options (Coordinator agent)                                */
/* ------------------------------------------------------------------ */

export const OPTIONS = [
  { id: "keep", label: "Do nothing", detail: "Sell at ₹180 in-store", sellThrough: 39, waste: 113, value: 0 },
  { id: "markdown_30", label: "Markdown 30% on all 184", detail: "₹126 · demand 7.5/h", sellThrough: 69, waste: 57, value: 3222 },
  { id: "transfer_84", label: "Transfer 84 only", detail: "Whitefield Micro-Hub at ₹180 · rest unchanged", sellThrough: 84, waste: 29, value: 14670 },
  {
    id: "transfer_84_markdown_20",
    label: "Transfer 84 + markdown 100 by 20%",
    detail: "Whitefield Micro-Hub clears in ~13 h · store clears in 15.7 h",
    sellThrough: 100,
    waste: 0,
    value: 16290,
    selected: true,
  },
  { id: "b2b_all", label: "B2B offload all 184 now", detail: "FreshPress Juicery at ₹54/punnet", sellThrough: 100, waste: 0, value: -2844 },
] as const;
