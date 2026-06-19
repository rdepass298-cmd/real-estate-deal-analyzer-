'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Deal = {
  id: string;
  user_id: string;
  deal_type: string;
  name: string;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
  created_at: string;
};

const formatMoney = (value: unknown) => {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value ?? 'N/A');
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
};

const titleFromType = (dealType: string) =>
  dealType
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const summarizeResults = (deal: Deal) => {
  const r = deal.results || {};

  if (deal.deal_type === 'rental') {
    return `Cash flow ${formatMoney(r.monthlyCashFlow)} | Cap rate ${Number(r.capRate ?? 0).toFixed(2)}%`;
  }

  if (deal.deal_type === 'fix_and_flip') {
    return `Net profit ${formatMoney(r.netProfit)} | ROI ${Number(r.roi ?? 0).toFixed(2)}%`;
  }

  if (deal.deal_type === 'seller_net_sheet') {
    return `Net proceeds ${formatMoney(r.netProceeds)}`;
  }

  if (deal.deal_type === 'buyer_affordability') {
    return `Max home ${formatMoney(r.maxHomePrice)} | Payment ${formatMoney(r.estimatedMortgagePayment)}`;
  }

  return 'Saved deal';
};

export default function MyDealsPage() {
  const [userEmail, setUserEmail] = useState('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDeals = async () => {
    setLoading(true);
    setError('');

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setLoading(false);
      setError('Please log in to view your deals.');
      return;
    }

    setUserEmail(user.email || '');

    const { data, error: dealsError } = await supabase
      .from('deals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dealsError) {
      setError(dealsError.message);
      setLoading(false);
      return;
    }

    setDeals((data as Deal[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await supabase.from('deals').delete().eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setDeals((current) => current.filter((deal) => deal.id !== id));
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 sm:px-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Portfolio</p>
            <h1 className="mt-3 text-4xl font-semibold">My Deals</h1>
            {userEmail ? <p className="mt-2 text-slate-300">Signed in as {userEmail}</p> : null}
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
          >
            Back to home
          </Link>
        </div>

        <div className="mt-8 space-y-4">
          {loading ? <p className="text-slate-300">Loading deals...</p> : null}

          {error ? <p className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</p> : null}

          {!loading && !error && deals.length === 0 ? (
            <p className="rounded-2xl border border-slate-700 bg-slate-950/60 p-5 text-slate-300">No saved deals yet.</p>
          ) : null}

          {deals.map((deal) => (
            <article key={deal.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{deal.name}</h2>
                  <p className="mt-1 text-sm text-cyan-300">{titleFromType(deal.deal_type)}</p>
                  <p className="mt-2 text-sm text-slate-400">Saved {new Date(deal.created_at).toLocaleString()}</p>
                  <p className="mt-3 text-slate-200">{summarizeResults(deal)}</p>
                </div>

                <button
                  onClick={() => handleDelete(deal.id)}
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
