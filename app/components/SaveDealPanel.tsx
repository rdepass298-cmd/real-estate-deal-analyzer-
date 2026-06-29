'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type SaveDealPanelProps = {
  dealType: string;
  inputs: Record<string, number | string | boolean>;
  results: Record<string, number | string | boolean>;
};

export default function SaveDealPanel({ dealType, inputs, results }: SaveDealPanelProps) {
  const [dealName, setDealName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [actionLink, setActionLink] = useState<'login' | 'upgrade' | null>(null);
  const [showUpgradeLink, setShowUpgradeLink] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(Boolean(data.session?.user));
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSave = async () => {
    setMessage('');
    setMessageType('');
    setShowUpgradeLink(false);
    setActionLink(null);
    setIsSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setMessage('Please log in to save deals.');
      setMessageType('error');
      setActionLink('login');
      setIsSaving(false);
      return;
    }

    const response = await fetch('/api/deals/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({
        dealType,
        name: dealName.trim(),
        inputs,
        results,
      }),
    });

    const data = (await response.json()) as {
      error?: string;
      code?: string;
      upgradeUrl?: string;
    };

    if (!response.ok) {
      setMessage(data.error || 'Unable to save deal.');
      setMessageType('error');
      const needsUpgrade = data.code === 'PRO_REQUIRED' || data.upgradeUrl === '/upgrade';
      setShowUpgradeLink(needsUpgrade);
      setActionLink(needsUpgrade ? 'upgrade' : null);
      setIsSaving(false);
      return;
    }

    setMessage('Deal saved successfully.');
    setMessageType('success');
    setIsSaving(false);
  };

  return (
    <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
      <h3 className="text-lg font-semibold text-white">Save This Deal</h3>

      <label className="space-y-2 text-sm text-slate-300">
        <span className="font-medium text-slate-100">Deal name (optional)</span>
        <input
          type="text"
          value={dealName}
          onChange={(event) => setDealName(event.target.value)}
          placeholder="My favorite rental"
          className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20"
          disabled={isSaving}
        />
      </label>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Deal'}
      </button>

      {message ? (
        <p
          className={`rounded-2xl border p-3 text-sm ${
            messageType === 'success'
              ? 'border-green-500/40 bg-green-500/10 text-green-200'
              : 'border-red-500/40 bg-red-500/10 text-red-200'
          }`}
        >
          {message}{' '}
          {actionLink === 'login' ? (
            <Link href="/auth/login" className="font-semibold text-cyan-300 underline hover:text-cyan-200">
              Log in
            </Link>
          ) : null}
          {showUpgradeLink ? (
            <Link href="/upgrade" className="font-semibold text-cyan-300 underline hover:text-cyan-200">
              Upgrade to Pro
            </Link>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}
