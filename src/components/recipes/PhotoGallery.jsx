import { useState, useRef } from 'react'
import { Camera, X, Trash2, ChevronLeft, ChevronRight, Loader2, Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { update as directUpdate } from '../../lib/supabaseDirectFetch'
import { compressImage } from '../../lib/imageUtils'
import toast from 'react-hot-toast'

function LightboxModal({ photos, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex)

  const prev = () => setIndex((i) => (i > 0 ? i - 1 : photos.length - 1))
  const next = () => setIndex((i) => (i < photos.length - 1 ? i + 1 : 0))

  return (
    <div
      className="fixed inset-0 bg-cast-iron/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-flour/20 text-flour flex items-center justify-center
          hover:bg-flour/30 transition-colors z-50"
      >
        <X className="w-5 h-5" />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-4 w-10 h-10 rounded-full bg-flour/20 text-flour flex items-center justify-center
              hover:bg-flour/30 transition-colors z-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-4 w-10 h-10 rounded-full bg-flour/20 text-flour flex items-center justify-center
              hover:bg-flour/30 transition-colors z-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <img
        src={photos[index]}
        alt={`Photo ${index + 1}`}
        className="max-w-full max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIndex(i) }}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === index ? 'bg-flour' : 'bg-flour/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PhotoGallery({ recipeId, photos = [], canUpload, canDelete, onPhotosChange }) {
  const [uploading, setUploading] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const fileInputRef = useRef(null)

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    try {
      const newUrls = []

      for (const file of files) {
        const compressed = await compressImage(file)
        const ext = compressed.name.split('.').pop() || 'jpg'
        const path = `${recipeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('recipe-photos')
          .upload(path, compressed, { contentType: compressed.type })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error(`Failed to upload ${file.name}`)
          continue
        }

        const { data: urlData } = supabase.storage
          .from('recipe-photos')
          .getPublicUrl(path)

        if (urlData?.publicUrl) {
          newUrls.push(urlData.publicUrl)
        }
      }

      if (newUrls.length > 0) {
        const updatedPhotos = [...photos, ...newUrls]
        await directUpdate('recipes', { photos: updatedPhotos }, { 'id': `eq.${recipeId}` })
        onPhotosChange(updatedPhotos)
        toast.success(`${newUrls.length} photo${newUrls.length > 1 ? 's' : ''} uploaded`)
      }
    } catch (err) {
      console.error('Photo upload error:', err)
      toast.error('Failed to upload photos')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (urlToRemove) => {
    if (!confirm('Delete this photo?')) return

    try {
      // Extract path from URL to delete from storage
      const urlObj = new URL(urlToRemove)
      const pathMatch = urlObj.pathname.match(/\/recipe-photos\/(.+)$/)
      if (pathMatch) {
        await supabase.storage.from('recipe-photos').remove([pathMatch[1]])
      }

      const updatedPhotos = photos.filter((url) => url !== urlToRemove)
      await directUpdate('recipes', { photos: updatedPhotos }, { 'id': `eq.${recipeId}` })
      onPhotosChange(updatedPhotos)
      toast.success('Photo deleted')
    } catch (err) {
      console.error('Delete photo error:', err)
      toast.error('Failed to delete photo')
    }
  }

  if (photos.length === 0 && !canUpload) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-sienna" />
          <h2 className="text-2xl font-display text-cast-iron">Photos</h2>
        </div>
        {canUpload && (
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sienna text-flour
            text-sm font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors cursor-pointer">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? 'Uploading...' : 'Add Photos'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((url, idx) => (
            <div key={url} className="relative group">
              <button
                onClick={() => setLightboxIndex(idx)}
                className="block w-full aspect-square rounded-lg overflow-hidden border border-stone/20
                  hover:shadow-md transition-shadow"
              >
                <img
                  src={url}
                  alt={`Recipe photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
              {canDelete && (
                <button
                  onClick={() => handleDelete(url)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-cast-iron/70 text-flour
                    flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
                    hover:bg-tomato"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-stone/30 p-8 text-center">
          <Camera className="w-10 h-10 text-stone/30 mx-auto mb-2" />
          <p className="text-sm font-body text-stone">
            No photos yet. Add some photos of this dish!
          </p>
        </div>
      )}

      {lightboxIndex !== null && (
        <LightboxModal
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
