import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const PLAN_LIMITS = {
  starter: {
    scansPerMonth: 30,
    apiCreditCap: null,
    aiSearch: false,
    mealPlan: false,
    shoppingList: false,
    cookbookBuilder: false,
    imageGen: false,
  },
  homemade: {
    scansPerMonth: 100,
    apiCreditCap: 4.0,
    aiSearch: true,
    mealPlan: true,
    shoppingList: true,
    cookbookBuilder: false,
    imageGen: false,
  },
  heirloom: {
    scansPerMonth: Infinity,
    apiCreditCap: 7.0,
    aiSearch: true,
    mealPlan: true,
    shoppingList: true,
    cookbookBuilder: true,
    imageGen: true,
  },
}

// Features and which plan unlocks them
const FEATURE_PLAN_MAP = {
  aiSearch: 'homemade',
  mealPlan: 'homemade',
  shoppingList: 'homemade',
  cookbookBuilder: 'heirloom',
  imageGen: 'heirloom',
}

const useSubscriptionStore = create((set, get) => ({
  subscription: null,
  usage: null,
  loading: false,

  fetchSubscription: async (familyId) => {
    if (!familyId) return
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'active')
        .maybeSingle()

      if (error) throw error
      set({ subscription: data })
    } catch (err) {
      console.error('Error fetching subscription:', err)
      set({ subscription: null })
    } finally {
      set({ loading: false })
    }
  },

  fetchUsage: async (familyId) => {
    if (!familyId) return
    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('family_id', familyId)
        .maybeSingle()

      if (error) throw error
      set({ usage: data })
    } catch (err) {
      console.error('Error fetching usage:', err)
      set({ usage: null })
    }
  },

  getPlanLimits: () => {
    const { subscription } = get()
    const tier = subscription?.plan_tier || null
    if (!tier || !PLAN_LIMITS[tier]) return null
    return PLAN_LIMITS[tier]
  },

  isFeatureAllowed: (feature) => {
    const { subscription } = get()
    const tier = subscription?.plan_tier || null
    if (!tier || !PLAN_LIMITS[tier]) return false
    return !!PLAN_LIMITS[tier][feature]
  },

  getUsagePercentage: () => {
    const { subscription, usage } = get()
    if (!subscription || !usage) return { scans: 0, credits: 0 }

    const limits = PLAN_LIMITS[subscription.plan_tier]
    if (!limits) return { scans: 0, credits: 0 }

    const scanPct =
      limits.scansPerMonth === Infinity
        ? 0
        : Math.min(100, Math.round(((usage.scans_used || 0) / limits.scansPerMonth) * 100))

    const creditPct =
      !limits.apiCreditCap
        ? 0
        : Math.min(100, Math.round(((usage.api_credits_used || 0) / limits.apiCreditCap) * 100))

    return { scans: scanPct, credits: creditPct }
  },

  getRequiredPlan: (feature) => {
    return FEATURE_PLAN_MAP[feature] || 'homemade'
  },

  PLAN_LIMITS,
}))

export default useSubscriptionStore
