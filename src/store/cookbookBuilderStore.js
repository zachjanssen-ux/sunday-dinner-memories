import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useCookbookBuilderStore = create((set, get) => ({
  currentCookbook: null,
  pages: [],
  familyCookbooks: [],
  loading: false,
  saving: false,

  // Create a new printable cookbook
  createCookbook: async (data) => {
    set({ saving: true })
    try {
      const { error } = await supabase
        .from('printable_cookbooks')
        .insert(data)

      if (error) throw error

      // Fetch the newly created cookbook
      const { data: newCookbooks } = await supabase
        .from('printable_cookbooks')
        .select('*')
        .eq('family_id', data.family_id)
        .order('created_at', { ascending: false })
        .limit(1)

      const cookbook = newCookbooks?.[0]
      set({ currentCookbook: cookbook || null, pages: [], saving: false })
      return cookbook
    } catch (err) {
      console.error('Error creating printable cookbook:', err)
      set({ saving: false })
      throw err
    }
  },

  // Update an existing cookbook
  updateCookbook: async (id, updates) => {
    set({ saving: true })
    try {
      const { error } = await supabase
        .from('printable_cookbooks')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Fetch updated cookbook
      const { data: cookbook } = await supabase
        .from('printable_cookbooks')
        .select('*')
        .eq('id', id)
        .single()

      set({ currentCookbook: cookbook || null, saving: false })
      return cookbook
    } catch (err) {
      console.error('Error updating printable cookbook:', err)
      set({ saving: false })
      throw err
    }
  },

  // Add a page to the cookbook
  addPage: async (page) => {
    set({ saving: true })
    try {
      const { pages } = get()
      const sortOrder = pages.length

      const { error } = await supabase
        .from('printable_cookbook_pages')
        .insert({ ...page, sort_order: sortOrder })

      if (error) throw error

      // Re-fetch all pages for this cookbook
      const cookbookId = page.cookbook_id
      const { data: allPages } = await supabase
        .from('printable_cookbook_pages')
        .select('*')
        .eq('cookbook_id', cookbookId)
        .order('sort_order', { ascending: true })

      set({ pages: allPages || [], saving: false })
      return allPages?.[allPages.length - 1]
    } catch (err) {
      console.error('Error adding page:', err)
      set({ saving: false })
      throw err
    }
  },

  // Remove a page
  removePage: async (pageId) => {
    set({ saving: true })
    try {
      const { error } = await supabase
        .from('printable_cookbook_pages')
        .delete()
        .eq('id', pageId)

      if (error) throw error

      const { pages } = get()
      const filtered = pages.filter((p) => p.id !== pageId)
      // Re-order remaining pages
      const reordered = filtered.map((p, idx) => ({ ...p, sort_order: idx }))
      set({ pages: reordered, saving: false })

      // Update sort_order in DB
      for (const p of reordered) {
        await supabase
          .from('printable_cookbook_pages')
          .update({ sort_order: p.sort_order })
          .eq('id', p.id)
      }
    } catch (err) {
      console.error('Error removing page:', err)
      set({ saving: false })
      throw err
    }
  },

  // Reorder pages
  reorderPages: async (pageIds) => {
    const { pages } = get()
    const reordered = pageIds.map((id, idx) => {
      const page = pages.find((p) => p.id === id)
      return { ...page, sort_order: idx }
    })
    set({ pages: reordered })

    // Update in DB
    try {
      for (const p of reordered) {
        await supabase
          .from('printable_cookbook_pages')
          .update({ sort_order: p.sort_order })
          .eq('id', p.id)
      }
    } catch (err) {
      console.error('Error reordering pages:', err)
    }
  },

  // Fetch a single cookbook with all pages
  fetchCookbook: async (id) => {
    set({ loading: true })
    try {
      const { data: cookbook, error } = await supabase
        .from('printable_cookbooks')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      const { data: pages, error: pagesErr } = await supabase
        .from('printable_cookbook_pages')
        .select('*')
        .eq('cookbook_id', id)
        .order('sort_order', { ascending: true })

      if (pagesErr) throw pagesErr

      set({ currentCookbook: cookbook, pages: pages || [], loading: false })
      return cookbook
    } catch (err) {
      console.error('Error fetching cookbook:', err)
      set({ loading: false })
      throw err
    }
  },

  // Fetch all printable cookbooks for a family
  fetchFamilyCookbooks: async (familyId) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('printable_cookbooks')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ familyCookbooks: data || [], loading: false })
    } catch (err) {
      console.error('Error fetching family cookbooks:', err)
      set({ loading: false })
    }
  },

  // Update a single page's content
  updatePage: async (pageId, updates) => {
    set({ saving: true })
    try {
      const { error } = await supabase
        .from('printable_cookbook_pages')
        .update(updates)
        .eq('id', pageId)

      if (error) throw error

      const { pages } = get()
      set({
        pages: pages.map((p) => (p.id === pageId ? { ...p, ...updates } : p)),
        saving: false,
      })
      return { ...pages.find((p) => p.id === pageId), ...updates }
    } catch (err) {
      console.error('Error updating page:', err)
      set({ saving: false })
      throw err
    }
  },

  // Reset builder state
  resetBuilder: () => {
    set({ currentCookbook: null, pages: [], loading: false, saving: false })
  },
}))

export default useCookbookBuilderStore
