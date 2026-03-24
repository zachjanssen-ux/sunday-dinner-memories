import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const MAX_HISTORY = 5

const useSearchStore = create((set, get) => ({
  searchResults: [],
  searchQuery: '',
  searchMode: 'basic', // 'basic' | 'ai'
  isSearching: false,
  aiReasons: {}, // { recipeId: reason }
  searchHistory: [],
  searchError: null,

  // Chat state
  chatMessages: [], // [{ role: 'user'|'assistant', content: string }]
  chatLoading: false,

  setSearchMode: (mode) => set({ searchMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  searchRecipes: async (query, mode, familyId, allRecipes) => {
    if (!query.trim()) {
      set({ searchResults: [], searchQuery: '', aiReasons: {}, searchError: null })
      return
    }

    set({ isSearching: true, searchQuery: query, searchError: null })

    // Add to history
    const { searchHistory } = get()
    const newHistory = [query, ...searchHistory.filter((h) => h !== query)].slice(0, MAX_HISTORY)
    set({ searchHistory: newHistory })

    try {
      if (mode === 'ai') {
        await get().aiSearch(query, familyId, allRecipes)
      } else {
        get().basicSearch(query, allRecipes)
      }
    } catch (err) {
      console.error('Search error:', err)
      set({ searchError: err.message, isSearching: false })
    }
  },

  basicSearch: (query, allRecipes) => {
    const q = query.toLowerCase().trim()
    const terms = q.split(/\s+/)

    const scored = allRecipes.map((recipe) => {
      let score = 0

      const title = (recipe.title || '').toLowerCase()
      const description = (recipe.description || '').toLowerCase()
      const notes = (recipe.notes || '').toLowerCase()
      const cookName = (recipe.cook_name || '').toLowerCase()
      const ingredients = (recipe.recipe_ingredients || [])
        .map((i) => (i.ingredient_name || '').toLowerCase())
        .join(' ')
      const tags = (recipe.recipe_tags || [])
        .map((t) => t.tags?.name || '')
        .join(' ')
        .toLowerCase()
      const category = (recipe.category || '').toLowerCase()
      const cuisine = (recipe.cuisine || '').toLowerCase()

      for (const term of terms) {
        if (title.includes(term)) score += 10
        if (cookName.includes(term)) score += 5
        if (category.includes(term)) score += 4
        if (cuisine.includes(term)) score += 4
        if (ingredients.includes(term)) score += 3
        if (tags.includes(term)) score += 3
        if (description.includes(term)) score += 2
        if (notes.includes(term)) score += 1
      }

      return { recipe, score }
    })

    const results = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.recipe)

    set({ searchResults: results, aiReasons: {}, isSearching: false })
  },

  aiSearch: async (query, familyId, allRecipes) => {
    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, familyId }),
      })

      if (!response.ok) {
        throw new Error('AI search request failed')
      }

      const data = await response.json()

      if (!data.results || data.results.length === 0) {
        set({ searchResults: [], aiReasons: {}, isSearching: false })
        return
      }

      // Map AI results back to full recipe objects, preserving AI rank order
      const reasons = {}
      const orderedIds = data.results.map((r) => {
        reasons[r.id] = r.reason
        return r.id
      })

      const results = orderedIds
        .map((id) => allRecipes.find((r) => r.id === id))
        .filter(Boolean)

      set({ searchResults: results, aiReasons: reasons, isSearching: false })
    } catch (err) {
      // Fall back to basic search on AI failure
      console.error('AI search failed, falling back to basic:', err)
      get().basicSearch(query, allRecipes)
      set({ searchError: 'AI search unavailable, showing keyword results instead.' })
    }
  },

  sendChatMessage: async (message, familyId) => {
    const { chatMessages } = get()
    const userMsg = { role: 'user', content: message }
    set({
      chatMessages: [...chatMessages, userMsg],
      chatLoading: true,
    })

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          familyId,
          history: chatMessages.slice(-10), // last 10 messages for context
        }),
      })

      if (!response.ok) throw new Error('Chat request failed')

      const data = await response.json()
      const assistantMsg = {
        role: 'assistant',
        content: data.reply,
        recipeIds: data.mentionedRecipeIds || [],
      }

      set((state) => ({
        chatMessages: [...state.chatMessages, assistantMsg],
        chatLoading: false,
      }))
    } catch (err) {
      console.error('Chat error:', err)
      const errorMsg = {
        role: 'assistant',
        content: "Sorry, I had trouble thinking about that. Try asking again in a moment.",
        recipeIds: [],
      }
      set((state) => ({
        chatMessages: [...state.chatMessages, errorMsg],
        chatLoading: false,
      }))
    }
  },

  clearSearch: () => {
    set({
      searchResults: [],
      searchQuery: '',
      aiReasons: {},
      searchError: null,
    })
  },

  clearChat: () => {
    set({ chatMessages: [], chatLoading: false })
  },
}))

export default useSearchStore
