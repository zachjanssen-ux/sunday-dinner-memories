import { useState } from 'react'
import { X, FlaskConical } from 'lucide-react'

const DISMISSED_KEY = 'sdm_beta_banner_dismissed'

/** Set to false to hide the beta banner site-wide. */
export const BETA_MODE = true

/**
 * BetaBanner — Dismissable banner for beta testers.
 * Shows at the top of Dashboard during the beta period.
 */
export default function BetaBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === 'true' } catch { return false }
  })

  if (!BETA_MODE || dismissed) return null

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, 'true') } catch {}
    setDismissed(true)
  }

  return (
    <div className="bg-honey/20 border border-honey/40 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
      <FlaskConical className="w-5 h-5 text-sunday-brown flex-shrink-0" />
      <p className="text-sunday-brown font-body text-sm flex-1">
        <strong>You're a beta tester!</strong>{' '}
        Having issues?{' '}
        <a
          href="/beta-guide.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sienna underline underline-offset-2 hover:text-tomato transition-colors"
        >
          Tap here for the tester guide
        </a>
        .
      </p>
      <button
        onClick={dismiss}
        className="text-stone hover:text-sunday-brown transition-colors p-1"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
