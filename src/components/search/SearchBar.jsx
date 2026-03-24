import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useSearchStore from '../../store/searchStore'
import useAuthStore from '../../store/authStore'
import { Search, Sparkles, X, Loader2 } from 'lucide-react'

export default function SearchBar({ inline = false, onSearch, autoFocus = false }) {
  const navigate = useNavigate()
  const { currentMember } = useAuthStore()
  const {
    searchQuery,
    searchMode,
    isSearching,
    searchHistory,
    setSearchMode,
    setSearchQuery,
  } = useSearchStore()

  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [showHistory, setShowHistory] = useState(false)
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)

  const isActive = currentMember?.role === 'active' || currentMember?.role === 'admin'

  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Close history dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowHistory(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!localQuery.trim()) return
    setShowHistory(false)

    if (onSearch) {
      onSearch(localQuery, searchMode)
    } else {
      setSearchQuery(localQuery)
      navigate(`/search?q=${encodeURIComponent(localQuery)}&mode=${searchMode}`)
    }
  }

  const handleHistoryClick = (q) => {
    setLocalQuery(q)
    setShowHistory(false)
    if (onSearch) {
      onSearch(q, searchMode)
    } else {
      setSearchQuery(q)
      navigate(`/search?q=${encodeURIComponent(q)}&mode=${searchMode}`)
    }
  }

  const handleClear = () => {
    setLocalQuery('')
    setSearchQuery('')
    if (inputRef.current) inputRef.current.focus()
  }

  const placeholder = searchMode === 'ai'
    ? "Ask anything... 'something with chicken for a cold night'"
    : 'Search recipes...'

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          {/* Search icon or AI sparkle */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {searchMode === 'ai' ? (
              <Sparkles className="w-4 h-4 text-honey" />
            ) : (
              <Search className="w-4 h-4 text-stone" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onFocus={() => {
              if (searchHistory.length > 0 && !localQuery) setShowHistory(true)
            }}
            placeholder={placeholder}
            className={`w-full border rounded-lg pl-9 pr-10 py-2.5 text-sm font-body text-sunday-brown
              focus:ring-2 focus:outline-none placeholder:text-stone/50 ${
                searchMode === 'ai'
                  ? 'bg-flour border-honey/40 focus:ring-honey/50'
                  : 'bg-flour border-stone/30 focus:ring-sienna/50'
              }`}
          />

          {/* Loading or clear button */}
          {isSearching ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-sienna animate-spin" />
            </div>
          ) : localQuery ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-stone hover:text-sunday-brown" />
            </button>
          ) : null}
        </div>

        {/* AI toggle — only for active members */}
        {isActive && (
          <button
            type="button"
            onClick={() => setSearchMode(searchMode === 'ai' ? 'basic' : 'ai')}
            title={searchMode === 'ai' ? 'Switch to keyword search' : 'Switch to AI search'}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-body font-semibold transition-colors shrink-0 ${
              searchMode === 'ai'
                ? 'bg-honey/15 text-honey border-honey/40 hover:bg-honey/25'
                : 'bg-flour text-stone border-stone/30 hover:text-sunday-brown hover:border-stone/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI</span>
          </button>
        )}
      </form>

      {/* Search history dropdown */}
      {showHistory && searchHistory.length > 0 && !localQuery && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-flour border border-stone/20 rounded-lg shadow-lg z-50 py-2">
          <p className="px-3 py-1 text-xs font-body text-stone uppercase tracking-wider">Recent</p>
          {searchHistory.map((h, i) => (
            <button
              key={i}
              onClick={() => handleHistoryClick(h)}
              className="w-full text-left px-3 py-2 text-sm font-body text-sunday-brown hover:bg-linen flex items-center gap-2"
            >
              <Search className="w-3.5 h-3.5 text-stone/50 shrink-0" />
              <span className="truncate">{h}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
