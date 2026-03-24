import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useRecipeStore from '../../store/recipeStore'
import useSearchStore from '../../store/searchStore'
import useAuthStore from '../../store/authStore'
import { Search, X, ChevronDown, SlidersHorizontal, Sparkles } from 'lucide-react'

const categories = [
  { value: '', label: 'All' },
  { value: 'appetizer', label: 'Appetizer' },
  { value: 'main', label: 'Main' },
  { value: 'side', label: 'Side' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'drink', label: 'Drink' },
  { value: 'snack', label: 'Snack' },
  { value: 'breakfast', label: 'Breakfast' },
]

const cuisines = [
  { value: '', label: 'All Cuisines' },
  { value: 'american', label: 'American' },
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'thai', label: 'Thai' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'indian', label: 'Indian' },
  { value: 'french', label: 'French' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'southern', label: 'Southern' },
  { value: 'cajun', label: 'Cajun' },
  { value: 'korean', label: 'Korean' },
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'greek', label: 'Greek' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'african', label: 'African' },
  { value: 'caribbean', label: 'Caribbean' },
  { value: 'british', label: 'British' },
  { value: 'german', label: 'German' },
  { value: 'other', label: 'Other' },
]

const difficulties = [
  { value: '', label: 'Any Difficulty' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'advanced', label: 'Advanced' },
]

const dietaryOptions = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten_free', label: 'Gluten Free' },
  { value: 'dairy_free', label: 'Dairy Free' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'nut_free', label: 'Nut Free' },
  { value: 'low_carb', label: 'Low Carb' },
  { value: 'whole30', label: 'Whole30' },
]

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'az', label: 'A-Z' },
  { value: 'favorites', label: 'Most Favorited' },
]

