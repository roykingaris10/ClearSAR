import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-center">
      <div className="stat-label">404</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        SAR not found
      </h1>
      <p className="mt-3 max-w-sm text-sm text-white/60">
        This record does not exist or belongs to another account.
      </p>
      <Link href="/queue" className="pill pill-primary mt-6 text-sm">
        Back to queue
      </Link>
    </main>
  );
}
