import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '[unserializable]';
  }
}

function extractJwtRole(jwt: string) {
  try {
    const payloadPart = jwt.split('.')[1];
    if (!payloadPart) {
      return null;
    }

    const decoded = Buffer.from(payloadPart, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded) as { role?: string };
    return parsed.role || null;
  } catch {
    return null;
  }
}

async function setPaidStatusForUser(userId: string, isPaid: boolean) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase admin environment variables.');
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { error, count } = await supabaseAdmin
    .from('profiles')
    .update({ is_paid: isPaid })
    .eq('id', userId)
    .select('id', { count: 'exact', head: true });

  if (error) {
    throw new Error(
      `Supabase profile update failed. userId=${userId}, isPaid=${isPaid}, message=${error.message}, details=${error.details || 'n/a'}, hint=${error.hint || 'n/a'}`
    );
  }

  if (!count || count < 1) {
    console.warn(
      `[stripe-webhook] profile row not found for user ${userId}. Update succeeded but matched 0 rows.`
    );
  }
}

async function resolveUserIdFromSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<string | null> {
  const metadataUserId = subscription.metadata?.supabase_user_id;
  if (metadataUserId) {
    return metadataUserId;
  }

  const subscriptionId = typeof subscription.id === 'string' ? subscription.id : null;
  if (!subscriptionId) {
    return null;
  }

  const sessions = await stripe.checkout.sessions.list({
    subscription: subscriptionId,
    limit: 1,
  });

  const checkoutSession = sessions.data[0];
  if (checkoutSession?.client_reference_id) {
    return checkoutSession.client_reference_id;
  }

  return null;
}

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey || !stripeWebhookSecret || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: 'Missing required webhook environment variables.' },
      { status: 500 }
    );
  }

  console.log('[stripe-webhook] env check:', {
    hasStripeSecret: Boolean(stripeSecretKey),
    hasWebhookSecret: Boolean(stripeWebhookSecret),
    hasSupabaseServiceRoleKey: Boolean(supabaseServiceRoleKey),
    supabaseServiceRoleJwtRole: extractJwtRole(supabaseServiceRoleKey),
  });

  const stripe = new Stripe(stripeSecretKey);
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid Stripe signature.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        try {
          const session = event.data.object as Stripe.Checkout.Session;

          console.log(
            '[stripe-webhook] checkout.session.completed session payload:',
            safeJson(session)
          );

          const userId = session.client_reference_id || session.metadata?.supabase_user_id;

          console.log('[stripe-webhook] checkout.session.completed identifier check:', {
            sessionId: session.id,
            client_reference_id: session.client_reference_id,
            metadata_supabase_user_id: session.metadata?.supabase_user_id || null,
            resolvedUserId: userId || null,
          });

          if (!userId) {
            console.warn('[stripe-webhook] checkout.session.completed missing user id reference');
            break;
          }

          await setPaidStatusForUser(userId, true);
          console.log(
            `[stripe-webhook] checkout.session.completed processed: set is_paid=true for user ${userId}`
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown checkout completion error.';
          const stack = error instanceof Error ? error.stack : undefined;
          console.error('[stripe-webhook] checkout.session.completed error:', message);
          if (stack) {
            console.error('[stripe-webhook] checkout.session.completed stack:', stack);
          }
          throw error;
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await resolveUserIdFromSubscription(stripe, subscription);

        if (!userId) {
          console.warn('[stripe-webhook] customer.subscription.deleted could not resolve user id');
          break;
        }

        await setPaidStatusForUser(userId, false);
        console.log(
          `[stripe-webhook] customer.subscription.deleted processed: set is_paid=false for user ${userId}`
        );
        break;
      }

      default: {
        console.log(`[stripe-webhook] Ignored event type: ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook handler failed.';
    console.error('[stripe-webhook] Handler error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
