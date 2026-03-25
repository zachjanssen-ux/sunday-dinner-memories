const LULU_BASE_URL = 'https://api.lulu.com'
const LULU_TOKEN_URL = `${LULU_BASE_URL}/auth/realms/glasstree/protocol/openid-connect/token`

// Pod package IDs for 6x9 books
const POD_PACKAGES = {
  softcover: '0600X0900BWSTDPB060UW444MNG', // Perfect bound
  hardcover: '0600X0900BWSTDCW060UW444MNG', // Case wrap
}

/**
 * Get Lulu OAuth2 access token via client credentials flow
 */
async function getLuluToken() {
  const response = await fetch(LULU_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.LULU_CLIENT_KEY,
      client_secret: process.env.LULU_CLIENT_SECRET,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Lulu auth failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  return data.access_token
}

/**
 * Create a Lulu print job
 * @param {Object} opts
 * @param {string} opts.interiorUrl - URL to the interior PDF
 * @param {string} opts.coverUrl - URL to the cover PDF
 * @param {string} opts.title - Book title
 * @param {string} opts.coverType - 'hardcover' or 'softcover'
 * @param {number} opts.quantity - Number of copies
 * @param {Object} opts.shippingAddress - Shipping address object
 * @param {string} opts.contactEmail - Contact email
 * @returns {Object} Lulu print job response
 */
async function createPrintJob({ interiorUrl, coverUrl, title, coverType, quantity, shippingAddress, contactEmail }) {
  const token = await getLuluToken()
  const podPackageId = POD_PACKAGES[coverType] || POD_PACKAGES.softcover

  const body = {
    line_items: [
      {
        title,
        cover: { source_url: coverUrl },
        interior: { source_url: interiorUrl },
        pod_package_id: podPackageId,
        quantity,
      },
    ],
    shipping_address: {
      name: shippingAddress.name,
      street1: shippingAddress.line1 || shippingAddress.street1,
      street2: shippingAddress.line2 || shippingAddress.street2 || undefined,
      city: shippingAddress.city,
      state_code: shippingAddress.state || shippingAddress.state_code,
      country_code: shippingAddress.country_code || 'US',
      postcode: shippingAddress.zip || shippingAddress.postcode,
    },
    contact_email: contactEmail,
  }

  const response = await fetch(`${LULU_BASE_URL}/print-jobs/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Lulu create print job failed (${response.status}): ${text}`)
  }

  return response.json()
}

/**
 * Get cost estimate for a print job using Lulu's print-job-cost-calculations endpoint.
 * This does NOT create a real print job.
 */
async function getPrintJobCost({ coverType, quantity, pageCount, shippingAddress }) {
  const token = await getLuluToken()
  const podPackageId = POD_PACKAGES[coverType] || POD_PACKAGES.softcover

  const body = {
    line_items: [
      {
        page_count: pageCount,
        pod_package_id: podPackageId,
        quantity,
      },
    ],
    shipping_address: {
      name: shippingAddress?.name || 'Quote',
      street1: shippingAddress?.line1 || shippingAddress?.street1 || '123 Main St',
      city: shippingAddress?.city || 'Minneapolis',
      state_code: shippingAddress?.state || shippingAddress?.state_code || 'MN',
      country_code: shippingAddress?.country_code || 'US',
      postcode: shippingAddress?.zip || shippingAddress?.postcode || '55401',
    },
  }

  const response = await fetch(`${LULU_BASE_URL}/print-job-cost-calculations/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Lulu cost calculation failed (${response.status}): ${text}`)
  }

  return response.json()
}

/**
 * Get status of an existing print job
 */
async function getPrintJobStatus(printJobId) {
  const token = await getLuluToken()

  const response = await fetch(`${LULU_BASE_URL}/print-jobs/${printJobId}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Lulu get print job failed (${response.status}): ${text}`)
  }

  return response.json()
}

export { getLuluToken, createPrintJob, getPrintJobCost, getPrintJobStatus, POD_PACKAGES }
