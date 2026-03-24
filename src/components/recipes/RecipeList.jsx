import RecipeCard from './RecipeCard'
import { Utensils } from 'lucide-react'

export default function RecipeList({ recipes }) {
  if (!recipes || recipes.length === 0) {
    return (
      <div className="bg-linen rounded-xl p-12 text-center shadow-sm border border-stone/20">
        <div className="max-w-sm mx-auto">
          <Utensils className="w-16 h-16 text-stone/30 mx-auto mb-6" />
          <h2 className="text-2xl font-display text-cast-iron mb-3">
            Your kitchen is quiet
          </h2>
          <p className="text-sunday-brown font-body">
            Let's fill it with family favorites. Add your first recipe to get
            started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}
