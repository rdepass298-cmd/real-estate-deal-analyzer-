'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthHeader() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [plan, setPlan] = useState<'free' | 'pro' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const response = await fetch('/api/pro/status', {
          method: 'GET',
          credentials: 'same-origin',
        });

        const data = (await response.json()) as { isPaid?: boolean; isAuthenticated?: boolean };

        if (!response.ok || !data.isAuthenticated) {
          setPlan(null);
          return;
        }

        setPlan(data.isPaid ? 'pro' : 'free');
      } catch {
        setPlan(null);
      }
    };

    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;

      setUser(sessionUser ? { email: sessionUser.email || '' } : null);

      if (data.session?.user) {
        await loadPlan();
      } else {
        setPlan(null);
      }

      setLoading(false);
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ? { email: session.user.email || '' } : null);

      if (session?.user) {
        await loadPlan();
      } else {
        setPlan(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPlan(null);
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 animate-pulse rounded bg-slate-700"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-cyan-300 transition hover:text-cyan-200">
            Real Estate Analyzer
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {plan ? (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                      plan === 'pro'
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : 'border border-amber-500/30 bg-amber-500/10 text-amber-200'
                    }`}
                  >
                    {plan}
                  </span>
                ) : null}
                {plan === 'free' ? (
                  <Link href="/upgrade" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
                    Upgrade
                  </Link>
                ) : null}
                <span className="text-sm text-slate-300">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
