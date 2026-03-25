import { useState, useEffect } from 'react'
import { Package, Truck, CheckCircle, Clock, Gift, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: Package },
  printing: { label: 'Printing', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

export default function OrderHistory({ familyId }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('print_orders')
        .select('*, printable_cookbooks(title)')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Failed to fetch print orders:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (familyId) fetchOrders()
  }, [familyId])

  const handleRefreshStatus = async (order) => {
    if (!order.lulu_print_job_id) return
    setRefreshing(true)

    try {
      const resp = await fetch('/api/check-print-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ luluPrintJobId: order.lulu_print_job_id }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error)

      // Update local state with new status
      const newStatus = data.status?.toLowerCase() || order.status
      const trackingUrl = data.trackingUrl || order.lulu_tracking_url

      // Update in Supabase
      await supabase
        .from('print_orders')
        .update({ status: newStatus, lulu_tracking_url: trackingUrl })
        .eq('id', order.id)

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: newStatus, lulu_tracking_url: trackingUrl } : o
        )
      )
    } catch (err) {
      console.error('Failed to refresh status:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const formatUSD = (amount) => {
    if (amount == null) return '--'
    return `$${parseFloat(amount).toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-sienna" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-10 h-10 text-stone/40 mx-auto mb-3" />
        <p className="font-body text-stone text-sm">No print orders yet</p>
        <p className="font-body text-stone/60 text-xs mt-1">
          Order a printed cookbook from the cookbook builder.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-cast-iron">Print Orders</h3>
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-flour rounded-lg border border-stone/20 p-4 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="font-body font-semibold text-cast-iron text-sm">
                {order.printable_cookbooks?.title || 'Cookbook'}
              </div>
              <div className="text-xs text-stone font-body mt-0.5">
                {order.cover_type === 'hardcover' ? 'Hardcover' : 'Softcover'} &middot; Qty{' '}
                {order.quantity} &middot;{' '}
                {new Date(order.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {order.is_gift && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-honey/20 text-honey">
                  <Gift className="w-3 h-3" />
                  Gift
                </span>
              )}
              <StatusBadge status={order.status} />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm font-body">
            <span className="text-stone">Total charged</span>
            <span className="font-semibold text-cast-iron">{formatUSD(order.total_charged)}</span>
          </div>

          <div className="flex items-center gap-2">
            {order.lulu_tracking_url && (
              <a
                href={order.lulu_tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-body font-semibold text-sienna hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Track Package
              </a>
            )}
            {order.lulu_print_job_id && (
              <button
                onClick={() => handleRefreshStatus(order)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 text-xs font-body text-stone hover:text-sunday-brown disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Status
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
