'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ensureProfile } from '@/lib/ensureProfile';

export default function LoginPage() {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);

 const handleLogin = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');

 if (!email.trim()) {
 setError('Please enter an email address');
 return;
 }

 if (!password) {
 setError('Please enter a password');
 return;
 }

 setLoading(true);

 try {
 const { data, error: signInError } = await supabase.auth.signInWithPassword({
 email,
 password,
 });

 if (signInError) {
 setError(signInError.message);
 setLoading(false);
 return;
 }

 if (data.user?.id && data.user.email) {
 await ensureProfile({
 id: data.user.id,
 email: data.user.email,
 });
 }

 window.location.href = '/calculators';
 } catch (err) {
 setError(err instanceof Error ? err.message : 'An unexpected error occurred');
 setLoading(false);
 }
 };

 return (
 <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 sm:px-10">
 <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20">
 <div className="mb-8">
 <p className="text-sm uppercase tracking-[0.35em] text-gold-light">Authentication</p>
 <h1 className="mt-3 text-3xl font-semibold">Log In</h1>
 </div>

 <form onSubmit={handleLogin} className="space-y-6">
 {error && (
 <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
 )}

 <label className="space-y-2 text-sm text-slate-300">
 <span className="font-medium text-slate-100">Email</span>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="you@example.com"
 className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-gold/70 focus:ring-2 focus:ring-gold/20"
 disabled={loading}
 />
 </label>

 <label className="space-y-2 text-sm text-slate-300">
 <div className="flex items-center justify-between">
 <span className="font-medium text-slate-100">Password</span>
 <Link href="/auth/forgot-password" className="text-xs font-medium text-gold-light transition hover:text-gold-light">
 Forgot password?
 </Link>
 </div>
 <input
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="Your password"
 className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-gold/70 focus:ring-2 focus:ring-gold/20"
 disabled={loading}
 />
 </label>

 <button
 type="submit"
 disabled={loading}
 className="w-full rounded-2xl bg-gold px-6 py-3 font-semibold text-gold-dark transition hover:bg-gold/90 disabled:opacity-50"
 >
 {loading ? 'Logging in...' : 'Log In'}
 </button>
 </form>

 <p className="mt-6 text-center text-sm text-slate-400">
 Don&apos;t have an account?{' '}
 <Link href="/auth/signup" className="text-gold-light transition hover:text-gold-light">
 Create one
 </Link>
 </p>
 </div>
 </main>
 );
}
