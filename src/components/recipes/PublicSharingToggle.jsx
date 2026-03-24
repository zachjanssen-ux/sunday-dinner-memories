import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Globe, Lock, Copy, Check, Loader2 } from 'lucide-react'

function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function PublicSharingToggle({ recipe, onUpdate }) {
  const [toggling, setToggling] = useState(false)
  const [copied, setCopied] = useState(false)

  const isPublic = !!recipe.is_public

  const handleToggle = async () => {
    setToggling(true)

    const updates = { is_public: !isPublic }

    // When making public, generate a slug if none exists
    if (!isPublic && !recipe.public_slug) {
      updates.public_slug = toSlug(recipe.title)
    }

    const { error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', recipe.id)

    setToggling(false)

    if (error) {
      console.error('Error toggling public:', error)
      alert('Failed to update sharing. Please try again.')
      return
    }

    onUpdate({ ...recipe, ...updates })
  }

  const publicUrl = recipe.public_slug
    ? `sundaydinnermemories.com/r/${recipe.public_slug}`
    : null

  const handleCopy = async () => {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(`https://${publicUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = `https://${publicUrl}`
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-linen rounded-xl p-4 border border-stone/20 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isPublic ? (
            <Globe className="w-5 h-5 text-herb" />
          ) : (
            <Lock className="w-5 h-5 text-stone" />
          )}
          <div>
            <p className="text-sm font-body font-semibold text-sunday-brown">
              {isPublic ? 'Public Recipe' : 'Private Recipe'}
            </p>
            <p className="text-xs font-body text-stone">
              {isPublic
                ? 'Anyone with the link can view this recipe'
                : 'Only your family can see this recipe'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isPublic ? 'bg-herb' : 'bg-stone/30'
          }`}
        >
          {toggling ? (
            <Loader2 className="w-4 h-4 animate-spin absolute top-1 left-4 text-flour" />
          ) : (
            <span
              className={`absolute top-0.5 w-5 h-5 bg-flour rounded-full shadow transition-transform ${
                isPublic ? 'translate-x-6.5' : 'translate-x-0.5'
              }`}
            />
          )}
        </button>
      </div>

      {isPublic && publicUrl && (
        <div className="mt-3 pt-3 border-t border-stone/10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-body text-sunday-brown/70 truncate flex-1">
              {publicUrl}
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body font-semibold
                bg-flour border border-stone/20 text-sunday-brown hover:bg-cream transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-herb" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
