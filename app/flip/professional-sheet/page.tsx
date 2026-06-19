'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

const parseNumber = (value: string | null, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatPercent = (value: number) => `${value.toFixed(2)}%`;
const formatRule = (value: number) => (value >= 0.5 ? 'Pass' : 'Fail');

export default function FlipProfessionalSheetPage() {
  const searchParams = useSearchParams();

  const purchasePrice = parseNumber(searchParams.get('purchasePrice'), 200000);
  const rehabBudget = parseNumber(searchParams.get('rehabBudget'), 50000);
  const holdingCosts = parseNumber(searchParams.get('holdingCosts'), 12000);
  const sellingCostPercent = parseNumber(searchParams.get('sellingCostPercent'), 8);
  const arv = parseNumber(searchParams.get('arv'), 325000);

  const totalInvestment = parseNumber(searchParams.get('totalInvestment'), 0);
  const netProfit = parseNumber(searchParams.get('netProfit'), 0);
  const roi = parseNumber(searchParams.get('roi'), 0);
  const meetsRule = parseNumber(searchParams.get('meetsRule'), 0);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [],
  );

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 sm:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/flip"
            className="inline-flex items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
          >
            Back to Fix & Flip Calculator
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600"
          >
            Print / Save as PDF
          </button>
        </div>

        <article className="print-sheet rounded-3xl border border-slate-800 bg-white p-8 text-slate-900 shadow-2xl shadow-slate-950/20 sm:p-12">
          <header className="border-b border-slate-300 pb-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-600">RealEstate Deal Analyzer</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">Fix & Flip Analysis</h1>
              </div>
              <p className="text-sm text-slate-600">Date: {today}</p>
            </div>
          </header>

          <section className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-300 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Inputs</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Purchase Price</dt><dd className="font-medium text-slate-900">{formatMoney(purchasePrice)}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Rehab Budget</dt><dd className="font-medium text-slate-900">{formatMoney(rehabBudget)}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Holding Costs</dt><dd className="font-medium text-slate-900">{formatMoney(holdingCosts)}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Selling Cost %</dt><dd className="font-medium text-slate-900">{formatPercent(sellingCostPercent)}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">After Repair Value (ARV)</dt><dd className="font-medium text-slate-900">{formatMoney(arv)}</dd></div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-300 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Results</h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm text-slate-600">Total Investment</dt>
                  <dd className="mt-1 text-3xl font-semibold text-slate-900">{formatMoney(totalInvestment)}</dd>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <dt className="text-sm text-slate-600">Net Profit</dt>
                  <dd className="mt-1 text-4xl font-bold text-slate-900">{formatMoney(netProfit)}</dd>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <dt className="text-sm text-slate-600">ROI</dt>
                  <dd className="mt-1 text-3xl font-semibold text-slate-900">{formatPercent(roi)}</dd>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <dt className="text-sm text-slate-600">70% Rule Check</dt>
                  <dd className="mt-1 text-3xl font-semibold text-slate-900">{formatRule(meetsRule)}</dd>
                </div>
              </dl>
            </div>
          </section>

          <footer className="mt-10 border-t border-slate-300 pt-4 text-sm text-slate-600">
            Prepared by RealEstate Deal Analyzer
          </footer>
        </article>
      </div>
    </main>
  );
}
