import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { priceId, familyId, userId, promoCode } = req.body

    if (!priceId || !familyId || !userId) {
      return res.status(400).json({ error: 'priceId, familyId, and userId are required' })
    }

    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://sundaydinnermemories.com'

    const sessionConfig = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?subscription=success`,
      cancel_url: `${origin}/pricing`,
      metadata: { familyId, userId },
      client_reference_id: familyId,
    }

    // If user entered a promo code, let Stripe validate it
    if (promoCode) {
      // Look up the promotion code in Stripe
      const promoCodes = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 })
      if (promoCodes.data.length > 0) {
        sessionConfig.discounts = [{ promotion_code: promoCodes.data[0].id }]
      } else {
        return res.status(400).json({ error: 'Invalid promo code' })
      }
    } else {
      // Allow promo code entry on the Stripe Checkout page too
      sessionConfig.allow_promotion_codes = true
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
    return res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Create checkout error:', error)
    Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    })
  }
}
