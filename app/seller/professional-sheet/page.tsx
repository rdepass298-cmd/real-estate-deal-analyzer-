import Link from 'next/link';
import { redirect } from 'next/navigation';
import PrintButton from '@/app/components/PrintButton';
import { getPaidStatusFromServerCookies } from '@/lib/server/authz';

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

const getParam = (searchParams: Record<string, string | string[] | undefined>, key: string) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

const parseNumber = (
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
  fallback = 0
) => {
  const parsed = Number(getParam(searchParams, key));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

export default async function SellerProfessionalSheetPage({ searchParams }: PageProps) {
  const paidStatus = await getPaidStatusFromServerCookies();

  if (!paidStatus.isAuthenticated) {
    redirect('/auth/login');
  }

  if (!paidStatus.isPaid) {
    redirect('/upgrade');
  }

  const salePrice = parseNumber(searchParams, 'salePrice', 400000);
  const mortgagePayoff = parseNumber(searchParams, 'mortgagePayoff', 180000);
  const commissionPercent = parseNumber(searchParams, 'commissionPercent', 6);
  const closingCosts = parseNumber(searchParams, 'closingCosts', 10000);
  const sellerConcessions = parseNumber(searchParams, 'sellerConcessions', 5000);

  const commissionAmount = (commissionPercent / 100) * salePrice;
  const netProceeds = salePrice - mortgagePayoff - commissionAmount - closingCosts - sellerConcessions;

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 sm:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/seller"
            className="inline-flex items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
          >
            Back to Seller Calculator
          </Link>
          <PrintButton />
        </div>

        <article className="print-sheet rounded-3xl border border-slate-800 bg-white p-8 text-slate-900 shadow-2xl shadow-slate-950/20 sm:p-12">
          <header className="border-b border-slate-300 pb-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-600">Real Estate Analyzer</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">Seller Net Sheet</h1>
              </div>
              <p className="text-sm text-slate-600">Date: {today}</p>
            </div>
          </header>

          <section className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-300 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Inputs</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-600">Sale Price</dt>
                  <dd className="font-medium text-slate-900">{formatMoney(salePrice)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-600">Mortgage Payoff</dt>
                  <dd className="font-medium text-slate-900">{formatMoney(mortgagePayoff)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-600">Agent Commission %</dt>
                  <dd className="font-medium text-slate-900">{formatPercent(commissionPercent)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-600">Closing Costs</dt>
                  <dd className="font-medium text-slate-900">{formatMoney(closingCosts)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-600">Seller Concessions</dt>
                  <dd className="font-medium text-slate-900">{formatMoney(sellerConcessions)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-300 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Results</h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm text-slate-600">Agent Commission</dt>
                  <dd className="mt-1 text-3xl font-semibold text-slate-900">{formatMoney(commissionAmount)}</dd>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <dt className="text-sm text-slate-600">Net Proceeds to Seller</dt>
                  <dd className="mt-1 text-4xl font-bold text-slate-900">{formatMoney(netProceeds)}</dd>
                </div>
              </dl>
            </div>
          </section>

          <footer className="mt-10 border-t border-slate-300 pt-4 text-sm text-slate-600">
            Prepared by Real Estate Analyzer
          </footer>
        </article>
      </div>
    </main>
  );
}
