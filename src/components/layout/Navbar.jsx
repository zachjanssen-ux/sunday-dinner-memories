import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import {
  Menu,
  X,
  LayoutDashboard,
  BookOpen,
  ScanLine,
  CalendarDays,
  Library,
  Settings,
  LogOut,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/recipes', label: 'My Recipes', icon: BookOpen },
  { to: '/scan', label: 'Scan Recipe', icon: ScanLine },
  { to: '/meal-plan', label: 'Meal Plan', icon: CalendarDays },
  { to: '/cookbooks', label: 'Cookbooks', icon: Library },
  { to: '/family', label: 'Family Settings', icon: Settings },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    setOpen(false)
  }

  return (
    <header className="lg:hidden bg-cast-iron text-cream sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setOpen(!open)}
          className="p-1"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <img src="/logo.png" alt="Sunday Dinner Memories" className="h-8" />
        <div className="w-8" /> {/* Spacer for centering */}
      </div>

      {/* Slide-down menu */}
      {open && (
        <nav className="border-t border-white/10 pb-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 font-body text-sm transition-colors ${
                  isActive
                    ? 'bg-white/10 text-flour border-l-4 border-sienna pl-5'
                    : 'text-cream/70 hover:text-cream border-l-4 border-transparent pl-5'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-cream/50 hover:text-cream transition-colors font-body px-6 py-3 w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </nav>
      )}
    </header>
  )
}
