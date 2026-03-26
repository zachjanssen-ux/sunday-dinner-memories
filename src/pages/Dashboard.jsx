import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useRecipeStore from '../store/recipeStore'
import useSubscriptionStore from '../store/subscriptionStore'
import Layout from '../components/layout/Layout'
import FilterBar from '../components/recipes/FilterBar'
import RecipeList from '../components/recipes/RecipeList'
import OnboardingFlow from '../components/onboarding/OnboardingFlow'
import BetaBanner from '../components/onboarding/BetaBanner'
import FeedbackButton from '../components/feedback/FeedbackButton'
import { toast } from 'react-hot-toast'
import { Plus, Users, ChefHat, Loader2, CreditCard, ArrowUpRight, AlertTriangle, Sparkles } from 'lucide-react'

function UsageCard() {
  const { currentFamily, currentMember } = useAuthStore()
  const { subscription, usage, loading, fetchSubscription, fetchUsage, getPlanLimits, getUsagePercentage } =
    useSubscriptionStore()

  const isAdmin = currentMember?.role === 'admin'

  useEffect(() => {
    if (currentFamily?.id) {
      fetchSubscription(currentFamily.id)
      fetchUsage(currentFamily.id)
    }
  }, [currentFamily?.id])

  if (loading || !isAdmin) return null

  // No subscription state
  if (!subscription) {
    return (
      <div className="bg-flour rounded-xl border border-stone/20 p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-honey/15 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-honey" />
          </div>
          <div>
            <h3 className="font-display text-cast-iron text-base">Choose a Plan</h3>
            <p className="font-body text-xs text-stone">Unlock AI scanning, search, and more</p>
          </div>
        </div>
        <Link
          to="/pricing"
          className="flex items-center justify-center gap-2 w-full bg-sienna text-flour rounded-lg px-4 py-2.5 font-body font-semibold text-sm hover:bg-sienna/90 transition-colors"
        >
          View Plans
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const limits = getPlanLimits()
  const pct = getUsagePercentage()
  const planNames = { starter: 'Starter', homemade: 'Homemade', heirloom: 'Heirloom' }

  const scanBarColor =
    pct.scans >= 100 ? 'bg-tomato' : pct.scans >= 80 ? 'bg-butter' : 'bg-herb'
  const scanTrackColor =
    pct.scans >= 100 ? 'bg-tomato/15' : pct.scans >= 80 ? 'bg-butter/15' : 'bg-herb/15'
  const creditBarColor =
    pct.credits >= 100 ? 'bg-tomato' : pct.credits >= 80 ? 'bg-butter' : 'bg-herb'
  const creditTrackColor =
    pct.credits >= 100 ? 'bg-tomato/15' : pct.credits >= 80 ? 'bg-butter/15' : 'bg-herb/15'

  return (
    <div className="bg-flour rounded-xl border border-stone/20 p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sienna/15 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-sienna" />
          </div>
          <div>
            <h3 className="font-display text-cast-iron text-base">
              {planNames[subscription.plan_tier] || 'Plan'}
            </h3>
            <p className="font-body text-xs text-stone">Current plan</p>
          </div>
        </div>
        <span className="inline-flex items-center bg-herb/15 text-herb font-body font-semibold text-xs px-2.5 py-1 rounded-full">
          Active
        </span>
      </div>

      {/* Scan usage */}
      {limits && limits.scansPerMonth !== Infinity && usage && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-body text-xs text-sunday-brown">AI Scans</span>
            <span className="font-body text-xs font-semibold text-cast-iron">
              {usage.scan_count || 0} / {limits.scansPerMonth}
            </span>
          </div>
          <div className={`h-2 rounded-full ${scanTrackColor}`}>
            <div
              className={`h-full rounded-full transition-all ${scanBarColor}`}
              style={{ width: `${pct.scans}%` }}
            />
          </div>
          {pct.scans >= 80 && pct.scans < 100 && (
            <p className="text-xs font-body text-honey mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Approaching limit
            </p>
          )}
          {pct.scans >= 100 && (
            <p className="text-xs font-body text-tomato mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Limit reached
            </p>
          )}
        </div>
      )}

      {/* Credit usage */}
      {limits && limits.apiCreditCap && usage && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-body text-xs text-sunday-brown">API Credits</span>
            <span className="font-body text-xs font-semibold text-cast-iron">
              ${(usage.api_credit_spent || 0).toFixed(2)} / ${limits.apiCreditCap.toFixed(2)}
            </span>
          </div>
          <div className={`h-2 rounded-full ${creditTrackColor}`}>
            <div
              className={`h-full rounded-full transition-all ${creditBarColor}`}
              style={{ width: `${pct.credits}%` }}
            />
          </div>
          {pct.credits >= 80 && pct.credits < 100 && (
            <p className="text-xs font-body text-honey mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Approaching limit
            </p>
          )}
          {pct.credits >= 100 && (
            <p className="text-xs font-body text-tomato mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Limit reached
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        {subscription.plan_tier !== 'heirloom' && (
          <Link
            to="/pricing"
            className="flex-1 flex items-center justify-center gap-1.5 bg-linen text-cast-iron rounded-lg px-3 py-2 font-body font-semibold text-xs hover:bg-linen/80 transition-colors border border-stone/20"
          >
            Upgrade Plan
          </Link>
        )}
        <Link
          to="/billing"
          className="flex-1 flex items-center justify-center gap-1.5 bg-cast-iron text-flour rounded-lg px-3 py-2 font-body font-semibold text-xs hover:bg-cast-iron/90 transition-colors"
        >
          Manage
        </Link>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [searchParams] = useSearchParams()
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

  // Show success toast if coming from checkout
  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      toast.success('Subscription activated! Welcome aboard.', { duration: 5000 })
    }
  }, [])

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

        {/* Usage Card — admin only */}
        <UsageCard />

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
