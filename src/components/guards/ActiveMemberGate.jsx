import useAuthStore from '../../store/authStore'
import { ShieldAlert } from 'lucide-react'

export default function ActiveMemberGate({ children }) {
  const { currentMember } = useAuthStore()

  if (!currentMember || currentMember.role === 'viewer') {
    return (
      <div className="bg-linen rounded-lg p-8 text-center max-w-md mx-auto mt-12 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-honey mx-auto mb-4" />
        <h2 className="text-xl font-display text-cast-iron mb-2">
          Viewers Welcome — But This Needs a Cook
        </h2>
        <p className="text-sunday-brown font-body mb-6">
          You're browsing as a viewer. To add recipes, create cookbooks, and more,
          ask a family admin to upgrade your role.
        </p>
        <div className="inline-block bg-honey/20 text-honey font-body font-semibold px-4 py-2 rounded-lg text-sm">
          Current role: Viewer
        </div>
      </div>
    )
  }

  return children
}
