import { useState } from 'react'
import { Video, Plus, X, Loader2, ExternalLink } from 'lucide-react'
import { update as directUpdate } from '../../lib/supabaseDirectFetch'
import toast from 'react-hot-toast'

function extractVideoId(url) {
  if (!url) return null

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch) return { type: 'youtube', id: ytMatch[1] }

  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/)
  if (vimeoMatch) return { type: 'vimeo', id: vimeoMatch[1] }

  return null
}

function VideoPlayer({ videoUrl }) {
  const video = extractVideoId(videoUrl)
  if (!video) {
    return (
      <div className="rounded-xl bg-linen border border-stone/20 p-6 text-center">
        <p className="font-body text-stone text-sm">Unsupported video URL</p>
      </div>
    )
  }

  const embedUrl =
    video.type === 'youtube'
      ? `https://www.youtube.com/embed/${video.id}`
      : `https://player.vimeo.com/video/${video.id}`

  return (
    <div className="rounded-xl overflow-hidden shadow-md border border-stone/20">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          title="Recipe video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  )
}

export default function VideoEmbed({ recipeId, videoUrl, canEdit, onVideoChange }) {
  const [showInput, setShowInput] = useState(false)
  const [inputUrl, setInputUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const url = inputUrl.trim()
    if (!url) return

    const video = extractVideoId(url)
    if (!video) {
      toast.error('Please enter a valid YouTube or Vimeo URL')
      return
    }

    setSaving(true)
    try {
      await directUpdate('recipes', { video_url: url }, { 'id': `eq.${recipeId}` })
      onVideoChange(url)
      setShowInput(false)
      setInputUrl('')
      toast.success('Video added')
    } catch (err) {
      console.error('Save video error:', err)
      toast.error('Failed to save video')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Remove this video?')) return

    try {
      await directUpdate('recipes', { video_url: null }, { 'id': `eq.${recipeId}` })
      onVideoChange(null)
      toast.success('Video removed')
    } catch (err) {
      console.error('Remove video error:', err)
      toast.error('Failed to remove video')
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-sienna" />
          <h2 className="text-2xl font-display text-cast-iron">Video</h2>
        </div>
        {canEdit && videoUrl && (
          <button
            onClick={handleRemove}
            className="text-sm font-body font-semibold text-tomato hover:text-tomato/80"
          >
            Remove
          </button>
        )}
      </div>

      {videoUrl ? (
        <VideoPlayer videoUrl={videoUrl} />
      ) : canEdit ? (
        showInput ? (
          <div className="bg-linen rounded-xl p-4 border border-stone/20 space-y-3">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste a YouTube or Vimeo URL..."
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !inputUrl.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sienna text-flour
                  text-sm font-body font-semibold shadow-md hover:bg-sienna/90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Add Video'}
              </button>
              <button
                onClick={() => { setShowInput(false); setInputUrl('') }}
                className="px-4 py-2 rounded-lg bg-flour border border-stone/30 text-sm font-body font-semibold
                  text-sunday-brown hover:bg-linen"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="w-full rounded-xl border-2 border-dashed border-stone/30 p-6 text-center
              hover:border-sienna/30 hover:bg-linen/50 transition-colors"
          >
            <Video className="w-8 h-8 text-stone/30 mx-auto mb-2" />
            <p className="text-sm font-body text-stone">
              Add a video to this recipe
            </p>
          </button>
        )
      ) : null}
    </div>
  )
}
