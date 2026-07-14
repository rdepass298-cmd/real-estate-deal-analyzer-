'use client';

import { useRouter } from 'next/navigation';

export default function BackToCalculatorsButton() {
 const router = useRouter();

 return (
 <button
 type="button"
 onClick={() => router.push('/calculators')}
 className="inline-flex items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 px-5 py-3 text-sm font-medium text-gold-light transition hover:bg-gold/20"
 >
 &lt; Back to Calculators
 </button>
 );
}