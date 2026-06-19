import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RealEstate Deal Analyzer',
  description: 'Analyze rental, fix and flip, seller net sheet, and buyer affordability scenarios.',
};

const cards = [
  { title: 'Rental Analysis', description: 'Estimate rental income, expenses, and cash flow.', href: '/rental' },
  { title: 'Fix and Flip', description: 'Evaluate renovation costs, resale value, and profit potential.', href: '/flip' },
  { title: 'Seller Net Sheet', description: 'Calculate seller proceeds after closing costs and commissions.', href: '/seller' },
  { title: 'Buyer Affordability', description: 'Assess how much home a buyer can afford based on income and debt.', href: '/buyer' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <section className="mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Real estate tools</p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">RealEstate Deal Analyzer</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300 sm:text-lg">
            Explore rental, flip, seller, and buyer scenarios with fast, modern calculation tools tailored for investors.
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20 transition hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-slate-900"
            >
              <h2 className="text-2xl font-semibold text-white">{card.title}</h2>
              <p className="mt-3 text-slate-300">{card.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
