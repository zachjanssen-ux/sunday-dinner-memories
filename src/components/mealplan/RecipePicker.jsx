import { useState } from 'react'
import { Search, Clock, X } from 'lucide-react'

export default function RecipePicker({ recipes, onSelect, onClose }) {
  const [search, setSearch] = useState('')

  const filtered = recipes.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.title?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q) ||
      r.cuisine?.toLowerCase().includes(q)
    )
  })

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
      </div>

      {/* Recipe List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-stone font-body text-sm">
            {search ? 'No recipes match your search' : 'No recipes available'}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => onSelect(recipe)}
                className="w-full text-left p-3 rounded-lg hover:bg-linen transition-colors flex items-center gap-3 group"
              >
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
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
