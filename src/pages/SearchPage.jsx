import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useRecipeStore from '../store/recipeStore'
import useSearchStore from '../store/searchStore'
import Layout from '../components/layout/Layout'
import SearchBar from '../components/search/SearchBar'
import AISearchChat from '../components/search/AISearchChat'
import RecipeCard from '../components/recipes/RecipeCard'
import { Search, Sparkles, Loader2, MessageCircle, Grid3X3 } from 'lucide-react'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const { currentFamily, currentMember, user } = useAuthStore()
  const { recipes, fetchRecipes, fetchCooks, fetchTags } = useRecipeStore()
  const {
    searchResults,
    searchQuery,
    searchMode,
    isSearching,
    aiReasons,
    searchHistory,
    searchError,
    searchRecipes,
    clearSearch,
    setSearchMode,
    setSearchQuery,
  } = useSearchStore()

  const [view, setView] = useState('search') // 'search' | 'chat'

  const isActive = currentMember?.role === 'active' || currentMember?.role === 'admin'

  // Load recipes if not already loaded
  useEffect(() => {
    if (currentFamily?.id && user?.id && recipes.length === 0) {
      fetchRecipes(currentFamily.id, user.id)
      fetchCooks(currentFamily.id)
      fetchTags(currentFamily.id)
    }
  }, [currentFamily?.id, user?.id])

  // Execute search from URL params on mount
  useEffect(() => {
    const q = searchParams.get('q')
    const mode = searchParams.get('mode') || 'basic'

    if (q && recipes.length > 0) {
      setSearchMode(mode)
      setSearchQuery(q)
      searchRecipes(q, mode, currentFamily?.id, recipes)
    }
  }, [searchParams, recipes.length])

  const handleSearch = (query, mode) => {
    if (!query.trim()) return
    searchRecipes(query, mode, currentFamily?.id, recipes)
  }

  const hasResults = searchResults.length > 0
  const hasSearched = searchQuery.length > 0

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display text-cast-iron mb-1">Search</h1>
            <p className="text-sunday-brown/70 font-body text-sm">
              Find recipes in your family collection
            </p>
          </div>

          {/* View toggle for active members */}
          {isActive && (
            <div className="flex items-center bg-linen rounded-lg border border-stone/20 p-1">
              <button
                onClick={() => setView('search')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-body font-semibold transition-colors ${
                  view === 'search'
                    ? 'bg-flour text-cast-iron shadow-sm'
                    : 'text-stone hover:text-sunday-brown'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                Search
              </button>
              <button
                onClick={() => setView('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-body font-semibold transition-colors ${
                  view === 'chat'
                    ? 'bg-flour text-cast-iron shadow-sm'
                    : 'text-stone hover:text-sunday-brown'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Chat
              </button>
            </div>
          )}
        </div>

        {/* Chat view */}
        {view === 'chat' && isActive ? (
          <AISearchChat />
        ) : (
          <>
            {/* Search Bar */}
            <div className="mb-6">
              <SearchBar onSearch={handleSearch} autoFocus />
            </div>

            {/* Error message */}
            {searchError && (
              <div className="mb-4 bg-honey/10 border border-honey/30 rounded-lg px-4 py-3 text-sm font-body text-sunday-brown">
                {searchError}
              </div>
            )}

            {/* Loading state */}
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-sienna animate-spin mb-4" />
                <p className="font-body text-sunday-brown/70 text-sm">
                  Searching through your family recipes...
                </p>
              </div>
            )}

            {/* Results */}
            {!isSearching && hasSearched && hasResults && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-body text-sm text-stone">
                    {searchResults.length} recipe{searchResults.length !== 1 ? 's' : ''} found
                    {searchMode === 'ai' && (
                      <span className="ml-1.5 inline-flex items-center gap-1 text-honey">
                        <Sparkles className="w-3 h-3" />
                        AI ranked
                      </span>
                    )}
                  </p>
                  <button
                    onClick={clearSearch}
                    className="text-sm font-body text-sienna hover:text-sienna/80 font-semibold"
                  >
                    Clear search
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((recipe) => (
                    <div key={recipe.id}>
                      <RecipeCard recipe={recipe} />
                      {/* AI relevance reason */}
                      {aiReasons[recipe.id] && (
                        <p className="mt-1.5 px-1 text-xs font-body text-stone leading-relaxed">
                          <Sparkles className="w-3 h-3 text-honey inline mr-1" />
                          {aiReasons[recipe.id]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {!isSearching && hasSearched && !hasResults && (
              <div className="bg-linen rounded-xl p-12 text-center border border-stone/20">
                <Search className="w-12 h-12 text-stone/30 mx-auto mb-4" />
                <h2 className="text-xl font-display text-cast-iron mb-2">
                  Nothing in the recipe box matched that
                </h2>
                <p className="font-body text-sunday-brown/70 mb-4">
                  Try different words, or check the spelling.
                </p>
                <button
                  onClick={clearSearch}
                  className="text-sm font-body text-sienna hover:text-sienna/80 font-semibold"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Empty state — no search yet */}
            {!isSearching && !hasSearched && (
              <div className="bg-linen rounded-xl p-12 text-center border border-stone/20">
                <Search className="w-12 h-12 text-stone/30 mx-auto mb-4" />
                <h2 className="text-xl font-display text-cast-iron mb-2">
                  {recipes.length > 0
                    ? 'Search your family recipes'
                    : 'Add some recipes first'}
                </h2>
                <p className="font-body text-sunday-brown/70">
                  {recipes.length > 0
                    ? `You have ${recipes.length} recipe${recipes.length !== 1 ? 's' : ''} to search through.`
                    : 'Add some recipes first, then search will help you find them!'}
                </p>

                {/* Search history pills */}
                {searchHistory.length > 0 && (
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <p className="w-full text-xs font-body text-stone uppercase tracking-wider mb-1">
                      Recent searches
                    </p>
                    {searchHistory.map((h, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(h, searchMode)}
                        className="px-3 py-1.5 rounded-full bg-flour border border-stone/20 text-sm font-body text-sunday-brown hover:bg-cream transition-colors"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
