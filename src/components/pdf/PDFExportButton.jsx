import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Download, Loader2 } from 'lucide-react'
import RecipePDFTemplate from './RecipePDFTemplate'

export default function PDFExportButton({ recipe, ingredients, cookName }) {
  const [generating, setGenerating] = useState(false)

  const handleDownload = async () => {
    if (generating) return
    setGenerating(true)

    try {
      const blob = await pdf(
        <RecipePDFTemplate
          recipe={recipe}
          ingredients={ingredients}
          cookName={cookName}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const filename = (recipe?.title || 'recipe')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      link.href = url
      link.download = `${filename}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error generating PDF:', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={generating}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-linen border border-stone/20
        text-sm font-body font-semibold text-sunday-brown hover:bg-flour transition-colors
        disabled:opacity-60 disabled:cursor-wait"
    >
      {generating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Preparing PDF...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Download PDF
        </>
      )}
    </button>
  )
}
