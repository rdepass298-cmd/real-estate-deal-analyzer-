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
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10 sm:px-10">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Real estate tools</p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">Real Estate Analyzer</h1>
        <p className="mt-4 max-w-xl text-slate-300 sm:text-lg">
          Analyze rental, fix and flip, seller net sheet, and builder ROI/new construction scenarios with fast, modern
          calculation tools tailored for investors.
        </p>

        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
          >
            Log In
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white transition hover:from-cyan-600 hover:to-blue-600"
          >
            Sign Up
          </Link>
          <Link
            href="/calculators"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-3 font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
          >
            Use the Free Version
          </Link>
        </div>
      </div>
    </main>
  );
}
