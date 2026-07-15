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

export default async function AffordabilityProfessionalSheetPage({ searchParams }: PageProps) {
 const paidStatus = await getPaidStatusFromServerCookies();

 if (!paidStatus.isAuthenticated) {
 redirect('/auth/login');
 }

 if (!paidStatus.isPaid) {
 redirect('/upgrade');
 }

 const preApprovalAmount = parseNumber(searchParams, 'preApprovalAmount', 0);
 const availableCash = parseNumber(searchParams, 'availableCash', 0);
 const interestRate = parseNumber(searchParams, 'interestRate', 7);
 const termYears = parseNumber(searchParams, 'termYears', 30);
 const propertyTaxRate = parseNumber(searchParams, 'propertyTaxRate', 1.1);
 const annualInsurance = parseNumber(searchParams, 'annualInsurance', 1500);
 const closingCostsPercent = parseNumber(searchParams, 'closingCostsPercent', 3);

 const closingRate = closingCostsPercent / 100;
 const maxPurchasePrice = closingRate <= -1 ? 0 : (preApprovalAmount + availableCash) / (1 + closingRate);
 const closingCostsAtMaxPrice = maxPurchasePrice * closingRate;
 const downPaymentAvailable = availableCash - closingCostsAtMaxPrice;
 const loanAmount = maxPurchasePrice - downPaymentAvailable;
 const monthlyPrincipalAndInterest = calculateMortgage(loanAmount, interestRate, termYears);
 const monthlyPropertyTax = (propertyTaxRate / 100) * maxPurchasePrice / 12;
 const monthlyInsurance = annualInsurance / 12;
 const estimatedMonthlyPiti = monthlyPrincipalAndInterest + monthlyPropertyTax + monthlyInsurance;
 const cashRemainingAfterClosing = availableCash - downPaymentAvailable - closingCostsAtMaxPrice;

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
 href="/affordability"
 className="inline-flex items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 px-5 py-3 text-sm font-medium text-gold-light transition hover:bg-gold/20"
 >
 Back to Buyer Affordability Calculator
 </Link>
 <PrintButton />
 </div>

 <article className="print-sheet rounded-3xl border border-slate-800 bg-white p-8 text-slate-900 shadow-2xl shadow-slate-950/20 sm:p-12">
 <header className="border-b border-slate-300 pb-6">
 <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
 <div>
 <p className="text-sm uppercase tracking-[0.2em] text-slate-600">HomesIQ</p>
 <h1 className="mt-2 text-3xl font-semibold text-slate-900">Buyer Affordability</h1>
 </div>
 <p className="text-sm text-slate-600">Date: {today}</p>
 </div>
 </header>

 <section className="mt-8 grid gap-6 sm:grid-cols-2">
 <div className="rounded-2xl border border-slate-300 p-5">
 <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Inputs</h2>
 <dl className="mt-4 space-y-3 text-sm">
 <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Lender pre-approval amount</dt><dd className="font-medium text-slate-900">{formatMoney(preApprovalAmount)}</dd></div>
 <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Available cash</dt><dd className="font-medium text-slate-900">{formatMoney(availableCash)}</dd></div>
 <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Annual interest rate (%)</dt><dd className="font-medium text-slate-900">{formatPercent(interestRate)}</dd></div>
 <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Loan term in years</dt><dd className="font-medium text-slate-900">{termYears}</dd></div>
 <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Property tax rate (% per year)</dt><dd className="font-medium text-slate-900">{formatPercent(propertyTaxRate)}</dd></div>
 <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Annual homeowners insurance</dt><dd className="font-medium text-slate-900">{formatMoney(annualInsurance)}</dd></div>
 <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Closing costs (% of price)</dt><dd className="font-medium text-slate-900">{formatPercent(closingCostsPercent)}</dd></div>
 </dl>
 </div>

 <div className="rounded-2xl border border-slate-300 p-5">
 <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Results</h2>
 <dl className="mt-4 space-y-4">
 <div>
 <dt className="text-sm text-slate-600">Max Purchase Price</dt>
 <dd className="mt-1 text-3xl font-semibold text-slate-900">{formatMoney(maxPurchasePrice)}</dd>
 </div>
 <div className="border-t border-slate-200 pt-4">
 <dt className="text-sm text-slate-600">Estimated Monthly PITI</dt>
 <dd className="mt-1 text-3xl font-semibold text-slate-900">{formatMoney(estimatedMonthlyPiti)}</dd>
 </div>
 <div className="border-t border-slate-200 pt-4">
 <dt className="text-sm text-slate-600">Cash Remaining After Closing</dt>
 <dd className="mt-1 text-3xl font-semibold text-slate-900">{formatMoney(cashRemainingAfterClosing)}</dd>
 </div>
 </dl>
 <p className="mt-5 rounded-2xl border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-800">
 Estimate only - subject to lender verification.
 </p>
 </div>
 </section>

 <footer className="mt-10 border-t border-slate-300 pt-4 text-sm text-slate-600">
 Prepared by HomesIQ
 </footer>
 </article>
 </div>
 </main>
 );
}