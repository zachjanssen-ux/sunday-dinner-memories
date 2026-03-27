import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Pause, Save, X, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { insert as directInsert } from '../../lib/supabaseDirectFetch'
import useAuthStore from '../../store/authStore'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'

const LISTEN_BASE_URL = 'https://sundaydinnermemories.com/listen'

export default function AudioRecorder({ recipeId, familyId, onSaved }) {
  const { currentMember } = useAuthStore()
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [showRecorder, setShowRecorder] = useState(false)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const audioPreviewRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start(250) // collect chunks every 250ms
      setRecording(true)
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } catch (err) {
      console.error('Microphone access error:', err)
      toast.error('Could not access microphone. Check browser permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const togglePreviewPlay = () => {
    if (!audioPreviewRef.current) return
    if (playing) {
      audioPreviewRef.current.pause()
    } else {
      audioPreviewRef.current.play()
    }
    setPlaying(!playing)
  }

  const discard = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setTitle('')
    setElapsed(0)
    setPlaying(false)
  }

  const handleSave = async () => {
    if (!audioBlob) return
    setSaving(true)

    try {
      // Upload audio to Supabase Storage
      const filename = `${recipeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.webm`
      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(filename, audioBlob, { contentType: 'audio/webm' })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(filename)

      const storedAudioUrl = urlData?.publicUrl
      if (!storedAudioUrl) throw new Error('Failed to get audio URL')

      // Create a temp ID for QR code generation (will be replaced by DB-generated ID)
      // We generate a placeholder, then update after insert
      const tempId = crypto.randomUUID()

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(`${LISTEN_BASE_URL}/${tempId}`, {
        width: 200,
        margin: 1,
        color: { dark: '#5C3D2E', light: '#FFFDF7' },
      })

      // Insert audio memory using direct fetch
      const result = await directInsert('audio_memories', {
        id: tempId,
        recipe_id: recipeId,
        family_id: familyId,
        uploaded_by: currentMember?.id || null,
        title: title.trim() || null,
        audio_url: storedAudioUrl,
        duration_seconds: elapsed,
        qr_code_url: qrDataUrl,
      })

      toast.success('Memory saved!')
      discard()
      setShowRecorder(false)
      if (onSaved) onSaved(result)
    } catch (err) {
      console.error('Save audio error:', err)
      toast.error('Failed to save audio memory')
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!showRecorder) {
    return (
      <button
        onClick={() => setShowRecorder(true)}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-sienna text-flour
          font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors"
      >
        <Mic className="w-5 h-5" />
        Record a Memory
      </button>
    )
  }

  return (
    <div className="bg-linen rounded-xl p-6 border border-stone/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg text-cast-iron">Record a Memory</h3>
        <button
          onClick={() => { discard(); setShowRecorder(false) }}
          className="text-stone hover:text-sunday-brown"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!audioBlob ? (
        /* Recording phase */
        <div className="text-center py-4">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg
              transition-all ${
                recording
                  ? 'bg-tomato text-flour animate-pulse'
                  : 'bg-sienna text-flour hover:bg-sienna/90'
              }`}
          >
            {recording ? (
              <Square className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>

          <p className="font-body text-sunday-brown text-lg mb-1">
            {recording ? formatTime(elapsed) : 'Tap to start recording'}
          </p>
          <p className="font-body text-stone text-sm">
            {recording
              ? 'Recording... tap the square to stop'
              : 'Share a memory about this recipe'}
          </p>

          {/* Simple waveform animation when recording */}
          {recording && (
            <div className="flex items-center justify-center gap-1 mt-4 h-8">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-sienna rounded-full"
                  style={{
                    height: `${Math.random() * 24 + 8}px`,
                    animation: `waveform 0.5s ease-in-out ${i * 0.05}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Preview phase */
        <div className="space-y-4">
          <audio
            ref={audioPreviewRef}
            src={audioUrl}
            onEnded={() => setPlaying(false)}
          />

          <div className="flex items-center gap-3 bg-flour rounded-lg p-3 border border-stone/20">
            <button
              onClick={togglePreviewPlay}
              className="w-10 h-10 rounded-full bg-sienna text-flour flex items-center justify-center
                hover:bg-sienna/90 transition-colors shrink-0"
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="flex-1">
              <p className="font-body text-sunday-brown text-sm">Preview recording</p>
              <p className="font-body text-stone text-xs">{formatTime(elapsed)}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-body font-semibold text-sunday-brown mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The story behind this recipe..."
              className="w-full bg-flour border border-stone/30 rounded-lg px-4 py-3 font-body text-sunday-brown
                focus:ring-2 focus:ring-sienna/50 focus:outline-none placeholder:text-stone/50"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-sienna text-flour
                font-body font-semibold shadow-md hover:bg-sienna/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Memory'}
            </button>
            <button
              onClick={discard}
              disabled={saving}
              className="px-4 py-3 rounded-lg bg-flour border border-stone/30 text-sunday-brown
                font-body font-semibold hover:bg-linen disabled:opacity-50"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes waveform {
          from { height: 8px; }
          to { height: 32px; }
        }
      `}</style>
    </div>
  )
}
