'use client';

import { useMemo, useState } from 'react';
import BackToCalculatorsButton from '@/app/components/BackToCalculatorsButton';
import ProActionButton from '@/app/components/ProActionButton';
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
  const [purchasePriceInput, setPurchasePrice] = useState('300000');
  const [downPercentInput, setDownPercent] = useState('20');
  const [interestRateInput, setInterestRate] = useState('4.5');
  const [termYearsInput, setTermYears] = useState('30');
  const [monthlyRentInput, setMonthlyRent] = useState('2500');
  const [propertyTaxInput, setPropertyTax] = useState('3600');
  const [insuranceInput, setInsurance] = useState('1200');
  const [vacancyPercentInput, setVacancyPercent] = useState('5');
  const [maintenancePercentInput, setMaintenancePercent] = useState('10');
  const [managementPercentInput, setManagementPercent] = useState('8');

  const purchasePrice = parseFloat(purchasePriceInput) || 0;
  const downPercent = parseFloat(downPercentInput) || 0;
  const interestRate = parseFloat(interestRateInput) || 0;
  const termYears = parseFloat(termYearsInput) || 0;
  const monthlyRent = parseFloat(monthlyRentInput) || 0;
  const propertyTax = parseFloat(propertyTaxInput) || 0;
  const insurance = parseFloat(insuranceInput) || 0;
  const vacancyPercent = parseFloat(vacancyPercentInput) || 0;
  const maintenancePercent = parseFloat(maintenancePercentInput) || 0;
  const managementPercent = parseFloat(managementPercentInput) || 0;

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
    purchasePrice: purchasePriceInput,
    downPercent: downPercentInput,
    interestRate: interestRateInput,
    termYears: termYearsInput,
    monthlyRent: monthlyRentInput,
    propertyTax: propertyTaxInput,
    insurance: insuranceInput,
    vacancyPercent: vacancyPercentInput,
    maintenancePercent: maintenancePercentInput,
    managementPercent: managementPercentInput,
  };
  const saveResults = {
    monthlyCashFlow,
    capRate,
    cashOnCash,
    onePercentRule,
  };
  const professionalSheetHref = `/rental/professional-sheet?purchasePrice=${encodeURIComponent(purchasePriceInput)}&downPercent=${encodeURIComponent(downPercentInput)}&interestRate=${encodeURIComponent(interestRateInput)}&termYears=${encodeURIComponent(termYearsInput)}&monthlyRent=${encodeURIComponent(monthlyRentInput)}&propertyTax=${encodeURIComponent(propertyTaxInput)}&insurance=${encodeURIComponent(insuranceInput)}&vacancyPercent=${encodeURIComponent(vacancyPercentInput)}&maintenancePercent=${encodeURIComponent(maintenancePercentInput)}&managementPercent=${encodeURIComponent(managementPercentInput)}&monthlyCashFlow=${encodeURIComponent(String(monthlyCashFlow))}&capRate=${encodeURIComponent(String(capRate))}&cashOnCash=${encodeURIComponent(String(cashOnCash))}&onePercentRule=${encodeURIComponent(onePercentRule ? '1' : '0')}`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Calculator</p>
            <h1 className="mt-3 text-4xl font-semibold">Rental Analysis</h1>
          </div>
          <BackToCalculatorsButton />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Purchase Price', value: purchasePriceInput, setter: setPurchasePrice },
                { label: 'Down Payment %', value: downPercentInput, setter: setDownPercent },
                { label: 'Loan Interest Rate %', value: interestRateInput, setter: setInterestRate },
                { label: 'Loan Term (years)', value: termYearsInput, setter: setTermYears },
                { label: 'Monthly Rent', value: monthlyRentInput, setter: setMonthlyRent },
                { label: 'Property Tax / year', value: propertyTaxInput, setter: setPropertyTax },
                { label: 'Insurance / year', value: insuranceInput, setter: setInsurance },
                { label: 'Vacancy %', value: vacancyPercentInput, setter: setVacancyPercent },
                { label: 'Maintenance %', value: maintenancePercentInput, setter: setMaintenancePercent },
                { label: 'Management %', value: managementPercentInput, setter: setManagementPercent },
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
            <ProActionButton href={professionalSheetHref} buttonText="Generate Professional Sheet" />
            <SaveDealPanel dealType="rental" inputs={saveInputs} results={saveResults} />
          </section>
        </div>
      </div>
    </main>
  );
}
