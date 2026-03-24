import { useState } from 'react'
import { Type, Sparkles } from 'lucide-react'
import ScanPreview from '../scanner/ScanPreview'
import ScanReview from '../scanner/ScanReview'

const MAX_CHARS = 10000

export default function TextImport({ onBack }) {
  const [step, setStep] = useState('input') // input | scanning | review
  const [text, setText] = useState('')
  const [extractedData, setExtractedData] = useState(null)

  const handleExtract = () => {
    if (!text.trim()) return
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
        source="text"
      />
    )
  }

  if (step === 'scanning') {
    return (
      <ScanPreview
        apiEndpoint="/api/import-text"
        apiBody={{ text }}
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
        <Type className="w-10 h-10 text-sienna mx-auto mb-3" />
        <h3 className="text-xl font-display text-cast-iron">Type or Paste a Recipe</h3>
        <p className="text-stone font-body text-sm mt-1">
          Paste recipe text from anywhere — an email, a message, a note — and we'll organize it.
        </p>
      </div>

      <div className="space-y-4">
        {/* Textarea */}
        <div>
          <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
            Recipe Text
          </label>
          <textarea
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) {
                setText(e.target.value)
              }
            }}
            rows={12}
            className="w-full px-4 py-3 rounded-lg border border-stone/30 bg-flour text-cast-iron font-body focus:outline-none focus:ring-2 focus:ring-sienna/50 resize-none"
            placeholder="Paste your recipe text here..."
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs font-body ${text.length > MAX_CHARS * 0.9 ? 'text-tomato' : 'text-stone'}`}>
              {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Extract button */}
        <button
          onClick={handleExtract}
          disabled={!text.trim()}
          className="w-full flex items-center justify-center gap-2 bg-sienna text-flour rounded-lg px-6 py-3 font-semibold font-body shadow-md hover:bg-sienna/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5" />
          Extract Recipe
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
