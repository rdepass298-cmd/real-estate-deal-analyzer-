import Link from 'next/link';

export default function UpgradeSuccessPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 sm:px-10">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl shadow-slate-950/20 sm:p-10">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Subscription</p>
        <h1 className="mt-3 text-4xl font-semibold">Thank You for Upgrading</h1>
        <p className="mt-4 text-slate-300">
          Your checkout was successful. You can return to the calculators and continue analyzing your deals.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600"
          >
            Back to Calculators
          </Link>
        </div>
      </div>
    </main>
  );
}
