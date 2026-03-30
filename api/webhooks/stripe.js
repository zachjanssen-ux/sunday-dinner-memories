import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRICE_TO_TIER = {
  'price_1TEhfLFSvGIfcR4rY7i8BF6a': 'starter',
  'price_1TEhjQFSvGIfcR4rO51y7KiO': 'homemade',
  'price_1TEhnDFSvGIfcR4rlnzpc1PF': 'heirloom',
}

// Add-on pack price IDs
const ADDON_PRICES = {
  'price_1TGTTVFSvGIfcR4rofPmh0cQ': { type: 'audio', bonusMinutes: 120 },
  'price_1TGTWNFSvGIfcR4rDkEKFXsC': { type: 'scan', bonusScans: 50 },
}

// Use the service role key for webhook operations (bypasses RLS)
// Falls back to anon key if service role not set
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

// Direct fetch helper — avoids importing the Supabase client
async function supabaseUpsert(table, data, onConflict) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': `resolution=merge-duplicates${onConflict ? `,on_conflict=${onConflict}` : ''}`,
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.text()
    console.error(`Supabase upsert ${table} error:`, err)
  }
  return response.ok
}

async function supabaseUpdate(table, data, filter) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
  for (const [key, value] of Object.entries(filter)) {
    url.searchParams.set(key, `eq.${value}`)
  }
  const response = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.text()
    console.error(`Supabase update ${table} error:`, err)
  }
  return response.ok
}

async function supabaseQuery(table, filter) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
  url.searchParams.set('select', '*')
  for (const [key, value] of Object.entries(filter)) {
    url.searchParams.set(key, `eq.${value}`)
  }
  url.searchParams.set('limit', '1')
  const response = await fetch(url.toString(), {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Accept': 'application/json',
    },
  })
  if (!response.ok) return null
  const data = await response.json()
  return data?.[0] || null
}

