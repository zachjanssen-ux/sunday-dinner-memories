import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useRecipeStore from '../store/recipeStore'
import RecipeCard from '../components/recipes/RecipeCard'
import Layout from '../components/layout/Layout'
import { supabase } from '../lib/supabase'
import { ArrowLeft, BookOpen, Loader2, Trash2 } from 'lucide-react'

export default function CookbookDetail() {
  const { id } = useParams()
  const { user, currentMember } = useAuthStore()
  const { cookbooks, recipes, removeRecipeFromCookbook } = useRecipeStore()
  const [cookbook, setCookbook] = useState(null)
  const [cbRecipes, setCbRecipes] = useState([])
  const [loading, setLoading] = useState(true)

  const isActive = currentMember?.role === 'active' || currentMember?.role === 'admin'

  useEffect(() => {
    const cb = cookbooks.find((c) => c.id === id)
    if (cb) {
      setCookbook(cb)
      loadRecipes(cb)
    } else {
      fetchCookbook()
    }
  }, [id, cookbooks, recipes])

  const fetchCookbook = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cookbooks')
      .select(`
        *,
        cookbook_recipes ( id, recipe_id, sort_order )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching cookbook:', error)
      setLoading(false)
      return
    }

    setCookbook(data)
    loadRecipes(data)
  }

  const loadRecipes = (cb) => {
    if (!cb) return
    const recipeIds = (cb.cookbook_recipes || []).map((cr) => cr.recipe_id)
    const matched = recipes.filter((r) => recipeIds.includes(r.id))
    setCbRecipes(matched)
    setLoading(false)
  }

  const handleRemove = async (recipeId) => {
    await removeRecipeFromCookbook(id, recipeId)
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

  if (!cookbook) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <h1 className="text-2xl font-display text-cast-iron mb-3">Cookbook not found</h1>
          <Link
            to="/cookbooks"
            className="inline-flex items-center gap-2 text-sienna font-body font-semibold hover:text-sienna/80"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to cookbooks
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Link
          to="/cookbooks"
          className="inline-flex items-center gap-2 text-sienna font-body font-semibold hover:text-sienna/80 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          All Cookbooks
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-display text-cast-iron mb-1">{cookbook.title}</h1>
          {cookbook.description && (
            <p className="text-sunday-brown font-body">{cookbook.description}</p>
          )}
          <p className="text-sm text-stone font-body mt-2">
            {cbRecipes.length} recipes in this cookbook
          </p>
        </div>

        {cbRecipes.length === 0 ? (
          <div className="bg-linen rounded-xl p-12 text-center shadow-sm border border-stone/20">
            <BookOpen className="w-12 h-12 text-stone/30 mx-auto mb-4" />
            <h2 className="text-xl font-display text-cast-iron mb-2">
              This cookbook is empty
            </h2>
            <p className="text-sunday-brown font-body max-w-md mx-auto">
              Add recipes to this cookbook from any recipe's detail page using the "Add to Cookbook" button.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cbRecipes.map((recipe) => (
              <div key={recipe.id} className="relative group">
                <RecipeCard recipe={recipe} />
                {isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(recipe.id)
                    }}
                    className="absolute top-3 left-3 w-8 h-8 rounded-full bg-flour/90 backdrop-blur-sm
                      flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
                      hover:bg-tomato/10 border border-stone/20"
                    title="Remove from cookbook"
                  >
                    <Trash2 className="w-4 h-4 text-tomato" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
