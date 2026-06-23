'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthHeader() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ? { email: data.session.user.email || '' } : null);
      setLoading(false);
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { email: session.user.email || '' } : null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
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
            RealEstate Deal Analyzer
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/deals" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
                  My Deals
                </Link>
                <Link href="/upgrade" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
                  Upgrade
                </Link>
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
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
