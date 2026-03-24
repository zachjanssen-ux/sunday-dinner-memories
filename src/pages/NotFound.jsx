import { Link } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="relative mx-auto mb-8 w-32 h-32">
          {/* Plate illustration */}
          <div className="w-32 h-32 rounded-full border-4 border-stone/20 bg-linen flex items-center justify-center">
            <HelpCircle className="w-16 h-16 text-stone/40" />
          </div>
        </div>
        <h1 className="text-4xl font-display text-cast-iron mb-3">404</h1>
        <p className="text-xl font-display text-cast-iron mb-2">
          This recipe seems to have gone missing
        </p>
        <p className="text-sunday-brown font-body mb-8">
          We looked everywhere in the recipe box, but couldn't find what you're looking for.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-sienna text-flour rounded-lg px-6 py-3
            font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors"
        >
          Back to the kitchen
        </Link>
      </div>
    </div>
  )
}
