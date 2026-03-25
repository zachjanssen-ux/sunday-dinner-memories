import { createClient } from '@supabase/supabase-js'
import { createPrintJob, getPrintJobCost } from './_lib/lulu.js'

const MARKUP_RATE = 0.15

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

  const { LULU_CLIENT_KEY, LULU_CLIENT_SECRET, STRIPE_SECRET_KEY } = process.env
  if (!LULU_CLIENT_KEY || !LULU_CLIENT_SECRET) {
    return res.status(503).json({
      error: 'Print ordering is not configured.',
      message: 'LULU_CLIENT_KEY and LULU_CLIENT_SECRET must be set.',
    })
  }

  const {
    cookbookId,
    coverType,
    quantity,
    shippingAddress,
    isGift,
    giftMessage,
    contactEmail,
    userId,
    stripePaymentIntentId,
  } = req.body

  if (!cookbookId || !coverType || !quantity || !shippingAddress) {
    return res.status(400).json({
      error: 'Missing required fields: cookbookId, coverType, quantity, shippingAddress',
    })
  }

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    )

    // Fetch cookbook to get PDF URLs and metadata
    const { data: cookbook, error: cbError } = await supabase
      .from('printable_cookbooks')
      .select('*')
      .eq('id', cookbookId)
      .single()

    if (cbError || !cookbook) {
      return res.status(404).json({ error: 'Cookbook not found' })
    }

    // The cookbook should have cover_image_url for the cover PDF
    // and we need an interior PDF URL. These come from the cookbook export process.
    // For now we use the cover_image_url and assume an interior PDF is stored at a known path.
    const interiorPdfUrl = cookbook.interior_pdf_url || cookbook.export_url
    const coverPdfUrl = cookbook.cover_pdf_url || cookbook.cover_image_url

    if (!interiorPdfUrl) {
      return res.status(400).json({
        error: 'Cookbook does not have a generated PDF. Export the cookbook first.',
      })
    }

    // Create the Lulu print job
    const luluJob = await createPrintJob({
      interiorUrl: interiorPdfUrl,
      coverUrl: coverPdfUrl,
      title: cookbook.title || 'Family Cookbook',
      coverType,
      quantity,
      shippingAddress,
      contactEmail: contactEmail || 'orders@sundaydinnermemories.com',
    })

    // Extract costs from Lulu response
    const luluCosts = luluJob.costs || {}
    const luluBaseCost = parseFloat(luluCosts.total_cost_excl_tax || luluCosts.total_cost || '0')
    const shippingCost = parseFloat(luluCosts.shipping_cost || '0')
    const markupAmount = parseFloat((luluBaseCost * MARKUP_RATE).toFixed(2))
    const totalCharged = parseFloat((luluBaseCost + markupAmount + shippingCost).toFixed(2))

    // Store order in print_orders table
    const { data: order, error: orderError } = await supabase.from('print_orders').insert({
      cookbook_id: cookbookId,
      family_id: cookbook.family_id,
      ordered_by: userId || null,
      lulu_print_job_id: String(luluJob.id),
      cover_type: coverType,
      quantity,
      lulu_base_cost: luluBaseCost,
      markup_amount: markupAmount,
      shipping_cost: shippingCost,
      total_charged: totalCharged,
      stripe_payment_id: stripePaymentIntentId || null,
      shipping_address: shippingAddress,
      is_gift: isGift || false,
      gift_message: giftMessage || null,
      status: 'submitted',
    }).select().single()

    if (orderError) {
      console.error('Failed to store print order:', orderError)
      // Don't fail the whole request - the Lulu job was created
    }

    return res.status(200).json({
      orderId: order?.id || null,
      luluPrintJobId: luluJob.id,
      luluBaseCost,
      markupAmount,
      shippingCost,
      totalCharged,
      status: luluJob.status?.name || 'CREATED',
    })
  } catch (error) {
    console.error('Print order error:', error)
    return res.status(500).json({
      error: 'Failed to process print order',
      message: error.message,
    })
  }
}
