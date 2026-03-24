import { useState } from 'react'
import { X, Printer, Gift, Truck, CreditCard } from 'lucide-react'

export default function OrderPrintModal({ cookbook, onClose }) {
  const [coverType, setCoverType] = useState('softcover')
  const [quantity, setQuantity] = useState(1)
  const [isGift, setIsGift] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')
  const [address, setAddress] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
  })

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
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-2">
              Cover Type
            </label>
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
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Quantity
            </label>
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
            <div className="space-y-1 text-sm font-body text-sunday-brown">
              <div className="flex justify-between">
                <span>Base price ({coverType})</span>
                <span className="text-stone italic">Price will be calculated</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity: {quantity}</span>
                <span className="text-stone italic">--</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-stone italic">--</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone/20 font-semibold">
                <span>Total</span>
                <span className="text-stone italic">Pending API setup</span>
              </div>
            </div>
            <p className="text-xs text-stone mt-3">
              Print pricing requires Lulu API configuration. Contact your admin to set up the LULU_API_KEY.
            </p>
          </div>

          {/* Shipping address */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-stone" />
              <label className="text-sm font-body font-semibold text-sunday-brown">
                Shipping Address
              </label>
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
            disabled
            className="px-5 py-2 rounded-lg text-sm font-body font-semibold bg-sienna text-flour
              shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Order Print (API Setup Required)
          </button>
        </div>
      </div>
    </div>
  )
}
