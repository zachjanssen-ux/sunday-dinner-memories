import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import FeedbackModal from './FeedbackModal'

/** Set to false to hide the feedback button site-wide. */
export const BETA_MODE = true

/**
 * FeedbackButton — Floating button (bottom-right, above mobile nav) that opens
 * the feedback modal. Only visible during the beta period.
 */
export default function FeedbackButton() {
  const [open, setOpen] = useState(false)

  if (!BETA_MODE) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-sienna text-flour shadow-lg
          flex items-center justify-center hover:bg-sienna/90 active:scale-95 transition-all"
        aria-label="Send feedback"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  )
}
