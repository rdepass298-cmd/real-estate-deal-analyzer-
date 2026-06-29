'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type ProFeatureGuardProps = {
  featureName: string;
  calculatorPath: string;
  children: ReactNode;
};

export default function ProFeatureGuard({
  featureName,
  calculatorPath,
  children,
}: ProFeatureGuardProps) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setError(`${featureName} are a Pro feature. Please log in and upgrade to access them.`);
          setLoading(false);
          return;
        }

        const response = await fetch('/api/pro/status', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const data = (await response.json()) as { isPaid?: boolean; error?: string };

        if (!response.ok) {
          throw new Error(data.error || 'Unable to verify your plan.');
        }

        if (!data.isPaid) {
          setError(`${featureName} are available on Pro. Upgrade to continue.`);
          setLoading(false);
          return;
        }

        setAllowed(true);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error while checking your plan.');
        setLoading(false);
      }
    };

    checkAccess();
  }, [featureName]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 sm:px-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl shadow-slate-950/20">
          <p className="text-slate-300">Checking your Pro access...</p>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 sm:px-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl shadow-slate-950/20">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Pro Feature</p>
          <h1 className="mt-3 text-3xl font-semibold">Upgrade Required</h1>
          <p className="mt-4 text-slate-300">{error}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/upgrade"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600"
            >
              Upgrade to Pro
            </Link>
            <Link
              href={calculatorPath}
              className="inline-flex items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
            >
              Back to Calculator
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
