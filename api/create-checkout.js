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
    const { priceId, familyId, userId } = req.body

    if (!priceId || !familyId || !userId) {
      return res.status(400).json({ error: 'priceId, familyId, and userId are required' })
    }

    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://sundaydinnermemories.com'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?subscription=success`,
      cancel_url: `${origin}/pricing`,
      metadata: { familyId, userId },
      client_reference_id: familyId,
    })

    Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
    return res.status(200).json({ sessionId: session.id })
  } catch (error) {
    console.error('Create checkout error:', error)
    Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    })
  }
}
