import { useState } from 'react'
import Layout from '../components/layout/Layout'
import ActiveMemberGate from '../components/guards/ActiveMemberGate'
import CameraCapture from '../components/scanner/CameraCapture'
import ScanPreview from '../components/scanner/ScanPreview'
import ScanReview from '../components/scanner/ScanReview'
import { Camera, ArrowRight, Plus } from 'lucide-react'

export default function ScanPage() {
  const [step, setStep] = useState('capture') // capture | captured-front | capture-back | scanning | review
  const [images, setImages] = useState([]) // array of { base64, mimeType, dataUrl, label }
  const [extractedData, setExtractedData] = useState(null)

  const handleCapture = (base64, mimeType) => {
    const dataUrl = `data:${mimeType};base64,${base64}`
    const label = images.length === 0 ? 'Front' : 'Back'
    setImages((prev) => [...prev, { base64, mimeType, dataUrl, label }])

    if (images.length === 0) {
      // First capture — ask if there's a back side
      setStep('captured-front')
    } else {
      // Second capture — go straight to scanning with both images
      setStep('scanning')
    }
  }

  const handleScanFrontOnly = () => {
    setStep('scanning')
  }

  const handleScanBackSide = () => {
    setStep('capture-back')
  }

  const handleReset = () => {
    setStep('capture')
    setImages([])
    setExtractedData(null)
  }

  return (
    <Layout>
      <ActiveMemberGate>
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Capture front side */}
          {step === 'capture' && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-display text-cast-iron mb-2">
                  Scan a Recipe Card
                </h1>
                <p className="text-sunday-brown font-body">
                  Point your camera at the front of a recipe card and snap a photo.
                </p>
              </div>
              <CameraCapture onCapture={handleCapture} />
            </div>
          )}

          {/* Step 2: Front captured — ask about back side */}
          {step === 'captured-front' && (
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <h2 className="text-2xl font-display text-cast-iron mb-2">
                  Front side captured!
                </h2>
                <p className="text-sunday-brown font-body">
                  Does this recipe card have a back side?
                </p>
              </div>

              {/* Show the captured image */}
              <div className="rounded-xl overflow-hidden shadow-lg max-w-sm w-full">
                <img
                  src={images[0]?.dataUrl}
                  alt="Front of recipe card"
                  className="w-full h-auto"
                />
                <div className="bg-cast-iron text-cream text-center py-1 text-sm font-body">
                  Front Side
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <button
                  onClick={handleScanBackSide}
                  className="flex-1 flex items-center justify-center gap-2 bg-sienna text-flour rounded-lg px-6 py-3.5 font-semibold font-body shadow-md hover:bg-sienna/90 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Scan Back Side
                </button>
                <button
                  onClick={handleScanFrontOnly}
                  className="flex-1 flex items-center justify-center gap-2 bg-linen text-sunday-brown rounded-lg px-6 py-3.5 font-semibold font-body border border-stone/20 hover:bg-cream transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                  No Back — Continue
                </button>
              </div>

              <button
                onClick={handleReset}
                className="text-stone hover:text-sunday-brown font-body text-sm transition-colors"
              >
                Start over
              </button>
            </div>
          )}

          {/* Step 3: Capture back side */}
          {step === 'capture-back' && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-display text-cast-iron mb-2">
                  Now scan the back side
                </h2>
                <p className="text-sunday-brown font-body">
                  Flip the card over and snap a photo of the back.
                </p>
              </div>

              {/* Small preview of front */}
              <div className="flex justify-center mb-6">
                <div className="rounded-lg overflow-hidden shadow-sm w-24 h-auto opacity-60 border border-stone/20">
                  <img
                    src={images[0]?.dataUrl}
                    alt="Front side (captured)"
                    className="w-full h-auto"
                  />
                </div>
                <div className="flex items-center mx-3">
                  <Camera className="w-5 h-5 text-sienna" />
                </div>
                <div className="rounded-lg w-24 h-16 border-2 border-dashed border-sienna/40 flex items-center justify-center">
                  <span className="text-xs text-stone font-body">Back</span>
                </div>
              </div>

              <CameraCapture
                onCapture={handleCapture}
                onCancel={() => {
                  // Skip back side and just scan front
                  setStep('scanning')
                }}
              />
            </div>
          )}

          {/* Step 4: Scanning — send image(s) to AI */}
          {step === 'scanning' && (
            <ScanPreview
              imageData={images.map((img) => img.base64)}
              mimeType={images[0]?.mimeType}
              apiEndpoint="/api/scan-recipe"
              apiBody={{
                images: images.map((img) => ({
                  base64: img.base64,
                  mimeType: img.mimeType,
                  label: img.label,
                })),
                // Backward compat: also send single image for the API
                image: images[0]?.base64,
                mimeType: images[0]?.mimeType,
              }}
              onResult={(data) => {
                setExtractedData(data)
                setStep('review')
              }}
              onRetry={handleReset}
            />
          )}

          {/* Step 5: Review extracted data */}
          {step === 'review' && extractedData && (
            <ScanReview
              data={extractedData}
              imageDataUrl={images[0]?.dataUrl}
              onRescan={handleReset}
              source="scanned"
            />
          )}
        </div>
      </ActiveMemberGate>
    </Layout>
  )
}
