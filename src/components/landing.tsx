"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Cherry, LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { seededSeries } from "@/lib/format";
import { Sparkline } from "./charts";

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}

const CALM = seededSeries(7, 28, 4.0, 0.16);
const SPIKE = CALM.map((v, i) => (i < 20 ? v : Math.round((4 + ((i - 19) / 8) * 3.2) * 100) / 100));
const STAGES = ["SEE", "UNDERSTAND", "DECIDE", "ACT", "MEASURE"];

/** Self-running miniature of the product: one incident, start to finish. */
export function HeroPreview() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 6), 2300);
    return () => clearInterval(id);
  }, []);

  const spiked = step >= 1;
  const scored = step >= 2;
  const acted = step >= 4;
  const stage = step === 0 ? 0 : Math.min(step, 4);

  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[36px] bg-gradient-to-br from-brand-100/60 via-transparent to-info-50 blur-2xl" aria-hidden />
      <div className="rounded-[22px] bg-surface p-2 shadow-pop">
        <div className="rounded-2xl border border-line bg-page/60 p-4 sm:p-5">
          {/* stage rail */}
          <div className="mb-4 flex items-center gap-1 text-[9.5px] font-semibold tracking-[0.07em]">
            {STAGES.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "rounded-full px-1.5 py-0.5 transition-colors duration-500",
                  i === stage ? "bg-brand-50 text-ink ring-1 ring-brand-100" : i < stage ? "text-brand" : "text-ink-3/60",
                )}
              >
                {s}
              </span>
            ))}
          </div>

          <div className="rounded-xl bg-surface p-4 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-subtle text-ink-2">
                <Cherry className="size-[18px]" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold">Strawberry · STB-042</div>
                <div className="text-[11px] text-ink-3">184 punnets · Chiller C-03</div>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={acted ? "m" : scored ? "c" : spiked ? "a" : "h"}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    acted ? "bg-info-50 text-info-ink" : scored ? "bg-crit-50 text-crit-ink" : spiked ? "bg-warn-50 text-warn-ink" : "bg-good-50 text-good-ink",
                  )}
                >
                  {acted ? "Managed" : scored ? "Critical" : spiked ? "Anomaly" : "Healthy"}
                </motion.span>
              </AnimatePresence>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <Metric label="Temperature" value={spiked ? "7.2 °C" : "4.0 °C"} hot={spiked} sub={spiked ? "+3.2 °C" : "baseline"} />
              <Metric label="Shelf life" value={scored ? "17 h" : "31 h"} hot={scored} sub={scored ? "was 31 h" : "estimated"} />
              <Metric label="Bruising" value={scored ? "17%" : "2%"} hot={scored} sub="Gemini Vision" />
            </div>
            <div className="mt-3 rounded-lg bg-subtle px-2 py-1.5">
              <Sparkline data={spiked ? SPIKE : CALM} height={34} threshold={7} tone={spiked ? "crit" : "series"} />
            </div>
          </div>

          <div className="mt-3 min-h-[112px]">
            <AnimatePresence mode="wait" initial={false}>
              {step === 2 && (
                <motion.div key="agents" {...pop} className="rounded-xl bg-surface p-3.5 shadow-card">
                  <div className="flex items-center gap-2 text-[12px] font-medium">
                    <Sparkles className="size-3.5 text-info" />
                    <span className="shimmer-text">4 agents fusing sensors, vision & demand</span>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {["Quality", "Pricing", "Logistics", "Coordinator"].map((a, i) => (
                      <motion.div
                        key={a}
                        initial={{ opacity: 0.4 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.35 }}
                        className="flex items-center justify-center gap-1 rounded-md bg-info-50 py-1.5 text-[10.5px] font-medium text-info-ink"
                      >
                        <LoaderCircle className="size-3 animate-spin" />
                        {a}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="decision" {...pop} className="rounded-xl bg-brand-50 p-3.5 ring-1 ring-brand-100">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-brand">
                    AI decision <span className="text-ink">92% confidence</span>
                  </div>
                  <div className="mt-1.5 text-[13px] font-semibold">Transfer 84 → Whitefield Hub · Markdown 100 by 20%</div>
                  <div className="mt-1 text-[11px] text-ink-2">Waste 113 → 0 punnets · fallback: B2B offload at T−4 h</div>
                </motion.div>
              )}
              {step >= 4 && (
                <motion.div key="acted" {...pop} className="space-y-1.5">
                  {["Transfer TO-7781 created · ETA 18 min", "Shelf labels repriced ₹180 → ₹144", "Next order trimmed 12%"].map((t, i) => (
                    <motion.div
                      key={t}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.18 }}
                      className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-[12px] shadow-card"
                    >
                      <span className="flex size-4 items-center justify-center rounded-full bg-brand text-white">
                        <Check className="size-2.5" strokeWidth={3.5} />
                      </span>
                      {t}
                    </motion.div>
                  ))}
                </motion.div>
              )}
              {step < 2 && (
                <motion.div key="watch" {...pop} className="flex h-[112px] items-center justify-center rounded-xl border border-dashed border-line-strong text-[12px] text-ink-3">
                  {spiked ? "Rule Δ ≥ 3.0 °C met → invoking agents" : "Watching 1,284 sensors · no AI cost while healthy"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-surface px-4 py-3 shadow-card">
            <span className="text-[11px] text-ink-3">Value preserved</span>
            <span className={cn("text-[17px] font-semibold tracking-[-0.01em] transition-colors duration-500", step === 5 ? "text-good-ink" : "text-ink-3/50")}>
              {step === 5 ? "₹16,290" : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const pop = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.28, ease: [0.25, 1, 0.5, 1] as const },
};

function Metric({ label, value, sub, hot }: { label: string; value: string; sub: string; hot: boolean }) {
  return (
    <div>
      <div className="text-[10.5px] text-ink-3">{label}</div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={cn("text-[17px] font-semibold tracking-[-0.01em]", hot ? "text-crit-ink" : "text-ink")}
        >
          {value}
        </motion.div>
      </AnimatePresence>
      <div className="text-[10.5px] text-ink-3">{sub}</div>
    </div>
  );
}
