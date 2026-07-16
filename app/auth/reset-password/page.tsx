'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
 const router = useRouter();
 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);
 const [showRequestNewLink, setShowRequestNewLink] = useState(false);

 useEffect(() => {
  const initializeRecoverySession = async () => {
   try {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    const tokenHash = search.get('token_hash') || hash.get('token_hash');
    const type = search.get('type') || hash.get('type');
    const code = search.get('code');

    if (tokenHash && type === 'recovery') {
     await supabase.auth.verifyOtp({
      type: 'recovery',
      token_hash: tokenHash,
     });
     return;
    }

    if (code) {
     await supabase.auth.exchangeCodeForSession(code);
    }
   } catch {
    // Intentionally ignored: password update response is the source of truth.
   }
  };

  initializeRecoverySession();
 }, []);

 const handlePasswordUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setShowRequestNewLink(false);

  if (password.length < 6) {
   setError('Password must be at least 6 characters');
   return;
  }

  if (password !== confirmPassword) {
   setError('Passwords do not match');
   return;
  }

  setLoading(true);

  const { error: updateError } = await supabase.auth.updateUser({ password });

  if (updateError) {
   setError(updateError.message);
    if (updateError.message.toLowerCase().includes('session')) {
     setShowRequestNewLink(true);
    }
   setLoading(false);
   return;
  }

  router.push('/calculators');
 };

 return (
  <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 sm:px-10">
   <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
    <div className="mb-8">
     <p className="text-sm uppercase tracking-[0.35em] text-gold-light">Authentication</p>
     <h1 className="mt-3 text-3xl font-semibold">Set New Password</h1>
    </div>

    <form onSubmit={handlePasswordUpdate} className="space-y-6">
     {error ? (
      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
       <p>{error}</p>
       {showRequestNewLink ? (
        <Link href="/auth/forgot-password" className="mt-2 inline-block text-gold-light transition hover:text-gold-light">
         Request a new reset link
        </Link>
       ) : null}
      </div>
     ) : null}

     <label className="space-y-2 text-sm text-slate-300">
      <span className="font-medium text-slate-100">New Password</span>
      <input
       type="password"
       value={password}
       onChange={(e) => setPassword(e.target.value)}
       placeholder="At least 6 characters"
       className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-gold/70 focus:ring-2 focus:ring-gold/20"
       disabled={loading}
      />
     </label>

     <label className="space-y-2 text-sm text-slate-300">
      <span className="font-medium text-slate-100">Confirm New Password</span>
      <input
       type="password"
       value={confirmPassword}
       onChange={(e) => setConfirmPassword(e.target.value)}
       placeholder="Confirm password"
       className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-gold/70 focus:ring-2 focus:ring-gold/20"
       disabled={loading}
      />
     </label>

     <button
      type="submit"
      disabled={loading}
      className="w-full rounded-2xl bg-gold px-6 py-3 font-semibold text-gold-dark transition hover:bg-gold/90 disabled:opacity-50"
     >
      {loading ? 'Updating password...' : 'Update password'}
     </button>
    </form>
   </div>
  </main>
 );
}
