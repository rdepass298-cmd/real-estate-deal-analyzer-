'use client';

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
    setIsSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      setMessage('Please log in to save deals.');
      setMessageType('error');
      setIsSaving(false);
      return;
    }

    const { error } = await supabase.from('deals').insert({
      user_id: user.id,
      deal_type: dealType,
      name: dealName.trim() || `${dealType} deal`,
      inputs,
      results,
    });

    if (error) {
      setMessage(error.message);
      setMessageType('error');
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
          disabled={!isLoggedIn || isSaving}
        />
      </label>

      {isLoggedIn ? (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Deal'}
        </button>
      ) : (
        <button
          disabled
          className="w-full cursor-not-allowed rounded-2xl border border-slate-700 bg-slate-800 px-6 py-3 font-semibold text-slate-400"
        >
          Log in to save deals
        </button>
      )}

      {message ? (
        <p
          className={`rounded-2xl border p-3 text-sm ${
            messageType === 'success'
              ? 'border-green-500/40 bg-green-500/10 text-green-200'
              : 'border-red-500/40 bg-red-500/10 text-red-200'
          }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
