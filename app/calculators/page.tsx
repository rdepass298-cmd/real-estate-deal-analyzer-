import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
 title: 'HomesIQ',
 description: 'Analyze rental, fix and flip, seller net sheet, builder ROI, and buyer affordability scenarios.',
};

const cards = [
 { title: 'Rental Analysis', description: 'Estimate rental income, expenses, and cash flow.', href: '/rental' },
 { title: 'Fix and Flip', description: 'Evaluate renovation costs, resale value, and profit potential.', href: '/flip' },
 { title: 'Seller Net Sheet', description: 'Calculate seller proceeds after closing costs and commissions.', href: '/seller' },
 { title: 'Builder ROI', description: 'Model build costs, carry, and resale margins for spec or custom projects.', href: '/buyer' },
 { title: 'Buyer Affordability', description: 'Estimate max purchase price, monthly PITI, and closing cash position.', href: '/affordability' },
];

export default async function CalculatorsPage() {
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

 if (!session?.user) {
 redirect('/');
 }

 return (
 <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 sm:px-10">
 <div className="mx-auto max-w-6xl">
 <section className="mb-12 text-center">
 <p className="text-sm uppercase tracking-[0.3em] text-gold-light">Real estate tools</p>
 <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">HomesIQ</h1>
 <p className="mx-auto mt-4 max-w-2xl text-slate-300 sm:text-lg">
 Explore rental, flip, seller, builder ROI/new construction, and buyer affordability scenarios with fast, modern calculation tools tailored for investors.
 </p>
 </section>

 <section className="grid gap-6 sm:grid-cols-2">
 {cards.map((card) => (
 <Link
 key={card.title}
 href={card.href}
 className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-slate-950/20 transition hover:-translate-y-1 hover:border-gold/40 hover:bg-slate-900"
 >
 <h2 className="text-2xl font-semibold text-white">{card.title}</h2>
 <p className="mt-3 text-slate-300">{card.description}</p>
 </Link>
 ))}
 </section>
 </div>
 </main>
 );
}
