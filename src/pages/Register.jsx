import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { Loader2 } from 'lucide-react'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords don\'t match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      await signup(email, password)
      navigate('/join')
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Sunday Dinner Memories" className="h-16 mx-auto mb-6" />
          <h1 className="text-3xl font-display text-cast-iron mb-2">
            Join the family table
          </h1>
          <p className="text-sunday-brown font-body">
            Create your account and start preserving recipes
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-linen rounded-lg p-8 shadow-sm">
          {error && (
            <div className="bg-tomato/10 border border-tomato/30 text-tomato rounded-lg px-4 py-3 mb-6 text-sm font-body">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-body font-semibold text-cast-iron mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border border-stone/30 rounded-lg px-4 py-3 font-body text-cast-iron placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-body font-semibold text-cast-iron mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white border border-stone/30 rounded-lg px-4 py-3 font-body text-cast-iron placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna transition-colors"
              placeholder="At least 6 characters"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-body font-semibold text-cast-iron mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-white border border-stone/30 rounded-lg px-4 py-3 font-body text-cast-iron placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna transition-colors"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sienna text-flour rounded-lg px-6 py-3 font-body font-semibold shadow-md hover:bg-sienna/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sunday-brown font-body text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-sienna font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
