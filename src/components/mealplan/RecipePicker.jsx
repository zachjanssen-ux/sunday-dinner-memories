import { useState, useMemo } from 'react'
import { Search, Clock, X, ChevronDown, ChevronUp, Filter } from 'lucide-react'

const CATEGORIES = ['All', 'Appetizer', 'Main', 'Side', 'Dessert', 'Breakfast', 'Snack', 'Drink']
const CUISINES = ['All', 'American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'Indian', 'French', 'Mediterranean', 'Korean', 'Vietnamese', 'Greek', 'Southern', 'Cajun', 'Caribbean']
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Advanced']

export default function RecipePicker({ recipes, onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [cuisine, setCuisine] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      // Text search
      if (search) {
        const q = search.toLowerCase()
        const matchesText =
          r.title?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q) ||
          r.cuisine?.toLowerCase().includes(q)
        if (!matchesText) return false
      }

      // Category filter
      if (category !== 'All') {
        const cat = r.category?.toLowerCase() || ''
        const filterCat = category.toLowerCase()
        // Handle "Main" matching "Main Course", "Side" matching "Side Dish", etc.
        if (!cat.startsWith(filterCat)) return false
      }

      // Cuisine filter
      if (cuisine !== 'All') {
        const recipeCuisine = r.cuisine?.toLowerCase() || ''
        if (recipeCuisine !== cuisine.toLowerCase()) return false
      }

      // Difficulty filter
      if (difficulty !== 'All') {
        const recipeDiff = r.difficulty?.toLowerCase() || ''
        if (recipeDiff !== difficulty.toLowerCase()) return false
      }

      return true
    })
  }, [recipes, search, category, cuisine, difficulty])

  const activeFilterCount =
    (category !== 'All' ? 1 : 0) +
    (cuisine !== 'All' ? 1 : 0) +
    (difficulty !== 'All' ? 1 : 0)

  const clearFilters = () => {
    setCategory('All')
    setCuisine('All')
    setDifficulty('All')
  }

  const categoryColors = {
    appetizer: 'bg-honey/20 text-honey',
    main: 'bg-sienna/20 text-sienna',
    'main course': 'bg-sienna/20 text-sienna',
    side: 'bg-herb/20 text-herb',
    'side dish': 'bg-herb/20 text-herb',
    dessert: 'bg-tomato/20 text-tomato',
    breakfast: 'bg-butter/20 text-cast-iron',
    soup: 'bg-sage/20 text-sunday-brown',
    salad: 'bg-herb/20 text-herb',
    drink: 'bg-stone/20 text-stone',
    beverage: 'bg-stone/20 text-stone',
    snack: 'bg-honey/20 text-honey',
  }

  return (
    <div className="bg-flour rounded-xl shadow-lg border border-stone/20 flex flex-col h-full max-h-[70vh] lg:max-h-full">
      {/* Header */}
      <div className="p-4 border-b border-stone/10 flex items-center justify-between">
        <h3 className="font-display text-lg text-cast-iron">Pick a Recipe</h3>
        {onClose && (
          <button onClick={onClose} className="text-stone hover:text-sunday-brown transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-stone/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes..."
            className="w-full pl-10 pr-4 py-2 bg-cream rounded-lg border border-stone/20 text-sunday-brown font-body text-sm focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna/50"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="mt-2 flex items-center gap-1.5 text-xs font-body font-semibold text-stone hover:text-sunday-brown transition-colors"
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-sienna text-flour text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          {filtersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Collapsible filters */}
        {filtersOpen && (
          <div className="mt-2 space-y-2.5">
            {/* Category pills */}
            <div>
              <label className="block text-[11px] font-body font-semibold text-stone uppercase tracking-wider mb-1">
                Category
              </label>
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-body font-medium transition-colors ${
                      category === cat
                        ? 'bg-sienna text-flour'
                        : 'bg-flour border border-stone/30 text-sunday-brown hover:border-sienna/40'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuisine dropdown */}
            <div>
              <label className="block text-[11px] font-body font-semibold text-stone uppercase tracking-wider mb-1">
                Cuisine
              </label>
              <select
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full bg-flour border border-stone/30 rounded-lg text-sm font-body text-sunday-brown px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna/50"
              >
                {CUISINES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty dropdown */}
            <div>
              <label className="block text-[11px] font-body font-semibold text-stone uppercase tracking-wider mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-flour border border-stone/30 rounded-lg text-sm font-body text-sunday-brown px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna/50"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs font-body text-sienna hover:text-sienna/70 transition-colors underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recipe List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-stone font-body text-sm">
            {search || activeFilterCount > 0
              ? 'No recipes match your filters'
              : 'No recipes available'}
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-[11px] font-body text-stone px-2 mb-1">
              {filtered.length} recipe{filtered.length !== 1 ? 's' : ''}
            </p>
            {filtered.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => onSelect(recipe)}
                className="w-full text-left p-3 rounded-lg hover:bg-linen transition-colors flex items-center gap-3 group"
              >
                {recipe.original_image_url ? (
                  <img
                    src={recipe.original_image_url}
                    alt=""
                    className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-linen flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🍽</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-semibold text-cast-iron truncate group-hover:text-sienna transition-colors">
                    {recipe.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {recipe.category && (
                      <span
                        className={`text-xs font-body px-1.5 py-0.5 rounded-full ${
                          categoryColors[recipe.category?.toLowerCase()] || 'bg-stone/20 text-stone'
                        }`}
                      >
                        {recipe.category}
                      </span>
                    )}
                    {(recipe.prep_time || recipe.cook_time) && (
                      <span className="text-xs text-stone flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {(recipe.prep_time || 0) + (recipe.cook_time || 0)} min
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
