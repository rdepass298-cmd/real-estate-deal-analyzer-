'use client';

import { useMemo, useState } from 'react';
import BackToCalculatorsButton from '@/app/components/BackToCalculatorsButton';
import ProActionButton from '@/app/components/ProActionButton';
import SaveDealPanel from '@/app/components/SaveDealPanel';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);

export default function SellerNetSheetPage() {
  const [salePriceInput, setSalePrice] = useState('400000');
  const [mortgagePayoffInput, setMortgagePayoff] = useState('180000');
  const [commissionPercentInput, setCommissionPercent] = useState('6');
  const [closingCostsInput, setClosingCosts] = useState('10000');
  const [sellerConcessionsInput, setSellerConcessions] = useState('5000');

  const salePrice = parseFloat(salePriceInput) || 0;
  const mortgagePayoff = parseFloat(mortgagePayoffInput) || 0;
  const commissionPercent = parseFloat(commissionPercentInput) || 0;
  const closingCosts = parseFloat(closingCostsInput) || 0;
  const sellerConcessions = parseFloat(sellerConcessionsInput) || 0;

  const commissionAmount = useMemo(() => (commissionPercent / 100) * salePrice, [commissionPercent, salePrice]);
  const netProceeds = salePrice - mortgagePayoff - commissionAmount - closingCosts - sellerConcessions;
  const saveInputs = {
    salePrice: salePriceInput,
    mortgagePayoff: mortgagePayoffInput,
    commissionPercent: commissionPercentInput,
    closingCosts: closingCostsInput,
    sellerConcessions: sellerConcessionsInput,
  };
  const saveResults = {
    commissionAmount,
    netProceeds,
  };
  const professionalSheetHref = `/seller/professional-sheet?salePrice=${encodeURIComponent(salePriceInput)}&mortgagePayoff=${encodeURIComponent(mortgagePayoffInput)}&commissionPercent=${encodeURIComponent(commissionPercentInput)}&closingCosts=${encodeURIComponent(closingCostsInput)}&sellerConcessions=${encodeURIComponent(sellerConcessionsInput)}`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Calculator</p>
            <h1 className="mt-3 text-4xl font-semibold">Seller Net Sheet</h1>
          </div>
          <BackToCalculatorsButton />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Sale Price', value: salePriceInput, setter: setSalePrice },
                { label: 'Mortgage Payoff', value: mortgagePayoffInput, setter: setMortgagePayoff },
                { label: 'Agent Commission %', value: commissionPercentInput, setter: setCommissionPercent },
                { label: 'Closing Costs', value: closingCostsInput, setter: setClosingCosts },
                { label: 'Seller Concessions', value: sellerConcessionsInput, setter: setSellerConcessions },
              ].map((field) => (
                <label key={field.label} className="space-y-2 text-sm text-slate-300">
                  <span className="font-medium text-slate-100">{field.label}</span>
                  <input
                    type="number"
                    value={field.value}
                    onChange={(event) => field.setter(event.target.value)}
                    placeholder="0"
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
                <p className="text-sm text-slate-400">Agent commission</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(commissionAmount)}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Net proceeds to seller</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(netProceeds)}</p>
              </div>
            </div>
            <ProActionButton href={professionalSheetHref} buttonText="Generate Professional Sheet" />
            <SaveDealPanel dealType="seller_net_sheet" inputs={saveInputs} results={saveResults} />
          </section>
        </div>
      </div>
    </main>
  );
}
