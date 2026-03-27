import { useState, useRef, useCallback } from 'react'
import { Play, Pause, GripVertical, Trash2, PlayCircle } from 'lucide-react'
import AudioMemoryPlayer from './AudioMemoryPlayer'
import { remove as directDelete, update as directUpdate } from '../../lib/supabaseDirectFetch'
import toast from 'react-hot-toast'

export default function AudioMemoryList({ memories, canEdit, onRefresh }) {
  const [playAllActive, setPlayAllActive] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [reordering, setReordering] = useState(false)
  const [orderedMemories, setOrderedMemories] = useState(memories)
  const audioRef = useRef(null)
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  // Keep orderedMemories in sync with props
  if (memories !== orderedMemories && !reordering) {
    setOrderedMemories(memories)
  }

  // Play All — sequential playback
  const startPlayAll = () => {
    if (orderedMemories.length === 0) return
    setPlayAllActive(true)
    setCurrentIndex(0)
    playMemory(0)
  }

  const stopPlayAll = () => {
    setPlayAllActive(false)
    setCurrentIndex(-1)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }

  const playMemory = (idx) => {
    if (idx >= orderedMemories.length) {
      // Finished all
      stopPlayAll()
      toast.success('All stories played')
      return
    }

    const memory = orderedMemories[idx]
    if (!memory.audio_url) {
      // Skip to next
      playMemory(idx + 1)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(memory.audio_url)
    audioRef.current = audio
    setCurrentIndex(idx)

    audio.onended = () => {
      playMemory(idx + 1)
    }

    audio.onerror = () => {
      toast.error(`Could not play "${memory.title || 'Untitled'}"`)
      playMemory(idx + 1)
    }

    audio.play().catch(() => {
      toast.error('Playback failed — try tapping a player directly')
      stopPlayAll()
    })
  }

  // Drag to reorder
  const handleDragStart = (idx) => {
    dragItem.current = idx
    setReordering(true)
  }

  const handleDragOver = (e, idx) => {
    e.preventDefault()
    dragOverItem.current = idx
  }

  const handleDrop = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    const items = [...orderedMemories]
    const dragged = items.splice(dragItem.current, 1)[0]
    items.splice(dragOverItem.current, 0, dragged)
    setOrderedMemories(items)
    dragItem.current = null
    dragOverItem.current = null
    setReordering(false)

    // Persist order — update sort_order for each memory
    // We don't have a sort_order column, so we use created_at ordering
    // For now, just keep the visual order in state
    // TODO: Add sort_order column to audio_memories if needed
  }

  const handleDelete = async (memoryId, title) => {
    if (!confirm(`Delete "${title || 'this memory'}"? This cannot be undone.`)) return
    try {
      await directDelete('audio_memories', { 'id': `eq.${memoryId}` })
      toast.success('Memory deleted')
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Failed to delete memory')
    }
  }

  const totalDuration = orderedMemories.reduce((sum, m) => sum + (m.duration_seconds || 0), 0)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (orderedMemories.length === 0) return null

  return (
    <div>
      {/* Play All header */}
      {orderedMemories.length > 1 && (
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={playAllActive ? stopPlayAll : startPlayAll}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-body font-semibold text-sm transition-colors ${
              playAllActive
                ? 'bg-tomato text-flour hover:bg-tomato/90'
                : 'bg-cast-iron text-flour hover:bg-cast-iron/90'
            }`}
          >
            {playAllActive ? (
              <>
                <Pause className="w-4 h-4" />
                Stop All
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                Play All ({orderedMemories.length} stories · {formatTime(totalDuration)})
              </>
            )}
          </button>
        </div>
      )}

      {/* Memory list */}
      <div className="space-y-3">
        {orderedMemories.map((memory, idx) => (
          <div
            key={memory.id}
            draggable={canEdit && orderedMemories.length > 1}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={handleDrop}
            className={`relative ${
              playAllActive && currentIndex === idx ? 'ring-2 ring-sienna rounded-xl' : ''
            }`}
          >
            {/* Chapter number + drag handle */}
            <div className="flex items-start gap-2">
              {canEdit && orderedMemories.length > 1 && (
                <div className="pt-4 cursor-grab active:cursor-grabbing text-stone/40 hover:text-stone">
                  <GripVertical className="w-4 h-4" />
                </div>
              )}

              <div className="flex-1">
                {/* Chapter label */}
                {orderedMemories.length > 1 && (
                  <p className="text-xs font-body text-stone mb-1 ml-1">
                    Part {idx + 1} of {orderedMemories.length}
                    {playAllActive && currentIndex === idx && (
                      <span className="text-sienna font-semibold ml-2">▶ Now Playing</span>
                    )}
                  </p>
                )}
                <AudioMemoryPlayer memory={memory} />
              </div>

              {/* Delete button */}
              {canEdit && (
                <button
                  onClick={() => handleDelete(memory.id, memory.title)}
                  className="pt-4 text-stone/30 hover:text-tomato transition-colors"
                  title="Delete this memory"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
