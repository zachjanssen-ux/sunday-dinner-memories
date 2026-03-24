import { useState, useRef, useCallback } from 'react'
import { ImageIcon, Upload } from 'lucide-react'
import ScanPreview from '../scanner/ScanPreview'
import ScanReview from '../scanner/ScanReview'

export default function PhotoImport({ onBack }) {
  const [step, setStep] = useState('pick') // pick | scanning | review
  const [imageBase64, setImageBase64] = useState(null)
  const [imageMimeType, setImageMimeType] = useState(null)
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const handleFile = useCallback((file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      const base64 = dataUrl.split(',')[1]
      setImageBase64(base64)
      setImageMimeType(file.type || 'image/jpeg')
      setImageDataUrl(dataUrl)
      setStep('scanning')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    }
  }

  if (step === 'review' && extractedData) {
    return (
      <ScanReview
        data={extractedData}
        imageDataUrl={imageDataUrl}
        onRescan={() => {
          setStep('pick')
          setImageBase64(null)
          setExtractedData(null)
        }}
        source="scanned"
      />
    )
  }

  if (step === 'scanning') {
    return (
      <ScanPreview
        imageData={imageBase64}
        mimeType={imageMimeType}
        onResult={(data) => {
          setExtractedData(data)
          setStep('review')
        }}
        onRetry={() => {
          setStep('pick')
          setImageBase64(null)
        }}
      />
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <ImageIcon className="w-10 h-10 text-sienna mx-auto mb-3" />
        <h3 className="text-xl font-display text-cast-iron">Upload a Recipe Photo</h3>
        <p className="text-stone font-body text-sm mt-1">
          Upload a photo of a recipe card, cookbook page, or handwritten recipe.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-sienna bg-sienna/5'
            : 'border-stone/30 hover:border-sienna/30 bg-flour'
        }`}
      >
        <Upload className="w-8 h-8 text-stone mx-auto mb-3" />
        <p className="text-sunday-brown font-body font-semibold">
          Drop your photo here, or click to browse
        </p>
        <p className="text-stone font-body text-sm mt-1">
          JPG, PNG, HEIC, or WebP
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/webp"
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="hidden"
      />

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
