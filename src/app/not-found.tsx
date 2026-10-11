import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="font-mono text-xs text-ink-3">404</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">This shelf is empty</h1>
      <p className="mt-2 text-sm text-ink-2">The page you&apos;re looking for doesn&apos;t exist.</p>
      <ButtonLink href="/tower" variant="primary" className="mt-6">
        Back to the control tower
      </ButtonLink>
    </div>
  );
}
