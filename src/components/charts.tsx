"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

function useWidth<T extends HTMLElement>(initial = 560, min = 200) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(min, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const lin = (d0: number, d1: number, r0: number, r1: number) => (v: number) =>
  r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);

const linePath = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");

function Tooltip({ x, y, children, width }: { x: number; y: number; children: ReactNode; width: number }) {
  const flip = x > width - 150;
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-lg bg-ink px-2.5 py-1.5 text-[11px] leading-tight text-white shadow-pop"
      style={{ left: x, top: y, transform: `translate(${flip ? "calc(-100% - 10px)" : "10px"}, -50%)` }}
    >
      {children}
    </div>
  );
}

const AXIS_TEXT = { fontSize: 10, fill: "var(--color-ink-3)" } as const;

/* ------------------------------------------------------------------ */
/* Live temperature                                                    */
/* ------------------------------------------------------------------ */

export function TempChart({
  data,
  safe,
  threshold,
  height = 196,
  minutesPerPoint = 1,
  label = "Temperature",
}: {
  data: number[];
  safe: [number, number];
  threshold: number;
  height?: number;
  minutesPerPoint?: number;
  label?: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const m = { l: 30, r: 58, t: 14, b: 22 };
  const iw = width - m.l - m.r;
  const ih = height - m.t - m.b;

  const lo = Math.floor(Math.min(...data, safe[0]) - 1);
  const hi = Math.ceil(Math.max(Math.max(...data) + 1, threshold + 2));
  const x = lin(0, data.length - 1, m.l, m.l + iw);
  const y = lin(lo, hi, m.t + ih, m.t);
  const pts = data.map((v, i) => [x(i), y(v)] as [number, number]);
  const d = linePath(pts);
  const last = data[data.length - 1];
  const over = last >= threshold;
  const step = hi - lo > 12 ? 5 : 2;
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) ticks.push(v);
  const span = data.length * minutesPerPoint;

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={`${label}: now ${last.toFixed(1)} °C, alert threshold ${threshold} °C`}>
        {/* safe band */}
        <rect x={m.l} y={y(safe[1])} width={iw} height={y(safe[0]) - y(safe[1])} fill="var(--color-brand-50)" />
        <text x={m.l + 6} y={y(safe[1]) + 12} {...AXIS_TEXT} fill="var(--color-brand)">
          Safe {safe[0]}–{safe[1]} °C
        </text>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={m.l + iw} y1={y(t)} y2={y(t)} stroke="var(--color-grid)" />
            <text x={m.l - 8} y={y(t) + 3} textAnchor="end" {...AXIS_TEXT} className="tabular">
              {t}°
            </text>
          </g>
        ))}
        {/* alert threshold */}
        <line x1={m.l} x2={m.l + iw} y1={y(threshold)} y2={y(threshold)} stroke="var(--color-crit)" strokeDasharray="4 3" opacity={0.7} />
        <text x={m.l + 6} y={y(threshold) - 5} {...AXIS_TEXT}>
          Alert rule {threshold.toFixed(1)} °C
        </text>

        <motion.path
          initial={false}
          animate={{ d }}
          transition={{ duration: 0.85, ease: "easeOut" }}
          fill="none"
          stroke="var(--color-series)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <motion.circle
          initial={false}
          animate={{ cx: x(data.length - 1), cy: y(last) }}
          transition={{ duration: 0.85, ease: "easeOut" }}
          r={4.5}
          fill={over ? "var(--color-crit)" : "var(--color-series)"}
          stroke="white"
          strokeWidth={2}
        />
        <motion.text
          initial={false}
          animate={{ y: y(last) + 4 }}
          transition={{ duration: 0.85, ease: "easeOut" }}
          x={x(data.length - 1) + 10}
          fontSize={12}
          fontWeight={600}
          fill="var(--color-ink)"
          className="tabular"
        >
          {last.toFixed(1)} °C
        </motion.text>

        {/* x axis */}
        <text x={m.l} y={height - 6} {...AXIS_TEXT}>
          {span} min ago
        </text>
        <text x={m.l + iw / 2} y={height - 6} textAnchor="middle" {...AXIS_TEXT}>
          {Math.round(span / 2)} min
        </text>
        <text x={m.l + iw} y={height - 6} textAnchor="end" {...AXIS_TEXT}>
          Now
        </text>

        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ih} stroke="var(--color-axis)" />
            <circle cx={x(hover)} cy={y(data[hover])} r={4} fill="var(--color-series)" stroke="white" strokeWidth={2} />
          </g>
        )}
        <rect
          x={m.l}
          y={m.t}
          width={iw}
          height={ih}
          fill="transparent"
          onPointerMove={(e) => {
            const r = (e.currentTarget as SVGRectElement).getBoundingClientRect();
            const i = Math.round(((e.clientX - r.left) / r.width) * (data.length - 1));
            setHover(Math.max(0, Math.min(data.length - 1, i)));
          }}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      {hover !== null && (
        <Tooltip x={x(hover)} y={y(data[hover])} width={width}>
          <div className="text-[13px] font-semibold tabular">{data[hover].toFixed(2)} °C</div>
          <div className="text-white/60">
            {hover === data.length - 1 ? "Now" : `${(data.length - 1 - hover) * minutesPerPoint} min ago`}
          </div>
        </Tooltip>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shelf-life: printed-date model vs FreshChain estimate               */
/* ------------------------------------------------------------------ */

const freshness = (t: number, T: number) => (t >= T ? 0 : 100 * (1 - Math.pow(t / T, 1.7)));

export function ShelfLifeChart({
  estimate,
  printed,
  previous,
  height = 224,
}: {
  estimate: number;
  printed: number;
  previous?: number;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const m = { l: 34, r: 18, t: 16, b: 46 };
  const iw = width - m.l - m.r;
  const ih = height - m.t - m.b;
  const xMax = Math.ceil((printed * 1.08) / 6) * 6;
  const x = lin(0, xMax, m.l, m.l + iw);
  const y = lin(0, 100, m.t + ih, m.t);
  const N = 48;
  const curve = (T: number) => linePath(Array.from({ length: N + 1 }, (_, i) => [x((i / N) * xMax), y(freshness((i / N) * xMax, T))] as [number, number]));
  const est = useMemo(() => curve(estimate), [estimate, width]); // eslint-disable-line react-hooks/exhaustive-deps
  const prt = useMemo(() => curve(printed), [printed, width]); // eslint-disable-line react-hooks/exhaustive-deps
  const xt: number[] = [];
  const xs = xMax > 60 ? 24 : 6;
  for (let v = 0; v <= xMax; v += xs) xt.push(v);
  const gap = printed - estimate;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-series" /> FreshChain estimate
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-muted-series" /> Printed-date model (static FEFO)
        </span>
      </div>
      <div ref={ref} className="relative w-full select-none" style={{ height }}>
        <svg width={width} height={height} role="img" aria-label={`Estimated shelf life ${estimate} hours versus printed ${printed} hours`}>
          {[0, 50, 100].map((v) => (
            <g key={v}>
              <line x1={m.l} x2={m.l + iw} y1={y(v)} y2={y(v)} stroke="var(--color-grid)" />
              <text x={m.l - 8} y={y(v) + 3} textAnchor="end" {...AXIS_TEXT} className="tabular">
                {v}%
              </text>
            </g>
          ))}
          <line x1={m.l} x2={m.l + iw} y1={m.t + ih} y2={m.t + ih} stroke="var(--color-axis)" />
          {xt.map((v) => (
            <text key={v} x={x(v)} y={m.t + ih + 14} textAnchor="middle" {...AXIS_TEXT} className="tabular">
              {v === 0 ? "Now" : `+${v}h`}
            </text>
          ))}

          {/* the gap the printed date doesn't know about */}
          {gap > 0.5 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}>
              <rect x={x(estimate)} y={m.t} width={x(printed) - x(estimate)} height={ih} fill="var(--color-crit)" opacity={0.045} />
              <line x1={x(estimate)} x2={x(printed)} y1={m.t + ih + 24} y2={m.t + ih + 24} stroke="var(--color-crit)" opacity={0.5} />
              <line x1={x(estimate)} x2={x(estimate)} y1={m.t + ih + 21} y2={m.t + ih + 27} stroke="var(--color-crit)" opacity={0.5} />
              <line x1={x(printed)} x2={x(printed)} y1={m.t + ih + 21} y2={m.t + ih + 27} stroke="var(--color-crit)" opacity={0.5} />
              <text x={(x(estimate) + x(printed)) / 2} y={m.t + ih + 39} textAnchor="middle" fontSize={10} fill="var(--color-crit-ink)">
                {Math.round(gap)} h the label doesn&apos;t know about
              </text>
            </motion.g>
          )}

          <path d={prt} fill="none" stroke="var(--color-muted-series)" strokeWidth={2} strokeLinecap="round" />
          <motion.path initial={false} animate={{ d: est }} transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }} fill="none" stroke="var(--color-series)" strokeWidth={2} strokeLinecap="round" />

          {previous && previous !== estimate && (
            <g>
              <circle cx={x(previous)} cy={y(0)} r={4} fill="white" stroke="var(--color-series)" strokeWidth={1.5} opacity={0.6} />
              <text x={x(previous) + 8} y={y(0) - 6} {...AXIS_TEXT}>
                was {previous} h
              </text>
            </g>
          )}
          <circle cx={x(printed)} cy={y(0)} r={4} fill="var(--color-muted-series)" stroke="white" strokeWidth={2} />
          <text x={x(printed) + 8} y={y(0) - 6} {...AXIS_TEXT}>
            {printed} h
          </text>
          <motion.circle initial={false} animate={{ cx: x(estimate) }} transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }} cy={y(0)} r={4.5} fill="var(--color-series)" stroke="white" strokeWidth={2} />
          <motion.text initial={false} animate={{ x: x(estimate) + 8 }} transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }} y={y(0) - 6} fontSize={12} fontWeight={600} fill="var(--color-ink)">
            {estimate} h
          </motion.text>

          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ih} stroke="var(--color-axis)" />}
          <rect
            x={m.l}
            y={m.t}
            width={iw}
            height={ih}
            fill="transparent"
            onPointerMove={(e) => {
              const r = (e.currentTarget as SVGRectElement).getBoundingClientRect();
              setHover(Math.max(0, Math.min(xMax, Math.round(((e.clientX - r.left) / r.width) * xMax))));
            }}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
        {hover !== null && (
          <Tooltip x={x(hover)} y={m.t + ih / 2} width={width}>
            <div className="mb-1 text-white/60">{hover === 0 ? "Now" : `+${hover} h`}</div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full bg-series-soft" />
              <span className="font-semibold tabular">{Math.round(freshness(hover, estimate))}%</span>
              <span className="text-white/60">estimate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full bg-white/50" />
              <span className="font-semibold tabular">{Math.round(freshness(hover, printed))}%</span>
              <span className="text-white/60">printed</span>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Demand: hourly sales vs rate needed to clear before expiry          */
/* ------------------------------------------------------------------ */

export function DemandChart({ history, needed, height = 210 }: { history: number[]; needed: number; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const m = { l: 28, r: 16, t: 26, b: 22 };
  const iw = width - m.l - m.r;
  const ih = height - m.t - m.b;
  const max = Math.max(needed, ...history) * 1.12;
  const y = lin(0, max, m.t + ih, m.t);
  const band = iw / history.length;
  const bw = Math.min(24, band - 2);
  const step = max > 8 ? 4 : max > 4 ? 2 : 1;
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  const last = history[history.length - 1];

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={`Selling ${last} per hour, ${needed} per hour needed to clear before expiry`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={m.l + iw} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--color-axis)" : "var(--color-grid)"} />
            <text x={m.l - 8} y={y(t) + 3} textAnchor="end" {...AXIS_TEXT} className="tabular">
              {t}
            </text>
          </g>
        ))}
        {history.map((v, i) => {
          const cx = m.l + band * i + band / 2;
          const h = m.t + ih - y(v);
          const r = Math.min(4, h);
          const x0 = cx - bw / 2;
          const top = y(v);
          return (
            <g key={i} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
              <rect x={m.l + band * i} y={m.t} width={band} height={ih} fill="transparent" />
              <path
                d={`M${x0},${m.t + ih}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + bw - r}Q${x0 + bw},${top} ${x0 + bw},${top + r}V${m.t + ih}Z`}
                fill="var(--color-series)"
                opacity={hover === null || hover === i ? 1 : 0.55}
                style={{ transition: "opacity 150ms" }}
              />
            </g>
          );
        })}
        <text x={m.l + band * (history.length - 0.5)} y={y(last) - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--color-ink)" className="tabular">
          {last}
        </text>
        <motion.g initial={false} animate={{ y: y(needed) }} transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}>
          <line x1={m.l} x2={m.l + iw} y1={0} y2={0} stroke="var(--color-crit)" strokeDasharray="4 3" opacity={0.75} />
          <text x={m.l + iw} y={-6} textAnchor="end" fontSize={10} fill="var(--color-crit-ink)" className="tabular">
            Needed to clear: {needed}/h
          </text>
        </motion.g>
        <text x={m.l} y={height - 6} {...AXIS_TEXT}>
          −{history.length}h
        </text>
        <text x={m.l + iw} y={height - 6} textAnchor="end" {...AXIS_TEXT}>
          This hour
        </text>
      </svg>
      {hover !== null && (
        <Tooltip x={m.l + band * hover + band / 2} y={y(history[hover])} width={width}>
          <div className="text-[13px] font-semibold tabular">{history[hover]} units/h</div>
          <div className="text-white/60">{hover === history.length - 1 ? "This hour" : `${history.length - 1 - hover} h ago`}</div>
        </Tooltip>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Week of food saved (kg) — today emphasised                         */
/* ------------------------------------------------------------------ */

export function WeekChart({ data, height = 168 }: { data: { day: string; kg: number; today?: boolean }[]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>(320);
  const [hover, setHover] = useState<number | null>(null);
  const m = { l: 4, r: 4, t: 22, b: 22 };
  const iw = width - m.l - m.r;
  const ih = height - m.t - m.b;
  const max = Math.max(...data.map((d) => d.kg)) * 1.15;
  const y = lin(0, max, m.t + ih, m.t);
  const band = iw / data.length;
  const bw = Math.min(24, band - 2);

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      <svg width={width} height={height} role="img" aria-label="Food saved per day, last 7 days">
        <line x1={m.l} x2={m.l + iw} y1={m.t + ih} y2={m.t + ih} stroke="var(--color-axis)" />
        {data.map((d, i) => {
          const cx = m.l + band * i + band / 2;
          const x0 = cx - bw / 2;
          const top = y(d.kg);
          const r = Math.min(4, m.t + ih - top);
          const path = `M${x0},${m.t + ih}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + bw - r}Q${x0 + bw},${top} ${x0 + bw},${top + r}V${m.t + ih}Z`;
          return (
            <g key={d.day} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
              <rect x={m.l + band * i} y={m.t} width={band} height={ih} fill="transparent" />
              <motion.path initial={false} animate={{ d: path }} transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }} fill={d.today ? "var(--color-series)" : "var(--color-series-soft)"} />
              <text x={cx} y={height - 6} textAnchor="middle" {...AXIS_TEXT} fontWeight={d.today ? 600 : 400} fill={d.today ? "var(--color-ink)" : "var(--color-ink-3)"}>
                {d.day}
              </text>
              {d.today && (
                <motion.text initial={false} animate={{ y: top - 6 }} transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }} x={cx} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--color-ink)" className="tabular">
                  {Math.round(d.kg)} kg
                </motion.text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <Tooltip x={m.l + band * hover + band / 2} y={y(data[hover].kg)} width={width}>
          <div className="text-[13px] font-semibold tabular">{Math.round(data[hover].kg)} kg saved</div>
          <div className="text-white/60">{data[hover].today ? "Today" : data[hover].day}</div>
        </Tooltip>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Sparkline({
  data,
  className,
  height = 32,
  threshold,
  tone = "series",
}: {
  data: number[];
  className?: string;
  height?: number;
  threshold?: number;
  tone?: "series" | "crit";
}) {
  const [ref, width] = useWidth<HTMLDivElement>(120, 40);
  const lo = Math.min(...data, threshold ?? Infinity) - 0.3;
  const hi = Math.max(...data, threshold ?? -Infinity) + 0.3;
  const x = lin(0, data.length - 1, 2, width - 6);
  const y = lin(lo, hi, height - 3, 3);
  const d = linePath(data.map((v, i) => [x(i), y(v)]));
  const color = tone === "crit" ? "var(--color-crit)" : "var(--color-series)";
  return (
    <div ref={ref} className={cn("w-full", className)} style={{ height }}>
      <svg width={width} height={height} aria-hidden>
        {threshold !== undefined && <line x1={0} x2={width} y1={y(threshold)} y2={y(threshold)} stroke="var(--color-crit)" strokeDasharray="3 3" opacity={0.4} />}
        <motion.path initial={false} animate={{ d }} transition={{ duration: 0.85, ease: "easeOut" }} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
        <motion.circle initial={false} animate={{ cx: x(data.length - 1), cy: y(data[data.length - 1]) }} transition={{ duration: 0.85, ease: "easeOut" }} r={3} fill={color} stroke="white" strokeWidth={1.5} />
      </svg>
    </div>
  );
}
