import { useState, useEffect, useRef } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

const loadingMessages = [
  "Reading Grandma's handwriting...",
  'Deciphering the secret ingredients...',
  'Measuring cups and teaspoons...',
  'Almost done — just double-checking the oven temp...',
]

export default function ScanPreview({ imageData, mimeType, apiEndpoint, apiBody, onResult, onError, onRetry }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Use refs to avoid re-triggering the effect when callback/body references change
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)
  const apiBodyRef = useRef(apiBody)
  useEffect(() => { onResultRef.current = onResult }, [onResult])
  useEffect(() => { onErrorRef.current = onError }, [onError])
  useEffect(() => { apiBodyRef.current = apiBody }, [apiBody])

  // Track whether we've already kicked off a scan to prevent double-fires
  const hasFired = useRef(false)

  useEffect(() => {
    if (hasFired.current) return
    hasFired.current = true

    let cancelled = false

    async function scan() {
      setLoading(true)
      setError(null)

      try {
        const body = apiBodyRef.current || { image: imageData, mimeType: mimeType || 'image/jpeg' }
        const endpoint = apiEndpoint || '/api/scan-recipe'

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || `Request failed (${response.status})`)
        }

        const data = await response.json()

        if (!cancelled) {
          setLoading(false)
          onResultRef.current(data)
        }
      } catch (err) {
        if (!cancelled) {
          setLoading(false)
          setError(err.message)
          if (onErrorRef.current) onErrorRef.current(err.message)
        }
      }
    }

    scan()
    return () => { cancelled = true }
  }, [imageData, mimeType, apiEndpoint])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-linen rounded-xl p-10 max-w-md w-full text-center border border-stone/20 shadow-sm">
          <Loader2 className="w-10 h-10 text-sienna animate-spin mx-auto mb-6" />
          <p className="text-sunday-brown font-body text-lg mb-2">Scanning...</p>
          <p className="text-stone font-handwritten text-xl">
            {loadingMessages[messageIndex]}
          </p>
        </div>

        {imageData && (
          <div className="mt-6 rounded-xl overflow-hidden shadow-sm max-w-xs">
            <img
              src={`data:${mimeType || 'image/jpeg'};base64,${imageData}`}
              alt="Recipe being scanned"
              className="w-full h-auto opacity-70"
            />
          </div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-linen rounded-xl p-10 max-w-md w-full text-center border border-stone/20 shadow-sm">
          <AlertCircle className="w-10 h-10 text-tomato mx-auto mb-4" />
          <p className="text-cast-iron font-display text-lg mb-2">Hmm, that didn't work</p>
          <p className="text-sunday-brown font-body mb-6">
            We couldn't read that one. Try a clearer photo, or type it in — we'll help.
          </p>
          <div className="flex gap-3 justify-center">
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-sienna text-flour rounded-lg px-6 py-3 font-semibold font-body shadow-md hover:bg-sienna/90 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
