import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import {
  LayoutDashboard,
  BookOpen,
  Search,
  ScanLine,
  PlusCircle,
  CalendarDays,
  ShoppingCart,
  Library,
  Settings,
  LogOut,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/recipes', label: 'My Recipes', icon: BookOpen },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/import', label: 'Import Recipe', icon: PlusCircle },
  { to: '/scan', label: 'Scan Recipe', icon: ScanLine },
  { to: '/meal-plan', label: 'Meal Plan', icon: CalendarDays },
  { to: '/shopping-list', label: 'Shopping List', icon: ShoppingCart },
  { to: '/cookbooks', label: 'Cookbooks', icon: Library },
  { to: '/family', label: 'Family Settings', icon: Settings },
]

export default function Sidebar() {
  const { currentFamily, currentMember, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const roleBadge = (role) => {
    const styles = {
      admin: 'bg-sienna/20 text-sienna',
      active: 'bg-herb/20 text-herb',
      viewer: 'bg-honey/20 text-honey',
    }
    return (
      <span className={`text-xs font-body font-semibold px-2 py-0.5 rounded-full ${styles[role] || styles.viewer}`}>
        {role}
      </span>
    )
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-cast-iron text-cream">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <img src="/logo.png" alt="Sunday Dinner Memories" className="w-full max-w-[180px] mx-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 font-body text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 border-l-4 border-sienna text-flour pl-5'
                  : 'text-cream/70 hover:text-cream hover:bg-white/5 border-l-4 border-transparent pl-5'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-white/10">
        {currentFamily && (
          <div className="mb-3">
            <p className="text-sm font-display text-cream truncate">{currentFamily.name}</p>
            {currentMember && (
              <div className="mt-1">{roleBadge(currentMember.role)}</div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-cream/50 hover:text-cream transition-colors font-body w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
