import { useEffect } from 'react'
import useAuthStore from '../store/authStore'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const store = useAuthStore()

  useEffect(() => {
    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        store.setUser(session.user)
        store.fetchMember(session.user.id)
      }
      store.setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          store.setUser(session.user)
          await store.fetchMember(session.user.id)
        } else {
          store.setUser(null)
        }
        store.setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return store
}
