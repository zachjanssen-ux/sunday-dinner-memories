import { useState } from 'react'
import { Search, ChefHat, Clock, Users } from 'lucide-react'

export default function RecipePageEditor({ recipes, selectedRecipeId, onSelect }) {
  const [query, setQuery] = useState('')

  const filtered = recipes.filter((r) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      r.title?.toLowerCase().includes(q) ||
      r.cook_name?.toLowerCase().includes(q)
    )
  })

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId)

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-cast-iron">Add Recipe Page</h3>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search family recipes..."
          className="w-full pl-10 pr-4 py-2.5 bg-flour border border-stone/30 rounded-lg font-body text-sm
            text-sunday-brown focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
        />
      </div>

      {/* Recipe list */}
      <div className="max-h-80 overflow-y-auto space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-stone font-body py-4 text-center">
            {recipes.length === 0 ? 'No recipes in this family yet.' : 'No recipes match your search.'}
          </p>
        ) : (
          filtered.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => onSelect(recipe.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedRecipeId === recipe.id
                  ? 'border-sienna bg-sienna/5'
                  : 'border-stone/20 hover:border-stone/40 hover:bg-linen/50'
              }`}
            >
              <div className="font-display text-sm text-cast-iron">{recipe.title}</div>
              {recipe.cook_name && recipe.cook_name !== 'Unknown' && (
                <div className="flex items-center gap-1 mt-1 text-xs text-stone font-body">
                  <ChefHat className="w-3 h-3" />
                  {recipe.cook_name}
                </div>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-stone/70 font-body">
                {recipe.prep_time_min && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {recipe.prep_time_min}m prep
                  </span>
                )}
                {recipe.servings && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Serves {recipe.servings}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Selected preview */}
      {selectedRecipe && (
        <div className="bg-cream rounded-lg p-4 border border-stone/20">
          <div className="text-xs text-stone font-body uppercase tracking-wider mb-1">Selected</div>
          <div className="font-display text-cast-iron">{selectedRecipe.title}</div>
          {selectedRecipe.description && (
            <p className="text-sm text-sunday-brown font-body mt-1 line-clamp-2">
              {selectedRecipe.description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
