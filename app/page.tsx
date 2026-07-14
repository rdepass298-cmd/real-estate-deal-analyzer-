import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
 const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

 if (!supabaseUrl || !supabaseAnonKey) {
 throw new Error('Missing Supabase environment variables.');
 }

 const cookieStore = cookies();
 const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
 cookies: {
 getAll() {
 return cookieStore.getAll();
 },
 setAll(cookiesToSet) {
 try {
 cookiesToSet.forEach(({ name, value, options }) => {
 cookieStore.set(name, value, options);
 });
 } catch {
 // Server components may not be able to set cookies.
 }
 },
 },
 });

 const {
 data: { session },
 } = await supabase.auth.getSession();

 if (session?.user) {
 redirect('/calculators');
 }

 return (
 <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 sm:px-10">
 <div className="mx-auto max-w-6xl">
 <section className="mx-auto max-w-3xl py-16 text-center sm:py-20">
 <p className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold-light">
 For investors and agents
 </p>
 <h1 className="mt-6 text-4xl font-semibold sm:text-6xl">Analyze any real estate deal in minutes</h1>
 <p className="mx-auto mt-5 max-w-2xl text-slate-300 sm:text-lg">
 Run the numbers on rentals, flips, and new builds, then hand your client a professional deal sheet.
 Free to start.
 </p>
 <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
 <Link
 href="/auth/signup"
 className="inline-flex items-center justify-center rounded-2xl bg-gold px-6 py-3 font-semibold text-gold-dark transition hover:bg-gold/90"
 >
 Start analyzing free
 </Link>
 <Link
 href="#pricing"
 className="inline-flex items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 px-6 py-3 font-semibold text-gold-light transition hover:bg-gold/20"
 >
 See pricing
 </Link>
 </div>
 </section>

 <section className="py-10 sm:py-14">
 <h2 className="text-center text-3xl font-semibold text-white sm:text-4xl">Five calculators, one workflow</h2>
 <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {[
 { title: 'Rental', desc: 'Cash flow, cap rate, and ROI on buy-and-hold.', icon: 'R' },
 { title: 'Fix & Flip', desc: 'Profit after rehab, holding, and selling costs.', icon: 'F' },
 { title: 'Seller Net Sheet', desc: 'What the seller actually walks away with.', icon: 'S' },
 { title: 'Builder ROI', desc: 'Return on a ground-up or spec build.', icon: 'B' },
 {
 title: 'Buyer Affordability',
 desc: 'What a client can really afford with cash on hand.',
 icon: 'A',
 featured: true,
 },
 ].map((card) => (
 <article
 key={card.title}
 className={`rounded-3xl border bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 transition hover:-translate-y-1 hover:bg-slate-900 ${
 card.featured
 ? 'border-gold/50'
 : 'border-slate-800 hover:border-gold/40'
 }`}
 >
 <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-sm font-semibold text-gold-light">
 {card.icon}
 </div>
 <h3 className="text-xl font-semibold text-white">{card.title}</h3>
 <p className="mt-2 text-slate-300">{card.desc}</p>
 </article>
 ))}
 </div>
 </section>

 <section className="grid gap-4 py-8 sm:grid-cols-2 sm:py-12">
 <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
 <h3 className="text-xl font-semibold text-white">Client-ready sheets</h3>
 <p className="mt-2 text-slate-300">
 Export polished, print-ready deal sheets for clients and partners.
 </p>
 </article>
 <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
 <h3 className="text-xl font-semibold text-white">Save your deals</h3>
 <p className="mt-2 text-slate-300">
 Keep every analysis in your account and pick up where you left off.
 </p>
 </article>
 </section>

 <section id="pricing" className="py-10 sm:py-14">
 <h2 className="text-center text-3xl font-semibold text-white sm:text-4xl">Simple pricing</h2>
 <div className="mx-auto mt-8 grid max-w-4xl gap-5 sm:grid-cols-2">
 <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7">
 <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Free</p>
 <p className="mt-4 text-4xl font-semibold text-white">$0</p>
 <ul className="mt-5 space-y-2 text-slate-300">
 <li>All five calculators</li>
 <li>Unlimited use</li>
 </ul>
 </article>

 <article className="relative rounded-3xl border border-gold/50 bg-slate-900/80 p-7 shadow-xl shadow-gold/10">
 <span className="absolute -top-3 right-5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">
 Most popular
 </span>
 <p className="text-sm uppercase tracking-[0.25em] text-gold-light">Pro</p>
 <p className="mt-4 text-4xl font-semibold text-white">$20<span className="text-lg text-slate-300">/mo</span></p>
 <ul className="mt-5 space-y-2 text-slate-300">
 <li>Save unlimited deals</li>
 <li>Export professional sheets</li>
 </ul>
 </article>
 </div>

 <div className="mt-8 text-center">
 <Link
 href="/auth/signup"
 className="inline-flex items-center justify-center rounded-2xl bg-gold px-6 py-3 font-semibold text-gold-dark transition hover:bg-gold/90"
 >
 Sign up free
 </Link>
 </div>
 </section>
 </div>
 </main>
 );
}
