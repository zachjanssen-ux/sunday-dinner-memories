import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
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
            Welcome back to the kitchen
          </h1>
          <p className="text-sunday-brown font-body">
            Sign in to your family recipes
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

          <div className="mb-6">
            <label className="block text-sm font-body font-semibold text-cast-iron mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white border border-stone/30 rounded-lg px-4 py-3 font-body text-cast-iron placeholder:text-stone/50 focus:outline-none focus:ring-2 focus:ring-sienna/30 focus:border-sienna transition-colors"
              placeholder="Enter your password"
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
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sunday-brown font-body text-sm">
          New to the family?{' '}
          <Link to="/register" className="text-sienna font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
