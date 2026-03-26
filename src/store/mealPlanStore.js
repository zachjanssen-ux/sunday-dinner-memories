import { create } from 'zustand'
import { supabase } from '../lib/supabase'

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
        .select(`
          *,
          recipes (
            id, title, category, cuisine, original_image_url, prep_time_min, cook_time_min,
            recipe_ingredients ( id, ingredient_id, quantity, quantity_numeric, unit, notes, sort_order )
          )
        `)
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
    const { error } = await supabase
      .from('meal_plans')
      .insert(data)

    if (error) throw error

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
    const { error } = await supabase
      .from('meal_plans')
      .update(updates)
      .eq('id', id)

    if (error) throw error

    const { plans, currentPlan } = get()
    set({
      plans: plans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      currentPlan: currentPlan?.id === id ? { ...currentPlan, ...updates } : currentPlan,
    })
  },

  deletePlan: async (id) => {
    // Items will cascade delete via DB
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', id)

    if (error) throw error

    const { plans, currentPlan } = get()
    set({
      plans: plans.filter((p) => p.id !== id),
      currentPlan: currentPlan?.id === id ? null : currentPlan,
      planItems: currentPlan?.id === id ? [] : get().planItems,
    })
  },

  addItem: async (item) => {
    const { error } = await supabase
      .from('meal_plan_items')
      .insert(item)

    if (error) throw error

    // Re-fetch all items for this plan to get the new one with joins
    const { data: items } = await supabase
      .from('meal_plan_items')
      .select(`
        *,
        recipes (
          id, title, category, cuisine, original_image_url, prep_time_min, cook_time_min,
          recipe_ingredients ( id, ingredient_id, quantity, quantity_numeric, unit, notes, sort_order )
        )
      `)
      .eq('meal_plan_id', item.meal_plan_id)
      .order('date', { ascending: true })

    set({ planItems: items || [] })
    return items?.[items.length - 1]
  },

  removeItem: async (itemId) => {
    const { error } = await supabase
      .from('meal_plan_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error

    const { planItems } = get()
    set({ planItems: planItems.filter((i) => i.id !== itemId) })
  },

  updateItem: async (itemId, updates) => {
    const { error } = await supabase
      .from('meal_plan_items')
      .update(updates)
      .eq('id', itemId)

    if (error) throw error

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

    // Create new plan
    const dupFamilyId = familyId || plan.family_id
    const { error: planErr } = await supabase
      .from('meal_plans')
      .insert({
        family_id: dupFamilyId,
        title: `${plan.title} (Copy)`,
        start_date: plan.start_date,
        end_date: plan.end_date,
      })

    if (planErr) throw planErr

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

    // Copy items
    if (items.length > 0) {
      const newItems = items.map((item) => ({
        meal_plan_id: newPlan.id,
        recipe_id: item.recipe_id,
        date: item.date,
        meal_slot: item.meal_slot,
        servings_multiplier: item.servings_multiplier || 1,
        notes: item.notes || '',
      }))

      await supabase.from('meal_plan_items').insert(newItems)
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
