'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type ProActionButtonProps = {
 href: string;
 buttonText: string;
};

export default function ProActionButton({ href, buttonText }: ProActionButtonProps) {
 const [loading, setLoading] = useState(false);
 const [message, setMessage] = useState('');
 const [actionLink, setActionLink] = useState<'login' | 'upgrade' | null>(null);

 const handleClick = async () => {
 setMessage('');
 setActionLink(null);
 setLoading(true);

 try {
 const {
 data: { session },
 } = await supabase.auth.getSession();

 if (!session?.access_token) {
 setMessage('Please log in to use Professional Sheets.');
 setActionLink('login');
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
 setMessage('Professional Sheets are a Pro feature. Upgrade to continue.');
 setActionLink('upgrade');
 setLoading(false);
 return;
 }

 window.open(href, '_blank', 'noopener,noreferrer');
 setLoading(false);
 } catch (error) {
 setMessage(error instanceof Error ? error.message : 'Unexpected error.');
 setLoading(false);
 }
 };

 return (
 <div className="space-y-3">
 <button
 type="button"
 onClick={handleClick}
 disabled={loading}
 className="inline-flex w-full items-center justify-center rounded-2xl bg-gold px-6 py-3 font-semibold text-gold-dark transition hover:bg-gold/90 disabled:opacity-50"
 >
 {loading ? 'Checking plan...' : buttonText}
 </button>

 {message ? (
 <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
 {message}{' '}
 {actionLink === 'login' ? (
 <Link href="/auth/login" className="font-semibold text-gold-light underline hover:text-gold-light">
 Go to Login
 </Link>
 ) : null}
 {actionLink === 'upgrade' ? (
 <Link href="/upgrade" className="font-semibold text-gold-light underline hover:text-gold-light">
 Go to Upgrade
 </Link>
 ) : null}
 </p>
 ) : null}
 </div>
 );
}
