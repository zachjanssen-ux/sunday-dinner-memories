import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useRecipeStore from '../store/recipeStore'
import RecipeForm from '../components/recipes/RecipeForm'
import Layout from '../components/layout/Layout'

export default function RecipeNew() {
  const navigate = useNavigate()
  const { currentFamily } = useAuthStore()
  const { fetchCooks, fetchTags } = useRecipeStore()

  useEffect(() => {
    if (currentFamily?.id) {
      fetchCooks(currentFamily.id)
      fetchTags(currentFamily.id)
    }
  }, [currentFamily?.id])

  const handleSave = async (recipeData, ingredients, instructions, tagIds) => {
    const { addRecipe } = useRecipeStore.getState()
    const newRecipe = await addRecipe(recipeData, ingredients, instructions, tagIds)
    navigate(`/recipes/${newRecipe.id}`)
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-display text-cast-iron mb-2">Add a Recipe</h1>
        <p className="text-sunday-brown font-body mb-8">
          Share a family favorite. Type it in, and we'll keep it safe forever.
        </p>
        <div className="bg-linen rounded-xl p-6 lg:p-8 border border-stone/20 shadow-sm">
          <RecipeForm onSave={handleSave} onCancel={() => navigate('/dashboard')} />
        </div>
      </div>
    </Layout>
  )
}
