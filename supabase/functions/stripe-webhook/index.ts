import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

function getPlanFromPriceId(priceId: string): string {
  const STARTER = Deno.env.get('STRIPE_PRICE_STARTER') || '';
  const PRO = Deno.env.get('STRIPE_PRICE_PRO') || '';
  const AGENCY = Deno.env.get('STRIPE_PRICE_AGENCY') || '';
  if (priceId === STARTER) return 'starter';
  if (priceId === PRO) return 'pro';
  if (priceId === AGENCY) return 'agency';
  return 'free';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
  const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return new Response('Stripe not configured', { status: 500 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  const supabaseHeaders = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY!,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  async function upsertSubscription(sub: Stripe.Subscription) {
    const userId = sub.metadata?.supabase_user_id;
    if (!userId) {
      console.warn('No supabase_user_id in subscription metadata', sub.id);
      return;
    }

    const priceId = sub.items.data[0]?.price?.id || '';
    const plan = getPlanFromPriceId(priceId);

    await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: supabaseHeaders,
      body: JSON.stringify({
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        plan,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      }),
    });

    console.log(`Updated subscription for user ${userId}: plan=${plan}, status=${sub.status}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (userId) {
          await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${userId}`, {
            method: 'PATCH',
            headers: supabaseHeaders,
            body: JSON.stringify({
              plan: 'free',
              status: 'canceled',
              stripe_subscription_id: null,
              stripe_price_id: null,
              updated_at: new Date().toISOString(),
            }),
          });
          console.log(`Subscription canceled for user ${userId}, downgraded to free`);
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession;
        if (session.mode === 'subscription' && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await upsertSubscription(sub);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});
