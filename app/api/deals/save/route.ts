import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPaidStatusFromAccessToken } from '@/lib/server/authz';

type SaveDealPayload = {
  dealType?: string;
  name?: string;
  inputs?: Record<string, number | string | boolean>;
  results?: Record<string, number | string | boolean>;
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized request.' }, { status: 401 });
    }

    const status = await getPaidStatusFromAccessToken(token);

    if (!status.isAuthenticated || !status.userId) {
      return NextResponse.json({ error: 'Unauthorized request.' }, { status: 401 });
    }

    if (!status.isPaid) {
      return NextResponse.json(
        {
          error: 'Saving deals is a Pro feature. Upgrade to continue.',
          code: 'PRO_REQUIRED',
          upgradeUrl: '/upgrade',
        },
        { status: 403 }
      );
    }

    const body = (await req.json()) as SaveDealPayload;
    const dealType = body.dealType?.trim();
    const name = body.name?.trim();

    if (!dealType || !body.inputs || !body.results) {
      return NextResponse.json({ error: 'Missing required deal data.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Missing Supabase environment variables.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { error } = await supabase.from('deals').insert({
      user_id: status.userId,
      deal_type: dealType,
      name: name || `${dealType} deal`,
      inputs: body.inputs,
      results: body.results,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ saved: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
