import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useSubscriptionStore from '../store/subscriptionStore'
import Layout from '../components/layout/Layout'
import { toast } from 'react-hot-toast'
import {
  Check,
  Star,
  Sparkles,
  ChefHat,
  Crown,
  Loader2,
  ArrowLeft,
  Tag,
} from 'lucide-react'

const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 7,
    priceId: 'price_1TEhfLFSvGIfcR4rY7i8BF6a',
    icon: ChefHat,
    description: 'Perfect for getting started with your family recipes.',
    features: [
      'Up to 5 active family members',
      '30 AI recipe scans/month',
      'Unlimited manual entry',
      'Recipe scaling',
      'Tags, cookbooks, favorites',
      'Audio memories',
      'PDF export',
      'Public recipe sharing',
    ],
    highlight: false,
  },
  {
    id: 'homemade',
    name: 'Homemade',
    price: 15,
    priceId: 'price_1TEhjQFSvGIfcR4rO51y7KiO',
    icon: Star,
    description: 'For families who love to cook and plan together.',
    features: [
      'Everything in Starter',
      '100 AI scans/month',
      'AI-powered search',
      'Meal planning calendar',
      'Shopping list generator',
      '$4 API credit cap',
    ],
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'heirloom',
    name: 'Heirloom',
    price: 20,
    priceId: 'price_1TEhnDFSvGIfcR4rInzpc1PF',
    icon: Crown,
    description: 'The complete family recipe experience.',
    features: [
      'Everything in Homemade',
      'Unlimited AI scans',
      'Printable cookbook builder',
      'AI cover art ($0.30 each)',
      '$7 API credit cap',
    ],
    highlight: false,
  },
]

export default function Pricing() {
  const navigate = useNavigate()
  const { user, currentFamily, currentMember } = useAuthStore()
  const { subscription, fetchSubscription } = useSubscriptionStore()
  const [loadingTier, setLoadingTier] = useState(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  useEffect(() => {
    if (currentFamily?.id) {
      fetchSubscription(currentFamily.id)
    }
  }, [currentFamily?.id])

  const handleSubscribe = async (tier) => {
    if (!user) {
      navigate('/register')
      return
    }

    setLoadingTier(tier.id)
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: tier.priceId,
          familyId: currentFamily?.id || 'pending',
          userId: user.id,
          promoCode: promoCode.trim() || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout')

      // Redirect to Stripe Checkout URL
      window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
      toast.error(err.message || 'Failed to start checkout')
    } finally {
      setLoadingTier(null)
    }
  }

  const currentTier = subscription?.plan_tier

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        {user && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sunday-brown/70 hover:text-sunday-brown font-body text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-honey/15 text-honey font-body font-semibold text-sm px-4 py-1.5 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            Choose Your Plan
          </div>
          <h1 className="text-4xl lg:text-5xl font-display text-cast-iron mb-4">
            Preserve Your Family's Recipes
          </h1>
          <p className="text-lg font-body text-sunday-brown/80 max-w-2xl mx-auto leading-relaxed">
            From handwritten recipe cards to a beautiful digital collection your whole family can enjoy.
            Pick the plan that fits your kitchen.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {TIERS.map((tier) => {
            const isCurrentPlan = currentTier === tier.id
            const TierIcon = tier.icon

            return (
              <div
                key={tier.id}
                className={`relative bg-flour rounded-2xl shadow-lg overflow-hidden transition-transform hover:-translate-y-1 ${
                  tier.highlight
                    ? 'border-2 border-sienna ring-4 ring-sienna/10'
                    : 'border border-stone/20'
                }`}
              >
                {/* Popular badge */}
                {tier.badge && (
                  <div className="absolute top-0 right-0 bg-sienna text-flour text-xs font-body font-semibold px-4 py-1.5 rounded-bl-xl">
                    {tier.badge}
                  </div>
                )}

                <div className="p-8">
                  {/* Icon & name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        tier.highlight
                          ? 'bg-sienna/15 text-sienna'
                          : 'bg-linen text-sunday-brown'
                      }`}
                    >
                      <TierIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-display text-cast-iron">{tier.name}</h2>
                  </div>

                  {/* Description */}
                  <p className="font-body text-sunday-brown/70 text-sm mb-6 leading-relaxed">
                    {tier.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-display text-cast-iron">${tier.price}</span>
                    <span className="text-sunday-brown/60 font-body text-sm">/month</span>
                  </div>

                  {/* CTA Button */}
                  {isCurrentPlan ? (
                    <div className="w-full py-3 px-4 rounded-lg bg-herb/15 text-herb font-body font-semibold text-center border border-herb/30">
                      Your Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(tier)}
                      disabled={!!loadingTier}
                      className={`w-full py-3 px-4 rounded-lg font-body font-semibold transition-colors flex items-center justify-center gap-2 ${
                        tier.highlight
                          ? 'bg-sienna text-flour hover:bg-sienna/90 shadow-md'
                          : 'bg-cast-iron text-flour hover:bg-cast-iron/90'
                      } disabled:opacity-50`}
                    >
                      {loadingTier === tier.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </>
                      ) : currentTier ? (
                        'Switch Plan'
                      ) : (
                        'Subscribe'
                      )}
                    </button>
                  )}

                  {/* Features */}
                  <ul className="mt-8 space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            tier.highlight ? 'text-sienna' : 'text-herb'
                          }`}
                        />
                        <span className="font-body text-sm text-sunday-brown">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>

        {/* Promo Code */}
        <div className="max-w-md mx-auto mt-10 bg-flour rounded-xl border border-stone/20 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-honey" />
            <span className="font-body font-semibold text-sunday-brown text-sm">Have a promo code?</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase())
                setPromoApplied(false)
              }}
              placeholder="Enter code"
              className="flex-1 bg-cream border border-stone/30 rounded-lg px-4 py-2.5 font-body text-sunday-brown placeholder:text-stone focus:ring-2 focus:ring-sienna/50 focus:border-sienna text-sm"
            />
            {promoCode && (
              <button
                onClick={() => {
                  setPromoApplied(true)
                  toast.success(`Code "${promoCode}" will be applied at checkout!`)
                }}
                className="bg-sienna text-flour rounded-lg px-5 py-2.5 font-body font-semibold text-sm hover:bg-sienna/90 transition-colors"
              >
                Apply
              </button>
            )}
          </div>
          {promoApplied && promoCode && (
            <p className="mt-2 text-herb font-body text-xs flex items-center gap-1">
              <Check className="w-3 h-3" />
              Code "{promoCode}" will be applied at checkout
            </p>
          )}
        </div>

        {/* Footer note */}
        <div className="text-center mt-8 mb-4">
          <p className="font-body text-sm text-stone">
            All plans include a 14-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </Layout>
  )
}
