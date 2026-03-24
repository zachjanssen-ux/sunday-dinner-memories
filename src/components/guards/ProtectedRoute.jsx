import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-sienna animate-spin mx-auto mb-4" />
          <p className="text-sunday-brown font-body">Setting the table...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
