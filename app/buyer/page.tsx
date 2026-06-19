'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const calculateMaxLoan = (monthlyPayment: number, annualRate: number, years: number) => {
  const monthlyRate = annualRate / 100 / 12;
  const n = years * 12;
  if (!monthlyRate || !n) return monthlyPayment * n;
  return monthlyPayment * ((1 - Math.pow(1 + monthlyRate, -n)) / monthlyRate);
};

const calculateMonthlyPayment = (loanAmount: number, annualRate: number, years: number) => {
  const monthlyRate = annualRate / 100 / 12;
  const n = years * 12;
  if (!monthlyRate || !n) return loanAmount / n;
  return loanAmount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -n)));
};

export default function BuyerAffordabilityPage() {
  const [annualIncome, setAnnualIncome] = useState(90000);
  const [monthlyDebts, setMonthlyDebts] = useState(500);
  const [downPayment, setDownPayment] = useState(40000);
  const [interestRate, setInterestRate] = useState(5);
  const [termYears, setTermYears] = useState(30);
  const [propertyTax, setPropertyTax] = useState(4200);
  const [insurance, setInsurance] = useState(1200);

  const monthlyIncome = annualIncome / 12;
  const monthlyTax = propertyTax / 12;
  const monthlyInsurance = insurance / 12;
  const maxDebtPayment = monthlyIncome * 0.43;
  const availableForMortgage = Math.max(0, maxDebtPayment - monthlyDebts - monthlyTax - monthlyInsurance);
  const maxLoan = calculateMaxLoan(availableForMortgage, interestRate, termYears);
  const maxHomePrice = Math.max(0, maxLoan + downPayment);
  const estimatedMortgagePayment = calculateMonthlyPayment(maxLoan, interestRate, termYears);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Calculator</p>
            <h1 className="mt-3 text-4xl font-semibold">Buyer Affordability</h1>
          </div>
          <Link href="/" className="inline-flex items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20">
            Back to home
          </Link>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Annual Income', value: annualIncome, setter: setAnnualIncome },
                { label: 'Monthly Debts', value: monthlyDebts, setter: setMonthlyDebts },
                { label: 'Down Payment', value: downPayment, setter: setDownPayment },
                { label: 'Interest Rate %', value: interestRate, setter: setInterestRate },
                { label: 'Loan Term (years)', value: termYears, setter: setTermYears },
                { label: 'Property Tax / year', value: propertyTax, setter: setPropertyTax },
                { label: 'Insurance / year', value: insurance, setter: setInsurance },
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
                <p className="text-sm text-slate-400">Max home price</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(maxHomePrice)}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Estimated monthly payment</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(estimatedMortgagePayment)}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Available mortgage payment</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(availableForMortgage)}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Debt-to-income cap</p>
                <p className="mt-2 text-3xl font-semibold text-white">43%</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
