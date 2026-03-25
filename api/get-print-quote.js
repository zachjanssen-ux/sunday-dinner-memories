import { getPrintJobCost } from './_lib/lulu.js'

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

  const { LULU_CLIENT_KEY, LULU_CLIENT_SECRET } = process.env
  if (!LULU_CLIENT_KEY || !LULU_CLIENT_SECRET) {
    return res.status(503).json({
      error: 'Print quoting is not configured.',
      message: 'LULU_CLIENT_KEY and LULU_CLIENT_SECRET must be set.',
    })
  }

  const { pageCount, coverType, quantity, shippingAddress } = req.body

  if (!pageCount || !coverType || !quantity) {
    return res.status(400).json({
      error: 'Missing required fields: pageCount, coverType, quantity',
    })
  }

  try {
    const costData = await getPrintJobCost({
      coverType,
      quantity,
      pageCount,
      shippingAddress,
    })

    // Extract costs from Lulu response
    const lineItem = costData.line_item_costs?.[0] || {}
    const totalCostExclTax = parseFloat(lineItem.total_cost_excl_tax || costData.total_cost_excl_tax || '0')
    const shippingCost = parseFloat(costData.shipping_cost?.total_cost_excl_tax || costData.shipping_cost || '0')
    const luluBaseCost = parseFloat((totalCostExclTax).toFixed(2))
    const markupAmount = parseFloat((luluBaseCost * MARKUP_RATE).toFixed(2))
    const total = parseFloat((luluBaseCost + markupAmount + shippingCost).toFixed(2))

    return res.status(200).json({
      luluBaseCost,
      markupAmount,
      shippingCost,
      total,
      currency: 'USD',
      coverType,
      quantity,
      pageCount,
    })
  } catch (error) {
    console.error('Print quote error:', error)
    return res.status(500).json({
      error: 'Failed to get print quote',
      message: error.message,
    })
  }
}
