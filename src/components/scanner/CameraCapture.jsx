import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, RotateCcw, Check, Upload, X } from 'lucide-react'

export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [captured, setCaptured] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const fileInputRef = useRef(null)

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true)
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : 'Could not access camera. Try uploading a photo instead.'
      )
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const base64 = dataUrl.split(',')[1]

    setCaptured({ base64, dataUrl, mimeType: 'image/jpeg' })
    stopCamera()
  }

  const retake = () => {
    setCaptured(null)
    startCamera()
  }

  const usePhoto = () => {
    if (captured) {
      onCapture(captured.base64, captured.mimeType)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      const base64 = dataUrl.split(',')[1]
      const mimeType = file.type || 'image/jpeg'
      setCaptured({ base64, dataUrl, mimeType })
      stopCamera()
    }
    reader.readAsDataURL(file)
  }

  // Captured state — show preview
  if (captured) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative rounded-xl overflow-hidden shadow-lg max-w-lg w-full">
          <img
            src={captured.dataUrl}
            alt="Captured recipe"
            className="w-full h-auto"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={retake}
            className="flex items-center gap-2 bg-linen text-sunday-brown rounded-lg px-6 py-3 font-semibold font-body shadow-sm border border-stone/20 hover:bg-stone/10 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Retake
          </button>
          <button
            onClick={usePhoto}
            className="flex items-center gap-2 bg-sienna text-flour rounded-lg px-6 py-3 font-semibold font-body shadow-md hover:bg-sienna/90 transition-colors"
          >
            <Check className="w-5 h-5" />
            Use This Photo
          </button>
        </div>
      </div>
    )
  }

  // Camera error — show upload fallback
  if (cameraError) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-linen rounded-xl p-8 max-w-md w-full border border-stone/20">
          <Camera className="w-12 h-12 text-stone mx-auto mb-4" />
          <p className="text-sunday-brown font-body mb-6">{cameraError}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 mx-auto bg-sienna text-flour rounded-lg px-6 py-3 font-semibold font-body shadow-md hover:bg-sienna/90 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload from Gallery
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />
          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-4 text-stone hover:text-sunday-brown font-body text-sm transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    )
  }

  // Live camera view
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative rounded-xl overflow-hidden shadow-lg max-w-lg w-full bg-cast-iron">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto min-h-[300px]"
        />
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sienna"></div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex items-center gap-4">
        {onCancel && (
          <button
            onClick={() => {
              stopCamera()
              onCancel()
            }}
            className="w-12 h-12 rounded-full bg-linen border border-stone/20 flex items-center justify-center hover:bg-stone/10 transition-colors"
          >
            <X className="w-5 h-5 text-sunday-brown" />
          </button>
        )}

        <button
          onClick={capturePhoto}
          disabled={!cameraReady}
          className="w-16 h-16 rounded-full bg-sienna shadow-lg flex items-center justify-center hover:bg-sienna/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Capture photo"
        >
          <div className="w-12 h-12 rounded-full border-3 border-flour"></div>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-full bg-linen border border-stone/20 flex items-center justify-center hover:bg-stone/10 transition-colors"
          aria-label="Upload from gallery"
        >
          <Upload className="w-5 h-5 text-sunday-brown" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/webp"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  )
}
