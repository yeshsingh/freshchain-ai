import { DemoDock, Header, SimulationRuntime, Toasts } from "@/components/shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto w-full max-w-[1240px] px-4 pb-36 pt-6 sm:px-6 sm:pt-8">{children}</main>
      <DemoDock />
      <Toasts />
      <SimulationRuntime />
    </div>
  );
}
