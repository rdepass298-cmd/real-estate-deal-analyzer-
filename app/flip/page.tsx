'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import SaveDealPanel from '@/app/components/SaveDealPanel';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

export default function FixAndFlipPage() {
  const [purchasePrice, setPurchasePrice] = useState(200000);
  const [rehabBudget, setRehabBudget] = useState(50000);
  const [holdingCosts, setHoldingCosts] = useState(12000);
  const [sellingCostPercent, setSellingCostPercent] = useState(8);
  const [arv, setArv] = useState(325000);

  const sellingCosts = useMemo(() => (sellingCostPercent / 100) * arv, [sellingCostPercent, arv]);
  const totalInvestment = purchasePrice + rehabBudget + holdingCosts + sellingCosts;
  const netProfit = arv - purchasePrice - rehabBudget - holdingCosts - sellingCosts;
  const roi = totalInvestment ? (netProfit / totalInvestment) * 100 : 0;
  const meetsRule = purchasePrice + rehabBudget <= arv * 0.7;
  const saveInputs = {
    purchasePrice,
    rehabBudget,
    holdingCosts,
    sellingCostPercent,
    arv,
  };
  const saveResults = {
    totalInvestment,
    netProfit,
    roi,
    meetsRule,
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Calculator</p>
            <h1 className="mt-3 text-4xl font-semibold">Fix and Flip</h1>
          </div>
          <Link href="/" className="inline-flex items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20">
            Back to home
          </Link>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Purchase Price', value: purchasePrice, setter: setPurchasePrice },
                { label: 'Rehab Budget', value: rehabBudget, setter: setRehabBudget },
                { label: 'Holding Costs', value: holdingCosts, setter: setHoldingCosts },
                { label: 'Selling Cost %', value: sellingCostPercent, setter: setSellingCostPercent },
                { label: 'After Repair Value (ARV)', value: arv, setter: setArv },
              ].map((field) => (
                <label key={field.label} className="space-y-2 text-sm text-slate-300">
                  <span className="font-medium text-slate-100">{field.label}</span>
                  <input
                    type="number"
                    value={field.value}
                    onChange={(event) => field.setter(Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold text-white">Results</h2>
            <div className="grid gap-4">
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Total investment</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(totalInvestment)}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Net profit</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(netProfit)}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">ROI</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatPercent(roi)}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">70% rule check</p>
                <p className="mt-2 text-3xl font-semibold text-white">{meetsRule ? 'Pass' : 'Fail'}</p>
              </div>
            </div>
            <SaveDealPanel dealType="fix_and_flip" inputs={saveInputs} results={saveResults} />
          </section>
        </div>
      </div>
    </main>
  );
}
