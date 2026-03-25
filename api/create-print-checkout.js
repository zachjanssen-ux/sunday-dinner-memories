import Stripe from 'stripe'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))
    return res.status(405).json({ error: 'Method not allowed' })
  }

  Object.keys(corsHeaders).forEach((key) => res.setHeader(key, corsHeaders[key]))

  const { STRIPE_SECRET_KEY } = process.env
  if (!STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe is not configured.' })
  }

  const {
    cookbookId,
    cookbookTitle,
    coverType,
    quantity,
    totalAmount, // in dollars (e.g. 29.95)
    shippingAddress,
    isGift,
    giftMessage,
    contactEmail,
    userId,
  } = req.body

  if (!cookbookId || !totalAmount || !coverType || !quantity) {
    return res.status(400).json({
      error: 'Missing required fields: cookbookId, totalAmount, coverType, quantity',
    })
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY)
    const origin =
      req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://sundaydinnermemories.com'

    // Amount in cents for Stripe
    const amountCents = Math.round(totalAmount * 100)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Printed Cookbook: ${cookbookTitle || 'Family Cookbook'}`,
              description: `${coverType === 'hardcover' ? 'Hardcover' : 'Softcover'} - Qty ${quantity} - 6"x9"`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        cookbookId,
        coverType,
        quantity: String(quantity),
        isGift: String(isGift || false),
        giftMessage: giftMessage || '',
        shippingAddress: JSON.stringify(shippingAddress),
        contactEmail: contactEmail || '',
        userId: userId || '',
      },
      success_url: `${origin}/dashboard/cookbooks?print=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/cookbooks?print=cancelled`,
      customer_email: contactEmail || undefined,
    })

    return res.status(200).json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Create print checkout error:', error)
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    })
  }
}
