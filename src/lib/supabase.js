import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Custom lock that skips the Navigator Lock API to avoid contention errors
    lock: async (name, acquireTimeout, fn) => {
      return await fn()
    },
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
