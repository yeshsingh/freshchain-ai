"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  CircleCheck,
  Cpu,
  Eye,
  MapPin,
  Play,
  Radio,
  RotateCcw,
  Sparkles,
  Webhook,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { INCIDENT, STORE } from "@/lib/data";
import { inr } from "@/lib/format";
import { AUTO_EXECUTE_S, STAGES, phaseLabel, stageOf, useSim, type FeedEvent } from "@/lib/sim";
import { Button, ButtonLink, LiveDot, toneMeta } from "./ui";

/* ------------------------------------------------------------------ */
/* Brand                                                               */
/* ------------------------------------------------------------------ */

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-7", className)} aria-hidden>
      <rect width="24" height="24" rx="7" fill="var(--color-brand)" />
      <path d="M6.6 17.4c0-6 4-10.6 10.8-10.6 0 6.8-4.6 10.6-10.8 10.6Z" fill="white" />
      <path d="M6.9 17.1 12.6 11.4" stroke="var(--color-brand)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-lg">
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
        FreshChain <span className="font-medium text-ink-3">AI</span>
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation model                                                    */
/* ------------------------------------------------------------------ */

const MODES = [
  {
    id: "ops",
    label: "Operations",
    pages: [
      { href: "/tower", label: "Overview" },
      { href: "/inventory", label: "Inventory" },
      { href: "/history", label: "History" },
    ],
  },
  {
    id: "ai",
    label: "AI Control Tower",
    pages: [
      { href: "/batch/STB-042", label: "Investigation", match: "/batch" },
      { href: "/decision", label: "Decision" },
      { href: "/execution", label: "Execution" },
      { href: "/network", label: "Network & impact" },
    ],
  },
] as const;

