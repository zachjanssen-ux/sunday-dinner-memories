import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRICE_TO_TIER = {
  'price_1TEhfLFSvGIfcR4rY7i8BF6a': 'starter',
  'price_1TEhjQFSvGIfcR4rO51y7KiO': 'homemade',
  'price_1TEhnDFSvGIfcR4rlnzpc1PF': 'heirloom',
}

function getSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  )
}

// Vercel serverless functions need raw body for Stripe webhook verification.
// We export a config to disable body parsing.
export const config = {
  api: {
    bodyParser: false,
  },
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let event

  try {
    const rawBody = await getRawBody(req)
    const sig = req.headers['stripe-signature']

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  const supabase = getSupabase()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const familyId = session.metadata?.familyId || session.client_reference_id
        const userId = session.metadata?.userId
        const subscriptionId = session.subscription
        const customerId = session.customer

        // Fetch the subscription to get the price ID
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = sub.items.data[0]?.price?.id
        const planTier = PRICE_TO_TIER[priceId] || 'starter'

        // Upsert subscription record
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .upsert(
            {
              family_id: familyId,
              user_id: userId,
              plan_tier: planTier,
              status: 'active',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'family_id' }
          )

        if (subError) console.error('Error upserting subscription:', subError)

        // Initialize usage tracking
        const { error: usageError } = await supabase
          .from('usage_tracking')
          .upsert(
            {
              family_id: familyId,
              scans_used: 0,
              api_credits_used: 0,
              period_start: new Date(sub.current_period_start * 1000).toISOString(),
              period_end: new Date(sub.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'family_id' }
          )

        if (usageError) console.error('Error initializing usage:', usageError)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription

        if (!subscriptionId) break

        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = sub.items.data[0]?.price?.id
        const planTier = PRICE_TO_TIER[priceId] || 'starter'

        // Find the family by stripe_subscription_id
        const { data: existingSub } = await supabase
          .from('user_subscriptions')
          .select('family_id')
          .eq('stripe_subscription_id', subscriptionId)
          .maybeSingle()

        if (existingSub) {
          // Update subscription period
          await supabase
            .from('user_subscriptions')
            .update({
              plan_tier: planTier,
              current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('family_id', existingSub.family_id)

          // Reset usage for new billing period
          await supabase
            .from('usage_tracking')
            .update({
              scans_used: 0,
              api_credits_used: 0,
              period_start: new Date(sub.current_period_start * 1000).toISOString(),
              period_end: new Date(sub.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('family_id', existingSub.family_id)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const priceId = sub.items.data[0]?.price?.id
        const planTier = PRICE_TO_TIER[priceId] || 'starter'

        await supabase
          .from('user_subscriptions')
          .update({
            plan_tier: planTier,
            status: sub.status === 'active' ? 'active' : sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object

        await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      default:
        // Unhandled event type
        break
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return res.status(500).json({ error: 'Webhook handler failed' })
  }
}
