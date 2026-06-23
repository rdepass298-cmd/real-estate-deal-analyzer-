import { supabase } from '@/lib/supabaseClient';

type EnsureProfileParams = {
  id: string;
  email: string;
};

export async function ensureProfile({ id, email }: EnsureProfileParams) {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id,
        email,
        is_paid: false,
      },
      {
        onConflict: 'id',
      }
    );

  if (error) {
    throw new Error(error.message);
  }
}
