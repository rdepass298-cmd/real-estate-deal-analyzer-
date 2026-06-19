'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import SaveDealPanel from '@/app/components/SaveDealPanel';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const calculateMortgage = (loan: number, annualRate: number, years: number) => {
  if (loan <= 0 || years <= 0) return 0;
  
  const monthlyRate = annualRate / 100 / 12;
  const n = years * 12;
  
  // Handle zero interest rate case
  if (monthlyRate === 0) {
    return loan / n;
  }
  
  // Standard amortized payment formula: M = P * (r(1+r)^n) / ((1+r)^n - 1)
  const denominator = Math.pow(1 + monthlyRate, n) - 1;
  return (loan * monthlyRate * Math.pow(1 + monthlyRate, n)) / denominator;
};

export default function RentalAnalysisPage() {
  const [purchasePrice, setPurchasePrice] = useState(300000);
  const [downPercent, setDownPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(4.5);
  const [termYears, setTermYears] = useState(30);
  const [monthlyRent, setMonthlyRent] = useState(2500);
  const [propertyTax, setPropertyTax] = useState(3600);
  const [insurance, setInsurance] = useState(1200);
  const [vacancyPercent, setVacancyPercent] = useState(5);
  const [maintenancePercent, setMaintenancePercent] = useState(10);
  const [managementPercent, setManagementPercent] = useState(8);

  const loanAmount = useMemo(() => purchasePrice * (1 - downPercent / 100), [purchasePrice, downPercent]);
  const monthlyMortgage = useMemo(() => calculateMortgage(loanAmount, interestRate, termYears), [loanAmount, interestRate, termYears]);
  const vacancyCost = (vacancyPercent / 100) * monthlyRent;
  const maintenanceCost = (maintenancePercent / 100) * monthlyRent;
  const managementCost = (managementPercent / 100) * monthlyRent;
  const monthlyExpenses = propertyTax / 12 + insurance / 12 + vacancyCost + maintenanceCost + managementCost;
  const monthlyCashFlow = monthlyRent - monthlyMortgage - monthlyExpenses;
  const annualNOI = monthlyRent * 12 - (propertyTax + insurance + vacancyCost * 12 + maintenanceCost * 12 + managementCost * 12);
  const capRate = purchasePrice ? (annualNOI / purchasePrice) * 100 : 0;
  const annualCashFlow = monthlyCashFlow * 12;
  const cashInvested = purchasePrice * (downPercent / 100);
  const cashOnCash = cashInvested ? (annualCashFlow / cashInvested) * 100 : 0;
  const onePercentRule = monthlyRent >= purchasePrice * 0.01;
  const saveInputs = {
    purchasePrice,
    downPercent,
    interestRate,
    termYears,
    monthlyRent,
    propertyTax,
    insurance,
    vacancyPercent,
    maintenancePercent,
    managementPercent,
  };
  const saveResults = {
    monthlyCashFlow,
    capRate,
    cashOnCash,
    onePercentRule,
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Calculator</p>
            <h1 className="mt-3 text-4xl font-semibold">Rental Analysis</h1>
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
                { label: 'Down Payment %', value: downPercent, setter: setDownPercent },
                { label: 'Loan Interest Rate %', value: interestRate, setter: setInterestRate },
                { label: 'Loan Term (years)', value: termYears, setter: setTermYears },
                { label: 'Monthly Rent', value: monthlyRent, setter: setMonthlyRent },
                { label: 'Property Tax / year', value: propertyTax, setter: setPropertyTax },
                { label: 'Insurance / year', value: insurance, setter: setInsurance },
                { label: 'Vacancy %', value: vacancyPercent, setter: setVacancyPercent },
                { label: 'Maintenance %', value: maintenancePercent, setter: setMaintenancePercent },
                { label: 'Management %', value: managementPercent, setter: setManagementPercent },
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
                <p className="text-sm text-slate-400">Monthly cash flow</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(monthlyCashFlow)}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Cap rate</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatPercent(capRate)}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Cash-on-cash return</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatPercent(cashOnCash)}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">1% rule check</p>
                <p className="mt-2 text-3xl font-semibold text-white">{onePercentRule ? 'Pass' : 'Fail'}</p>
              </div>
            </div>
            <SaveDealPanel dealType="rental" inputs={saveInputs} results={saveResults} />
          </section>
        </div>
      </div>
    </main>
  );
}
