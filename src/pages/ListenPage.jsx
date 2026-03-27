import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Play, Pause, Loader2, Heart } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ListenPage() {
  const { id } = useParams()
  const [memory, setMemory] = useState(null)
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef(null)
  const progressRef = useRef(null)

  useEffect(() => {
    fetchMemory()
  }, [id])

  const fetchMemory = async () => {
    setLoading(true)
    try {
      const { data: memoryData, error: memErr } = await supabase
        .from('audio_memories')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (memErr) throw memErr
      if (!memoryData) {
        setError('Memory not found')
        setLoading(false)
        return
      }

      setMemory(memoryData)

      // Fetch associated recipe if exists
      if (memoryData.recipe_id) {
        const { data: recipeData } = await supabase
          .from('recipes')
          .select('id, title, cooks ( name )')
          .eq('id', memoryData.recipe_id)
          .maybeSingle()

        if (recipeData) {
          setRecipe(recipeData)
        }
      }
    } catch (err) {
      console.error('Error fetching memory:', err)
      setError('Could not load this memory')
    }
    setLoading(false)
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoaded = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration)
      } else if (memory?.duration_seconds) {
        setDuration(memory.duration_seconds)
      }
    }
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0)
    const handleEnded = () => { setPlaying(false); setCurrentTime(0) }

    audio.addEventListener('loadedmetadata', handleLoaded)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoaded)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [memory])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  const handleProgressClick = (e) => {
    if (!progressRef.current || !audioRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = ratio * duration
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-sienna animate-spin mx-auto mb-4" />
          <p className="text-sunday-brown font-body">Loading memory...</p>
        </div>
      </div>
    )
  }

  if (error || !memory) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <Heart className="w-12 h-12 text-stone/30 mx-auto mb-4" />
          <h1 className="text-2xl font-display text-cast-iron mb-2">Memory Not Found</h1>
          <p className="font-body text-sunday-brown">
            This audio memory may have been removed or the link is no longer valid.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Brand header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display text-cast-iron">
            Sunday Dinner Memories
          </h1>
          <div className="w-16 h-0.5 bg-sienna mx-auto mt-2" />
        </div>

        {/* Memory card */}
        <div className="bg-flour rounded-2xl shadow-lg border border-stone/10 overflow-hidden">
          {/* Header section */}
          <div className="bg-linen px-6 py-5 border-b border-stone/10">
            {memory.title && (
              <p className="font-handwritten text-2xl text-sunday-brown text-center mb-1">
                {memory.title}
              </p>
            )}
            {recipe && (
              <p className="font-body text-sm text-stone text-center">
                From the recipe for{' '}
                <span className="font-semibold text-sunday-brown">{recipe.title}</span>
                {recipe.cooks?.name && (
                  <span> by {recipe.cooks.name}</span>
                )}
              </p>
            )}
          </div>

          {/* Audio player */}
          <div className="px-6 py-8">
            <audio ref={audioRef} src={memory.audio_url} preload="metadata" />

            <div className="text-center mb-6">
              <button
                onClick={togglePlay}
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg
                  transition-all ${
                    playing
                      ? 'bg-sunday-brown text-flour'
                      : 'bg-sienna text-flour hover:bg-sienna/90'
                  }`}
              >
                {playing ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </button>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div
                ref={progressRef}
                onClick={handleProgressClick}
                className="h-3 bg-stone/15 rounded-full overflow-hidden cursor-pointer"
              >
                <div
                  className="h-full bg-sienna rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-xs font-body text-stone tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-linen/50 px-6 py-4 border-t border-stone/10 text-center">
            <p className="font-body text-xs text-stone">
              Preserved with Sunday Dinner Memories
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
