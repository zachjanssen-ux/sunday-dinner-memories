import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../../lib/supabase'
import { compressImage } from '../../lib/imageUtils'
import {
  X,
  Eye,
  EyeOff,
  ImagePlus,
  Trash2,
  Loader2,
  Save,
} from 'lucide-react'

const MAX_PHOTOS = 5

export default function StoryEditor({ recipe, onSave, onCancel }) {
  const existing = recipe?.blog_content || {}
  const [body, setBody] = useState(existing.body || '')
  const [photos, setPhotos] = useState(existing.photos || [])
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    if (photos.length + files.length > MAX_PHOTOS) {
      alert(`You can upload up to ${MAX_PHOTOS} photos total.`)
      return
    }

    setUploading(true)
    const newUrls = []

    for (const rawFile of files) {
      const file = await compressImage(rawFile)
      const ext = file.name.split('.').pop()
      const path = `story-photos/${recipe.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from('recipe-photos')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (error) {
        console.error('Upload error:', error)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('recipe-photos')
        .getPublicUrl(path)

      if (urlData?.publicUrl) {
        newUrls.push(urlData.publicUrl)
      }
    }

    setPhotos((prev) => [...prev, ...newUrls])
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!body.trim()) return
    setSaving(true)

    const blogContent = {
      body: body.trim(),
      photos,
      published_at: existing.published_at || new Date().toISOString(),
    }

    const { error } = await supabase
      .from('recipes')
      .update({ blog_content: blogContent })
      .eq('id', recipe.id)

    setSaving(false)

    if (error) {
      console.error('Error saving story:', error)
      alert('Failed to save story. Please try again.')
      return
    }

    onSave(blogContent)
  }

  return (
    <div className="bg-flour rounded-xl border border-stone/20 shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-display text-cast-iron">
          {existing.body ? 'Edit Story' : 'Write the Story Behind This Recipe'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body font-semibold
              text-sunday-brown bg-linen border border-stone/20 hover:bg-cream transition-colors"
          >
            {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-linen border border-stone/20 flex items-center justify-center
              hover:bg-cream transition-colors"
          >
            <X className="w-4 h-4 text-stone" />
          </button>
        </div>
      </div>

      {preview ? (
        <div className="prose-story font-body text-sunday-brown text-lg leading-relaxed min-h-[200px] p-4 bg-cream rounded-lg border border-stone/10">
          <ReactMarkdown
            components={{
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-sienna/40 pl-4 my-4 font-handwritten text-2xl text-sunday-brown/80 italic">
                  {children}
                </blockquote>
              ),
              p: ({ children }) => <p className="mb-4">{children}</p>,
              h2: ({ children }) => <h2 className="text-2xl font-display text-cast-iron mt-6 mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-display text-cast-iron mt-4 mb-2">{children}</h3>,
            }}
          >
            {body}
          </ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tell the story behind this recipe... Where did it come from? Who made it best? What memories does it bring back?"
          className="w-full min-h-[200px] bg-cream rounded-lg border border-stone/20 p-4 font-body text-sunday-brown
            text-lg leading-relaxed resize-y focus:ring-2 focus:ring-sienna/50 focus:outline-none
            placeholder:text-stone/50"
        />
      )}

      <p className="text-xs font-body text-stone mt-2 mb-4">
        Supports Markdown: **bold**, *italic*, &gt; quotes (rendered in handwritten style), ## headings
      </p>

      {/* Photo uploads */}
      <div className="mb-4">
        <p className="text-sm font-body font-semibold text-sunday-brown mb-2">
          Story Photos ({photos.length}/{MAX_PHOTOS})
        </p>
        <div className="flex flex-wrap gap-3">
          {photos.map((url, idx) => (
            <div key={idx} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-stone/20">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(idx)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-tomato/90 text-flour flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-24 h-24 rounded-lg border-2 border-dashed border-stone/30 flex flex-col items-center justify-center
                text-stone hover:text-sunday-brown hover:border-sienna/50 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-5 h-5 mb-1" />
                  <span className="text-xs font-body">Add</span>
                </>
              )}
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-stone/10">
        <button
          onClick={handleSave}
          disabled={saving || !body.trim()}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-sienna text-flour
            font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Story
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-lg border border-stone/30 text-sunday-brown font-body font-semibold
            hover:bg-linen transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
