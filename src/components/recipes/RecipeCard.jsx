import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useRecipeStore from '../../store/recipeStore'
import { Heart, Clock, Utensils } from 'lucide-react'

const difficultyStyles = {
  easy: 'bg-herb/20 text-herb',
  medium: 'bg-butter/20 text-sunday-brown',
  advanced: 'bg-tomato/20 text-tomato',
}

const difficultyLabels = {
  easy: 'Easy',
  medium: 'Medium',
  advanced: 'Advanced',
}

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

export default function RecipeCard({ recipe }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const toggleFavorite = useRecipeStore((s) => s.toggleFavorite)

  const handleFavoriteClick = async (e) => {
    e.stopPropagation()
    if (!user) return
    await toggleFavorite(recipe.id, user.id)
  }

  return (
    <div
      onClick={() => navigate(`/recipes/${recipe.id}`)}
      className="bg-linen rounded-xl shadow-sm border border-stone/20 overflow-hidden cursor-pointer
        hover:shadow-md hover:-translate-y-1 transition-all duration-200"
    >
      {/* Photo */}
      <div className="relative h-48 bg-stone/10 overflow-hidden">
        {recipe.original_image_url ? (
          <img
            src={recipe.original_image_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-cream">
            <div className="text-center">
              <Utensils className="w-12 h-12 text-stone/30 mx-auto mb-2" />
              <p className="text-stone/40 text-sm font-body">No photo yet</p>
            </div>
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={handleFavoriteClick}
          aria-label={recipe.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-flour/80 backdrop-blur-sm flex items-center justify-center
            hover:bg-flour transition-colors shadow-sm"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              recipe.is_favorited ? 'fill-tomato text-tomato' : 'text-stone'
            }`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display text-lg text-cast-iron mb-1 line-clamp-2">
          {recipe.title}
        </h3>

        {recipe.cook_name && (
          <p className="font-handwritten text-base text-sunday-brown/70 mb-3">
            A recipe by {recipe.cook_name}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {recipe.category && (
            <span className="text-xs font-body font-semibold px-2.5 py-1 rounded-full bg-sage/30 text-sunday-brown">
              {categoryLabels[recipe.category] || recipe.category}
            </span>
          )}
          {recipe.cuisine && (
            <span className="text-xs font-body font-semibold px-2.5 py-1 rounded-full bg-honey/20 text-sunday-brown">
              {recipe.cuisine.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          )}
          {recipe.difficulty && (
            <span
              className={`text-xs font-body font-semibold px-2.5 py-1 rounded-full ${
                difficultyStyles[recipe.difficulty] || ''
              }`}
            >
              {difficultyLabels[recipe.difficulty] || recipe.difficulty}
            </span>
          )}
        </div>

        {/* Dietary labels */}
        {recipe.dietary_labels?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {recipe.dietary_labels.map((label) => (
              <span
                key={label}
                className="text-xs font-body px-2 py-0.5 rounded-full bg-herb/10 text-herb"
              >
                {label.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Time & servings */}
        <div className="flex items-center gap-4 text-sm text-sunday-brown/60 font-body">
          {(recipe.prep_time_min || recipe.cook_time_min) && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {recipe.prep_time_min && recipe.cook_time_min
                  ? `${recipe.prep_time_min + recipe.cook_time_min} min`
                  : `${recipe.prep_time_min || recipe.cook_time_min} min`}
              </span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5" />
              <span>{recipe.servings} servings</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
