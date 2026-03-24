import { useState } from 'react'
import { X, Star, Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

/*
 * Supabase table required — run this SQL in the Supabase dashboard:
 *
 * CREATE TABLE beta_feedback (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id UUID REFERENCES auth.users(id),
 *   rating INT CHECK (rating >= 1 AND rating <= 5),
 *   feature TEXT,
 *   message TEXT,
 *   user_agent TEXT,
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- Allow authenticated users to insert
 * ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users can insert own feedback"
 *   ON beta_feedback FOR INSERT
 *   TO authenticated
 *   WITH CHECK (auth.uid() = user_id);
 */

const FEATURES = [
  { value: '', label: 'Pick a feature...' },
  { value: 'scanning', label: 'Scanning a Recipe Card' },
  { value: 'adding', label: 'Adding Recipes' },
  { value: 'browsing', label: 'Browsing Recipes' },
  { value: 'family', label: 'Family / Sharing' },
  { value: 'other', label: 'Something Else' },
]

export default function FeedbackModal({ onClose }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feature, setFeature] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Tap a star to rate your experience.')
      return
    }

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from('beta_feedback').insert({
        user_id: user?.id ?? null,
        rating,
        feature: feature || null,
        message: message.trim() || null,
        user_agent: navigator.userAgent,
      })

      if (error) throw error

      toast.success("Thanks! Your feedback helps us make this better.")
      onClose()
    } catch (err) {
      console.error('Feedback submit error:', err)
      toast.error('Something went wrong. Try again?')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-cast-iron/50 backdrop-blur-sm">
      <div className="bg-cream rounded-2xl shadow-2xl w-full max-w-[400px] relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h3 className="text-xl font-display text-cast-iron">How's it going?</h3>
          <button
            onClick={onClose}
            className="text-stone hover:text-sunday-brown transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 pb-5">
          {/* Star rating */}
          <div className="mb-4">
            <label className="block text-sm font-body text-sunday-brown mb-2">
              Rate your experience
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      n <= (hoverRating || rating)
                        ? 'text-honey fill-honey'
                        : 'text-stone/30'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Feature dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-body text-sunday-brown mb-2" htmlFor="feedback-feature">
              Which feature?
            </label>
            <select
              id="feedback-feature"
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
              className="w-full rounded-xl border border-stone/30 bg-flour px-4 py-2.5 font-body text-sm
                text-cast-iron focus:outline-none focus:ring-2 focus:ring-sienna/40"
            >
              {FEATURES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div className="mb-5">
            <label className="block text-sm font-body text-sunday-brown mb-2" htmlFor="feedback-message">
              What happened?
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what worked, what didn't, or what you wish was different..."
              rows={3}
              className="w-full rounded-xl border border-stone/30 bg-flour px-4 py-2.5 font-body text-sm
                text-cast-iron placeholder:text-stone/50 resize-none
                focus:outline-none focus:ring-2 focus:ring-sienna/40"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-body font-semibold
              text-flour bg-sienna hover:bg-sienna/90 disabled:opacity-60 transition-colors shadow-md"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Feedback
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
