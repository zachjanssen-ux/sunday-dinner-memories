import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'

function AudioPlayer({ memory }) {
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoaded = () => setDuration(audio.duration || 0)
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0)
    const handleEnded = () => setPlaying(false)

    audio.addEventListener('loadedmetadata', handleLoaded)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoaded)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-linen rounded-xl p-4 border border-stone/20">
      <audio ref={audioRef} src={memory.audio_url} preload="metadata" />

      {memory.title && (
        <p className="font-handwritten text-lg text-sunday-brown mb-2">
          {memory.title}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-sienna text-flour flex items-center justify-center
            hover:bg-sienna/90 transition-colors shadow-sm shrink-0"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="flex-1">
          <div className="h-2 bg-stone/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-sienna rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <span className="text-xs font-body text-stone shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}

export default function AudioMemories({ memories }) {
  if (!memories || memories.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="w-5 h-5 text-sienna" />
        <h3 className="font-display text-lg text-cast-iron">Audio Memories</h3>
      </div>
      <div className="space-y-3">
        {memories.map((memory) => (
          <AudioPlayer key={memory.id} memory={memory} />
        ))}
      </div>
    </div>
  )
}
