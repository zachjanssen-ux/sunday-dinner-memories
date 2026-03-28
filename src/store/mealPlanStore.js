import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function getToken() {
  try {
    // Try refreshing the session first to handle expired JWTs
    const { data } = await supabase.auth.refreshSession()
    if (data?.session?.access_token) {
      return data.session.access_token
    }
  } catch {}
  // Fall back to localStorage
  try {
    const storageKey = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.access_token || SUPABASE_KEY
    }
  } catch {}
  return SUPABASE_KEY
}

async function directInsert(table, data) {
  const token = await getToken()
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || `Insert failed (${response.status})`)
  }
  return response.json()
}

async function directUpdate(table, id, updates) {
  const token = await getToken()
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || `Update failed (${response.status})`)
  }
  return response.json()
}

async function directDelete(table, id) {
  const token = await getToken()
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || `Delete failed (${response.status})`)
  }
}

const ITEMS_SELECT = `
  *,
  recipes (
    id, title, category, cuisine, original_image_url, prep_time_min, cook_time_min,
    recipe_ingredients ( id, ingredient_id, quantity, quantity_numeric, unit, notes, sort_order )
  )
`

const useMealPlanStore = create((set, get) => ({
  currentPlan: null,
  planItems: [],
  plans: [],
  loading: false,

  fetchPlans: async (familyId) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('family_id', familyId)
        .order('start_date', { ascending: false })

      if (error) throw error
      set({ plans: data || [], loading: false })
    } catch (err) {
      console.error('Error fetching meal plans:', err)
      set({ loading: false })
    }
  },

  fetchPlan: async (planId) => {
    set({ loading: true })
    try {
      const { data: plan, error: planError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (planError) throw planError

      const { data: items, error: itemsError } = await supabase
        .from('meal_plan_items')
        .select(ITEMS_SELECT)
        .eq('meal_plan_id', planId)
        .order('date', { ascending: true })

      if (itemsError) throw itemsError

      set({ currentPlan: plan, planItems: items || [], loading: false })
    } catch (err) {
      console.error('Error fetching plan:', err)
      set({ loading: false })
    }
  },

  createPlan: async (data) => {
    // Use direct fetch for INSERT to avoid auth lock hang
    await directInsert('meal_plans', data)

    // Re-fetch plans to get the new one with server-generated fields
    const { data: plans, error: fetchErr } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('family_id', data.family_id)
      .order('start_date', { ascending: false })

    if (fetchErr) throw fetchErr

    const plan = plans?.[0] || { ...data, id: null }
    set({ plans: plans || [], currentPlan: plan, planItems: [] })
    return plan
  },

  updatePlan: async (id, updates) => {
    // Use direct fetch for UPDATE to avoid auth lock hang
    await directUpdate('meal_plans', id, updates)

    const { plans, currentPlan } = get()
    set({
      plans: plans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      currentPlan: currentPlan?.id === id ? { ...currentPlan, ...updates } : currentPlan,
    })
  },

  deletePlan: async (id) => {
    // Use direct fetch for DELETE to avoid auth lock hang
    // Items will cascade delete via DB
    await directDelete('meal_plans', id)

    const { plans, currentPlan } = get()
    set({
      plans: plans.filter((p) => p.id !== id),
      currentPlan: currentPlan?.id === id ? null : currentPlan,
      planItems: currentPlan?.id === id ? [] : get().planItems,
    })
  },

  addItem: async (item) => {
    // Use direct fetch for INSERT to avoid auth lock hang
    await directInsert('meal_plan_items', item)

    // Re-fetch all items for this plan to get the new one with joins
    const { data: items } = await supabase
      .from('meal_plan_items')
      .select(ITEMS_SELECT)
      .eq('meal_plan_id', item.meal_plan_id)
      .order('date', { ascending: true })

    set({ planItems: items || [] })
    return items?.[items.length - 1]
  },

  removeItem: async (itemId) => {
    // Use direct fetch for DELETE to avoid auth lock hang
    await directDelete('meal_plan_items', itemId)

    const { planItems } = get()
    set({ planItems: planItems.filter((i) => i.id !== itemId) })
  },

  updateItem: async (itemId, updates) => {
    // Use direct fetch for UPDATE to avoid auth lock hang
    await directUpdate('meal_plan_items', itemId, updates)

    const { planItems } = get()
    set({
      planItems: planItems.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
    })
  },

  duplicatePlan: async (planId, familyId) => {
    const { currentPlan, planItems } = get()
    const sourcePlan = currentPlan?.id === planId ? currentPlan : null

    // Fetch source plan if not current
    let plan = sourcePlan
    if (!plan) {
      const { data } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('id', planId)
        .single()
      plan = data
    }
    if (!plan) throw new Error('Plan not found')

    // Create new plan using direct fetch
    const dupFamilyId = familyId || plan.family_id
    await directInsert('meal_plans', {
      family_id: dupFamilyId,
      title: `${plan.title} (Copy)`,
      start_date: plan.start_date,
      end_date: plan.end_date,
    })

    // Fetch the newly created plan
    const { data: newPlans } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('family_id', dupFamilyId)
      .order('created_at', { ascending: false })
      .limit(1)

    const newPlan = newPlans?.[0]
    if (!newPlan) throw new Error('Failed to retrieve duplicated plan')

    // Fetch items from source
    let items = planItems
    if (!sourcePlan) {
      const { data: fetchedItems } = await supabase
        .from('meal_plan_items')
        .select('*')
        .eq('meal_plan_id', planId)
      items = fetchedItems || []
    }

    // Copy items using direct fetch
    if (items.length > 0) {
      const newItems = items.map((item) => ({
        meal_plan_id: newPlan.id,
        recipe_id: item.recipe_id,
        date: item.date,
        meal_slot: item.meal_slot,
        servings_multiplier: item.servings_multiplier || 1,
        notes: item.notes || '',
      }))

      await directInsert('meal_plan_items', newItems)
    }

    const { plans } = get()
    set({ plans: [newPlan, ...plans] })
    return newPlan
  },

  clearCurrentPlan: () => {
    set({ currentPlan: null, planItems: [] })
  },
}))

export default useMealPlanStore
