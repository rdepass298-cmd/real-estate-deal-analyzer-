'use client';

import { useRouter } from 'next/navigation';

export default function BackToCalculatorsButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push('/calculators')}
      className="inline-flex items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
    >
      &lt; Back to Calculators
    </button>
  );
}