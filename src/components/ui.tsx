"use client";

import Link from "next/link";
import { animate } from "motion/react";
import {
  Apple,
  Beef,
  CakeSlice,
  Cherry,
  CircleCheck,
  Croissant,
  Fish,
  Leaf,
  Milk,
  Pill,
  Salad,
  Shrimp,
  TriangleAlert,
  CircleAlert,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { IconKey, Status } from "@/lib/data";
import type { Tone } from "@/lib/sim";

/* ------------------------------------------------------------------ */

export function Card({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cn("rounded-2xl bg-surface shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHead({
  title,
  subtitle,
  icon: Icon,
  right,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[13px] font-medium text-ink">
          {Icon && <Icon className="size-4 text-ink-3" strokeWidth={1.75} />}
          {title}
        </div>
        {subtitle && <div className="mt-0.5 text-xs text-ink-3">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3", className)}>{children}</div>
  );
}

export function PageTitle({ title, subtitle, right }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-2">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";
const buttonBase =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-[background-color,box-shadow,transform,color] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.15)] hover:bg-brand-600",
  dark: "bg-ink text-white hover:bg-ink/85",
  secondary: "bg-surface text-ink shadow-card hover:bg-subtle",
  ghost: "text-ink-2 hover:bg-subtle hover:text-ink",
};
const buttonSizes = { sm: "h-8 px-3 text-[13px]", md: "h-9 px-4 text-sm", lg: "h-11 px-5 text-[15px]" };

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...rest
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: keyof typeof buttonSizes }) {
  return <button className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)} {...rest} />;
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  ...rest
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: keyof typeof buttonSizes }) {
  return <Link className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)} {...rest} />;
}

/* ------------------------------------------------------------------ */

const STATUS: Record<Status, { label: string; dot: string; text: string; bg: string; icon: LucideIcon }> = {
  healthy: { label: "Healthy", dot: "bg-good", text: "text-good-ink", bg: "bg-good-50", icon: CircleCheck },
  risk: { label: "At risk", dot: "bg-warn", text: "text-warn-ink", bg: "bg-warn-50", icon: CircleAlert },
  critical: { label: "Critical", dot: "bg-crit", text: "text-crit-ink", bg: "bg-crit-50", icon: TriangleAlert },
  managed: { label: "Managed", dot: "bg-info", text: "text-info-ink", bg: "bg-info-50", icon: CircleCheck },
};

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  const m = STATUS[status];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium transition-colors duration-500",
        m.bg,
        m.text,
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2} />
      {m.label}
    </span>
  );
}

const TONE: Record<Tone, { dot: string; text: string; bg: string }> = {
  neutral: { dot: "bg-ink-3", text: "text-ink-2", bg: "bg-subtle" },
  info: { dot: "bg-info", text: "text-info-ink", bg: "bg-info-50" },
  good: { dot: "bg-good", text: "text-good-ink", bg: "bg-good-50" },
  warning: { dot: "bg-warn", text: "text-warn-ink", bg: "bg-warn-50" },
  critical: { dot: "bg-crit", text: "text-crit-ink", bg: "bg-crit-50" },
};
export const toneMeta = (t: Tone) => TONE[t];

export function Chip({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  const m = TONE[tone];
  return (
    <span className={cn("inline-flex h-5 items-center rounded-md px-1.5 text-[11px] font-medium", m.bg, m.text, className)}>
      {children}
    </span>
  );
}

export function LiveDot({ tone = "good", pulse = true, className }: { tone?: Tone; pulse?: boolean; className?: string }) {
  const m = TONE[tone];
  return (
    <span className={cn("relative inline-flex size-2", className)}>
      {pulse && <span className={cn("absolute inset-0 rounded-full opacity-60 animate-ping", m.dot)} />}
      <span className={cn("relative inline-flex size-2 rounded-full", m.dot)} />
    </span>
  );
}

/* ------------------------------------------------------------------ */

/** Risk meter: fill carries severity; track is a light step of the same family. */
export function RiskMeter({ value, className }: { value: number; className?: string }) {
  const s = value >= 80 ? "critical" : value >= 50 ? "risk" : "healthy";
  const fill = s === "critical" ? "bg-crit" : s === "risk" ? "bg-warn" : "bg-good";
  const track = s === "critical" ? "bg-crit-50" : s === "risk" ? "bg-warn-50" : "bg-good-50";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full transition-colors duration-500", track, className)}>
      <div
        className={cn("h-full rounded-full transition-[width,background-color] duration-700 ease-out", fill)}
        style={{ width: `${Math.max(4, value)}%` }}
      />
    </div>
  );
}

export function ConfidenceRing({ value, size = 64 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-brand-100)" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        style={{ transition: "stroke-dashoffset 1.2s var(--ease-out-quart)" }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

export function AnimatedNumber({
  value,
  format = (n: number) => Math.round(n).toLocaleString("en-IN"),
  duration = 1.1,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const fmtRef = useRef(format);
  fmtRef.current = format;

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    const controls = animate(from, value, {
      duration,
      ease: [0.25, 1, 0.5, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = fmtRef.current(v);
      },
    });
    return () => controls.stop();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}

/* ------------------------------------------------------------------ */

const ICONS: Record<IconKey, LucideIcon> = {
  strawberry: Cherry,
  bread: Wheat,
  milk: Milk,
  lettuce: Salad,
  fish: Fish,
  paneer: CakeSlice,
  meat: Beef,
  pharma: Pill,
  spinach: Leaf,
  croissant: Croissant,
  yogurt: Milk,
  avocado: Apple,
  prawn: Shrimp,
};

export function BatchIcon({ icon, className }: { icon: IconKey; className?: string }) {
  const Icon = ICONS[icon];
  return (
    <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-subtle text-ink-2", className)}>
      <Icon className="size-[18px]" strokeWidth={1.75} />
    </span>
  );
}
