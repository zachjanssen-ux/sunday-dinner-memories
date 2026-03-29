import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import useSubscriptionStore from '../../store/subscriptionStore'
import { CreditCard, AlertTriangle, ChevronRight, Sparkles, Loader2 } from 'lucide-react'

function ProgressBar({ value, max, label, showDollar = false }) {
  const pct = max === Infinity ? 0 : Math.min(100, Math.round((value / max) * 100))
  const color =
    pct >= 100 ? 'bg-tomato' : pct >= 80 ? 'bg-butter' : 'bg-herb'
  const trackColor =
    pct >= 100 ? 'bg-tomato/15' : pct >= 80 ? 'bg-butter/15' : 'bg-herb/15'

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <span className="font-body text-xs text-sunday-brown">{label}</span>
        <span className="font-body text-xs font-semibold text-cast-iron">
          {showDollar ? `$${value.toFixed(2)}` : value}
          {' / '}
          {max === Infinity
            ? 'Unlimited'
            : showDollar
              ? `$${max.toFixed(2)}`
              : max}
        </span>
      </div>
      <div className={`h-2 rounded-full ${trackColor}`}>
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      {pct >= 80 && pct < 100 && (
        <p className="text-xs font-body text-honey mt-0.5 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Running low
        </p>
      )}
      {pct >= 100 && (
        <p className="text-xs font-body text-tomato mt-0.5 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Limit reached
        </p>
      )}
    </div>
  )
}

const PLAN_NAMES = {
  starter: 'Starter',
  homemade: 'Homemade',
  heirloom: 'Heirloom',
}

export default function UsageCard() {
  const { currentFamily, currentMember } = useAuthStore()
  const { subscription, usage, loading, fetchSubscription, fetchUsage, getPlanLimits } =
    useSubscriptionStore()

  const isAdmin = currentMember?.role === 'admin'

  useEffect(() => {
    if (currentFamily?.id) {
      fetchSubscription(currentFamily.id)
      fetchUsage(currentFamily.id)
    }
  }, [currentFamily?.id])

  // Only show to admins
  if (!isAdmin) return null

  if (loading) {
    return (
      <div className="bg-flour rounded-xl border border-stone/20 p-5 shadow-sm">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-sienna animate-spin" />
        </div>
      </div>
    )
  }

  // No subscription
  if (!subscription) {
    return (
      <div className="bg-flour rounded-xl border border-stone/20 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-honey" />
          <h3 className="font-display text-cast-iron text-base">Unlock AI Features</h3>
        </div>
        <p className="font-body text-sm text-sunday-brown/70 mb-4">
          Subscribe to unlock AI recipe scanning, smart search, meal planning, and more.
        </p>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 bg-sienna text-flour rounded-lg px-4 py-2 font-body font-semibold text-sm hover:bg-sienna/90 transition-colors"
        >
          Choose a Plan
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const limits = getPlanLimits()
  const planName = PLAN_NAMES[subscription.plan_tier] || 'Unknown'

  return (
    <div className="bg-flour rounded-xl border border-stone/20 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-sienna" />
          <h3 className="font-display text-cast-iron text-base">{planName} Plan</h3>
        </div>
        <span className="inline-flex items-center bg-herb/15 text-herb font-body font-semibold text-xs px-2 py-0.5 rounded-full">
          Active
        </span>
      </div>

      {/* Usage bars */}
      {limits && usage && (
        <div className="mb-4">
          <ProgressBar
            value={usage.recipe_count || 0}
            max={limits.maxRecipes}
            label="Recipes"
          />
          <ProgressBar
            value={Math.round(usage.audio_minutes_used || 0)}
            max={limits.maxAudioMinutes}
            label="Audio Minutes"
          />
          <ProgressBar
            value={usage.scan_count || 0}
            max={limits.scansPerMonth}
            label="AI Scans (this month)"
          />
          {limits.apiCreditCap && (
            <ProgressBar
              value={usage.api_credit_spent || 0}
              max={limits.apiCreditCap}
              label="API Credits"
              showDollar
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          to="/dashboard/billing"
          className="inline-flex items-center gap-1 text-xs font-body font-semibold text-sienna hover:text-sienna/80 transition-colors"
        >
          Manage Subscription
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
        <span className="text-stone/30">|</span>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1 text-xs font-body font-semibold text-sunday-brown/60 hover:text-sunday-brown transition-colors"
        >
          Change Plan
        </Link>
      </div>
    </div>
  )
}
