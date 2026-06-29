import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type PaidStatus = {
  isAuthenticated: boolean;
  isPaid: boolean;
  userId: string | null;
};

export async function getPaidStatusFromAccessToken(token: string): Promise<PaidStatus> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  const authSupabase = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: userError,
  } = await authSupabase.auth.getUser(token);

  if (userError || !user) {
    return {
      isAuthenticated: false,
      isPaid: false,
      userId: null,
    };
  }

  const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: profile, error: profileError } = await userSupabase
    .from('profiles')
    .select('is_paid')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    isAuthenticated: true,
    isPaid: Boolean(profile?.is_paid),
    userId: user.id,
  };
}

export async function getPaidStatusFromServerCookies(): Promise<PaidStatus> {
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
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      isAuthenticated: false,
      isPaid: false,
      userId: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_paid')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    isAuthenticated: true,
    isPaid: Boolean(profile?.is_paid),
    userId: user.id,
  };
}
