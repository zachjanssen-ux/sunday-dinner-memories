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
          recipe_ingredients ( id, ingredient_id, quantity, quantity_numeric, unit, notes, sort_order )
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
    // Use server-side RPC to create recipe (bypasses RLS SELECT-after-INSERT hang)
    // Single JSONB param so PostgREST can always match the function
    const { data: recipeId, error } = await supabase.rpc('create_recipe', {
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
      },
    })

    if (error) throw error

    const newRecipeId = recipeId

    // Insert ingredients into recipe_ingredients table
    if (ingredients?.length > 0) {
      const ingredientRows = ingredients.map((ing, idx) => ({
        recipe_id: newRecipeId,
        ingredient_id: ing.ingredient_id || null,
        quantity: ing.quantity || ing.quantity_text || '',
        quantity_numeric: ing.quantity_numeric || null,
        unit: ing.unit || '',
        notes: ing.notes || '',
        sort_order: idx,
      }))
      const { error: ingErr } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientRows)
      if (ingErr) console.error('Error inserting ingredients:', ingErr)
    }

    // Instructions are stored as JSONB on the recipe itself (no separate table)

    // Insert tag links
    if (tagIds?.length > 0) {
      const tagRows = tagIds.map((tagId) => ({
        recipe_id: newRecipeId,
        tag_id: tagId,
      }))
      const { error: tagErr } = await supabase
        .from('recipe_tags')
        .insert(tagRows)
      if (tagErr) console.error('Error inserting tags:', tagErr)
    }

    // Add to local state with the data we have
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
    if (ingredients !== undefined) {
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', id)
      if (ingredients.length > 0) {
        const ingredientRows = ingredients.map((ing, idx) => ({
          recipe_id: id,
          ingredient_id: ing.ingredient_id || null,
          quantity: ing.quantity || ing.quantity_text || '',
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
    const { data, error } = await supabase
      .from('cooks')
      .insert(cook)
      .select()
      .single()
    if (error) throw error
    const { cooks } = get()
    set({ cooks: [...cooks, data].sort((a, b) => a.name.localeCompare(b.name)) })
    return data
  },

  addTag: async (tag) => {
    const { data, error } = await supabase
      .from('tags')
      .insert(tag)
      .select()
      .single()
    if (error) throw error
    const { tags } = get()
    set({ tags: [...tags, data].sort((a, b) => a.name.localeCompare(b.name)) })
    return data
  },

  addCookbook: async (cookbook) => {
    const { data, error } = await supabase
      .from('cookbooks')
      .insert(cookbook)
      .select()
      .single()
    if (error) throw error
    const { cookbooks } = get()
    set({ cookbooks: [data, ...cookbooks] })
    return data
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
