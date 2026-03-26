// Direct fetch wrapper for Supabase PostgREST
// Bypasses the Supabase JS client's auth lock mechanism which causes hangs
// Uses the user's access token for auth but goes directly to the REST API

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

import { supabase } from './supabase'

async function getAccessToken() {
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token || supabaseKey
  } catch {
    return supabaseKey
  }
}

function headers(token) {
  return {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Prefer': 'return=representation',
  }
}

// Call an RPC function
export async function rpc(functionName, params) {
  const token = await getAccessToken()
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.message || errData.error || `RPC ${functionName} failed (${response.status})`)
  }

  return response.json()
}

// Query a table with select, filters, ordering
export async function query(table, { select = '*', filters = {}, order, single = false } = {}) {
  const token = await getAccessToken()
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`)
  url.searchParams.set('select', select)

  for (const [key, value] of Object.entries(filters)) {
    url.searchParams.set(key, value)
  }

  if (order) {
    url.searchParams.set('order', order)
  }

  const reqHeaders = headers(token)
  if (single) {
    reqHeaders['Accept'] = 'application/vnd.pgrst.object+json'
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: reqHeaders,
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.message || errData.error || `Query ${table} failed (${response.status})`)
  }

  return response.json()
}

// Insert into a table
export async function insert(table, data) {
  const token = await getAccessToken()
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.message || errData.error || `Insert ${table} failed (${response.status})`)
  }

  return response.json()
}

// Update rows in a table
export async function update(table, data, filters = {}) {
  const token = await getAccessToken()
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`)
  for (const [key, value] of Object.entries(filters)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString(), {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.message || errData.error || `Update ${table} failed (${response.status})`)
  }

  return response.json()
}

// Delete from a table
export async function remove(table, filters = {}) {
  const token = await getAccessToken()
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`)
  for (const [key, value] of Object.entries(filters)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: headers(token),
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.message || errData.error || `Delete ${table} failed (${response.status})`)
  }

  return true
}
