import { useState, useRef, useEffect } from 'react'
import { Play, Pause, QrCode, X } from 'lucide-react'

function QRModal({ qrUrl, onClose }) {
  return (
    <div className="fixed inset-0 bg-cast-iron/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-flour rounded-xl p-6 max-w-sm w-full shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-cast-iron">Scan to Listen</h3>
          <button onClick={onClose} className="text-stone hover:text-sunday-brown">
            <X className="w-5 h-5" />
          </button>
        </div>
        <img src={qrUrl} alt="QR Code" className="w-48 h-48 mx-auto mb-3" />
        <p className="font-body text-sm text-stone">
          Scan this code to listen to this memory on any device
        </p>
      </div>
    </div>
  )
}

export default function AudioMemoryPlayer({ memory }) {
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(memory.duration_seconds || 0)
  const [currentTime, setCurrentTime] = useState(0)
  const [showQR, setShowQR] = useState(false)
  const audioRef = useRef(null)
  const progressRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoaded = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration)
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
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="h-2 bg-stone/20 rounded-full overflow-hidden cursor-pointer"
          >
            <div
              className="h-full bg-sienna rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <span className="text-xs font-body text-stone shrink-0 tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {memory.qr_code_url && (
          <button
            onClick={() => setShowQR(true)}
            className="w-8 h-8 rounded-lg bg-flour border border-stone/20 flex items-center justify-center
              text-stone hover:text-sienna hover:border-sienna/30 transition-colors shrink-0"
            title="Scan to listen"
          >
            <QrCode className="w-4 h-4" />
          </button>
        )}
      </div>

      {memory.recorded_by_name && (
        <p className="text-xs font-body text-stone mt-2">
          Recorded by {memory.recorded_by_name}
        </p>
      )}

      {showQR && <QRModal qrUrl={memory.qr_code_url} onClose={() => setShowQR(false)} />}
    </div>
  )
}
