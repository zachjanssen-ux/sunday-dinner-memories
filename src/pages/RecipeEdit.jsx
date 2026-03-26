import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useRecipeStore from '../store/recipeStore'
import useRecipePermissions from '../hooks/useRecipePermissions'
import RecipeForm from '../components/recipes/RecipeForm'
import Layout from '../components/layout/Layout'
import { supabase } from '../lib/supabase'
import { Loader2, ShieldAlert } from 'lucide-react'

export default function RecipeEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentFamily } = useAuthStore()
  const { recipes, fetchCooks, fetchTags, updateRecipe } = useRecipeStore()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)

  const permissions = useRecipePermissions(recipe)

  useEffect(() => {
    if (currentFamily?.id) {
      fetchCooks(currentFamily.id)
      fetchTags(currentFamily.id)
    }
  }, [currentFamily?.id])

  useEffect(() => {
    const existing = recipes.find((r) => r.id === id)
    if (existing && existing.recipe_ingredients) {
      setRecipe(existing)
      setLoading(false)
    } else {
      fetchRecipe()
    }
  }, [id, recipes])

  const fetchRecipe = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        cooks ( id, name, bio, photo_url ),
        recipe_tags ( id, tag_id, tags ( id, name ) ),
        recipe_ingredients ( id, ingredient_id, quantity, quantity_numeric, unit, notes, sort_order, ingredients ( id, name ) )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching recipe:', error)
      setLoading(false)
      return
    }

    setRecipe({
      ...data,
      cook_name: data.cooks?.name || 'Unknown',
    })
    setLoading(false)
  }

  const handleSave = async (recipeData, ingredients, instructions, tagIds) => {
    // Remove fields that shouldn't be in the update
    const { family_id, contributed_by, source, ...updates } = recipeData
    await updateRecipe(id, updates, ingredients, instructions, tagIds)
    navigate(`/recipes/${id}`)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sienna animate-spin" />
        </div>
      </Layout>
    )
  }

  if (!recipe) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <h1 className="text-2xl font-display text-cast-iron mb-3">Recipe not found</h1>
          <p className="text-sunday-brown font-body">
            This recipe may have been removed.
          </p>
        </div>
      </Layout>
    )
  }

  if (!permissions.canEdit) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center py-20">
          <ShieldAlert className="w-12 h-12 text-honey mx-auto mb-4" />
          <h1 className="text-2xl font-display text-cast-iron mb-3">Access Denied</h1>
          <p className="text-sunday-brown font-body mb-6">
            Only the contributor who added this recipe can edit it.
          </p>
          <button
            onClick={() => navigate(`/recipes/${id}`)}
            className="bg-sienna text-flour rounded-lg px-6 py-3 font-body font-semibold shadow-md hover:bg-sienna/90"
          >
            View Recipe
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-display text-cast-iron mb-2">Edit Recipe</h1>
        <p className="text-sunday-brown font-body mb-8">
          Update the details for {recipe.title}.
        </p>
        <div className="bg-linen rounded-xl p-6 lg:p-8 border border-stone/20 shadow-sm">
          <RecipeForm
            recipe={recipe}
            onSave={handleSave}
            onCancel={() => navigate(`/recipes/${id}`)}
          />
        </div>
      </div>
    </Layout>
  )
}
