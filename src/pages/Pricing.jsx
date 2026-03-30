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
      'Up to 150 recipes',
      '30 minutes of audio memories',
      '30 AI recipe scans/month',
      'Up to 5 active family members',
      'Recipe scaling',
      'Tags, cookbooks, favorites',
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
      'Up to 500 recipes',
      '120 minutes of audio memories',
      '100 AI scans/month',
      'Everything in Starter, plus:',
      'AI-powered search',
      '"What Can I Make?" ingredient finder',
      'Meal planning calendar',
      'Shopping list generator',
    ],
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'heirloom',
    name: 'Heirloom',
    price: 20,
    priceId: 'price_1TEhnDFSvGIfcR4rlnzpc1PF',
    icon: Crown,
    description: 'The complete family recipe archive.',
    features: [
      'Up to 1,000 recipes',
      '500 minutes of audio memories',
      '300 AI scans/month',
      'Everything in Homemade, plus:',
      'Printable cookbook builder',
      'QR codes for audio in printed cookbooks',
      'AI cover art generation',
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

  const handleAddonPurchase = async (priceId, addonType) => {
    if (!user) {
      navigate('/register')
      return
    }

    setLoadingTier(addonType)
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          familyId: currentFamily?.id || 'pending',
          userId: user.id,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout')

      window.location.href = data.url
    } catch (err) {
      console.error('Addon checkout error:', err)
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

        {/* Add-on Packs */}
        {user && subscription && (
          <div className="max-w-3xl mx-auto mt-12">
            <h2 className="text-2xl font-display text-cast-iron text-center mb-6">
              Need more space?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-flour rounded-xl border border-stone/20 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-honey/15 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-honey" />
                  </div>
                  <div>
                    <h3 className="font-display text-cast-iron text-lg">Audio Storage Pack</h3>
                    <p className="text-sienna font-body font-semibold">$3/month</p>
                  </div>
                </div>
                <p className="font-body text-sunday-brown/70 text-sm mb-4">
                  Add 120 extra minutes of audio memory storage.
                  Perfect for families with lots of stories to preserve.
                </p>
                <button
                  onClick={() => handleAddonPurchase('price_1TGTTVFSvGIfcR4rofPmh0cQ', 'audio')}
                  disabled={!!loadingTier}
                  className="w-full py-2.5 rounded-lg bg-honey text-flour font-body font-semibold text-sm hover:bg-honey/90 transition-colors disabled:opacity-50"
                >
                  {loadingTier === 'audio' ? 'Loading...' : 'Add Audio Storage'}
                </button>
              </div>

              <div className="bg-flour rounded-xl border border-stone/20 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-sienna/15 rounded-lg flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-sienna" />
                  </div>
                  <div>
                    <h3 className="font-display text-cast-iron text-lg">Extra Scan Pack</h3>
                    <p className="text-sienna font-body font-semibold">$2 one-time</p>
                  </div>
                </div>
                <p className="font-body text-sunday-brown/70 text-sm mb-4">
                  Add 50 extra AI recipe scans.
                  Great for digitizing a whole recipe box at once.
                </p>
                <button
                  onClick={() => handleAddonPurchase('price_1TGTWNFSvGIfcR4rDkEKFXsC', 'scans')}
                  disabled={!!loadingTier}
                  className="w-full py-2.5 rounded-lg bg-sienna text-flour font-body font-semibold text-sm hover:bg-sienna/90 transition-colors disabled:opacity-50"
                >
                  {loadingTier === 'scans' ? 'Loading...' : 'Add Scan Pack'}
                </button>
              </div>
            </div>
          </div>
        )}

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
