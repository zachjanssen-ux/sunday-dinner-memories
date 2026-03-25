import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useSubscriptionStore from '../../store/subscriptionStore'
import Layout from '../layout/Layout'
import { Sparkles, ArrowRight } from 'lucide-react'

const PLAN_NAMES = {
  homemade: 'Homemade',
  heirloom: 'Heirloom',
}

const FEATURE_LABELS = {
  aiSearch: 'AI-Powered Search',
  mealPlan: 'Meal Planning',
  shoppingList: 'Shopping Lists',
  cookbookBuilder: 'Printable Cookbook Builder',
  imageGen: 'AI Cover Art',
}

// eslint-disable-next-line no-unused-vars
export default function PlanGate({ feature, children }) {
  const { currentFamily } = useAuthStore()
  const { subscription, loading, fetchSubscription, isFeatureAllowed, getRequiredPlan } =
    useSubscriptionStore()

  useEffect(() => {
    if (currentFamily?.id && !subscription && !loading) {
      fetchSubscription(currentFamily.id)
    }
  }, [currentFamily?.id, subscription, loading, fetchSubscription])

  if (loading) return null

  if (isFeatureAllowed(feature)) {
    return children
  }

  const requiredPlan = getRequiredPlan(feature)
  const planName = PLAN_NAMES[requiredPlan] || 'Homemade'
  const featureLabel = FEATURE_LABELS[feature] || feature

  return (
    <div className="bg-linen rounded-xl p-8 text-center max-w-lg mx-auto mt-8 border border-stone/20 shadow-sm">
      <div className="w-14 h-14 bg-honey/20 rounded-full flex items-center justify-center mx-auto mb-5">
        <Sparkles className="w-7 h-7 text-honey" />
      </div>
      <h2 className="text-2xl font-display text-cast-iron mb-3">
        Unlock {featureLabel}
      </h2>
      <p className="font-body text-sunday-brown mb-6 leading-relaxed">
        {featureLabel} is available on the{' '}
        <span className="font-semibold text-sienna">{planName}</span> plan and above.
        Upgrade to get access to this feature and more.
      </p>
      <Link
        to="/pricing"
        className="inline-flex items-center gap-2 bg-sienna text-flour rounded-lg px-6 py-3 font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors"
      >
        Upgrade to {planName}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
