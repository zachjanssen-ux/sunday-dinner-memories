import { useState, useEffect, useCallback } from 'react'
import { X, Printer, Gift, Truck, CreditCard, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export default function OrderPrintModal({ cookbook, onClose }) {
  const [coverType, setCoverType] = useState('softcover')
  const [quantity, setQuantity] = useState(1)
  const [isGift, setIsGift] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [address, setAddress] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
  })

  // Quote state
  const [quote, setQuote] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState(null)

  // Order state
  const [ordering, setOrdering] = useState(false)
  const [orderError, setOrderError] = useState(null)

  const pageCount = cookbook?.page_count || 0

  // Fetch quote when cover type, quantity, or address changes (debounced)
  const fetchQuote = useCallback(async () => {
    if (!pageCount || pageCount < 2) {
      setQuoteError('Cookbook must have at least 2 pages to print.')
      return
    }

    setQuoteLoading(true)
    setQuoteError(null)

    try {
      const resp = await fetch('/api/get-print-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageCount,
          coverType,
          quantity,
          shippingAddress: address.city
            ? { name: address.name, line1: address.line1, city: address.city, state: address.state, zip: address.zip }
            : undefined,
        }),
      })

      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Failed to get quote')

      setQuote(data)
    } catch (err) {
      console.error('Quote error:', err)
      setQuoteError(err.message)
      setQuote(null)
    } finally {
      setQuoteLoading(false)
    }
  }, [pageCount, coverType, quantity, address.city, address.state, address.zip])

  useEffect(() => {
    const timer = setTimeout(fetchQuote, 600)
    return () => clearTimeout(timer)
  }, [fetchQuote])

  const formatUSD = (amount) => {
    if (amount == null) return '--'
    return `$${parseFloat(amount).toFixed(2)}`
  }

  const isAddressValid =
    address.name.trim() && address.line1.trim() && address.city.trim() && address.state.trim() && address.zip.trim()

  const canOrder = quote && isAddressValid && !quoteLoading && !ordering

  const handleOrder = async () => {
    if (!canOrder) return
    setOrdering(true)
    setOrderError(null)

    try {
      // Create Stripe checkout session
      const resp = await fetch('/api/create-print-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cookbookId: cookbook.id,
          cookbookTitle: cookbook.title,
          coverType,
          quantity,
          totalAmount: quote.total,
          shippingAddress: address,
          isGift,
          giftMessage: isGift ? giftMessage : '',
          contactEmail,
        }),
      })

      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Failed to create checkout')

      // Redirect to Stripe
      const stripe = await stripePromise
      const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId })
      if (error) throw new Error(error.message)
    } catch (err) {
      console.error('Order error:', err)
      setOrderError(err.message)
      setOrdering(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-cast-iron/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-flour rounded-xl max-w-lg w-full shadow-xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone/20">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-sienna" />
            <h3 className="font-display text-lg text-cast-iron">Order Printed Copy</h3>
          </div>
          <button onClick={onClose} className="text-stone hover:text-sunday-brown">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Cover type */}
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-2">Cover Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'softcover', label: 'Softcover', desc: 'Lightweight & flexible' },
                { value: 'hardcover', label: 'Hardcover', desc: 'Durable & premium' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCoverType(opt.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    coverType === opt.value
                      ? 'border-sienna bg-sienna/5'
                      : 'border-stone/20 hover:border-stone/40'
                  }`}
                >
                  <div className="font-body font-semibold text-cast-iron text-sm">{opt.label}</div>
                  <div className="text-xs text-stone font-body mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 bg-flour border border-stone/30 rounded-lg px-4 py-2 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none"
            />
          </div>

          {/* Price breakdown */}
          <div className="bg-cream rounded-lg p-4 border border-stone/20">
            <div className="text-sm font-body font-semibold text-cast-iron mb-2">Price Breakdown</div>

            {quoteLoading && (
              <div className="flex items-center gap-2 text-sm font-body text-stone py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Calculating price...
              </div>
            )}

            {quoteError && !quoteLoading && (
              <div className="flex items-center gap-2 text-sm font-body text-red-600 py-2">
                <AlertCircle className="w-4 h-4" />
                {quoteError}
              </div>
            )}

            {quote && !quoteLoading && (
              <div className="space-y-1 text-sm font-body text-sunday-brown">
                <div className="flex justify-between">
                  <span>
                    Printing ({coverType}, {pageCount} pages x {quantity})
                  </span>
                  <span>{formatUSD(quote.luluBaseCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform fee</span>
                  <span>{formatUSD(quote.markupAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated shipping</span>
                  <span>{quote.shippingCost > 0 ? formatUSD(quote.shippingCost) : 'Calculated at checkout'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone/20 font-semibold text-cast-iron">
                  <span>Total</span>
                  <span>{formatUSD(quote.total)}</span>
                </div>
              </div>
            )}

            {!quote && !quoteLoading && !quoteError && (
              <p className="text-xs text-stone">Enter details above to see pricing.</p>
            )}
          </div>

          {/* Contact email */}
          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-2.5 font-body text-sm
                text-sunday-brown focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
            />
          </div>

          {/* Shipping address */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-stone" />
              <label className="text-sm font-body font-semibold text-sunday-brown">Shipping Address</label>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={address.name}
                onChange={(e) => setAddress({ ...address, name: e.target.value })}
                placeholder="Full name"
                className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-2.5 font-body text-sm
                  text-sunday-brown focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
              />
              <input
                type="text"
                value={address.line1}
                onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                placeholder="Address line 1"
                className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-2.5 font-body text-sm
                  text-sunday-brown focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
              />
              <input
                type="text"
                value={address.line2}
                onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                placeholder="Address line 2 (optional)"
                className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-2.5 font-body text-sm
                  text-sunday-brown focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="City"
                  className="bg-flour border border-stone/30 rounded-lg px-4 py-2.5 font-body text-sm
                    text-sunday-brown focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
                />
                <input
                  type="text"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  placeholder="State"
                  className="bg-flour border border-stone/30 rounded-lg px-4 py-2.5 font-body text-sm
                    text-sunday-brown focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
                />
                <input
                  type="text"
                  value={address.zip}
                  onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                  placeholder="ZIP"
                  className="bg-flour border border-stone/30 rounded-lg px-4 py-2.5 font-body text-sm
                    text-sunday-brown focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
                />
              </div>
            </div>
          </div>

          {/* Gift option */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isGift}
                onChange={(e) => setIsGift(e.target.checked)}
                className="w-4 h-4 rounded border-stone/40 text-sienna focus:ring-sienna/50"
              />
              <Gift className="w-4 h-4 text-honey" />
              <span className="text-sm font-body text-sunday-brown">This is a gift</span>
            </label>
            {isGift && (
              <textarea
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="Add a gift message..."
                rows={3}
                className="w-full mt-3 bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sm
                  text-sunday-brown focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50 resize-none"
              />
            )}
          </div>

          {/* Order error */}
          {orderError && (
            <div className="flex items-center gap-2 text-sm font-body text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {orderError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone/20 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-body font-semibold text-sunday-brown
              border border-stone/30 hover:bg-linen transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleOrder}
            disabled={!canOrder}
            className="px-5 py-2 rounded-lg text-sm font-body font-semibold bg-sienna text-flour
              shadow-md hover:bg-sienna/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {ordering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                {quote ? `Pay ${formatUSD(quote.total)}` : 'Order Print'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
