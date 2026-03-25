import { useEffect, useRef } from 'react'
import useAuthStore from '../store/authStore'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const store = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    // Listen for auth changes — this handles INITIAL_SESSION too
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            store.setUser(session.user)
            await store.fetchMember(session.user.id)
          } else {
            store.setUser(null)
            useAuthStore.setState({ currentMember: null, currentFamily: null })
          }
        } catch (err) {
          console.error('Auth state change error:', err)
        } finally {
          // Always stop loading, no matter what happens
          if (!initialized.current) {
            initialized.current = true
            store.setLoading(false)
          }
        }
      }
    )

    // Safety net: if onAuthStateChange never fires, stop loading after 3 seconds
    const timeout = setTimeout(() => {
      if (!initialized.current) {
        initialized.current = true
        store.setLoading(false)
      }
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  return store
}