// Vercel serverless functions need raw body for Stripe webhook verification
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

  console.log(`Stripe webhook received: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const familyId = session.metadata?.familyId || session.client_reference_id
        const subscriptionId = session.subscription
        const customerId = session.customer

        if (!familyId || familyId === 'pending') {
          console.log('No familyId in checkout session metadata, skipping')
          break
        }

        // --- One-time payment (e.g. Extra Scan Pack) ---
        if (!subscriptionId) {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
          const priceId = lineItems.data[0]?.price?.id

          const addon = priceId ? ADDON_PRICES[priceId] : null
          if (addon) {
            console.log(`Add-on one-time purchase: family=${familyId}, type=${addon.type}, price=${priceId}`)
            // Fetch current usage to increment bonus
            const currentUsage = await supabaseQuery('usage_tracking', { family_id: familyId })
            if (addon.type === 'scan') {
              const currentBonus = currentUsage?.bonus_scans || 0
              await supabaseUpdate('usage_tracking', {
                bonus_scans: currentBonus + addon.bonusScans,
                last_updated: new Date().toISOString(),
              }, { family_id: familyId })
              console.log(`Added ${addon.bonusScans} bonus scans for family ${familyId} (total: ${currentBonus + addon.bonusScans})`)
            } else if (addon.type === 'audio') {
              const currentBonus = currentUsage?.bonus_audio_minutes || 0
              await supabaseUpdate('usage_tracking', {
                bonus_audio_minutes: currentBonus + addon.bonusMinutes,
                last_updated: new Date().toISOString(),
              }, { family_id: familyId })
              console.log(`Added ${addon.bonusMinutes} bonus audio minutes for family ${familyId}`)
            }
          } else {
            console.log('One-time payment with unknown price, skipping')
          }
          break
        }

        // --- Recurring subscription ---
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = sub.items.data[0]?.price?.id

        // Check if this is a recurring add-on (Audio Storage Pack) vs a plan subscription
        const addon = priceId ? ADDON_PRICES[priceId] : null
        if (addon) {
          console.log(`Add-on subscription started: family=${familyId}, type=${addon.type}, price=${priceId}`)
          const currentUsage = await supabaseQuery('usage_tracking', { family_id: familyId })
          if (addon.type === 'audio') {
            const currentBonus = currentUsage?.bonus_audio_minutes || 0
            await supabaseUpdate('usage_tracking', {
              bonus_audio_minutes: currentBonus + addon.bonusMinutes,
              last_updated: new Date().toISOString(),
            }, { family_id: familyId })
            console.log(`Added ${addon.bonusMinutes} bonus audio minutes for family ${familyId}`)
          } else if (addon.type === 'scan') {
            const currentBonus = currentUsage?.bonus_scans || 0
            await supabaseUpdate('usage_tracking', {
              bonus_scans: currentBonus + addon.bonusScans,
              last_updated: new Date().toISOString(),
            }, { family_id: familyId })
            console.log(`Added ${addon.bonusScans} bonus scans for family ${familyId}`)
          }
          break
        }

        // --- Regular plan subscription ---
        const planTier = PRICE_TO_TIER[priceId] || 'starter'

        console.log(`Creating subscription: family=${familyId}, tier=${planTier}, price=${priceId}`)

        // Upsert subscription record
        await supabaseUpsert('user_subscriptions', {
          family_id: familyId,
          plan_tier: planTier,
          status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }, 'family_id')

        // Initialize usage tracking
        await supabaseUpsert('usage_tracking', {
          family_id: familyId,
          scan_count: 0,
          api_credit_spent: 0,
          billing_period_start: new Date(sub.current_period_start * 1000).toISOString().split('T')[0],
          last_updated: new Date().toISOString(),
        }, 'family_id')

        console.log(`Subscription created successfully for family ${familyId}`)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription

        if (!subscriptionId) break

        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = sub.items.data[0]?.price?.id

        // Check if this invoice is for a recurring add-on (Audio Storage Pack)
        const addon = priceId ? ADDON_PRICES[priceId] : null
        if (addon) {
          // For recurring add-ons, top up the bonus on each renewal
          // Find the family via checkout metadata or customer lookup
          const familyId = invoice.subscription_details?.metadata?.familyId
            || sub.metadata?.familyId

          if (familyId) {
            const currentUsage = await supabaseQuery('usage_tracking', { family_id: familyId })
            if (addon.type === 'audio') {
              const currentBonus = currentUsage?.bonus_audio_minutes || 0
              await supabaseUpdate('usage_tracking', {
                bonus_audio_minutes: currentBonus + addon.bonusMinutes,
                last_updated: new Date().toISOString(),
              }, { family_id: familyId })
              console.log(`Audio pack renewal: +${addon.bonusMinutes} min for family ${familyId}`)
            }
          } else {
            console.log('Add-on invoice.paid but no familyId found in metadata')
          }
          break
        }

        // --- Regular plan renewal ---
        const planTier = PRICE_TO_TIER[priceId] || 'starter'

        // Find the family by stripe_subscription_id
        const existingSub = await supabaseQuery('user_subscriptions', {
          stripe_subscription_id: subscriptionId,
        })

        if (existingSub) {
          // Update subscription period
          await supabaseUpdate('user_subscriptions', {
            plan_tier: planTier,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            status: 'active',
          }, { family_id: existingSub.family_id })

          // Reset usage for new billing period (but NOT bonus — bonuses persist)
          await supabaseUpdate('usage_tracking', {
            scan_count: 0,
            api_credit_spent: 0,
            billing_period_start: new Date(sub.current_period_start * 1000).toISOString().split('T')[0],
            last_updated: new Date().toISOString(),
          }, { family_id: existingSub.family_id })
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const priceId = sub.items.data[0]?.price?.id

        // Skip add-on subscriptions — they don't affect the plan tier
        if (ADDON_PRICES[priceId]) {
          console.log(`Add-on subscription updated (${priceId}), skipping tier change`)
          break
        }

        const planTier = PRICE_TO_TIER[priceId] || 'starter'

        await supabaseUpdate('user_subscriptions', {
          plan_tier: planTier,
          status: sub.status === 'active' ? 'active' : sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }, { stripe_subscription_id: sub.id })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const priceId = sub.items.data[0]?.price?.id

        // If an add-on subscription is canceled, don't touch the main subscription status
        if (ADDON_PRICES[priceId]) {
          console.log(`Add-on subscription canceled (${priceId}), main plan unaffected`)
          break
        }

        await supabaseUpdate('user_subscriptions', {
          status: 'canceled',
        }, { stripe_subscription_id: sub.id })
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
        break
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return res.status(500).json({ error: 'Webhook handler failed' })
  }
}
