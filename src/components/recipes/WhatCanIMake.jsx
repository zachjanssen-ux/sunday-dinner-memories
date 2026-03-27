import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import useRecipeStore from '../../store/recipeStore'
import { supabase } from '../../lib/supabase'
import {
  Salad,
  Search,
  X,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2,
  Utensils,
} from 'lucide-react'

const categoryLabels = {
  appetizer: 'Appetizer',
  main: 'Main',
  side: 'Side',
  dessert: 'Dessert',
  drink: 'Drink',
  snack: 'Snack',
  breakfast: 'Breakfast',
  other: 'Other',
}

export default function WhatCanIMake({ onAddToPlan, collapsible = true }) {
  const { recipes } = useRecipeStore()

  const [isOpen, setIsOpen] = useState(!collapsible)
  const [inputValue, setInputValue] = useState('')
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [allIngredients, setAllIngredients] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState([])

  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Fetch all ingredients from Supabase for autocomplete
  useEffect(() => {
    const fetchIngredients = async () => {
      const { data } = await supabase
        .from('ingredients')
        .select('id, name')
        .order('name')
      if (data) setAllIngredients(data)
    }
    fetchIngredients()
  }, [])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Filtered suggestions based on input
  const suggestions = useMemo(() => {
    if (!inputValue.trim()) return []
    const q = inputValue.toLowerCase()
    return allIngredients
      .filter(
        (ing) =>
          ing.name.toLowerCase().includes(q) &&
          !selectedIngredients.some(
            (s) => s.toLowerCase() === ing.name.toLowerCase()
          )
      )
      .slice(0, 8)
  }, [inputValue, allIngredients, selectedIngredients])

  const addIngredient = (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (selectedIngredients.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return
    setSelectedIngredients([...selectedIngredients, trimmed])
    setInputValue('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const removeIngredient = (name) => {
    setSelectedIngredients(selectedIngredients.filter((s) => s !== name))
  }

  const clearAll = () => {
    setSelectedIngredients([])
    setResults([])
    setHasSearched(false)
    setInputValue('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0) {
        addIngredient(suggestions[0].name)
      } else if (inputValue.trim()) {
        addIngredient(inputValue)
      }
    }
  }

  // The matching algorithm
  const handleSearch = () => {
    if (selectedIngredients.length === 0) return
    setHasSearched(true)

    const matched = []

    for (const recipe of recipes) {
      const recipeIngredients = (recipe.recipe_ingredients || []).map((ri) => ({
        name: ri.ingredients?.name || ri.name || '',
        id: ri.ingredient_id,
      }))

      if (recipeIngredients.length === 0) continue

      let matchCount = 0
      const matchedNames = new Set()

      for (const userIng of selectedIngredients) {
        const q = userIng.toLowerCase()
        for (const ri of recipeIngredients) {
          if (ri.name.toLowerCase().includes(q)) {
            matchedNames.add(ri.name)
          }
        }
      }

      matchCount = matchedNames.size
      if (matchCount === 0) continue

      const score = matchCount / recipeIngredients.length

      matched.push({
        recipe,
        matchCount,
        totalIngredients: recipeIngredients.length,
        score,
        matchedNames,
        recipeIngredients,
      })
    }

    // Sort by match count descending, then score descending
    matched.sort((a, b) => {
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount
      return b.score - a.score
    })

    setResults(matched)
  }

  return (
    <div className="mb-6">
      {/* Collapsible Header */}
      {collapsible ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-flour rounded-xl border border-stone/20 px-5 py-4 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-herb/15 rounded-lg flex items-center justify-center">
              <Salad className="w-5 h-5 text-herb" />
            </div>
            <span className="font-display text-cast-iron text-lg">
              What Can I Make?
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-stone" />
          ) : (
            <ChevronDown className="w-5 h-5 text-stone" />
          )}
        </button>
      ) : (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-herb/15 rounded-lg flex items-center justify-center">
            <Salad className="w-5 h-5 text-herb" />
          </div>
          <h2 className="font-display text-cast-iron text-lg">What Can I Make?</h2>
        </div>
      )}

      {/* Content */}
      {isOpen && (
        <div
          className={
            collapsible
              ? 'bg-flour rounded-b-xl border border-t-0 border-stone/20 px-5 pb-5 pt-4 -mt-1 shadow-sm'
              : ''
          }
        >
          {/* Input Area */}
          <p className="font-body text-sm text-sunday-brown mb-3">
            Enter ingredients you have on hand to find matching family recipes.
          </p>

          <div className="relative mb-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type an ingredient..."
                  className="w-full px-4 py-2.5 rounded-lg border border-stone/20 font-body text-sm text-sunday-brown
                    focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna/50 pr-10"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />

                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-20 w-full mt-1 bg-flour rounded-lg border border-stone/20 shadow-lg max-h-48 overflow-y-auto"
                  >
                    {suggestions.map((ing) => (
                      <button
                        key={ing.id}
                        onClick={() => addIngredient(ing.name)}
                        className="w-full text-left px-4 py-2 font-body text-sm text-sunday-brown hover:bg-linen transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {ing.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ingredient Pills */}
          {selectedIngredients.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedIngredients.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 bg-herb/20 text-herb rounded-full px-3 py-1.5 font-body text-sm font-medium"
                >
                  {name}
                  <button
                    onClick={() => removeIngredient(name)}
                    className="hover:bg-herb/30 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleSearch}
              disabled={selectedIngredients.length === 0}
              className="bg-sienna text-flour rounded-lg px-5 py-2.5 font-body font-semibold text-sm
                hover:bg-sienna/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              What Can I Make?
            </button>
            {selectedIngredients.length > 0 && (
              <button
                onClick={clearAll}
                className="text-stone hover:text-sunday-brown rounded-lg px-4 py-2.5 font-body text-sm
                  transition-colors border border-stone/20 hover:bg-linen"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Results */}
          {hasSearched && results.length === 0 && (
            <div className="text-center py-8 bg-linen/50 rounded-xl">
              <Utensils className="w-10 h-10 text-stone/40 mx-auto mb-3" />
              <p className="font-body text-sunday-brown text-sm">
                None of your recipes use these ingredients. Try adding more!
              </p>
            </div>
          )}

          {!hasSearched && selectedIngredients.length === 0 && (
            <div className="text-center py-6 bg-linen/30 rounded-xl">
              <p className="font-body text-stone text-sm">
                Add some ingredients to find matching recipes
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map(({ recipe, matchCount, totalIngredients, score, matchedNames, recipeIngredients }) => (
                <div
                  key={recipe.id}
                  className="bg-linen rounded-xl p-4 border border-stone/10 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/recipes/${recipe.id}`}
                        className="font-display text-cast-iron text-base hover:text-sienna transition-colors line-clamp-1"
                      >
                        {recipe.title}
                      </Link>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="inline-flex items-center bg-sienna/20 text-sienna rounded-full px-3 py-1 font-body text-xs font-semibold">
                          {matchCount} of {totalIngredients} ingredients ({Math.round(score * 100)}%)
                        </span>
                        {recipe.category && (
                          <span className="text-xs font-body px-2 py-0.5 rounded-full bg-sage/30 text-sunday-brown">
                            {categoryLabels[recipe.category] || recipe.category}
                          </span>
                        )}
                        {recipe.cuisine && (
                          <span className="text-xs font-body px-2 py-0.5 rounded-full bg-honey/20 text-sunday-brown">
                            {recipe.cuisine.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add to Plan button */}
                    {onAddToPlan && (
                      <button
                        onClick={() => onAddToPlan(recipe)}
                        className="shrink-0 flex items-center gap-1.5 bg-sienna/10 text-sienna rounded-lg px-3 py-2 font-body text-xs font-semibold
                          hover:bg-sienna/20 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add to Plan
                      </button>
                    )}
                  </div>

                  {/* Ingredient Match List */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {recipeIngredients.map((ri, idx) => {
                      const isMatched = matchedNames.has(ri.name)
                      return (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 text-xs font-body ${
                            isMatched ? 'text-herb' : 'text-stone'
                          }`}
                        >
                          {isMatched ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {ri.name}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
