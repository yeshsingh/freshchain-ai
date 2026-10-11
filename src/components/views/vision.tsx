"use client";

import { AnimatePresence, motion } from "motion/react";
import { ScanLine } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/cn";
import type { IconKey } from "@/lib/data";
import { hashString, mulberry32 } from "@/lib/format";

const TILE: Partial<Record<IconKey, [string, string]>> = {
  strawberry: ["#f3a1a8", "#d9424f"],
  spinach: ["#b9dcb0", "#4f9a52"],
  lettuce: ["#d6ecc4", "#7fb069"],
  avocado: ["#c8d89a", "#5f7f2d"],
  bread: ["#f1d7aa", "#c58b42"],
  croissant: ["#f6dca8", "#d39a3c"],
  fish: ["#ffc8b0", "#f08a64"],
  prawn: ["#ffd1bd", "#ee8a6b"],
  meat: ["#f6c2c6", "#d77984"],
};

const COLS = 8;
const ROWS = 3;

export function VisionPanel({
  id,
  icon,
  defectPct,
  state,
  label,
  inspectedAt,
}: {
  id: string;
  icon: IconKey;
  defectPct: number;
  state: "idle" | "scanning" | "done";
  label: string;
  inspectedAt: string;
}) {
  const n = COLS * ROWS;
  const flaggedCount = Math.round((n * defectPct) / 100);
  const flagged = useMemo(() => {
    const r = mulberry32(hashString(id));
    const idx = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return new Map(idx.slice(0, flaggedCount).map((i, k) => [i, 0.62 + ((k * 37) % 30) / 100]));
  }, [id, n, flaggedCount]);
  const [light, dark] = TILE[icon] ?? ["#e5e9e7", "#b9c2bd"];

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl bg-[#0f1714] p-3">
        {/* camera chrome */}
        <div className="mb-2 flex items-center justify-between font-mono text-[10px] text-white/50">
          <span className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", state === "scanning" ? "animate-pulse bg-crit" : "bg-white/40")} />
            CAM-03 · shelf view
          </span>
          <span>{state === "scanning" ? "ANALYSING" : state === "done" ? "ANALYSED" : `LAST ${inspectedAt.toUpperCase()}`}</span>
        </div>
        <div className="relative grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
          {Array.from({ length: n }, (_, i) => {
            const f = flagged.get(i);
            const show = f !== undefined && state === "done";
            return (
              <div key={i} className="relative aspect-square">
                <div
                  className="absolute inset-0 rounded-[7px]"
                  style={{
                    background: `radial-gradient(circle at 35% 30%, ${light}, ${dark} 78%)`,
                    filter: show ? "saturate(0.7) brightness(0.92)" : undefined,
                    transition: "filter 600ms",
                  }}
                />
                {show && (
                  <div
                    className="absolute rounded-full"
                    style={{ left: "52%", top: "48%", width: "34%", height: "28%", background: "radial-gradient(closest-side, rgba(92,48,26,.75), rgba(92,48,26,0))" }}
                  />
                )}
                <AnimatePresence>
                  {show && (
                    <motion.div
                      initial={{ opacity: 0, scale: 1.25 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, delay: 0.08 * (i % 7) }}
                      className="absolute -inset-0.5 rounded-[8px] border-2 border-warn"
                    >
                      <span className="absolute -top-2 left-0.5 rounded bg-warn px-1 font-mono text-[8px] font-semibold leading-[13px] text-ink">
                        {f!.toFixed(2)}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {state === "scanning" && (
            <div className="pointer-events-none absolute inset-x-0 h-10 -translate-y-1/2 animate-scan bg-gradient-to-b from-transparent via-info/45 to-transparent">
              <div className="absolute inset-x-0 top-1/2 h-px bg-info" />
            </div>
          )}
        </div>
        {/* corner brackets */}
        {["left-1.5 top-1.5 border-l border-t", "right-1.5 top-1.5 border-r border-t", "bottom-1.5 left-1.5 border-b border-l", "bottom-1.5 right-1.5 border-b border-r"].map((c) => (
          <span key={c} className={cn("pointer-events-none absolute size-3 border-white/40", c)} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-2">
        <ScanLine className="size-3.5 text-ink-3" />
        {state === "scanning" ? (
          <span className="shimmer-text font-medium">Gemini Vision · scoring surface defects…</span>
        ) : (
          <span>
            <span className="font-medium text-ink">{label}</span> · {flaggedCount} of {n} units flagged · {defectPct}% surface defects
          </span>
        )}
      </div>
    </div>
  );
}
