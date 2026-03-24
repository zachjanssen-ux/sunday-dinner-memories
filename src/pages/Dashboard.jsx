import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useRecipeStore from '../store/recipeStore'
import Layout from '../components/layout/Layout'
import FilterBar from '../components/recipes/FilterBar'
import RecipeList from '../components/recipes/RecipeList'
import OnboardingFlow from '../components/onboarding/OnboardingFlow'
import BetaBanner from '../components/onboarding/BetaBanner'
import FeedbackButton from '../components/feedback/FeedbackButton'
import { Plus, Users, ChefHat, Loader2 } from 'lucide-react'

export default function Dashboard() {
  const { currentFamily, currentMember, user } = useAuthStore()
  const {
    fetchRecipes,
    fetchCooks,
    fetchTags,
    fetchCookbooks,
    getFilteredRecipes,
    loading,
  } = useRecipeStore()

  const isActive = currentMember?.role === 'active' || currentMember?.role === 'admin'

  useEffect(() => {
    if (currentFamily?.id && user?.id) {
      fetchRecipes(currentFamily.id, user.id)
      fetchCooks(currentFamily.id)
      fetchTags(currentFamily.id)
      fetchCookbooks(currentFamily.id)
    }
  }, [currentFamily?.id, user?.id])

  // No family yet
  if (!currentFamily) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto text-center mt-16">
          <ChefHat className="w-16 h-16 text-sienna mx-auto mb-6" />
          <h1 className="text-3xl font-display text-cast-iron mb-3">
            You're not in a family yet
          </h1>
          <p className="text-sunday-brown font-body mb-8">
            Create a new family kitchen or join an existing one with an invite code.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/create-family"
              className="bg-sienna text-flour rounded-lg px-6 py-3 font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors"
            >
              Create a Family
            </Link>
            <Link
              to="/join"
              className="bg-linen text-cast-iron rounded-lg px-6 py-3 font-body font-semibold shadow-sm hover:bg-linen/80 transition-colors border border-stone/20"
            >
              Join with Invite Code
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const filteredRecipes = getFilteredRecipes()

  return (
    <Layout>
      <OnboardingFlow />
      <FeedbackButton />
      <div className="max-w-6xl mx-auto">
        {/* Beta Banner */}
        <BetaBanner />

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display text-cast-iron mb-1">
              {currentFamily.name}
            </h1>
            <div className="flex items-center gap-2 text-sunday-brown font-body text-sm">
              <Users className="w-4 h-4" />
              <span>Family Kitchen</span>
            </div>
          </div>
          {isActive && (
            <Link
              to="/recipes/new"
              className="inline-flex items-center gap-2 bg-sienna text-flour rounded-lg px-5 py-2.5
                font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Recipe</span>
            </Link>
          )}
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar />
        </div>

        {/* Recipe Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-sienna animate-spin" />
          </div>
        ) : (
          <RecipeList recipes={filteredRecipes} />
        )}
      </div>
    </Layout>
  )
}
