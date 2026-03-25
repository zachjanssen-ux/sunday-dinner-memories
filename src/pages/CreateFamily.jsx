import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Loader2, Copy, Check, ChefHat } from 'lucide-react'

export default function CreateFamily() {
  const { user, fetchMember } = useAuthStore()
  const navigate = useNavigate()

  const [familyName, setFamilyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)
  const [copied, setCopied] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const inviteCode = crypto.randomUUID().slice(0, 8).toUpperCase()
      const viewerToken = crypto.randomUUID()
      const displayName = user.email?.split('@')[0] || 'Admin'

      // Use server-side function to create family + member in one call
      // This bypasses RLS issues with INSERT → SELECT chains
      const { data, error: rpcErr } = await supabase.rpc('create_family_with_admin', {
        p_family_name: familyName.trim(),
        p_invite_code: inviteCode,
        p_viewer_share_token: viewerToken,
        p_user_id: user.id,
        p_display_name: displayName,
      })

      if (rpcErr) {
        console.error('Create family RPC error:', rpcErr)
        setError(`Failed to create family: ${rpcErr.message}`)
        setLoading(false)
        return
      }

      // Refresh auth state (non-blocking)
      try {
        await fetchMember(user.id)
      } catch (fetchErr) {
        console.error('fetchMember error (non-blocking):', fetchErr)
      }

      setCreated({
        name: familyName.trim(),
        inviteCode,
        viewerLink: `${window.location.origin}/view/${viewerToken}`,
      })
    } catch (err) {
      console.error('Create family exception:', err)
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text, label) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  // Success state
  if (created) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <ChefHat className="w-16 h-16 text-sienna mx-auto mb-6" />
          <h1 className="text-3xl font-display text-cast-iron mb-2">
            {created.name} is ready!
          </h1>
          <p className="text-sunday-brown font-body mb-8">
            Your family kitchen is set up. Share these with your family members.
          </p>

          <div className="bg-linen rounded-lg p-6 shadow-sm text-left space-y-5">
            {/* Invite Code */}
            <div>
              <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
                Invite Code (for active members)
              </label>
              <div className="flex items-center gap-2">
                <code className="bg-white border border-stone/20 rounded-lg px-4 py-2 font-body text-cast-iron text-lg tracking-wider flex-1">
                  {created.inviteCode}
                </code>
                <button
                  onClick={() => copyToClipboard(created.inviteCode, 'code')}
                  className="p-2 text-stone hover:text-sienna transition-colors"
                >
                  {copied === 'code' ? <Check className="w-5 h-5 text-herb" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Viewer Link */}
            <div>
              <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
                Viewer Share Link (read-only access)
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={created.viewerLink}
                  className="bg-white border border-stone/20 rounded-lg px-4 py-2 font-body text-cast-iron text-sm flex-1 truncate"
                />
                <button
                  onClick={() => copyToClipboard(created.viewerLink, 'link')}
                  className="p-2 text-stone hover:text-sienna transition-colors"
                >
                  {copied === 'link' ? <Check className="w-5 h-5 text-herb" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="mt-8 bg-sienna text-flour rounded-lg px-8 py-3 font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Sunday Dinner Memories" className="h-16 mx-auto mb-6" />
          <h1 className="text-3xl font-display text-cast-iron mb-2">
            Start Your Family Kitchen
          </h1>
          <p className="text-sunday-brown font-body">
            Give your family's recipe collection a name
          </p>
        </div>

        <form onSubmit={handleCreate} className="bg-linen rounded-lg p-8 shadow-sm">
          {error && (
            <div className="bg-tomato/10 border border-tomato/30 text-tomato rounded-lg px-4 py-3 mb-6 text-sm font-body">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-body font-semibold text-cast-iron mb-2">
              Family Name
            </label>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              required
              className="w-full bg-white border border-stone/30 rounded-lg px-4 py-3 font-body text-cast-iron placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna transition-colors"
              placeholder="e.g. The Johnson Kitchen"
            />
            <p className="text-xs text-stone font-body mt-2">
              This is what your family will see at the top of the app.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !familyName.trim()}
            className="w-full bg-sienna text-flour rounded-lg px-6 py-3 font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting the table...
              </>
            ) : (
              'Create Family Kitchen'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
