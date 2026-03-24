import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Search,
  ScanLine,
  Settings,
} from 'lucide-react'

const tabs = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/recipes', label: 'Recipes', icon: BookOpen },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/scan', label: 'Scan', icon: ScanLine },
  { to: '/family', label: 'Family', icon: Settings },
]

export default function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-flour border-t border-stone/20 z-50 safe-area-pb" aria-label="Mobile navigation">
      <div className="flex justify-around items-center py-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-body transition-colors ${
                isActive ? 'text-sienna' : 'text-stone hover:text-sunday-brown'
              }`
            }
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
