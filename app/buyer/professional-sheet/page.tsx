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

export default function BuyerProfessionalSheetPage() {
  const searchParams = useSearchParams();

  const annualIncome = parseNumber(searchParams.get('annualIncome'), 90000);
  const monthlyDebts = parseNumber(searchParams.get('monthlyDebts'), 500);
  const downPayment = parseNumber(searchParams.get('downPayment'), 40000);
  const interestRate = parseNumber(searchParams.get('interestRate'), 5);
  const termYears = parseNumber(searchParams.get('termYears'), 30);
  const propertyTax = parseNumber(searchParams.get('propertyTax'), 4200);
  const insurance = parseNumber(searchParams.get('insurance'), 1200);

  const maxHomePrice = parseNumber(searchParams.get('maxHomePrice'), 0);
  const estimatedMortgagePayment = parseNumber(searchParams.get('estimatedMortgagePayment'), 0);
  const availableForMortgage = parseNumber(searchParams.get('availableForMortgage'), 0);
  const debtToIncomeCap = parseNumber(searchParams.get('debtToIncomeCap'), 43);

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
            href="/buyer"
            className="inline-flex items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
          >
            Back to Buyer Calculator
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
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">Buyer Affordability</h1>
              </div>
              <p className="text-sm text-slate-600">Date: {today}</p>
            </div>
          </header>

          <section className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-300 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Inputs</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Annual Income</dt><dd className="font-medium text-slate-900">{formatMoney(annualIncome)}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Monthly Debts</dt><dd className="font-medium text-slate-900">{formatMoney(monthlyDebts)}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Down Payment</dt><dd className="font-medium text-slate-900">{formatMoney(downPayment)}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Interest Rate %</dt><dd className="font-medium text-slate-900">{formatPercent(interestRate)}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Loan Term (years)</dt><dd className="font-medium text-slate-900">{termYears}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Property Tax / year</dt><dd className="font-medium text-slate-900">{formatMoney(propertyTax)}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Insurance / year</dt><dd className="font-medium text-slate-900">{formatMoney(insurance)}</dd></div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-300 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Results</h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm text-slate-600">Max Home Price</dt>
                  <dd className="mt-1 text-4xl font-bold text-slate-900">{formatMoney(maxHomePrice)}</dd>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <dt className="text-sm text-slate-600">Estimated Monthly Payment</dt>
                  <dd className="mt-1 text-3xl font-semibold text-slate-900">{formatMoney(estimatedMortgagePayment)}</dd>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <dt className="text-sm text-slate-600">Available Mortgage Payment</dt>
                  <dd className="mt-1 text-3xl font-semibold text-slate-900">{formatMoney(availableForMortgage)}</dd>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <dt className="text-sm text-slate-600">Debt-to-Income Cap</dt>
                  <dd className="mt-1 text-3xl font-semibold text-slate-900">{formatPercent(debtToIncomeCap)}</dd>
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
