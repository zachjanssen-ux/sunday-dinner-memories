import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const defaultFilters = {
  category: '',
  cuisine: '',
  difficulty: '',
  dietaryLabels: [],
  tags: [],
  cookId: '',
  sortBy: 'newest',
  searchQuery: '',
  favoritesOnly: false,
}

const useRecipeStore = create((set, get) => ({
  recipes: [],
  filters: { ...defaultFilters },
  cooks: [],
  tags: [],
  cookbooks: [],
  loading: false,

  // Computed filtered recipes
  getFilteredRecipes: () => {
    const { recipes, filters } = get()
    let result = [...recipes]

    // Search
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.cook_name?.toLowerCase().includes(q)
      )
    }

    // Category
    if (filters.category) {
      result = result.filter((r) => r.category === filters.category)
    }

    // Cuisine
    if (filters.cuisine) {
      result = result.filter((r) => r.cuisine === filters.cuisine)
    }

    // Difficulty
    if (filters.difficulty) {
      result = result.filter((r) => r.difficulty === filters.difficulty)
    }

    // Dietary labels (AND logic: recipe must have ALL selected labels)
    if (filters.dietaryLabels.length > 0) {
      result = result.filter((r) => {
        const labels = r.dietary_labels || []
        return filters.dietaryLabels.every((l) => labels.includes(l))
      })
    }

    // Tags (AND logic)
    if (filters.tags.length > 0) {
      result = result.filter((r) => {
        const recipeTags = (r.recipe_tags || []).map((t) => t.tag_id || t.id)
        return filters.tags.every((t) => recipeTags.includes(t))
      })
    }

    // Cook
    if (filters.cookId) {
      result = result.filter((r) => r.original_cook_id === filters.cookId)
    }

    // Favorites
    if (filters.favoritesOnly) {
      result = result.filter((r) => r.is_favorited)
    }

    // Sort
    switch (filters.sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        break
      case 'az':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        break
      case 'favorites':
        result.sort((a, b) => (b.favorite_count || 0) - (a.favorite_count || 0))
        break
      default:
        break
    }

    return result
  },

  fetchRecipes: async (familyId, userId) => {
    set({ loading: true })
    try {
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select(`
          *,
          cooks ( id, name, bio, photo_url ),
          recipe_tags ( id, tag_id, tags ( id, name ) ),
          recipe_ingredients ( id, ingredient_id, quantity, quantity_numeric, unit, notes, sort_order, ingredients:ingredient_id ( id, name ) )
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch user's favorites
      let favoriteIds = []
      if (userId) {
        const { data: favs } = await supabase
          .from('favorites')
          .select('recipe_id')
          .eq('user_id', userId)

        favoriteIds = (favs || []).map((f) => f.recipe_id)
      }

      // Fetch favorite counts
      const { data: favCounts } = await supabase
        .from('favorites')
        .select('recipe_id')

      const countMap = {}
      ;(favCounts || []).forEach((f) => {
        countMap[f.recipe_id] = (countMap[f.recipe_id] || 0) + 1
      })

      const enriched = (recipes || []).map((r) => ({
        ...r,
        cook_name: r.cooks?.name || 'Unknown',
        cook_bio: r.cooks?.bio || '',
        cook_photo: r.cooks?.photo_url || '',
        is_favorited: favoriteIds.includes(r.id),
        favorite_count: countMap[r.id] || 0,
      }))

      set({ recipes: enriched, loading: false })
    } catch (err) {
      console.error('Error fetching recipes:', err)
      set({ loading: false })
    }
  },

  fetchCooks: async (familyId) => {
    const { data, error } = await supabase
      .from('cooks')
      .select('*')
      .eq('family_id', familyId)
      .order('name')

    if (error) {
      console.error('Error fetching cooks:', error)
      return
    }
    set({ cooks: data || [] })
  },

  fetchTags: async (familyId) => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('family_id', familyId)
      .order('name')

    if (error) {
      console.error('Error fetching tags:', error)
      return
    }
    set({ tags: data || [] })
  },

  fetchCookbooks: async (familyId) => {
    const { data, error } = await supabase
      .from('cookbooks')
      .select(`
        *,
        cookbook_recipes ( id, recipe_id, sort_order )
      `)
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cookbooks:', error)
      return
    }
    set({ cookbooks: data || [] })
  },

  addRecipe: async (recipe, ingredients, instructions, tagIds) => {
    // Bypass the Supabase JS client for the RPC call to avoid auth lock hangs.
    // But use the client to refresh the token first (handles expired JWTs).
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    // Refresh the session to get a fresh token (handles expired JWTs)
    let accessToken = supabaseKey
    try {
      const { data: refreshData } = await supabase.auth.refreshSession()
      if (refreshData?.session?.access_token) {
        accessToken = refreshData.session.access_token
      } else {
        // Fall back to reading from localStorage
        const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          accessToken = parsed.access_token || supabaseKey
        }
      }
    } catch {
      // Fall back to anon key — the RPC function is SECURITY DEFINER so it may still work
    }

    const rpcBody = {
      recipe_data: {
        family_id: recipe.family_id,
        contributed_by: recipe.contributed_by,
        original_cook_id: recipe.original_cook_id || null,
        title: recipe.title,
        description: recipe.description || null,
        category: recipe.category || null,
        cuisine: recipe.cuisine || null,
        difficulty: recipe.difficulty || null,
        dietary_labels: recipe.dietary_labels || null,
        prep_time_min: recipe.prep_time_min || null,
        cook_time_min: recipe.cook_time_min || null,
        servings: recipe.servings || null,
        instructions: recipe.instructions || null,
        notes: recipe.notes || null,
        source: recipe.source || 'manual',
        source_url: recipe.source_url || null,
        original_image_url: recipe.original_image_url || null,
        scan_status: recipe.scan_status || null,
        ingredients: (ingredients || []).map((ing) => ({
          name: ing.name || '',
          ingredient_id: ing.ingredient_id || null,
          quantity: ing.quantity || '',
          quantity_numeric: ing.quantity_numeric || null,
          unit: ing.unit || '',
          notes: ing.notes || '',
        })),
        tag_ids: tagIds || [],
      },
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/create_recipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(rpcBody),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.message || errData.error || `Save failed (${response.status})`)
    }

    const newRecipeId = await response.json()

    // Add to local state
    const { recipes } = get()
    const enriched = {
      id: newRecipeId,
      ...recipe,
      cook_name: 'Unknown',
      is_favorited: false,
      favorite_count: 0,
      recipe_tags: [],
      recipe_ingredients: [],
    }
    set({ recipes: [enriched, ...recipes] })

    return { id: newRecipeId, ...recipe }
  },

  updateRecipe: async (id, updates, ingredients, instructions, tagIds) => {
    const { error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)

    if (error) throw error

    // Replace ingredients
    if (ingredients !== undefined && ingredients !== null) {
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', id)
      if (ingredients.length > 0) {
        const ingredientRows = ingredients.map((ing, idx) => ({
          recipe_id: id,
          ingredient_id: ing.ingredient_id || null,
          quantity: ing.quantity || '',
          quantity_numeric: ing.quantity_numeric || null,
          unit: ing.unit || '',
          notes: ing.notes || '',
          sort_order: idx,
        }))
        await supabase.from('recipe_ingredients').insert(ingredientRows)
      }
    }

    // Instructions are updated via the recipe's instructions JSONB field (in `updates`)

    // Replace tags
    if (tagIds !== undefined) {
      await supabase.from('recipe_tags').delete().eq('recipe_id', id)
      if (tagIds.length > 0) {
        const tagRows = tagIds.map((tagId) => ({
          recipe_id: id,
          tag_id: tagId,
        }))
        await supabase.from('recipe_tags').insert(tagRows)
      }
    }

    // Update local state
    const { recipes } = get()
    set({
      recipes: recipes.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })
  },

  deleteRecipe: async (id) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) throw error

    const { recipes } = get()
    set({ recipes: recipes.filter((r) => r.id !== id) })
  },

  toggleFavorite: async (recipeId, userId) => {
    const { recipes } = get()
    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe) return

    if (recipe.is_favorited) {
      await supabase
        .from('favorites')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', userId)
    } else {
      await supabase
        .from('favorites')
        .insert({ recipe_id: recipeId, user_id: userId })
    }

    set({
      recipes: recipes.map((r) =>
        r.id === recipeId
          ? {
              ...r,
              is_favorited: !r.is_favorited,
              favorite_count: r.is_favorited
                ? (r.favorite_count || 1) - 1
                : (r.favorite_count || 0) + 1,
            }
          : r
      ),
    })
  },

  addCook: async (cook) => {
    const { error } = await supabase
      .from('cooks')
      .insert(cook)
    if (error) throw error

    // Re-fetch cooks for this family
    const { data: allCooks } = await supabase
      .from('cooks')
      .select('*')
      .eq('family_id', cook.family_id)
      .order('name')

    set({ cooks: allCooks || [] })
    // Return the newly added cook (last one with this name)
    return (allCooks || []).find((c) => c.name === cook.name) || cook
  },

  addTag: async (tag) => {
    const { error } = await supabase
      .from('tags')
      .insert(tag)
    if (error) throw error

    // Re-fetch tags for this family
    const { data: allTags } = await supabase
      .from('tags')
      .select('*')
      .eq('family_id', tag.family_id)
      .order('name')

    set({ tags: allTags || [] })
    return (allTags || []).find((t) => t.name === tag.name) || tag
  },

  addCookbook: async (cookbook) => {
    const { error } = await supabase
      .from('cookbooks')
      .insert(cookbook)
    if (error) throw error

    // Re-fetch cookbooks for this family
    const { data: allCookbooks } = await supabase
      .from('cookbooks')
      .select(`
        *,
        cookbook_recipes ( id, recipe_id, sort_order )
      `)
      .eq('family_id', cookbook.family_id)
      .order('created_at', { ascending: false })

    set({ cookbooks: allCookbooks || [] })
    return (allCookbooks || [])[0]
  },

  addRecipeToCookbook: async (cookbookId, recipeId) => {
    const { data: existing } = await supabase
      .from('cookbook_recipes')
      .select('id')
      .eq('cookbook_id', cookbookId)
      .eq('recipe_id', recipeId)
      .maybeSingle()

    if (existing) return // Already in cookbook

    const { error } = await supabase
      .from('cookbook_recipes')
      .insert({ cookbook_id: cookbookId, recipe_id: recipeId, sort_order: 999 })
    if (error) throw error

    // Refresh cookbooks
    const { cookbooks } = get()
    set({
      cookbooks: cookbooks.map((cb) =>
        cb.id === cookbookId
          ? {
              ...cb,
              cookbook_recipes: [
                ...(cb.cookbook_recipes || []),
                { recipe_id: recipeId, sort_order: 999 },
              ],
            }
          : cb
      ),
    })
  },

  removeRecipeFromCookbook: async (cookbookId, recipeId) => {
    const { error } = await supabase
      .from('cookbook_recipes')
      .delete()
      .eq('cookbook_id', cookbookId)
      .eq('recipe_id', recipeId)
    if (error) throw error

    const { cookbooks } = get()
    set({
      cookbooks: cookbooks.map((cb) =>
        cb.id === cookbookId
          ? {
              ...cb,
              cookbook_recipes: (cb.cookbook_recipes || []).filter(
                (cr) => cr.recipe_id !== recipeId
              ),
            }
          : cb
      ),
    })
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }))
  },

  clearFilters: () => {
    set({ filters: { ...defaultFilters } })
  },
}))

export default useRecipeStore
