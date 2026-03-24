import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Eye, Loader2, BookOpen } from 'lucide-react'

export default function ViewerLanding() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user, fetchMember } = useAuthStore()

  const [family, setFamily] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFamily()
  }, [token])

  const loadFamily = async () => {
    const { data, error: err } = await supabase
      .from('families')
      .select('id, name')
      .eq('viewer_share_token', token)
      .single()

    if (err || !data) {
      setError('This viewer link is invalid or has expired.')
    } else {
      setFamily(data)
    }
    setLoading(false)
  }

  const joinAsViewer = async () => {
    if (!user) {
      // Store token and redirect to register
      sessionStorage.setItem('viewer_token', token)
      navigate('/register')
      return
    }

    setJoining(true)
    setError('')

    try {
      // Check if already a member
      const { data: existing } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', family.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        await fetchMember(user.id)
        navigate('/dashboard')
        return
      }

      const { error: memErr } = await supabase.from('family_members').insert({
        family_id: family.id,
        user_id: user.id,
        display_name: user.email?.split('@')[0] || 'Viewer',
        role: 'viewer',
      })

      if (memErr) {
        setError(memErr.message)
        setJoining(false)
        return
      }

      await fetchMember(user.id)
      navigate('/dashboard')
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sienna animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <img src="/logo.png" alt="Sunday Dinner Memories" className="h-16 mx-auto mb-8" />

        {error ? (
          <div className="bg-linen rounded-lg p-8 shadow-sm">
            <p className="text-tomato font-body mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="text-sienna font-body font-semibold hover:underline"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <div className="bg-linen rounded-lg p-8 shadow-sm">
            <Eye className="w-12 h-12 text-honey mx-auto mb-4" />
            <h1 className="text-2xl font-display text-cast-iron mb-2">
              You're invited to browse
            </h1>
            <h2 className="text-xl font-handwritten text-sienna mb-4">
              {family?.name}'s Recipes
            </h2>
            <p className="text-sunday-brown font-body mb-6 text-sm">
              As a viewer, you can browse and enjoy the family's recipe collection.
              You won't be able to add or edit recipes.
            </p>

            <div className="inline-flex items-center gap-2 bg-honey/15 text-honey font-body font-semibold px-4 py-2 rounded-full text-sm mb-6">
              <Eye className="w-4 h-4" />
              Read-only access
            </div>

            <button
              onClick={joinAsViewer}
              disabled={joining}
              className="w-full bg-sienna text-flour rounded-lg px-6 py-3 font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5" />
                  {user ? 'Browse Recipes' : 'Create Account to Browse'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
