import { useState } from 'react'
import { Link2, Loader2 } from 'lucide-react'
import ScanPreview from '../scanner/ScanPreview'
import ScanReview from '../scanner/ScanReview'

export default function URLImport({ onBack }) {
  const [step, setStep] = useState('input') // input | scanning | review
  const [url, setUrl] = useState('')
  const [recipeOnly, setRecipeOnly] = useState(true)
  const [extractedData, setExtractedData] = useState(null)

  const isValidUrl = (str) => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  const handleImport = () => {
    if (!isValidUrl(url)) return
    setStep('scanning')
  }

  if (step === 'review' && extractedData) {
    return (
      <ScanReview
        data={extractedData}
        onRescan={() => {
          setStep('input')
          setExtractedData(null)
        }}
        source="url"
      />
    )
  }

  if (step === 'scanning') {
    return (
      <ScanPreview
        apiEndpoint="/api/import-url"
        apiBody={{ url, recipeOnly }}
        onResult={(data) => {
          setExtractedData(data)
          setStep('review')
        }}
        onRetry={() => {
          setStep('input')
        }}
      />
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <Link2 className="w-10 h-10 text-sienna mx-auto mb-3" />
        <h3 className="text-xl font-display text-cast-iron">Import from URL</h3>
        <p className="text-stone font-body text-sm mt-1">
          Paste a link to any recipe website and we'll pull the recipe in.
        </p>
      </div>

      <div className="space-y-4">
        {/* URL input */}
        <div>
          <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
            Recipe URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body focus:outline-none focus:ring-2 focus:ring-sienna/50"
            placeholder="https://www.example.com/recipes/grandmas-pie"
          />
        </div>

        {/* Recipe Only toggle */}
        <div className="flex items-center justify-between bg-linen rounded-lg px-4 py-3 border border-stone/20">
          <div>
            <p className="text-cast-iron font-body text-sm font-semibold">Recipe Only</p>
            <p className="text-stone font-body text-xs">
              Turn off to also grab the blog story
            </p>
          </div>
          <button
            onClick={() => setRecipeOnly(!recipeOnly)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              recipeOnly ? 'bg-sienna' : 'bg-stone/30'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-flour shadow transition-transform ${
                recipeOnly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Import button */}
        <button
          onClick={handleImport}
          disabled={!isValidUrl(url)}
          className="w-full flex items-center justify-center gap-2 bg-sienna text-flour rounded-lg px-6 py-3 font-semibold font-body shadow-md hover:bg-sienna/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Link2 className="w-5 h-5" />
          Import Recipe
        </button>
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="mt-6 text-stone hover:text-sunday-brown font-body text-sm transition-colors block mx-auto"
        >
          Back to import options
        </button>
      )}
    </div>
  )
}
