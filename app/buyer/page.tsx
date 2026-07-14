'use client';

import { useMemo, useState } from 'react';
import BackToCalculatorsButton from '@/app/components/BackToCalculatorsButton';
import SaveDealPanel from '@/app/components/SaveDealPanel';

const formatMoney = (value: number) =>
 new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

type BuildMode = 'spec' | 'custom';

export default function BuilderRoiPage() {
 const [mode, setMode] = useState<BuildMode>('spec');
 const [landCostInput, setLandCost] = useState('85000');
 const [sitePrepUtilitiesInput, setSitePrepUtilities] = useState('40000');
 const [hardCostPerSqFtInput, setHardCostPerSqFt] = useState('185');
 const [squareFootageInput, setSquareFootage] = useState('2200');
 const [softCostsInput, setSoftCosts] = useState('30000');
 const [loanAmountInput, setLoanAmount] = useState('300000');
 const [loanInterestRateInput, setLoanInterestRate] = useState('9');
 const [buildDurationMonthsInput, setBuildDurationMonths] = useState('10');
 const [contingencyPercentInput, setContingencyPercent] = useState('10');
 const [exitPriceInput, setExitPrice] = useState('620000');
 const [sellingCostsPercentInput, setSellingCostsPercent] = useState('6');

 const landCost = parseFloat(landCostInput) || 0;
 const sitePrepUtilities = parseFloat(sitePrepUtilitiesInput) || 0;
 const hardCostPerSqFt = parseFloat(hardCostPerSqFtInput) || 0;
 const squareFootage = parseFloat(squareFootageInput) || 0;
 const softCosts = parseFloat(softCostsInput) || 0;
 const loanAmount = parseFloat(loanAmountInput) || 0;
 const loanInterestRate = parseFloat(loanInterestRateInput) || 0;
 const buildDurationMonths = parseFloat(buildDurationMonthsInput) || 0;
 const contingencyPercent = parseFloat(contingencyPercentInput) || 0;
 const exitPrice = parseFloat(exitPriceInput) || 0;
 const sellingCostsPercent = parseFloat(sellingCostsPercentInput) || 0;

 const hardCosts = useMemo(() => hardCostPerSqFt * squareFootage, [hardCostPerSqFt, squareFootage]);
 const contingencyCost = useMemo(() => hardCosts * (contingencyPercent / 100), [hardCosts, contingencyPercent]);
 const carryCost = useMemo(
 () => loanAmount * (loanInterestRate / 100) * (buildDurationMonths / 12),
 [loanAmount, loanInterestRate, buildDurationMonths]
 );
 const sellingCosts = useMemo(
 () => (mode === 'spec' ? exitPrice * (sellingCostsPercent / 100) : 0),
 [mode, exitPrice, sellingCostsPercent]
 );
 const totalProjectCost =
 landCost + sitePrepUtilities + hardCosts + softCosts + carryCost + contingencyCost;
 const netProfit = exitPrice - totalProjectCost - sellingCosts;
 const roi = totalProjectCost ? (netProfit / totalProjectCost) * 100 : 0;
 const profitMargin = exitPrice ? (netProfit / exitPrice) * 100 : 0;
 const costPerSqFt = squareFootage ? totalProjectCost / squareFootage : 0;

 const saveInputs = {
 mode,
 landCost: landCostInput,
 sitePrepUtilities: sitePrepUtilitiesInput,
 hardCostPerSqFt: hardCostPerSqFtInput,
 squareFootage: squareFootageInput,
 softCosts: softCostsInput,
 loanAmount: loanAmountInput,
 loanInterestRate: loanInterestRateInput,
 buildDurationMonths: buildDurationMonthsInput,
 contingencyPercent: contingencyPercentInput,
 exitPrice: exitPriceInput,
 sellingCostsPercent: sellingCostsPercentInput,
 };

 const saveResults = {
 hardCosts,
 contingencyCost,
 carryCost,
 sellingCosts,
 totalProjectCost,
 netProfit,
 roi,
 profitMargin,
 costPerSqFt,
 };

 return (
 <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 sm:px-10">
 <div className="mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <p className="text-sm uppercase tracking-[0.35em] text-gold-light">Calculator</p>
 <h1 className="mt-3 text-4xl font-semibold">Builder ROI</h1>
 </div>
 <BackToCalculatorsButton />
 </div>

 <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
 <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
 <div className="flex flex-wrap gap-3">
 <button
 type="button"
 onClick={() => setMode('spec')}
 className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
 mode === 'spec'
 ? 'border-gold/40 bg-gold/20 text-gold-light'
 : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500'
 }`}
 >
 Spec
 </button>
 <button
 type="button"
 onClick={() => setMode('custom')}
 className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
 mode === 'custom'
 ? 'border-gold/40 bg-gold/20 text-gold-light'
 : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500'
 }`}
 >
 Custom
 </button>
 </div>

 <div className="grid gap-4 sm:grid-cols-2">
 {[
 { label: 'Land Cost', value: landCostInput, setter: setLandCost },
 { label: 'Site Prep / Utilities', value: sitePrepUtilitiesInput, setter: setSitePrepUtilities },
 { label: 'Hard Cost ($/sqft)', value: hardCostPerSqFtInput, setter: setHardCostPerSqFt },
 { label: 'Square Footage', value: squareFootageInput, setter: setSquareFootage },
 { label: 'Soft Costs', value: softCostsInput, setter: setSoftCosts },
 { label: 'Construction Loan Amount', value: loanAmountInput, setter: setLoanAmount },
 { label: 'Loan Interest Rate %', value: loanInterestRateInput, setter: setLoanInterestRate },
 { label: 'Build Duration (months)', value: buildDurationMonthsInput, setter: setBuildDurationMonths },
 { label: 'Contingency % of Hard Cost', value: contingencyPercentInput, setter: setContingencyPercent },
 {
 label: mode === 'spec' ? 'Sale Price' : 'Contract Price',
 value: exitPriceInput,
 setter: setExitPrice,
 },
 {
 label: 'Selling Costs %',
 value: sellingCostsPercentInput,
 setter: setSellingCostsPercent,
 hidden: mode === 'custom',
 },
 ].map((field) => (
 field.hidden ? null : (
 <label key={field.label} className="space-y-2 text-sm text-slate-300">
 <span className="font-medium text-slate-100">{field.label}</span>
 <input
 type="number"
 value={field.value}
 onChange={(event) => field.setter(event.target.value)}
 placeholder="0"
 className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-gold/70 focus:ring-2 focus:ring-gold/20"
 />
 </label>
 )
 ))}
 </div>
 </section>

 <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
 <h2 className="text-xl font-semibold text-white">Results</h2>
 <div className="grid gap-4">
 <div className="rounded-3xl bg-slate-900/80 p-5">
 <p className="text-sm text-slate-400">Total project cost</p>
 <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(totalProjectCost)}</p>
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
 <p className="text-sm text-slate-400">Profit margin</p>
 <p className="mt-2 text-3xl font-semibold text-white">{formatPercent(profitMargin)}</p>
 </div>
 <div className="rounded-3xl bg-slate-900/80 p-5">
 <p className="text-sm text-slate-400">Cost per sqft</p>
 <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(costPerSqFt)}</p>
 </div>
 <div className="rounded-3xl bg-slate-900/80 p-5">
 <p className="text-sm text-slate-400">Carry cost</p>
 <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(carryCost)}</p>
 </div>
 <div className="rounded-3xl bg-slate-900/80 p-5">
 <p className="text-sm text-slate-400">Selling costs</p>
 <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(sellingCosts)}</p>
 </div>
 </div>
 <SaveDealPanel dealType="builder_roi" inputs={saveInputs} results={saveResults} />
 </section>
 </div>
 </div>
 </main>
 );
}
