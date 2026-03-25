import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useAuthStore = create((set, get) => ({
  user: null,
  currentMember: null,
  currentFamily: null,
  loading: true,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    set({ user: data.user })
    await get().fetchMember(data.user.id)
    return data
  },

  signup: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    set({ user: data.user })
    return data
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null, currentMember: null, currentFamily: null })
  },

  fetchMember: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching member:', error)
        set({ currentMember: null, currentFamily: null })
        return
      }

      set({ currentMember: data })

      if (data?.family_id) {
        await get().fetchFamily(data.family_id)
      } else {
        set({ currentFamily: null })
      }
    } catch (err) {
      console.error('fetchMember exception:', err)
      set({ currentMember: null, currentFamily: null })
    }
  },

  fetchFamily: async (familyId) => {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single()

      if (error) {
        console.error('Error fetching family:', error)
        set({ currentFamily: null })
        return
      }

      set({ currentFamily: data })
    } catch (err) {
      console.error('fetchFamily exception:', err)
      set({ currentFamily: null })
    }
  },
}))

export default useAuthStore