function Dropdown({ label, value, options, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-flour border border-stone/30 rounded-lg px-3 py-2 text-sm font-body text-sunday-brown
        focus:ring-2 focus:ring-sienna/50 focus:outline-none appearance-none cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function MultiSelect({ label, selected, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val))
    } else {
      onChange([...selected, val])
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-flour border border-stone/30 rounded-lg px-3 py-2 text-sm font-body text-sunday-brown
          focus:ring-2 focus:ring-sienna/50 focus:outline-none"
      >
        {label}
        {selected.length > 0 && (
          <span className="bg-sienna text-flour text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {selected.length}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-flour border border-stone/20 rounded-lg shadow-lg z-50 py-2 min-w-[180px] max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-linen cursor-pointer text-sm font-body text-sunday-brown"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="rounded border-stone/30 text-sienna focus:ring-sienna/50"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function TagsMultiSelect({ selected, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)
  const tags = useRecipeStore((s) => s.tags)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = tags.filter(
    (t) => t.name.toLowerCase().includes(query.toLowerCase())
  )

  const toggle = (tagId) => {
    if (selected.includes(tagId)) {
      onChange(selected.filter((s) => s !== tagId))
    } else {
      onChange([...selected, tagId])
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-flour border border-stone/30 rounded-lg px-3 py-2 text-sm font-body text-sunday-brown
          focus:ring-2 focus:ring-sienna/50 focus:outline-none"
      >
        Tags
        {selected.length > 0 && (
          <span className="bg-sienna text-flour text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {selected.length}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-flour border border-stone/20 rounded-lg shadow-lg z-50 py-2 min-w-[200px] max-h-60 overflow-y-auto">
          <div className="px-3 pb-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tags..."
              className="w-full bg-linen border border-stone/20 rounded px-2 py-1 text-sm font-body text-sunday-brown focus:outline-none focus:ring-1 focus:ring-sienna/50"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="px-3 py-1 text-sm text-stone font-body">No tags found</p>
          ) : (
            filtered.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-linen cursor-pointer text-sm font-body text-sunday-brown"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(tag.id)}
                  onChange={() => toggle(tag.id)}
                  className="rounded border-stone/30 text-sienna focus:ring-sienna/50"
                />
                {tag.name}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function FilterBar() {
  const navigate = useNavigate()
  const { filters, setFilter, clearFilters, cooks } = useRecipeStore()
  const { searchMode, setSearchMode, setSearchQuery } = useSearchStore()
  const { currentMember } = useAuthStore()
  const [showFilters, setShowFilters] = useState(false)

  const isActive = currentMember?.role === 'active' || currentMember?.role === 'admin'

  const hasActiveFilters =
    filters.category ||
    filters.cuisine ||
    filters.difficulty ||
    filters.dietaryLabels.length > 0 ||
    filters.tags.length > 0 ||
    filters.cookId ||
    filters.favoritesOnly ||
    filters.searchQuery

  const cookOptions = [
    { value: '', label: 'All Cooks' },
    ...cooks.map((c) => ({ value: c.id, label: c.name })),
  ]

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchMode === 'ai' && filters.searchQuery.trim()) {
      // AI search navigates to the search page
      setSearchQuery(filters.searchQuery)
      navigate(`/search?q=${encodeURIComponent(filters.searchQuery)}&mode=ai`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Top row: search + toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          {searchMode === 'ai' && isActive ? (
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-honey" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
          )}
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilter('searchQuery', e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={searchMode === 'ai' && isActive
              ? "Ask anything... 'something with chicken for a cold night'"
              : 'Search recipes...'}
            className={`w-full border rounded-lg pl-9 pr-4 py-2.5 text-sm font-body text-sunday-brown
              focus:ring-2 focus:outline-none placeholder:text-stone/50 ${
                searchMode === 'ai' && isActive
                  ? 'bg-flour border-honey/40 focus:ring-honey/50'
                  : 'bg-flour border-stone/30 focus:ring-sienna/50'
              }`}
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilter('searchQuery', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-stone hover:text-sunday-brown" />
            </button>
          )}
        </div>

        {/* AI toggle for active members */}
        {isActive && (
          <button
            onClick={() => setSearchMode(searchMode === 'ai' ? 'basic' : 'ai')}
            title={searchMode === 'ai' ? 'Switch to keyword search' : 'Switch to AI search'}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-body font-semibold transition-colors shrink-0 ${
              searchMode === 'ai'
                ? 'bg-honey/15 text-honey border-honey/40 hover:bg-honey/25'
                : 'bg-flour text-stone border-stone/30 hover:text-sunday-brown hover:border-stone/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI</span>
          </button>
        )}

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-body font-semibold transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-sienna text-flour border-sienna'
              : 'bg-flour text-sunday-brown border-stone/30 hover:border-stone/50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && !showFilters && (
            <span className="w-2 h-2 rounded-full bg-tomato" />
          )}
        </button>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter('category', cat.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-body font-semibold transition-colors ${
              filters.category === cat.value
                ? 'bg-sienna text-flour'
                : 'bg-flour text-sunday-brown border border-stone/30 hover:bg-linen'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-linen rounded-xl p-4 border border-stone/20 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Dropdown
              label="Cook"
              value={filters.cookId}
              options={cookOptions}
              onChange={(v) => setFilter('cookId', v)}
            />
            <Dropdown
              label="Cuisine"
              value={filters.cuisine}
              options={cuisines}
              onChange={(v) => setFilter('cuisine', v)}
            />
            <Dropdown
              label="Difficulty"
              value={filters.difficulty}
              options={difficulties}
              onChange={(v) => setFilter('difficulty', v)}
            />
            <MultiSelect
              label="Dietary"
              selected={filters.dietaryLabels}
              options={dietaryOptions}
              onChange={(v) => setFilter('dietaryLabels', v)}
            />
            <TagsMultiSelect
              selected={filters.tags}
              onChange={(v) => setFilter('tags', v)}
            />
            <Dropdown
              label="Sort"
              value={filters.sortBy}
              options={sortOptions}
              onChange={(v) => setFilter('sortBy', v)}
            />
            <label className="flex items-center gap-2 text-sm font-body text-sunday-brown cursor-pointer">
              <input
                type="checkbox"
                checked={filters.favoritesOnly}
                onChange={(e) => setFilter('favoritesOnly', e.target.checked)}
                className="rounded border-stone/30 text-sienna focus:ring-sienna/50"
              />
              My Favorites
            </label>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm font-body text-sienna hover:text-sienna/80 font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
