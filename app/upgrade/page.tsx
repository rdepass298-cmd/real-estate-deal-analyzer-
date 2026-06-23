'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type CurrentUser = {
  email: string;
};

export default function UpgradePage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;

      if (!authUser) {
        router.replace('/auth/login');
        return;
      }

      if (!mounted) {
        return;
      }

      setUser({
        email: authUser.email || '',
      });
      setLoading(false);
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleUpgrade = async () => {
    setError('');

    if (!user?.email) {
      setError('Please log in with a valid account email to continue.');
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Your session expired. Please log in again.');
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      const result = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !result.url) {
        throw new Error(result.error || 'Unable to start checkout.');
      }

      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 sm:px-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20 sm:p-10">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Pricing</p>
        <h1 className="mt-3 text-4xl font-semibold">Upgrade to Pro</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Unlock full investor workflows with the Pro plan for <span className="font-semibold text-white">$20/month</span>.
          Save deals to your account and export polished professional sheets ready for clients and partners.
        </p>

        <div className="mt-8 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-6">
          <h2 className="text-xl font-semibold text-cyan-100">Pro Includes</h2>
          <ul className="mt-4 space-y-2 text-slate-200">
            <li>Save unlimited deal analyses</li>
            <li>Export professional deal sheets</li>
            <li>One subscription, billed monthly</li>
          </ul>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
        )}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={loading || submitting}
            className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Redirecting to Stripe...' : 'Upgrade Now'}
          </button>

          <Link href="/" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
            Back to calculators
          </Link>
        </div>
      </div>
    </main>
  );
}
