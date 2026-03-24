import { useState, useEffect } from 'react'
import useAuthStore from '../store/authStore'
import { supabase } from '../lib/supabase'
import Layout from '../components/layout/Layout'
import {
  Copy,
  RefreshCw,
  Users,
  Shield,
  Eye,
  ChefHat,
  Check,
  Loader2,
} from 'lucide-react'

export default function FamilyPage() {
  const { currentFamily, currentMember, fetchFamily } = useAuthStore()
  const [members, setMembers] = useState([])
  const [copied, setCopied] = useState('')
  const [loading, setLoading] = useState(false)

  const isAdmin = currentMember?.role === 'admin'

  useEffect(() => {
    if (currentFamily?.id) {
      loadMembers()
    }
  }, [currentFamily?.id])

  const loadMembers = async () => {
    const { data } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', currentFamily.id)
      .order('joined_at', { ascending: true })

    if (data) setMembers(data)
  }

  const copyToClipboard = async (text, label) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const regenerateInviteCode = async () => {
    if (!isAdmin) return
    setLoading(true)
    const newCode = crypto.randomUUID().slice(0, 8).toUpperCase()
    await supabase
      .from('families')
      .update({ invite_code: newCode })
      .eq('id', currentFamily.id)
    await fetchFamily(currentFamily.id)
    setLoading(false)
  }

  const regenerateViewerLink = async () => {
    if (!isAdmin) return
    setLoading(true)
    const newToken = crypto.randomUUID()
    await supabase
      .from('families')
      .update({ viewer_share_token: newToken })
      .eq('id', currentFamily.id)
    await fetchFamily(currentFamily.id)
    setLoading(false)
  }

  const updateMemberRole = async (memberId, newRole) => {
    if (!isAdmin) return
    await supabase
      .from('family_members')
      .update({ role: newRole })
      .eq('id', memberId)
    await loadMembers()
  }

  const activeCount = members.filter((m) => m.role === 'admin' || m.role === 'active').length
  const maxActive = currentFamily?.max_active_members || 5

  const roleBadge = (role) => {
    const config = {
      admin: { icon: Shield, color: 'bg-sienna/15 text-sienna', label: 'Admin' },
      active: { icon: ChefHat, color: 'bg-herb/15 text-herb', label: 'Active' },
      viewer: { icon: Eye, color: 'bg-honey/15 text-honey', label: 'Viewer' },
    }
    const { icon: Icon, color, label } = config[role] || config.viewer
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-body font-semibold px-2 py-0.5 rounded-full ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    )
  }

  if (!currentFamily) {
    return (
      <Layout>
        <div className="text-center mt-16">
          <p className="text-sunday-brown font-body">No family found. Join or create one first.</p>
        </div>
      </Layout>
    )
  }

  const viewerLink = currentFamily.viewer_share_token
    ? `${window.location.origin}/view/${currentFamily.viewer_share_token}`
    : null

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-display text-cast-iron mb-8">
          Family Settings
        </h1>

        {/* Family Info Card */}
        <div className="bg-linen rounded-lg p-6 shadow-sm mb-6">
          <h2 className="text-xl font-display text-cast-iron mb-4">{currentFamily.name}</h2>

          {/* Invite Code */}
          <div className="mb-4">
            <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
              Invite Code
            </label>
            <div className="flex items-center gap-2">
              <code className="bg-white border border-stone/20 rounded-lg px-4 py-2 font-body text-cast-iron text-lg tracking-wider flex-1">
                {currentFamily.invite_code || 'Not generated'}
              </code>
              <button
                onClick={() => copyToClipboard(currentFamily.invite_code, 'code')}
                className="p-2 text-stone hover:text-sienna transition-colors"
                title="Copy invite code"
              >
                {copied === 'code' ? <Check className="w-5 h-5 text-herb" /> : <Copy className="w-5 h-5" />}
              </button>
              {isAdmin && (
                <button
                  onClick={regenerateInviteCode}
                  disabled={loading}
                  className="p-2 text-stone hover:text-sienna transition-colors"
                  title="Regenerate code"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* Viewer Share Link */}
          <div className="mb-4">
            <label className="block text-sm font-body font-semibold text-cast-iron mb-1">
              Viewer Share Link
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={viewerLink || 'Not generated'}
                className="bg-white border border-stone/20 rounded-lg px-4 py-2 font-body text-cast-iron text-sm flex-1 truncate"
              />
              {viewerLink && (
                <button
                  onClick={() => copyToClipboard(viewerLink, 'link')}
                  className="p-2 text-stone hover:text-sienna transition-colors"
                  title="Copy viewer link"
                >
                  {copied === 'link' ? <Check className="w-5 h-5 text-herb" /> : <Copy className="w-5 h-5" />}
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={regenerateViewerLink}
                  disabled={loading}
                  className="p-2 text-stone hover:text-sienna transition-colors"
                  title="Regenerate viewer link"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Members Progress */}
        <div className="bg-linen rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display text-cast-iron">Active Members</h2>
            <span className="text-sm font-body text-sunday-brown">
              {activeCount} of {maxActive} slots used
            </span>
          </div>
          <div className="w-full bg-stone/20 rounded-full h-3">
            <div
              className="bg-sienna rounded-full h-3 transition-all"
              style={{ width: `${Math.min((activeCount / maxActive) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Members List */}
        <div className="bg-linen rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-cast-iron" />
            <h2 className="text-lg font-display text-cast-iron">Members</h2>
          </div>

          {members.length === 0 ? (
            <p className="text-sunday-brown font-body text-sm">No members yet.</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-stone/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-sienna/10 rounded-full flex items-center justify-center">
                      <span className="text-sienna font-display text-sm font-bold">
                        {(member.display_name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-body text-cast-iron text-sm font-semibold">
                        {member.display_name || 'Unnamed member'}
                      </p>
                      {roleBadge(member.role)}
                    </div>
                  </div>

                  {/* Admin controls */}
                  {isAdmin && member.id !== currentMember.id && member.role !== 'admin' && (
                    <div>
                      {member.role === 'viewer' && activeCount < maxActive && (
                        <button
                          onClick={() => updateMemberRole(member.id, 'active')}
                          className="text-xs font-body font-semibold text-herb hover:underline"
                        >
                          Promote to Active
                        </button>
                      )}
                      {member.role === 'active' && (
                        <button
                          onClick={() => updateMemberRole(member.id, 'viewer')}
                          className="text-xs font-body font-semibold text-honey hover:underline"
                        >
                          Demote to Viewer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
