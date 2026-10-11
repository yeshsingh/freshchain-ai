import Link from "next/link";
import { ArrowRight, Brain, Eye, Gauge, Leaf, Play, Radio, Repeat2, Tag } from "lucide-react";
import { HeroPreview, Reveal } from "@/components/landing";
import { Logo } from "@/components/shell";
import { ButtonLink } from "@/components/ui";

const LOOP = [
  { k: "SEE", icon: Radio, title: "Live conditions", body: "IoT temperature, humidity and ethylene streams plus camera feeds — monitored around the clock." },
  { k: "UNDERSTAND", icon: Eye, title: "True shelf life", body: "Gemini Vision scores bruising and decay; a shelf-life model fuses it with sensor stress." },
  { k: "DECIDE", icon: Brain, title: "Evidence, not guesses", body: "Quality, pricing and logistics agents propose; a coordinator weighs every option." },
  { k: "ACT", icon: Tag, title: "Closed-loop actions", body: "Reprices e-paper labels, books transfers to busy hubs, lists surplus to B2B buyers." },
  { k: "MEASURE", icon: Leaf, title: "Proven impact", body: "Every action is logged as rupees preserved, kilograms saved and CO₂e avoided." },
];

const SILOS = [
  { gap: "The IoT temperature monitor doesn't talk to the pricing engine.", fix: "A +3 °C spike directly reprices the shelf label in seconds." },
  { gap: "Markdowns only slash prices in the same physical store.", fix: "Surplus is rerouted to the nearby hub where demand is 3× higher." },
  { gap: "Quality checks rely on staff spotting soft tomatoes.", fix: "Camera inspection flags early bruising before shoppers can see it." },
];

const AGENTS = [
  { name: "Quality agent", body: "Sensor stress + visual decay → remaining shelf hours (T-shelf)." },
  { name: "Pricing agent", body: "Footfall, sales velocity and hours left → optimal markdown curve." },
  { name: "Logistics agent", body: "Network demand and cold capacity → transfer, offload or donate." },
  { name: "Coordinator", body: "Scores every option against doing nothing; picks one plan with a fallback." },
];

const METRICS = [
  { value: "30–40%", label: "less perishable shrink per store" },
  { value: "+1.5%", label: "net margin in a 2–3% margin business" },
  { value: "2.5 kg", label: "CO₂e avoided per kg of food saved" },
  { value: "$0.002", label: "AI cost per evaluation, down from ~$0.06" },
];

