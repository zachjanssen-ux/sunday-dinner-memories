import { getPrintJobStatus } from './_lib/lulu.js'

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
    return res.status(503).json({ error: 'Lulu API not configured.' })
  }

  const { luluPrintJobId } = req.body

  if (!luluPrintJobId) {
    return res.status(400).json({ error: 'Missing luluPrintJobId' })
  }

  try {
    const job = await getPrintJobStatus(luluPrintJobId)

    const status = job.status?.name || 'UNKNOWN'
    const trackingUrl = job.line_items?.[0]?.tracking_urls?.[0] || null

    return res.status(200).json({
      luluPrintJobId: job.id,
      status,
      trackingUrl,
      estimatedShipDate: job.estimated_shipping_dates?.arrival_min || null,
      lineItems: (job.line_items || []).map((li) => ({
        title: li.title,
        quantity: li.quantity,
        trackingUrls: li.tracking_urls || [],
      })),
    })
  } catch (error) {
    console.error('Check print status error:', error)
    return res.status(500).json({
      error: 'Failed to check print status',
      message: error.message,
    })
  }
}
