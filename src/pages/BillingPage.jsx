import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useSubscriptionStore from '../store/subscriptionStore'
import { supabase } from '../lib/supabase'
import Layout from '../components/layout/Layout'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import {
  CreditCard,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Receipt,
} from 'lucide-react'

function ProgressBar({ value, max, label, showDollar = false }) {
  const pct = max === Infinity ? 0 : Math.min(100, Math.round((value / max) * 100))
  const color =
    pct >= 100 ? 'bg-tomato' : pct >= 80 ? 'bg-butter' : 'bg-herb'
  const trackColor =
    pct >= 100 ? 'bg-tomato/15' : pct >= 80 ? 'bg-butter/15' : 'bg-herb/15'

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-body text-sm text-sunday-brown">{label}</span>
        <span className="font-body text-sm font-semibold text-cast-iron">
          {showDollar ? `$${value.toFixed(2)}` : value}
          {' / '}
          {max === Infinity
            ? 'Unlimited'
            : showDollar
              ? `$${max.toFixed(2)}`
              : max}
        </span>
      </div>
      <div className={`h-2.5 rounded-full ${trackColor}`}>
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct >= 80 && pct < 100 && (
        <p className="text-xs font-body text-honey mt-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Approaching limit
        </p>
      )}
      {pct >= 100 && (
        <p className="text-xs font-body text-tomato mt-1 flex items-center gap-1">
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

export default function BillingPage() {
  const { currentFamily, currentMember, user } = useAuthStore()
  const { subscription, usage, loading, fetchSubscription, fetchUsage, getPlanLimits } =
    useSubscriptionStore()

  const [portalLoading, setPortalLoading] = useState(false)
  const [usageLog, setUsageLog] = useState([])
  const [logLoading, setLogLoading] = useState(false)

  const isAdmin = currentMember?.role === 'admin'

  useEffect(() => {
    if (currentFamily?.id) {
      fetchSubscription(currentFamily.id)
      fetchUsage(currentFamily.id)
      fetchUsageLog(currentFamily.id)
    }
  }, [currentFamily?.id])

  const fetchUsageLog = async (familyId) => {
    setLogLoading(true)
    try {
      const { data, error } = await supabase
        .from('usage_log')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(25)

      if (error) throw error
      setUsageLog(data || [])
    } catch (err) {
      console.error('Error fetching usage log:', err)
    } finally {
      setLogLoading(false)
    }
  }

  const handleManageBilling = async () => {
    if (!subscription?.stripe_customer_id) {
      toast.error('No active subscription found.')
      return
    }
    setPortalLoading(true)
    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: subscription.stripe_customer_id }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to open billing portal')
      window.location.href = data.url
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPortalLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto text-center mt-16">
          <CreditCard className="w-12 h-12 text-stone/40 mx-auto mb-4" />
          <h1 className="text-2xl font-display text-cast-iron mb-2">Admin Only</h1>
          <p className="font-body text-sunday-brown">
            Only family admins can manage billing and subscriptions.
          </p>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-sienna animate-spin" />
        </div>
      </Layout>
    )
  }

  const limits = getPlanLimits()
  const planName = PLAN_NAMES[subscription?.plan_tier] || 'No Plan'

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-display text-cast-iron mb-1">Billing</h1>
        <p className="text-sunday-brown/70 font-body text-sm mb-8">
          Manage your subscription, view usage, and update billing details.
        </p>

        {/* No subscription state */}
        {!subscription && (
          <div className="bg-linen rounded-xl p-8 text-center border border-stone/20 mb-8">
            <CreditCard className="w-12 h-12 text-stone/30 mx-auto mb-4" />
            <h2 className="text-xl font-display text-cast-iron mb-2">No Active Subscription</h2>
            <p className="font-body text-sunday-brown mb-6">
              Choose a plan to unlock AI-powered features for your family.
            </p>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 bg-sienna text-flour rounded-lg px-6 py-3 font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors"
            >
              Choose a Plan
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Current Plan */}
        {subscription && (
          <div className="bg-flour rounded-xl border border-stone/20 p-6 mb-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-body text-sm text-stone uppercase tracking-wider mb-1">
                  Current Plan
                </p>
                <h2 className="text-2xl font-display text-cast-iron">{planName}</h2>
              </div>
              <span className="inline-flex items-center gap-1 bg-herb/15 text-herb font-body font-semibold text-sm px-3 py-1 rounded-full">
                Active
              </span>
            </div>

            {subscription.current_period_end && (
              <p className="font-body text-sm text-sunday-brown mb-4">
                Next billing date:{' '}
                <span className="font-semibold">
                  {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}
                </span>
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-1.5 bg-linen text-cast-iron rounded-lg px-4 py-2.5 font-body font-semibold text-sm hover:bg-linen/80 transition-colors border border-stone/20"
              >
                Change Plan
              </Link>
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="inline-flex items-center gap-1.5 bg-cast-iron text-flour rounded-lg px-4 py-2.5 font-body font-semibold text-sm hover:bg-cast-iron/90 transition-colors disabled:opacity-50"
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
                Manage Billing
              </button>
            </div>
          </div>
        )}

        {/* Usage Stats */}
        {subscription && limits && usage && (
          <div className="bg-flour rounded-xl border border-stone/20 p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-display text-cast-iron mb-4">Usage This Period</h3>
            <ProgressBar
              value={usage.scans_used || 0}
              max={limits.scansPerMonth}
              label="AI Scans"
            />
            {limits.apiCreditCap && (
              <ProgressBar
                value={usage.api_credits_used || 0}
                max={limits.apiCreditCap}
                label="API Credits"
                showDollar
              />
            )}
          </div>
        )}

        {/* Usage History */}
        {subscription && (
          <div className="bg-flour rounded-xl border border-stone/20 p-6 shadow-sm">
            <h3 className="text-lg font-display text-cast-iron mb-4">Recent Activity</h3>
            {logLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-sienna animate-spin" />
              </div>
            ) : usageLog.length === 0 ? (
              <p className="font-body text-sm text-stone text-center py-6">
                No usage activity yet.
              </p>
            ) : (
              <div className="space-y-2">
                {usageLog.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-2.5 border-b border-stone/10 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Receipt className="w-4 h-4 text-stone/50" />
                      <div>
                        <p className="font-body text-sm text-cast-iron capitalize">
                          {(log.action_type || '').replace(/_/g, ' ')}
                        </p>
                        <p className="font-body text-xs text-stone">
                          {log.model_used || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {log.api_cost > 0 && (
                        <p className="font-body text-sm font-semibold text-cast-iron">
                          ${Number(log.api_cost).toFixed(4)}
                        </p>
                      )}
                      <p className="font-body text-xs text-stone">
                        {format(new Date(log.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