export default function Landing() {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-40 border-b border-transparent bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-ink-2 md:flex">
            <a href="#loop" className="hover:text-ink">
              How it works
            </a>
            <a href="#agents" className="hover:text-ink">
              Agents
            </a>
            <a href="#impact" className="hover:text-ink">
              Impact
            </a>
          </nav>
          <div className="flex-1" />
          <ButtonLink href="/tower" variant="dark" size="sm">
            Open dashboard <ArrowRight className="size-3.5" />
          </ButtonLink>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-20">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand ring-1 ring-brand-100">
              <span className="size-1.5 rounded-full bg-brand" />
              Autonomous perishable-inventory control tower
            </div>
            <h1 className="mt-6 text-[44px] font-semibold leading-[1.02] tracking-[-0.045em] text-ink sm:text-[60px] lg:text-[68px]">
              Stop food waste
              <br />
              <span className="text-ink-3">before it happens.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
              FreshChain AI fuses live sensors, camera-based decay analysis and local demand to predict true shelf life — then acts on its own:
              repricing digital shelf labels, rerouting stock to high-demand hubs and offloading surplus before it spoils.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/tower?demo=1" variant="primary" size="lg" className="pl-4">
                <span className="flex size-6 items-center justify-center rounded-full bg-white/20">
                  <Play className="size-3" fill="currentColor" />
                </span>
                Watch a live incident · 40 s
              </ButtonLink>
              <ButtonLink href="/tower" variant="secondary" size="lg">
                Explore the dashboard
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-ink-3">No sign-up · runs in your browser · all store data simulated</p>
          </Reveal>
          <Reveal delay={0.15}>
            <HeroPreview />
          </Reveal>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-line bg-page">
        <div className="mx-auto grid max-w-6xl gap-px px-5 sm:px-8 md:grid-cols-3">
          {[
            { v: "$100B+", l: "lost every year to perishable inventory shrinkage" },
            { v: "2–3%", l: "net margin in grocery — every spoiled crate hurts" },
            { v: "Too late", l: "today's systems alert when food is already rotting" },
          ].map((s, i) => (
            <Reveal key={s.v} delay={i * 0.08} className="py-10 md:px-8 md:first:pl-0">
              <div className="text-[34px] font-semibold tracking-[-0.03em]">{s.v}</div>
              <div className="mt-1 max-w-[16rem] text-sm text-ink-2">{s.l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Loop */}
      <section id="loop" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:px-8">
        <Reveal className="max-w-2xl">
          <div className="text-xs font-medium uppercase tracking-[0.1em] text-brand">How it works</div>
          <h2 className="mt-3 text-[34px] font-semibold leading-tight tracking-[-0.03em] sm:text-[40px]">One closed loop — not another dashboard.</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
            Static FEFO trusts the printed date. A pallet that sat on a warm dock for three hours doesn&apos;t care what the label says.
            FreshChain watches what actually happens to the food, and does something about it.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-3 md:grid-cols-5">
          {LOOP.map((s, i) => (
            <Reveal key={s.k} delay={i * 0.07}>
              <div className="group h-full rounded-2xl bg-page p-5 transition-colors hover:bg-brand-50/60">
                <div className="flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-surface text-brand shadow-card">
                    <s.icon className="size-4" strokeWidth={1.9} />
                  </span>
                  <span className="font-mono text-[10px] text-ink-3">0{i + 1}</span>
                </div>
                <div className="mt-5 text-[10.5px] font-semibold tracking-[0.1em] text-ink-3">{s.k}</div>
                <div className="mt-1 text-[15px] font-semibold">{s.title}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Silos */}
      <section className="bg-page">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <div className="text-xs font-medium uppercase tracking-[0.1em] text-brand">Why now</div>
            <h2 className="mt-3 text-[34px] font-semibold leading-tight tracking-[-0.03em]">Existing tools work in silos.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
              Dynamic pricing, demand forecasting and cold-chain monitoring all exist — separately. FreshChain is the layer that connects them
              and closes the loop automatically.
            </p>
          </Reveal>
          <div className="space-y-3">
            {SILOS.map((s, i) => (
              <Reveal key={s.gap} delay={i * 0.08}>
                <div className="grid gap-4 rounded-2xl bg-surface p-5 shadow-card sm:grid-cols-2 sm:items-center">
                  <p className="text-sm text-ink-3">{s.gap}</p>
                  <p className="flex items-start gap-2.5 text-sm font-medium text-ink">
                    <Repeat2 className="mt-0.5 size-4 shrink-0 text-brand" />
                    {s.fix}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="text-xs font-medium uppercase tracking-[0.1em] text-brand">Multi-agent engine</div>
            <h2 className="mt-3 text-[34px] font-semibold leading-tight tracking-[-0.03em]">Four specialists, one accountable decision.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
              Every decision ships with structured evidence — signal, evidence, impact, action — so a store manager or a judge can see exactly
              why FreshChain acted. No chatbot, no raw chain-of-thought.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Gemini Vision", "Vertex AI Agent Engine", "Cloud Pub/Sub", "BigQuery", "Cloud Run", "PostgreSQL"].map((t) => (
                <span key={t} className="rounded-full bg-page px-3 py-1 text-xs text-ink-2 ring-1 ring-line">
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2">
            {AGENTS.map((a, i) => (
              <Reveal key={a.name} delay={i * 0.07}>
                <div className="h-full rounded-2xl bg-page p-5">
                  <div className="font-mono text-[11px] text-ink-3">0{i + 1}</div>
                  <div className="mt-3 text-[15px] font-semibold">{a.name}</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{a.body}</p>
                </div>
              </Reveal>
            ))}
            <Reveal delay={0.3} className="sm:col-span-2">
              <div className="flex items-start gap-3 rounded-2xl bg-ink p-5 text-white">
                <Gauge className="mt-0.5 size-5 shrink-0 text-[#8fd3a8]" strokeWidth={1.75} />
                <div className="text-[13px] leading-relaxed text-white/80">
                  <span className="font-semibold text-white">AI only when it matters.</span> Cheap rules watch the sensors; the LLM is called only on
                  a real anomaly — with prompt caching, Flash/Pro routing, 800 px images and strict JSON outputs.
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section id="impact" className="scroll-mt-20 border-t border-line bg-page">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <Reveal className="max-w-2xl">
            <div className="text-xs font-medium uppercase tracking-[0.1em] text-brand">Target outcomes</div>
            <h2 className="mt-3 text-[34px] font-semibold leading-tight tracking-[-0.03em]">Measured in rupees, kilograms and carbon.</h2>
          </Reveal>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {METRICS.map((m, i) => (
              <Reveal key={m.value} delay={i * 0.07}>
                <div className="h-full rounded-2xl bg-surface p-6 shadow-card">
                  <div className="text-[36px] font-semibold tracking-[-0.035em]">{m.value}</div>
                  <div className="mt-1 text-sm text-ink-2">{m.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 sm:px-8">
        <Reveal>
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-ink px-8 py-14 text-white sm:px-14">
            <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-brand/40 blur-3xl" aria-hidden />
            <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.03em] sm:text-[36px]">Watch FreshChain handle a live incident.</h2>
                <p className="mt-3 max-w-lg text-[15px] text-white/65">
                  A chiller warms up. 184 strawberry punnets are at risk. Forty seconds later the loop is closed — and you&apos;ll see exactly why.
                </p>
              </div>
              <Link
                href="/tower?demo=1"
                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-medium text-ink transition-transform active:scale-[0.98]"
              >
                <Play className="size-4" fill="currentColor" />
                Start the demo
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Logo />
          <span>Hackathon prototype · all store, sensor and sales data is simulated</span>
        </div>
      </footer>
    </div>
  );
}
