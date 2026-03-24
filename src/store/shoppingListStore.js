import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { canonicalUnit, toBaseUnit, normalizeUnit, unitsCompatible } from '../lib/utils'

const useShoppingListStore = create((set, get) => ({
  currentList: null,
  items: [],
  lists: [],
  loading: false,
  realtimeChannel: null,

  fetchLists: async (familyId) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ lists: data || [], loading: false })
    } catch (err) {
      console.error('Error fetching shopping lists:', err)
      set({ loading: false })
    }
  },

  fetchList: async (listId) => {
    set({ loading: true })
    try {
      const { data: list, error: listError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('id', listId)
        .single()

      if (listError) throw listError

      const { data: items, error: itemsError } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('shopping_list_id', listId)
        .order('category', { ascending: true })
        .order('item_name', { ascending: true })

      if (itemsError) throw itemsError

      set({ currentList: list, items: items || [], loading: false })

      // Subscribe to realtime updates
      get().subscribeToList(listId)
    } catch (err) {
      console.error('Error fetching shopping list:', err)
      set({ loading: false })
    }
  },

  subscribeToList: (listId) => {
    // Unsubscribe from previous
    const { realtimeChannel } = get()
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
    }

    const channel = supabase
      .channel(`shopping_list_${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list_items',
          filter: `shopping_list_id=eq.${listId}`,
        },
        (payload) => {
          const { items } = get()
          if (payload.eventType === 'UPDATE') {
            set({
              items: items.map((i) =>
                i.id === payload.new.id ? { ...i, ...payload.new } : i
              ),
            })
          } else if (payload.eventType === 'INSERT') {
            // Only add if not already present
            if (!items.find((i) => i.id === payload.new.id)) {
              set({ items: [...items, payload.new] })
            }
          } else if (payload.eventType === 'DELETE') {
            set({ items: items.filter((i) => i.id !== payload.old.id) })
          }
        }
      )
      .subscribe()

    set({ realtimeChannel: channel })
  },

  unsubscribe: () => {
    const { realtimeChannel } = get()
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      set({ realtimeChannel: null })
    }
  },

  generateFromPlan: async (planId, familyId, planTitle) => {
    set({ loading: true })
    try {
      // 1. Load all meal plan items with recipe + ingredient data
      const { data: planItems, error: itemsErr } = await supabase
        .from('meal_plan_items')
        .select(`
          *,
          recipes (
            id, title,
            recipe_ingredients ( id, ingredient_name, quantity_text, quantity_numeric, unit, notes )
          )
        `)
        .eq('meal_plan_id', planId)

      if (itemsErr) throw itemsErr

      // 2. Build combined ingredient map
      const ingredientMap = {}

      for (const planItem of (planItems || [])) {
        const recipe = planItem.recipes
        if (!recipe) continue
        const multiplier = planItem.servings_multiplier || 1
        const ingredients = recipe.recipe_ingredients || []

        for (const ing of ingredients) {
          const name = (ing.ingredient_name || '').trim().toLowerCase()
          if (!name) continue

          const unit = canonicalUnit(ing.unit)
          const qty = ing.quantity_numeric != null ? ing.quantity_numeric * multiplier : null

          const key = `${name}__${unit}`

          if (!ingredientMap[key]) {
            ingredientMap[key] = {
              name: ing.ingredient_name?.trim() || name,
              quantity: 0,
              unit: unit,
              recipeSources: [],
              hasQuantity: false,
            }
          }

          if (qty != null) {
            ingredientMap[key].quantity += qty
            ingredientMap[key].hasQuantity = true
          }

          if (!ingredientMap[key].recipeSources.includes(recipe.title)) {
            ingredientMap[key].recipeSources.push(recipe.title)
          }
        }
      }

      // 3. Try to combine compatible units
      const combinedMap = {}
      for (const [, item] of Object.entries(ingredientMap)) {
        const nameLower = item.name.toLowerCase()
        let merged = false

        for (const [existingKey, existing] of Object.entries(combinedMap)) {
          if (existingKey === nameLower && unitsCompatible(existing.unit, item.unit)) {
            // Convert both to base unit, add, then we'll normalize later
            const baseA = toBaseUnit(existing.quantity, existing.unit)
            const baseB = toBaseUnit(item.quantity, item.unit)
            if (baseA.unit === baseB.unit) {
              existing.quantity = baseA.quantity + baseB.quantity
              existing.unit = baseA.unit
              existing.recipeSources = [...new Set([...existing.recipeSources, ...item.recipeSources])]
              existing.hasQuantity = existing.hasQuantity || item.hasQuantity
              merged = true
              break
            }
          }
        }

        if (!merged) {
          if (combinedMap[nameLower] && combinedMap[nameLower].unit !== item.unit) {
            // Different incompatible units — keep separate with unit suffix
            combinedMap[`${nameLower}__${item.unit}`] = { ...item }
          } else if (combinedMap[nameLower]) {
            // Same unit, just add
            combinedMap[nameLower].quantity += item.quantity
            combinedMap[nameLower].recipeSources = [
              ...new Set([...combinedMap[nameLower].recipeSources, ...item.recipeSources]),
            ]
            combinedMap[nameLower].hasQuantity = combinedMap[nameLower].hasQuantity || item.hasQuantity
          } else {
            combinedMap[nameLower] = { ...item }
          }
        }
      }

      // 4. Normalize units (convert up)
      const normalizedItems = Object.values(combinedMap).map((item) => {
        if (item.hasQuantity && item.unit) {
          const normalized = normalizeUnit(item.quantity, item.unit)
          return { ...item, quantity: normalized.quantity, unit: normalized.unit }
        }
        return item
      })

      // 5. Categorize ingredients
      let categorized = {}
      try {
        const ingredientNames = normalizedItems.map((i) => i.name)
        const response = await fetch('/api/categorize-ingredients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredients: ingredientNames }),
        })
        if (response.ok) {
          const data = await response.json()
          categorized = data.categories || {}
        }
      } catch {
        // If categorization fails, default everything to 'other'
        console.warn('Ingredient categorization failed, using defaults')
      }

      // Apply common-sense defaults for uncategorized items
      for (const item of normalizedItems) {
        const nameLower = item.name.toLowerCase()
        if (!categorized[nameLower] && !categorized[item.name]) {
          categorized[item.name] = guessCategory(nameLower)
        }
      }

      // 6. Create shopping list
      const { data: list, error: listErr } = await supabase
        .from('shopping_lists')
        .insert({
          family_id: familyId,
          meal_plan_id: planId,
          title: `Shopping List — ${planTitle || 'Meal Plan'}`,
        })
        .select()
        .single()

      if (listErr) throw listErr

      // 7. Create shopping list items
      const listItems = normalizedItems.map((item) => ({
        shopping_list_id: list.id,
        item_name: item.name,
        quantity: item.hasQuantity ? item.quantity : null,
        unit: item.unit || null,
        category: categorized[item.name] || categorized[item.name.toLowerCase()] || 'other',
        recipe_sources: item.recipeSources,
        is_checked: false,
      }))

      if (listItems.length > 0) {
        const { error: insertErr } = await supabase
          .from('shopping_list_items')
          .insert(listItems)
        if (insertErr) throw insertErr
      }

      // Fetch the created items
      const { data: createdItems } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('shopping_list_id', list.id)
        .order('category')
        .order('item_name')

      const { lists } = get()
      set({
        currentList: list,
        items: createdItems || [],
        lists: [list, ...lists],
        loading: false,
      })

      return list
    } catch (err) {
      console.error('Error generating shopping list:', err)
      set({ loading: false })
      throw err
    }
  },

  toggleChecked: async (itemId) => {
    const { items } = get()
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const newChecked = !item.is_checked

    // Optimistic update
    set({
      items: items.map((i) => (i.id === itemId ? { ...i, is_checked: newChecked } : i)),
    })

    const { error } = await supabase
      .from('shopping_list_items')
      .update({ is_checked: newChecked })
      .eq('id', itemId)

    if (error) {
      // Revert on error
      set({
        items: items.map((i) => (i.id === itemId ? { ...i, is_checked: !newChecked } : i)),
      })
      console.error('Error toggling checked:', error)
    }
  },

  addManualItem: async (item) => {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert(item)
      .select()
      .single()

    if (error) throw error

    const { items } = get()
    set({ items: [...items, data] })
    return data
  },

  removeItem: async (itemId) => {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error

    const { items } = get()
    set({ items: items.filter((i) => i.id !== itemId) })
  },

  clearChecked: async (listId) => {
    const { items } = get()
    const checkedIds = items.filter((i) => i.is_checked).map((i) => i.id)

    if (checkedIds.length === 0) return

    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .in('id', checkedIds)

    if (error) throw error

    set({ items: items.filter((i) => !i.is_checked) })
  },

  deleteList: async (listId) => {
    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', listId)

    if (error) throw error

    const { lists, currentList } = get()
    set({
      lists: lists.filter((l) => l.id !== listId),
      currentList: currentList?.id === listId ? null : currentList,
      items: currentList?.id === listId ? [] : get().items,
    })
  },

  clearCurrentList: () => {
    get().unsubscribe()
    set({ currentList: null, items: [] })
  },
}))

/**
 * Simple heuristic to guess aisle category from ingredient name.
 */
function guessCategory(name) {
  const n = name.toLowerCase()

  const produce = ['lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'carrot', 'celery', 'potato', 'lemon', 'lime', 'apple', 'banana', 'avocado', 'cilantro', 'parsley', 'basil', 'ginger', 'mushroom', 'spinach', 'kale', 'broccoli', 'zucchini', 'squash', 'cucumber', 'corn', 'berry', 'berries', 'strawberry', 'blueberry', 'orange', 'scallion', 'shallot', 'jalapeno']
  const dairy = ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream', 'egg', 'eggs', 'mozzarella', 'parmesan', 'cheddar', 'ricotta', 'cream cheese', 'half and half', 'whipping cream']
  const meat = ['chicken', 'beef', 'pork', 'turkey', 'bacon', 'sausage', 'ham', 'steak', 'ground beef', 'ground turkey', 'lamb', 'shrimp', 'salmon', 'fish', 'tuna']
  const bakery = ['bread', 'tortilla', 'bun', 'roll', 'pita', 'croissant', 'bagel']
  const spices = ['salt', 'pepper', 'cumin', 'paprika', 'oregano', 'thyme', 'rosemary', 'cinnamon', 'nutmeg', 'chili powder', 'cayenne', 'bay leaf', 'turmeric', 'coriander', 'vanilla', 'vanilla extract']
  const canned = ['tomato sauce', 'tomato paste', 'diced tomatoes', 'crushed tomatoes', 'beans', 'chickpeas', 'coconut milk', 'broth', 'stock', 'salsa']
  const dryGoods = ['flour', 'sugar', 'rice', 'pasta', 'noodle', 'oats', 'cereal', 'baking soda', 'baking powder', 'cornstarch', 'breadcrumb', 'panko']
  const frozen = ['frozen', 'ice cream']

  if (produce.some((p) => n.includes(p))) return 'produce'
  if (dairy.some((d) => n.includes(d))) return 'dairy'
  if (meat.some((m) => n.includes(m))) return 'meat'
  if (bakery.some((b) => n.includes(b))) return 'bakery'
  if (spices.some((s) => n.includes(s))) return 'spices'
  if (canned.some((c) => n.includes(c))) return 'canned'
  if (dryGoods.some((d) => n.includes(d))) return 'dry_goods'
  if (frozen.some((f) => n.includes(f))) return 'frozen'
  if (n.includes('oil') || n.includes('vinegar') || n.includes('soy sauce') || n.includes('honey') || n.includes('maple syrup') || n.includes('mustard') || n.includes('ketchup') || n.includes('mayo')) return 'dry_goods'
  if (n.includes('water') || n.includes('juice') || n.includes('wine') || n.includes('beer') || n.includes('soda') || n.includes('coffee') || n.includes('tea')) return 'beverages'

  return 'other'
}

export default useShoppingListStore
