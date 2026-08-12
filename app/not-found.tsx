import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--serviceops-surface)] px-6 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-[var(--serviceops-soft)] bg-white p-8 text-center shadow-sm dark:bg-[var(--bg-card)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--serviceops-primary)]">
          404
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-[var(--serviceops-depth)]">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-[var(--serviceops-depth)]/70">
          The page you’re looking for doesn’t exist or may have moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[var(--serviceops-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--serviceops-hover)]"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
