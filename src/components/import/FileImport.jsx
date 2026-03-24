import { useState, useRef } from 'react'
import { FileText, File, Upload } from 'lucide-react'
import ScanPreview from '../scanner/ScanPreview'
import ScanReview from '../scanner/ScanReview'

export default function FileImport({ mode = 'pdf', onBack }) {
  const [step, setStep] = useState('pick') // pick | scanning | review
  const [fileBase64, setFileBase64] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [fileSize, setFileSize] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const isPdf = mode === 'pdf'
  const accept = isPdf ? '.pdf' : '.docx'
  const label = isPdf ? 'PDF' : 'Word Document'
  const Icon = isPdf ? FileText : File

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleFile = (file) => {
    if (!file) return
    setFileName(file.name)
    setFileSize(file.size)

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      const base64 = dataUrl.split(',')[1]
      setFileBase64(base64)
      setStep('scanning')
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  if (step === 'review' && extractedData) {
    return (
      <ScanReview
        data={extractedData}
        onRescan={() => {
          setStep('pick')
          setFileBase64(null)
          setExtractedData(null)
        }}
        source="imported"
      />
    )
  }

  if (step === 'scanning') {
    return (
      <ScanPreview
        apiEndpoint="/api/import-document"
        apiBody={{ file: fileBase64, fileType: mode }}
        onResult={(data) => {
          setExtractedData(data)
          setStep('review')
        }}
        onRetry={() => {
          setStep('pick')
          setFileBase64(null)
        }}
      />
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <Icon className="w-10 h-10 text-sienna mx-auto mb-3" />
        <h3 className="text-xl font-display text-cast-iron">Upload a {label}</h3>
        <p className="text-stone font-body text-sm mt-1">
          We'll extract the recipe from your {label.toLowerCase()} file.
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
          Drop your {label.toLowerCase()} here, or click to browse
        </p>
        <p className="text-stone font-body text-sm mt-1">
          {accept.toUpperCase().replace('.', '')} files only
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="hidden"
      />

      {/* Selected file info */}
      {fileName && (
        <div className="mt-4 bg-linen rounded-lg px-4 py-3 flex items-center gap-3 border border-stone/20">
          <Icon className="w-5 h-5 text-sienna flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-cast-iron font-body text-sm font-semibold truncate">{fileName}</p>
            <p className="text-stone font-body text-xs">{formatSize(fileSize)}</p>
          </div>
        </div>
      )}

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
