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
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching member:', error)
      return
    }

    set({ currentMember: data })

    if (data?.family_id) {
      await get().fetchFamily(data.family_id)
    }
  },

  fetchFamily: async (familyId) => {
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single()

    if (error) {
      console.error('Error fetching family:', error)
      return
    }

    set({ currentFamily: data })
  },
}))

export default useAuthStore
