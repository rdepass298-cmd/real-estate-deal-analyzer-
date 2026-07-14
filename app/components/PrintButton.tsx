'use client';

export default function PrintButton() {
 return (
 <button
 type="button"
 onClick={() => window.print()}
 className="inline-flex items-center justify-center rounded-2xl bg-gold px-6 py-3 text-sm font-semibold text-gold-dark transition hover:bg-gold/90"
 >
 Print / Save as PDF
 </button>
 );
}
