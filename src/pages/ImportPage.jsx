import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Camera,
  ImageIcon,
  FileText,
  File,
  Link2,
  Type,
  PenLine,
} from 'lucide-react'
import Layout from '../components/layout/Layout'
import ActiveMemberGate from '../components/guards/ActiveMemberGate'
import PhotoImport from '../components/import/PhotoImport'
import FileImport from '../components/import/FileImport'
import URLImport from '../components/import/URLImport'
import TextImport from '../components/import/TextImport'
import CameraCapture from '../components/scanner/CameraCapture'
import ScanPreview from '../components/scanner/ScanPreview'
import ScanReview from '../components/scanner/ScanReview'

const importMethods = [
  {
    id: 'camera',
    icon: Camera,
    title: 'Scan Recipe Card',
    description: 'Point your camera at a recipe card',
  },
  {
    id: 'photo',
    icon: ImageIcon,
    title: 'Upload Photo',
    description: 'Upload a photo of a recipe',
  },
  {
    id: 'pdf',
    icon: FileText,
    title: 'Upload PDF',
    description: 'Import from a PDF file',
  },
  {
    id: 'docx',
    icon: File,
    title: 'Upload Word Doc',
    description: 'Import from a Word document',
  },
  {
    id: 'url',
    icon: Link2,
    title: 'Paste URL',
    description: 'Import from a recipe website',
  },
  {
    id: 'text',
    icon: Type,
    title: 'Type or Paste',
    description: 'Paste recipe text',
  },
  {
    id: 'manual',
    icon: PenLine,
    title: 'Enter Manually',
    description: 'Type it in yourself',
  },
]

export default function ImportPage() {
  const navigate = useNavigate()
  const [activeMethod, setActiveMethod] = useState(null)

  // Camera flow states
  const [cameraStep, setCameraStep] = useState('capture') // capture | scanning | review
  const [cameraImage, setCameraImage] = useState(null)
  const [cameraMimeType, setCameraMimeType] = useState(null)
  const [cameraDataUrl, setCameraDataUrl] = useState(null)
  const [cameraExtracted, setCameraExtracted] = useState(null)

  const handleMethodSelect = (methodId) => {
    if (methodId === 'manual') {
      navigate('/recipes/new')
      return
    }
    setActiveMethod(methodId)
    if (methodId === 'camera') {
      setCameraStep('capture')
      setCameraImage(null)
      setCameraExtracted(null)
    }
  }

  const handleBack = () => {
    setActiveMethod(null)
    setCameraStep('capture')
    setCameraImage(null)
    setCameraExtracted(null)
  }

  const renderActiveMethod = () => {
    switch (activeMethod) {
      case 'camera':
        if (cameraStep === 'review' && cameraExtracted) {
          return (
            <ScanReview
              data={cameraExtracted}
              imageDataUrl={cameraDataUrl}
              onRescan={() => {
                setCameraStep('capture')
                setCameraImage(null)
                setCameraExtracted(null)
              }}
              source="scanned"
            />
          )
        }
        if (cameraStep === 'scanning') {
          return (
            <ScanPreview
              imageData={cameraImage}
              mimeType={cameraMimeType}
              onResult={(data) => {
                setCameraExtracted(data)
                setCameraStep('review')
              }}
              onRetry={() => {
                setCameraStep('capture')
                setCameraImage(null)
              }}
            />
          )
        }
        return (
          <CameraCapture
            onCapture={(base64, mimeType) => {
              setCameraImage(base64)
              setCameraMimeType(mimeType)
              setCameraDataUrl(`data:${mimeType};base64,${base64}`)
              setCameraStep('scanning')
            }}
            onCancel={handleBack}
          />
        )

      case 'photo':
        return <PhotoImport onBack={handleBack} />

      case 'pdf':
        return <FileImport mode="pdf" onBack={handleBack} />

      case 'docx':
        return <FileImport mode="docx" onBack={handleBack} />

      case 'url':
        return <URLImport onBack={handleBack} />

      case 'text':
        return <TextImport onBack={handleBack} />

      default:
        return null
    }
  }

  return (
    <Layout>
      <ActiveMemberGate>
        <div className="max-w-4xl mx-auto">
          {!activeMethod ? (
            <>
              {/* Header */}
              <div className="text-center mb-10">
                <h1 className="text-3xl font-display text-cast-iron mb-2">
                  Add a Recipe
                </h1>
                <p className="text-sunday-brown font-body text-lg">
                  How would you like to add this recipe?
                </p>
              </div>

              {/* Import method cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {importMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id)}
                    className="group bg-linen rounded-xl p-6 text-left shadow-sm border border-stone/20 hover:shadow-md hover:border-sienna/30 transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-sienna/10 flex items-center justify-center mb-4 group-hover:bg-sienna/20 transition-colors">
                      <method.icon className="w-6 h-6 text-sienna" />
                    </div>
                    <h3 className="text-cast-iron font-display text-lg mb-1">
                      {method.title}
                    </h3>
                    <p className="text-stone font-body text-sm">
                      {method.description}
                    </p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            renderActiveMethod()
          )}
        </div>
      </ActiveMemberGate>
    </Layout>
  )
}
