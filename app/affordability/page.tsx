'use client';

import { useMemo, useState } from 'react';
import BackToCalculatorsButton from '@/app/components/BackToCalculatorsButton';
import ProActionButton from '@/app/components/ProActionButton';
import SaveDealPanel from '@/app/components/SaveDealPanel';

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);

const calculateMortgage = (loan: number, annualRate: number, years: number) => {
  if (loan <= 0 || years <= 0) return 0;

  const monthlyRate = annualRate / 100 / 12;
  const n = years * 12;

  if (monthlyRate === 0) {
    return loan / n;
  }

  const denominator = Math.pow(1 + monthlyRate, n) - 1;
  return (loan * monthlyRate * Math.pow(1 + monthlyRate, n)) / denominator;
};

export default function BuyerAffordabilityPage() {
  const [preApprovalAmountInput, setPreApprovalAmount] = useState('');
  const [availableCashInput, setAvailableCash] = useState('');
  const [interestRateInput, setInterestRate] = useState('7');
  const [termYearsInput, setTermYears] = useState('30');
  const [propertyTaxRateInput, setPropertyTaxRate] = useState('1.1');
  const [annualInsuranceInput, setAnnualInsurance] = useState('1500');
  const [closingCostsPercentInput, setClosingCostsPercent] = useState('3');

  const preApprovalAmount = parseFloat(preApprovalAmountInput) || 0;
  const availableCash = parseFloat(availableCashInput) || 0;
  const interestRate = parseFloat(interestRateInput) || 0;
  const termYears = parseFloat(termYearsInput) || 0;
  const propertyTaxRate = parseFloat(propertyTaxRateInput) || 0;
  const annualInsurance = parseFloat(annualInsuranceInput) || 0;
  const closingCostsPercent = parseFloat(closingCostsPercentInput) || 0;

  const closingRate = closingCostsPercent / 100;

  const maxPurchasePrice = useMemo(() => {
    if (closingRate <= -1) return 0;
    return (preApprovalAmount + availableCash) / (1 + closingRate);
  }, [preApprovalAmount, availableCash, closingRate]);

  const closingCostsAtMaxPrice = maxPurchasePrice * closingRate;
  const downPaymentAvailable = availableCash - closingCostsAtMaxPrice;
  const loanAmount = maxPurchasePrice - downPaymentAvailable;
  const monthlyPrincipalAndInterest = useMemo(
    () => calculateMortgage(loanAmount, interestRate, termYears),
    [loanAmount, interestRate, termYears]
  );
  const monthlyPropertyTax = (propertyTaxRate / 100) * maxPurchasePrice / 12;
  const monthlyInsurance = annualInsurance / 12;
  const estimatedMonthlyPiti = monthlyPrincipalAndInterest + monthlyPropertyTax + monthlyInsurance;
  const cashRemainingAfterClosing = availableCash - downPaymentAvailable - closingCostsAtMaxPrice;

  const saveInputs = {
    preApprovalAmount: preApprovalAmountInput,
    availableCash: availableCashInput,
    interestRate: interestRateInput,
    termYears: termYearsInput,
    propertyTaxRate: propertyTaxRateInput,
    annualInsurance: annualInsuranceInput,
    closingCostsPercent: closingCostsPercentInput,
  };

  const saveResults = {
    maxPurchasePrice,
    estimatedMonthlyPiti,
    cashRemainingAfterClosing,
  };

  const professionalSheetHref = `/affordability/professional-sheet?preApprovalAmount=${encodeURIComponent(preApprovalAmountInput)}&availableCash=${encodeURIComponent(availableCashInput)}&interestRate=${encodeURIComponent(interestRateInput)}&termYears=${encodeURIComponent(termYearsInput)}&propertyTaxRate=${encodeURIComponent(propertyTaxRateInput)}&annualInsurance=${encodeURIComponent(annualInsuranceInput)}&closingCostsPercent=${encodeURIComponent(closingCostsPercentInput)}`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Calculator</p>
            <h1 className="mt-3 text-4xl font-semibold">Buyer Affordability</h1>
          </div>
          <BackToCalculatorsButton />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  label: 'Lender pre-approval amount',
                  value: preApprovalAmountInput,
                  setter: setPreApprovalAmount,
                  helperText: 'from your pre-approval letter',
                },
                { label: 'Available cash', value: availableCashInput, setter: setAvailableCash },
                { label: 'Annual interest rate (%)', value: interestRateInput, setter: setInterestRate },
                { label: 'Loan term in years', value: termYearsInput, setter: setTermYears },
                { label: 'Property tax rate (% per year)', value: propertyTaxRateInput, setter: setPropertyTaxRate },
                { label: 'Annual homeowners insurance ($)', value: annualInsuranceInput, setter: setAnnualInsurance },
                { label: 'Closing costs (% of price)', value: closingCostsPercentInput, setter: setClosingCostsPercent },
              ].map((field) => (
                <label key={field.label} className="space-y-2 text-sm text-slate-300">
                  <span className="font-medium text-slate-100">{field.label}</span>
                  {'helperText' in field ? <p className="text-xs text-slate-400">{field.helperText}</p> : null}
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
                <p className="text-sm text-slate-400">Max purchase price</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(maxPurchasePrice)}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Estimated monthly PITI</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(estimatedMonthlyPiti)}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Cash remaining after closing</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(cashRemainingAfterClosing)}</p>
              </div>
              <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                Estimate only - subject to lender verification.
              </p>
            </div>
            <ProActionButton href={professionalSheetHref} buttonText="Generate Professional Sheet" />
            <SaveDealPanel dealType="buyer_affordability" inputs={saveInputs} results={saveResults} />
          </section>
        </div>
      </div>
    </main>
  );
}