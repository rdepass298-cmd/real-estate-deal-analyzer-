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
 const [checkingLink, setCheckingLink] = useState(true);
 const [invalidLink, setInvalidLink] = useState(false);
 const [linkCheckError, setLinkCheckError] = useState('');
 const INVALID_LINK_MESSAGE = 'This reset link is invalid or has expired. Request a new one.';

 useEffect(() => {
  let mounted = true;
  let resolved = false;
  let sessionPollInterval: ReturnType<typeof setInterval> | null = null;

  const prepareRecoverySession = async () => {
   try {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    const tokenHash = search.get('token_hash') || hash.get('token_hash');
    const type = search.get('type') || hash.get('type');
    const code = search.get('code');

    const clearSessionPoll = () => {
     if (sessionPollInterval) {
      clearInterval(sessionPollInterval);
      sessionPollInterval = null;
     }
    };

    const markValid = () => {
      if (!mounted || resolved) return;
      resolved = true;
      clearSessionPoll();
      setInvalidLink(false);
      setLinkCheckError('');
      setError('');
      setCheckingLink(false);
    };

    const markInvalid = (message = INVALID_LINK_MESSAGE) => {
      if (!mounted || resolved) return;
      resolved = true;
      clearSessionPoll();
      setInvalidLink(true);
      setLinkCheckError(message);
      setError(message);
      setCheckingLink(false);
    };

    if (tokenHash && type === 'recovery') {
     const { error: verifyError } = await supabase.auth.verifyOtp({
      type: 'recovery',
      token_hash: tokenHash,
     });

     if (verifyError) {
      markInvalid();
      return;
     }

     markValid();
     return;
    }

    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
       markInvalid();
       return;
      }

      markValid();
      return;
    }

    let attempts = 0;
    sessionPollInterval = setInterval(async () => {
     if (!mounted || resolved) return;
     attempts += 1;
     const {
      data: { session },
     } = await supabase.auth.getSession();

     if (session) {
      markValid();
      return;
     }

     if (attempts >= 20) {
      markInvalid();
     }
    }, 300);
   } catch {
    if (!mounted || resolved) return;
    resolved = true;
    setInvalidLink(true);
    setLinkCheckError('Unable to validate the reset link. Request a new one.');
    setError('Unable to validate the reset link. Request a new one.');
    setCheckingLink(false);
   }
  };

  prepareRecoverySession();

  return () => {
   if (sessionPollInterval) {
    clearInterval(sessionPollInterval);
   }
   mounted = false;
  };
 }, []);

 const handlePasswordUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

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
   setLoading(false);
   return;
  }

  router.push('/calculators');
 };

 if (checkingLink) {
  return (
   <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 sm:px-10">
    <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
     <p className="text-sm text-slate-300">Validating your reset link...</p>
    </div>
   </main>
  );
 }

 if (invalidLink) {
  return (
   <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 sm:px-10">
    <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
     <p className="text-sm uppercase tracking-[0.35em] text-gold-light">Authentication</p>
     <h1 className="mt-3 text-3xl font-semibold">Reset Password</h1>
    <p className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">{linkCheckError || INVALID_LINK_MESSAGE}</p>
     <p className="mt-6 text-sm">
      <Link href="/auth/forgot-password" className="text-gold-light transition hover:text-gold-light">
       Request a new reset link
      </Link>
     </p>
    </div>
   </main>
  );
 }

 return (
  <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 sm:px-10">
   <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
    <div className="mb-8">
     <p className="text-sm uppercase tracking-[0.35em] text-gold-light">Authentication</p>
     <h1 className="mt-3 text-3xl font-semibold">Set New Password</h1>
    </div>

    <form onSubmit={handlePasswordUpdate} className="space-y-6">
     {error ? (
      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
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
