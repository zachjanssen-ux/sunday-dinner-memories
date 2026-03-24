import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useSearchStore from '../../store/searchStore'
import useAuthStore from '../../store/authStore'
import { Send, Sparkles, Loader2, Trash2 } from 'lucide-react'

export default function AISearchChat() {
  const navigate = useNavigate()
  const { currentFamily } = useAuthStore()
  const { chatMessages, chatLoading, sendChatMessage, clearChat } = useSearchStore()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || chatLoading) return

    sendChatMessage(input.trim(), currentFamily?.id)
    setInput('')
  }

  // Parse recipe links from assistant messages
  const renderMessage = (content) => {
    // Replace (ID: uuid) patterns with clickable links
    const parts = content.split(/(\(ID:\s*[a-f0-9-]{36}\))/gi)

    return parts.map((part, i) => {
      const idMatch = part.match(/\(ID:\s*([a-f0-9-]{36})\)/i)
      if (idMatch) {
        return (
          <button
            key={i}
            onClick={() => navigate(`/recipes/${idMatch[1]}`)}
            className="inline text-sienna hover:text-sienna/80 underline underline-offset-2 font-semibold"
          >
            View Recipe
          </button>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="bg-linen rounded-xl border border-stone/20 flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone/20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-honey" />
          <h3 className="font-display text-base text-cast-iron">Recipe Assistant</h3>
        </div>
        {chatMessages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-stone hover:text-sunday-brown transition-colors p-1"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-10 h-10 text-honey/40 mx-auto mb-3" />
            <p className="font-body text-sunday-brown/70 text-sm">
              Ask me anything about your family recipes.
            </p>
            <p className="font-body text-stone text-xs mt-1">
              "What can I make with leftover chicken?" or "Something easy for Sunday dinner"
            </p>
          </div>
        )}

        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-body ${
                msg.role === 'user'
                  ? 'bg-sienna text-flour rounded-br-md'
                  : 'bg-flour text-sunday-brown border border-stone/20 rounded-bl-md'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="whitespace-pre-wrap">{renderMessage(msg.content)}</div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {chatLoading && (
          <div className="flex justify-start">
            <div className="bg-flour text-sunday-brown border border-stone/20 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-body text-stone">
                <Loader2 className="w-4 h-4 text-sienna animate-spin" />
                Searching through your family recipes...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-stone/20">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your recipes..."
            disabled={chatLoading}
            className="flex-1 bg-flour border border-stone/30 rounded-lg px-4 py-2.5 text-sm font-body text-sunday-brown
              focus:ring-2 focus:ring-honey/50 focus:outline-none placeholder:text-stone/50
              disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || chatLoading}
            className="bg-sienna text-flour rounded-lg p-2.5 hover:bg-sienna/90 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
