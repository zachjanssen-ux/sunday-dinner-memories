// Standalone auth token management — bypasses the Supabase JS client entirely
// to avoid the auth lock mechanism that causes hangs

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

function getStorageKey() {
  try {
    return `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`
  } catch {
    return 'sb-auth-token'
  }
}

function getStoredSession() {
  try {
    const stored = localStorage.getItem(getStorageKey())
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

function isTokenExpired(session) {
  if (!session?.expires_at) return true
  // Add 60 second buffer
  return Date.now() / 1000 > session.expires_at - 60
}

async function refreshToken(refreshToken) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) return null

    const data = await response.json()
    if (data.access_token) {
      // Update localStorage with new session
      const storageKey = getStorageKey()
      localStorage.setItem(storageKey, JSON.stringify(data))
      return data.access_token
    }
  } catch (err) {
    console.error('Token refresh failed:', err)
  }
  return null
}

/**
 * Get a valid access token, refreshing if expired.
 * Completely bypasses the Supabase JS client.
 */
export async function getValidToken() {
  const session = getStoredSession()

  if (!session?.access_token) {
    return SUPABASE_KEY // No session — use anon key
  }

  if (!isTokenExpired(session)) {
    return session.access_token // Token is still valid
  }

  // Token is expired — try to refresh
  if (session.refresh_token) {
    const newToken = await refreshToken(session.refresh_token)
    if (newToken) return newToken
  }

  // Refresh failed — return the expired token anyway
  // (the RPC is SECURITY DEFINER so it might still work with anon key)
  return session.access_token
}