const matches = (path: string, p: { href: string; match?: string }) => path.startsWith(p.match ?? p.href);
const modeOf = (path: string) => (MODES[1].pages.some((p) => matches(path, p)) ? MODES[1] : MODES[0]);

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export function Header() {
  const path = usePathname();
  const mode = modeOf(path);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-3 px-4 sm:px-6">
        <Logo href="/" />
        <span className="hidden h-5 w-px bg-line sm:block" />
        <span className="hidden items-center gap-1.5 px-1 text-[13px] text-ink-2 sm:flex">
          <MapPin className="size-3.5 text-ink-3" />
          {STORE.name} · {STORE.city}
        </span>
        <div className="flex-1" />
        <ModeSwitch active={mode.id} />
        <div className="flex-1" />
        <SystemHealth />
      </div>
      <div className="mx-auto flex h-11 max-w-[1240px] items-center gap-4 px-4 sm:px-6">
        <nav className="no-scrollbar -mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label={mode.label}>
          {mode.pages.map((p) => {
            const on = matches(path, p);
            return (
              <Link
                key={p.href}
                href={p.href}
                className={cn(
                  "relative shrink-0 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  on ? "text-ink" : "text-ink-3 hover:text-ink",
                )}
              >
                {p.label}
                {on && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute inset-x-2.5 -bottom-[7px] h-[2px] rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <LoopIndicator />
      </div>
    </header>
  );
}

function ModeSwitch({ active }: { active: string }) {
  return (
    <div className="flex items-center rounded-full bg-subtle p-0.5 text-[13px] font-medium" role="tablist" aria-label="Perspective">
      {MODES.map((m) => {
        const on = m.id === active;
        return (
          <Link
            key={m.id}
            href={m.pages[0].href}
            role="tab"
            aria-selected={on}
            className={cn("relative rounded-full px-3 py-1.5 transition-colors", on ? "text-ink" : "text-ink-3 hover:text-ink")}
          >
            {on && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 rounded-full bg-surface shadow-card"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {m.id === "ai" && <Sparkles className="size-3.5" strokeWidth={2} />}
              <span className="hidden sm:inline">{m.label}</span>
              <span className="sm:hidden">{m.id === "ai" ? "AI" : "Ops"}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SEE → UNDERSTAND → DECIDE → ACT → MEASURE                           */
/* ------------------------------------------------------------------ */

export function LoopIndicator({ className }: { className?: string }) {
  const phase = useSim((s) => s.phase);
  const cur = stageOf(phase);
  return (
    <ol className={cn("hidden items-center gap-1 text-[10.5px] font-semibold tracking-[0.06em] md:flex", className)} aria-label="Closed loop progress">
      {STAGES.map((s, i) => {
        const done = cur > i || (phase === "resolved" && i === 4);
        const on = cur === i && phase !== "resolved";
        return (
          <li key={s} className="flex items-center gap-1">
            <span
              className={cn(
                "relative flex items-center gap-1 rounded-full px-2 py-1 transition-colors duration-500",
                on ? "text-ink" : done ? "text-brand" : "text-ink-3/70",
              )}
            >
              {on && (
                <motion.span layoutId="loop-pill" className="absolute inset-0 rounded-full bg-brand-50 ring-1 ring-brand-100" transition={{ type: "spring", stiffness: 400, damping: 34 }} />
              )}
              <span className="relative flex items-center gap-1">
                {done ? <Check className="size-3" strokeWidth={3} /> : on ? <LiveDot tone="good" className="size-1.5" /> : null}
                {s}
              </span>
            </span>
            {i < STAGES.length - 1 && <span className={cn("h-px w-3 transition-colors duration-500", cur > i ? "bg-brand" : "bg-line-strong")} />}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* System health popover                                               */
/* ------------------------------------------------------------------ */

function SystemHealth() {
  const phase = useSim((s) => s.phase);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const busy = phase === "anomaly" || phase === "analyzing" || phase === "executing";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const rows = [
    { icon: Radio, label: "Sensor stream", value: `${STORE.sensors.toLocaleString("en-IN")} sensors · MQTT`, ok: true },
    { icon: Eye, label: "Vision model", value: "Gemini Flash · p50 410 ms", ok: true },
    { icon: Cpu, label: "Agent engine", value: busy ? "4 agents · active" : "4 agents · idle", ok: true },
    { icon: Webhook, label: "Action webhooks", value: "4 endpoints · 99.9%", ok: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-2 rounded-full px-2.5 text-[13px] text-ink-2 transition-colors hover:bg-subtle"
        aria-expanded={open}
      >
        <LiveDot tone={busy ? "info" : "good"} />
        <span className="hidden lg:inline">{busy ? "AI agents active" : "All systems normal"}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-10 w-80 origin-top-right rounded-2xl bg-surface p-2 shadow-pop"
          >
            <div className="px-3 pb-2 pt-2">
              <div className="text-[13px] font-medium">System health</div>
              <div className="text-xs text-ink-3">If AI is unavailable, rule-based FEFO keeps running.</div>
            </div>
            <ul>
              {rows.map((r) => (
                <li key={r.label} className="flex items-center gap-3 rounded-xl px-3 py-2">
                  <r.icon className="size-4 text-ink-3" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px]">{r.label}</div>
                    <div className="text-xs text-ink-3">{r.value}</div>
                  </div>
                  <CircleCheck className="size-4 text-good" />
                </li>
              ))}
            </ul>
            <div className="mt-1 flex items-center justify-between rounded-xl bg-subtle px-3 py-2 text-xs text-ink-2">
              <span>AI spend today</span>
              <span className="font-medium tabular text-ink">$0.04 · 19 evaluations</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Demo dock                                                           */
/* ------------------------------------------------------------------ */

export function DemoDock() {
  const path = usePathname();
  const phase = useSim((s) => s.phase);
  const agents = useSim((s) => s.agents);
  const countdown = useSim((s) => s.countdown);
  const follow = useSim((s) => s.follow);
  const { start, reset, setFollow } = useSim.getState();
  const idle = phase === "idle";
  const done = phase === "resolved";
  const deciding = phase === "decided" || phase === "held";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3 sm:bottom-6">
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full bg-surface/95 p-1.5 pl-4 shadow-pop backdrop-blur-xl"
      >
        {done ? (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-good-50 text-good-ink">
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : (
          <LiveDot tone={idle ? "good" : phase === "held" ? "warning" : "info"} pulse={!idle} />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={phase + agents.quality + agents.pricing + agents.logistics}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="min-w-0 truncate pr-1 text-[13px] font-medium tabular text-ink"
          >
            {idle ? (
              <>
                <span className="hidden sm:inline">Live demo · </span>simulate a cold-chain incident
              </>
            ) : done ? (
              <>Loop closed · {inr(INCIDENT.valuePreserved)} preserved</>
            ) : phase === "decided" ? (
              <>Decision ready · auto-executing in {countdown ?? AUTO_EXECUTE_S}s</>
            ) : (
              phaseLabel(phase, agents)
            )}
          </motion.span>
        </AnimatePresence>

        <button
          role="switch"
          aria-checked={follow}
          onClick={() => setFollow(!follow)}
          className="hidden shrink-0 items-center gap-2 rounded-full px-2 py-1 text-xs text-ink-3 transition-colors hover:text-ink md:flex"
          title="Follow the incident across screens"
        >
          <span className={cn("flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors", follow ? "bg-brand" : "bg-line-strong")}>
            <span className={cn("size-3 rounded-full bg-white shadow-sm transition-transform duration-200", follow ? "translate-x-3" : "translate-x-0")} />
          </span>
          Auto-tour
        </button>

        {idle && (
          <Button variant="primary" size="sm" onClick={start} title="Shortcut: S">
            <Zap className="size-3.5" fill="currentColor" />
            Simulate spike
          </Button>
        )}
        {deciding && path !== "/decision" && (
          <ButtonLink href="/decision" variant="primary" size="sm">
            Review decision
          </ButtonLink>
        )}
        {done && (
          <Button variant="dark" size="sm" onClick={start}>
            <Play className="size-3.5" fill="currentColor" />
            Replay
          </Button>
        )}
        {!idle && (
          <button
            onClick={reset}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-subtle hover:text-ink"
            title="Reset demo (R)"
            aria-label="Reset demo"
          >
            <RotateCcw className="size-3.5" />
          </button>
        )}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toasts — only when auto-tour is off                                 */
/* ------------------------------------------------------------------ */

export function Toasts() {
  const feed = useSim((s) => s.feed);
  const follow = useSim((s) => s.follow);
  const [items, setItems] = useState<FeedEvent[]>([]);
  const seen = useRef<string | null>(null);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const top = feed[0];
    if (!top || top.id === seen.current) return;
    seen.current = top.id;
    if (follow) return;
    if (!(top.kind === "decision" || top.kind === "impact" || top.tone === "critical")) return;
    setItems((xs) => [top, ...xs].slice(0, 3));
    const id = top.id;
    timers.current.set(
      id,
      setTimeout(() => {
        setItems((xs) => xs.filter((x) => x.id !== id));
        timers.current.delete(id);
      }, 5000),
    );
  }, [feed, follow]);

  return (
    <div className="pointer-events-none fixed right-4 top-28 z-50 flex w-80 flex-col gap-2">
      <AnimatePresence initial={false}>
        {items.map((e) => (
          <motion.div
            key={e.id}
            layout
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className="pointer-events-auto rounded-2xl bg-surface p-3 shadow-pop"
          >
            <div className="flex items-start gap-2.5">
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", toneMeta(e.tone).dot)} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">{e.title}</div>
                {e.detail && <div className="mt-0.5 text-xs text-ink-3">{e.detail}</div>}
                {e.href && (
                  <Link href={e.href} className="mt-1.5 inline-block text-xs font-medium text-brand hover:underline">
                    View →
                  </Link>
                )}
              </div>
              <button onClick={() => setItems((xs) => xs.filter((x) => x.id !== e.id))} className="text-ink-3 hover:text-ink" aria-label="Dismiss">
                <X className="size-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Runtime: telemetry clock, auto-tour navigation, shortcuts, ?demo=1 */
/* ------------------------------------------------------------------ */

export function SimulationRuntime() {
  const router = useRouter();
  const path = usePathname();
  const nav = useSim((s) => s.nav);
  const pathRef = useRef(path);
  pathRef.current = path;

  useEffect(() => {
    const id = setInterval(() => useSim.getState().tick(), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (nav && nav.path !== pathRef.current) router.push(nav.path, { scroll: true });
  }, [nav, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || el.closest("input, textarea, select, [contenteditable]")) return;
      const s = useSim.getState();
      const k = e.key.toLowerCase();
      if (k === "s" && (s.phase === "idle" || s.phase === "resolved")) s.start();
      else if (k === "r") s.reset();
      else if (k === "a") s.approve();
      else if (k === "h") s.hold();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") !== "1") return;
    // strip the flag first so a StrictMode re-run (or a refresh) doesn't start twice
    window.history.replaceState(null, "", window.location.pathname);
    useSim.getState().setFollow(true);
    setTimeout(() => useSim.getState().start(), 700);
  }, []);

  return null;
}
