import useAuthStore from '../store/authStore'

export default function useRecipePermissions(recipe) {
  const { currentMember } = useAuthStore()

  const isContributor = recipe?.contributed_by === currentMember?.id
  const isAdmin = currentMember?.role === 'admin'
  const isActive = currentMember?.role === 'active' || isAdmin
  const isViewer = currentMember?.role === 'viewer'
  const isScanned = recipe?.source === 'scanned'

  return {
    canEdit: isContributor && isActive,
    canDelete: (isContributor || isAdmin) && isActive,
    canRescan: isContributor && isActive && isScanned,
    canFlag: isContributor && isActive && isScanned,
    canUpload: isActive,
    canWrite: isActive,
    isContributor,
    isAdmin,
    isViewer,
  }
}
