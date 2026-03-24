import { useState } from 'react'
import Layout from '../components/layout/Layout'
import ActiveMemberGate from '../components/guards/ActiveMemberGate'
import CameraCapture from '../components/scanner/CameraCapture'
import ScanPreview from '../components/scanner/ScanPreview'
import ScanReview from '../components/scanner/ScanReview'

export default function ScanPage() {
  const [step, setStep] = useState('capture') // capture | scanning | review
  const [imageBase64, setImageBase64] = useState(null)
  const [imageMimeType, setImageMimeType] = useState(null)
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [extractedData, setExtractedData] = useState(null)

  const handleCapture = (base64, mimeType) => {
    setImageBase64(base64)
    setImageMimeType(mimeType)
    setImageDataUrl(`data:${mimeType};base64,${base64}`)
    setStep('scanning')
  }

  const handleReset = () => {
    setStep('capture')
    setImageBase64(null)
    setImageMimeType(null)
    setImageDataUrl(null)
    setExtractedData(null)
  }

  return (
    <Layout>
      <ActiveMemberGate>
        <div className="max-w-4xl mx-auto">
          {step === 'capture' && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-display text-cast-iron mb-2">
                  Scan a Recipe
                </h1>
                <p className="text-sunday-brown font-body">
                  Point your camera at a recipe card and snap a photo.
                </p>
              </div>
              <CameraCapture onCapture={handleCapture} />
            </div>
          )}

          {step === 'scanning' && (
            <ScanPreview
              imageData={imageBase64}
              mimeType={imageMimeType}
              onResult={(data) => {
                setExtractedData(data)
                setStep('review')
              }}
              onRetry={handleReset}
            />
          )}

          {step === 'review' && extractedData && (
            <ScanReview
              data={extractedData}
              imageDataUrl={imageDataUrl}
              onRescan={handleReset}
              source="scanned"
            />
          )}
        </div>
      </ActiveMemberGate>
    </Layout>
  )
}
