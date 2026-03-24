import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Loader2, KeyRound, Link2, Hash, Plus } from 'lucide-react'

export default function JoinFamily() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user, fetchMember } = useAuthStore()

  const [inviteCode, setInviteCode] = useState('')
  const [inviteLink, setInviteLink] = useState(token ? `${window.location.origin}/join/${token}` : '')
  const [familyCode, setFamilyCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState(token ? 'link' : null)

  const joinByInviteCode = async () => {
    setError('')
    setLoading(true)

    try {
      // Find invite
      const { data: invite, error: invErr } = await supabase
        .from('family_invites')
        .select('*')
        .eq('invite_token', inviteCode.trim())
        .eq('status', 'pending')
        .single()

      if (invErr || !invite) {
        setError('Invalid or expired invite code.')
        setLoading(false)
        return
      }

      // Add as member
      const { error: memErr } = await supabase.from('family_members').insert({
        family_id: invite.family_id,
        user_id: user.id,
        display_name: user.email?.split('@')[0] || 'New Member',
        role: invite.invited_role || 'active',
      })

      if (memErr) {
        setError(memErr.message)
        setLoading(false)
        return
      }

      // Mark invite used
      await supabase
        .from('family_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id)

      await fetchMember(user.id)
      navigate('/dashboard')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const joinByLink = async () => {
    // Extract token from pasted link
    const urlToken = inviteLink.includes('/join/')
      ? inviteLink.split('/join/').pop()?.trim()
      : inviteLink.trim()

    if (!urlToken) {
      setError('Paste a valid invite link.')
      return
    }

    setInviteCode(urlToken)
    await joinByInviteCode()
  }

  const joinByFamilyCode = async () => {
    setError('')
    setLoading(true)

    try {
      const { data: family, error: famErr } = await supabase
        .from('families')
        .select('*')
        .eq('invite_code', familyCode.trim().toUpperCase())
        .single()

      if (famErr || !family) {
        setError('No family found with that code.')
        setLoading(false)
        return
      }

      const { error: memErr } = await supabase.from('family_members').insert({
        family_id: family.id,
        user_id: user.id,
        display_name: user.email?.split('@')[0] || 'New Member',
        role: 'active',
      })

      if (memErr) {
        setError(memErr.message)
        setLoading(false)
        return
      }

      await fetchMember(user.id)
      navigate('/dashboard')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (method === 'code') joinByInviteCode()
    else if (method === 'link') joinByLink()
    else if (method === 'family-code') joinByFamilyCode()
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Sunday Dinner Memories" className="h-16 mx-auto mb-6" />
          <h1 className="text-3xl font-display text-cast-iron mb-2">
            Join a Family Kitchen
          </h1>
          <p className="text-sunday-brown font-body">
            Pick how you'd like to join
          </p>
        </div>

        {error && (
          <div className="bg-tomato/10 border border-tomato/30 text-tomato rounded-lg px-4 py-3 mb-6 text-sm font-body">
            {error}
          </div>
        )}

        {/* Method selection */}
        {!method && (
          <div className="space-y-3">
            <button
              onClick={() => setMethod('code')}
              className="w-full bg-linen rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow text-left flex items-center gap-4 border border-stone/10"
            >
              <KeyRound className="w-8 h-8 text-sienna" />
              <div>
                <p className="font-body font-semibold text-cast-iron">Enter Invite Token</p>
                <p className="text-sm text-sunday-brown font-body">Paste the invite token you received</p>
              </div>
            </button>

            <button
              onClick={() => setMethod('link')}
              className="w-full bg-linen rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow text-left flex items-center gap-4 border border-stone/10"
            >
              <Link2 className="w-8 h-8 text-herb" />
              <div>
                <p className="font-body font-semibold text-cast-iron">Paste Invite Link</p>
                <p className="text-sm text-sunday-brown font-body">Paste the full link you were sent</p>
              </div>
            </button>

            <button
              onClick={() => setMethod('family-code')}
              className="w-full bg-linen rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow text-left flex items-center gap-4 border border-stone/10"
            >
              <Hash className="w-8 h-8 text-honey" />
              <div>
                <p className="font-body font-semibold text-cast-iron">Enter Family Code</p>
                <p className="text-sm text-sunday-brown font-body">Use the family's public code</p>
              </div>
            </button>

            <div className="text-center pt-4">
              <Link
                to="/create-family"
                className="inline-flex items-center gap-2 bg-sienna text-flour rounded-lg px-6 py-3 font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create New Family
              </Link>
            </div>
          </div>
        )}

        {/* Join forms */}
        {method && (
          <form onSubmit={handleSubmit} className="bg-linen rounded-lg p-8 shadow-sm">
            {method === 'code' && (
              <div className="mb-6">
                <label className="block text-sm font-body font-semibold text-cast-iron mb-2">
                  Invite Token
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                  className="w-full bg-white border border-stone/30 rounded-lg px-4 py-3 font-body text-cast-iron placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna transition-colors"
                  placeholder="Paste your invite token"
                />
              </div>
            )}

            {method === 'link' && (
              <div className="mb-6">
                <label className="block text-sm font-body font-semibold text-cast-iron mb-2">
                  Invite Link
                </label>
                <input
                  type="text"
                  value={inviteLink}
                  onChange={(e) => setInviteLink(e.target.value)}
                  required
                  className="w-full bg-white border border-stone/30 rounded-lg px-4 py-3 font-body text-cast-iron placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna transition-colors"
                  placeholder="https://...../join/abc123"
                />
              </div>
            )}

            {method === 'family-code' && (
              <div className="mb-6">
                <label className="block text-sm font-body font-semibold text-cast-iron mb-2">
                  Family Code
                </label>
                <input
                  type="text"
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value)}
                  required
                  className="w-full bg-white border border-stone/30 rounded-lg px-4 py-3 font-body text-cast-iron placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna tracking-wider uppercase"
                  placeholder="e.g. ABC12345"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMethod(null)}
                className="flex-1 bg-white text-cast-iron rounded-lg px-6 py-3 font-body font-semibold border border-stone/20 hover:bg-cream transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-sienna text-flour rounded-lg px-6 py-3 font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Family'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
